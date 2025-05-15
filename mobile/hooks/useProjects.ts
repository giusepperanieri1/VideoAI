import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { Project } from '../types/schema';

interface UseProjectsOptions {
  page?: number;
  limit?: number;
  userId?: string;
}

/**
 * Hook per recuperare i progetti con paginazione ottimizzata per mobile
 */
export function useProjects(options: UseProjectsOptions = {}) {
  const { page = 1, limit = 10, userId } = options;
  
  return useQuery<Project[]>({
    queryKey: ['projects', { page, limit, userId }],
    queryFn: async () => {
      // Costruisci parametri di query
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (userId) params.append('userId', userId);
      
      // Fai richiesta API con timeout ridotto per migliorare UX mobile
      const response = await apiRequest(
        'GET', 
        `/api/projects?${params.toString()}`,
        undefined,
        { timeout: 10000 } // 10 secondi di timeout per dispositivi mobili
      );
      
      return await response.json();
    },
    // Ottimizzazioni per mobile
    staleTime: 5 * 60 * 1000, // 5 minuti di cache per ridurre traffico di rete
    keepPreviousData: true, // Mantieni dati precedenti durante il caricamento delle nuove pagine
    refetchOnWindowFocus: false, // Disabilita refetch automatico per risparmiare dati
  });
}

/**
 * Hook per recuperare un singolo progetto
 */
export function useProject(projectId: number | undefined) {
  return useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('ID progetto richiesto');
      
      const response = await apiRequest('GET', `/api/projects/${projectId}`);
      return await response.json();
    },
    // Non eseguire la query se non c'è un ID
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minuti di cache
  });
}