// Types shared between mobile and web

export interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: number;
  userId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  resolution: string;
  frameRate: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: number;
  userId: string;
  projectId?: number;
  type: 'video' | 'image' | 'audio' | 'text';
  name: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineItem {
  id: number;
  projectId: number;
  assetId: number;
  type: 'video' | 'image' | 'audio' | 'text' | 'effect';
  track: number;
  startTime: number;
  endTime: number;
  properties: any;
  createdAt: string;
  updatedAt: string;
}

export interface SocialAccount {
  id: number;
  userId: string;
  platform: 'youtube' | 'facebook' | 'instagram' | 'twitter' | 'tiktok';
  accountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  displayName?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Segmentation specific types
export interface SegmentationRequest {
  id: number;
  userId: string;
  videoId: number;
  videoUrl: string;
  language: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStage?: string;
  error?: string;
  segmentCount?: number;
  segments?: VideoSegment[];
  createdAt: string;
  completedAt?: string;
}

export interface SegmentationStatus {
  id: number;
  videoId: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStage?: string;
  error?: string;
  segmentCount?: number;
  segments?: VideoSegment[];
  createdAt: string;
  completedAt?: string;
}

export interface VideoSegment {
  id: number;
  requestId: number;
  startTime: number;
  endTime: number;
  transcription: string;
  title?: string;
  thumbnailUrl?: string;
  confidence?: number;
  createdAt: string;
}

// Rendendring and publishing types
export interface RenderStatus {
  id: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  timestamp: string;
}

export interface PublishStatus {
  id: number;
  platformName: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  title: string;
  platformVideoUrl?: string;
  error?: string;
  timestamp: string;
}