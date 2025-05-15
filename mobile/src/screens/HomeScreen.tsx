import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { fetchProjects, fetchRenderingStatus } from '../lib/api';
import ProjectCard from '../components/ProjectCard';
import Button from '../components/Button';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';

// Tipo per la navigazione
type NavigationProp = NativeStackNavigationProp<RootStackParamList & MainTabParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  // Query per recuperare i progetti
  const {
    data: projects = [],
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => fetchProjects({ limit: 5, sort: 'updatedAt:desc' }),
    enabled: isAuthenticated,
  });
  
  // Query per recuperare lo stato di rendering
  const {
    data: renderingStatus = {},
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['/api/videos/rendering-status'],
    queryFn: () => fetchRenderingStatus(),
    enabled: isAuthenticated,
    refetchInterval: 10000, // Aggiorna ogni 10 secondi
  });
  
  // Gestisce il refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchProjects(), refetchStatus()]);
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
  
  // Naviga alla lista completa dei progetti
  const handleViewAllProjects = () => {
    navigation.navigate('Projects');
  };
  
  // Naviga ai dettagli di un progetto
  const handleProjectPress = (id: number) => {
    navigation.navigate('ProjectDetails', { id });
  };
  
  // Filtra i progetti in elaborazione dalla lista status
  const processingProjects = React.useMemo(() => {
    if (!renderingStatus.projects) return [];
    return renderingStatus.projects.filter((project: any) => 
      project.status === 'processing' || project.status === 'queued'
    );
  }, [renderingStatus]);
  
  // Sezione superiore con saluto e pulsanti
  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greeting, { color: colors.text }]}>
          {user?.firstName 
            ? `Ciao, ${user.firstName}!` 
            : 'Benvenuto!'}
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
          Cosa vuoi creare oggi?
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <Button
          title="Nuovo"
          onPress={handleNewProject}
          icon={<Ionicons name="add" size={18} color={colors.primary} />}
          variant="outline"
          size="small"
        />
      </View>
    </View>
  );
  
  // Sezione progetti recenti
  const renderRecentProjects = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Progetti recenti
        </Text>
        {projects.length > 0 && (
          <TouchableOpacity onPress={handleViewAllProjects}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>
              Vedi tutti
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {projectsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : projects.length === 0 ? (
        <View 
          style={[
            styles.emptyContainer, 
            { borderColor: colors.border, backgroundColor: isDark ? '#1f2937' : '#f9fafb' }
          ]}
        >
          <Ionicons 
            name="folder-open-outline" 
            size={40} 
            color={isDark ? '#6b7280' : '#9ca3af'} 
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Non hai ancora progetti
          </Text>
          <Button
            title="Crea il tuo primo progetto"
            onPress={handleNewProject}
            style={{ marginTop: 16 }}
            size="small"
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
              style={{ marginBottom: 12 }}
            />
          )}
          horizontal={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.projectList}
        />
      )}
    </View>
  );
  
  // Sezione video in elaborazione
  const renderProcessingVideos = () => {
    if (statusLoading || !processingProjects) {
      return null;
    }
    
    if (processingProjects.length === 0) {
      return null;
    }
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Video in elaborazione
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Activity')}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>
              Vedi tutti
            </Text>
          </TouchableOpacity>
        </View>
        
        {processingProjects.map((project: any) => (
          <View 
            key={project.id}
            style={[
              styles.processingItem,
              { backgroundColor: isDark ? '#1f2937' : '#f9fafb', borderColor: colors.border }
            ]}
          >
            <View style={styles.processingHeader}>
              <Text style={[styles.processingTitle, { color: colors.text }]}>
                {project.title}
              </Text>
              <View 
                style={[
                  styles.processingStatus, 
                  { backgroundColor: colors.warning + '20' }
                ]}
              >
                <Text style={[styles.processingStatusText, { color: colors.warning }]}>
                  {project.status === 'queued' ? 'In coda' : 'In elaborazione'}
                </Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { backgroundColor: isDark ? '#374151' : '#e5e7eb' }
                ]}
              >
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: colors.warning,
                      width: `${project.progress || 0}%`
                    }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                {project.progress || 0}%
              </Text>
            </View>
            
            <Text style={[styles.processingDetails, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {project.currentStep || 'Inizializzazione...'}
            </Text>
          </View>
        ))}
      </View>
    );
  };
  
  // Sezione suggerimenti e consigli
  const renderTips = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Consigli e suggerimenti
        </Text>
      </View>
      
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tipsContainer}
        contentContainerStyle={styles.tipsContent}
      >
        <TipCard
          title="Usa prompt dettagliati"
          description="Più dettagli fornisci nel prompt, migliore sarà il video generato."
          icon="bulb"
          colors={colors}
          isDark={isDark}
        />
        <TipCard
          title="Ottimizza per i social"
          description="Per i social, usa video in formato verticale 9:16 per una migliore visualizzazione."
          icon="phone-portrait"
          colors={colors}
          isDark={isDark}
        />
        <TipCard
          title="Pubblica regolarmente"
          description="Condividi regolarmente i tuoi video sui social per aumentare visibilità e follower."
          icon="share-social"
          colors={colors}
          isDark={isDark}
        />
      </ScrollView>
    </View>
  );
  
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderHeader()}
        {renderProcessingVideos()}
        {renderRecentProjects()}
        {renderTips()}
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            VideoGenAI v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Componente per i suggerimenti
interface TipCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: any;
  isDark: boolean;
}

const TipCard: React.FC<TipCardProps> = ({ title, description, icon, colors, isDark }) => {
  return (
    <View 
      style={[
        styles.tipCard,
        { backgroundColor: isDark ? '#1f2937' : '#f9fafb', borderColor: colors.border }
      ]}
    >
      <View style={[styles.tipIconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={[styles.tipTitle, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.tipDescription, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
        {description}
      </Text>
    </View>
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
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  projectList: {
    
  },
  processingItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  processingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  processingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  processingStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    width: 36,
    textAlign: 'right',
  },
  processingDetails: {
    fontSize: 13,
  },
  tipsContainer: {
    marginHorizontal: -20,
  },
  tipsContent: {
    paddingHorizontal: 20,
  },
  tipCard: {
    width: 260,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 12,
  },
});

export default HomeScreen;