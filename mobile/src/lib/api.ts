import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { QueryClient } from '@tanstack/react-query';
import { APP_CONFIG } from './config';
import { useAuth } from '../hooks/useAuth';

// Definizione del tipo per gli errori API
export interface ApiError {
  status: number;
  message: string;
  data?: any;
}

// Client API personalizzato
const apiClient = axios.create({
  baseURL: APP_CONFIG.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondi di timeout
});

// Interceptor per aggiungere il token di autenticazione alle richieste
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Ottieni il token dallo storage
      const tokensString = await SecureStore.getItemAsync('auth_tokens');
      
      if (tokensString) {
        const tokens = JSON.parse(tokensString);
        
        // Verifica se il token è ancora valido
        const now = Math.floor(Date.now() / 1000);
        
        if (tokens.expiresAt > now) {
          // Aggiunge il token all'header Authorization
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        } else {
          // Token scaduto, potrebbe essere refreshato automaticamente nell'hook useAuth
          // Questo viene gestito a livello di applicazione, non qui
        }
      }
      
      return config;
    } catch (error) {
      console.error('Errore nella preparazione della richiesta:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Interceptor per gestire le risposte
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Gestione degli errori di rete
    if (!error.response) {
      return Promise.reject({
        status: 0,
        message: 'Errore di rete. Controlla la tua connessione ad internet.',
      } as ApiError);
    }
    
    // Gestione degli errori di autenticazione
    if (error.response.status === 401) {
      // Gestione automatica del refresh token avviene in useAuth
      // Qui gestiamo solo l'errore di ritorno
      return Promise.reject({
        status: 401,
        message: 'Sessione scaduta. Effettua nuovamente il login.',
      } as ApiError);
    }
    
    // Altri errori API
    return Promise.reject({
      status: error.response.status,
      message: error.response.data?.message || 'Si è verificato un errore imprevisto.',
      data: error.response.data,
    } as ApiError);
  }
);

// Funzione per creare un client di query
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minuti
        cacheTime: 10 * 60 * 1000, // 10 minuti
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      },
    },
  });
};

// API per progetti
export const fetchProjects = async (options?: { limit?: number; sort?: string }) => {
  try {
    let url = '/api/projects';
    const params: Record<string, any> = {};
    
    if (options?.limit) {
      params.limit = options.limit;
    }
    
    if (options?.sort) {
      params.sort = options.sort;
    }
    
    const response = await apiClient.get(url, { params });
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero dei progetti:', error);
    throw error;
  }
};

export const fetchProject = async (id: number) => {
  try {
    const response = await apiClient.get(`/api/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Errore nel recupero del progetto ${id}:`, error);
    throw error;
  }
};

export const createProject = async (projectData: any) => {
  try {
    const response = await apiClient.post('/api/projects', projectData);
    return response.data;
  } catch (error) {
    console.error('Errore nella creazione del progetto:', error);
    throw error;
  }
};

export const updateProject = async (id: number, projectData: any) => {
  try {
    const response = await apiClient.patch(`/api/projects/${id}`, projectData);
    return response.data;
  } catch (error) {
    console.error(`Errore nell'aggiornamento del progetto ${id}:`, error);
    throw error;
  }
};

export const deleteProject = async (id: number) => {
  try {
    const response = await apiClient.delete(`/api/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Errore nell'eliminazione del progetto ${id}:`, error);
    throw error;
  }
};

// API per creazione video AI
export const createVideo = async (videoData: any) => {
  try {
    const response = await apiClient.post('/api/videos', videoData);
    return response.data;
  } catch (error) {
    console.error('Errore nella creazione del video:', error);
    throw error;
  }
};

// API per lo stato di rendering
export const fetchRenderingStatus = async () => {
  try {
    const response = await apiClient.get('/api/videos/rendering-status');
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero dello stato di rendering:', error);
    throw error;
  }
};

// API per generazione di voiceover
export const generateVoiceOver = async (voiceOverData: { text: string, voice: string }) => {
  try {
    const response = await apiClient.post('/api/voiceover', voiceOverData);
    return response.data;
  } catch (error) {
    console.error('Errore nella generazione del voiceover:', error);
    throw error;
  }
};

// API per gli asset
export const fetchAssetsByUserId = async (userId: string | number) => {
  try {
    const response = await apiClient.get(`/api/assets`, { params: { userId } });
    return response.data;
  } catch (error) {
    console.error(`Errore nel recupero degli asset per l'utente ${userId}:`, error);
    throw error;
  }
};

// API per timeline items
export const fetchTimelineItems = async (projectId: number) => {
  try {
    const response = await apiClient.get(`/api/projects/${projectId}/timeline`);
    return response.data;
  } catch (error) {
    console.error(`Errore nel recupero degli elementi della timeline per il progetto ${projectId}:`, error);
    throw error;
  }
};

export const createTimelineItem = async (projectId: number, itemData: any) => {
  try {
    const response = await apiClient.post(`/api/projects/${projectId}/timeline`, itemData);
    return response.data;
  } catch (error) {
    console.error(`Errore nella creazione di un elemento della timeline per il progetto ${projectId}:`, error);
    throw error;
  }
};

export const updateTimelineItem = async (itemId: number, itemData: any) => {
  try {
    const response = await apiClient.patch(`/api/timeline-items/${itemId}`, itemData);
    return response.data;
  } catch (error) {
    console.error(`Errore nell'aggiornamento dell'elemento della timeline ${itemId}:`, error);
    throw error;
  }
};

export const deleteTimelineItem = async (itemId: number) => {
  try {
    const response = await apiClient.delete(`/api/timeline-items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error(`Errore nell'eliminazione dell'elemento della timeline ${itemId}:`, error);
    throw error;
  }
};

// API per account social
export const fetchSocialAccounts = async () => {
  try {
    const response = await apiClient.get('/api/social-accounts');
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero degli account social:', error);
    throw error;
  }
};

export const connectSocialAccount = async (provider: string) => {
  try {
    const response = await apiClient.post(`/api/social-accounts/connect/${provider}`);
    return response.data;
  } catch (error) {
    console.error(`Errore nella connessione dell'account social ${provider}:`, error);
    throw error;
  }
};

export const disconnectSocialAccount = async (accountId: number) => {
  try {
    const response = await apiClient.delete(`/api/social-accounts/${accountId}`);
    return response.data;
  } catch (error) {
    console.error(`Errore nella disconnessione dell'account social ${accountId}:`, error);
    throw error;
  }
};

// API per il profilo utente
export const fetchUserProfile = async () => {
  try {
    const response = await apiClient.get('/api/user/profile');
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero del profilo utente:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileData: any) => {
  try {
    const response = await apiClient.patch('/api/user/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiornamento del profilo utente:', error);
    throw error;
  }
};

// API per la pubblicazione di video su piattaforme social
export const publishVideoToSocial = async (videoId: number, socialData: any) => {
  try {
    const response = await apiClient.post(`/api/videos/${videoId}/publish`, socialData);
    return response.data;
  } catch (error) {
    console.error(`Errore nella pubblicazione del video ${videoId} su social:`, error);
    throw error;
  }
};

// API per la cronologia delle pubblicazioni
export const fetchPublishingHistory = async () => {
  try {
    const response = await apiClient.get('/api/social/publishing-history');
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero della cronologia delle pubblicazioni:', error);
    throw error;
  }
};

// API per le impostazioni utente
export const updateUserSettings = async (settings: any) => {
  try {
    const response = await apiClient.patch('/api/user/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiornamento delle impostazioni utente:', error);
    throw error;
  }
};

// API per l'esportazione dei dati utente (GDPR)
export const exportUserData = async () => {
  try {
    const response = await apiClient.post('/api/gdpr/export-data');
    return response.data;
  } catch (error) {
    console.error('Errore nell\'esportazione dei dati utente:', error);
    throw error;
  }
};

// API per l'eliminazione dell'account (GDPR)
export const deleteUserAccount = async () => {
  try {
    const response = await apiClient.post('/api/gdpr/delete-account');
    return response.data;
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'account utente:', error);
    throw error;
  }
};

// API per le statistiche utente
export const fetchUserStats = async () => {
  try {
    const response = await apiClient.get('/api/user/stats');
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero delle statistiche utente:', error);
    throw error;
  }
};

// Wrapper per caricare file
export const uploadFile = async (file: FormData, progressCallback?: (progress: number) => void) => {
  try {
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressCallback 
        ? (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            progressCallback(percentCompleted);
          }
        : undefined,
    };
    
    const response = await apiClient.post('/api/upload', file, config);
    return response.data;
  } catch (error) {
    console.error('Errore nel caricamento del file:', error);
    throw error;
  }
};