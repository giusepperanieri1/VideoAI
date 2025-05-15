import React from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  useWindowDimensions, 
  Pressable,
  Platform
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  pressable?: boolean;
  elevation?: number;
}

/**
 * Componente Card per mobile
 * - Ottimizzato per prestazioni di rendering
 * - Supporta feedback tattile
 * - Adattivo alle diverse dimensioni dello schermo
 */
export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  onPress, 
  pressable = false,
  elevation = 2
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 360;

  // Valore animato per feedback tattile
  const scale = useSharedValue(1);
  
  // Stile animato per il feedback al tocco
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });
  
  // Gestori eventi touch per feedback
  const handlePressIn = () => {
    if (pressable || onPress) {
      scale.value = withTiming(0.98, { duration: 100 });
    }
  };
  
  const handlePressOut = () => {
    if (pressable || onPress) {
      scale.value = withTiming(1, { duration: 200 });
    }
  };

  // Calcola shadow in base all'elevation
  const shadowStyles = React.useMemo(() => ({
    ...styles.shadow,
    shadowRadius: elevation * 0.8,
    shadowOpacity: Math.min(0.2, elevation * 0.04),
    elevation: elevation,
  }), [elevation]);
  
  // Calcola padding in base alla dimensione dello schermo
  const paddingStyles = React.useMemo(() => ({
    padding: isSmallScreen ? 12 : 16,
  }), [isSmallScreen]);
  
  // Contenuto della card
  const cardContent = (
    <Animated.View 
      style={[
        styles.container,
        paddingStyles,
        shadowStyles,
        animatedStyle,
        style
      ]}
    >
      {children}
    </Animated.View>
  );
  
  // Se pressable, avvolgi in un Pressable
  if (pressable || onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.05)', radius: -5 }}
        style={styles.pressableWrapper}
      >
        {cardContent}
      </Pressable>
    );
  }
  
  return cardContent;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
      },
      android: {},
    }),
  },
  pressableWrapper: {
    overflow: 'hidden',
    borderRadius: 8,
  }
});

export default Card;