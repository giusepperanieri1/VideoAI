import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProject } from '../hooks/useProject';
import { useTimelineItems } from '../hooks/useTimelineItems';
import { TimelineItem } from '../types/schema';

const TRACK_HEIGHT = 60;
const TIMELINE_PADDING = 20;
const SECOND_WIDTH = 50; // Larghezza di un secondo nella timeline
const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_ZOOM = 5; // Fattore di zoom massimo
const MIN_ZOOM = 0.5; // Fattore di zoom minimo

interface SimplifiedTimelineProps {
  projectId: number;
  onSelectItem?: (item: TimelineItem) => void;
}

const SimplifiedTimeline: React.FC<SimplifiedTimelineProps> = ({ 
  projectId, 
  onSelectItem 
}) => {
  // Recupera dati del progetto e elementi timeline
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: timelineItems, isLoading: itemsLoading } = useTimelineItems(projectId);
  
  // Stati e ref per gestione timeline
  const [zoom, setZoom] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  
  // Calcola durata totale del progetto o usa default
  const projectDuration = project?.duration || 60; // Default 60 secondi
  
  // Calcola dimensioni timeline
  const timelineWidth = projectDuration * SECOND_WIDTH * zoom;
  
  // Crea tracce uniche dai timelineItems
  const tracks = React.useMemo(() => {
    if (!timelineItems || timelineItems.length === 0) return [0, 1]; // Default 2 tracce
    
    const trackNumbers = timelineItems.map(item => item.track);
    return [...new Set(trackNumbers)].sort((a, b) => a - b);
  }, [timelineItems]);
  
  // Gestione pan per lo zoom della timeline
  const pinchRef = useRef({ initialZoom: 1, initialDistance: 0 });
  const zoomPanResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    // Rileva inizio pinch (zoom)
    onPanResponderGrant: (evt) => {
      if (evt.nativeEvent.touches.length === 2) {
        const touch1 = evt.nativeEvent.touches[0];
        const touch2 = evt.nativeEvent.touches[1];
        
        const distance = Math.sqrt(
          Math.pow(touch2.pageX - touch1.pageX, 2) +
          Math.pow(touch2.pageY - touch1.pageY, 2)
        );
        
        pinchRef.current.initialZoom = zoom;
        pinchRef.current.initialDistance = distance;
      }
    },
    
    // Gestisce movimento pinch
    onPanResponderMove: (evt) => {
      if (evt.nativeEvent.touches.length === 2) {
        const touch1 = evt.nativeEvent.touches[0];
        const touch2 = evt.nativeEvent.touches[1];
        
        const distance = Math.sqrt(
          Math.pow(touch2.pageX - touch1.pageX, 2) +
          Math.pow(touch2.pageY - touch1.pageY, 2)
        );
        
        const newZoom = pinchRef.current.initialZoom * (distance / pinchRef.current.initialDistance);
        setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)));
      }
    },
    
    onPanResponderRelease: () => {
      pinchRef.current = { initialZoom: zoom, initialDistance: 0 };
    }
  }), [zoom]);
  
  // Converti tempo in secondi a posizione nella timeline
  const timeToPosition = (timeInSeconds: number) => {
    return timeInSeconds * SECOND_WIDTH * zoom;
  };
  
  // Calcola durata in minuti:secondi
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Genera marker del tempo
  const renderTimeMarkers = () => {
    const markers = [];
    const intervalInSeconds = zoom < 1 ? 10 : 5; // Adatta densità dei marker in base al zoom
    
    for (let i = 0; i <= projectDuration; i += intervalInSeconds) {
      markers.push(
        <View
          key={`marker-${i}`}
          style={[
            styles.timeMarker,
            { left: timeToPosition(i) }
          ]}
        >
          <Text style={styles.timeMarkerText}>{formatDuration(i)}</Text>
        </View>
      );
    }
    
    return markers;
  };
  
  // Genera elementi timeline per una traccia
  const renderTrackItems = (trackNumber: number) => {
    if (!timelineItems) return null;
    
    return timelineItems
      .filter(item => item.track === trackNumber)
      .map(item => {
        const isSelected = item.id === selectedItemId;
        const startPosition = timeToPosition(item.startTime);
        const itemWidth = timeToPosition(item.endTime - item.startTime);
        
        return (
          <TouchableOpacity
            key={`timeline-item-${item.id}`}
            style={[
              styles.timelineItem,
              { 
                left: startPosition,
                width: itemWidth,
                backgroundColor: getItemColor(item.type)
              },
              isSelected && styles.selectedItem
            ]}
            onPress={() => {
              setSelectedItemId(item.id);
              if (onSelectItem) onSelectItem(item);
            }}
          >
            <Text 
              style={styles.itemText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {getItemLabel(item)}
            </Text>
          </TouchableOpacity>
        );
      });
  };
  
  // Funzioni helper per visualizzazione elementi
  const getItemColor = (type: string) => {
    switch (type) {
      case 'video': return '#4CAF50';
      case 'audio': return '#2196F3';
      case 'text': return '#FF9800'; 
      case 'image': return '#9C27B0';
      case 'effect': return '#F44336';
      default: return '#607D8B';
    }
  };
  
  const getItemLabel = (item: TimelineItem) => {
    // Tenta di recuperare un nome significativo da properties
    const properties = item.properties || {};
    if (properties.name) return properties.name;
    if (properties.text) return properties.text.substring(0, 15);
    
    return `${item.type} ${formatDuration(item.endTime - item.startTime)}`;
  };
  
  // Renderizza lo stato di caricamento
  if (projectLoading || itemsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Caricamento timeline...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Controlli della timeline */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => setZoom(Math.max(MIN_ZOOM, zoom - 0.2))}
        >
          <Ionicons name="remove" size={18} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
        
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => setZoom(Math.min(MAX_ZOOM, zoom + 0.2))}
        >
          <Ionicons name="add" size={18} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>
            {formatDuration(scrollX.current / (SECOND_WIDTH * zoom))}
          </Text>
        </View>
      </View>
      
      {/* Timeline con pinch zoom */}
      <View 
        style={styles.timelineContainer}
        {...zoomPanResponder.panHandlers}
      >
        {/* Ruler di tempo */}
        <View style={styles.ruler}>
          <ScrollView
            horizontal
            ref={scrollViewRef}
            scrollEventThrottle={16}
            onScroll={(e) => {
              scrollX.current = e.nativeEvent.contentOffset.x;
            }}
          >
            <View style={[styles.rulerContent, { width: timelineWidth + TIMELINE_PADDING * 2 }]}>
              {renderTimeMarkers()}
            </View>
          </ScrollView>
        </View>
        
        {/* Tracce */}
        <ScrollView
          horizontal
          ref={scrollViewRef}
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollX.current = e.nativeEvent.contentOffset.x;
            // Sincronizza scroll tra ruler e tracce
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false });
            }
          }}
        >
          <View style={[styles.tracksContainer, { width: timelineWidth + TIMELINE_PADDING * 2 }]}>
            {tracks.map(trackNumber => (
              <View 
                key={`track-${trackNumber}`}
                style={[styles.track, { height: TRACK_HEIGHT }]}
              >
                {renderTrackItems(trackNumber)}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      
      {/* Note esplicative per mobile */}
      <View style={styles.helpTextContainer}>
        <Text style={styles.helpText}>
          Pizzica per zoom, scorri per navigare, tocca un elemento per selezionarlo
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  controls: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  zoomButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  zoomText: {
    marginHorizontal: 8,
    fontSize: 12,
    color: '#555',
    width: 40,
    textAlign: 'center',
  },
  timeDisplay: {
    marginLeft: 'auto',
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  timelineContainer: {
    height: TRACK_HEIGHT * 3 + 40, // Altezza per visualizzare 3 tracce + ruler
  },
  ruler: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#e8e8e8',
  },
  rulerContent: {
    height: 30,
    paddingLeft: TIMELINE_PADDING,
    paddingRight: TIMELINE_PADDING,
  },
  timeMarker: {
    position: 'absolute',
    height: 30,
    width: 1,
    backgroundColor: '#aaa',
  },
  timeMarkerText: {
    position: 'absolute',
    top: 2,
    left: 4,
    fontSize: 10,
    color: '#555',
  },
  tracksContainer: {
    paddingLeft: TIMELINE_PADDING,
    paddingRight: TIMELINE_PADDING,
  },
  track: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'white',
    position: 'relative',
  },
  timelineItem: {
    position: 'absolute',
    height: TRACK_HEIGHT - 10,
    top: 5,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 6,
    minWidth: 30,
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: '#000',
  },
  itemText: {
    color: 'white',
    fontSize: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: 'bold',
  },
  helpTextContainer: {
    padding: 8,
    backgroundColor: '#FFFDE7',
    borderTopWidth: 1,
    borderTopColor: '#FFF9C4',
  },
  helpText: {
    color: '#795548',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default SimplifiedTimeline;