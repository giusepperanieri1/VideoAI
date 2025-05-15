import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useProjects } from '../hooks/useProjects';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ITEMS_PER_PAGE = 10;

export const ProjectList = () => {
  const [page, setPage] = useState(1);
  const navigation = useNavigation();
  const { data: projects, isLoading, isError, refetch } = useProjects({ page, limit: ITEMS_PER_PAGE });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (!isLoading && projects?.length === ITEMS_PER_PAGE) {
      setPage(prevPage => prevPage + 1);
    }
  }, [isLoading, projects?.length]);

  const navigateToDetail = (projectId: number) => {
    navigation.navigate('ProjectDetail', { projectId });
  };

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#f44336" />
        <Text style={styles.errorText}>Impossibile caricare i progetti</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() => navigateToDetail(item.id)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: item.thumbnail || 'https://via.placeholder.com/150' }}
              style={styles.thumbnail}
              defaultSource={require('../assets/project-placeholder.png')}
              progressiveRenderingEnabled={true}
            />
            <View style={styles.projectInfo}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {item.description || 'Nessuna descrizione'}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString('it-IT')}
                </Text>
                <View style={styles.statBadge}>
                  <Ionicons name="time-outline" size={14} color="#666" />
                  <Text style={styles.statText}>
                    {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoading ? (
            <ActivityIndicator size="small" color="#0066cc" style={styles.loadingIndicator} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-outline" size={48} color="#aaa" />
              <Text style={styles.emptyText}>Nessun progetto trovato</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('CreateProject')}
              >
                <Text style={styles.createButtonText}>Crea nuovo progetto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#0066cc" style={styles.loadingIndicatorCenter} />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  listContent: {
    padding: 10,
  },
  projectCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  thumbnail: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  projectInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  loadingIndicator: {
    margin: 16,
  },
  loadingIndicatorCenter: {
    margin: 50,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProjectList;