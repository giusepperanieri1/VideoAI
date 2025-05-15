import { Router } from 'express';
import { segmentVideoAndGenerateSubtitles } from '../services/videoSegmentation';
import { isAuthenticated } from '../replitAuth';
import { z } from 'zod';
import { updateRenderStatus, notifyUser } from './video-generation';
import { storage } from '../storage';
import { insertAiVideoRequestSchema } from '@shared/schema';

const router = Router();

// Schema di validazione per la richiesta
const segmentationRequestSchema = z.object({
  videoUrl: z.string().url('URL video non valido'),
  projectId: z.number().int().positive('ID progetto non valido'),
});

/**
 * Endpoint per richiedere la segmentazione automatica di un video
 */
router.post('/segment', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    
    // Valida i dati della richiesta
    const { videoUrl, projectId } = segmentationRequestSchema.parse(req.body);
    
    // Crea una richiesta di segmentazione
    const request = await storage.createAiVideoRequest({
      userId,
      prompt: `Segmentazione automatica: ${videoUrl}`,
      status: 'queued'
    });
    
    // Invia risposta immediata
    res.status(202).json({
      message: 'Richiesta di segmentazione accettata',
      requestId: request.id
    });
    
    // Notifica utente dell'inizio elaborazione
    notifyUser(userId, {
      type: 'segmentation_update',
      payload: {
        requestId: request.id,
        status: 'processing',
        progress: 0,
        message: 'Analisi video in corso...'
      }
    });
    
    // Esegui la segmentazione in background
    processSegmentation(request.id, videoUrl, projectId, userId).catch(error => {
      console.error('Errore durante la segmentazione:', error);
      
      // Notifica dell'errore
      notifyUser(userId, {
        type: 'segmentation_update',
        payload: {
          requestId: request.id,
          status: 'failed',
          progress: 0,
          message: 'Errore durante la segmentazione',
          error: error.message || 'Si è verificato un errore imprevisto'
        }
      });
    });
    
  } catch (error: any) {
    console.error('Errore nella richiesta di segmentazione:', error);
    res.status(400).json({ 
      message: 'Errore nella richiesta di segmentazione', 
      error: error.message || 'Errore sconosciuto'
    });
  }
});

/**
 * Esegue il processo di segmentazione in background
 */
async function processSegmentation(
  requestId: number,
  videoUrl: string,
  projectId: number,
  userId: string
) {
  try {
    // Aggiorna lo stato a "in elaborazione"
    await updateRenderStatus(requestId, 'processing', 10);
    
    // Esegui la segmentazione
    const result = await segmentVideoAndGenerateSubtitles(videoUrl, projectId, userId);
    
    if (result.success) {
      // Notifica l'utente del completamento
      notifyUser(userId, {
        type: 'segmentation_update',
        payload: {
          requestId,
          status: 'completed',
          progress: 100,
          message: 'Segmentazione completata con successo',
          data: {
            segments: result.segments.length,
            subtitles: result.subtitles.length
          }
        }
      });
      
      // Aggiorna lo stato nel database
      await updateRenderStatus(requestId, 'completed', 100);
    } else {
      throw new Error('Segmentazione fallita per motivi sconosciuti');
    }
  } catch (error: any) {
    console.error('Errore durante il processo di segmentazione:', error);
    
    // Aggiorna lo stato a "fallito"
    await updateRenderStatus(requestId, 'failed', 0);
    
    // Rilancia l'errore per la gestione nel chiamante
    throw error;
  }
}

/**
 * Endpoint per ottenere lo stato di una richiesta di segmentazione
 */
router.get('/segment/:id/status', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const requestId = parseInt(req.params.id);
    
    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'ID richiesta non valido' });
    }
    
    // Ottieni lo stato della richiesta
    const request = await storage.getAiVideoRequest(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Richiesta non trovata' });
    }
    
    // Verifica che la richiesta appartenga all'utente
    if (request.userId !== userId) {
      return res.status(403).json({ message: 'Non sei autorizzato ad accedere a questa richiesta' });
    }
    
    // Formatta la risposta
    res.json({
      id: request.id,
      status: request.status,
      progress: request.progress,
      message: request.message,
      createdAt: request.createdAt,
      completedAt: request.completedAt,
      error: request.errorMessage,
      data: request.resultData ? JSON.parse(request.resultData) : null
    });
    
  } catch (error: any) {
    console.error('Errore nella richiesta di stato:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero dello stato della richiesta', 
      error: error.message || 'Errore sconosciuto'
    });
  }
});

export default router;