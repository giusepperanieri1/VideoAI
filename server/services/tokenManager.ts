import axios from 'axios';
import { encrypt, decrypt, isEncrypted } from './encryption';
import { storage } from '../storage';
import { SocialAccount, InsertSocialAccount } from '@shared/schema';

// Intervallo in millisecondi prima della scadenza per avviare il refresh (default: 5 minuti)
const REFRESH_BUFFER_TIME = 5 * 60 * 1000;

// Configurazione per diverse piattaforme
const platformConfig: Record<string, {
  tokenUrl: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
}> = {
  youtube: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.YOUTUBE_OAUTH_CLIENT_ID || process.env.YOUTUBE_API_KEY,
    clientSecret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET
  },
  tiktok: {
    tokenUrl: 'https://open-api.tiktok.com/oauth/refresh_token/',
    clientId: process.env.TIKTOK_CLIENT_KEY,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET
  },
  // Configurazioni simili per altre piattaforme
};

/**
 * Ottiene un token valido per un account social, aggiornandolo se necessario
 */
export async function getValidToken(account: SocialAccount): Promise<string> {
  if (!account || !account.token) {
    throw new Error(`Account non valido o token mancante (${account?.id})`);
  }
  
  try {
    // Se il token è cifrato, decifralo
    let token = account.token;
    if (isEncrypted(token)) {
      token = decrypt(token);
    }
    
    // Verifica se il token è prossimo alla scadenza (buffer di sicurezza)
    const now = Date.now();
    const tokenExpiry = account.tokenExpiry ? new Date(account.tokenExpiry).getTime() : 0;
    
    // Se il token non è in scadenza, restituiscilo direttamente
    if (tokenExpiry && tokenExpiry > now + REFRESH_BUFFER_TIME) {
      return token;
    }
    
    // Se il token è in scadenza e abbiamo un refresh token, aggiorniamolo
    if (account.refreshToken) {
      const refreshToken = isEncrypted(account.refreshToken) 
        ? decrypt(account.refreshToken) 
        : account.refreshToken;
        
      // Ottieni la configurazione della piattaforma
      const config = platformConfig[account.platform];
      if (!config || !config.clientId || !config.clientSecret) {
        throw new Error(`Configurazione OAuth mancante per la piattaforma ${account.platform}`);
      }
      
      // Prepara la richiesta di refresh
      let refreshResponse;
      
      // Gestione specifica per piattaforma
      if (account.platform === 'youtube') {
        refreshResponse = await axios.post(config.tokenUrl, {
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        });
      } else if (account.platform === 'tiktok') {
        refreshResponse = await axios.post(`${config.tokenUrl}?client_key=${config.clientId}&grant_type=refresh_token&refresh_token=${refreshToken}`);
      } else {
        // Formato standard per altre piattaforme
        refreshResponse = await axios.post(config.tokenUrl, {
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        });
      }
      
      // Estrai i dati dal refresh
      const responseData = refreshResponse.data;
      const newAccessToken = responseData.access_token;
      const newRefreshToken = responseData.refresh_token || refreshToken; // Alcuni provider non restituiscono un nuovo refresh token
      const expiresIn = responseData.expires_in || 3600;
      
      if (!newAccessToken) {
        throw new Error('Nessun access token ricevuto dal server di autorizzazione');
      }
      
      // Cifra i nuovi token
      const encryptedAccessToken = encrypt(newAccessToken);
      const encryptedRefreshToken = encrypt(newRefreshToken);
      
      // Aggiorna il database
      const updatedAccount = await storage.updateSocialAccount(account.id, {
        token: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry: new Date(Date.now() + (expiresIn * 1000)),
        updatedAt: new Date()
      } as Partial<InsertSocialAccount> & { updatedAt: Date });
      
      // Logging sicuro
      console.log(`Token aggiornato con successo per l'account ${account.id} (${account.platform})`);
      
      return newAccessToken;
    }
    
    // Se il token è scaduto e non abbiamo un refresh token
    if (tokenExpiry && tokenExpiry <= now) {
      throw new Error(`Token scaduto per l'account ${account.id} e nessun refresh token disponibile`);
    }
    
    return token;
  } catch (error: any) {
    console.error(`Errore nell'ottenere un token valido:`, error);
    
    // Aggiorna lo stato dell'account in caso di errore di autenticazione
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      await storage.updateSocialAccount(account.id, {
        isVerified: false,
        updatedAt: new Date()
      } as Partial<InsertSocialAccount> & { updatedAt: Date });
    }
    
    throw new Error(`Impossibile ottenere un token valido: ${error.message || 'Errore sconosciuto'}`);
  }
}

/**
 * Verifica i token di un account social
 */
export async function validateAccountToken(account: SocialAccount): Promise<boolean> {
  try {
    await getValidToken(account);
    return true;
  } catch (error: any) {
    console.error(`Validazione token fallita per l'account ${account.id}:`, error);
    return false;
  }
}

/**
 * Cifra i token sensibili prima del salvataggio nel database
 */
export function prepareAccountForStorage<T extends { token?: string | null, refreshToken?: string | null }>(account: T): T {
  const prepared = { ...account };
  
  // Cifra il token se non è già cifrato
  if (prepared.token && !isEncrypted(prepared.token)) {
    prepared.token = encrypt(prepared.token);
  }
  
  // Cifra il refresh token se presente e non già cifrato
  if (prepared.refreshToken && !isEncrypted(prepared.refreshToken)) {
    prepared.refreshToken = encrypt(prepared.refreshToken);
  }
  
  return prepared;
}