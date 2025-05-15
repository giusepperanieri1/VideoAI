import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing
} from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
}

/**
 * Componente ProgressBar ottimizzato per mobile
 * - Usa animazioni Reanimated per prestazioni fluide
 * - Supporta temi personalizzati
 * - Ottimizzato per interfacce utente responsive
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = '#0066cc',
  backgroundColor = '#e0e0e0',
  height = 8,
  style
}) => {
  // Assicura che il progresso sia nel range 0-100
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  // Valore animato per la larghezza della barra
  const progressWidth = useSharedValue(clampedProgress);
  
  // Aggiorna il valore animato quando cambia il progresso
  React.useEffect(() => {
    progressWidth.value = withTiming(clampedProgress, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [clampedProgress, progressWidth]);
  
  // Stile animato per la barra di progresso
  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });
  
  return (
    <View style={[styles.container, { height, backgroundColor }, style]}>
      <Animated.View 
        style={[
          styles.progressBar, 
          { backgroundColor: color },
          progressStyle
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
});

export default ProgressBar;