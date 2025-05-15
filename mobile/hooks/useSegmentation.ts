import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { SegmentationRequest, SegmentationStatus } from '../types/schema';
import { useWebSocketListener } from './useWebSocketListener';

// Parametri per la mutazione di richiesta segmentazione
interface SegmentationRequestParams {
  videoId: number;
  videoUrl: string;
  options?: {
    language?: string;
    minSegmentDuration?: number;
    maxSegmentDuration?: number;
  };
}

/**
 * Hook per richiedere la segmentazione AI di un video
 * - Ottimizzato per mobile con retry limitati
 * - Gestione batteria efficiente
 */
export function useSegmentationMutation() {
  const queryClient = useQueryClient();
  
  return useMutation<SegmentationRequest, Error, SegmentationRequestParams>({
    mutationFn: async (params) => {
      const { videoId, videoUrl, options = {} } = params;
      
      const response = await apiRequest('POST', '/api/video/segment', {
        videoId,
        videoUrl,
        language: options.language || 'it',
        minSegmentDuration: options.minSegmentDuration || 5,
        maxSegmentDuration: options.maxSegmentDuration || 30,
      });
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalida la query per lo status della segmentazione per forzarne l'aggiornamento
      queryClient.invalidateQueries({
        queryKey: ['segmentation-status', data.id]
      });
      
      // Aggiorna la cache dei progetti se necessario
      queryClient.invalidateQueries({
        queryKey: ['project', data.videoId]
      });
    },
    // Opzioni ottimizzate per mobile:
    retry: 1, // Limita i tentativi per risparmiare batteria
    networkMode: 'offlineFirst', // Migliore gestione offline
  });
}

/**
 * Hook per ottenere lo stato corrente di una richiesta di segmentazione
 * - Usa polling a bassa frequenza (risparmio batteria)
 * - Si integra con WebSocket quando disponibili
 */
export function useSegmentationStatus(requestId: number | undefined) {
  const queryClient = useQueryClient();
  
  // Registra listener WebSocket per aggiornamenti in tempo reale
  useWebSocketListener('segmentation_update', (data) => {
    if (data.id === requestId) {
      queryClient.setQueryData(['segmentation-status', requestId], data);
    }
  });
  
  return useQuery<SegmentationStatus>({
    queryKey: ['segmentation-status', requestId],
    queryFn: async () => {
      if (!requestId) throw new Error('ID richiesta necessario');
      
      const response = await apiRequest('GET', `/api/video/segment/status/${requestId}`);
      return await response.json();
    },
    enabled: !!requestId,
    refetchInterval: (data) => {
      // Riduce la frequenza di polling in base allo stato
      // Risparmia batteria su mobile una volta che il processo è in corso
      if (!data) return 5000; // 5 secondi se non abbiamo dati
      if (data.status === 'completed' || data.status === 'failed') return false; // Nessun polling se completato
      if (data.status === 'processing') return 10000; // 10 secondi durante elaborazione
      return 5000; // 5 secondi per stati di coda
    },
    staleTime: 2000, // Breve stale time per avere UI reattiva
  });
}