import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from '../hooks/useTheme';
import Button from '../components/Button';

const SettingsScreen: React.FC = () => {
  const { colors, isDark, theme, setTheme } = useTheme();
  
  // Impostazioni utente
  const [autoplayVideos, setAutoplayVideos] = useState(true);
  const [highQualityPreviews, setHighQualityPreviews] = useState(true);
  const [saveOriginals, setSaveOriginals] = useState(true);
  const [cacheSize, setCacheSize] = useState('156 MB');
  
  // Mutazione per esportare i dati (GDPR)
  const exportDataMutation = useMutation({
    mutationFn: () => {
      // In un'implementazione reale, qui si chiamerebbe un endpoint API
      return new Promise((resolve) => setTimeout(resolve, 2000));
    },
    onSuccess: () => {
      Alert.alert(
        'Esportazione Completata',
        'I tuoi dati sono stati esportati. Riceverai un\'email con il link per scaricarli.'
      );
    },
    onError: () => {
      Alert.alert(
        'Errore',
        'Si è verificato un errore durante l\'esportazione dei dati. Riprova più tardi.'
      );
    },
  });
  
  // Mutazione per eliminare l'account (GDPR)
  const deleteAccountMutation = useMutation({
    mutationFn: () => {
      // In un'implementazione reale, qui si chiamerebbe un endpoint API
      return new Promise((resolve) => setTimeout(resolve, 2000));
    },
    onSuccess: () => {
      Alert.alert(
        'Account Eliminato',
        'Il tuo account e tutti i dati associati sono stati eliminati. Verrai disconnesso.'
      );
    },
    onError: () => {
      Alert.alert(
        'Errore',
        'Si è verificato un errore durante l\'eliminazione dell\'account. Riprova più tardi.'
      );
    },
  });
  
  // Gestisce la modifica del tema
  const handleThemeChange = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };
  
  // Gestisce la pulizia della cache
  const handleClearCache = () => {
    Alert.alert(
      'Pulisci Cache',
      'Sei sicuro di voler pulire la cache? Questa operazione rimuoverà tutte le anteprime e i dati temporanei.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Pulisci',
          onPress: () => {
            // In un'implementazione reale, qui si pulirebbero i file nella cache
            setCacheSize('0 MB');
            Alert.alert('Successo', 'La cache è stata pulita.');
          },
        },
      ]
    );
  };
  
  // Gestisce l'esportazione dei dati (GDPR)
  const handleExportData = () => {
    Alert.alert(
      'Esporta i Tuoi Dati',
      'Vuoi esportare tutti i tuoi dati personali? Questa operazione può richiedere alcuni minuti.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Esporta',
          onPress: () => {
            exportDataMutation.mutate();
          },
        },
      ]
    );
  };
  
  // Gestisce l'eliminazione dell'account (GDPR)
  const handleDeleteAccount = () => {
    Alert.alert(
      'Elimina Account',
      'Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile e comporterà la perdita di tutti i tuoi dati e progetti.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Conferma Eliminazione',
              'Questa azione non può essere annullata. Sei assolutamente sicuro di voler eliminare il tuo account?',
              [
                {
                  text: 'Annulla',
                  style: 'cancel',
                },
                {
                  text: 'Elimina',
                  style: 'destructive',
                  onPress: () => {
                    deleteAccountMutation.mutate();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };
  
  // Apre una pagina web
  const openWebPage = (url: string) => {
    Linking.openURL(url);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Impostazioni</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Sezione Apparenza */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Apparenza</Text>
          
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="moon" size={20} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Tema Scuro</Text>
              </View>
              <Switch
                value={theme === 'dark' || (theme === 'system' && isDark)}
                onValueChange={handleThemeChange}
                trackColor={{ false: '#cbd5e0', true: `${colors.primary}80` }}
                thumbColor={theme === 'dark' || (theme === 'system' && isDark) ? colors.primary : '#f8fafc'}
              />
            </View>
          </View>
        </View>
        
        {/* Sezione Riproduzione */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Riproduzione</Text>
          
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="play-circle" size={20} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Autoplay Video</Text>
              </View>
              <Switch
                value={autoplayVideos}
                onValueChange={setAutoplayVideos}
                trackColor={{ false: '#cbd5e0', true: `${colors.primary}80` }}
                thumbColor={autoplayVideos ? colors.primary : '#f8fafc'}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="sparkles" size={20} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Anteprime Alta Qualità</Text>
              </View>
              <Switch
                value={highQualityPreviews}
                onValueChange={setHighQualityPreviews}
                trackColor={{ false: '#cbd5e0', true: `${colors.primary}80` }}
                thumbColor={highQualityPreviews ? colors.primary : '#f8fafc'}
              />
            </View>
          </View>
        </View>
        
        {/* Sezione Archiviazione */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Archiviazione</Text>
          
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="save" size={20} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Salva File Originali</Text>
              </View>
              <Switch
                value={saveOriginals}
                onValueChange={setSaveOriginals}
                trackColor={{ false: '#cbd5e0', true: `${colors.primary}80` }}
                thumbColor={saveOriginals ? colors.primary : '#f8fafc'}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="folder" size={20} color={colors.primary} style={styles.settingIcon} />
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Dimensione Cache</Text>
                  <Text style={[styles.settingDescription, { color: isDark ? '#a0aec0' : '#718096' }]}>
                    {cacheSize}
                  </Text>
                </View>
              </View>
              <Button
                title="Pulisci"
                variant="outline"
                size="small"
                onPress={handleClearCache}
              />
            </View>
          </View>
        </View>
        
        {/* Sezione Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy & Dati</Text>
          
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => openWebPage('https://example.com/privacy')}
            >
              <View style={styles.settingLabelContainer}>
                <Ionicons name="shield" size={20} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#a0aec0' : '#718096'} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleExportData}
            >
              <View style={styles.settingLabelContainer}>
                <Ionicons name="download" size={20} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Esporta i Tuoi Dati</Text>
              </View>
              {exportDataMutation.isPending ? (
                <View style={styles.loadingIndicator} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#a0aec0' : '#718096'} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Sezione Eliminazione Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Zona Pericolo</Text>
          
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.dangerItem}
              onPress={handleDeleteAccount}
            >
              <View style={styles.settingLabelContainer}>
                <Ionicons name="trash" size={20} color={colors.error} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: colors.error }]}>Elimina Account</Text>
              </View>
              {deleteAccountMutation.isPending ? (
                <View style={styles.loadingIndicator} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.error} />
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.dangerDescription, { color: isDark ? '#a0aec0' : '#718096' }]}>
            L'eliminazione dell'account è irreversibile. Tutti i tuoi dati personali, progetti e contenuti saranno rimossi permanentemente.
          </Text>
        </View>
        
        {/* Spazio in fondo */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  dangerDescription: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
  loadingIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#a0aec0',
    borderLeftColor: '#a0aec0',
    transform: [{ rotate: '-45deg' }],
  },
});

export default SettingsScreen;