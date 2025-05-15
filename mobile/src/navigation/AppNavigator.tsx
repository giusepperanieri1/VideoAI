import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

// Importazione schermate
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import CreateScreen from '../screens/CreateScreen';
import ProjectDetailsScreen from '../screens/ProjectDetailsScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditorScreen from '../screens/EditorScreen';
import SocialAccountsScreen from '../screens/SocialAccountsScreen';

// Tipi per la navigazione
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  ProjectDetails: { id: number };
  Editor: { id: number };
  SocialAccounts: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Projects: undefined;
  Create: undefined;
  Activity: undefined;
  Profile: undefined;
};

// Stack per la navigazione principale
const Stack = createNativeStackNavigator<RootStackParamList>();
// Tab per la navigazione in basso
const Tab = createBottomTabNavigator<MainTabParamList>();

// Navigazione con tab in basso
const MainTabs = () => {
  const { colors, isDark } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#111827' : '#ffffff',
          borderTopColor: isDark ? '#1f2937' : '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#6b7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          tabBarLabel: 'Progetti',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          tabBarLabel: 'Crea',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size + 4} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          tabBarLabel: 'Attività',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profilo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Configurazione del navigatore principale
const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, colors } = useTheme();
  
  // Se l'autenticazione è in caricamento, mostra un indicatore di caricamento
  if (isLoading) {
    return null; // Qui potremmo mostrare una schermata di splash
  }
  
  return (
    <NavigationContainer
      theme={{
        dark: theme === 'dark',
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {isAuthenticated ? (
          // Flusso per utenti autenticati
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="ProjectDetails" 
              component={ProjectDetailsScreen}
              options={{
                headerShown: true,
                headerTitle: 'Dettagli Progetto',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen 
              name="Editor" 
              component={EditorScreen}
              options={{
                headerShown: true,
                headerTitle: 'Editor Video',
                headerBackTitleVisible: false,
                presentation: 'fullScreenModal',
              }}
            />
            <Stack.Screen 
              name="SocialAccounts" 
              component={SocialAccountsScreen}
              options={{
                headerShown: true,
                headerTitle: 'Account Social',
                headerBackTitleVisible: false,
              }}
            />
          </>
        ) : (
          // Flusso per utenti non autenticati
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;