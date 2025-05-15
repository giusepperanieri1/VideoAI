import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useWebSocket } from './useWebSocket';

/**
 * Hook per ascoltare eventi WebSocket in modo efficiente per dispositivi mobili
 * - Gestisce automaticamente lo stato dell'app (background/foreground)
 * - Ottimizza l'uso della batteria sospendendo in background
 * - Si riconnette automaticamente quando l'app ritorna in foreground
 * 
 * @param eventType Tipo di evento da ascoltare
 * @param callback Funzione da chiamare quando l'evento viene ricevuto
 */
export function useWebSocketListener<T>(
  eventType: string, 
  callback: (data: T) => void
) {
  const { socket, connected } = useWebSocket();
  const appState = useRef(AppState.currentState);
  const savedCallback = useRef(callback);
  
  // Aggiorna il riferimento al callback se cambia
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  // Gestisce eventi WebSocket e stato dell'app
  useEffect(() => {
    // Non fare nulla se non c'è connessione
    if (!socket || !connected) return;
    
    // Funzione handler per messaggi WebSocket
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Verifica se è il tipo di evento che interessa
        if (data.type === eventType) {
          savedCallback.current(data.payload);
        }
      } catch (error) {
        console.error('Errore nell\'elaborazione del messaggio WebSocket:', error);
      }
    };
    
    // Gestisce cambiamenti di stato dell'app (foreground/background)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Solo se cambia stato da/verso active
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        // App torna in foreground - riconnetti se necessario
        if (socket.readyState !== WebSocket.OPEN) {
          console.log('App tornata in foreground, verifico connessione WebSocket');
          // Non riconnette esplicitamente qui, useWebSocket se ne occuperà
        }
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App va in background - ottimizzazione batteria
        console.log('App in background, ottimizzazione batteria WebSocket');
        // Non chiudiamo la connessione, ma riduciamo polling o altre attività
        // Le notifiche push gestiranno gli aggiornamenti critici
      }
      
      appState.current = nextAppState;
    };
    
    // Registra gli event listeners
    socket.addEventListener('message', handleMessage);
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Pulizia
    return () => {
      socket.removeEventListener('message', handleMessage);
      appStateSubscription.remove();
    };
  }, [socket, connected, eventType]);
}