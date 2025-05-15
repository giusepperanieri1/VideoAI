import React, { useRef, useState, useEffect } from 'react';
import { 
  SkipBack, 
  Rewind, 
  Play, 
  Pause, 
  FastForward, 
  SkipForward, 
  Scissors, 
  Volume2, 
  Maximize,
  MessageSquare,
  Type,
  Image,
  Layers,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { TimelineItem, Asset } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatTime } from '@/lib/utils';

interface VideoPreviewProps {
  timelineItems: TimelineItem[];
  assets: Asset[];
  isLoading: boolean;
}

export default function VideoPreview({ timelineItems, assets, isLoading }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [activeTrackItems, setActiveTrackItems] = useState<TimelineItem[]>([]);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Get primary video to display (first video item on track 0)
  const primaryVideoItem = timelineItems
    .filter(item => item.type === 'video' && item.track === 0)
    .sort((a, b) => a.startTime - b.startTime)[0];
  
  const previewUrl = primaryVideoItem 
    ? findAssetById(primaryVideoItem.assetId, assets)?.url
    : undefined;
  
  // Get the resolution info
  const [resolution, setResolution] = useState('720p');
  const [fps, setFps] = useState(30);
    
  function findAssetById(assetId: number | undefined, assets: Asset[]): Asset | undefined {
    if (!assetId) return undefined;
    return assets.find(asset => asset.id === assetId);
  }
  
  // Calculate which items are active at the current time
  useEffect(() => {
    const active = timelineItems.filter(item => {
      const itemStartMs = item.startTime;
      const itemEndMs = item.endTime;
      const currentTimeMs = currentTime * 1000;
      
      return currentTimeMs >= itemStartMs && currentTimeMs <= itemEndMs;
    });
    
    setActiveTrackItems(active);
  }, [timelineItems, currentTime]);
  
  // Update container dimensions for responsive overlays
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    
    updateDimensions();
    
    // Update dimensions on resize
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);
  
  // Handle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle video time update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    setCurrentTime(videoRef.current.currentTime);
  };
  
  // Handle video metadata loaded
  const handleMetadataLoaded = () => {
    if (!videoRef.current) return;
    
    setDuration(videoRef.current.duration);
    
    // Get video resolution from the video element
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    
    if (videoHeight >= 1080) {
      setResolution('1080p');
    } else if (videoHeight >= 720) {
      setResolution('720p');
    } else if (videoHeight >= 480) {
      setResolution('480p');
    } else {
      setResolution(`${videoHeight}p`);
    }
  };
  
  // Handle seeking
  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    
    const newTime = value[0];
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    
    const newVolume = value[0];
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
  };
  
  // Handle skip forward/backward
  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    
    const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };
  
  // Moved formatTime to utils.ts
  
  // Render text overlay for text timeline items
  const renderTextOverlay = (item: TimelineItem) => {
    // Default text properties from the item.properties or use defaults
    const properties = item.properties || {};
    const text = properties.text || 'Testo di esempio';
    const fontSize = properties.fontSize || '24px';
    const fontColor = properties.fontColor || '#ffffff';
    const backgroundColor = properties.backgroundColor || 'rgba(0, 0, 0, 0.5)';
    const alignment = properties.alignment || 'center'; // center, left, right
    const fontWeight = properties.fontWeight || 'normal'; // normal, bold
    const fontStyle = properties.fontStyle || 'normal'; // normal, italic
    
    // Check if using custom position
    const hasCustomPosition = properties.position && 
      typeof properties.position === 'object' && 
      ('x' in properties.position) && 
      ('y' in properties.position);
      
    const customPosition = hasCustomPosition ? properties.position : { x: 50, y: 50 };
        
    let alignmentStyle: React.CSSProperties = { textAlign: alignment as any };
    
    return (
      <div 
        key={item.id}
        className="absolute inset-0 pointer-events-none"
      >
        <div 
          className="px-4 py-2 rounded absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ 
            backgroundColor,
            fontSize, 
            color: fontColor,
            fontWeight,
            fontStyle,
            maxWidth: '80%',
            ...alignmentStyle,
            left: `${customPosition.x}%`,
            top: `${customPosition.y}%`,
          }}
        >
          {text}
        </div>
      </div>
    );
  };
  
  // Render image overlay for image timeline items
  const renderImageOverlay = (item: TimelineItem) => {
    const asset = findAssetById(item.assetId, assets);
    if (!asset) return null;
    
    const properties = item.properties || {};
    const scale = properties.scale || 1;
    const position = properties.position || 'center'; // center, topLeft, topRight, bottomLeft, bottomRight
    
    // Calculate positioning based on position property
    let positionClass = 'inset-0 flex items-center justify-center'; // Default center
    
    switch(position) {
      case 'topLeft':
        positionClass = 'top-4 left-4';
        break;
      case 'topRight':
        positionClass = 'top-4 right-4';
        break;
      case 'bottomLeft':
        positionClass = 'bottom-4 left-4';
        break;
      case 'bottomRight':
        positionClass = 'bottom-4 right-4';
        break;
    }
    
    return (
      <div 
        key={item.id}
        className={`absolute ${positionClass} pointer-events-none`}
      >
        <img 
          src={asset.url}
          alt={asset.name}
          className="object-contain"
          style={{ 
            maxWidth: position === 'center' ? '80%' : '30%',
            maxHeight: position === 'center' ? '80%' : '30%',
            transform: `scale(${scale})`
          }}
        />
      </div>
    );
  };
  
  // Render all active overlays
  const renderOverlays = () => {
    return activeTrackItems.map(item => {
      if (item.type === 'text') {
        return renderTextOverlay(item);
      } else if (item.type === 'image') {
        return renderImageOverlay(item);
      }
      return null;
    }).filter(Boolean);
  };
  
  // Get currently active audio item
  const getActiveAudioItems = () => {
    return activeTrackItems.filter(item => 
      item.type === 'audio' && item.track === 1 // Audio track
    );
  };
  
  return (
    <div className="bg-dark-900 p-4 flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center rounded-lg">
        <div 
          ref={containerRef}
          className={cn(
            "relative w-full max-w-3xl bg-black rounded-lg shadow-lg overflow-hidden aspect-video",
            isFullscreen && "max-w-none"
          )}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          {isLoading ? (
            <Skeleton className="absolute inset-0" />
          ) : previewUrl ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                src={previewUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleMetadataLoaded}
                onEnded={() => setIsPlaying(false)}
              />
              
              {/* Render active overlays */}
              {renderOverlays()}
              
              {/* Video controls overlay */}
              <div 
                className={cn(
                  "absolute inset-0 flex flex-col justify-between p-4 transition-opacity duration-300",
                  showControls ? "opacity-100" : "opacity-0"
                )}
              >
                {/* Top controls */}
                <div className="flex justify-between">
                  <div className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                  <div className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-white hover:bg-transparent"
                        onClick={() => setShowCaptions(!showCaptions)}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    </div>
                    {resolution} • {fps}fps
                  </div>
                </div>
                
                {/* Center play button (only show when paused) */}
                {!isPlaying && (
                  <div className="flex-1 flex items-center justify-center">
                    <Button 
                      variant="default" 
                      size="icon"
                      className="w-16 h-16 rounded-full opacity-80 hover:opacity-100 bg-gradient-primary"
                      onClick={togglePlay}
                    >
                      <Play className="h-8 w-8 ml-1" />
                    </Button>
                  </div>
                )}
                
                {/* Bottom controls */}
                <div className="space-y-2">
                  {/* Progress bar */}
                  <Slider
                    min={0}
                    max={duration || 100}
                    step={0.01}
                    value={[currentTime]}
                    onValueChange={handleSeek}
                    className="h-1.5"
                  />
                  
                  {/* Control buttons */}
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-3">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white hover:bg-black/30"
                        onClick={() => handleSkip(-10)}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white hover:bg-black/30"
                        onClick={() => handleSkip(-5)}
                      >
                        <Rewind className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white hover:bg-black/30" 
                        onClick={togglePlay}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white hover:bg-black/30"
                        onClick={() => handleSkip(5)}
                      >
                        <FastForward className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white hover:bg-black/30"
                        onClick={() => handleSkip(10)}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex space-x-3 items-center">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-white" />
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={[volume]}
                          onValueChange={handleVolumeChange}
                          className="w-20 h-1"
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white hover:bg-black/30"
                        onClick={toggleFullscreen}
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // No video available
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <Layers className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Nessun video nella timeline.</p>
              <p className="text-xs">Aggiungi contenuti video dalla libreria media.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Active elements display (below video) */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Elementi attivi:</span>
        </div>
        
        {activeTrackItems.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeTrackItems.map(item => {
              let icon;
              switch(item.type) {
                case 'video':
                  icon = <Layers className="h-3 w-3" />;
                  break;
                case 'audio':
                  icon = <Volume2 className="h-3 w-3" />;
                  break;
                case 'text':
                  icon = <Type className="h-3 w-3" />;
                  break;
                case 'image':
                  icon = <Image className="h-3 w-3" />;
                  break;
                default:
                  icon = null;
              }
              
              // Find asset for this item
              const asset = findAssetById(item.assetId, assets);
              const name = asset ? asset.name : item.type;
              
              return (
                <div 
                  key={item.id}
                  className="flex items-center gap-1 bg-dark-700 text-xs px-2 py-1 rounded text-foreground"
                >
                  {icon}
                  <span className="truncate max-w-32">{name}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Nessun elemento attivo al timestamp corrente</span>
        )}
      </div>
    </div>
  );
}
