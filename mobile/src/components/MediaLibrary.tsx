import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Asset } from '../lib/types';

interface MediaLibraryProps {
  assets: Asset[];
  isLoading: boolean;
  onSelectAsset: (asset: Asset) => void;
  onRefresh: () => void;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  assets,
  isLoading,
  onSelectAsset,
  onRefresh
}) => {
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'video' | 'image' | 'audio'>('all');
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };
  
  const filteredAssets = assets.filter(asset => {
    if (filter === 'all') return true;
    return asset.type === filter;
  });
  
  const renderAssetItem = (asset: Asset) => {
    let icon;
    let color;
    
    switch (asset.type) {
      case 'video':
        icon = 'videocam';
        color = '#ed8936'; // orange
        break;
      case 'image':
        icon = 'image';
        color = '#48bb78'; // green
        break;
      case 'audio':
        icon = 'musical-note';
        color = '#9f7aea'; // purple
        break;
      default:
        icon = 'document';
        color = '#a0aec0'; // gray
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.assetItem,
          {
            backgroundColor: isDark ? colors.card : '#fff',
            borderColor: colors.border
          }
        ]}
        key={asset.id}
        onPress={() => onSelectAsset(asset)}
      >
        <View style={styles.assetContent}>
          {asset.type === 'video' || asset.type === 'image' ? (
            <View style={styles.thumbnailContainer}>
              <Image
                source={{ uri: asset.thumbnailUrl || asset.url }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              {asset.type === 'video' && (
                <View style={styles.videoBadge}>
                  <Ionicons name="videocam" size={12} color="#fff" />
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
              <Ionicons name={icon as any} size={24} color="#fff" />
            </View>
          )}
          
          <View style={styles.assetInfo}>
            <Text 
              style={[styles.assetTitle, { color: colors.text }]} 
              numberOfLines={1}
            >
              {asset.name || `Asset ${asset.id}`}
            </Text>
            
            <Text style={[styles.assetMeta, { color: colors.textSecondary }]}>
              {asset.duration ? `${asset.duration.toFixed(1)}s` : ''}
              {asset.width && asset.height ? ` • ${asset.width}x${asset.height}` : ''}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => onSelectAsset(asset)}
        >
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.filters, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'all' && [styles.activeFilter, { borderColor: colors.primary }]
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterText, 
              { color: filter === 'all' ? colors.primary : colors.textSecondary }
            ]}>
              Tutti
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'video' && [styles.activeFilter, { borderColor: colors.primary }]
            ]}
            onPress={() => setFilter('video')}
          >
            <Ionicons 
              name="videocam" 
              size={16} 
              color={filter === 'video' ? colors.primary : colors.textSecondary} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterText, 
              { color: filter === 'video' ? colors.primary : colors.textSecondary }
            ]}>
              Video
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'image' && [styles.activeFilter, { borderColor: colors.primary }]
            ]}
            onPress={() => setFilter('image')}
          >
            <Ionicons 
              name="image" 
              size={16} 
              color={filter === 'image' ? colors.primary : colors.textSecondary} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterText, 
              { color: filter === 'image' ? colors.primary : colors.textSecondary }
            ]}>
              Immagini
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'audio' && [styles.activeFilter, { borderColor: colors.primary }]
            ]}
            onPress={() => setFilter('audio')}
          >
            <Ionicons 
              name="musical-note" 
              size={16} 
              color={filter === 'audio' ? colors.primary : colors.textSecondary} 
              style={styles.filterIcon} 
            />
            <Text style={[
              styles.filterText, 
              { color: filter === 'audio' ? colors.primary : colors.textSecondary }
            ]}>
              Audio
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <ScrollView 
        style={styles.assetsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Caricamento media...
            </Text>
          </View>
        ) : filteredAssets.length > 0 ? (
          filteredAssets.map(renderAssetItem)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={filter === 'all' ? 'folder-open' : filter === 'video' ? 'videocam' : filter === 'image' ? 'image' : 'musical-note'} 
              size={40} 
              color={colors.textSecondary} 
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'all' 
                ? 'Nessun contenuto disponibile' 
                : `Nessun ${filter === 'video' ? 'video' : filter === 'image' ? 'immagine' : 'audio'} disponibile`}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Puoi importare contenuti o crearli con l'IA
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilter: {
    borderWidth: 1,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  filterIcon: {
    marginRight: 4,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  assetsList: {
    flex: 1,
    padding: 12,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  assetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  thumbnail: {
    width: 48,
    height: 48,
  },
  videoBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#4299e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetInfo: {
    marginLeft: 12,
    flex: 1,
  },
  assetTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  assetMeta: {
    fontSize: 12,
  },
  addButton: {
    padding: 6,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default MediaLibrary;