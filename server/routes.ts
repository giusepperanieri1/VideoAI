// File deprecato - Le rotte sono state spostate in ./routes/index.ts
// Questo file viene mantenuto solo per compatibilità

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { generateVideo, generateVoiceOver, generateScript } from "./openai";
import { searchYoutubeVideos } from "./youtube";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { developmentAuth } from "./routes/index";

// Interfaccia per i messaggi WebSocket
interface WebSocketMessage {
  type: string;
  payload: any;
}
import path from "path";
import {
  insertUserSchema,
  insertProjectSchema,
  insertAssetSchema,
  insertTimelineItemSchema,
  insertSocialAccountSchema,
  insertAiVideoRequestSchema,
  InsertSocialAccount,
  SocialAccount,
  socialAccounts
} from "@shared/schema";
import { json } from "drizzle-orm/pg-core";
import { 
  generateAuthUrl, 
  exchangeCodeForToken, 
  getUserInfo, 
  createSocialAccountObject,
  oauthConfig
} from "./services/oauth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Inizializza il server HTTP
  const server = createServer(app);
  
  // Inizializza WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  // Mappa per tenere traccia delle connessioni attive per utente
  const userConnections = new Map<string, Set<WebSocket>>();
  
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
  
  // Funzione di utilità per inviare notifiche a un utente specifico
  const notifyUser = (userId: string, data: WebSocketMessage) => {
    if (userConnections.has(userId)) {
      userConnections.get(userId)?.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      });
    }
  };
  
  // Funzione per aggiornare lo stato di un rendering video e inviare notifiche
  const updateRenderStatus = async (
    requestId: number, 
    status: string, 
    progress: number = 0, 
    result?: { url?: string, thumbnail?: string, error?: string }
  ) => {
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
  };
  
  // Setup authentication
  await setupAuth(app);
  
  // Registrazione router spostata in routes/index.ts
  
  // Auth Routes
  // Auth route è stato spostato in routes/index.ts

  // Project Routes
  app.get("/api/projects", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const projects = await storage.getProjectsByUserId(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({
        ...req.body,
        userId // Ensure user ID comes from authenticated session
      });
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.get("/api/projects/:id", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify user has access to this project
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put("/api/projects/:id", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Verify the project exists and belongs to the user
      const existingProject = await storage.getProject(projectId);
      if (!existingProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (existingProject.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const projectData = insertProjectSchema.parse({
        ...req.body,
        userId // Ensure user ID is preserved and not changed
      });
      
      const updatedProject = await storage.updateProject(projectId, projectData);
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.delete("/api/projects/:id", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Verify the project exists and belongs to the user
      const existingProject = await storage.getProject(projectId);
      if (!existingProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (existingProject.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteProject(projectId);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Assets Routes
  app.get("/api/assets", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assets = await storage.getAssetsByUserId(userId);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.post("/api/assets", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assetData = insertAssetSchema.parse({
        ...req.body,
        userId // Ensure user ID comes from authenticated session
      });
      const asset = await storage.createAsset(assetData);
      res.json(asset);
    } catch (error) {
      console.error("Error creating asset:", error);
      res.status(400).json({ message: "Invalid asset data" });
    }
  });

  // Timeline Items Routes
  app.get("/api/projects/:projectId/timeline", developmentAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Get the project to verify ownership
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const timelineItems = await storage.getTimelineItemsByProjectId(projectId);
      res.json(timelineItems);
    } catch (error) {
      console.error("Error fetching timeline items:", error);
      res.status(500).json({ message: "Failed to fetch timeline items" });
    }
  });

  app.post("/api/timeline-items", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemData = insertTimelineItemSchema.parse(req.body);
      
      // Verify project ownership
      const project = await storage.getProject(itemData.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const item = await storage.createTimelineItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating timeline item:", error);
      res.status(400).json({ message: "Invalid timeline item data" });
    }
  });

  app.put("/api/timeline-items/:id", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      // Get the timeline item to verify ownership through project
      const timelineItem = await storage.getTimelineItem(itemId);
      if (!timelineItem) {
        return res.status(404).json({ message: "Timeline item not found" });
      }
      
      // Verify project ownership
      const project = await storage.getProject(timelineItem.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const itemData = insertTimelineItemSchema.parse(req.body);
      const updatedItem = await storage.updateTimelineItem(itemId, itemData);
      if (!updatedItem) {
        return res.status(404).json({ message: "Timeline item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating timeline item:", error);
      res.status(400).json({ message: "Invalid timeline item data" });
    }
  });

  app.delete("/api/timeline-items/:id", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      // Get the timeline item to verify ownership through project
      const timelineItem = await storage.getTimelineItem(itemId);
      if (!timelineItem) {
        return res.status(404).json({ message: "Timeline item not found" });
      }
      
      // Verify project ownership
      const project = await storage.getProject(timelineItem.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteTimelineItem(itemId);
      if (!success) {
        return res.status(404).json({ message: "Timeline item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting timeline item:", error);
      res.status(500).json({ message: "Failed to delete timeline item" });
    }
  });

  // Social Media Account Routes
  app.get("/api/social-accounts", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getSocialAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      res.status(500).json({ message: "Failed to fetch social accounts" });
    }
  });

  app.post("/api/social-accounts", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Gestione del caso in cui accountId sia "auto"
      let { accountId, ...restData } = req.body;
      
      // Se accountId è "auto", generiamo un ID univoco
      if (accountId === "auto") {
        // In un'applicazione reale, qui si farebbe una chiamata all'API della piattaforma
        // per ottenere i dettagli dell'account utilizzando il token
        // Per semplicità, generiamo un ID casuale con il nome della piattaforma
        accountId = `${req.body.platform}_user_${Math.floor(Math.random() * 100000)}`;
      }
      
      // Simuliamo la verifica del token (in un'app reale, verificheremmo con l'API della piattaforma)
      const isVerified = req.body.token && req.body.token.length > 10;
      
      const accountData = insertSocialAccountSchema.parse({
        ...restData,
        accountId,
        userId,
        isVerified // Impostiamo lo stato di verifica in base al token
      });
      
      const account = await storage.createSocialAccount(accountData);
      res.json(account);
    } catch (error) {
      console.error("Error creating social account:", error);
      res.status(400).json({ message: "Invalid social account data" });
    }
  });
  
  app.get("/api/social-accounts/:id", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountId = parseInt(req.params.id);
      
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }
      
      const account = await storage.getSocialAccount(accountId);
      if (!account) {
        return res.status(404).json({ message: "Social account not found" });
      }
      
      // Verify ownership
      if (account.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(account);
    } catch (error) {
      console.error("Error fetching social account:", error);
      res.status(500).json({ message: "Failed to fetch social account" });
    }
  });
  
  app.patch("/api/social-accounts/:id", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountId = parseInt(req.params.id);
      
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }
      
      // Verify the account exists and belongs to the user
      const existingAccount = await storage.getSocialAccount(accountId);
      if (!existingAccount) {
        return res.status(404).json({ message: "Social account not found" });
      }
      
      if (existingAccount.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Only allow updating specific fields
      const schema = z.object({
        isActive: z.boolean().optional(),
        token: z.string().optional(),
      });
      
      const updateData = schema.parse(req.body);
      
      // Correggi il problema di tipo selezionando solo i campi necessari
      const updateData2: Partial<InsertSocialAccount> & { updatedAt: Date } = {
        isActive: updateData.isActive ?? existingAccount.isActive,
        token: updateData.token ?? existingAccount.token,
        updatedAt: new Date()
      };
      
      const updatedAccount = await storage.updateSocialAccount(accountId, updateData2);
      
      if (!updatedAccount) {
        return res.status(404).json({ message: "Social account not found" });
      }
      
      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating social account:", error);
      res.status(400).json({ message: "Invalid social account data" });
    }
  });
  
  app.delete("/api/social-accounts/:id", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountId = parseInt(req.params.id);
      
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }
      
      // Verify the account exists and belongs to the user
      const existingAccount = await storage.getSocialAccount(accountId);
      if (!existingAccount) {
        return res.status(404).json({ message: "Social account not found" });
      }
      
      if (existingAccount.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteSocialAccount(accountId);
      if (!success) {
        return res.status(404).json({ message: "Social account not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting social account:", error);
      res.status(500).json({ message: "Failed to delete social account" });
    }
  });
  
  // Rotte OAuth per l'autenticazione con piattaforme social
  
  /**
   * Avvia il flusso di autenticazione OAuth per una piattaforma social
   */
  app.get("/api/oauth/:platform/auth", developmentAuth, (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { platform } = req.params;
      
      // Verifica che la piattaforma sia supportata
      if (!oauthConfig[platform]) {
        return res.status(400).json({ message: `Piattaforma '${platform}' non supportata` });
      }
      
      // Genera l'URL di autorizzazione e lo stato
      const redirectUri = `${req.protocol}://${req.get('host')}/api/oauth/${platform}/callback`;
      const { url, state } = generateAuthUrl(platform, redirectUri, userId);
      
      // Salva lo stato nella sessione per la verifica nel callback
      if (!req.session) {
        req.session = {};
      }
      
      req.session.oauthData = {
        state,
        expiry: Date.now() + (10 * 60 * 1000), // Scade dopo 10 minuti
        userId,
        platform
      };
      
      // Reindirizza l'utente all'URL di autorizzazione
      res.json({ authUrl: url });
    } catch (error: any) {
      console.error("Errore nell'avvio dell'autenticazione OAuth:", error);
      res.status(500).json({ message: `Errore nell'autorizzazione: ${error.message}` });
    }
  });
  
  /**
   * Gestisce il callback OAuth dopo l'autenticazione
   */
  app.get("/api/oauth/:platform/callback", async (req, res) => {
    try {
      const { platform } = req.params;
      const { code, state } = req.query;
      
      // Verifica della piattaforma
      if (!oauthConfig[platform]) {
        return res.status(400).json({ message: `Piattaforma '${platform}' non supportata` });
      }
      
      // Verifica che ci siano i dati OAuth nella sessione
      if (!req.session || !req.session.oauthData) {
        return res.status(400).json({ message: "Dati di sessione OAuth mancanti" });
      }
      
      const { state: savedState, expiry, userId, platform: savedPlatform } = req.session.oauthData;
      
      // Verifica dello stato per prevenire CSRF
      if (!savedState || savedState !== state) {
        return res.status(400).json({ message: "Stato di autenticazione non valido" });
      }
      
      // Verifica della scadenza dello stato
      if (!expiry || Date.now() > expiry) {
        return res.status(400).json({ message: "Sessione di autenticazione scaduta" });
      }
      
      // Verifica che la piattaforma corrisponda
      if (savedPlatform !== platform) {
        return res.status(400).json({ message: "Piattaforma non corrisponde" });
      }
      
      // Recupera l'ID utente dalla sessione
      if (!userId) {
        return res.status(400).json({ message: "Sessione utente non valida" });
      }
      
      // Scambia il codice di autorizzazione con token di accesso
      const redirectUri = `${req.protocol}://${req.get('host')}/api/oauth/${platform}/callback`;
      const tokens = await exchangeCodeForToken(platform, code as string, redirectUri);
      
      // Per TikTok dobbiamo gestire il caso speciale dell'open_id che arriva con il token
      let openId;
      if (platform === 'tiktok' && tokens.openId) {
        openId = tokens.openId;
      }
      
      // Ottieni le informazioni dell'account dell'utente
      const userInfo = await getUserInfo(platform, tokens.accessToken, openId);
      
      // Crea l'oggetto account sociale
      const accountData = createSocialAccountObject(
        platform,
        userId,
        userInfo,
        tokens
      );
      
      // Crea l'account nel database o aggiorna se esiste
      let existingAccounts: SocialAccount[] = [];
      try {
        existingAccounts = await storage.getSocialAccountsByUserId(userId);
      } catch (dbError) {
        console.error("Database error when checking existing accounts:", dbError);
      }
      
      // Verifica se esiste già un account con lo stesso ID piattaforma
      const existingAccount = existingAccounts.find(
        acc => acc.platform === platform && acc.accountId === accountData.accountId
      );
      
      if (existingAccount) {
        // Aggiorna l'account esistente
        const updateData: Partial<InsertSocialAccount> & { updatedAt: Date } = {
          token: accountData.token,
          refreshToken: accountData.refreshToken,
          tokenExpiry: accountData.tokenExpiry,
          accountName: accountData.accountName,
          profileImageUrl: accountData.profileImageUrl,
          followerCount: accountData.followerCount,
          isActive: true,
          isVerified: true,
          updatedAt: new Date()
        };
        await storage.updateSocialAccount(existingAccount.id, updateData);
      } else {
        // Crea un nuovo account
        await storage.createSocialAccount(accountData);
      }
      
      // Pulisci i dati della sessione
      delete req.session.oauthData;
      
      // Reindirizza l'utente alla pagina degli account social
      res.redirect('/social-accounts?success=true');
    } catch (error: any) {
      console.error("Errore nel callback OAuth:", error);
      // Reindirizza l'utente alla pagina degli account social con un messaggio di errore
      res.redirect(`/social-accounts?error=${encodeURIComponent(error.message || 'Errore sconosciuto')}`);
    }
  });

  // Alias della vecchia rotta di autenticazione alla nuova implementazione
  app.get("/api/social-auth/:platform", developmentAuth, (req: any, res) => {
    // Reindirizza alla nuova rotta di autenticazione
    res.redirect(`/api/oauth/${req.params.platform}/auth`);
  });
  
  // Alias della vecchia rotta di callback alla nuova implementazione
  app.get("/api/social-callback", async (req: any, res) => {
    // Reindirizza alla nuova rotta di callback con gli stessi parametri
    const queryParams = new URLSearchParams(req.query).toString();
    
    // Verifica che ci siano i dati OAuth nella sessione
    if (!req.session || !req.session.oauthData || !req.session.oauthData.platform) {
      return res.redirect('/social-accounts?error=invalid_session');
    }
    
    res.redirect(`/api/oauth/${req.session.oauthData.platform}/callback?${queryParams}`);
  });

  // AI Voice-Over Generation Route
  app.post("/api/ai/generate-voiceover", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate the request body
      const schema = z.object({
        text: z.string().min(1, "Il testo è obbligatorio"),
        voice: z.string().optional().default("alloy"),
        speed: z.number().optional().default(1),
        pitch: z.number().optional().default(0)
      });
      
      const { text, voice, speed, pitch } = schema.parse(req.body);
      
      // Check if OPENAI_API_KEY is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key is not configured" });
      }
      
      // Generate the voice-over
      const result = await generateVoiceOver(text, voice);
      
      res.json(result);
    } catch (error) {
      console.error("Error generating voice-over:", error);
      res.status(400).json({ message: "Failed to generate voice-over" });
    }
  });
  
  // AI Video Generation Routes
  app.post("/api/ai/generate-video", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate the request body and ensure correct user ID
      const requestData = insertAiVideoRequestSchema.parse({
        ...req.body,
        userId // Ensure user ID comes from authenticated session
      });
      
      // Check if OPENAI_API_KEY is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key is not configured" });
      }
      
      // Create the AI video request in the database
      const videoRequest = await storage.createAiVideoRequest({
        ...requestData,
        status: "processing"
      });
      
      // Process the video generation asynchronously
      generateVideo(requestData)
        .then(async (result) => {
          // Create an asset for the generated video
          const asset = await storage.createAsset({
            userId,
            type: "generated",
            name: `Generated Video ${videoRequest.id}`,
            url: result.url,
            duration: requestData.duration || 30,
            thumbnail: result.thumbnail || ""
          });
          
          // Update the AI video request with the result
          await storage.updateAiVideoRequest(videoRequest.id, {
            ...videoRequest,
            status: "completed",
            resultAssetId: asset.id
          });
        })
        .catch(async (error) => {
          console.error("Error generating video:", error);
          await storage.updateAiVideoRequest(videoRequest.id, {
            ...videoRequest,
            status: "failed"
          });
        });
      
      res.json({ requestId: videoRequest.id, status: "processing" });
    } catch (error) {
      console.error("Error creating AI video request:", error);
      res.status(400).json({ message: "Invalid AI video request data" });
    }
  });

  app.get("/api/ai/video-requests", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getAiVideoRequestsByUserId(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching AI video requests:", error);
      res.status(500).json({ message: "Failed to fetch AI video requests" });
    }
  });

  app.get("/api/ai/video-requests/:id", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      
      const request = await storage.getAiVideoRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "AI video request not found" });
      }
      
      // Verify ownership
      if (request.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error fetching AI video request:", error);
      res.status(500).json({ message: "Failed to fetch AI video request" });
    }
  });

  // Voice-over Generation Route
  app.post("/api/ai/generate-voiceover", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const { text, voice } = z.object({
        text: z.string(),
        voice: z.string().default("it-IT-Standard-A")
      }).parse(req.body);
      
      // Check if OPENAI_API_KEY is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key is not configured" });
      }
      
      const result = await generateVoiceOver(text, voice);
      
      // Create an asset for the voice over
      if (result && result.url) {
        try {
          const assetData = {
            userId,
            type: "audio",
            name: `Voice Over: ${text.substring(0, 30)}...`,
            url: result.url,
            duration: result.duration || 0,
            thumbnail: ""
          };
          
          // Create the asset
          const asset = await storage.createAsset(assetData);
          
          // Create a clean response object
          const responseData = {
            url: result.url,
            duration: result.duration || 0,
            assetId: asset.id
          };
          
          // Return the response with the asset ID
          return res.json(responseData);
        } catch (assetError) {
          console.error("Error creating asset for voice-over:", assetError);
        }
      }
      
      // If we get here, return the original result
      res.json(result);
    } catch (error) {
      console.error("Error generating voice-over:", error);
      res.status(400).json({ message: "Failed to generate voice-over" });
    }
  });
  
  // Social Media Publishing Route
  app.post("/api/publish", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const publishData = z.object({
        projectId: z.number(),
        platforms: z.array(z.string()),
        title: z.string(),
        description: z.string().optional(),
        scheduleDate: z.string().optional(),
        scheduleTime: z.string().optional(),
      }).parse(req.body);
      
      // Get the project to verify ownership
      const project = await storage.getProject(publishData.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get timeline items for the project
      const timelineItems = await storage.getTimelineItemsByProjectId(publishData.projectId);
      if (timelineItems.length === 0) {
        return res.status(400).json({ message: "Cannot publish empty project" });
      }
      
      // Get social accounts
      const accounts = await storage.getSocialAccountsByUserId(userId);
      const connectedPlatforms = accounts.map(account => account.platform);
      
      // Check if we have connected accounts for all platforms
      const unconnectedPlatforms = publishData.platforms.filter(platform => 
        !connectedPlatforms.includes(platform)
      );
      
      if (unconnectedPlatforms.length > 0) {
        return res.status(400).json({ 
          message: `You need to connect these accounts first: ${unconnectedPlatforms.join(', ')}`,
          unconnectedPlatforms
        });
      }
      
      // For now, simulate publishing process
      // In a real implementation, this would call platform-specific APIs
      
      // In a full implementation:
      // 1. Export the final video file
      // 2. Upload to each platform using their specific APIs
      // 3. Keep track of publishing status for each platform
      
      // For YouTube, you'd use the YouTube Data API
      // For other platforms, their respective APIs
      
      if (publishData.scheduleDate && publishData.scheduleTime) {
        // Handle scheduled publishing
        const scheduledDateTime = new Date(`${publishData.scheduleDate}T${publishData.scheduleTime}`);
        
        // Here you would set up a job to publish at the scheduled time
        // For example, using a task queue or scheduler
        
        // For simplicity, just return success with scheduled status
        return res.json({ 
          status: "scheduled", 
          scheduledFor: scheduledDateTime.toISOString(),
          platforms: publishData.platforms
        });
      }
      
      // For immediate publishing, simulate API calls to social platforms
      // Return success with "published" status and platform details
      
      // Call to the actual YouTube API would be here if platform includes "youtube"
      // Example: const youtubeResult = await publishToYouTube(projectId, title, description);
      
      res.json({ 
        status: "published", 
        platforms: publishData.platforms.map(platform => ({
          platform,
          status: "success",
          url: `https://${platform}.com/user/video-id`, // This would be the actual URL from the API response
        }))
      });
      
    } catch (error) {
      console.error("Error publishing content:", error);
      res.status(400).json({ message: "Failed to publish content" });
    }
  });

  // YouTube Search Route
  app.get("/api/youtube/search", developmentAuth, async (req: any, res) => {
    try {
      console.log("YouTube search request:", req.query);
      const query = req.query.q as string;
      if (!query) {
        console.log("YouTube search error: Query parameter missing");
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Check if YOUTUBE_API_KEY is available
      if (!process.env.YOUTUBE_API_KEY) {
        console.log("YouTube search error: API key missing");
        return res.status(500).json({ message: "YouTube API key is not configured" });
      }
      
      console.log("Performing YouTube search for:", query);
      const results = await searchYoutubeVideos(query);
      console.log(`YouTube search results: ${results.length} items found`);
      res.json(results);
    } catch (error) {
      console.error("Error searching YouTube videos:", error);
      res.status(500).json({ message: "Failed to search YouTube videos" });
    }
  });

  // YouTube Import Route
  app.post("/api/youtube/import", developmentAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { videoId, startTime, duration, title, thumbnail } = req.body;
      
      if (!videoId || startTime === undefined || !duration) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if YOUTUBE_API_KEY is available
      if (!process.env.YOUTUBE_API_KEY) {
        return res.status(500).json({ message: "YouTube API key is not configured" });
      }
      
      const { downloadYoutubeClip } = await import('./youtube');
      
      try {
        // Download the YouTube clip
        const videoData = await downloadYoutubeClip(videoId, startTime, duration);
        
        // Extract just the string URL from the response
        const videoUrl = typeof videoData === 'string' ? videoData : videoData.url;
        
        // Prepare asset data with type-safe values
        const assetData = {
          userId,
          type: "video",
          name: title || (typeof videoData === 'object' && videoData.title) || `YouTube Clip ${videoId}`,
          url: videoUrl,
          duration: typeof duration === 'number' ? duration : parseInt(duration),
          thumbnail: thumbnail || (typeof videoData === 'object' && videoData.thumbnail) || ""
        };
        
        // Create the asset in the database with the correct types
        const asset = await storage.createAsset(assetData);
        
        res.json(asset);
      } catch (downloadError) {
        console.error("Error downloading YouTube video:", downloadError);
        res.status(500).json({ message: "Failed to download YouTube video" });
      }
    } catch (error) {
      console.error("Error importing YouTube video:", error);
      res.status(500).json({ message: "Failed to import YouTube video" });
    }
  });
  
  // Script Generation Route
  app.post("/api/ai/generate-script", developmentAuth, async (req: any, res) => {
    try {
      const schema = z.object({
        topic: z.string().min(1, "Il topic è obbligatorio"),
        duration: z.number().optional().default(30),
        tone: z.string().optional().default("professionale"),
        includeCTA: z.boolean().optional().default(true)
      });
      
      const { topic, duration, tone } = schema.parse(req.body);
      
      // Check if OPENAI_API_KEY is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key is not configured" });
      }
      
      // Use the existing script generation function
      const scriptText = await generateScript(topic, duration, tone);
      
      // Return the generated script
      res.json({ script: scriptText });
    } catch (error) {
      console.error("Error generating script:", error);
      res.status(400).json({ message: "Failed to generate script" });
    }
  });
  
  // Serve media files from temp directory
  app.get("/api/media/:filename", (req, res) => {
    const filePath = path.join(process.cwd(), "temp", req.params.filename);
    res.sendFile(filePath);
  });

  return server;
}
