import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../Button';
import { useTheme } from '../../hooks/useTheme';

interface TextOverlayModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (textData: TextOverlayData) => void;
}

export interface TextOverlayData {
  text: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
  alignment: 'left' | 'center' | 'right';
  hasBorder: boolean;
  duration: number;
}

const TextOverlayModal: React.FC<TextOverlayModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { colors, isDark } = useTheme();
  
  const [textData, setTextData] = useState<TextOverlayData>({
    text: '',
    fontSize: 24,
    color: '#ffffff',
    backgroundColor: 'transparent',
    position: 'center',
    alignment: 'center',
    hasBorder: false,
    duration: 3,
  });
  
  const fontSizeOptions = [18, 24, 36, 48];
  const colorOptions = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00'];
  const durationOptions = [2, 3, 5, 8, 10];
  
  const updateTextData = (key: keyof TextOverlayData, value: any) => {
    setTextData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  
  const handleSave = () => {
    onSave(textData);
    onClose();
  };
  
  const getBackgroundStyle = () => {
    return textData.backgroundColor !== 'transparent'
      ? { backgroundColor: textData.backgroundColor }
      : {};
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
              <Ionicons name="text" size={20} color={colors.primary} style={styles.headerIcon} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Aggiungi Testo
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
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
                value={textData.text}
                onChangeText={(value) => updateTextData('text', value)}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textSecondary}
                placeholder="Inserisci il testo da mostrare"
              />
            </View>
            
            <View style={styles.previewContainer}>
              <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Anteprima</Text>
              <View style={[
                styles.textPreview,
                {
                  borderColor: colors.border,
                  ...getBackgroundStyle(),
                }
              ]}>
                <Text style={[
                  styles.previewText,
                  {
                    color: textData.color,
                    fontSize: textData.fontSize,
                    textAlign: textData.alignment,
                  },
                  textData.hasBorder && styles.previewTextBorder,
                ]}>
                  {textData.text || 'Testo di esempio'}
                </Text>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Dimensione Font</Text>
              <View style={styles.optionsRow}>
                {fontSizeOptions.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeOption,
                      textData.fontSize === size && { 
                        backgroundColor: colors.primaryLight,
                        borderColor: colors.primary 
                      },
                      { 
                        borderColor: colors.border,
                        backgroundColor: isDark ? colors.background : '#f7f8fa',
                      }
                    ]}
                    onPress={() => updateTextData('fontSize', size)}
                  >
                    <Text style={[
                      styles.sizeText,
                      { color: textData.fontSize === size ? colors.primary : colors.text }
                    ]}>
                      {size}px
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Colore Testo</Text>
              <View style={styles.colorOptions}>
                {colorOptions.map((colorOption) => (
                  <TouchableOpacity
                    key={colorOption}
                    style={[
                      styles.colorOption,
                      { backgroundColor: colorOption },
                      textData.color === colorOption && styles.selectedColorOption,
                    ]}
                    onPress={() => updateTextData('color', colorOption)}
                  />
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Posizione</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[
                    styles.positionOption,
                    textData.position === 'top' && { 
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary 
                    },
                    { 
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : '#f7f8fa',
                    }
                  ]}
                  onPress={() => updateTextData('position', 'top')}
                >
                  <Ionicons 
                    name="arrow-up" 
                    size={16} 
                    color={textData.position === 'top' ? colors.primary : colors.text} 
                    style={styles.positionIcon} 
                  />
                  <Text style={[
                    styles.positionText,
                    { color: textData.position === 'top' ? colors.primary : colors.text }
                  ]}>
                    Alto
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.positionOption,
                    textData.position === 'center' && { 
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary 
                    },
                    { 
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : '#f7f8fa',
                    }
                  ]}
                  onPress={() => updateTextData('position', 'center')}
                >
                  <Ionicons 
                    name="remove" 
                    size={16} 
                    color={textData.position === 'center' ? colors.primary : colors.text} 
                    style={styles.positionIcon} 
                  />
                  <Text style={[
                    styles.positionText,
                    { color: textData.position === 'center' ? colors.primary : colors.text }
                  ]}>
                    Centro
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.positionOption,
                    textData.position === 'bottom' && { 
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary 
                    },
                    { 
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : '#f7f8fa',
                    }
                  ]}
                  onPress={() => updateTextData('position', 'bottom')}
                >
                  <Ionicons 
                    name="arrow-down" 
                    size={16} 
                    color={textData.position === 'bottom' ? colors.primary : colors.text} 
                    style={styles.positionIcon} 
                  />
                  <Text style={[
                    styles.positionText,
                    { color: textData.position === 'bottom' ? colors.primary : colors.text }
                  ]}>
                    Basso
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Allineamento</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[
                    styles.alignOption,
                    textData.alignment === 'left' && { 
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary 
                    },
                    { 
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : '#f7f8fa',
                    }
                  ]}
                  onPress={() => updateTextData('alignment', 'left')}
                >
                  <Ionicons 
                    name="text-left" 
                    size={16} 
                    color={textData.alignment === 'left' ? colors.primary : colors.text} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.alignOption,
                    textData.alignment === 'center' && { 
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary 
                    },
                    { 
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : '#f7f8fa',
                    }
                  ]}
                  onPress={() => updateTextData('alignment', 'center')}
                >
                  <Ionicons 
                    name="text-center" 
                    size={16} 
                    color={textData.alignment === 'center' ? colors.primary : colors.text} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.alignOption,
                    textData.alignment === 'right' && { 
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary 
                    },
                    { 
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : '#f7f8fa',
                    }
                  ]}
                  onPress={() => updateTextData('alignment', 'right')}
                >
                  <Ionicons 
                    name="text-right" 
                    size={16} 
                    color={textData.alignment === 'right' ? colors.primary : colors.text} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Durata (secondi)</Text>
              <View style={styles.optionsRow}>
                {durationOptions.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationOption,
                      textData.duration === duration && { 
                        backgroundColor: colors.primaryLight,
                        borderColor: colors.primary 
                      },
                      { 
                        borderColor: colors.border,
                        backgroundColor: isDark ? colors.background : '#f7f8fa',
                      }
                    ]}
                    onPress={() => updateTextData('duration', duration)}
                  >
                    <Text style={[
                      styles.durationText,
                      { color: textData.duration === duration ? colors.primary : colors.text }
                    ]}>
                      {duration}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={[styles.label, { color: colors.text }]}>Aggiungi contorno</Text>
                <Switch
                  value={textData.hasBorder}
                  onValueChange={(value) => updateTextData('hasBorder', value)}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={textData.hasBorder ? colors.primary : '#f4f3f4'}
                />
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button 
              title="Annulla" 
              onPress={onClose} 
              style={styles.footerButton}
              variant="outline"
            />
            <Button 
              title="Aggiungi" 
              onPress={handleSave} 
              style={styles.footerButton}
              disabled={!textData.text.trim()}
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
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  textPreview: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    minHeight: 80,
    justifyContent: 'center',
  },
  previewText: {
    textAlign: 'center',
  },
  previewTextBorder: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  sizeText: {
    fontSize: 13,
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
  positionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  positionIcon: {
    marginRight: 6,
  },
  positionText: {
    fontSize: 13,
  },
  alignOption: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  durationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  durationText: {
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

export default TextOverlayModal;