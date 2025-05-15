import { Router } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { getValidToken } from "../services/tokenManager";
import { z } from "zod";
import path from "path";
import fs from "fs";
import axios from "axios";
import { notifyUser } from "./video-generation";

// Validazione dei dati della richiesta di pubblicazione
const publishRequestSchema = z.object({
  videoUrl: z.string().url("URL video non valido"),
  title: z.string().min(3, "Titolo deve essere di almeno 3 caratteri"),
  description: z.string().optional(),
  platformId: z.number(),
  privacy: z.enum(["public", "private", "unlisted"]).default("private"),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  scheduledTime: z.string().optional() // ISO string per pubblicazioni programmate
});

// Interfaccia per lo stato di pubblicazione
interface PublishStatus {
  id: number;
  userId: string;
  platformId: number;
  videoUrl: string;
  platformName: string;
  platformVideoId?: string;
  platformVideoUrl?: string;
  status: "queued" | "processing" | "completed" | "failed";
  title: string;
  description?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Gestori di pubblicazione per piattaforme specifiche
const platformPublishers: Record<string, (accountData: any, publishData: any) => Promise<{ videoId: string, videoUrl: string }>> = {
  // Implementazione per YouTube
  youtube: async (accountData, publishData) => {
    try {
      const token = await getValidToken(accountData);
      
      // Ottenere il video come Buffer
      const videoResponse = await axios.get(publishData.videoUrl, { responseType: 'arraybuffer' });
      const videoBuffer = Buffer.from(videoResponse.data);
      
      // Impostazioni di caricamento
      const snippet = {
        title: publishData.title,
        description: publishData.description || "",
        tags: publishData.tags || [],
        categoryId: publishData.categoryId || "22", // 22 = People & Blogs
      };
      
      const status = {
        privacyStatus: publishData.privacy,
        publishAt: publishData.scheduledTime,
        selfDeclaredMadeForKids: false
      };
      
      // TODO: Implementare l'upload effettivo su YouTube tramite API
      // Per ora restituiamo un ID di test
      // In un'implementazione reale, usare googleapis per YouTube
      
      // Simula un breve ritardo per l'upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const videoId = "test_" + Date.now();
      const videoUrl = `https://youtube.com/watch?v=${videoId}`;
      
      return { videoId, videoUrl };
    } catch (error) {
      console.error("Error publishing to YouTube:", error);
      throw new Error(`Errore pubblicazione su YouTube: ${error.message}`);
    }
  },
  
  // Implementazione per TikTok
  tiktok: async (accountData, publishData) => {
    try {
      const token = await getValidToken(accountData);
      
      // TODO: Implementare l'upload effettivo su TikTok tramite API
      // Per ora restituiamo un ID di test
      
      // Simula un breve ritardo per l'upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const videoId = "tiktok_" + Date.now();
      const videoUrl = `https://tiktok.com/@username/video/${videoId}`;
      
      return { videoId, videoUrl };
    } catch (error) {
      console.error("Error publishing to TikTok:", error);
      throw new Error(`Errore pubblicazione su TikTok: ${error.message}`);
    }
  },
  
  // Aggiungi altri publisher per piattaforme aggiuntive
};

export function setupSocialPublishingRoutes() {
  const router = Router();
  
  // Endpoint per avviare la pubblicazione di un video
  router.post("/publish", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validazione dati
      const validationResult = publishRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dati della richiesta non validi", 
          errors: validationResult.error.format() 
        });
      }
      
      const publishData = validationResult.data;
      
      // Ottieni l'account social dal database
      const socialAccount = await storage.getSocialAccount(publishData.platformId);
      
      if (!socialAccount) {
        return res.status(404).json({ message: "Account social non trovato" });
      }
      
      // Verifica che l'utente sia il proprietario dell'account
      if (socialAccount.userId.toString() !== userId) {
        return res.status(403).json({ message: "Non autorizzato ad utilizzare questo account" });
      }
      
      // Verifica che l'account sia attivo e verificato
      if (!socialAccount.isActive) {
        return res.status(400).json({ message: "Questo account non è attivo" });
      }
      
      if (!socialAccount.isVerified) {
        return res.status(400).json({ message: "Questo account non è verificato" });
      }
      
      // Creiamo un record per il tracciamento della pubblicazione
      // In una implementazione reale, questo avrebbe la sua tabella nel database
      const publishStatus: PublishStatus = {
        id: Date.now(), // In una implementazione reale, questo sarebbe generato dal DB
        userId,
        platformId: socialAccount.id,
        videoUrl: publishData.videoUrl,
        platformName: socialAccount.platform,
        status: "queued",
        title: publishData.title,
        description: publishData.description,
        createdAt: new Date()
      };
      
      // Rispondi subito al client
      res.json({
        publishId: publishStatus.id,
        message: "Richiesta di pubblicazione in coda"
      });
      
      // Esegui la pubblicazione in modo asincrono
      (async () => {
        try {
          // Aggiorna lo stato a "processing"
          publishStatus.status = "processing";
          
          // Notifica l'utente dell'avvio della pubblicazione
          notifyUser(userId, {
            type: "publish_update",
            payload: {
              publishId: publishStatus.id,
              status: "processing",
              platform: socialAccount.platform
            }
          });
          
          // Verifica che esista un gestore per questa piattaforma
          const publisher = platformPublishers[socialAccount.platform.toLowerCase()];
          if (!publisher) {
            throw new Error(`Pubblicazione non supportata per la piattaforma ${socialAccount.platform}`);
          }
          
          // Esegui la pubblicazione
          const result = await publisher(socialAccount, publishData);
          
          // Aggiorna lo stato a "completed"
          publishStatus.status = "completed";
          publishStatus.platformVideoId = result.videoId;
          publishStatus.platformVideoUrl = result.videoUrl;
          publishStatus.completedAt = new Date();
          
          // Notifica l'utente del completamento
          notifyUser(userId, {
            type: "publish_update",
            payload: {
              publishId: publishStatus.id,
              status: "completed",
              platform: socialAccount.platform,
              videoId: result.videoId,
              videoUrl: result.videoUrl
            }
          });
          
        } catch (error) {
          // Aggiorna lo stato a "failed"
          publishStatus.status = "failed";
          publishStatus.errorMessage = error.message;
          
          // Notifica l'utente dell'errore
          notifyUser(userId, {
            type: "publish_update",
            payload: {
              publishId: publishStatus.id,
              status: "failed",
              platform: socialAccount.platform,
              error: error.message
            }
          });
        }
      })();
      
    } catch (error) {
      console.error("Error initiating video publishing:", error);
      res.status(500).json({ message: "Impossibile avviare la pubblicazione del video" });
    }
  });
  
  // Endpoint per ottenere lo stato di tutte le pubblicazioni dell'utente
  router.get("/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // In una implementazione reale, questo recupererebbe i dati dal database
      // Per ora restituiamo un array vuoto
      res.json([]);
      
    } catch (error) {
      console.error("Error fetching publishing status:", error);
      res.status(500).json({ message: "Impossibile ottenere lo stato delle pubblicazioni" });
    }
  });
  
  return router;
}