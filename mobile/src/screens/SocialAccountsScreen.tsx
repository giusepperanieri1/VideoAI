import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTheme } from '../hooks/useTheme';
import { 
  fetchSocialAccounts, 
  connectSocialAccount, 
  disconnectSocialAccount,
  publishToSocialMedia,
} from '../lib/api';
import { APP_CONFIG } from '../lib/config';
import Button from '../components/Button';
import { RootStackParamList } from '../navigation/AppNavigator';

// Tipi per la navigazione e route
type SocialAccountsRouteProp = RouteProp<RootStackParamList, 'SocialAccounts'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Tipo per le piattaforme social
interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected?: boolean;
  status?: 'pending' | 'verified' | 'error';
  accountName?: string;
  accountId?: number;
}

const SocialAccountsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SocialAccountsRouteProp>();
  const { colors, isDark } = useTheme();
  const projectId = route.params?.projectId;
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<{[key: string]: boolean}>({});
  
  // Query per recuperare gli account social
  const {
    data: socialAccounts = [],
    isLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: ['/api/social-accounts'],
    queryFn: fetchSocialAccounts,
  });
  
  // Mutation per connettere un account
  const connectMutation = useMutation({
    mutationFn: connectSocialAccount,
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      Alert.alert(
        'Errore',
        error.message || 'Si è verificato un errore durante la connessione dell\'account. Riprova più tardi.',
        [{ text: 'OK' }]
      );
    },
  });
  
  // Mutation per disconnettere un account
  const disconnectMutation = useMutation({
    mutationFn: disconnectSocialAccount,
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      Alert.alert(
        'Errore',
        error.message || 'Si è verificato un errore durante la disconnessione dell\'account. Riprova più tardi.',
        [{ text: 'OK' }]
      );
    },
  });
  
  // Mutation per pubblicare sui social
  const publishMutation = useMutation({
    mutationFn: publishToSocialMedia,
    onSuccess: () => {
      Alert.alert(
        'Pubblicazione avviata',
        'Il video è stato inviato per la pubblicazione. Riceverai una notifica quando sarà completata.',
        [{ 
          text: 'OK',
          onPress: () => navigation.goBack()
        }]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Errore',
        error.message || 'Si è verificato un errore durante la pubblicazione. Riprova più tardi.',
        [{ text: 'OK' }]
      );
    },
  });
  
  // Gestisce il refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Errore durante il refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Toggle selezione di una piattaforma
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platformId]: !prev[platformId]
    }));
  };
  
  // Connette un account social
  const handleConnectAccount = (platform: string) => {
    connectMutation.mutate(platform);
  };
  
  // Disconnette un account social
  const handleDisconnectAccount = (accountId: number) => {
    Alert.alert(
      'Disconnetti account',
      'Sei sicuro di voler disconnettere questo account social? Dovrai autorizzarlo nuovamente per poter pubblicare contenuti.',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Disconnetti', 
          style: 'destructive',
          onPress: () => disconnectMutation.mutate(accountId)
        }
      ]
    );
  };
  
  // Pubblica sui social selezionati
  const handlePublish = () => {
    if (!projectId) {
      return;
    }
    
    const selectedAccountIds = Object.entries(selectedPlatforms)
      .filter(([_, selected]) => selected)
      .map(([id]) => parseInt(id));
    
    if (selectedAccountIds.length === 0) {
      Alert.alert(
        'Nessun account selezionato',
        'Seleziona almeno un account social su cui pubblicare il video.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    publishMutation.mutate({
      projectId,
      accountIds: selectedAccountIds
    });
  };
  
  // Combina le piattaforme disponibili con gli account connessi
  const socialPlatforms = APP_CONFIG.SOCIAL_PLATFORMS.map((platform) => {
    const connectedAccount = socialAccounts.find(
      (account) => account.platformId === platform.id
    );
    
    if (connectedAccount) {
      return {
        ...platform,
        connected: true,
        status: connectedAccount.status,
        accountName: connectedAccount.username || connectedAccount.displayName,
        accountId: connectedAccount.id,
      };
    }
    
    return {
      ...platform,
      connected: false,
    };
  });
  
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right']}
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {projectId ? 'Pubblica sui social' : 'I tuoi account social'}
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
            {projectId 
              ? 'Seleziona gli account su cui pubblicare il tuo video' 
              : 'Gestisci le tue connessioni ai social media'}
          </Text>
        </View>
        
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
              Caricamento account...
            </Text>
          </View>
        ) : isError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Si è verificato un errore
            </Text>
            <Text style={[styles.errorMessage, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
              Impossibile caricare gli account social. Riprova più tardi.
            </Text>
            <Button
              title="Riprova"
              onPress={() => refetch()}
              style={{ marginTop: 16 }}
              variant="outline"
            />
          </View>
        ) : (
          <>
            <View style={styles.accountsList}>
              {socialPlatforms.map((platform) => (
                <View 
                  key={platform.id}
                  style={[
                    styles.accountCard, 
                    { 
                      backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                      borderColor: colors.border
                    }
                  ]}
                >
                  <View style={styles.accountHeader}>
                    <View style={styles.accountInfo}>
                      <View 
                        style={[
                          styles.iconContainer, 
                          { backgroundColor: platform.color + '20' }
                        ]}
                      >
                        <Ionicons 
                          name={platform.icon as any} 
                          size={24} 
                          color={platform.color} 
                        />
                      </View>
                      <View style={styles.platformInfo}>
                        <Text style={[styles.platformName, { color: colors.text }]}>
                          {platform.name}
                        </Text>
                        {platform.connected && (
                          <Text style={[styles.accountName, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
                            {platform.accountName || 'Account connesso'}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    {projectId && platform.connected && platform.status === 'verified' && (
                      <Switch
                        value={!!selectedPlatforms[platform.accountId!]}
                        onValueChange={() => togglePlatform(platform.accountId!.toString())}
                        trackColor={{ false: '#e5e7eb', true: colors.primary + '80' }}
                        thumbColor={selectedPlatforms[platform.accountId!] ? colors.primary : '#f3f4f6'}
                        ios_backgroundColor="#e5e7eb"
                      />
                    )}
                  </View>
                  
                  {platform.connected ? (
                    <View style={styles.accountActions}>
                      {platform.status === 'pending' && (
                        <View style={styles.statusContainer}>
                          <View 
                            style={[
                              styles.statusBadge, 
                              { backgroundColor: colors.warning + '20' }
                            ]}
                          >
                            <Ionicons 
                              name="time-outline" 
                              size={16} 
                              color={colors.warning} 
                              style={styles.statusIcon}
                            />
                            <Text style={[styles.statusText, { color: colors.warning }]}>
                              Verifica in corso
                            </Text>
                          </View>
                          <Text style={[styles.statusInfo, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
                            Attendi mentre verifichiamo l'autorizzazione
                          </Text>
                        </View>
                      )}
                      
                      {platform.status === 'error' && (
                        <View style={styles.statusContainer}>
                          <View 
                            style={[
                              styles.statusBadge, 
                              { backgroundColor: colors.error + '20' }
                            ]}
                          >
                            <Ionicons 
                              name="alert-circle-outline" 
                              size={16} 
                              color={colors.error} 
                              style={styles.statusIcon}
                            />
                            <Text style={[styles.statusText, { color: colors.error }]}>
                              Errore di autorizzazione
                            </Text>
                          </View>
                          <Text style={[styles.statusInfo, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
                            L'autorizzazione non è più valida, riconnetti l'account
                          </Text>
                        </View>
                      )}
                      
                      {platform.status === 'verified' && !projectId && (
                        <View style={styles.statusContainer}>
                          <View 
                            style={[
                              styles.statusBadge, 
                              { backgroundColor: colors.success + '20' }
                            ]}
                          >
                            <Ionicons 
                              name="checkmark-circle-outline" 
                              size={16} 
                              color={colors.success} 
                              style={styles.statusIcon}
                            />
                            <Text style={[styles.statusText, { color: colors.success }]}>
                              Account verificato
                            </Text>
                          </View>
                          <Text style={[styles.statusInfo, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
                            Questo account è pronto per pubblicare contenuti
                          </Text>
                        </View>
                      )}
                      
                      <TouchableOpacity
                        style={[
                          styles.disconnectButton,
                          { borderColor: colors.error }
                        ]}
                        onPress={() => handleDisconnectAccount(platform.accountId!)}
                      >
                        <Ionicons name="log-out-outline" size={18} color={colors.error} />
                        <Text style={[styles.disconnectText, { color: colors.error }]}>
                          Disconnetti
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Button
                      title={`Connetti ${platform.name}`}
                      onPress={() => handleConnectAccount(platform.id)}
                      variant="outline"
                      style={{ marginTop: 12 }}
                      icon={<Ionicons name="log-in-outline" size={18} color={colors.primary} />}
                    />
                  )}
                </View>
              ))}
            </View>
            
            {projectId && (
              <Button
                title="Pubblica"
                onPress={handlePublish}
                loading={publishMutation.isPending}
                disabled={
                  Object.values(selectedPlatforms).filter(Boolean).length === 0 ||
                  publishMutation.isPending
                }
                style={styles.publishButton}
                icon={<Ionicons name="share-social" size={20} color="white" style={{ marginRight: 8 }} />}
                fullWidth
              />
            )}
          </>
        )}
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  accountsList: {
    marginBottom: 24,
  },
  accountCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 14,
  },
  accountActions: {
    marginTop: 16,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusInfo: {
    fontSize: 13,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  disconnectText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  publishButton: {
    marginTop: 12,
  },
});

export default SocialAccountsScreen;