import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const { colors, isDark } = useTheme();
  
  // Determina lo stile del pulsante in base alla variante
  const getButtonStyle = () => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.primary,
    };
    
    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: isDark ? '#374151' : '#f3f4f6',
          borderColor: isDark ? '#4b5563' : '#d1d5db',
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: colors.error,
          borderColor: colors.error,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };
  
  // Determina lo stile del testo in base alla variante
  const getTextStyle = () => {
    const baseStyle: TextStyle = {
      color: '#ffffff',
      fontWeight: '600',
    };
    
    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          color: colors.text,
        };
      case 'outline':
        return {
          ...baseStyle,
          color: colors.primary,
        };
      case 'danger':
        return {
          ...baseStyle,
          color: '#ffffff',
        };
      case 'ghost':
        return {
          ...baseStyle,
          color: colors.primary,
        };
      default:
        return baseStyle;
    }
  };
  
  // Determina la dimensione del pulsante
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 4,
        };
      case 'large':
        return {
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderRadius: 8,
        };
      default:
        return {
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 6,
        };
    }
  };
  
  // Determina le dimensioni del testo in base alla dimensione del pulsante
  const getTextSizeStyle = () => {
    switch (size) {
      case 'small':
        return { fontSize: 14 };
      case 'large':
        return { fontSize: 18 };
      default:
        return { fontSize: 16 };
    }
  };
  
  // Combina tutti gli stili
  const buttonStyle = [
    styles.button,
    getButtonStyle(),
    getSizeStyle(),
    disabled && { opacity: 0.6 },
    fullWidth && { width: '100%' },
    style,
  ];
  
  const buttonTextStyle = [
    styles.text,
    getTextStyle(),
    getTextSizeStyle(),
    textStyle,
  ];
  
  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#ffffff'} 
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          
          <Text style={buttonTextStyle}>
            {title}
          </Text>
          
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;