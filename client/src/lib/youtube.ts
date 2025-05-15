import { apiRequest } from './queryClient';

interface YouTubeSearchResult {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  viewCount: string;
}

/**
 * Search for YouTube videos with a query
 * @param query Search query
 * @param maxResults Maximum number of results (default: 10)
 * @returns Array of YouTube video search results
 */
export async function searchYouTubeVideos(
  query: string,
  maxResults: number = 10
): Promise<YouTubeSearchResult[]> {
  try {
    const response = await apiRequest(
      'GET',
      `/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      undefined
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to search YouTube videos: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    throw error;
  }
}

/**
 * Import a YouTube video clip into the editor
 * @param userId User ID
 * @param videoId YouTube video ID
 * @param startTime Start time in seconds
 * @param duration Duration in seconds
 * @returns The imported asset
 */
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
      const errorText = await response.text();
      throw new Error(`Failed to import YouTube clip: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error importing YouTube clip:', error);
    throw error;
  }
}

/**
 * Get video details for a specific YouTube video
 * @param videoId YouTube video ID
 * @returns Video details
 */
export async function getYouTubeVideoDetails(videoId: string): Promise<YouTubeSearchResult> {
  try {
    const response = await apiRequest(
      'GET',
      `/api/youtube/video/${videoId}`,
      undefined
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get YouTube video details: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting YouTube video details:', error);
    throw error;
  }
}

/**
 * Get available captions for a YouTube video
 * @param videoId YouTube video ID
 * @returns Array of available caption tracks
 */
export async function getYouTubeVideoCaptions(videoId: string): Promise<any[]> {
  try {
    const response = await apiRequest(
      'GET',
      `/api/youtube/captions/${videoId}`,
      undefined
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get YouTube video captions: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting YouTube video captions:', error);
    throw error;
  }
}

/**
 * Preview a YouTube video without importing it
 * @param videoId YouTube video ID
 * @returns URL to preview the video
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1`;
}

/**
 * Format YouTube video duration from ISO 8601 format to human readable
 * @param isoDuration Duration in ISO 8601 format (e.g. PT1H30M15S)
 * @returns Formatted duration (e.g. 1:30:15)
 */
export function formatYouTubeDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
