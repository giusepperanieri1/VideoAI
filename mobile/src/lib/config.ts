/**
 * Configurazione dell'applicazione VideoGenAI mobile
 */

// Configurazione generale dell'app
export const APP_CONFIG = {
  // URL dell'API - sostituire per ambiente di produzione
  API_URL: 'https://videocentral.replit.app/api',
  
  // Timeout per le richieste API (ms)
  REQUEST_TIMEOUT: 30000,
  
  // Dimensione massima per upload (bytes)
  MAX_UPLOAD_SIZE: 100 * 1024 * 1024, // 100MB
  
  // Numero massimo di progetti per account free
  MAX_FREE_PROJECTS: 5,
  
  // Configurazione per la generazione video
  VIDEO_GENERATION: {
    // Durate predefinite (secondi)
    DEFAULT_DURATIONS: [15, 30, 60, 90, 120],
    
    // Rapporti d'aspetto predefiniti
    DEFAULT_ASPECT_RATIOS: [
      { label: '16:9 (Orizzontale)', value: '16:9' },
      { label: '9:16 (Verticale)', value: '9:16' },
      { label: '1:1 (Quadrato)', value: '1:1' },
      { label: '4:5 (Instagram)', value: '4:5' },
    ],
    
    // Stili predefiniti per la generazione
    DEFAULT_STYLES: [
      { id: 'cinematic', name: 'Cinematico', description: 'Stile cinematografico professionale' },
      { id: 'documentary', name: 'Documentario', description: 'Stile realistico e informativo' },
      { id: 'casual', name: 'Casual', description: 'Stile informale per social media' },
      { id: 'corporate', name: 'Aziendale', description: 'Stile professionale per aziende' },
      { id: 'minimalist', name: 'Minimalista', description: 'Stile semplice ed elegante' },
    ],
    
    // Voci predefinite per il voice-over
    DEFAULT_VOICES: [
      { id: 'it-IT-IsabellaNeural', name: 'Isabella', gender: 'female', locale: 'it-IT' },
      { id: 'it-IT-DiegoNeural', name: 'Diego', gender: 'male', locale: 'it-IT' },
      { id: 'it-IT-ElsaNeural', name: 'Elsa', gender: 'female', locale: 'it-IT' },
      { id: 'en-US-AriaNeural', name: 'Aria (EN)', gender: 'female', locale: 'en-US' },
      { id: 'en-US-GuyNeural', name: 'Guy (EN)', gender: 'male', locale: 'en-US' },
    ],
  },
  
  // Configurazione della cache
  CACHE: {
    // Tempo di scadenza per vari tipi di dati (ms)
    PROJECT_LIST_STALE_TIME: 5 * 60 * 1000, // 5 minuti
    PROJECT_DETAILS_STALE_TIME: 2 * 60 * 1000, // 2 minuti
    RENDERING_STATUS_STALE_TIME: 10 * 1000, // 10 secondi
    ACCOUNTS_STALE_TIME: 10 * 60 * 1000, // 10 minuti
  },
  
  // Piattaforme social supportate
  SOCIAL_PLATFORMS: [
    {
      id: 'youtube',
      name: 'YouTube',
      icon: 'logo-youtube',
      color: '#FF0000',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'logo-facebook',
      color: '#1877F2',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'logo-instagram',
      color: '#E4405F',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: 'logo-twitter',
      color: '#1DA1F2',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: 'musical-notes',
      color: '#000000',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'logo-linkedin',
      color: '#0A66C2',
    },
  ],
};

export default APP_CONFIG;