import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { storage } from '../storage';
import OpenAI from 'openai';
import { createError, ErrorType } from './errorHandler';
import { insertTimelineItemSchema } from '@shared/schema';

// Utilizziamo promisify per rendere le funzioni di callback async/await
const execPromise = util.promisify(exec);
const tempDir = path.join(process.cwd(), 'temp');

// Assicuriamoci che la directory temporanea esista
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Inizializza OpenAI con la chiave API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Estrae un singolo frame dal video a un determinato timestamp
 * Per ottimizzare i costi, estrarremo solo alcuni frame chiave
 */
async function extractFrame(videoPath: string, timestamp: number): Promise<string> {
  const outputPath = path.join(tempDir, `frame_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`);
  
  try {
    await execPromise(`ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}" -y`);
    return outputPath;
  } catch (error) {
    console.error('Errore nell\'estrazione del frame:', error);
    throw createError(
      ErrorType.SERVER_ERROR,
      'Impossibile estrarre frame dal video',
      undefined,
      'videoSegmentation.extractFrame'
    );
  }
}

/**
 * Campiona frame dal video a intervalli regolari
 * Utilizziamo un approccio adattivo che riduce il campionamento per video lunghi
 */
async function sampleFrames(videoPath: string, duration: number): Promise<string[]> {
  // Strategia di campionamento adattiva: 
  // - Video brevi (<30s): ogni 2 secondi
  // - Video medi (30s-3min): ogni 5-10 secondi
  // - Video lunghi (>3min): ogni 15-30 secondi
  
  let sampleInterval: number;
  
  if (duration <= 30) {
    sampleInterval = 2; // Secondi
  } else if (duration <= 180) {
    sampleInterval = Math.max(5, Math.floor(duration / 20)); // Circa 20 frame totali
  } else {
    sampleInterval = Math.max(15, Math.floor(duration / 30)); // Circa 30 frame totali
  }
  
  const frameCount = Math.min(30, Math.ceil(duration / sampleInterval)); // Limita a max 30 frame
  const frames: string[] = [];
  
  for (let i = 0; i < frameCount; i++) {
    const timestamp = Math.min(i * sampleInterval, duration - 0.5); // Evita di superare la durata
    const framePath = await extractFrame(videoPath, timestamp);
    frames.push(framePath);
    
    // Limita a 5 frame se il video è molto lungo, per ridurre ulteriormente i costi API
    if (duration > 600 && i >= 4) break;
  }
  
  return frames;
}

/**
 * Converte un'immagine in base64 per l'API OpenAI
 */
function imageToBase64(imagePath: string): string {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

/**
 * Analizza i frame campionati utilizzando l'API OpenAI Vision per identificare i cambi di scena
 * e i contenuti di ogni segmento
 */
async function analyzeFramesContent(
  frames: string[], 
  videoPath: string,
  duration: number
): Promise<{
  segments: {startTime: number, endTime: number, description: string}[],
  script?: string
}> {
  try {
    // Prepara le immagini in formato base64 per l'API
    const imageContents = frames.map((framePath, index) => {
      const timestamp = Math.floor((index / frames.length) * duration);
      return {
        type: "image_url" as const,
        image_url: {
          url: `data:image/jpeg;base64,${imageToBase64(framePath)}`,
        }
      };
    });
    
    // Crea il prompt per OpenAI, chiedendo di analizzare i cambi di scena
    const messages = [
      {
        role: "system" as const,
        content: "Sei un assistente esperto nell'analisi video. Analizza i frame forniti e identifica i cambi di scena significativi."
      },
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: "Analizza questi frame estratti da un video e identifica i segmenti logici in base ai cambi di contenuto. Per ogni segmento, fornisci un timestamp approssimativo di inizio e fine e una breve descrizione del contenuto. Restituisci SOLO un oggetto JSON con il seguente formato, senza testo aggiuntivo:\n{\"segments\": [{\"startTime\": number in seconds, \"endTime\": number in seconds, \"description\": \"string\"}], \"script\": \"trascrizione approssimativa del contenuto\"}. Limita a massimo 8 segmenti, accorpando quelli simili. Il video ha una durata totale di " + duration + " secondi."
          },
          ...imageContents
        ],
      },
    ];
    
    // Chiamata all'API OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // il modello più recente di OpenAI che supporta l'analisi di immagini
      messages: messages,
      max_tokens: 1000,
      temperature: 0.2, // Ridotta per avere risultati più deterministici
      response_format: { type: "json_object" }, // Forza l'output in formato JSON
    });
    
    // Parsing del risultato JSON
    const result = JSON.parse(response.choices[0].message.content || '{"segments":[]}');
    
    // Pulizia dei file temporanei
    frames.forEach(frame => {
      try {
        fs.unlinkSync(frame);
      } catch (e) {
        console.warn('Impossibile eliminare il frame temporaneo:', frame);
      }
    });
    
    return result;
  } catch (error) {
    console.error('Errore nell\'analisi dei frame:', error);
    
    // Pulizia dei file temporanei anche in caso di errore
    frames.forEach(frame => {
      try {
        fs.unlinkSync(frame);
      } catch (e) {
        // Ignora errori durante la pulizia
      }
    });
    
    throw createError(
      ErrorType.EXTERNAL_API,
      'Errore durante l\'analisi del contenuto video con AI',
      undefined,
      'videoSegmentation.analyzeFramesContent'
    );
  }
}

/**
 * Genera sottotitoli per un segmento audio utilizzando OpenAI Whisper
 */
async function generateSubtitlesForSegment(
  videoPath: string, 
  startTime: number, 
  endTime: number
): Promise<{text: string, timestamps?: {start: number, end: number, text: string}[]}> {
  try {
    // Estraiamo l'audio del segmento specifico per ridurre i costi di trascrizione
    const segmentPath = path.join(tempDir, `segment_${Date.now()}_${Math.floor(Math.random() * 1000)}.mp3`);
    
    await execPromise(`ffmpeg -ss ${startTime} -to ${endTime} -i "${videoPath}" -q:a 0 -map a "${segmentPath}" -y`);
    
    // Utilizziamo l'API di trascrizione di OpenAI
    const audioFile = fs.createReadStream(segmentPath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json", // Include timestamp dettagliati
      timestamp_granularities: ["segment"],
    });
    
    // Pulizia del file temporaneo
    try {
      fs.unlinkSync(segmentPath);
    } catch (e) {
      console.warn('Impossibile eliminare il segmento audio temporaneo:', segmentPath);
    }
    
    // Adatta i timestamp in base al tempo di inizio del segmento
    const adjustedTimestamps = transcription.segments?.map(segment => ({
      start: segment.start + startTime,
      end: segment.end + startTime,
      text: segment.text
    }));
    
    return {
      text: transcription.text,
      timestamps: adjustedTimestamps
    };
  } catch (error) {
    console.error('Errore nella generazione dei sottotitoli:', error);
    throw createError(
      ErrorType.EXTERNAL_API,
      'Errore durante la generazione dei sottotitoli con AI',
      undefined,
      'videoSegmentation.generateSubtitlesForSegment'
    );
  }
}

/**
 * Funzione principale che segmenta un video e genera sottotitoli
 */
export async function segmentVideoAndGenerateSubtitles(
  videoUrl: string,
  projectId: number,
  userId: string
): Promise<{
  success: boolean,
  segments: any[],
  subtitles: any[]
}> {
  // Verifica che il progetto appartenga all'utente
  const project = await storage.getProject(projectId);
  if (!project || project.userId !== userId) {
    throw createError(
      ErrorType.AUTHORIZATION,
      'Non sei autorizzato ad accedere a questo progetto',
      undefined,
      'videoSegmentation.segmentVideoAndGenerateSubtitles'
    );
  }
  
  // Se l'URL è remoto, scarichiamo il video localmente
  let localVideoPath: string;
  let isTemporaryFile = false;
  
  if (videoUrl.startsWith('http')) {
    // Scarica il video in una posizione temporanea
    localVideoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
    isTemporaryFile = true;
    
    try {
      await execPromise(`curl -L "${videoUrl}" -o "${localVideoPath}"`);
    } catch (error) {
      console.error('Errore durante il download del video:', error);
      throw createError(
        ErrorType.SERVER_ERROR,
        'Impossibile scaricare il video dall\'URL fornito',
        undefined,
        'videoSegmentation.segmentVideoAndGenerateSubtitles'
      );
    }
  } else {
    // Usa il percorso locale direttamente
    localVideoPath = videoUrl;
  }
  
  try {
    // Ottieni la durata del video
    const { stdout } = await execPromise(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localVideoPath}"`
    );
    const duration = parseFloat(stdout.trim());
    
    if (isNaN(duration)) {
      throw new Error('Impossibile determinare la durata del video');
    }
    
    // Campiona i frame dal video
    const frames = await sampleFrames(localVideoPath, duration);
    
    // Analizza i frame per identificare i segmenti
    const analysisResult = await analyzeFramesContent(frames, localVideoPath, duration);
    
    // Array per memorizzare i segmenti e i sottotitoli creati
    const createdSegments: any[] = [];
    const createdSubtitles: any[] = [];
    
    // Per ogni segmento identificato, crea una timeline item e genera sottotitoli
    for (const segment of analysisResult.segments) {
      // Crea un asset per il segmento video
      const segmentAsset = await storage.createAsset({
        userId,
        name: `Segmento: ${segment.description.substring(0, 30)}...`,
        type: 'video',
        url: videoUrl,
        duration: (segment.endTime - segment.startTime) * 1000, // Convertito in millisecondi
      });
      
      // Crea un timeline item per il segmento
      const timelineItem = await storage.createTimelineItem({
        projectId,
        assetId: segmentAsset.id,
        type: 'video',
        track: 1, // Track number
        startTime: 0, // Inizia all'inizio della timeline
        endTime: Math.round((segment.endTime - segment.startTime) * 1000), // Durata in millisecondi
        properties: JSON.stringify({
          description: segment.description,
          originalStart: segment.startTime,
          originalEnd: segment.endTime,
          trimStart: Math.round(segment.startTime * 1000), // Punto di inizio nel video originale
          trimEnd: Math.round(segment.endTime * 1000) // Punto di fine nel video originale
        })
      });
      
      createdSegments.push(timelineItem);
      
      // Genera sottotitoli per questo segmento
      try {
        const subtitles = await generateSubtitlesForSegment(
          localVideoPath,
          segment.startTime,
          segment.endTime
        );
        
        // Crea un asset per i sottotitoli
        const subtitleAsset = await storage.createAsset({
          userId,
          name: `Sottotitoli: ${segment.description.substring(0, 30)}...`,
          type: 'text',
          url: '', // I sottotitoli sono memorizzati nelle proprietà
          duration: (segment.endTime - segment.startTime) * 1000, // Convertito in millisecondi
        });
        
        // Crea un timeline item per i sottotitoli
        const subtitleItem = await storage.createTimelineItem({
          projectId,
          assetId: subtitleAsset.id,
          type: 'text',
          track: 2, // Traccia per il testo (differente dalla traccia video)
          startTime: 0, // Allineato con il segmento video
          endTime: Math.round((segment.endTime - segment.startTime) * 1000), // Durata in millisecondi
          properties: JSON.stringify({
            text: subtitles.text,
            timestamps: subtitles.timestamps,
            style: {
              fontSize: '18px',
              fontFamily: 'Arial, sans-serif',
              color: '#FFFFFF',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              position: 'bottom'
            }
          })
        });
        
        createdSubtitles.push(subtitleItem);
      } catch (error) {
        console.error(`Errore nella generazione dei sottotitoli per il segmento ${segment.startTime}-${segment.endTime}:`, error);
        // Continuiamo con il prossimo segmento invece di interrompere tutto il processo
      }
    }
    
    // Pulizia del file video temporaneo se necessario
    if (isTemporaryFile) {
      try {
        fs.unlinkSync(localVideoPath);
      } catch (e) {
        console.warn('Impossibile eliminare il video temporaneo:', localVideoPath);
      }
    }
    
    return {
      success: true,
      segments: createdSegments,
      subtitles: createdSubtitles
    };
  } catch (error) {
    console.error('Errore nella segmentazione del video:', error);
    
    // Pulizia del file video temporaneo in caso di errore
    if (isTemporaryFile) {
      try {
        fs.unlinkSync(localVideoPath);
      } catch (e) {
        // Ignora errori durante la pulizia
      }
    }
    
    throw createError(
      ErrorType.SERVER_ERROR,
      'Errore durante la segmentazione del video e la generazione dei sottotitoli',
      undefined,
      'videoSegmentation.segmentVideoAndGenerateSubtitles'
    );
  }
}