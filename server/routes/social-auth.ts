import { Router } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { z } from "zod";
import { revokeAuthorization } from "../services/securityUtils";
import { oauthConfig, generateAuthUrl, exchangeCodeForToken, getUserInfo, createSocialAccountObject } from "../services/oauth";

// Validazione per richieste di autorizzazione
const authRequestSchema = z.object({
  platform: z.string(),
  redirectUri: z.string().url()
});

// Validazione per callback OAuth
const oauthCallbackSchema = z.object({
  platform: z.string(),
  code: z.string(),
  state: z.string(),
  redirectUri: z.string().url()
});

// Validazione per revoca autorizzazione
const revokeAuthSchema = z.object({
  accountId: z.number()
});

export function setupSocialAuthRoutes() {
  const router = Router();
  
  // Endpoint per ottenere un URL di autorizzazione
  router.post("/authorize", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validazione input
      const validationResult = authRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dati della richiesta non validi", 
          errors: validationResult.error.format() 
        });
      }
      
      const { platform, redirectUri } = validationResult.data;
      
      // Verifica che la piattaforma sia supportata
      if (!oauthConfig[platform]) {
        return res.status(400).json({ message: `Piattaforma '${platform}' non supportata` });
      }
      
      // Genera l'URL di autorizzazione
      const { url, state } = generateAuthUrl(platform, redirectUri, userId);
      
      // Salva lo state nella sessione (per sicurezza)
      req.session.oauthData = {
        state,
        expiry: Date.now() + 3600000, // Scade dopo 1 ora
        userId,
        platform
      };
      
      res.json({ authUrl: url });
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({ message: "Errore nella generazione dell'URL di autorizzazione" });
    }
  });
  
  // Endpoint per gestire il callback OAuth
  router.post("/callback", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validazione input
      const validationResult = oauthCallbackSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dati della richiesta non validi", 
          errors: validationResult.error.format() 
        });
      }
      
      const { platform, code, state, redirectUri } = validationResult.data;
      
      // Verifica lo state (per prevenire CSRF)
      const oauthData = req.session.oauthData;
      if (!oauthData || oauthData.state !== state || oauthData.userId !== userId) {
        return res.status(400).json({ message: "Stato OAuth non valido o scaduto" });
      }
      
      // Verifica che la sessione non sia scaduta
      if (oauthData.expiry < Date.now()) {
        return res.status(400).json({ message: "Sessione OAuth scaduta" });
      }
      
      // Verifica che la piattaforma corrisponda
      if (oauthData.platform !== platform) {
        return res.status(400).json({ message: "Piattaforma OAuth non corrispondente" });
      }
      
      // Scambia il codice con un token di accesso
      const tokens = await exchangeCodeForToken(platform, code, redirectUri);
      
      // Ottieni le informazioni dell'utente
      const userInfo = await getUserInfo(platform, tokens.accessToken, tokens.openId);
      
      // Crea l'oggetto account sociale
      const accountData = createSocialAccountObject(platform, userId, userInfo, tokens);
      
      // Salva l'account nel database
      const account = await storage.createSocialAccount(accountData);
      
      // Pulisci i dati OAuth dalla sessione
      delete req.session.oauthData;
      
      res.json({ success: true, account });
    } catch (error) {
      console.error("Error handling OAuth callback:", error);
      res.status(500).json({ message: "Errore nella gestione del callback OAuth" });
    }
  });
  
  // Endpoint per revocare un'autorizzazione
  router.post("/revoke", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validazione input
      const validationResult = revokeAuthSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dati della richiesta non validi", 
          errors: validationResult.error.format() 
        });
      }
      
      const { accountId } = validationResult.data;
      
      // Revoca l'autorizzazione
      const success = await revokeAuthorization(userId, accountId);
      
      if (!success) {
        return res.status(400).json({ message: "Impossibile revocare l'autorizzazione" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error revoking authorization:", error);
      res.status(500).json({ message: "Errore nella revoca dell'autorizzazione" });
    }
  });
  
  return router;
}