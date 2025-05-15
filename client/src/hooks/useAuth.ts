import { useQuery } from "@tanstack/react-query";

export interface User {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    // Utilizziamo opzioni ottimizzate per gestire l'autenticazione
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 60000 // Mantiene fresco per 60 secondi
  });

  // Per debugging, commentiamo in produzione
  // console.log("Auth state:", { user, isLoading, error, isAuthenticated: !!user });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}