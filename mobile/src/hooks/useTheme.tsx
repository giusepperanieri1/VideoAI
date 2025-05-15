import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type ThemeType = 'light' | 'dark' | 'system';

// Definizione dei temi
interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  error: string;
  warning: string;
  success: string;
}

// Colori tema chiaro
const lightColors: ThemeColors = {
  primary: '#6d28d9', // Viola
  background: '#ffffff',
  card: '#ffffff',
  text: '#1f2937',
  border: '#e5e7eb',
  notification: '#ef4444',
  error: '#dc2626',
  warning: '#f59e0b',
  success: '#10b981',
};

// Colori tema scuro
const darkColors: ThemeColors = {
  primary: '#8b5cf6', // Viola più chiaro per tema scuro
  background: '#111827',
  card: '#1f2937',
  text: '#f9fafb',
  border: '#374151',
  notification: '#ef4444',
  error: '#f87171',
  warning: '#fbbf24',
  success: '#34d399',
};

// Tipo per il contesto
interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
}

// Contesto per il tema
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDark: false,
  colors: lightColors,
  setTheme: () => {},
});

// Provider per il tema
export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Usa il tema di sistema come default
  const colorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  
  // Carica il tema scelto dall'utente dallo storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync('user_theme');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.log('Errore nel caricamento del tema:', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Salva il tema scelto dall'utente
  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await SecureStore.setItemAsync('user_theme', newTheme);
    } catch (error) {
      console.log('Errore nel salvataggio del tema:', error);
    }
  };
  
  // Determina se usare il tema scuro in base alla scelta dell'utente o al tema di sistema
  const isDark = 
    theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  
  // Scegli i colori in base al tema
  const colors = isDark ? darkColors : lightColors;
  
  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizzato per utilizzare il tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme deve essere usato all\'interno di un ThemeProvider');
  }
  
  return context;
};

export default useTheme;