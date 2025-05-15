import { useState } from 'react';
import { FolderIcon, PlusIcon, SearchIcon, FlaskRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Asset } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTime, formatCreationTime } from '@/lib/utils';

interface MediaLibraryProps {
  assets: Asset[];
  isLoading: boolean;
  onAddToTimeline: (asset: Asset, track: number) => void;
  onRefresh: () => void;
}

export default function MediaLibrary({ assets, isLoading, onAddToTimeline, onRefresh }: MediaLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Filter assets based on search query and active tab
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || asset.type === activeTab;
    return matchesSearch && matchesTab;
  });
  
  // Group assets by type for folder view
  const assetsByType = {
    video: assets.filter(asset => asset.type === 'video'),
    audio: assets.filter(asset => asset.type === 'audio'),
    image: assets.filter(asset => asset.type === 'image'),
    generated: assets.filter(asset => asset.type === 'generated'),
  };
  
  // Handle dragging assets to timeline
  const handleDragStart = (e: React.DragEvent, asset: Asset) => {
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
  };
  
  // Gli asset vengono filtrati ed elaborati qui
  
  return (
    <div className="w-64 bg-dark-800 border-r border-dark-600 flex flex-col overflow-hidden hidden md:flex">
      <div className="p-3 bg-dark-700 border-b border-dark-600 flex items-center justify-between">
        <h3 className="font-medium text-sm">Libreria Media</h3>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <PlusIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <FolderIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-2 border-b border-dark-600">
        <div className="relative">
          <Input
            type="text"
            placeholder="Cerca media..."
            className="w-full bg-dark-600 text-sm pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      <Tabs defaultValue="all" className="flex-1 flex flex-col" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="p-2 bg-dark-700 border-b border-dark-600 justify-start">
          <TabsTrigger value="all" className="text-xs">Tutti</TabsTrigger>
          <TabsTrigger value="video" className="text-xs">Video</TabsTrigger>
          <TabsTrigger value="audio" className="text-xs">Audio</TabsTrigger>
          <TabsTrigger value="generated" className="text-xs">IA</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <TabsContent value="all" className="p-0 mt-0">
            {isLoading ? (
              <div className="p-3 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                {/* Folders section */}
                <div className="p-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Cartelle</h4>
                  <ul className="space-y-1">
                    <FolderItem name="Video" count={assetsByType.video.length} />
                    <FolderItem name="Audio" count={assetsByType.audio.length} />
                    <FolderItem name="Immagini" count={assetsByType.image.length} />
                    <FolderItem name="IA Generati" count={assetsByType.generated.length} active />
                  </ul>
                </div>
                
                {/* Recent Files */}
                <div className="p-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">File Recenti</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredAssets.slice(0, 4).map((asset) => (
                      <MediaThumbnail
                        key={asset.id}
                        asset={asset}
                        onDragStart={handleDragStart}
                        onClick={() => onAddToTimeline(asset, asset.type === 'audio' ? 1 : 0)}
                      />
                    ))}
                  </div>
                </div>
                
                {/* All Media Items */}
                <div className="p-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    {activeTab === 'all' ? 'Tutti i Media' : activeTab === 'generated' ? 'Contenuti IA' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                  </h4>
                  <div className="space-y-2">
                    {filteredAssets.map((asset) => (
                      <MediaCard
                        key={asset.id}
                        asset={asset}
                        onDragStart={handleDragStart}
                        onClick={() => onAddToTimeline(asset, asset.type === 'audio' ? 1 : 0)}
                      />
                    ))}
                    
                    {filteredAssets.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Nessun media trovato
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          
          {/* Content for other tabs would be similar */}
          <TabsContent value="video" className="p-0 mt-0">
            <div className="p-3">
              <div className="space-y-2">
                {filteredAssets.map((asset) => (
                  <MediaCard
                    key={asset.id}
                    asset={asset}
                    onDragStart={handleDragStart}
                    onClick={() => onAddToTimeline(asset, 0)}
                  />
                ))}
                
                {filteredAssets.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nessun file video trovato
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="audio" className="p-0 mt-0">
            <div className="p-3">
              <div className="space-y-2">
                {filteredAssets.map((asset) => (
                  <MediaCard
                    key={asset.id}
                    asset={asset}
                    onDragStart={handleDragStart}
                    onClick={() => onAddToTimeline(asset, 1)}
                  />
                ))}
                
                {filteredAssets.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nessun file audio trovato
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="generated" className="p-0 mt-0">
            <div className="p-3">
              <div className="space-y-2">
                {filteredAssets.map((asset) => (
                  <MediaCard
                    key={asset.id}
                    asset={asset}
                    onDragStart={handleDragStart}
                    onClick={() => onAddToTimeline(asset, asset.type === 'audio' ? 1 : 0)}
                  />
                ))}
                
                {filteredAssets.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nessun contenuto generato da IA trovato
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function FolderItem({ name, count, active = false }: { name: string; count: number; active?: boolean }) {
  return (
    <li className="text-sm text-foreground">
      <a href="#" className={`flex items-center p-2 ${active ? 'bg-dark-700' : 'hover:bg-dark-700'} rounded`}>
        <FolderIcon className={`mr-2 h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
        {name}
        {count > 0 && (
          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${active ? 'bg-primary' : 'bg-dark-600'}`}>
            {count}
          </span>
        )}
      </a>
    </li>
  );
}

function MediaThumbnail({ asset, onDragStart, onClick }: { asset: Asset; onDragStart: (e: React.DragEvent, asset: Asset) => void; onClick: () => void }) {
  return (
    <div 
      className="relative group cursor-pointer"
      draggable
      onDragStart={(e) => onDragStart(e, asset)}
      onClick={onClick}
    >
      <img 
        src={asset.thumbnail || 'https://via.placeholder.com/150x84?text=No+Thumbnail'} 
        alt={asset.name} 
        className="w-full h-16 object-cover rounded border border-dark-600"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 flex items-end transition-opacity p-1">
        <span className="text-xs truncate w-full">{asset.name}</span>
      </div>
    </div>
  );
}

function MediaCard({ asset, onDragStart, onClick }: { asset: Asset; onDragStart: (e: React.DragEvent, asset: Asset) => void; onClick: () => void }) {
  return (
    <div 
      className="p-2 bg-dark-700 rounded border border-dark-600 hover:border-primary transition cursor-pointer"
      draggable
      onDragStart={(e) => onDragStart(e, asset)}
      onClick={onClick}
    >
      <div className="flex items-center mb-1">
        {asset.type === 'generated' ? (
          <FlaskRound className="h-4 w-4 text-primary mr-1" />
        ) : (
          asset.type === 'video' ? (
            <svg className="h-4 w-4 text-blue-500 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 7.5L21 16.5C21 18.9853 18.9853 21 16.5 21L7.5 21C5.01472 21 3 18.9853 3 16.5L3 7.5C3 5.01472 5.01472 3 7.5 3L16.5 3C18.9853 3 21 5.01472 21 7.5Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/>
            </svg>
          ) : (
            <svg className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 10.5V13.5C3 14.6046 3.89543 15.5 5 15.5H8L11.5 19V5L8 8.5H5C3.89543 8.5 3 9.39543 3 10.5Z" fill="currentColor"/>
              <path d="M14 7.5C14 7.5 16 9.5 16 12C16 14.5 14 16.5 14 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M17.5 4.5C17.5 4.5 21 7.5 21 12C21 16.5 17.5 19.5 17.5 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )
        )}
        <span className="text-xs font-medium truncate">{asset.name}</span>
      </div>
      <div className="flex">
        <img 
          src={asset.thumbnail || 'https://via.placeholder.com/80x45?text=No+Thumbnail'} 
          alt={asset.name} 
          className="w-16 h-9 object-cover rounded"
        />
        <div className="ml-2 text-xs text-muted-foreground">
          <div>Durata: {formatTime(asset.duration || 0)}</div>
          <div>Creato: {formatCreationTime(asset.createdAt)}</div>
        </div>
      </div>
    </div>
  );
}
