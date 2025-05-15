import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchProject, 
  updateProject, 
  fetchTimelineItems, 
  updateTimelineItem,
  createTimelineItem,
  fetchAssetsByUserId
} from '../lib/api';
import { useTheme } from '../hooks/useTheme';
import Button from '../components/Button';
import MediaLibrary from '../components/MediaLibrary';
import PropertiesPanel from '../components/PropertiesPanel';
import TextOverlayModal from '../components/modals/TextOverlayModal';
import VoiceOverModal from '../components/modals/VoiceOverModal';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Asset, TimelineItem, TextOverlayData, VoiceOverData } from '../lib/types';

const { width } = Dimensions.get('window');
const videoWidth = width - 40; // padding 20 on each side
const videoHeight = videoWidth * 9/16; // 16:9 aspect ratio

type EditorRouteProp = RouteProp<RootStackParamList, 'Editor'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Enumerazione delle azioni editor disponibili
type EditorAction = 'select' | 'add-text' | 'add-media' | 'add-transition' | 'trim';

const EditorScreen: React.FC = () => {
  const route = useRoute<EditorRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAction, setCurrentAction] = useState<EditorAction>('select');
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [showTextOverlayModal, setShowTextOverlayModal] = useState(false);
  const [showVoiceOverModal, setShowVoiceOverModal] = useState(false);
  
  const videoRef = useRef<Video>(null);
  
  const { projectId } = route.params;
  
  // Fetch dei dettagli del progetto
  const {
    data: project,
    isLoading: isLoadingProject,
    refetch: refetchProject,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
  });
  
  // Fetch degli elementi della timeline
  const {
    data: timelineItemsData = [],
    isLoading: isLoadingTimeline,
    refetch: refetchTimeline
  } = useQuery({
    queryKey: ['timeline', projectId],
    queryFn: () => fetchTimelineItems(projectId),
  });
  
  // Fetch degli assets dell'utente
  const { 
    data: assets = [], 
    isLoading: isLoadingAssets,
    refetch: refetchAssets
  } = useQuery({
    queryKey: ['assets'],
    queryFn: () => fetchAssetsByUserId(1), // Da sostituire con l'ID utente reale
  });
  
  // Mutazione per aggiornare il progetto
  const updateProjectMutation = useMutation({
    mutationFn: (data: any) => updateProject(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      Alert.alert('Successo', 'Progetto salvato con successo');
      setIsSaving(false);
    },
    onError: (error) => {
      console.error('Errore durante il salvataggio del progetto:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante il salvataggio del progetto');
      setIsSaving(false);
    },
  });
  
  // Mutazione per aggiornare un elemento della timeline
  const updateTimelineItemMutation = useMutation({
    mutationFn: (data: Partial<TimelineItem>) => {
      if (data.id) {
        return updateTimelineItem(data.id, data);
      } else {
        throw new Error('ID elemento timeline mancante');
      }
    },
    onSuccess: () => {
      refetchTimeline();
      setSelectedItem(null);
      setShowPropertiesPanel(false);
    },
    onError: (error) => {
      console.error('Errore durante l\'aggiornamento dell\'elemento della timeline:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante l\'aggiornamento dell\'elemento');
    },
  });
  
  // Mutazione per creare un nuovo elemento della timeline
  const createTimelineItemMutation = useMutation({
    mutationFn: (data: Partial<TimelineItem>) => createTimelineItem(projectId, data),
    onSuccess: () => {
      refetchTimeline();
    },
    onError: (error) => {
      console.error('Errore durante la creazione dell\'elemento della timeline:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante la creazione dell\'elemento');
    },
  });
  
  // Gestisce il cambio del tempo corrente durante la riproduzione
  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded && !status.isBuffering) {
      setCurrentTime(status.positionMillis / 1000);
      setIsPlaying(status.isPlaying);
    }
  };
  
  // Gestisce il play/pause
  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };
  
  // Gestisce il cambio della posizione nella timeline
  const seekToPosition = async (position: number) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(position * 1000);
      setCurrentTime(position);
    }
  };
  
  // Gestisce la selezione di un elemento nella timeline
  const handleSelectItem = (item: TimelineItem) => {
    setSelectedItem(item);
    seekToPosition(item.startTime);
  };
  
  // Gestisce l'aggiunta di testo
  const handleAddText = () => {
    setShowTextOverlayModal(true);
  };
  
  // Gestisce l'aggiunta di media
  const handleAddMedia = () => {
    setShowMediaLibrary(true);
  };
  
  // Gestisce l'aggiunta di transizioni
  const handleAddTransition = () => {
    // Simulazione dell'aggiunta di una transizione
    Alert.alert(
      'Aggiungi Transizione',
      'Questa funzione permetterebbe di aggiungere transizioni tra clip video.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            // In un'implementazione reale, qui si aprirebbe un selettore di transizioni
            setCurrentAction('select');
          },
        },
      ]
    );
  };
  
  // Gestisce il taglio del video
  const handleTrim = () => {
    // Simulazione del taglio del video
    Alert.alert(
      'Taglia Video',
      'Questa funzione permetterebbe di tagliare parti del video.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            // In un'implementazione reale, qui si aprirebbe un'interfaccia per il taglio
            setCurrentAction('select');
          },
        },
      ]
    );
  };
  
  // Gestisce il salvataggio del progetto
  const handleSaveProject = () => {
    setIsSaving(true);
    
    // Simula il salvataggio del progetto
    updateMutation.mutate({
      title: project?.title,
      description: project?.description,
      // In un'implementazione reale, qui si salverebbero anche gli elementi della timeline
    });
  };
  
  // Handler per l'aggiunta di asset alla timeline
  const handleAddAssetToTimeline = (asset: Asset) => {
    const newItem: Partial<TimelineItem> = {
      projectId: projectId,
      assetId: asset.id,
      type: asset.type,
      track: 0, // La prima traccia
      startTime: 0,
      endTime: asset.duration ? asset.duration * 1000 : 10000, // Milliseconds
      properties: {
        url: asset.url,
        name: asset.name
      }
    };
    
    createTimelineItemMutation.mutate(newItem);
    setShowMediaLibrary(false);
  };
  
  // Handler per aggiungere un overlay di testo
  const handleAddTextOverlay = (textData: TextOverlayData) => {
    const newItem: Partial<TimelineItem> = {
      projectId: projectId,
      type: 'text',
      track: 1, // Traccia sopra la principale per sovrapporsi al video
      startTime: 0,
      endTime: textData.duration * 1000, // Milliseconds
      properties: {
        text: textData.text,
        fontSize: textData.fontSize,
        color: textData.color,
        backgroundColor: textData.backgroundColor,
        position: textData.position,
        alignment: textData.alignment,
        hasBorder: textData.hasBorder
      }
    };
    
    createTimelineItemMutation.mutate(newItem);
  };
  
  // Handler per aggiungere un voiceover
  const handleAddVoiceOver = (voiceData: VoiceOverData) => {
    if (!voiceData.audioUrl) return;
    
    const newItem: Partial<TimelineItem> = {
      projectId: projectId,
      type: 'audio',
      track: 2, // Traccia per l'audio
      startTime: 0,
      endTime: (voiceData.duration || 5) * 1000, // Milliseconds
      properties: {
        url: voiceData.audioUrl,
        text: voiceData.text,
        voice: voiceData.voice
      }
    };
    
    createTimelineItemMutation.mutate(newItem);
  };
  
  // Handler per selezionare un elemento della timeline
  const handleSelectItem = (item: TimelineItem) => {
    setSelectedItem(item);
    setShowPropertiesPanel(true);
  };
  
  // Handler per aggiornare un elemento della timeline
  const handleUpdateItem = (item: TimelineItem) => {
    updateTimelineItemMutation.mutate(item);
  };
  
  // Rendering degli elementi della timeline
  const renderTimelineItem = (item: TimelineItem) => {
    let backgroundColor;
    let icon;
    
    switch (item.type) {
      case 'text':
        backgroundColor = '#4299e1'; // blue
        icon = 'text';
        break;
      case 'image':
        backgroundColor = '#48bb78'; // green
        icon = 'image';
        break;
      case 'video':
        backgroundColor = '#ed8936'; // orange
        icon = 'videocam';
        break;
      case 'audio':
        backgroundColor = '#9f7aea'; // purple
        icon = 'musical-note';
        break;
      case 'transition':
        backgroundColor = '#f56565'; // red
        icon = 'git-merge';
        break;
      default:
        backgroundColor = '#cbd5e0'; // gray
        icon = 'help-circle';
    }
    
    // Calcola la larghezza in base alla durata
    const duration = (item.endTime - item.startTime) / 1000; // Converti da millisecondi a secondi
    const itemWidth = duration * 20; // 1 secondo = 20 pixel
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.timelineItem,
          {
            backgroundColor,
            width: itemWidth,
            left: item.startTime / 1000 * 20, // Posizione in base al tempo di inizio (convertito in secondi)
            borderColor: selectedItem?.id === item.id ? colors.primary : 'transparent',
            borderWidth: selectedItem?.id === item.id ? 2 : 0,
          },
        ]}
        onPress={() => handleSelectItem(item)}
      >
        <Ionicons name={icon as any} size={16} color="#fff" />
        <Text style={styles.timelineItemLabel} numberOfLines={1}>
          {item.type === 'text' ? item.content.text.substring(0, 10) : item.type}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // Visualizzazione del caricamento
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Caricamento editor...
        </Text>
      </View>
    );
  }
  
  // Visualizzazione dell'errore
  if (isError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Si è verificato un errore durante il caricamento del progetto
        </Text>
        <Button
          title="Riprova"
          variant="outline"
          onPress={() => refetch()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Area anteprima video */}
      <View style={styles.previewContainer}>
        <Video
          ref={videoRef}
          source={{ uri: project?.resultUrl || 'https://example.com/placeholder.mp4' }}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="contain"
          shouldPlay={false}
          isLooping={false}
          style={styles.video}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          useNativeControls={false}
        />
        
        {/* Controlli di riproduzione */}
        <View style={[styles.playbackControls, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.playPauseButton}
            onPress={togglePlayPause}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>
          
          <View style={styles.timeDisplay}>
            <Text style={[styles.timeText, { color: colors.text }]}>
              {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Timeline */}
      <View style={[styles.timelineContainer, { backgroundColor: isDark ? colors.card : '#f1f5f9' }]}>
        <View style={styles.timelineHeader}>
          <Text style={[styles.timelineTitle, { color: colors.text }]}>Timeline</Text>
          
          <TouchableOpacity 
            style={styles.zoomButton}
            onPress={() => Alert.alert('Info', 'Funzionalità zoom in arrivo nella prossima versione')}
          >
            <Ionicons name="search" size={18} color={isDark ? '#a0aec0' : '#64748b'} />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={true}
          style={styles.timelineScrollView}
          contentContainerStyle={styles.timelineContent}
        >
          {/* Timeline ruler */}
          <View style={[styles.timelineRuler, { borderBottomColor: isDark ? '#4a5568' : '#cbd5e0' }]}>
            {Array.from({ length: 21 }).map((_, i) => (
              <View key={i} style={styles.timelineRulerMark}>
                <Text style={[styles.timelineRulerText, { color: isDark ? '#a0aec0' : '#64748b' }]}>
                  {i}s
                </Text>
              </View>
            ))}
          </View>
          
          {/* Timeline elements */}
          <View style={styles.timelineElements}>
            {timelineItems.map(renderTimelineItem)}
            
            {/* Current time indicator */}
            <View
              style={[
                styles.currentTimeIndicator,
                { left: currentTime * 20, backgroundColor: colors.primary }
              ]}
            />
          </View>
        </ScrollView>
      </View>
      
      {/* Editor tools */}
      <View style={[styles.editorToolbar, { backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.toolButton,
              currentAction === 'select' && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => setCurrentAction('select')}
          >
            <Ionicons
              name="hand"
              size={22}
              color={currentAction === 'select' ? colors.primary : isDark ? '#a0aec0' : '#64748b'}
            />
            <Text
              style={[
                styles.toolButtonText,
                { color: currentAction === 'select' ? colors.primary : isDark ? '#a0aec0' : '#64748b' }
              ]}
            >
              Seleziona
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toolButton,
              currentAction === 'add-text' && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => {
              setCurrentAction('add-text');
              handleAddText();
            }}
          >
            <Ionicons
              name="text"
              size={22}
              color={currentAction === 'add-text' ? colors.primary : isDark ? '#a0aec0' : '#64748b'}
            />
            <Text
              style={[
                styles.toolButtonText,
                { color: currentAction === 'add-text' ? colors.primary : isDark ? '#a0aec0' : '#64748b' }
              ]}
            >
              Testo
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toolButton,
              currentAction === 'add-voice' && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => {
              setCurrentAction('add-voice');
              setShowVoiceOverModal(true);
            }}
          >
            <Ionicons
              name="mic"
              size={22}
              color={currentAction === 'add-voice' ? colors.primary : isDark ? '#a0aec0' : '#64748b'}
            />
            <Text
              style={[
                styles.toolButtonText,
                { color: currentAction === 'add-voice' ? colors.primary : isDark ? '#a0aec0' : '#64748b' }
              ]}
            >
              Voce
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toolButton,
              currentAction === 'add-media' && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => {
              setCurrentAction('add-media');
              handleAddMedia();
            }}
          >
            <Ionicons
              name="image"
              size={22}
              color={currentAction === 'add-media' ? colors.primary : isDark ? '#a0aec0' : '#64748b'}
            />
            <Text
              style={[
                styles.toolButtonText,
                { color: currentAction === 'add-media' ? colors.primary : isDark ? '#a0aec0' : '#64748b' }
              ]}
            >
              Media
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toolButton,
              currentAction === 'add-media' && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => {
              setCurrentAction('add-media');
              handleAddMedia();
            }}
          >
            <Ionicons
              name="image"
              size={22}
              color={currentAction === 'add-media' ? colors.primary : isDark ? '#a0aec0' : '#64748b'}
            />
            <Text
              style={[
                styles.toolButtonText,
                { color: currentAction === 'add-media' ? colors.primary : isDark ? '#a0aec0' : '#64748b' }
              ]}
            >
              Media
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toolButton,
              currentAction === 'add-transition' && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => {
              setCurrentAction('add-transition');
              handleAddTransition();
            }}
          >
            <Ionicons
              name="git-merge"
              size={22}
              color={currentAction === 'add-transition' ? colors.primary : isDark ? '#a0aec0' : '#64748b'}
            />
            <Text
              style={[
                styles.toolButtonText,
                { color: currentAction === 'add-transition' ? colors.primary : isDark ? '#a0aec0' : '#64748b' }
              ]}
            >
              Transizione
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toolButton,
              currentAction === 'trim' && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => {
              setCurrentAction('trim');
              handleTrim();
            }}
          >
            <Ionicons
              name="cut"
              size={22}
              color={currentAction === 'trim' ? colors.primary : isDark ? '#a0aec0' : '#64748b'}
            />
            <Text
              style={[
                styles.toolButtonText,
                { color: currentAction === 'trim' ? colors.primary : isDark ? '#a0aec0' : '#64748b' }
              ]}
            >
              Taglia
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Bottom actions */}
      <View style={[styles.bottomActions, { backgroundColor: colors.card }]}>
        <Button
          title="Salva"
          variant="primary"
          size="small"
          loading={isSaving}
          onPress={handleSaveProject}
          icon={<Ionicons name="save" size={16} color="#fff" style={{ marginRight: 4 }} />}
        />
        
        <Button
          title="Anteprima"
          variant="outline"
          size="small"
          onPress={togglePlayPause}
          icon={<Ionicons name="eye" size={16} color={colors.primary} style={{ marginRight: 4 }} />}
          style={{ marginLeft: 8 }}
        />
        
        <Button
          title="Esporta"
          variant="outline"
          size="small"
          onPress={() => Alert.alert('Info', 'Funzionalità di esportazione in arrivo nella prossima versione')}
          icon={<Ionicons name="share" size={16} color={colors.primary} style={{ marginRight: 4 }} />}
          style={{ marginLeft: 8 }}
        />
      </View>
      
      {/* Media Library Modal */}
      <Modal
        visible={showMediaLibrary}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMediaLibrary(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Libreria Media</Text>
            <TouchableOpacity onPress={() => setShowMediaLibrary(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <MediaLibrary
            assets={assets}
            isLoading={isLoadingAssets}
            onSelectAsset={handleAddAssetToTimeline}
            onRefresh={refetchAssets}
          />
        </View>
      </Modal>
      
      {/* Properties Panel */}
      {showPropertiesPanel && (
        <View style={styles.propertiesPanelContainer}>
          <PropertiesPanel
            item={selectedItem}
            onUpdateItem={handleUpdateItem}
            onClose={() => setShowPropertiesPanel(false)}
          />
        </View>
      )}
      
      {/* Text Overlay Modal */}
      <TextOverlayModal
        visible={showTextOverlayModal}
        onClose={() => setShowTextOverlayModal(false)}
        onSave={handleAddTextOverlay}
      />
      
      {/* Voice Over Modal */}
      <VoiceOverModal
        visible={showVoiceOverModal}
        onClose={() => setShowVoiceOverModal(false)}
        onSave={handleAddVoiceOver}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  previewContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  video: {
    width: videoWidth,
    height: videoHeight,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  playPauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplay: {
    marginLeft: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timelineContainer: {
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  zoomButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineScrollView: {
    height: 100,
  },
  timelineContent: {
    paddingBottom: 10,
  },
  timelineRuler: {
    height: 20,
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  timelineRulerMark: {
    width: 20,
    alignItems: 'center',
  },
  timelineRulerText: {
    fontSize: 10,
  },
  timelineElements: {
    height: 70,
    position: 'relative',
  },
  timelineItem: {
    position: 'absolute',
    height: 28,
    borderRadius: 4,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    top: 10,
  },
  timelineItemLabel: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
  },
  currentTimeIndicator: {
    position: 'absolute',
    width: 2,
    height: '100%',
    top: 0,
  },
  editorToolbar: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  toolButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  toolButtonText: {
    fontSize: 12,
    marginTop: 4,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  propertiesPanelContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    borderLeftWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
});

export default EditorScreen;