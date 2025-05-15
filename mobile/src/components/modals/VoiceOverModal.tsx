import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Button from '../Button';
import { useTheme } from '../../hooks/useTheme';
import { useMutation } from '@tanstack/react-query';
import { generateVoiceOver } from '../../lib/api';

interface VoiceOverModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (voiceData: VoiceOverData) => void;
}

export interface VoiceOverData {
  text: string;
  voice: string;
  audioUrl?: string;
  duration?: number;
}

type Voice = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  language: string;
  description: string;
};

const VoiceOverModal: React.FC<VoiceOverModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { colors, isDark } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [voiceData, setVoiceData] = useState<VoiceOverData>({
    text: '',
    voice: 'it-IT-ElsaNeural',
  });
  
  // Voci italiane disponibili
  const availableVoices: Voice[] = [
    {
      id: 'it-IT-ElsaNeural',
      name: 'Elsa',
      gender: 'female',
      language: 'Italiano',
      description: 'Voce femminile chiara con accento standard'
    },
    {
      id: 'it-IT-IsabellaNeural',
      name: 'Isabella',
      gender: 'female',
      language: 'Italiano',
      description: 'Voce femminile emotiva con tono caldo'
    },
    {
      id: 'it-IT-DiegoNeural',
      name: 'Diego',
      gender: 'male',
      language: 'Italiano',
      description: 'Voce maschile professionale'
    },
  ];
  
  // Mutation per generare il voiceover
  const voiceOverMutation = useMutation({
    mutationFn: generateVoiceOver,
    onSuccess: (data) => {
      setVoiceData(prev => ({
        ...prev,
        audioUrl: data.audioUrl,
        duration: data.duration,
      }));
      
      // Carica anteprima audio
      loadAudio(data.audioUrl);
    },
    onError: (error: any) => {
      Alert.alert(
        'Errore',
        `Impossibile generare il voiceover: ${error.message || 'Si è verificato un errore'}`,
        [{ text: 'OK' }]
      );
    },
  });
  
  // Pulisce l'audio quando la modale viene chiusa
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  // Carica l'audio per la riproduzione
  const loadAudio = async (audioUrl: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false }
      );
      
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
          
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      });
      
      setSound(newSound);
    } catch (error) {
      console.error('Errore nel caricamento dell\'audio:', error);
      Alert.alert('Errore', 'Impossibile caricare l\'anteprima audio');
    }
  };
  
  // Gestisce play/pause
  const togglePlayback = async () => {
    if (!sound || !voiceData.audioUrl) return;
    
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playFromPositionAsync(0);
    }
  };
  
  const updateVoiceData = (key: keyof VoiceOverData, value: any) => {
    setVoiceData(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  const handleGenerate = () => {
    if (!voiceData.text.trim()) {
      Alert.alert('Attenzione', 'Inserisci il testo da convertire in voce');
      return;
    }
    
    voiceOverMutation.mutate({
      text: voiceData.text,
      voice: voiceData.voice,
    });
  };
  
  const handleSave = () => {
    if (!voiceData.audioUrl) {
      Alert.alert(
        'Nessun audio generato',
        'Genera prima il voiceover prima di salvare',
        [{ text: 'OK' }]
      );
      return;
    }
    
    onSave(voiceData);
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[
        styles.modalOverlay,
        { backgroundColor: 'rgba(0,0,0,0.5)' }
      ]}>
        <View style={[
          styles.modalContainer,
          { backgroundColor: colors.card }
        ]}>
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="mic" size={20} color={colors.primary} style={styles.headerIcon} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Genera Voice-Over
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Testo da convertire in voce</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: colors.text,
                    backgroundColor: isDark ? colors.background : '#f7f8fa',
                    borderColor: colors.border,
                  }
                ]}
                value={voiceData.text}
                onChangeText={(value) => updateVoiceData('text', value)}
                multiline
                numberOfLines={5}
                placeholderTextColor={colors.textSecondary}
                placeholder="Inserisci il testo da convertire in voce"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Seleziona voce</Text>
              <View style={styles.voiceOptions}>
                {availableVoices.map((voice) => (
                  <TouchableOpacity
                    key={voice.id}
                    style={[
                      styles.voiceOption,
                      voiceData.voice === voice.id && { 
                        backgroundColor: colors.primaryLight,
                        borderColor: colors.primary 
                      },
                      { 
                        borderColor: colors.border,
                        backgroundColor: isDark ? colors.background : '#f7f8fa',
                      }
                    ]}
                    onPress={() => updateVoiceData('voice', voice.id)}
                  >
                    <View style={styles.voiceHeader}>
                      <Ionicons 
                        name={voice.gender === 'female' ? 'female' : 'male'} 
                        size={16} 
                        color={voiceData.voice === voice.id ? colors.primary : colors.text} 
                        style={styles.voiceIcon}
                      />
                      <Text style={[
                        styles.voiceName,
                        { color: voiceData.voice === voice.id ? colors.primary : colors.text }
                      ]}>
                        {voice.name}
                      </Text>
                    </View>
                    <Text style={[styles.voiceDescription, { color: colors.textSecondary }]}>
                      {voice.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {voiceOverMutation.isPending ? (
              <View style={[styles.generateButton, styles.loadingContainer]}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Generazione in corso...
                </Text>
              </View>
            ) : (
              <Button
                title="Genera Voice-Over"
                onPress={handleGenerate}
                icon={<Ionicons name="mic" size={16} color="#fff" style={{ marginRight: 6 }} />}
                style={styles.generateButton}
              />
            )}
            
            {voiceData.audioUrl && (
              <View style={[
                styles.previewContainer,
                { 
                  backgroundColor: isDark ? colors.background : '#f7f8fa',
                  borderColor: colors.border 
                }
              ]}>
                <Text style={[styles.previewTitle, { color: colors.text }]}>
                  Anteprima Audio
                </Text>
                
                <View style={styles.audioControls}>
                  <TouchableOpacity 
                    style={[
                      styles.playButton,
                      { backgroundColor: colors.primary }
                    ]} 
                    onPress={togglePlayback}
                  >
                    <Ionicons 
                      name={isPlaying ? 'pause' : 'play'} 
                      size={24} 
                      color="white" 
                    />
                  </TouchableOpacity>
                  
                  <View style={styles.audioInfo}>
                    <Text style={[styles.audioInfoText, { color: colors.text }]}>
                      {voiceData.duration ? `Durata: ${voiceData.duration.toFixed(1)}s` : 'Audio generato'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button 
              title="Annulla" 
              onPress={onClose} 
              style={styles.footerButton}
              variant="outline"
            />
            <Button 
              title="Aggiungi alla Timeline" 
              onPress={handleSave} 
              style={styles.footerButton}
              disabled={!voiceData.audioUrl}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    borderRadius: 12,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    padding: 16,
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  voiceOptions: {
    marginBottom: 16,
  },
  voiceOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  voiceIcon: {
    marginRight: 6,
  },
  voiceName: {
    fontWeight: '500',
    fontSize: 14,
  },
  voiceDescription: {
    fontSize: 12,
  },
  generateButton: {
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f8fa',
    padding: 12,
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  previewContainer: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioInfo: {
    marginLeft: 12,
  },
  audioInfoText: {
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default VoiceOverModal;