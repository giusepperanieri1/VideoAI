import { google, youtube_v3 } from 'googleapis';
import axios from 'axios';
import { randomUUID } from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';
import { createWriteStream } from 'fs';

// Setup Google API client
const youtubeApiKey = process.env.YOUTUBE_API_KEY;
if (!youtubeApiKey) {
  console.error('YouTube API key is missing. Set the YOUTUBE_API_KEY environment variable.');
}

const youtube = google.youtube({
  version: 'v3',
  auth: youtubeApiKey
});

// Temporary directory for downloaded clips
const TEMP_DIR = path.join(process.cwd(), 'temp');

// Ensure the temporary directory exists
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating temp directory:', error);
  }
}

ensureTempDir();

/**
 * Search for YouTube videos
 * @param query Search query
 * @param maxResults Maximum number of results (default: 10)
 * @returns Array of YouTube video search results
 */
export async function searchYoutubeVideos(
  query: string,
  maxResults: number = 10
): Promise<any[]> {
  try {
    console.log(`YouTube API: Searching for "${query}" with max ${maxResults} results`);
    
    // Search for videos
    console.log("YouTube API: Sending search request...");
    const searchResponse = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults,
      videoEmbeddable: 'true',
      videoDuration: 'medium', // Filter for medium length videos (between 4-20 minutes)
    });
    
    console.log("YouTube API: Search response received, found", searchResponse?.data?.items?.length || 0, "items");

    // Extract video IDs - make sure they're non-null and non-undefined
    const videoIds: string[] = [];
    if (searchResponse.data.items) {
      for (const item of searchResponse.data.items) {
        if (item.id?.videoId) {
          videoIds.push(item.id.videoId);
        }
      }
    }
    
    console.log("YouTube API: Extracted video IDs:", videoIds);
    
    if (videoIds.length === 0) {
      console.log("YouTube API: No video IDs found, returning empty array");
      return [];
    }
    
    // Get detailed video information
    console.log("YouTube API: Fetching detailed video information");
    const videosResponse = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: videoIds,
    });
    
    console.log("YouTube API: Video details received, found", videosResponse?.data?.items?.length || 0, "items");
    
    // Format results
    const results = [];
    if (videosResponse.data.items) {
      for (const item of videosResponse.data.items) {
        results.push({
          id: item.id,
          title: item.snippet?.title,
          channelTitle: item.snippet?.channelTitle,
          description: item.snippet?.description,
          thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
          duration: item.contentDetails?.duration, // ISO 8601 format
          publishedAt: item.snippet?.publishedAt,
          viewCount: item.statistics?.viewCount
        });
      }
    }
    
    console.log("YouTube API: Returning", results.length, "formatted results");
    return results;
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    throw new Error('Failed to search YouTube videos');
  }
}

/**
 * Download a clip from a YouTube video
 * @param videoId YouTube video ID
 * @param startTime Start time in seconds
 * @param duration Duration in seconds
 * @returns Path to the downloaded video file
 */
export async function downloadYoutubeClip(
  videoId: string,
  startTime: number = 0,
  duration: number = 30
): Promise<{ url: string; thumbnail: string; title: string; duration: number }> {
  try {
    // Get video details
    console.log("YouTube API: Fetching video details for clip download:", videoId);
    
    const videoResponse = await youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      id: [videoId],
    });
    
    if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
      throw new Error('Video not found');
    }
    
    const videoDetails = videoResponse.data.items[0];
    const title = videoDetails.snippet?.title || 'Unknown Video';
    const thumbnailUrl = videoDetails.snippet?.thumbnails?.high?.url || 
                         videoDetails.snippet?.thumbnails?.default?.url || '';
    
    // Generate unique filename
    const uuid = randomUUID();
    const filename = `${uuid}.mp4`;
    const filePath = path.join(TEMP_DIR, filename);
    
    // In a real implementation, we would download and clip the video
    // For now, we'll mock this part since downloading from YouTube requires additional libraries
    // and considerations (like youtube-dl or similar tools)
    
    // Mock download by writing an empty file
    await fs.writeFile(filePath, '');
    
    // Return file metadata
    return {
      url: `/api/media/${filename}`,
      thumbnail: thumbnailUrl,
      title,
      duration
    };
  } catch (error) {
    console.error('Error downloading YouTube clip:', error);
    throw new Error('Failed to download YouTube clip');
  }
}

/**
 * Get video details for a specific YouTube video
 * @param videoId YouTube video ID
 * @returns Video details
 */
export async function getYoutubeVideoDetails(videoId: string): Promise<any> {
  try {
    const videoResponse = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [videoId],
    });
    
    if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
      throw new Error('Video not found');
    }
    
    const item = videoResponse.data.items[0];
    
    return {
      id: item.id,
      title: item.snippet?.title,
      channelTitle: item.snippet?.channelTitle,
      description: item.snippet?.description,
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
      duration: item.contentDetails?.duration,
      publishedAt: item.snippet?.publishedAt,
      viewCount: item.statistics?.viewCount
    };
  } catch (error) {
    console.error('Error getting YouTube video details:', error);
    throw new Error('Failed to get YouTube video details');
  }
}

/**
 * Get available captions for a YouTube video
 * @param videoId YouTube video ID
 * @returns Array of available caption tracks
 */
export async function getYoutubeVideoCaptions(videoId: string): Promise<any[]> {
  try {
    const captionsResponse = await youtube.captions.list({
      part: ['snippet'],
      videoId,
    });
    
    return (captionsResponse.data.items || []).map(item => ({
      id: item.id,
      language: item.snippet?.language,
      trackKind: item.snippet?.trackKind,
      name: item.snippet?.name,
    }));
  } catch (error) {
    console.error('Error getting YouTube video captions:', error);
    throw new Error('Failed to get YouTube video captions');
  }
}

/**
 * Parse ISO 8601 duration to seconds
 * @param isoDuration Duration in ISO 8601 format (e.g. PT1H30M15S)
 * @returns Duration in seconds
 */
export function parseIsoDuration(isoDuration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = isoDuration.match(regex);
  
  if (!match) return 0;
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  return hours * 3600 + minutes * 60 + seconds;
}
