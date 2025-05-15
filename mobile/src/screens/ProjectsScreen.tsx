import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTheme } from '../hooks/useTheme';
import { fetchProjects, deleteProject } from '../lib/api';
import ProjectCard from '../components/ProjectCard';
import Button from '../components/Button';
import { APP_CONFIG } from '../lib/config';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';

// Tipo per la navigazione
type NavigationProp = NativeStackNavigationProp<RootStackParamList & MainTabParamList>;

const ProjectsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState('updatedAt:desc');
  
  // Query per recuperare i progetti
  const {
    data: projects = [],
    isLoading: projectsLoading,
    refetch: refetchProjects,
    isError,
  } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => fetchProjects({ sort: sortOrder }),
  });
  
  // Mutation per eliminare un progetto
  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      refetchProjects();
    },
    onError: (error: any) => {
      Alert.alert(
        'Errore',
        error.message || 'Si è verificato un errore durante l\'eliminazione del progetto. Riprova più tardi.',
        [{ text: 'OK' }]
      );
    },
  });
  
  // Gestisce il refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchProjects();
    } catch (error) {
      console.error('Errore durante il refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Naviga alla creazione di un nuovo progetto
  const handleNewProject = () => {
    navigation.navigate('Create');
  };
  
  // Naviga ai dettagli di un progetto
  const handleProjectPress = (id: number) => {
    navigation.navigate('ProjectDetails', { id });
  };
  
  // Elimina un progetto
  const handleDeleteProject = (id: number) => {
    Alert.alert(
      'Elimina progetto',
      'Sei sicuro di voler eliminare questo progetto? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Elimina', 
          style: 'destructive',
          onPress: () => deleteProjectMutation.mutate(id)
        }
      ]
    );
  };
  
  // Modifica un progetto
  const handleEditProject = (id: number) => {
    navigation.navigate('Editor', { id });
  };
  
  // Filtri e ordinamento
  const handleSortChange = (order: string) => {
    setSortOrder(order);
    refetchProjects();
  };
  
  // Verifica i limiti dei progetti per account free
  const hasReachedProjectLimit = projects.length >= (APP_CONFIG.MAX_FREE_PROJECTS || 10);
  const remainingProjects = (APP_CONFIG.MAX_FREE_PROJECTS || 10) - projects.length;
  
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          I tuoi progetti
        </Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.sortButton, 
              { backgroundColor: isDark ? '#1f2937' : '#f9fafb', borderColor: colors.border }
            ]}
            onPress={() => {
              Alert.alert(
                'Ordina progetti',
                'Seleziona un criterio di ordinamento',
                [
                  { text: 'Più recenti prima', onPress: () => handleSortChange('updatedAt:desc') },
                  { text: 'Più vecchi prima', onPress: () => handleSortChange('updatedAt:asc') },
                  { text: 'A-Z', onPress: () => handleSortChange('title:asc') },
                  { text: 'Z-A', onPress: () => handleSortChange('title:desc') },
                  { text: 'Annulla', style: 'cancel' }
                ]
              );
            }}
          >
            <Ionicons name="options-outline" size={20} color={colors.text} />
            <Text style={[styles.sortButtonText, { color: colors.text }]}>
              Ordina
            </Text>
          </TouchableOpacity>
          
          <Button
            title="Nuovo"
            onPress={handleNewProject}
            disabled={hasReachedProjectLimit}
            icon={<Ionicons name="add" size={18} color="white" />}
            size="small"
          />
        </View>
      </View>
      
      {/* Mostra avviso limite progetti */}
      {remainingProjects <= 3 && (
        <View 
          style={[
            styles.limitWarning, 
            { 
              backgroundColor: remainingProjects === 0 
                ? colors.error + '15' 
                : colors.warning + '15',
              borderColor: remainingProjects === 0 
                ? colors.error + '30' 
                : colors.warning + '30'
            }
          ]}
        >
          <Ionicons 
            name={remainingProjects === 0 ? "alert-circle" : "information-circle"} 
            size={20} 
            color={remainingProjects === 0 ? colors.error : colors.warning} 
            style={styles.limitIcon}
          />
          <Text 
            style={[
              styles.limitText, 
              { 
                color: remainingProjects === 0 
                  ? colors.error 
                  : colors.warning
              }
            ]}
          >
            {remainingProjects === 0 
              ? 'Hai raggiunto il limite di progetti per account gratuito' 
              : `${remainingProjects} progett${remainingProjects === 1 ? 'o' : 'i'} rimanent${remainingProjects === 1 ? 'e' : 'i'} sul tuo account gratuito`
            }
          </Text>
        </View>
      )}
      
      {projectsLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
            Caricamento progetti...
          </Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Si è verificato un errore
          </Text>
          <Text style={[styles.errorMessage, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
            Impossibile caricare i progetti. Riprova più tardi.
          </Text>
          <Button
            title="Riprova"
            onPress={() => refetchProjects()}
            style={{ marginTop: 16 }}
            variant="outline"
          />
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={64} color={isDark ? '#6b7280' : '#9ca3af'} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Nessun progetto
          </Text>
          <Text style={[styles.emptyMessage, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
            Inizia creando il tuo primo progetto video con l'intelligenza artificiale
          </Text>
          <Button
            title="Crea nuovo progetto"
            onPress={handleNewProject}
            style={{ marginTop: 24 }}
            fullWidth
          />
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={handleProjectPress}
              onDelete={() => handleDeleteProject(item.id)}
              onEdit={() => handleEditProject(item.id)}
              style={{ marginBottom: 16 }}
              variant="full"
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                {projects.length} progett{projects.length === 1 ? 'o' : 'i'} totali
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  limitIcon: {
    marginRight: 8,
  },
  limitText: {
    fontSize: 14,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});

export default ProjectsScreen;