import { Router } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { generateVideo, generateVoiceOver, generateScript, generateCaptions } from "../openai";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { WebSocket } from "ws";

// Validazione dei dati della richiesta
const videoRequestSchema = z.object({
  prompt: z.string().min(10, "Prompt deve essere di almeno 10 caratteri"),
  voiceStyle: z.string().optional().default("default"),
  videoDescription: z.string().optional(),
  videoLength: z.number().optional().default(15),
  projectId: z.number().optional(),
  title: z.string().optional()
});

// Tipo per i messaggi WebSocket
interface WebSocketMessage {
  type: string;
  payload: any;
}

// Mappa per tenere traccia delle connessioni attive per utente
const userConnections = new Map<string, Set<WebSocket>>();

export function initWebSocketConnections(wss: any) {
  wss.on('connection', (ws: WebSocket) => {
    let userId: string = "";
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message) as WebSocketMessage;
        
        // Autenticazione della connessione WebSocket
        if (data.type === 'auth') {
          const userIdFromPayload = data.payload.userId;
          
          if (typeof userIdFromPayload !== 'string') {
            ws.send(JSON.stringify({ 
              type: 'error', 
              payload: { message: 'ID utente non valido' } 
            }));
            return;
          }
          
          userId = userIdFromPayload;
          
          // Verifica se l'utente esiste
          const user = await storage.getUser(userId);
          if (!user) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              payload: { message: 'Utente non autorizzato' } 
            }));
            return;
          }
          
          // Aggiungi connessione alla mappa utenti
          if (!userConnections.has(userId)) {
            userConnections.set(userId, new Set());
          }
          
          const connections = userConnections.get(userId);
          if (connections) {
            connections.add(ws);
          }
          
          // Invia conferma
          ws.send(JSON.stringify({ 
            type: 'auth_success', 
            payload: { userId } 
          }));
        }
      } catch (error) {
        console.error('Errore elaborazione messaggio WebSocket:', error);
      }
    });
    
    // Gestione disconnessione
    ws.on('close', () => {
      if (userId !== "" && userConnections.has(userId)) {
        const connections = userConnections.get(userId);
        if (connections) {
          connections.delete(ws);
          
          // Se non ci sono più connessioni per l'utente, rimuovi l'entry
          if (connections.size === 0) {
            userConnections.delete(userId);
          }
        }
      }
    });
  });
}

// Funzione di utilità per inviare notifiche a un utente specifico
export function notifyUser(userId: string, data: WebSocketMessage) {
  if (userConnections.has(userId)) {
    userConnections.get(userId)?.forEach(ws => {
      if ((ws as any).readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }
}

// Funzione per aggiornare lo stato di un rendering video e inviare notifiche
export async function updateRenderStatus(
  requestId: number, 
  status: string, 
  progress: number = 0, 
  result?: { url?: string, thumbnail?: string, error?: string }
) {
  try {
    // Aggiorna lo stato nella base dati
    const request = await storage.getAiVideoRequest(requestId);
    if (!request) return false;
    
    const updateData: any = {
      status,
      progress,
      completedAt: ["completed", "failed"].includes(status) ? new Date() : undefined,
      resultUrl: result?.url,
      thumbnailUrl: result?.thumbnail,
      errorMessage: result?.error
    };
    
    const updatedRequest = await storage.updateAiVideoRequest(requestId, updateData);
    if (!updatedRequest) return false;
    
    // Invia notifica all'utente via WebSocket
    notifyUser(updatedRequest.userId.toString(), {
      type: "render_update",
      payload: {
        requestId,
        status,
        progress,
        resultUrl: result?.url,
        thumbnailUrl: result?.thumbnail,
        errorMessage: result?.error
      }
    });
    
    return true;
  } catch (error) {
    console.error("Errore aggiornamento stato rendering:", error);
    return false;
  }
}

export function setupVideoRoutes() {
  const router = Router();
  
  // Endpoint per avviare la generazione asincrona di un video
  router.post("/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validazione dati
      const validationResult = videoRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dati della richiesta non validi", 
          errors: validationResult.error.format() 
        });
      }
      
      const { 
        prompt, 
        voiceStyle, 
        videoDescription, 
        videoLength, 
        projectId,
        title
      } = validationResult.data;
      
      // Crea richiesta di generazione video nel database per tracciamento
      const videoRequest = await storage.createAiVideoRequest({
        userId,
        prompt,
        voiceStyle,
        description: videoDescription || prompt,
        requestedLength: videoLength,
        projectId: projectId || null,
        title: title || prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
        status: "queued",
        progress: 0,
        createdAt: new Date(),
      });
      
      // Invia notifica iniziale di richiesta in coda
      notifyUser(userId, {
        type: "render_update",
        payload: {
          requestId: videoRequest.id,
          status: "queued",
          progress: 0
        }
      });
      
      // Rispondi subito al client con l'ID della richiesta
      res.json({ 
        requestId: videoRequest.id,
        message: "Richiesta di generazione video in coda" 
      });
      
      // Esegui il processo di rendering in modo asincrono
      (async () => {
        try {
          // Fase 1: Inizializzazione
          await updateRenderStatus(videoRequest.id, "processing", 10);
          
          // Fase 2: Generazione script
          await updateRenderStatus(videoRequest.id, "processing", 20);
          const scriptResult = await generateScript(prompt, videoLength);
          
          // Fase 3: Generazione voce
          await updateRenderStatus(videoRequest.id, "processing", 40);
          const voiceResult = await generateVoiceOver(scriptResult.script, voiceStyle);
          
          // Fase 4: Generazione sottotitoli
          await updateRenderStatus(videoRequest.id, "processing", 60);
          const captionsResult = await generateCaptions(voiceResult.audioUrl);
          
          // Fase 5: Generazione video finale
          await updateRenderStatus(videoRequest.id, "processing", 80);
          const videoResult = await generateVideo({
            prompt,
            script: scriptResult.script,
            voiceStyle,
            videoDescription: videoDescription || prompt,
            videoLength,
            audioUrl: voiceResult.audioUrl,
            captions: captionsResult
          });
          
          // Aggiorna lo stato a completato e fornisci l'URL
          await updateRenderStatus(videoRequest.id, "completed", 100, {
            url: videoResult.url,
            thumbnail: videoResult.thumbnail
          });
          
          // Aggiungi asset al progetto se specificato
          if (projectId) {
            try {
              await storage.createAsset({
                userId,
                projectId,
                type: "video",
                url: videoResult.url,
                thumbnailUrl: videoResult.thumbnail || null,
                title: title || prompt.slice(0, 50),
                description: videoDescription || prompt,
                metadata: {
                  duration: videoLength,
                  format: "mp4",
                  aiGenerated: true,
                  prompt
                },
                createdAt: new Date()
              });
            } catch (assetError) {
              console.error("Error creating asset for project:", assetError);
              // Non blocchiamo il completamento del video se fallisce l'aggiunta all'asset
            }
          }
          
        } catch (error) {
          console.error("Error in async video generation:", error);
          await updateRenderStatus(videoRequest.id, "failed", 0, {
            error: error.message || "Errore durante la generazione del video"
          });
        }
      })();
      
    } catch (error) {
      console.error("Error initiating video generation:", error);
      res.status(500).json({ message: "Impossibile avviare la generazione del video" });
    }
  });
  
  // Endpoint per ottenere lo stato di una richiesta di generazione video
  router.get("/status/:requestId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.requestId);
      
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "ID richiesta non valido" });
      }
      
      const request = await storage.getAiVideoRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Richiesta non trovata" });
      }
      
      // Verifica che l'utente sia il proprietario della richiesta
      if (request.userId.toString() !== userId) {
        return res.status(403).json({ message: "Non autorizzato" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error fetching video request status:", error);
      res.status(500).json({ message: "Impossibile ottenere lo stato della richiesta" });
    }
  });
  
  // Endpoint per ottenere tutte le richieste di generazione video dell'utente
  router.get("/requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getAiVideoRequestsByUserId(userId);
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching video requests:", error);
      res.status(500).json({ message: "Impossibile ottenere le richieste video" });
    }
  });
  
  return router;
}