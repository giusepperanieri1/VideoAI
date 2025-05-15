import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Slider,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import Button from './Button';

// Tipi per gli elementi della timeline
type TimelineItem = {
  id: number;
  type: 'text' | 'image' | 'video' | 'audio' | 'transition';
  startTime: number;
  duration: number;
  content: any;
};

interface PropertiesPanelProps {
  item: TimelineItem | null;
  onUpdateItem: (item: TimelineItem) => void;
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  item,
  onUpdateItem,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [updatedItem, setUpdatedItem] = useState<TimelineItem | null>(item);
  
  if (!item || !updatedItem) {
    return (
      <View style={[
        styles.container, 
        { backgroundColor: colors.card, borderColor: colors.border }
      ]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Proprietà</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContent}>
          <Ionicons name="options-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Seleziona un elemento nella timeline
          </Text>
        </View>
      </View>
    );
  }
  
  const handleSave = () => {
    if (updatedItem) {
      onUpdateItem(updatedItem);
      onClose();
    }
  };
  
  const updateContent = (key: string, value: any) => {
    setUpdatedItem({
      ...updatedItem,
      content: {
        ...updatedItem.content,
        [key]: value,
      },
    });
  };
  
  const updateProperty = (key: string, value: any) => {
    setUpdatedItem({
      ...updatedItem,
      [key]: value,
    });
  };
  
  const renderTextProperties = () => {
    const { text, fontSize = 24, color = '#ffffff', backgroundColor = 'transparent', alignment = 'center' } = updatedItem.content;
    
    return (
      <>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Testo</Text>
          <TextInput
            style={[
              styles.input,
              { 
                color: colors.text,
                backgroundColor: isDark ? colors.background : '#f7f8fa',
                borderColor: colors.border,
              }
            ]}
            value={text}
            onChangeText={(value) => updateContent('text', value)}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
            placeholder="Inserisci il testo"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Dimensione Font</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={12}
              maximumValue={80}
              step={1}
              value={fontSize}
              onValueChange={(value) => updateContent('fontSize', value)}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
            />
            <Text style={[styles.sliderValue, { color: colors.text }]}>{Math.round(fontSize)}px</Text>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Colore Testo</Text>
          <View style={styles.colorOptions}>
            {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map((colorOption) => (
              <TouchableOpacity
                key={colorOption}
                style={[
                  styles.colorOption,
                  { backgroundColor: colorOption },
                  color === colorOption && styles.selectedColorOption,
                ]}
                onPress={() => updateContent('color', colorOption)}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Allineamento</Text>
          <View style={styles.alignmentButtons}>
            <TouchableOpacity
              style={[
                styles.alignButton,
                alignment === 'left' && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => updateContent('alignment', 'left')}
            >
              <Ionicons 
                name="text-left" 
                size={20} 
                color={alignment === 'left' ? colors.primary : colors.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.alignButton,
                alignment === 'center' && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => updateContent('alignment', 'center')}
            >
              <Ionicons 
                name="text-center" 
                size={20} 
                color={alignment === 'center' ? colors.primary : colors.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.alignButton,
                alignment === 'right' && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => updateContent('alignment', 'right')}
            >
              <Ionicons 
                name="text-right" 
                size={20} 
                color={alignment === 'right' ? colors.primary : colors.text} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };
  
  const renderVideoProperties = () => {
    const { volume = 1.0, speed = 1.0, looping = false } = updatedItem.content;
    
    return (
      <>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Volume</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.1}
              value={volume}
              onValueChange={(value) => updateContent('volume', value)}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
            />
            <Text style={[styles.sliderValue, { color: colors.text }]}>{Math.round(volume * 100)}%</Text>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Velocità</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={2}
              step={0.1}
              value={speed}
              onValueChange={(value) => updateContent('speed', value)}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
            />
            <Text style={[styles.sliderValue, { color: colors.text }]}>{speed.toFixed(1)}x</Text>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: colors.text }]}>Riproduzione ciclica</Text>
            <Switch
              value={looping}
              onValueChange={(value) => updateContent('looping', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={looping ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>
      </>
    );
  };
  
  const renderAudioProperties = () => {
    const { volume = 1.0, fadeIn = 0, fadeOut = 0 } = updatedItem.content;
    
    return (
      <>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Volume</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.1}
              value={volume}
              onValueChange={(value) => updateContent('volume', value)}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
            />
            <Text style={[styles.sliderValue, { color: colors.text }]}>{Math.round(volume * 100)}%</Text>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Fade In (sec)</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={5}
              step={0.1}
              value={fadeIn}
              onValueChange={(value) => updateContent('fadeIn', value)}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
            />
            <Text style={[styles.sliderValue, { color: colors.text }]}>{fadeIn.toFixed(1)}s</Text>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Fade Out (sec)</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={5}
              step={0.1}
              value={fadeOut}
              onValueChange={(value) => updateContent('fadeOut', value)}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
            />
            <Text style={[styles.sliderValue, { color: colors.text }]}>{fadeOut.toFixed(1)}s</Text>
          </View>
        </View>
      </>
    );
  };
  
  const renderTransitionProperties = () => {
    const { type = 'fade', duration = 1 } = updatedItem.content;
    
    return (
      <>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Tipo Transizione</Text>
          <View style={styles.transitionOptions}>
            {['fade', 'wipe', 'slide', 'zoom'].map((transitionType) => (
              <TouchableOpacity
                key={transitionType}
                style={[
                  styles.transitionOption,
                  {
                    backgroundColor: type === transitionType ? colors.primaryLight : isDark ? colors.background : '#f7f8fa',
                    borderColor: type === transitionType ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => updateContent('type', transitionType)}
              >
                <Text 
                  style={[
                    styles.transitionText, 
                    { color: type === transitionType ? colors.primary : colors.text }
                  ]}
                >
                  {transitionType.charAt(0).toUpperCase() + transitionType.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Durata (sec)</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={3}
              step={0.1}
              value={duration}
              onValueChange={(value) => updateContent('duration', value)}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
            />
            <Text style={[styles.sliderValue, { color: colors.text }]}>{duration.toFixed(1)}s</Text>
          </View>
        </View>
      </>
    );
  };
  
  // Proprietà comuni a tutti i tipi di elementi
  const renderCommonProperties = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Tempo di inizio (sec)</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={60}
            step={0.1}
            value={updatedItem.startTime}
            onValueChange={(value) => updateProperty('startTime', value)}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
          <Text style={[styles.sliderValue, { color: colors.text }]}>{updatedItem.startTime.toFixed(1)}s</Text>
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Durata (sec)</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={30}
            step={0.1}
            value={updatedItem.duration}
            onValueChange={(value) => updateProperty('duration', value)}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
          <Text style={[styles.sliderValue, { color: colors.text }]}>{updatedItem.duration.toFixed(1)}s</Text>
        </View>
      </View>
    </>
  );
  
  let iconName: string;
  let itemTypeName: string;
  
  switch (updatedItem.type) {
    case 'text':
      iconName = 'text';
      itemTypeName = 'Testo';
      break;
    case 'image':
      iconName = 'image';
      itemTypeName = 'Immagine';
      break;
    case 'video':
      iconName = 'videocam';
      itemTypeName = 'Video';
      break;
    case 'audio':
      iconName = 'musical-note';
      itemTypeName = 'Audio';
      break;
    case 'transition':
      iconName = 'git-merge';
      itemTypeName = 'Transizione';
      break;
    default:
      iconName = 'help-circle';
      itemTypeName = 'Elemento';
  }
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: colors.card, borderColor: colors.border }
    ]}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Ionicons name={iconName as any} size={20} color={colors.primary} style={styles.headerIcon} />
          <Text style={[styles.title, { color: colors.text }]}>
            {itemTypeName}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContent}>
        {renderCommonProperties()}
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        {updatedItem.type === 'text' && renderTextProperties()}
        {updatedItem.type === 'video' && renderVideoProperties()}
        {updatedItem.type === 'audio' && renderAudioProperties()}
        {updatedItem.type === 'transition' && renderTransitionProperties()}
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Applica Modifiche"
          onPress={handleSave}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    margin: 8,
    overflow: 'hidden',
  },
  header: {
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
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
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
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    width: 50,
    textAlign: 'right',
    fontSize: 14,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#4299e1',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alignmentButtons: {
    flexDirection: 'row',
  },
  alignButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 12,
  },
  transitionOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  transitionOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  transitionText: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  footer: {
    padding: 16,
    flexDirection: 'row',
  },
});

export default PropertiesPanel;