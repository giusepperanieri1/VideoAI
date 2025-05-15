import { useEffect, useState, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { AppState } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useAuth } from './useAuth';

/**
 * Hook per la gestione delle connessioni WebSocket ottimizzate per mobile
 * - Gestisce riconnessioni in caso di perdita rete o batteria scarica
 * - Si adatta allo stato dell'app (background/foreground)
 * - Ottimizza il consumo di batteria
 */
export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  
  // Riferimenti per gestire lo stato dell'app e della rete
  const appState = useRef(AppState.currentState);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(3000); // 3 secondi iniziali
  
  // Funzione di connessione WebSocket con parametri ottimizzati per mobile
  const connectWebSocket = useCallback(() => {
    try {
      // Pulisci eventuali timeout di riconnessione pendenti
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      
      // URL del WebSocket
      const wsUrl = `${API_BASE_URL.replace(/^http/, 'ws')}/ws`;
      console.log('[Mobile] Connessione WebSocket a:', wsUrl);
      
      // Crea nuova connessione WebSocket
      const ws = new WebSocket(wsUrl);
      
      // Configura eventi WebSocket
      ws.onopen = () => {
        console.log('[Mobile] WebSocket connesso');
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        reconnectDelay.current = 3000; // Reset del delay
        
        // Autenticazione solo se c'è un utente
        if (user?.id) {
          ws.send(JSON.stringify({
            type: 'auth',
            payload: { userId: user.id }
          }));
          console.log('[Mobile] WebSocket autenticato per utente:', user.id);
        }
      };
      
      ws.onerror = (event) => {
        console.error('[Mobile] Errore WebSocket:', event);
        setError(new Error('Errore connessione WebSocket'));
      };
      
      ws.onclose = (event) => {
        console.log('[Mobile] WebSocket disconnesso:', event.code, event.reason);
        setConnected(false);
        
        // Tentativo di riconnessione solo se:
        // - App in foreground
        // - Non abbiamo superato il numero massimo di tentativi
        // - La chiusura non è stata normale (codice 1000)
        if (
          appState.current === 'active' && 
          reconnectAttempts.current < maxReconnectAttempts &&
          event.code !== 1000
        ) {
          console.log(`[Mobile] Tentativo riconnessione ${reconnectAttempts.current + 1}/${maxReconnectAttempts} fra ${reconnectDelay.current}ms`);
          
          // Backoff esponenziale per i tentativi
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 30000); // Max 30s
            setSocket(null); // Forza la ricreazione del socket
          }, reconnectDelay.current);
        }
      };
      
      setSocket(ws);
    } catch (err) {
      console.error('[Mobile] Errore creazione WebSocket:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [user]);
  
  // Gestisce l'avvio e il mantenimento della connessione WebSocket
  useEffect(() => {
    // Avvia la connessione solo se non esiste già
    if (!socket) {
      connectWebSocket();
    }
    
    // Monitora lo stato dell'app (foreground/background)
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      // Rileva passaggio da background a foreground
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        console.log('[Mobile] App tornata in foreground, verifico WebSocket');
        
        // Se il socket non esiste o non è aperto, riconnetti
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          setSocket(null); // Forza la ricreazione
        }
      }
      
      appState.current = nextAppState;
    });
    
    // Monitora cambiamenti nella connettività di rete
    const unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected && !connected && appState.current === 'active') {
        console.log('[Mobile] Rete ripristinata, verifico WebSocket');
        
        // Se socket non aperto, riconnetti
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          setSocket(null); // Forza la ricreazione
        }
      }
    });
    
    // Pulizia
    return () => {
      // Rimuove listeners
      appStateSubscription.remove();
      unsubscribeNetInfo();
      
      // Cancella eventuali tentativi di riconnessione pendenti
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      
      // Chiude il socket se esiste
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'Chiusura controllata');
      }
    };
  }, [socket, connected, connectWebSocket]);
  
  // Riconnette se cambia l'utente
  useEffect(() => {
    if (socket && socket.readyState === WebSocket.OPEN && user?.id) {
      socket.send(JSON.stringify({
        type: 'auth',
        payload: { userId: user.id }
      }));
      console.log('[Mobile] WebSocket riautenticato per cambio utente:', user.id);
    }
  }, [user, socket]);
  
  return { socket, connected, error };
}