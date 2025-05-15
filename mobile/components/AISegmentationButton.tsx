import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, Alert, View } from 'react-native';
import { useSegmentationMutation } from '../hooks/useSegmentation';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

interface AISegmentationButtonProps {
  videoId: number;
  videoUrl: string;
}

// Configura notifiche push
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const AISegmentationButton: React.FC<AISegmentationButtonProps> = ({ videoId, videoUrl }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const navigation = useNavigation();
  const { mutate: requestSegmentation } = useSegmentationMutation();

  const handleRequestSegmentation = async () => {
    // Verifica che l'utente abbia concesso i permessi per le notifiche
    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;
    
    if (status !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Mostra alert di conferma
    Alert.alert(
      'Conferma segmentazione AI',
      'Il video verrà analizzato dall\'AI per creare automaticamente clip e sottotitoli. Riceverai una notifica al completamento. Vuoi procedere?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Procedi', 
          onPress: () => {
            setIsRequesting(true);
            
            requestSegmentation({ videoId, videoUrl }, {
              onSuccess: async (data) => {
                setIsRequesting(false);
                
                // Aggiornamento stato visivo
                Alert.alert(
                  'Richiesta inviata',
                  'L\'analisi del video è iniziata. Riceverai una notifica quando completata.',
                  [{ text: 'OK' }]
                );
                
                // Registra per notifica push al completamento
                if (finalStatus === 'granted') {
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: 'Segmentazione video avviata',
                      body: 'Ti avviseremo quando il tuo video sarà pronto',
                      data: { videoId, redirectTo: 'VideoProgress' },
                    },
                    trigger: null, // Invia immediatamente
                  });
                }
                
                // Naviga alla pagina di progress tracking
                navigation.navigate('VideoProgress', { videoId });
              },
              onError: (error) => {
                setIsRequesting(false);
                Alert.alert(
                  'Errore',
                  `Non è stato possibile avviare la segmentazione: ${error.message}`,
                  [{ text: 'OK' }]
                );
              }
            });
          } 
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, isRequesting && styles.buttonDisabled]}
      onPress={handleRequestSegmentation}
      disabled={isRequesting}
      activeOpacity={0.7}
    >
      {isRequesting ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="white" />
          <Text style={styles.loadingText}>Avvio...</Text>
        </View>
      ) : (
        <>
          <View style={styles.iconContainer}>
            <Text style={styles.magicIcon}>✨</Text>
          </View>
          <Text style={styles.buttonText}>Segmentazione AI</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#8057D7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  iconContainer: {
    marginRight: 8,
  },
  magicIcon: {
    fontSize: 18,
    color: 'white',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  }
});

export default AISegmentationButton;