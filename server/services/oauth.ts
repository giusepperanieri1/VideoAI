/**
 * Servizio OAuth per l'autenticazione con piattaforme social
 * Questo servizio gestisce il flusso di autenticazione OAuth2 con le diverse piattaforme
 */

import axios from 'axios';
import crypto from 'crypto';
import { InsertSocialAccount } from '@shared/schema';
import { prepareAccountForStorage } from './tokenManager';

// Configurazione OAuth per diverse piattaforme
export const oauthConfig: Record<string, {
  clientId: string | undefined;
  clientSecret: string | undefined;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}> = {
  youtube: {
    clientId: process.env.YOUTUBE_OAUTH_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET,
    scopes: ['https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/youtube.upload'],
    authUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true'
  },
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_KEY,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    scopes: ['user.info.basic', 'video.upload', 'video.publish'],
    authUrl: 'https://open-api.tiktok.com/platform/oauth/connect/',
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    userInfoUrl: 'https://open-api.tiktok.com/user/info/'
  },
  // Aggiungere qui altre piattaforme
};

/**
 * Genera un URL di autorizzazione OAuth per la piattaforma specificata
 * @param platform Nome della piattaforma (youtube, tiktok, ecc.)
 * @param redirectUri URI di callback dopo l'autenticazione
 * @param userId ID dell'utente che sta effettuando l'autenticazione
 * @returns Oggetto con l'URL di autorizzazione e il state generato
 */
export function generateAuthUrl(platform: string, redirectUri: string, userId: string): { url: string, state: string } {
  const config = oauthConfig[platform];
  if (!config) {
    throw new Error(`Piattaforma non supportata: ${platform}`);
  }
  
  if (!config.clientId) {
    throw new Error(`ID client OAuth non configurato per ${platform}`);
  }

  // Genera un state casuale per prevenire CSRF
  const state = crypto.randomBytes(20).toString('hex');
  
  // Costruisce l'URL di autorizzazione in base alla piattaforma
  let authUrl = '';
  const scopeString = config.scopes.join(' ');
  
  if (platform === 'youtube') {
    // Per YouTube (Google)
    authUrl = `${config.authUrl}?` + 
      `client_id=${encodeURIComponent(config.clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopeString)}` +
      `&state=${encodeURIComponent(state)}` +
      `&response_type=code` +
      `&access_type=offline` +
      `&prompt=consent`; // Force to always show consent screen
  } else if (platform === 'tiktok') {
    // Per TikTok
    authUrl = `${config.authUrl}?` + 
      `client_key=${encodeURIComponent(config.clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopeString)}` +
      `&state=${encodeURIComponent(state)}` +
      `&response_type=code`;
  } else {
    // Formato generico per altre piattaforme
    authUrl = `${config.authUrl}?` + 
      `client_id=${encodeURIComponent(config.clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopeString)}` +
      `&state=${encodeURIComponent(state)}` +
      `&response_type=code`;
  }
  
  return { url: authUrl, state };
}

/**
 * Scambia il codice di autorizzazione con un token di accesso
 * @param platform Nome della piattaforma
 * @param code Codice di autorizzazione ricevuto dal provider OAuth
 * @param redirectUri URI di callback usato nella richiesta iniziale
 * @returns Promise con i token di accesso
 */
export async function exchangeCodeForToken(platform: string, code: string, redirectUri: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  openId?: string;  // Per TikTok
}> {
  const config = oauthConfig[platform];
  if (!config) {
    throw new Error(`Piattaforma non supportata: ${platform}`);
  }
  
  if (!config.clientId || !config.clientSecret) {
    throw new Error(`Credenziali OAuth non configurate per ${platform}`);
  }
  
  try {
    let tokenResponse;
    
    if (platform === 'youtube') {
      // Per YouTube (Google)
      tokenResponse = await axios.post(config.tokenUrl, {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });
    } else if (platform === 'tiktok') {
      // Per TikTok
      tokenResponse = await axios.post(`${config.tokenUrl}`, {
        client_key: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code'
      });
      
      // TikTok ha una struttura di risposta diversa
      if (tokenResponse.data.data) {
        tokenResponse.data = {
          access_token: tokenResponse.data.data.access_token,
          expires_in: tokenResponse.data.data.expires_in,
          refresh_token: tokenResponse.data.data.refresh_token,
          open_id: tokenResponse.data.data.open_id
        };
      }
    } else {
      // Formato generico per altre piattaforme
      tokenResponse = await axios.post(config.tokenUrl, {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });
    }
    
    // Estrai openId per TikTok, se presente
    let openId;
    if (platform === 'tiktok' && tokenResponse.data.data && tokenResponse.data.data.open_id) {
      openId = tokenResponse.data.data.open_id;
    }

    return {
      accessToken: tokenResponse.data.access_token || (tokenResponse.data.data ? tokenResponse.data.data.access_token : null),
      refreshToken: tokenResponse.data.refresh_token || (tokenResponse.data.data ? tokenResponse.data.data.refresh_token : null),
      expiresIn: tokenResponse.data.expires_in || (tokenResponse.data.data ? tokenResponse.data.data.expires_in : 3600),
      openId
    };
  } catch (error: any) {
    console.error(`Errore nello scambio del codice per token (${platform}):`, error.response?.data || error.message);
    throw new Error(`Impossibile ottenere token: ${error.response?.data?.error_description || error.message}`);
  }
}

/**
 * Ottiene le informazioni dell'account utente dalla piattaforma
 * @param platform Nome della piattaforma
 * @param accessToken Token di accesso OAuth
 * @returns Promise con i dati dell'account
 */
export async function getUserInfo(platform: string, accessToken: string, openId?: string): Promise<{
  accountId: string; 
  accountName: string;
  profileImageUrl?: string;
  followerCount?: number;
}> {
  const config = oauthConfig[platform];
  if (!config) {
    throw new Error(`Piattaforma non supportata: ${platform}`);
  }
  
  try {
    let userInfoResponse;
    
    if (platform === 'youtube') {
      // Per YouTube
      userInfoResponse = await axios.get(config.userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const channel = userInfoResponse.data.items[0];
      if (!channel) {
        throw new Error("Nessun canale YouTube trovato per questo account");
      }
      
      return {
        accountId: channel.id,
        accountName: channel.snippet.title,
        profileImageUrl: channel.snippet.thumbnails?.default?.url,
        followerCount: parseInt(channel.statistics?.subscriberCount) || 0
      };
    } else if (platform === 'tiktok') {
      // Per TikTok è necessario l'open_id
      if (!openId) {
        throw new Error("Open ID mancante per TikTok");
      }
      
      userInfoResponse = await axios.get(`${config.userInfoUrl}?open_id=${openId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const userData = userInfoResponse.data.data;
      if (!userData) {
        throw new Error("Nessuna informazione utente restituita da TikTok");
      }
      
      return {
        accountId: userData.open_id,
        accountName: userData.display_name || userData.username || 'TikTok User',
        profileImageUrl: userData.avatar_url,
        followerCount: userData.follower_count || 0
      };
    } else {
      throw new Error(`Implementazione getUserInfo mancante per la piattaforma: ${platform}`);
    }
  } catch (error: any) {
    console.error(`Errore nell'ottenere informazioni utente (${platform}):`, error.response?.data || error.message);
    throw new Error(`Impossibile ottenere informazioni utente: ${error.response?.data?.error_description || error.message}`);
  }
}

/**
 * Crea un oggetto account sociale pronto per essere salvato nel database
 * @param platform Nome della piattaforma
 * @param userId ID dell'utente proprietario dell'account
 * @param userInfo Informazioni dell'account ottenute dall'API
 * @param tokens Token di accesso e refresh
 * @returns Oggetto account sociale con token cifrati
 */
export function createSocialAccountObject(
  platform: string,
  userId: string,
  userInfo: {
    accountId: string;
    accountName: string;
    profileImageUrl?: string;
    followerCount?: number;
  },
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }
): InsertSocialAccount {
  const accountData: InsertSocialAccount = {
    userId,
    platform,
    accountId: userInfo.accountId,
    accountName: userInfo.accountName,
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenExpiry: new Date(Date.now() + (tokens.expiresIn * 1000)),
    isActive: true,
    isVerified: true,
    profileImageUrl: userInfo.profileImageUrl,
    followerCount: userInfo.followerCount
  };
  
  // Prepara l'account con token cifrati per il salvataggio
  return prepareAccountForStorage(accountData) as InsertSocialAccount;
}