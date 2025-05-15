// Definizioni dei tipi per l'app mobile

// Modello utente
export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Modello progetto
export interface Project {
  id: number;
  userId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Modello asset
export interface Asset {
  id: number;
  userId: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Modello elemento della timeline
export interface TimelineItem {
  id: number;
  projectId: number;
  assetId?: number;
  type: 'video' | 'image' | 'audio' | 'text' | 'transition';
  track: number;
  startTime: number;
  endTime: number;
  duration?: number;
  properties: any;
  createdAt?: Date;
  updatedAt?: Date;
}

// Modello account social
export interface SocialAccount {
  id: number;
  userId: string;
  platformId: number;
  platformName: string;
  accountName: string;
  accountId: string;
  profileUrl?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Modello richiesta video AI
export interface AiVideoRequest {
  id: number;
  userId: string;
  prompt: string;
  style?: string;
  duration?: number;
  aspectRatio?: string;
  status: string;
  progress?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Stato di rendering del video
export interface RenderingStatus {
  id: number;
  userId: string;
  videoName: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Stato di pubblicazione social
export interface PublishingStatus {
  id: number;
  userId: string;
  platformId: number;
  videoUrl: string;
  platformName: string;
  platformVideoId?: string;
  platformVideoUrl?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  title: string;
  description?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Dati per overlay di testo
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

// Dati per voiceover
export interface VoiceOverData {
  text: string;
  voice: string;
  audioUrl?: string;
  duration?: number;
}

// Impostazioni tema
export interface ThemeColors {
  primary: string;
  primaryLight: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  muted: string;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
}