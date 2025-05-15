import { Express, Request, Response } from "express";
import { createServer, Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth, isAuthenticated } from "../replitAuth";
import { initWebSocketConnections, setupVideoRoutes } from "./video-generation";
import { setupSocialPublishingRoutes } from "./social-publishing";
import { setupSocialAuthRoutes } from "./social-auth";
import { setupGdprRoutes } from "./gdpr";
import { errorHandlerMiddleware } from "../services/errorHandler";
import path from "path";
import { storage } from "../storage";
import videoSegmentationRouter from "../routes/video-segmentation";

// Middleware per autenticazione semplificata in ambiente development
export const developmentAuth = async (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === 'development') {
    // In ambiente di sviluppo, impostiamo sempre un utente fittizio
    // Verifica o crea l'utente test con ID 1
    let testUser;
    try {
      testUser = await storage.getUser("1");
      if (!testUser) {
        testUser = await storage.upsertUser({
          id: "1",
          username: "testuser",
          password: "password123", // Solo per sviluppo
          email: "test@example.com",
          display_name: "Test User",
          avatar_url: "https://i.pravatar.cc/300",
          firstName: "Test",
          lastName: "User",
          profileImageUrl: "https://i.pravatar.cc/300"
        });
      }
    } catch (error) {
      console.error("Error ensuring test user exists:", error);
    }
    
    // Imposta l'utente fittizio
    req.user = {
      claims: {
        sub: "1", // ID utente fittizio
        email: "test@example.com"
      }
    };
    req.isAuthenticated = () => true;
    return next();
  } else {
    // In produzione, utilizziamo il middleware standard
    return isAuthenticated(req, res, next);
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Inizializza il server HTTP
  const server = createServer(app);
  
  // Inizializza WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  // Inizializza gestione connessioni WebSocket
  initWebSocketConnections(wss);
  
  // Setup authentication
  await setupAuth(app);
  
  // Registra il router per la segmentazione video
  app.use('/api/video', videoSegmentationRouter);
  
  // Auth Routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // In ambiente di sviluppo, usiamo sempre un utente fittizio
      if (process.env.NODE_ENV === 'development') {
        // Verifica se l'utente fittizio esiste già
        let mockUser = await storage.getUser("1");
        
        // Se non esiste, crealo
        if (!mockUser) {
          try {
            mockUser = await storage.upsertUser({
              id: "1",
              username: "testuser",
              password: "password123", // Solo per sviluppo
              email: "test@example.com",
              display_name: "Test User",
              avatar_url: "https://i.pravatar.cc/300",
              firstName: "Test",
              lastName: "User",
              profileImageUrl: "https://i.pravatar.cc/300"
            });
            console.log("Development mode: created mock user for testing");
          } catch (err) {
            console.error("Failed to create mock user:", err);
            return res.status(500).json({ message: "Failed to create test user" });
          }
        }
        
        return res.json(mockUser);
      }
      
      // In produzione, verifica l'autenticazione
      if (!req.isAuthenticated() || !req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Registra i router per i servizi principali
  app.use("/api/videos", setupVideoRoutes());
  app.use("/api/social", setupSocialPublishingRoutes());
  app.use("/api/auth/social", setupSocialAuthRoutes());
  app.use("/api/user", setupGdprRoutes());
  
  // Serve media files from temp directory
  app.get("/api/media/:filename", (req, res) => {
    const filePath = path.join(process.cwd(), "temp", req.params.filename);
    res.sendFile(filePath);
  });
  
  // Middleware per la gestione centralizzata degli errori
  app.use(errorHandlerMiddleware);
  
  return server;
}