/**
 * Utilità per la sicurezza dell'applicazione
 * Gestisce validazione input, protezione token e funzioni di sicurezza generali
 */

import crypto from 'crypto';
import { storage } from '../storage';
import { encrypt, decrypt, isEncrypted } from './encryption';
import { decryptTokens } from './encryption';
import { z } from 'zod';

/**
 * Valida e sanitizza l'input dell'utente per prevenire iniezioni
 * @param input Stringa da sanitizzare
 * @returns Stringa sanitizzata
 */
export function sanitizeInput(input: string): string {
  // Rimuovi caratteri potenzialmente pericolosi
  return input
    .replace(/[<>]/g, '') // Rimuovi < > per evitare XSS
    .trim();
}

/**
 * Genera una password sicura per uso interno
 * @param length Lunghezza della password
 * @returns Password generata
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
  let password = '';
  
  // Usa metodi crittograficamente sicuri per generare password
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % charset.length;
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Verifica token scaduti e li rimuove o ruota
 * @param daysThreshold Soglia in giorni per considerare un token "vecchio"
 */
export async function rotateExpiredTokens(daysThreshold: number = 30): Promise<void> {
  try {
    // In un'implementazione reale, qui prenderebbe tutti gli account con token
    // che stanno per scadere e li ruoterebbe automaticamente
    
    // Esempio di implementazione:
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - (daysThreshold * 24 * 60 * 60 * 1000));
    
    // TODO: Implementare la logica effettiva per ottenere e ruotare i token
    // In una vera implementazione, qui farei una query per prendere gli account
    // con token che stanno per scadere
    
    console.log(`Controllo token più vecchi di ${thresholdDate.toISOString()}`);
  } catch (error) {
    console.error('Errore durante la rotazione dei token:', error);
  }
}

/**
 * Revoca tutte le autorizzazioni per un utente su una piattaforma specifica
 * @param userId ID dell'utente
 * @param platform Piattaforma (es. "youtube", "tiktok")
 */
export async function revokeAuthorization(userId: string, platformAccountId: number): Promise<boolean> {
  try {
    // Ottieni l'account dell'utente
    const account = await storage.getSocialAccount(platformAccountId);
    
    // Verifica che l'account esista e appartenga all'utente
    if (!account || account.userId.toString() !== userId) {
      return false;
    }
    
    // Prepara i dati per l'aggiornamento
    const updateData = {
      isActive: false,
      token: null, // Rimuoviamo i token
      refreshToken: null,
      updatedAt: new Date()
    };
    
    // Aggiorna l'account
    await storage.updateSocialAccount(platformAccountId, updateData);
    
    // In un'implementazione reale, qui faremmo anche una chiamata all'API
    // della piattaforma per revocare effettivamente l'accesso
    
    return true;
  } catch (error) {
    console.error('Errore durante la revoca dell\'autorizzazione:', error);
    return false;
  }
}

/**
 * Genera una stringa CSRF sicura per proteggere le richieste
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Crea un validatore che controlla i campi in base al loro tipo
 * @param schema Schema Zod da utilizzare per la validazione
 */
export function createValidator<T>(schema: z.ZodType<T>) {
  return (data: unknown): { success: true, data: T } | { success: false, errors: z.ZodError } => {
    try {
      const validData = schema.parse(data);
      return { success: true, data: validData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error };
      }
      throw error;
    }
  };
}

/**
 * Verifica che un URL sia sicuro (non punti a domini pericolosi)
 * @param url URL da verificare
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Lista di domini consentiti
    const allowedDomains = [
      'youtube.com',
      'youtu.be',
      'tiktok.com',
      // Aggiungi altri domini sicuri qui
    ];
    
    // Verifica che il dominio sia nella lista dei domini consentiti
    return allowedDomains.some(domain => parsedUrl.hostname.endsWith(domain));
  } catch (error) {
    return false;
  }
}