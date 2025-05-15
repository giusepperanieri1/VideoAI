import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from '../hooks/useTheme';
import { createVideo } from '../lib/api';
import Button from '../components/Button';
import { APP_CONFIG } from '../lib/config';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';

// Tipo per la navigazione
type NavigationProp = NativeStackNavigationProp<RootStackParamList & MainTabParamList>;

const CreateScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  
  // Stato del form
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('modern');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(30);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
  const [voiceStyle, setVoiceStyle] = useState('it-IT-WavenetA');
  
  // Carica le opzioni dalla configurazione
  const aspectRatioOptions = APP_CONFIG.VIDEO_GENERATION.DEFAULT_ASPECT_RATIOS;
  const styleOptions = APP_CONFIG.VIDEO_GENERATION.DEFAULT_STYLES;
  const durationOptions = APP_CONFIG.VIDEO_GENERATION.DEFAULT_DURATIONS;
  const voiceOptions = APP_CONFIG.VIDEO_GENERATION.DEFAULT_VOICES;
  
  // Validazione del form
  const isFormValid = title.trim() !== '' && prompt.trim() !== '';
  
  // Mutation per creare un video
  const createVideoMutation = useMutation({
    mutationFn: createVideo,
    onSuccess: (data) => {
      Alert.alert(
        'Creazione avviata!',
        'La generazione del tuo video è stata avviata. Riceverai una notifica quando sarà pronta.',
        [
          { 
            text: 'Vai ai miei progetti', 
            onPress: () => navigation.navigate('Projects')
          },
          { 
            text: 'Resta qui', 
            style: 'cancel'
          }
        ]
      );
      
      // Reset del form
      setTitle('');
      setPrompt('');
      setStyle('modern');
      setAspectRatio('16:9');
      setDuration(30);
      setVoiceOverEnabled(true);
      setVoiceStyle('it-IT-WavenetA');
    },
    onError: (error: any) => {
      Alert.alert(
        'Errore',
        error.message || 'Si è verificato un errore durante la creazione del video. Riprova più tardi.',
        [{ text: 'OK' }]
      );
    },
  });
  
  // Gestisce la creazione del video
  const handleCreateVideo = () => {
    if (!isFormValid) {
      Alert.alert(
        'Form incompleto',
        'Per favore compila tutti i campi obbligatori (titolo e descrizione).',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Prepara i dati per la creazione del video
    const videoData = {
      title,
      prompt,
      style,
      aspectRatio,
      duration,
      voiceOverSettings: voiceOverEnabled
        ? { enabled: true, voice: voiceStyle }
        : { enabled: false },
    };
    
    createVideoMutation.mutate(videoData);
  };
  
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Crea un nuovo video
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
              Descrivi il video che desideri e l'AI lo creerà per te
            </Text>
          </View>
          
          {/* Form per la creazione del video */}
          <View style={styles.form}>
            {/* Titolo */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Titolo del video <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    color: colors.text,
                    backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                    borderColor: colors.border,
                  }
                ]}
                placeholder="Inserisci un titolo..."
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>
            
            {/* Prompt */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Descrizione dettagliata <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textarea, 
                  { 
                    color: colors.text,
                    backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                    borderColor: colors.border,
                  }
                ]}
                placeholder="Descrivi il video che desideri, con tutti i dettagli possibili..."
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                textAlignVertical="top"
                numberOfLines={5}
                maxLength={1000}
              />
              <Text style={[styles.charCount, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                {prompt.length}/1000
              </Text>
            </View>
            
            {/* Stile */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Stile
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.optionsScroll}
                contentContainerStyle={styles.optionsContainer}
              >
                {styleOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      { 
                        backgroundColor: style === option.value 
                          ? colors.primary 
                          : isDark ? '#1f2937' : '#f9fafb',
                        borderColor: style === option.value 
                          ? colors.primary 
                          : colors.border,
                      }
                    ]}
                    onPress={() => setStyle(option.value)}
                  >
                    <Text 
                      style={[
                        styles.optionText, 
                        { 
                          color: style === option.value 
                            ? 'white' 
                            : colors.text 
                        }
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Aspect Ratio */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Formato
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.optionsScroll}
                contentContainerStyle={styles.optionsContainer}
              >
                {aspectRatioOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      { 
                        backgroundColor: aspectRatio === option.value 
                          ? colors.primary 
                          : isDark ? '#1f2937' : '#f9fafb',
                        borderColor: aspectRatio === option.value 
                          ? colors.primary 
                          : colors.border,
                      }
                    ]}
                    onPress={() => setAspectRatio(option.value)}
                  >
                    <Text 
                      style={[
                        styles.optionText, 
                        { 
                          color: aspectRatio === option.value 
                            ? 'white' 
                            : colors.text 
                        }
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Durata */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Durata (secondi)
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.optionsScroll}
                contentContainerStyle={styles.optionsContainer}
              >
                {durationOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      styles.durationButton,
                      { 
                        backgroundColor: duration === option 
                          ? colors.primary 
                          : isDark ? '#1f2937' : '#f9fafb',
                        borderColor: duration === option 
                          ? colors.primary 
                          : colors.border,
                      }
                    ]}
                    onPress={() => setDuration(option)}
                  >
                    <Text 
                      style={[
                        styles.optionText, 
                        { 
                          color: duration === option 
                            ? 'white' 
                            : colors.text 
                        }
                      ]}
                    >
                      {option}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Voice-over */}
            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Voice-over
                </Text>
                <Switch
                  value={voiceOverEnabled}
                  onValueChange={setVoiceOverEnabled}
                  trackColor={{ false: '#e5e7eb', true: colors.primary + '80' }}
                  thumbColor={voiceOverEnabled ? colors.primary : '#f3f4f6'}
                  ios_backgroundColor="#e5e7eb"
                />
              </View>
              
              {voiceOverEnabled && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.optionsScroll}
                  contentContainerStyle={styles.optionsContainer}
                >
                  {voiceOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        { 
                          backgroundColor: voiceStyle === option.value 
                            ? colors.primary 
                            : isDark ? '#1f2937' : '#f9fafb',
                          borderColor: voiceStyle === option.value 
                            ? colors.primary 
                            : colors.border,
                        }
                      ]}
                      onPress={() => setVoiceStyle(option.value)}
                    >
                      <Text 
                        style={[
                          styles.optionText, 
                          { 
                            color: voiceStyle === option.value 
                              ? 'white' 
                              : colors.text 
                          }
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
            
            {/* Suggerimenti */}
            <View 
              style={[
                styles.tipsContainer, 
                { backgroundColor: isDark ? '#1f2937' : '#f9fafb', borderColor: colors.border }
              ]}
            >
              <View style={[styles.tipIconContainer, { backgroundColor: colors.info + '20' }]}>
                <Ionicons name="bulb-outline" size={20} color={colors.info} />
              </View>
              <Text style={[styles.tipsText, { color: colors.text }]}>
                Suggerimento: Per ottenere risultati migliori, fornisci dettagli specifici sulla scena, lo stile visivo, l'atmosfera e il tono desiderato.
              </Text>
            </View>
            
            {/* Pulsante di creazione */}
            <Button
              title="Genera video"
              onPress={handleCreateVideo}
              loading={createVideoMutation.isPending}
              disabled={!isFormValid || createVideoMutation.isPending}
              size="large"
              fullWidth
              style={styles.submitButton}
              icon={<Ionicons name="videocam" size={20} color="white" style={{ marginRight: 8 }} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  form: {
    
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textarea: {
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionsScroll: {
    marginHorizontal: -4,
  },
  optionsContainer: {
    paddingHorizontal: 4,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  durationButton: {
    minWidth: 60,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
  },
  tipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 12,
  },
});

export default CreateScreen;