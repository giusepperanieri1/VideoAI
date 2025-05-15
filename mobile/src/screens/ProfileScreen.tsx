import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { fetchUserProfile, updateUserSettings, exportUserData } from '../lib/api';
import Button from '../components/Button';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';

// Tipo per la navigazione
type NavigationProp = NativeStackNavigationProp<RootStackParamList & MainTabParamList>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark, theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);
  const [highQualityExport, setHighQualityExport] = useState(true);
  
  // Query per recuperare il profilo utente
  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
    isError,
  } = useQuery({
    queryKey: ['/api/profile'],
    queryFn: fetchUserProfile,
    enabled: !!user,
  });
  
  // Mutation per aggiornare le impostazioni
  const updateSettingsMutation = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: () => {
      Alert.alert(
        'Impostazioni salvate',
        'Le tue preferenze sono state aggiornate con successo.',
        [{ text: 'OK' }]
      );
      refetchProfile();
    },
    onError: (error: any) => {
      Alert.alert(
        'Errore',
        error.message || 'Si è verificato un errore durante l\'aggiornamento delle impostazioni. Riprova più tardi.',
        [{ text: 'OK' }]
      );
    },
  });
  
  // Mutation per esportare i dati utente
  const exportDataMutation = useMutation({
    mutationFn: exportUserData,
    onSuccess: (data) => {
      Alert.alert(
        'Esportazione completata',
        'I tuoi dati sono stati esportati con successo. Controlla la tua email per scaricare il file.',
        [{ text: 'OK' }]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Errore',
        error.message || 'Si è verificato un errore durante l\'esportazione dei dati. Riprova più tardi.',
        [{ text: 'OK' }]
      );
    },
  });
  
  // Gestisce il refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchProfile();
    } catch (error) {
      console.error('Errore durante il refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Toggle tema chiaro/scuro
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };
  
  // Toggle notifiche
  const toggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    updateSettingsMutation.mutate({
      notifications: value,
    });
  };
  
  // Toggle pubblicazione automatica
  const toggleAutoPublish = (value: boolean) => {
    setAutoPublishEnabled(value);
    updateSettingsMutation.mutate({
      autoPublish: value,
    });
  };
  
  // Toggle qualità esportazione
  const toggleHighQualityExport = (value: boolean) => {
    setHighQualityExport(value);
    updateSettingsMutation.mutate({
      highQualityExport: value,
    });
  };
  
  // Esporta i dati utente (GDPR)
  const handleExportData = () => {
    Alert.alert(
      'Esporta dati personali',
      'Vuoi esportare una copia di tutti i tuoi dati personali? Ti invieremo un link via email per scaricare il file.',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Esporta dati', 
          onPress: () => exportDataMutation.mutate()
        }
      ]
    );
  };
  
  // Gestisce il logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Sei sicuro di voler effettuare il logout?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };
  
  // Gestisce l'eliminazione dell'account
  const handleDeleteAccount = () => {
    Alert.alert(
      'Elimina account',
      'Sei sicuro di voler eliminare definitivamente il tuo account? Questa azione non può essere annullata e comporterà la perdita di tutti i tuoi dati.',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Elimina account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Conferma eliminazione',
              'Questa azione è irreversibile. Tutti i tuoi progetti e dati personali verranno eliminati definitivamente. Sei assolutamente sicuro?',
              [
                { text: 'Annulla', style: 'cancel' },
                { 
                  text: 'Elimina definitivamente', 
                  style: 'destructive',
                  onPress: () => {
                    // Qui impostare la chiamata per eliminare l'account
                    Alert.alert(
                      'Richiesta inviata',
                      'La richiesta di eliminazione account è stata inviata. Riceverai un\'email di conferma con ulteriori istruzioni.',
                      [{ text: 'OK' }]
                    );
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };
  
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header profilo */}
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <View 
              style={[
                styles.avatarContainer, 
                { backgroundColor: isDark ? '#1f2937' : '#f9fafb', borderColor: colors.border }
              ]}
            >
              {user?.profileImageUrl ? (
                <Image 
                  source={{ uri: user.profileImageUrl }} 
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={40} color={isDark ? '#9ca3af' : '#6b7280'} />
              )}
            </View>
            
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || 'Utente VideoGenAI'}
              </Text>
              
              <Text style={[styles.userEmail, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
                {user?.email || 'Account non verificato'}
              </Text>
              
              <View style={styles.accountType}>
                <Text style={[styles.accountTypeText, { color: colors.primary }]}>
                  Account Free
                </Text>
              </View>
            </View>
          </View>
          
          <Button
            title="Gestisci account"
            onPress={() => navigation.navigate('SocialAccounts')}
            variant="outline"
            size="small"
            icon={<Ionicons name="settings-outline" size={16} color={colors.primary} />}
          />
        </View>
        
        {/* Sezione impostazioni app */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Impostazioni app
          </Text>
          
          <View 
            style={[
              styles.settingsBox, 
              { backgroundColor: isDark ? '#1f2937' : '#f9fafb', borderColor: colors.border }
            ]}
          >
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons 
                  name={isDark ? 'moon' : 'sunny'} 
                  size={22} 
                  color={colors.text} 
                  style={styles.settingIcon}
                />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Tema scuro
                </Text>
              </View>
              
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#e5e7eb', true: colors.primary + '80' }}
                thumbColor={isDark ? colors.primary : '#f3f4f6'}
                ios_backgroundColor="#e5e7eb"
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons 
                  name="notifications" 
                  size={22} 
                  color={colors.text} 
                  style={styles.settingIcon}
                />
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Notifiche
                  </Text>
                  <Text style={[styles.settingDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    Ricevi aggiornamenti su video completati e pubblicazioni
                  </Text>
                </View>
              </View>
              
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#e5e7eb', true: colors.primary + '80' }}
                thumbColor={notificationsEnabled ? colors.primary : '#f3f4f6'}
                ios_backgroundColor="#e5e7eb"
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons 
                  name="share-social" 
                  size={22} 
                  color={colors.text} 
                  style={styles.settingIcon}
                />
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Pubblicazione automatica
                  </Text>
                  <Text style={[styles.settingDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    Pubblica automaticamente i video completati sugli account selezionati
                  </Text>
                </View>
              </View>
              
              <Switch
                value={autoPublishEnabled}
                onValueChange={toggleAutoPublish}
                trackColor={{ false: '#e5e7eb', true: colors.primary + '80' }}
                thumbColor={autoPublishEnabled ? colors.primary : '#f3f4f6'}
                ios_backgroundColor="#e5e7eb"
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons 
                  name="cloud-download" 
                  size={22} 
                  color={colors.text} 
                  style={styles.settingIcon}
                />
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Esportazione in alta qualità
                  </Text>
                  <Text style={[styles.settingDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    Scarica video in qualità originale (dimensioni file maggiori)
                  </Text>
                </View>
              </View>
              
              <Switch
                value={highQualityExport}
                onValueChange={toggleHighQualityExport}
                trackColor={{ false: '#e5e7eb', true: colors.primary + '80' }}
                thumbColor={highQualityExport ? colors.primary : '#f3f4f6'}
                ios_backgroundColor="#e5e7eb"
              />
            </View>
          </View>
        </View>
        
        {/* Sezione privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Privacy e dati
          </Text>
          
          <View 
            style={[
              styles.settingsBox, 
              { backgroundColor: isDark ? '#1f2937' : '#f9fafb', borderColor: colors.border }
            ]}
          >
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={handleExportData}
            >
              <View style={styles.settingInfo}>
                <Ionicons 
                  name="download" 
                  size={22} 
                  color={colors.text} 
                  style={styles.settingIcon}
                />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Esporta dati personali
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => Alert.alert('Policy', 'La pagina della privacy policy verrà aperta in una nuova finestra.')}
            >
              <View style={styles.settingInfo}>
                <Ionicons 
                  name="shield-checkmark" 
                  size={22} 
                  color={colors.text} 
                  style={styles.settingIcon}
                />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Privacy Policy
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => Alert.alert('Termini', 'La pagina dei termini di servizio verrà aperta in una nuova finestra.')}
            >
              <View style={styles.settingInfo}>
                <Ionicons 
                  name="document-text" 
                  size={22} 
                  color={colors.text} 
                  style={styles.settingIcon}
                />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Termini di servizio
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Sezione account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Account
          </Text>
          
          <View 
            style={[
              styles.settingsBox, 
              { backgroundColor: isDark ? '#1f2937' : '#f9fafb', borderColor: colors.border }
            ]}
          >
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={handleLogout}
            >
              <View style={styles.settingInfo}>
                <Ionicons 
                  name="log-out" 
                  size={22} 
                  color={colors.error} 
                  style={styles.settingIcon}
                />
                <Text style={[styles.settingLabel, { color: colors.error }]}>
                  Logout
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={handleDeleteAccount}
            >
              <View style={styles.settingInfo}>
                <Ionicons 
                  name="trash" 
                  size={22} 
                  color={colors.error} 
                  style={styles.settingIcon}
                />
                <Text style={[styles.settingLabel, { color: colors.error }]}>
                  Elimina account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Footer con versione */}
        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
            VideoGenAI v1.0.0
          </Text>
          <Text style={[styles.copyrightText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
            © 2025 VideoGenAI Team
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 6,
  },
  accountType: {
    alignSelf: 'flex-start',
  },
  accountTypeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingsBox: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 14,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 3,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
  },
});

export default ProfileScreen;