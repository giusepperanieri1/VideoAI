import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Undo, Redo, Scissors, Copy, Trash2, Minus, Plus, Filter, Settings, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { TimelineItem, Asset } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Definizione di una sequenza temporale per raggruppare gli item
interface Sequence {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  items: TimelineItem[];
  color: string;
}

interface TimelineProps {
  items: TimelineItem[];
  assets: Asset[];
  isLoading: boolean;
  selectedItem: TimelineItem | null;
  onSelectItem: (item: TimelineItem | null) => void;
  onUpdateItem: (item: Partial<TimelineItem>) => void;
  onRefresh: () => void;
}

export default function Timeline({ 
  items, 
  assets, 
  isLoading,
  selectedItem,
  onSelectItem,
  onUpdateItem,
  onRefresh
}: TimelineProps) {
  const [zoom, setZoom] = useState(50);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [activeView, setActiveView] = useState<string>("tracks");
  const [sequenceMode, setSequenceMode] = useState<boolean>(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Track types and their labels
  const trackTypes = [
    { id: 0, name: 'Video' },
    { id: 1, name: 'Audio' },
    { id: 2, name: 'Voice-over' },
    { id: 3, name: 'Testi' }
  ];
  
  // Colori predefiniti per le sequenze
  const sequenceColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500'
  ];
  
  // Generazione automatica di sequenze basate sul contenuto
  const generateSequences = useMemo((): Sequence[] => {
    if (!items.length) return [];
    
    // Ordina gli elementi per tempo di inizio
    const sortedItems = [...items].sort((a, b) => a.startTime - b.startTime);
    
    // Raggruppa gli elementi in sequenze logiche basate sul tempo
    // Considera una nuova sequenza se c'è un gap di più di 2 secondi
    const sequences: Sequence[] = [];
    let currentSequence: TimelineItem[] = [];
    let sequenceId = 1;
    
    sortedItems.forEach((item, index) => {
      if (index === 0) {
        currentSequence.push(item);
        return;
      }
      
      const prevItem = sortedItems[index - 1];
      const gap = item.startTime - prevItem.endTime;
      
      // Se c'è un gap significativo, crea una nuova sequenza
      if (gap > 2000) {
        // Salva la sequenza corrente
        if (currentSequence.length) {
          const startTime = Math.min(...currentSequence.map(i => i.startTime));
          const endTime = Math.max(...currentSequence.map(i => i.endTime));
          
          sequences.push({
            id: `seq-${sequenceId}`,
            name: `Sequenza ${sequenceId}`,
            startTime,
            endTime,
            items: [...currentSequence],
            color: sequenceColors[(sequenceId - 1) % sequenceColors.length]
          });
          
          sequenceId++;
          currentSequence = [];
        }
      }
      
      currentSequence.push(item);
      
      // Se è l'ultimo elemento, salva la sequenza corrente
      if (index === sortedItems.length - 1 && currentSequence.length) {
        const startTime = Math.min(...currentSequence.map(i => i.startTime));
        const endTime = Math.max(...currentSequence.map(i => i.endTime));
        
        sequences.push({
          id: `seq-${sequenceId}`,
          name: `Sequenza ${sequenceId}`,
          startTime,
          endTime,
          items: [...currentSequence],
          color: sequenceColors[(sequenceId - 1) % sequenceColors.length]
        });
      }
    });
    
    return sequences;
  }, [items, sequenceColors]);
  
  // Find asset by ID
  const findAssetById = (assetId: number | null | undefined): Asset | undefined => {
    if (!assetId) return undefined;
    return assets.find(asset => asset.id === assetId);
  };
  
  // Handle marker drag
  const handleMarkerDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    // Calculate position relative to timeline
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - timelineRect.left;
    const position = Math.max(0, Math.min(offsetX, timelineRect.width));
    
    setCurrentPosition(position);
  };
  
  // Get clip style based on type
  const getClipStyle = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-gradient-to-b from-blue-600 to-blue-700';
      case 'audio':
        return 'bg-gradient-to-b from-green-600 to-green-700';
      case 'text':
        return 'bg-gradient-to-b from-purple-600 to-purple-700';
      default:
        return 'bg-gradient-to-b from-gray-600 to-gray-700';
    }
  };
  
  // Generate time markers
  const generateTimeMarkers = () => {
    const markers = [];
    const totalDuration = 30; // 30 seconds for demo
    const interval = 5; // 5 seconds interval
    
    for (let i = 0; i <= totalDuration; i += interval) {
      markers.push(
        <div 
          key={i} 
          className={`timeline-scale-marker ${i % 10 === 0 ? 'h-5' : 'h-3'}`} 
          data-time={`${Math.floor(i / 60)}:${(i % 60).toString().padStart(2, '0')}`}
          style={{ marginLeft: i === 0 ? 0 : `${(zoom / 2)}px` }}
        />
      );
    }
    
    return markers;
  };
  
  const handleItemClick = (item: TimelineItem) => {
    onSelectItem(selectedItem?.id === item.id ? null : item);
  };
  
  // Calculate clip position and width based on time and zoom
  const calculateClipStyle = (startTime: number, endTime: number) => {
    const pixelsPerSecond = zoom / 10;
    const left = (startTime / 1000) * pixelsPerSecond + 100; // 100px offset for track labels
    const width = ((endTime - startTime) / 1000) * pixelsPerSecond;
    
    return {
      left: `${left}px`,
      width: `${width}px`,
    };
  };
  
  // Rendering virtuale degli elementi, mostrando solo quelli visibili
  const getVisibleTimeRange = useCallback(() => {
    if (!timelineRef.current) return { start: 0, end: 30000 }; // Default 30 secondi
    
    const timelineWidth = timelineRef.current.clientWidth - 100; // Sottraiamo l'offset delle etichette
    const pixelsPerSecond = zoom / 10;
    const visibleTime = timelineWidth / pixelsPerSecond * 1000; // Convertito in ms
    
    // Calcolo del punto iniziale in base allo scroll
    const scrollOffset = timelineRef.current.scrollLeft;
    const startTime = (scrollOffset / pixelsPerSecond) * 1000;
    const endTime = startTime + visibleTime;
    
    return { start: startTime, end: endTime };
  }, [zoom]);
  
  // Determina se un elemento è visibile nella viewport corrente
  const isItemVisible = useCallback((startTime: number, endTime: number) => {
    const { start, end } = getVisibleTimeRange();
    return (startTime <= end && endTime >= start);
  }, [getVisibleTimeRange]);
  
  // Switching tra modalità tracce e modalità sequenze
  const toggleSequenceMode = () => {
    setSequenceMode(!sequenceMode);
  };
  
  // Renderizza la timeline in modalità sequenze
  const renderSequencesView = () => {
    const sequences = generateSequences;
    
    return (
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium mb-3">Sequenze</h3>
          
          {sequences.length === 0 ? (
            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
              Nessuna sequenza rilevata automaticamente. Aggiungi più elementi alla timeline.
            </div>
          ) : (
            <div className="space-y-3">
              {sequences.map(sequence => (
                <div 
                  key={sequence.id}
                  className="bg-white rounded-md border border-gray-200 shadow-sm"
                >
                  <div className={cn("px-3 py-2 flex justify-between items-center rounded-t-md", sequence.color)}>
                    <h4 className="text-sm font-medium text-white">{sequence.name}</h4>
                    <span className="text-xs bg-white bg-opacity-30 text-white px-1.5 py-0.5 rounded">
                      {(sequence.endTime - sequence.startTime) / 1000}s
                    </span>
                  </div>
                  <div className="p-2">
                    <div className="text-xs text-gray-500 mb-1">
                      Elementi: <strong>{sequence.items.length}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {sequence.items.slice(0, 4).map(item => {
                        const asset = findAssetById(item.assetId);
                        return (
                          <div 
                            key={item.id}
                            className="text-xs p-1 bg-gray-50 rounded truncate"
                            onClick={() => onSelectItem(item)}
                          >
                            {asset?.name || item.type}
                          </div>
                        );
                      })}
                      {sequence.items.length > 4 && (
                        <div className="text-xs p-1 bg-gray-50 rounded text-center text-gray-500">
                          +{sequence.items.length - 4} altri
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Renderizza la timeline standard
  const renderTracksView = () => {
    return (
      <div 
        className="flex-1 overflow-x-auto overflow-y-hidden relative"
        ref={timelineRef}
        onMouseDown={handleMarkerDrag}
      >
        {/* Timeline Marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 bg-opacity-70 z-10"
          style={{ left: `${currentPosition + 100}px` }} // 100px offset for track labels
        />
        
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            {/* Time Scale */}
            <div className="timeline-scale sticky top-0 z-20 bg-white">
              <div className="absolute left-0 top-0 h-full w-24 bg-gray-50 border-r border-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-500 font-medium">Tracce</span>
              </div>
              <div className="flex ml-24">
                {generateTimeMarkers()}
              </div>
            </div>
            
            {/* Tracks */}
            {trackTypes.map((track) => (
              <div className="track relative" key={track.id}>
                <div className="absolute left-0 top-0 h-full w-24 bg-gray-50 border-r border-gray-200 flex items-center">
                  <span className="text-xs text-gray-700 font-medium ml-3">{track.name}</span>
                </div>
                
                {/* Clips in this track - applicare rendering virtuale */}
                {items
                  .filter(item => 
                    item.track === track.id && 
                    isItemVisible(item.startTime, item.endTime)
                  )
                  .map(item => {
                    const asset = findAssetById(item.assetId);
                    const clipStyle = calculateClipStyle(item.startTime, item.endTime);
                    
                    return (
                      <div 
                        key={item.id}
                        className={cn(
                          "clip absolute cursor-pointer overflow-hidden flex items-center justify-center",
                          getClipStyle(item.type),
                          selectedItem?.id === item.id && "ring-2 ring-primary"
                        )}
                        style={{
                          ...clipStyle,
                          top: '5px',
                          height: '40px',
                          borderRadius: '4px'
                        }}
                        onClick={() => handleItemClick(item)}
                      >
                        <span className="text-xs text-white truncate px-2">
                          {asset?.name || item.type}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ))}
          </>
        )}
      </div>
    );
  };
  
  return (
    <div className="h-64 bg-white border-t border-gray-200 overflow-hidden flex flex-col">
      {/* Timeline Controls */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" className="h-8 w-8 bg-white border-gray-200 text-gray-700 hover:bg-gray-100">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-white border-gray-200 text-gray-700 hover:bg-gray-100">
            <Redo className="h-4 w-4" />
          </Button>
          <div className="h-4 border-r border-gray-300 mx-1"></div>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-white border-gray-200 text-gray-700 hover:bg-gray-100">
            <Scissors className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-white border-gray-200 text-gray-700 hover:bg-gray-100">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-white border-gray-200 text-gray-700 hover:bg-gray-100">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant={sequenceMode ? "default" : "outline"} 
            size="sm" 
            className="h-8"
            onClick={toggleSequenceMode}
          >
            <Layers className="h-4 w-4 mr-1" />
            <span className="text-xs">Sequenze</span>
          </Button>
          
          {!sequenceMode && (
            <>
              <span className="text-xs text-gray-500 ml-2">Zoom:</span>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 bg-white border-gray-200 text-gray-700 hover:bg-gray-100" 
                onClick={() => setZoom(Math.max(10, zoom - 10))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Slider
                value={[zoom]}
                min={10}
                max={100}
                step={1}
                className="w-24"
                onValueChange={(value) => setZoom(value[0])}
              />
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 bg-white border-gray-200 text-gray-700 hover:bg-gray-100" 
                onClick={() => setZoom(Math.min(100, zoom + 10))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="h-8 bg-white border-gray-200 text-gray-700 hover:bg-gray-100">
            <Filter className="h-4 w-4 mr-1" />
            <span className="text-xs">Filtra</span>
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-white border-gray-200 text-gray-700 hover:bg-gray-100">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Timeline Content - Vista condizionale */}
      {sequenceMode ? renderSequencesView() : renderTracksView()}
    </div>
  );
}
