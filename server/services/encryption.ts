import * as crypto from 'crypto';

// Chiave e vettore di inizializzazione dovrebbero essere configurati in modo sicuro
// In un ambiente di produzione, è preferibile utilizzare un servizio KMS (Key Management Service)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'UlsT8BtdwG7OVdhrwq7aK80k'; // 24 byte key
const IV_LENGTH = 16; // AES blocco è 16 bytes

/**
 * Cifra dati sensibili usando AES-256-CBC
 * @param text Testo da cifrare
 * @returns Stringa cifrata in formato: iv:ciphertext (hex)
 */
export function encrypt(text: string): string {
  try {
    // Genera un IV casuale per ogni cifratura
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Crea un cifrario con la chiave e l'IV specificati
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    // Cifra il testo
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Restituisce IV:encrypted per consentire la decifratura
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decifra dati sensibili
 * @param encryptedText Testo cifrato nel formato iv:ciphertext (hex)
 * @returns Testo decifrato
 */
export function decrypt(encryptedText: string): string {
  try {
    // Estrae IV ed il testo cifrato
    const textParts = encryptedText.split(':');
    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedData = textParts[1];
    
    // Crea un decifrario con la chiave e l'IV
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    // Decifra il testo
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Verifica se una stringa è già cifrata
 * @param text Testo da verificare
 * @returns true se il testo è nel formato di cifratura
 */
export function isEncrypted(text: string): boolean {
  // Verifica il formato IV:ciphertext
  if (!text) return false;
  
  const parts = text.split(':');
  if (parts.length !== 2) return false;
  
  // Verifica che la prima parte sia esattamente lunga IV_LENGTH*2 (formato hex)
  const ivHex = parts[0];
  if (ivHex.length !== IV_LENGTH * 2) return false;
  
  // Verifica che entrambe le parti siano in formato hex
  return /^[0-9a-f]+$/i.test(ivHex) && /^[0-9a-f]+$/i.test(parts[1]);
}

/**
 * Cifra i token OAuth nel formato necessario per la persistenza
 * @param tokens Oggetto contenente token di accesso e refresh
 * @returns Oggetto con token cifrati
 */
export function encryptTokens(tokens: { accessToken: string, refreshToken?: string, expiresAt?: number }): { 
  encryptedAccessToken: string,
  encryptedRefreshToken?: string,
  expiresAt?: number
} {
  return {
    encryptedAccessToken: encrypt(tokens.accessToken),
    encryptedRefreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined,
    expiresAt: tokens.expiresAt
  };
}

/**
 * Decifra i token OAuth salvati nel database
 * @param encryptedTokens Oggetto contenente token cifrati
 * @returns Oggetto con token decifrati
 */
export function decryptTokens(encryptedTokens: { 
  encryptedAccessToken: string,
  encryptedRefreshToken?: string,
  expiresAt?: number
}): { 
  accessToken: string,
  refreshToken?: string,
  expiresAt?: number
} {
  return {
    accessToken: decrypt(encryptedTokens.encryptedAccessToken),
    refreshToken: encryptedTokens.encryptedRefreshToken ? decrypt(encryptedTokens.encryptedRefreshToken) : undefined,
    expiresAt: encryptedTokens.expiresAt
  };
}