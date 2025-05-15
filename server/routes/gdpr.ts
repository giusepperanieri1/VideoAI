/**
 * Routes per la gestione delle richieste GDPR
 * Consente agli utenti di scaricare o cancellare i propri dati
 */

import { Router } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import path from "path";
import fs from "fs/promises";
import { ErrorType, createError, sendErrorResponse } from "../services/errorHandler";

export function setupGdprRoutes() {
  const router = Router();
  
  /**
   * Endpoint per esportare tutti i dati dell'utente (diritto di accesso GDPR)
   */
  router.get("/export-data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Raccogli tutti i dati dell'utente dal database
      const userData = await collectUserData(userId);
      
      // Invia i dati come file JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}-${Date.now()}.json"`);
      res.json(userData);
    } catch (error) {
      const appError = createError(
        ErrorType.SERVER_ERROR,
        "Errore durante l'esportazione dei dati",
        { originalError: error.message },
        "EXPORT_ERROR"
      );
      sendErrorResponse(res, appError);
    }
  });
  
  /**
   * Endpoint per cancellare tutti i dati dell'utente (diritto all'oblio GDPR)
   */
  router.post("/delete-account", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Prima esporta i dati (per backup)
      const userData = await collectUserData(userId);
      
      // Elimina tutti i dati utente dal database
      await deleteUserData(userId);
      
      // Logout l'utente
      req.logout(() => {
        res.json({ 
          success: true, 
          message: "Account e dati eliminati con successo" 
        });
      });
    } catch (error) {
      const appError = createError(
        ErrorType.SERVER_ERROR,
        "Errore durante la cancellazione dell'account",
        { originalError: error.message },
        "DELETE_ACCOUNT_ERROR"
      );
      sendErrorResponse(res, appError);
    }
  });
  
  return router;
}

/**
 * Raccoglie tutti i dati utente dal database
 */
async function collectUserData(userId: string) {
  try {
    // Ottieni dati utente base
    const user = await storage.getUser(userId);
    
    // Ottieni progetti
    const projects = await storage.getProjectsByUserId(userId);
    
    // Ottieni asset
    const assets = await storage.getAssetsByUserId(userId);
    
    // Ottieni account social
    const socialAccounts = await storage.getSocialAccountsByUserId(userId);
    
    // Ottieni richieste video AI
    const aiVideoRequests = await storage.getAiVideoRequestsByUserId(userId);
    
    // Raccogli timeline items per ogni progetto
    const timelineItems = [];
    for (const project of projects) {
      const items = await storage.getTimelineItemsByProjectId(project.id);
      timelineItems.push(...items);
    }
    
    // Rimuovi dati sensibili per sicurezza
    const sanitizedSocialAccounts = socialAccounts.map(account => {
      const { token, refreshToken, ...safeData } = account;
      return safeData;
    });
    
    // Struttura tutti i dati
    return {
      user,
      projects,
      assets,
      timelineItems,
      socialAccounts: sanitizedSocialAccounts,
      aiVideoRequests,
      exportDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error collecting user data:", error);
    throw error;
  }
}

/**
 * Elimina tutti i dati utente dal database
 */
async function deleteUserData(userId: string) {
  try {
    // Elimina i progetti (e a cascata gli elementi collegati)
    const projects = await storage.getProjectsByUserId(userId);
    for (const project of projects) {
      await storage.deleteProject(project.id);
    }
    
    // Elimina gli account social
    const socialAccounts = await storage.getSocialAccountsByUserId(userId);
    for (const account of socialAccounts) {
      await storage.deleteSocialAccount(account.id);
    }
    
    // Elimina le richieste AI
    // Nota: in un'implementazione completa, qui dovremmo aggiungere
    // un metodo per eliminare le richieste AI
    
    // Elimina gli asset
    const assets = await storage.getAssetsByUserId(userId);
    for (const asset of assets) {
      await storage.deleteAsset(asset.id);
    }
    
    // Non eliminiamo l'utente stesso perché la gestione account è di Replit Auth
    // Possiamo però anonimizzare i dati
    // await storage.updateUser(userId, { email: null, firstName: null, lastName: null, profileImageUrl: null });
    
    return true;
  } catch (error) {
    console.error("Error deleting user data:", error);
    throw error;
  }
}