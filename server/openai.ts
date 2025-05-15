import OpenAI from "openai";
import { randomUUID } from "crypto";
import { createWriteStream, promises as fs } from "fs";
import path from "path";
import { Stream } from "stream";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Temporary directory for media files
const TEMP_DIR = path.join(process.cwd(), "temp");

// Ensure the temporary directory exists
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating temp directory:", error);
  }
}

ensureTempDir();

// Generate a video from text using OpenAI
export async function generateVideo(request: any): Promise<{ url: string; thumbnail: string }> {
  try {
    // For now, this is a mock implementation as OpenAI doesn't have a direct video generation API
    // In a production environment, this would call a video generation service
    
    // Generate a text description for the video
    const prompt = `Create a detailed storyboard for a ${request.duration} second video with the following description:
    ${request.prompt}
    
    The video should have a ${request.style} style and be in ${request.aspectRatio} aspect ratio.
    
    Format your response as a JSON object with the following structure:
    {
      "scenes": [
        {
          "description": "Detailed description of what happens in this scene",
          "duration": "Duration in seconds",
          "elements": ["List of visual elements to include"]
        }
      ]
    }`;
    
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    
    // Generate an image for the thumbnail
    const thumbnailResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a thumbnail image for a video about: ${request.prompt}. The style should be ${request.style} and professional looking. The image should be high quality and suitable for a video platform.`,
      n: 1,
      size: "1024x1024",
    });
    
    // In a real implementation, we would now use the storyboard to generate video segments
    // For now, we'll return a mock video URL and the generated thumbnail
    
    // Generate unique filenames
    const uuid = randomUUID();
    const videoFilename = `${uuid}.mp4`;
    const thumbnailFilename = `${uuid}-thumbnail.jpg`;
    
    // Save thumbnail URL to a file
    const thumbnailUrl = thumbnailResponse.data[0].url;
    
    // Return the URLs
    return {
      url: `https://storage.example.com/videos/${videoFilename}`,
      thumbnail: thumbnailUrl || ""
    };
  } catch (error) {
    console.error("Error generating video:", error);
    throw new Error("Failed to generate video");
  }
}

// Generate voice-over audio using OpenAI
export async function generateVoiceOver(
  text: string,
  voice: string = "it-IT-Standard-A"
): Promise<{ url: string; duration: number }> {
  try {
    // Generate a voice over using OpenAI's text-to-speech API
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice === "it-IT-Standard-A" ? "alloy" : "nova", // Map to available OpenAI voices
      input: text,
    });
    
    // Create a unique filename
    const uuid = randomUUID();
    const filename = `${uuid}.mp3`;
    const filePath = path.join(TEMP_DIR, filename);
    
    // Convert buffer to a readable stream
    const buffer = Buffer.from(await mp3.arrayBuffer());
    const stream = new Stream.Readable();
    stream.push(buffer);
    stream.push(null);
    
    // Save the audio to a file
    const writeStream = createWriteStream(filePath);
    stream.pipe(writeStream);
    
    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        // Determine audio duration (would normally require audio processing library)
        // Here we'll estimate based on text length and reading speed
        const wordCount = text.split(/\s+/).length;
        const averageWordsPerMinute = 150;
        const estimatedDuration = Math.max(1, (wordCount / averageWordsPerMinute) * 60);
        
        resolve({
          url: `/api/media/${filename}`,
          duration: Math.round(estimatedDuration)
        });
      });
      
      writeStream.on("error", (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error generating voice-over:", error);
    throw new Error("Failed to generate voice-over");
  }
}

// Generate captions for a video
export async function generateCaptions(audioUrl: string): Promise<any[]> {
  try {
    // In a real implementation, this would download the audio and use OpenAI's Whisper API
    // For now, we'll return a mock result
    
    // Mock response structure
    return [
      { text: "Welcome to our video presentation.", startTime: 0, endTime: 3000 },
      { text: "Today we'll explore the features of VideoGenAI.", startTime: 3000, endTime: 7000 },
      { text: "Our platform helps you create professional videos.", startTime: 7000, endTime: 11000 }
    ];
  } catch (error) {
    console.error("Error generating captions:", error);
    throw new Error("Failed to generate captions");
  }
}

// Generate script from a prompt
export async function generateScript(
  prompt: string,
  duration: number = 60,
  tone: string = "professional"
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert video script writer. Create a ${duration}-second script in a ${tone} tone. The script should be appropriate for voice-over narration and should time appropriately for a ${duration} second video.`
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    return response.choices[0].message.content || "Failed to generate script";
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error("Failed to generate script");
  }
}

// Generate suggestions for video improvement
export async function generateSuggestions(videoDescription: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert video editor providing concise suggestions to improve a video project. Provide exactly 5 clear, actionable suggestions."
        },
        {
          role: "user",
          content: `I'm working on this video project: ${videoDescription}. Can you give me 5 specific suggestions to improve it?`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      return ["No suggestions available"];
    }
    
    try {
      const parsedContent = JSON.parse(content);
      if (Array.isArray(parsedContent.suggestions)) {
        return parsedContent.suggestions;
      }
      return ["Unable to parse suggestions"];
    } catch (e) {
      // If it's not valid JSON, try to extract suggestions from the text
      const suggestions = content
        .split(/\d+\.\s+/)
        .filter(item => item.trim().length > 0)
        .map(item => item.trim());
      
      return suggestions.length > 0 ? suggestions : ["No suggestions available"];
    }
  } catch (error) {
    console.error("Error generating suggestions:", error);
    throw new Error("Failed to generate suggestions");
  }
}
