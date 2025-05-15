import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface VideoPreviewPlayerProps {
  videoUrl: string;
  title?: string;
  onDownload?: () => void;
  autoPlay?: boolean;
  className?: string;
  thumbnailUrl?: string;
}

export default function VideoPreviewPlayer({
  videoUrl,
  title,
  onDownload,
  autoPlay = false,
  className,
  thumbnailUrl
}: VideoPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    
    setIsMuted(newVolume === 0);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleProgressChange = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      if (autoPlay) {
        videoRef.current.play();
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleMouseEnter = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Card className={cn("overflow-hidden relative group", className)}>
      <CardContent className="p-0 relative">
        <div 
          className="relative w-full aspect-video bg-black"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {isLoading && thumbnailUrl && (
            <img 
              src={thumbnailUrl} 
              alt={title || "Anteprima video"} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-sm">Caricamento video...</p>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            onClick={handlePlayPause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnded}
            poster={thumbnailUrl}
          />
          
          {/* Overlay dei controlli */}
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent transition-opacity duration-300",
              (showControls || !isPlaying) ? "opacity-100" : "opacity-0"
            )}
          >
            {/* Controlli video */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2">
              {/* Barra di avanzamento */}
              <div className="w-full">
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleProgressChange}
                  className="h-1"
                />
              </div>
              
              {/* Controlli principali */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20" 
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <div className="text-xs text-white/80">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 w-24">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-white hover:bg-white/20" 
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="h-1"
                    />
                  </div>
                  
                  {onDownload && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-white hover:bg-white/20" 
                      onClick={onDownload}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {title && (
          <div className="p-4">
            <h3 className="text-lg font-medium">{title}</h3>
          </div>
        )}
      </CardContent>
    </Card>
  );
}