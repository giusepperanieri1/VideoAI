import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  Linking,
  Dimensions,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import Button from '../components/Button';
import { APP_CONFIG } from '../lib/config';

// Ottiene la larghezza dello schermo
const { width } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { colors, isDark, theme, setTheme } = useTheme();
  const [loggingIn, setLoggingIn] = useState(false);
  
  // Effettua il login
  const handleLogin = async () => {
    try {
      setLoggingIn(true);
      await login();
    } catch (error) {
      console.error('Errore nel login:', error);
    } finally {
      setLoggingIn(false);
    }
  };
  
  // Gestisce l'apertura dei link esterni
  const handleLinkPress = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error('Errore nell\'apertura del link:', error);
    }
  };
  
  // Alterna tra tema chiaro e scuro
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };
  
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor: colors.background }
      ]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.themeToggle} 
          onPress={toggleTheme}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons 
            name={isDark ? 'sunny' : 'moon'} 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          VideoGenAI
        </Text>
        
        <Text style={[styles.subtitle, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
          La piattaforma all-in-one per creare, modificare e distribuire contenuti video con l'intelligenza artificiale
        </Text>
        
        <View style={styles.featuresContainer}>
          <View style={[styles.featureRow, { marginBottom: 16 }]}>
            <FeatureItem 
              icon="videocam" 
              title="Generazione video AI"
              description="Crea video straordinari con un semplice prompt di testo" 
              colors={colors}
              isDark={isDark}
            />
            <FeatureItem 
              icon="document-text" 
              title="Script intelligenti"
              description="Genera script e voice-over professionali in automatico" 
              colors={colors}
              isDark={isDark}
            />
          </View>
          
          <View style={styles.featureRow}>
            <FeatureItem 
              icon="share-social" 
              title="Pubblicazione facilitata"
              description="Condividi su tutte le piattaforme social con un click" 
              colors={colors}
              isDark={isDark}
            />
            <FeatureItem 
              icon="analytics" 
              title="Analisi performance"
              description="Monitora il rendimento dei tuoi contenuti" 
              colors={colors}
              isDark={isDark}
            />
          </View>
        </View>
        
        <View style={styles.loginContainer}>
          <Button 
            title="Accedi con il tuo account"
            onPress={handleLogin}
            fullWidth
            loading={loggingIn || isLoading}
            size="large"
            icon={<Ionicons name="log-in" size={20} color="white" style={{ marginRight: 8 }} />}
          />
          
          <Text style={[styles.termsText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Accedendo, accetti i nostri{' '}
            <Text 
              style={[styles.link, { color: colors.primary }]}
              onPress={() => handleLinkPress(`${APP_CONFIG.API_URL}/terms`)}
            >
              Termini di Servizio
            </Text>
            {' '}e la{' '}
            <Text 
              style={[styles.link, { color: colors.primary }]}
              onPress={() => handleLinkPress(`${APP_CONFIG.API_URL}/privacy`)}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Componente per le feature items
interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  colors: any;
  isDark: boolean;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, colors, isDark }) => {
  return (
    <View style={[styles.featureItem, { backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={[styles.featureTitle, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.featureDescription, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
        {description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  themeToggle: {
    position: 'absolute',
    top: 12,
    right: 24,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  featuresContainer: {
    marginBottom: 36,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  loginContainer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  link: {
    fontWeight: '500',
  },
});

export default LoginScreen;