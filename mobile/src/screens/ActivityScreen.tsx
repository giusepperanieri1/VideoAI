import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../hooks/useTheme';
import { 
  fetchRenderingStatus,
  fetchPublishingHistory,
} from '../lib/api';
import { formatDate } from '../lib/utils';

const ActivityScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'rendering' | 'publishing'>('rendering');
  
  // Query per recuperare lo stato di rendering
  const {
    data: renderingStatus = { projects: [] },
    isLoading: renderingLoading,
    refetch: refetchRendering,
  } = useQuery({
    queryKey: ['/api/videos/rendering-status'],
    queryFn: fetchRenderingStatus,
    refetchInterval: 10000, // Aggiorna ogni 10 secondi
  });
  
  // Query per recuperare la cronologia delle pubblicazioni
  const {
    data: publishingHistory = [],
    isLoading: publishingLoading,
    refetch: refetchPublishing,
  } = useQuery({
    queryKey: ['/api/social/publishing-history'],
    queryFn: fetchPublishingHistory,
  });
  
  // Gestisce il refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'rendering') {
        await refetchRendering();
      } else {
        await refetchPublishing();
      }
    } catch (error) {
      console.error('Errore durante il refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Cambia il tab attivo
  const handleTabChange = (tab: 'rendering' | 'publishing') => {
    setActiveTab(tab);
  };
  
  // Naviga ai dettagli del progetto
  const handleProjectPress = (id: number) => {
    navigation.navigate('ProjectDetails', { id });
  };
  
  // Componente per un item di rendering
  const RenderingItem = ({ item }: { item: any }) => {
    const isProcessing = item.status === 'processing';
    const isQueued = item.status === 'queued';
    const isCompleted = item.status === 'completed';
    const hasFailed = item.status === 'failed';
    
    return (
      <TouchableOpacity
        style={[
          styles.itemCard, 
          { 
            backgroundColor: isDark ? '#1f2937' : '#f9fafb',
            borderColor: colors.border
          }
        ]}
        onPress={() => handleProjectPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          
          <View 
            style={[
              styles.statusBadge, 
              { 
                backgroundColor: 
                  isCompleted
                    ? colors.success + '20'
                    : isProcessing || isQueued 
                      ? colors.warning + '20'
                      : colors.error + '20'
              }
            ]}
          >
            <Text 
              style={[
                styles.statusText, 
                { 
                  color: 
                    isCompleted
                      ? colors.success
                      : isProcessing || isQueued
                        ? colors.warning
                        : colors.error
                }
              ]}
            >
              {isCompleted 
                ? 'Completato' 
                : isProcessing 
                  ? 'In elaborazione' 
                  : isQueued
                    ? 'In coda'
                    : 'Errore'}
            </Text>
          </View>
        </View>
        
        {(isProcessing || isQueued) && (
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { backgroundColor: isDark ? '#374151' : '#e5e7eb' }
              ]}
            >
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: colors.warning,
                    width: `${item.progress || 0}%`
                  }
                ]}
              />
            </View>
            
            <Text style={[styles.progressText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {item.progress || 0}%
            </Text>
          </View>
        )}
        
        <View style={styles.itemDetails}>
          {isProcessing && (
            <Text style={[styles.stepText, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
              {item.currentStep || 'Inizializzazione...'}
            </Text>
          )}
          
          {hasFailed && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {item.errorMessage || 'Si è verificato un errore durante la generazione.'}
            </Text>
          )}
          
          <Text style={[styles.dateText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {formatDate(item.createdAt, true)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Componente per un item di pubblicazione
  const PublishingItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'completed';
    const isProcessing = item.status === 'processing';
    const isQueued = item.status === 'queued';
    const hasFailed = item.status === 'failed';
    
    return (
      <TouchableOpacity
        style={[
          styles.itemCard, 
          { 
            backgroundColor: isDark ? '#1f2937' : '#f9fafb',
            borderColor: colors.border
          }
        ]}
        onPress={() => handleProjectPress(item.projectId)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          
          <View 
            style={[
              styles.statusBadge, 
              { 
                backgroundColor: 
                  isCompleted
                    ? colors.success + '20'
                    : isProcessing || isQueued 
                      ? colors.warning + '20'
                      : colors.error + '20'
              }
            ]}
          >
            <Text 
              style={[
                styles.statusText, 
                { 
                  color: 
                    isCompleted
                      ? colors.success
                      : isProcessing || isQueued
                        ? colors.warning
                        : colors.error
                }
              ]}
            >
              {isCompleted 
                ? 'Pubblicato' 
                : isProcessing 
                  ? 'In pubblicazione' 
                  : isQueued
                    ? 'In coda'
                    : 'Errore'}
            </Text>
          </View>
        </View>
        
        <View style={styles.itemDetails}>
          <View style={styles.platformInfo}>
            <View style={styles.platformIcon}>
              <Ionicons 
                name={getPlatformIcon(item.platformName)}
                size={16}
                color={colors.text}
              />
            </View>
            <Text style={[styles.platformText, { color: colors.text }]}>
              {item.platformName}
            </Text>
          </View>
          
          {hasFailed && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {item.errorMessage || 'Si è verificato un errore durante la pubblicazione.'}
            </Text>
          )}
          
          {isCompleted && item.platformVideoUrl && (
            <TouchableOpacity
              style={[styles.viewButton, { borderColor: colors.primary }]}
              onPress={() => {
                // Apri URL del video sulla piattaforma
              }}
            >
              <Text style={[styles.viewButtonText, { color: colors.primary }]}>
                Visualizza su {item.platformName}
              </Text>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
          
          <Text style={[styles.dateText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {isCompleted && item.completedAt 
              ? `Pubblicato: ${formatDate(item.completedAt, true)}`
              : `Richiesto: ${formatDate(item.createdAt, true)}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Helper per ottenere l'icona corretta per la piattaforma
  const getPlatformIcon = (platformName: string): string => {
    switch (platformName.toLowerCase()) {
      case 'youtube':
        return 'logo-youtube';
      case 'facebook':
        return 'logo-facebook';
      case 'instagram':
        return 'logo-instagram';
      case 'twitter':
      case 'x':
        return 'logo-twitter';
      case 'tiktok':
        return 'musical-notes';
      case 'linkedin':
        return 'logo-linkedin';
      default:
        return 'share-social';
    }
  };
  
  // Rendering delle liste
  const renderRenderingList = () => {
    const isLoading = renderingLoading && !refreshing;
    const hasData = renderingStatus.projects && renderingStatus.projects.length > 0;
    
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
            Caricamento attività...
          </Text>
        </View>
      );
    }
    
    if (!hasData) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Nessuna elaborazione video
          </Text>
          <Text style={[styles.emptyText, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
            Le tue richieste di generazione video appariranno qui
          </Text>
        </View>
      );
    }
    
    return (
      <FlatList
        data={renderingStatus.projects}
        keyExtractor={(item, index) => `rendering-${item.id || index}`}
        renderItem={({ item }) => <RenderingItem item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    );
  };
  
  const renderPublishingList = () => {
    const isLoading = publishingLoading && !refreshing;
    const hasData = publishingHistory && publishingHistory.length > 0;
    
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
            Caricamento pubblicazioni...
          </Text>
        </View>
      );
    }
    
    if (!hasData) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="share-social-outline" size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Nessuna pubblicazione
          </Text>
          <Text style={[styles.emptyText, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
            La cronologia delle tue pubblicazioni apparirà qui
          </Text>
        </View>
      );
    }
    
    return (
      <FlatList
        data={publishingHistory}
        keyExtractor={(item, index) => `publishing-${item.id || index}`}
        renderItem={({ item }) => <PublishingItem item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    );
  };
  
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Attività
        </Text>
      </View>
      
      <View 
        style={[
          styles.tabsContainer,
          { borderBottomColor: isDark ? '#374151' : '#e5e7eb' }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'rendering' && [
              styles.activeTab,
              { borderBottomColor: colors.primary }
            ]
          ]}
          onPress={() => handleTabChange('rendering')}
        >
          <Text 
            style={[
              styles.tabText,
              { color: activeTab === 'rendering' ? colors.primary : isDark ? '#9ca3af' : '#6b7280' }
            ]}
          >
            Rendering
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'publishing' && [
              styles.activeTab,
              { borderBottomColor: colors.primary }
            ]
          ]}
          onPress={() => handleTabChange('publishing')}
        >
          <Text 
            style={[
              styles.tabText,
              { color: activeTab === 'publishing' ? colors.primary : isDark ? '#9ca3af' : '#6b7280' }
            ]}
          >
            Pubblicazioni
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {activeTab === 'rendering' ? renderRenderingList() : renderPublishingList()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 12,
  },
  itemCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    width: 36,
    textAlign: 'right',
  },
  itemDetails: {
    
  },
  stepText: {
    fontSize: 14,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformIcon: {
    marginRight: 6,
  },
  platformText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  dateText: {
    fontSize: 12,
  },
});

export default ActivityScreen;