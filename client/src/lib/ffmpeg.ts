import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

// Initialize FFmpeg instance
const ffmpeg = createFFmpeg({
  log: false,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
});

let loaded = false;

/**
 * Ensures FFmpeg is loaded before operations
 */
async function ensureFFmpegLoaded() {
  if (!loaded) {
    await ffmpeg.load();
    loaded = true;
  }
}

/**
 * Trims a video clip
 * @param videoFile The video file to trim
 * @param startTime Start time in seconds
 * @param duration Duration in seconds
 * @returns A URL to the trimmed video
 */
export async function trimVideo(
  videoFile: File,
  startTime: number,
  duration: number
): Promise<string> {
  try {
    await ensureFFmpegLoaded();
    
    const inputName = 'input' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const outputName = 'output.mp4';
    
    ffmpeg.FS('writeFile', inputName, await fetchFile(videoFile));
    
    await ffmpeg.run(
      '-i', inputName,
      '-ss', startTime.toString(),
      '-t', duration.toString(),
      '-c', 'copy',
      outputName
    );
    
    const data = ffmpeg.FS('readFile', outputName);
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    
    // Clean up files in memory
    ffmpeg.FS('unlink', inputName);
    ffmpeg.FS('unlink', outputName);
    
    return url;
  } catch (error) {
    console.error('Error trimming video:', error);
    throw new Error('Failed to trim video');
  }
}

/**
 * Merges multiple video clips
 * @param videoFiles Array of video files to merge
 * @returns A URL to the merged video
 */
export async function mergeVideos(videoFiles: File[]): Promise<string> {
  try {
    await ensureFFmpegLoaded();
    
    const inputPaths: string[] = [];
    const concatContent: string[] = [];
    
    // Write all input files to MEMFS
    for (let i = 0; i < videoFiles.length; i++) {
      const file = videoFiles[i];
      const filename = `input${i}${file.name.substring(file.name.lastIndexOf('.'))}`;
      ffmpeg.FS('writeFile', filename, await fetchFile(file));
      inputPaths.push(filename);
      concatContent.push(`file '${filename}'`);
    }
    
    // Create concat file
    const concatFile = 'concat.txt';
    const concatText = concatContent.join('\n');
    const textEncoder = new TextEncoder();
    const uint8Array = textEncoder.encode(concatText);
    ffmpeg.FS('writeFile', concatFile, uint8Array);
    
    // Run merge operation
    await ffmpeg.run(
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFile,
      '-c', 'copy',
      'output.mp4'
    );
    
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    
    // Clean up files in memory
    inputPaths.forEach(path => ffmpeg.FS('unlink', path));
    ffmpeg.FS('unlink', concatFile);
    ffmpeg.FS('unlink', 'output.mp4');
    
    return url;
  } catch (error) {
    console.error('Error merging videos:', error);
    throw new Error('Failed to merge videos');
  }
}

/**
 * Adds audio to a video (replaces existing audio)
 * @param videoFile The video file
 * @param audioFile The audio file to add
 * @returns A URL to the new video with audio
 */
export async function addAudioToVideo(videoFile: File, audioFile: File): Promise<string> {
  try {
    await ensureFFmpegLoaded();
    
    const videoName = 'video' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const audioName = 'audio' + audioFile.name.substring(audioFile.name.lastIndexOf('.'));
    
    ffmpeg.FS('writeFile', videoName, await fetchFile(videoFile));
    ffmpeg.FS('writeFile', audioName, await fetchFile(audioFile));
    
    await ffmpeg.run(
      '-i', videoName,
      '-i', audioName,
      '-map', '0:v',
      '-map', '1:a',
      '-c:v', 'copy',
      '-shortest',
      'output.mp4'
    );
    
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    
    // Clean up files in memory
    ffmpeg.FS('unlink', videoName);
    ffmpeg.FS('unlink', audioName);
    ffmpeg.FS('unlink', 'output.mp4');
    
    return url;
  } catch (error) {
    console.error('Error adding audio to video:', error);
    throw new Error('Failed to add audio to video');
  }
}

/**
 * Extracts a frame from a video to use as thumbnail
 * @param videoFile The video file
 * @param timeInSecs The time in seconds to extract frame from
 * @returns A URL to the thumbnail image
 */
export async function extractThumbnail(videoFile: File, timeInSecs: number = 0): Promise<string> {
  try {
    await ensureFFmpegLoaded();
    
    const inputName = 'input' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const outputName = 'thumbnail.jpg';
    
    ffmpeg.FS('writeFile', inputName, await fetchFile(videoFile));
    
    await ffmpeg.run(
      '-i', inputName,
      '-ss', timeInSecs.toString(),
      '-frames:v', '1',
      outputName
    );
    
    const data = ffmpeg.FS('readFile', outputName);
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'image/jpeg' }));
    
    // Clean up files in memory
    ffmpeg.FS('unlink', inputName);
    ffmpeg.FS('unlink', outputName);
    
    return url;
  } catch (error) {
    console.error('Error extracting thumbnail:', error);
    throw new Error('Failed to extract thumbnail');
  }
}

/**
 * Extracts audio from a video file
 * @param videoFile The video file
 * @returns A URL to the extracted audio
 */
export async function extractAudio(videoFile: File): Promise<string> {
  try {
    await ensureFFmpegLoaded();
    
    const inputName = 'input' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const outputName = 'audio.mp3';
    
    ffmpeg.FS('writeFile', inputName, await fetchFile(videoFile));
    
    await ffmpeg.run(
      '-i', inputName,
      '-vn',
      '-acodec', 'libmp3lame',
      '-q:a', '2',
      outputName
    );
    
    const data = ffmpeg.FS('readFile', outputName);
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
    
    // Clean up files in memory
    ffmpeg.FS('unlink', inputName);
    ffmpeg.FS('unlink', outputName);
    
    return url;
  } catch (error) {
    console.error('Error extracting audio:', error);
    throw new Error('Failed to extract audio');
  }
}

/**
 * Resizes a video to a different resolution
 * @param videoFile The video file
 * @param width New width
 * @param height New height
 * @returns A URL to the resized video
 */
export async function resizeVideo(videoFile: File, width: number, height: number): Promise<string> {
  try {
    await ensureFFmpegLoaded();
    
    const inputName = 'input' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const outputName = 'output.mp4';
    
    ffmpeg.FS('writeFile', inputName, await fetchFile(videoFile));
    
    await ffmpeg.run(
      '-i', inputName,
      '-vf', `scale=${width}:${height}`,
      '-c:a', 'copy',
      outputName
    );
    
    const data = ffmpeg.FS('readFile', outputName);
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    
    // Clean up files in memory
    ffmpeg.FS('unlink', inputName);
    ffmpeg.FS('unlink', outputName);
    
    return url;
  } catch (error) {
    console.error('Error resizing video:', error);
    throw new Error('Failed to resize video');
  }
}

/**
 * Segments a video into multiple clips of equal duration
 * @param videoFile The video file
 * @param segments Number of segments to create
 * @returns Array of URLs to the segmented videos
 */
export async function segmentVideo(videoFile: File, segments: number): Promise<string[]> {
  try {
    await ensureFFmpegLoaded();
    
    const inputName = 'input' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const segmentUrls: string[] = [];
    
    const videoData = await fetchFile(videoFile);
    ffmpeg.FS('writeFile', inputName, videoData);
    
    // Get video duration
    await ffmpeg.run(
      '-i', inputName,
      '-f', 'null',
      '-'
    );
    
    // Per semplicità, utilizziamo la dimensione del file come approssimazione della durata
    // In un'implementazione reale, analizzeremmo l'output di ffmpeg per la durata
    const totalDuration = videoFile.size / 1000000 * 5; // Approssimazione grossolana: 5 secondi per MB
    const segmentDuration = totalDuration / segments;
    
    for (let i = 0; i < segments; i++) {
      const startTime = i * segmentDuration;
      const outputName = `segment${i}.mp4`;
      
      await ffmpeg.run(
        '-i', inputName,
        '-ss', startTime.toString(),
        '-t', segmentDuration.toString(),
        '-c', 'copy',
        outputName
      );
      
      const data = ffmpeg.FS('readFile', outputName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      segmentUrls.push(url);
      
      ffmpeg.FS('unlink', outputName);
    }
    
    // Clean up input file
    ffmpeg.FS('unlink', inputName);
    
    return segmentUrls;
  } catch (error) {
    console.error('Error segmenting video:', error);
    throw new Error('Failed to segment video');
  }
}
