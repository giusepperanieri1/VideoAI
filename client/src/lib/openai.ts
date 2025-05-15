import { apiRequest } from './queryClient';

// Generate video from text using OpenAI
export async function generateVideoFromText(
  prompt: string,
  style: string = 'professional',
  duration: number = 30,
  aspectRatio: string = '16:9'
): Promise<{ url: string; thumbnail: string }> {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-video-preview', {
      prompt,
      style,
      duration,
      aspectRatio
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate video preview');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
}

// Generate image for video thumbnail
export async function generateThumbnail(
  prompt: string
): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-thumbnail', {
      prompt
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate thumbnail');
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
}

// Generate captions from video or audio
export async function generateCaptions(
  assetId: number,
  language: string = 'it'
): Promise<{ text: string; startTime: number; endTime: number }[]> {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-captions', {
      assetId,
      language
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate captions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating captions:', error);
    throw error;
  }
}

// Generate a script from a prompt
export async function generateScript(
  prompt: string,
  duration: number = 60,
  tone: string = 'professional'
): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-script', {
      prompt,
      duration,
      tone
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate script');
    }
    
    const data = await response.json();
    return data.script;
  } catch (error) {
    console.error('Error generating script:', error);
    throw error;
  }
}

// Generate suggestions for video improvement
export async function generateSuggestions(
  projectId: number
): Promise<string[]> {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-suggestions', {
      projectId
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate suggestions');
    }
    
    const data = await response.json();
    return data.suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw error;
  }
}
