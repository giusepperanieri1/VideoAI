import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTheme } from '../hooks/useTheme';
import { 
  fetchProject, 
  deleteProject, 
  publishToSocialMedia,
} from '../lib/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import Button from '../components/Button';
import { formatDate } from '../lib/utils';

// Ottiene la larghezza dello schermo
const { width } = Dimensions.get('window');

// Tipo per la navigazione e route
type ProjectDetailsRouteProp = RouteProp<RootStackParamList, 'ProjectDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProjectDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ProjectDetailsRouteProp>();
  const { colors, isDark } = useTheme();
  const { id } = route.params;
  
  const [refreshing, setRefreshing] = useState(false);
  const [expandDescription, setExpandDescription] = useState(false);
  
  // Query per recuperare i dettagli del progetto
  const {
    data: project,
    isLoading: projectLoading,
    refetch: refetchProject,
    isError,
  } = useQuery({
    queryKey: [`/api/projects/${id}`],
    queryFn: () => fetchProject(id),
  });
  
  // Mutation per eliminare un progetto
  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert(
        'Errore',
        error.message || 'Si è verificato un errore durante l\'eliminazione del progetto. Riprova più tardi.',
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
        [{ text: 'OK' }]
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
      await refetchProject();
    } catch (error) {
      console.error('Errore durante il refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Elimina il progetto
  const handleDeleteProject = () => {
    Alert.alert(
      'Elimina progetto',
      'Sei sicuro di voler eliminare questo progetto? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Elimina', 
          style: 'destructive',
          onPress: () => deleteProjectMutation.mutate(id)
        }
      ]
    );
  };
  
  // Modifica il progetto
  const handleEditProject = () => {
    navigation.navigate('Editor', { id });
  };
  
  // Condivide il progetto
  const handleShareProject = async () => {
    if (!project || !project.videoUrl) {
      Alert.alert(
        'Impossibile condividere',
        'Questo video non può essere condiviso perché non è stato ancora generato.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      await Share.share({
        title: project.title,
        message: `Guarda questo video: ${project.title} - ${project.videoUrl}`,
        url: project.videoUrl,
      });
    } catch (error) {
      console.error('Errore durante la condivisione:', error);
    }
  };
  
  // Pubblica sui social media
  const handlePublishToSocial = () => {
    if (!project || !project.videoUrl) {
      Alert.alert(
        'Impossibile pubblicare',
        'Questo video non può essere pubblicato perché non è stato ancora generato.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    navigation.navigate('SocialAccounts', { projectId: id });
  };
  
  const isVideoAvailable = project?.status === 'completed' && project.videoUrl;
  const isProcessing = project?.status === 'processing' || project?.status === 'queued';
  const hasError = project?.status === 'failed';
  
  // Se il caricamento è in corso, mostra un indicatore
  if (projectLoading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
          Caricamento dettagli...
        </Text>
      </View>
    );
  }
  
  // Se c'è un errore, mostra il messaggio di errore
  if (isError || !project) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Si è verificato un errore
        </Text>
        <Text style={[styles.errorMessage, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
          Impossibile caricare i dettagli del progetto. Riprova più tardi.
        </Text>
        <Button
          title="Riprova"
          onPress={() => refetchProject()}
          style={{ marginTop: 16 }}
          variant="outline"
        />
        <Button
          title="Torna indietro"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 12 }}
          variant="ghost"
        />
      </View>
    );
  }
  
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right']}
    >
      <ScrollView
        style={styles.scrollView}
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
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              {project.title}
            </Text>
            
            {project.status && (
              <View 
                style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: 
                      project.status === 'completed' 
                        ? colors.success + '20' 
                        : project.status === 'processing' || project.status === 'queued'
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
                        project.status === 'completed' 
                          ? colors.success 
                          : project.status === 'processing' || project.status === 'queued'
                            ? colors.warning
                            : colors.error
                    }
                  ]}
                >
                  {project.status === 'completed' 
                    ? 'Completato' 
                    : project.status === 'processing' 
                      ? 'In elaborazione' 
                      : project.status === 'queued'
                        ? 'In coda'
                        : 'Errore'}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.date, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Creato: {formatDate(project.createdAt)}
          </Text>
          
          {project.updatedAt && project.updatedAt !== project.createdAt && (
            <Text style={[styles.date, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Aggiornato: {formatDate(project.updatedAt)}
            </Text>
          )}
        </View>
        
        {/* Anteprima video o thumbnail */}
        <View 
          style={[
            styles.previewContainer, 
            { 
              backgroundColor: isDark ? '#1f2937' : '#f9fafb',
              borderColor: colors.border
            }
          ]}
        >
          {isVideoAvailable ? (
            <View style={styles.videoContainer}>
              <Image 
                source={{ uri: project.thumbnailUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={[styles.playButton, { backgroundColor: colors.primary + 'D0' }]}
                onPress={() => {
                  Alert.alert(
                    'Riproduzione video',
                    'La riproduzione del video non è ancora implementata in questa versione dell\'app.',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Ionicons name="play" size={32} color="white" />
              </TouchableOpacity>
            </View>
          ) : isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={colors.warning} />
              <Text style={[styles.processingText, { color: colors.text }]}>
                Video in elaborazione...
              </Text>
              <Text style={[styles.processingStatus, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
                {project.progress ? `${project.progress}% completato` : 'In attesa...'}
              </Text>
            </View>
          ) : hasError ? (
            <View style={styles.errorVideoContainer}>
              <Ionicons name="alert-circle" size={48} color={colors.error} />
              <Text style={[styles.errorVideoText, { color: colors.text }]}>
                Si è verificato un errore durante la generazione del video
              </Text>
              <Button
                title="Riprova generazione"
                onPress={() => {
                  Alert.alert(
                    'Rigenerazione',
                    'La rigenerazione del video non è ancora implementata in questa versione dell\'app.',
                    [{ text: 'OK' }]
                  );
                }}
                style={{ marginTop: 16 }}
                variant="outline"
                size="small"
              />
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="videocam-outline" size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
              <Text style={[styles.placeholderText, { color: colors.text }]}>
                Nessun video disponibile
              </Text>
            </View>
          )}
        </View>
        
        {/* Dettagli del progetto */}
        <View style={styles.detailsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Dettagli
          </Text>
          
          <View 
            style={[
              styles.detailBox, 
              { 
                backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                borderColor: colors.border
              }
            ]}
          >
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
                Prompt:
              </Text>
              <TouchableOpacity
                onPress={() => setExpandDescription(!expandDescription)}
                style={{ flex: 1 }}
              >
                <Text 
                  style={[styles.detailText, { color: colors.text }]}
                  numberOfLines={expandDescription ? undefined : 3}
                >
                  {project.prompt || 'Nessuna descrizione'}
                </Text>
                {(project.prompt?.length || 0) > 120 && (
                  <Text style={[styles.expandText, { color: colors.primary }]}>
                    {expandDescription ? 'Mostra meno' : 'Mostra tutto'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
                Stile:
              </Text>
              <Text style={[styles.detailText, { color: colors.text }]}>
                {project.style || 'Standard'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
                Durata:
              </Text>
              <Text style={[styles.detailText, { color: colors.text }]}>
                {project.duration ? `${project.duration} secondi` : 'Non specificata'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
                Formato:
              </Text>
              <Text style={[styles.detailText, { color: colors.text }]}>
                {project.aspectRatio || '16:9'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
                Voice-over:
              </Text>
              <Text style={[styles.detailText, { color: colors.text }]}>
                {project.voiceOverSettings?.enabled 
                  ? `Attivo (${project.voiceOverSettings.voice || 'Voce standard'})` 
                  : 'Disattivato'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Azioni */}
        <View style={styles.actionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Azioni
          </Text>
          
          <View style={styles.buttonRow}>
            <Button
              title="Modifica"
              onPress={handleEditProject}
              variant="outline"
              style={styles.actionButton}
              icon={<Ionicons name="create-outline" size={20} color={colors.primary} />}
            />
            
            <Button
              title="Condividi"
              onPress={handleShareProject}
              variant="outline"
              style={styles.actionButton}
              disabled={!isVideoAvailable}
              icon={<Ionicons name="share-outline" size={20} color={isVideoAvailable ? colors.primary : isDark ? '#6b7280' : '#9ca3af'} />}
            />
          </View>
          
          <View style={styles.buttonRow}>
            <Button
              title="Pubblica"
              onPress={handlePublishToSocial}
              variant="outline"
              style={styles.actionButton}
              disabled={!isVideoAvailable}
              icon={<Ionicons name="globe-outline" size={20} color={isVideoAvailable ? colors.primary : isDark ? '#6b7280' : '#9ca3af'} />}
            />
            
            <Button
              title="Elimina"
              onPress={handleDeleteProject}
              variant="outline"
              style={[styles.actionButton, { borderColor: colors.error }]}
              textStyle={{ color: colors.error }}
              icon={<Ionicons name="trash-outline" size={20} color={colors.error} />}
            />
          </View>
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
    padding: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
  date: {
    fontSize: 14,
    marginBottom: 4,
  },
  previewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
  },
  videoContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: -30,
    marginTop: -30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  processingStatus: {
    fontSize: 14,
    marginTop: 8,
  },
  errorVideoContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorVideoText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  placeholderContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    marginTop: 12,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailBox: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 15,
  },
  expandText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default ProjectDetailsScreen;