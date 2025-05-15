import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface WebSocketHook {
  socket: WebSocket | null;
  connected: boolean;
  error: Error | null;
}

export function useWebSocket(): WebSocketHook {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Determina protocollo WebSocket in base a HTTP/HTTPS
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Inizializzazione WebSocket connection a:', wsUrl);
    
    // Crea connessione WebSocket
    const ws = new WebSocket(wsUrl);
    
    // Gestione eventi WebSocket
    ws.addEventListener('open', () => {
      console.log('WebSocket connected');
      setConnected(true);
      setError(null);
      
      // Se l'utente è autenticato, invia l'autenticazione al server WebSocket
      if (user?.id) {
        ws.send(JSON.stringify({
          type: 'auth',
          payload: { userId: user.id }
        }));
        console.log('WebSocket auth inviata per utente:', user.id);
      }
    });
    
    ws.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      setError(new Error('Errore di connessione WebSocket'));
    });
    
    ws.addEventListener('close', (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setConnected(false);
      
      // Tentativo di riconnessione automatica in caso di disconnessione anomala
      if (event.code !== 1000) { // Codice 1000 = chiusura normale
        setTimeout(() => {
          console.log('Tentativo di riconnessione WebSocket...');
          // Il componente verrà smontato e rimontato, triggerando una nuova connessione
          setSocket(null);
        }, 3000);
      }
    });
    
    setSocket(ws);
    
    // Pulizia alla disconnessione
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user]);

  return { socket, connected, error };
}

// Utility per inviare messaggi formattati attraverso la WebSocket
export function sendWebSocketMessage(
  socket: WebSocket | null,
  type: string,
  payload: any
): boolean {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket non connesso');
    return false;
  }
  
  try {
    const message = JSON.stringify({ type, payload });
    socket.send(message);
    return true;
  } catch (error) {
    console.error('Errore nell\'invio del messaggio WebSocket:', error);
    return false;
  }
}

// Funzione per inviare aggiornamento stato rendering
export function sendRenderingStatus(
  socket: WebSocket | null,
  videoId: number,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  progress: number,
  details?: {
    stage?: string;
    message?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    error?: string;
  }
): boolean {
  return sendWebSocketMessage(socket, 'render_update', {
    id: videoId,
    status,
    progress,
    ...details,
    timestamp: new Date().toISOString()
  });
}

// Funzione per registrarsi come interessato agli aggiornamenti di un video specifico
export function subscribeToVideoUpdates(
  socket: WebSocket | null,
  videoId: number
): boolean {
  return sendWebSocketMessage(socket, 'subscribe', { videoId });
}

// Utility per parsare i messaggi WebSocket ricevuti
export function parseWebSocketMessage(event: MessageEvent): { type: string; payload: any } | null {
  try {
    return JSON.parse(event.data);
  } catch (error) {
    console.error('Errore nel parsing del messaggio WebSocket:', error);
    return null;
  }
}

// Interfacce per gli stati di rendering e pubblicazione
export interface RenderStatus {
  id: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  timestamp: string;
}

export interface PublishStatus {
  id: number;
  platformName: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  title: string;
  platformVideoUrl?: string;
  error?: string;
  timestamp: string;
}

// Hook per monitorare gli aggiornamenti di rendering
export function useRenderNotifications() {
  const [renderUpdates, setRenderUpdates] = useState<RenderStatus[]>([]);
  const { socket, connected } = useWebSocket();
  const [error, setError] = useState<Error | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = parseWebSocketMessage(event);
      if (!data) return;

      if (data.type === 'render_update') {
        setRenderUpdates(prev => {
          // Aggiungi o aggiorna lo stato
          const exists = prev.some(update => update.id === data.payload.id);
          if (exists) {
            return prev.map(update => 
              update.id === data.payload.id ? { ...update, ...data.payload } : update
            );
          } else {
            return [...prev, data.payload];
          }
        });
      }
    } catch (err) {
      console.error('Errore nell\'elaborazione degli aggiornamenti di rendering:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  useEffect(() => {
    if (!socket || !connected) return;

    // L'autenticazione è già gestita nel hook principale useWebSocket
    
    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, connected, handleMessage]);

  return { renderUpdates, error };
}

// Hook per monitorare gli aggiornamenti di pubblicazione
export function usePublishNotifications() {
  const [publishUpdates, setPublishUpdates] = useState<PublishStatus[]>([]);
  const { socket, connected } = useWebSocket();
  const [error, setError] = useState<Error | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = parseWebSocketMessage(event);
      if (!data) return;

      if (data.type === 'publish_update') {
        setPublishUpdates(prev => {
          // Aggiungi o aggiorna lo stato
          const exists = prev.some(update => update.id === data.payload.id);
          if (exists) {
            return prev.map(update => 
              update.id === data.payload.id ? { ...update, ...data.payload } : update
            );
          } else {
            return [...prev, data.payload];
          }
        });
      }
    } catch (err) {
      console.error('Errore nell\'elaborazione degli aggiornamenti di pubblicazione:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  useEffect(() => {
    if (!socket || !connected) return;

    // L'autenticazione è già gestita nel hook principale useWebSocket
    
    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, connected, handleMessage]);

  return { publishUpdates, error };
}