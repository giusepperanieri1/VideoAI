import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  FlatList
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Card } from '../components/ui/Card';
import SimplifiedTimeline from '../components/SimplifiedTimeline';
import { useProject } from '../hooks/useProject';
import { useTimelineItems } from '../hooks/useTimelineItems';
import { TimelineItem } from '../types/schema';
import { usePlaybackTime } from '../hooks/usePlaybackTime';

// Tipo di azione nella toolbar mobile
type ToolbarAction = 'trim' | 'text' | 'audio' | 'transitions' | 'filters';

const SimplifiedEditorScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dimensions = useWindowDimensions();
  const { projectId } = route.params as { projectId: number };
  
  // Refs e stati
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolbarAction | null>(null);
  
  // Custom hook per il tempo di riproduzione
  const { 
    currentTime, 
    duration, 
    setCurrentTime, 
    setDuration,
    formatTime 
  } = usePlaybackTime();
  
  // Fetch dati del progetto
  const { 
    data: project, 
    isLoading: projectLoading, 
    error: projectError 
  } = useProject(projectId);
  
  // Fetch elementi della timeline
  const { 
    data: timelineItems, 
    isLoading: itemsLoading,
    error: itemsError
  } = useTimelineItems(projectId);
  
  // Calcola dimensioni di anteprima video
  const videoWidth = dimensions.width - 32; // Padding di schermo
  const videoHeight = videoWidth * 9 / 16; // Aspect ratio 16:9
  
  // Gestione errori
  useEffect(() => {
    if (projectError) {
      Alert.alert(
        'Errore di caricamento',
        'Impossibile caricare il progetto: ' + projectError.message,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [projectError, navigation]);
  
  // Gestisce la selezione di un elemento nella timeline
  const handleSelectTimelineItem = (item: TimelineItem) => {
    setSelectedItem(item);
    
    // Se l'elemento è di tipo video o audio, posiziona la playhead
    if (['video', 'audio'].includes(item.type)) {
      setCurrentTime(item.startTime);
      if (videoRef.current) {
        videoRef.current.setPositionAsync(item.startTime * 1000);
      }
    }
  };
  
  // Gestisce i controlli di riproduzione
  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Renderizza il video
  const renderVideoPlayer = () => {
    if (projectLoading) {
      return (
        <View style={[styles.videoContainer, { height: videoHeight }]}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      );
    }
    
    // Usa il primo elemento video come sorgente o un placeholder
    const videoSource = timelineItems?.find(item => item.type === 'video')?.properties?.url || 
                         project?.properties?.previewUrl;
    
    return (
      <View style={styles.videoContainer}>
        {videoSource ? (
          <Video
            ref={videoRef}
            style={{ width: videoWidth, height: videoHeight }}
            source={{ uri: videoSource }}
            useNativeControls={false}
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            onPlaybackStatusUpdate={status => {
              if (status.isLoaded) {
                setIsPlaying(status.isPlaying);
                setCurrentTime(status.positionMillis / 1000);
                setDuration(status.durationMillis / 1000);
              }
            }}
          />
        ) : (
          <View style={[styles.placeholderContainer, { width: videoWidth, height: videoHeight }]}>
            <Ionicons name="videocam-outline" size={48} color="#aaa" />
            <Text style={styles.placeholderText}>Nessuna anteprima disponibile</Text>
          </View>
        )}
        
        {/* Controlli di riproduzione semplificati */}
        <View style={styles.playbackControls}>
          <TouchableOpacity 
            style={styles.playbackButton}
            onPress={() => {
              if (videoRef.current) {
                const newTime = Math.max(0, currentTime - 5);
                videoRef.current.setPositionAsync(newTime * 1000);
              }
            }}
          >
            <Ionicons name="play-back" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playPauseButton}
            onPress={handlePlayPause}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={32} 
              color="white" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playbackButton}
            onPress={() => {
              if (videoRef.current) {
                const newTime = Math.min(duration, currentTime + 5);
                videoRef.current.setPositionAsync(newTime * 1000);
              }
            }}
          >
            <Ionicons name="play-forward" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.timeDisplay}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
      </View>
    );
  };
  
  // Renderizza la toolbar mobile semplificata
  const renderToolbar = () => {
    const tools: { id: ToolbarAction; icon: string; label: string }[] = [
      { id: 'trim', icon: 'cut-outline', label: 'Taglia' },
      { id: 'text', icon: 'text-outline', label: 'Testo' },
      { id: 'audio', icon: 'musical-notes-outline', label: 'Audio' },
      { id: 'transitions', icon: 'git-merge-outline', label: 'Transizioni' },
      { id: 'filters', icon: 'color-filter-outline', label: 'Filtri' }
    ];
    
    return (
      <FlatList
        data={tools}
        horizontal
        style={styles.toolbar}
        contentContainerStyle={styles.toolbarContent}
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.toolButton,
              selectedTool === item.id && styles.toolButtonSelected
            ]}
            onPress={() => {
              // Gestione strumenti semplificata per mobile
              if (selectedItem) {
                setSelectedTool(item.id);
                Alert.alert(
                  `Modifica ${item.label}`,
                  `La funzionalità ${item.label} per dispositivi mobili è semplificata. Per modifiche avanzate, utilizza l'editor completo sul web.`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  'Seleziona un elemento',
                  'Seleziona prima un elemento nella timeline da modificare.',
                  [{ text: 'OK' }]
                );
              }
            }}
          >
            <Ionicons name={item.icon as any} size={22} color={selectedTool === item.id ? '#0066cc' : '#444'} />
            <Text style={[
              styles.toolLabel,
              selectedTool === item.id && styles.toolLabelSelected
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    );
  };
  
  // Renderizza dettagli elemento selezionato
  const renderSelectedItemDetails = () => {
    if (!selectedItem) return null;
    
    return (
      <Card style={styles.selectedItemCard}>
        <View style={styles.selectedItemHeader}>
          <Text style={styles.selectedItemTitle}>
            Elemento selezionato
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedItem(null)}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.selectedItemDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tipo:</Text>
            <View style={styles.typeBadge}>
              <Ionicons 
                name={getIconForType(selectedItem.type)} 
                size={14} 
                color="white" 
              />
              <Text style={styles.typeBadgeText}>
                {selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Durata:</Text>
            <Text style={styles.detailValue}>
              {formatTime(selectedItem.endTime - selectedItem.startTime)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Posizione:</Text>
            <Text style={styles.detailValue}>
              {formatTime(selectedItem.startTime)} - {formatTime(selectedItem.endTime)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Traccia:</Text>
            <Text style={styles.detailValue}>{selectedItem.track}</Text>
          </View>
        </View>
        
        <View style={styles.selectedItemActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // In mobile, mostro messaggio per operazioni complesse
              Alert.alert(
                'Versione semplificata',
                'Le modifiche complesse sono ottimizzate per l\'editor web. Vuoi continuare con funzionalità limitate?',
                [
                  { text: 'Annulla', style: 'cancel' },
                  { 
                    text: 'Continua', 
                    onPress: () => {
                      Alert.alert('Funzionalità mobile', 'Modifiche di base disponibili. Per editing avanzato usa la versione web.');
                    } 
                  }
                ]
              );
            }}
          >
            <Text style={styles.actionButtonText}>Modifica proprietà</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };
  
  // Funzione helper per ottenere icona in base al tipo
  const getIconForType = (type: string): string => {
    switch (type) {
      case 'video': return 'videocam-outline';
      case 'audio': return 'musical-notes-outline';
      case 'text': return 'text-outline';
      case 'image': return 'image-outline';
      case 'effect': return 'color-filter-outline';
      default: return 'cube-outline';
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Video player */}
        {renderVideoPlayer()}
        
        {/* Timeline semplificata */}
        <View style={styles.timelineContainer}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <SimplifiedTimeline 
            projectId={projectId}
            onSelectItem={handleSelectTimelineItem}
          />
        </View>
        
        {/* UI elementi selezionati */}
        {renderSelectedItemDetails()}
        
        {/* Nota versione mobile */}
        <Card style={styles.mobileNoteCard}>
          <Ionicons name="information-circle-outline" size={24} color="#0066cc" />
          <Text style={styles.mobileNoteText}>
            Stai utilizzando l'editor semplificato per dispositivi mobili. Per funzionalità complete, usa l'editor web.
          </Text>
        </Card>
      </ScrollView>
      
      {/* Toolbar fissata in basso */}
      {renderToolbar()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingBottom: 80, // Spazio per toolbar
  },
  videoContainer: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  placeholderContainer: {
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#aaa',
    marginTop: 8,
  },
  playbackControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  playbackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  timeDisplay: {
    color: 'white',
    fontSize: 12,
    marginLeft: 'auto',
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  timelineContainer: {
    marginBottom: 16,
  },
  toolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toolbarContent: {
    paddingVertical: 8,
  },
  toolButton: {
    width: 70,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  toolButtonSelected: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  toolLabel: {
    fontSize: 11,
    color: '#444',
    marginTop: 4,
  },
  toolLabelSelected: {
    color: '#0066cc',
    fontWeight: '500',
  },
  selectedItemCard: {
    marginBottom: 16,
  },
  selectedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
    marginBottom: 12,
  },
  selectedItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedItemDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#666',
    fontSize: 14,
  },
  detailValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  selectedItemActions: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  mobileNoteCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#e3f2fd',
    marginBottom: 16,
    alignItems: 'center',
  },
  mobileNoteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0066cc',
    lineHeight: 18,
  },
});

export default SimplifiedEditorScreen;