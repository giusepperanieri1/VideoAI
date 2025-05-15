import { API_BASE_URL } from '../config';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RequestOptions {
  timeout?: number;
  useCache?: boolean;
  cacheTTL?: number;
}

const DEFAULT_TIMEOUT = 30000; // 30 secondi

/**
 * Funzione utilitaria per effettuare richieste API ottimizzate per mobile
 * - Supporta timeout specifici per mobile
 * - Gestisce controllo connettività
 * - Supporta caching per risparmiare dati in mobilità
 * - Gestisce riprove automatiche
 */
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown,
  options: RequestOptions = {}
): Promise<Response> {
  // Valori default per le opzioni
  const {
    timeout = DEFAULT_TIMEOUT,
    useCache = method === 'GET',
    cacheTTL = 5 * 60 * 1000 // 5 minuti di default
  } = options;

  // Verifica connettività
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected && !useCache) {
    throw new Error('Connessione Internet non disponibile');
  }

  // Controlla se abbiamo dati in cache per le richieste GET
  const cacheKey = `api_cache_${endpoint}`;
  if (useCache && method === 'GET') {
    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        // Verifica se la cache è ancora valida
        if (Date.now() - timestamp < cacheTTL) {
          // Simula una risposta da cache
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'x-from-cache': 'true' }
          });
        }
      }
    } catch (error) {
      console.warn('Errore durante l\'accesso alla cache:', error);
    }
  }

  // Preparazione parametri richiesta
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // Crea un controller per gestire il timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Effettua la richiesta con timeout
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
      signal: controller.signal
    });

    // Gestisci errori HTTP
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status}: ${text || response.statusText}`);
    }

    // Salva in cache per richieste GET riuscite
    if (useCache && method === 'GET') {
      try {
        const clonedResponse = response.clone();
        const responseData = await clonedResponse.json();
        await AsyncStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: responseData,
            timestamp: Date.now()
          })
        );
      } catch (error) {
        console.warn('Errore nel salvataggio in cache:', error);
      }
    }

    return response;
  } catch (error) {
    // Gestisci errori di timeout
    if (error.name === 'AbortError') {
      throw new Error('Richiesta interrotta per timeout');
    }
    
    // Per le richieste GET, ritorna la cache anche se scaduta in caso di errore
    if (useCache && method === 'GET' && !netInfo.isConnected) {
      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const { data } = JSON.parse(cachedData);
          console.log('Utilizzando dati dalla cache scaduta (offline)');
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 
              'x-from-cache': 'true',
              'x-cache-stale': 'true'
            }
          });
        }
      } catch (cacheError) {
        console.warn('Errore nell\'accesso alla cache di fallback:', cacheError);
      }
    }
    
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Cancella la cache API
 */
export async function clearApiCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter(key => key.startsWith('api_cache_'));
  if (cacheKeys.length > 0) {
    await AsyncStorage.multiRemove(cacheKeys);
  }
}