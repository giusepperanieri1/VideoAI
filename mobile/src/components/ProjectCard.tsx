import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { formatDate, formatDuration } from '../lib/utils';
import { RootStackParamList } from '../navigation/AppNavigator';

interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    description?: string;
    thumbnail?: string;
    status?: string;
    duration?: number;
    createdAt: string;
    updatedAt?: string;
  };
  showDetails?: boolean;
  style?: any;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  showDetails = true,
  style,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isDark } = useTheme();
  
  const handlePress = () => {
    navigation.navigate('ProjectDetails', { id: project.id });
  };
  
  // Status del progetto
  const isPublished = project.status === 'published';
  const isDraft = project.status === 'draft';
  const isProcessing = project.status === 'processing';
  
  // Placeholder per i thumbnail mancanti
  const getPlaceholderColor = () => {
    return isDark ? '#1f2937' : '#f3f4f6';
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderColor: colors.border,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailContainer}>
        {project.thumbnail ? (
          <Image
            source={{ uri: project.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.thumbnailPlaceholder,
              { backgroundColor: getPlaceholderColor() },
            ]}
          >
            <Ionicons
              name="videocam"
              size={30}
              color={isDark ? '#6b7280' : '#9ca3af'}
            />
          </View>
        )}
        
        {project.duration && (
          <View style={[styles.durationBadge, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
            <Text style={styles.durationText}>
              {formatDuration(project.duration)}
            </Text>
          </View>
        )}
        
        {project.status && (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  isPublished
                    ? colors.success + 'CC'
                    : isDraft
                    ? colors.warning + 'CC'
                    : isProcessing
                    ? colors.primary + 'CC'
                    : 'rgba(0, 0, 0, 0.7)',
              },
            ]}
          >
            <Text style={styles.statusText}>
              {isPublished
                ? 'Pubblicato'
                : isDraft
                ? 'Bozza'
                : isProcessing
                ? 'In elaborazione'
                : project.status}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {project.title || 'Progetto senza titolo'}
        </Text>
        
        {showDetails && project.description && (
          <Text
            style={[
              styles.description,
              { color: isDark ? '#d1d5db' : '#4b5563' },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {project.description}
          </Text>
        )}
        
        <View style={styles.footer}>
          <Text
            style={[styles.date, { color: isDark ? '#9ca3af' : '#6b7280' }]}
          >
            {formatDate(project.updatedAt || project.createdAt)}
          </Text>
          
          <View style={styles.actionIndicator}>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 12,
  },
  thumbnailContainer: {
    height: 160,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ProjectCard;