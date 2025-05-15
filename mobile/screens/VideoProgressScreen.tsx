import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSegmentationStatus } from '../hooks/useSegmentation';
import ProgressBar from '../components/ui/ProgressBar';
import { Card } from '../components/ui/Card';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

export const VideoProgressScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { videoId } = route.params as { videoId: number };
  
  const { 
    data: segmentationStatus, 
    isLoading, 
    error 
  } = useSegmentationStatus(videoId);
  
  // Configura le notifiche di completamento
  useEffect(() => {
    // Configurazione iniziale delle notifiche
    const configureNotifications = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('segmentation-updates', {
          name: 'Aggiornamenti segmentazione video',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8057D7',
        });
      }
      
      // Listener per notifiche ricevute quando l'app è in foreground
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notifica ricevuta in foreground:', notification);
      });
      
      // Listener per gestire il tap su una notifica
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        const { videoId, redirectTo } = response.notification.request.content.data;
        
        if (redirectTo === 'VideoProgress' && videoId) {
          navigation.navigate('VideoProgress', { videoId });
        }
      });
      
      return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
      };
    };
    
    configureNotifications();
  }, [navigation]);
  
  // Invia notifica quando la segmentazione è completata
  useEffect(() => {
    const sendCompletionNotification = async () => {
      if (segmentationStatus?.status === 'completed') {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '✅ Segmentazione video completata',
              body: 'Il tuo video è stato analizzato e segmentato con successo.',
              data: { videoId, redirectTo: 'ProjectDetail' },
            },
            trigger: null, // Invia immediatamente
          });
        } catch (error) {
          console.error('Errore invio notifica:', error);
        }
      } else if (segmentationStatus?.status === 'failed') {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '❌ Segmentazione video fallita',
              body: 'Si è verificato un errore durante l\'elaborazione del video.',
              data: { videoId, redirectTo: 'VideoProgress' },
            },
            trigger: null,
          });
        } catch (error) {
          console.error('Errore invio notifica:', error);
        }
      }
    };
    
    sendCompletionNotification();
  }, [segmentationStatus?.status, videoId]);
  
  // Funzione per ottenere lo stato percentuale
  const getProgressPercentage = () => {
    if (!segmentationStatus) return 0;
    
    switch (segmentationStatus.status) {
      case 'queued':
        return 5;
      case 'processing':
        return Math.max(10, Math.min(95, segmentationStatus.progress || 10));
      case 'completed':
        return 100;
      case 'failed':
        return segmentationStatus.progress || 50;
      default:
        return 0;
    }
  };
  
  // Determina lo stato corrente per visualizzazione
  const getCurrentStageText = () => {
    if (!segmentationStatus) return 'Inizializzazione...';
    
    if (segmentationStatus.status === 'queued') {
      return 'In coda per l\'elaborazione...';
    } else if (segmentationStatus.status === 'processing') {
      return segmentationStatus.currentStage || 'Analisi video in corso...';
    } else if (segmentationStatus.status === 'completed') {
      return 'Segmentazione completata con successo';
    } else if (segmentationStatus.status === 'failed') {
      return `Errore: ${segmentationStatus.error || 'Si è verificato un problema'}`;
    }
    
    return 'Stato sconosciuto';
  };
  
  // Ottieni il colore in base allo stato
  const getStatusColor = () => {
    if (!segmentationStatus) return '#0066cc';
    
    switch (segmentationStatus.status) {
      case 'queued':
        return '#ffa000';
      case 'processing':
        return '#0066cc';
      case 'completed':
        return '#00C853';
      case 'failed':
        return '#d32f2f';
      default:
        return '#0066cc';
    }
  };
  
  // Verifica errori di caricamento
  if (error) {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={48} color="#d32f2f" />
          <Text style={styles.errorTitle}>Errore di caricamento</Text>
          <Text style={styles.errorText}>
            Non è stato possibile recuperare lo stato dell'elaborazione.
          </Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
        </Card>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.progressCard}>
        <Text style={styles.title}>Segmentazione Video AI</Text>
        
        <View style={styles.statusContainer}>
          <View style={styles.iconContainer}>
            {segmentationStatus?.status === 'completed' ? (
              <Ionicons name="checkmark-circle" size={36} color="#00C853" />
            ) : segmentationStatus?.status === 'failed' ? (
              <Ionicons name="close-circle" size={36} color="#d32f2f" />
            ) : (
              <Ionicons name="hourglass-outline" size={36} color={getStatusColor()} />
            )}
          </View>
          
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusText}>
              {isLoading ? 'Caricamento stato...' : getCurrentStageText()}
            </Text>
            
            <ProgressBar 
              progress={getProgressPercentage()} 
              color={getStatusColor()}
              style={styles.progressBar} 
            />
            
            <Text style={styles.progressText}>
              {getProgressPercentage()}% completato
            </Text>
          </View>
        </View>
        
        {segmentationStatus?.segmentCount > 0 && (
          <View style={styles.segmentInfo}>
            <Text style={styles.segmentInfoText}>
              <Text style={styles.segmentInfoHighlight}>{segmentationStatus.segmentCount}</Text> segmenti rilevati
            </Text>
          </View>
        )}
        
        {segmentationStatus?.status === 'completed' && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              La segmentazione è stata completata con successo.
            </Text>
            <Text style={styles.instructionText}>
              Puoi visualizzare i segmenti generati nella timeline del progetto.
            </Text>
          </View>
        )}
        
        {segmentationStatus?.status === 'failed' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>
              {segmentationStatus.error || 'Si è verificato un errore durante la segmentazione.'}
            </Text>
            <Text style={styles.retryText}>
              Puoi riprovare a segmentare il video dalla pagina del progetto.
            </Text>
          </View>
        )}
      </Card>
      
      {/* Dettagli tecnici */}
      {segmentationStatus?.currentStage && (
        <Card style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Dettagli tecnici</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fase corrente:</Text>
            <Text style={styles.detailValue}>{segmentationStatus.currentStage}</Text>
          </View>
          {segmentationStatus.segments?.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Segmenti trovati:</Text>
              <Text style={styles.detailValue}>{segmentationStatus.segments.length}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID richiesta:</Text>
            <Text style={styles.detailValue}>{segmentationStatus.id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Richiesta effettuata:</Text>
            <Text style={styles.detailValue}>
              {new Date(segmentationStatus.createdAt).toLocaleString('it-IT')}
            </Text>
          </View>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  progressCard: {
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333'
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
    fontWeight: '500',
  },
  progressBar: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  segmentInfo: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 6,
    marginVertical: 12,
  },
  segmentInfoText: {
    color: '#333',
    textAlign: 'center',
  },
  segmentInfoHighlight: {
    fontWeight: 'bold',
    color: '#0066cc',
  },
  successContainer: {
    backgroundColor: '#f0fff0',
    padding: 16,
    borderRadius: 6,
    marginTop: 16,
  },
  successText: {
    color: '#00C853',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    color: '#333',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fff0f0',
    padding: 16,
    borderRadius: 6,
    marginTop: 16,
  },
  errorMessage: {
    color: '#d32f2f',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    color: '#333',
    textAlign: 'center',
  },
  detailsCard: {
    padding: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    color: '#666',
    fontSize: 14,
  },
  detailValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
  },
  errorCard: {
    padding: 20,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginVertical: 8,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#666',
  },
  errorDetail: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default VideoProgressScreen;