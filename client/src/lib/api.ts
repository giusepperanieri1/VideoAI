import { apiRequest } from './queryClient';

// Genera uno script utilizzando AI
export async function generateScript(
  topic: string,
  duration: number = 30,
  tone: string = 'professionale',
  includeCTA: boolean = true
): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-script', {
      topic,
      duration,
      tone,
      includeCTA
    });
    
    if (!response.ok) {
      throw new Error('Impossibile generare lo script');
    }
    
    const data = await response.json();
    return data.script;
  } catch (error) {
    console.error('Errore nella generazione dello script:', error);
    throw error;
  }
}

// Generate voice-over using OpenAI
export async function generateVoiceOver(
  text: string, 
  voice: string = 'it-IT-Standard-A',
  speed: number = 1,
  pitch: number = 0
): Promise<{ url: string; duration: number }> {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-voiceover', {
      text,
      voice,
      speed,
      pitch
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate voice-over');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating voice-over:', error);
    throw error;
  }
}

// Search for YouTube clips
export async function searchYouTubeClips(query: string): Promise<any[]> {
  try {
    const response = await apiRequest('GET', `/api/youtube/search?q=${encodeURIComponent(query)}`, undefined);
    
    if (!response.ok) {
      throw new Error('Failed to search YouTube videos');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching YouTube:', error);
    throw error;
  }
}

// Import YouTube clip
export async function importYouTubeClip(
  userId: number,
  videoId: string,
  startTime: number = 0,
  duration: number = 30
): Promise<any> {
  try {
    const response = await apiRequest('POST', '/api/youtube/import', {
      userId,
      videoId,
      startTime,
      duration
    });
    
    if (!response.ok) {
      throw new Error('Failed to import YouTube video');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error importing YouTube clip:', error);
    throw error;
  }
}

// Process video segmentation
export async function segmentVideo(
  userId: number,
  assetId: number,
  segments: number
): Promise<any> {
  try {
    const response = await apiRequest('POST', '/api/video/segment', {
      userId,
      assetId,
      segments
    });
    
    if (!response.ok) {
      throw new Error('Failed to segment video');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error segmenting video:', error);
    throw error;
  }
}

// Export video with specific settings
export async function exportVideo(
  projectId: number,
  format: string = 'mp4',
  quality: string = 'high',
  resolution?: string
): Promise<any> {
  try {
    const response = await apiRequest('POST', '/api/projects/export', {
      projectId,
      format,
      quality,
      resolution
    });
    
    if (!response.ok) {
      throw new Error('Failed to export video');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error exporting video:', error);
    throw error;
  }
}

// Upload media asset
export async function uploadMedia(
  userId: number,
  file: File,
  type: 'video' | 'audio' | 'image'
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId.toString());
    formData.append('type', type);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload media');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}
