import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { APP_CONFIG } from '../lib/config';

// WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

// Context per l'autenticazione
const AuthContext = createContext<AuthContextType | null>(null);

// Token storage keys
const TOKEN_KEY = 'auth_tokens';
const USER_KEY = 'auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Inizializza lo stato di autenticazione all'avvio dell'app
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Verifica se ci sono token salvati
        const tokensString = await SecureStore.getItemAsync(TOKEN_KEY);
        const userString = await SecureStore.getItemAsync(USER_KEY);
        
        if (tokensString && userString) {
          const tokens: TokenData = JSON.parse(tokensString);
          const userData: User = JSON.parse(userString);
          
          // Verifica se il token è ancora valido
          const now = Math.floor(Date.now() / 1000);
          
          if (tokens.expiresAt > now) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Token scaduto, tenta di refreshare
            try {
              const newTokens = await refreshTokens(tokens.refreshToken);
              if (newTokens) {
                setUser(newTokens.user);
                setIsAuthenticated(true);
                await saveTokens(newTokens);
              } else {
                // Refresh fallito, pulisci i dati
                await clearAuthData();
              }
            } catch (error) {
              console.error('Errore nel refresh del token:', error);
              await clearAuthData();
            }
          }
        }
      } catch (error) {
        console.error('Errore nell\'inizializzazione dell\'autenticazione:', error);
        await clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Effettua il login reindirizzando al server di autenticazione
  const login = async () => {
    try {
      setIsLoading(true);
      
      // Costruisce l'URL di reindirizzamento dopo il login
      const redirectUrl = Linking.createURL('auth/callback');
      
      // Costruisce l'URL di login
      const authUrl = `${APP_CONFIG.API_URL}/api/login?redirect=${encodeURIComponent(redirectUrl)}`;
      
      // Apre il browser per il processo di login
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      
      if (result.type === 'success') {
        // Estrai il token dall'URL di callback
        const { queryParams } = Linking.parse(result.url);
        
        if (queryParams && queryParams.token) {
          const token = queryParams.token as string;
          
          // Decodifica il token per ottenere le informazioni dell'utente
          const decoded: any = jwtDecode(token);
          
          // Estrai i dati dell'utente dal token
          const userData: User = {
            id: decoded.sub,
            email: decoded.email,
            firstName: decoded.first_name,
            lastName: decoded.last_name,
            profileImageUrl: decoded.profile_image_url,
          };
          
          // Salva i dati di autenticazione
          const tokenData: TokenData = {
            accessToken: token,
            refreshToken: queryParams.refresh_token as string,
            expiresAt: decoded.exp,
            user: userData,
          };
          
          await saveTokens(tokenData);
          
          setUser(userData);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Errore durante il login:', error);
      Alert.alert('Errore di autenticazione', 'Si è verificato un problema durante il login. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Effettua il logout
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Richiesta al server per invalidare il token (opzionale)
      const tokensString = await SecureStore.getItemAsync(TOKEN_KEY);
      if (tokensString) {
        const tokens: TokenData = JSON.parse(tokensString);
        
        // Chiama l'endpoint di logout sul server
        const logoutUrl = `${APP_CONFIG.API_URL}/api/logout`;
        await fetch(logoutUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
        });
      }
      
      // Pulisci i dati di autenticazione
      await clearAuthData();
      
    } catch (error) {
      console.error('Errore durante il logout:', error);
    } finally {
      // Anche in caso di errore, pulisci comunque lo stato locale
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Ottiene il token di autenticazione per le richieste API
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const tokensString = await SecureStore.getItemAsync(TOKEN_KEY);
      
      if (!tokensString) {
        return null;
      }
      
      const tokens: TokenData = JSON.parse(tokensString);
      const now = Math.floor(Date.now() / 1000);
      
      // Se il token è ancora valido, restituiscilo
      if (tokens.expiresAt > now) {
        return tokens.accessToken;
      }
      
      // Altrimenti tenta di refreshare il token
      const newTokens = await refreshTokens(tokens.refreshToken);
      
      if (newTokens) {
        await saveTokens(newTokens);
        return newTokens.accessToken;
      }
      
      // Se il refresh fallisce, pulisci i dati e restituisci null
      await clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      
      return null;
    } catch (error) {
      console.error('Errore nell\'ottenere il token:', error);
      return null;
    }
  };

  // Salva i dati di autenticazione
  const saveTokens = async (tokenData: TokenData) => {
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokenData));
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(tokenData.user));
  };

  // Pulisce i dati di autenticazione
  const clearAuthData = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  };

  // Esegue il refresh dei token
  const refreshTokens = async (refreshToken: string): Promise<TokenData | null> => {
    try {
      const response = await fetch(`${APP_CONFIG.API_URL}/api/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Refresh token fallito');
      }
      
      const data = await response.json();
      
      // Decodifica il nuovo token
      const decoded: any = jwtDecode(data.accessToken);
      
      // Crea e restituisci il nuovo token data
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: decoded.exp,
        user: {
          id: decoded.sub,
          email: decoded.email,
          firstName: decoded.first_name,
          lastName: decoded.last_name,
          profileImageUrl: decoded.profile_image_url,
        },
      };
    } catch (error) {
      console.error('Errore nel refresh del token:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook per accedere al contesto di autenticazione
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  }
  
  return context;
};