import { useState } from 'react';
import { FlaskRound, MicIcon, ScissorsIcon, Timer, Type, AlignCenter, AlignLeft, AlignRight, ColorPicker } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimelineItem, Project, Asset } from '@shared/schema';

// Utility functions
const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatMilliseconds = (ms: number) => {
  const totalSeconds = ms / 1000;
  return formatDuration(totalSeconds);
};

const parseTimeToMilliseconds = (timeStr: string) => {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return ((hours * 3600) + (minutes * 60) + seconds) * 1000;
};

interface PropertiesPanelProps {
  selectedItem: TimelineItem | null;
  project: Project | undefined;
  assets: Asset[];
  onUpdateProject: (data: Partial<Project>) => void;
  onUpdateItem: (item: Partial<TimelineItem>) => void;
  onGenerateVideo: () => void;
  onGenerateVoiceOver: () => void;
}

export default function PropertiesPanel({
  selectedItem,
  project,
  assets,
  onUpdateProject,
  onUpdateItem,
  onGenerateVideo,
  onGenerateVoiceOver
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState('properties');
  
  // Find the asset for the selected timeline item
  const getSelectedAsset = (): Asset | undefined => {
    if (!selectedItem?.assetId) return undefined;
    return assets.find(asset => asset.id === selectedItem.assetId);
  };
  
  const selectedAsset = getSelectedAsset();
  
  // Handle project property changes
  const handleProjectChange = (field: keyof Project, value: any) => {
    if (!project) return;
    onUpdateProject({ ...project, [field]: value });
  };
  
  // Handle timeline item changes
  const handleItemChange = (field: keyof TimelineItem, value: any) => {
    if (!selectedItem) return;
    onUpdateItem({ ...selectedItem, [field]: value });
  };
  
  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-hidden hidden md:flex">
      {/* Tabs for different tools/properties */}
      <Tabs defaultValue="properties" className="flex-1 flex flex-col" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex border-b border-gray-200 bg-gray-50 rounded-none">
          <TabsTrigger value="properties" className="flex-1 py-3 rounded-none data-[state=active]:bg-white">
            Proprietà
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex-1 py-3 rounded-none data-[state=active]:bg-white">
            Effetti
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 py-3 rounded-none data-[state=active]:bg-white">
            IA
          </TabsTrigger>
        </TabsList>
        
        {/* Properties Tab */}
        <TabsContent value="properties" className="flex-1 p-0 m-0">
          <ScrollArea className="flex-1 h-full">
            {/* Video Properties Section */}
            <div className="p-3 border-b border-dark-600">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Proprietà Video</h3>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="projectName" className="text-xs text-muted-foreground block mb-1">
                    Nome
                  </Label>
                  <Input
                    id="projectName"
                    value={project?.title || ''}
                    onChange={(e) => handleProjectChange('title', e.target.value)}
                    className="w-full bg-dark-700 text-sm border-dark-600"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="resolution" className="text-xs text-muted-foreground block mb-1">
                      Risoluzione
                    </Label>
                    <Select 
                      value={project?.resolution || '1920x1080'} 
                      onValueChange={(value) => handleProjectChange('resolution', value)}
                    >
                      <SelectTrigger id="resolution" className="bg-dark-700 border-dark-600">
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1920x1080">1920 x 1080</SelectItem>
                        <SelectItem value="1280x720">1280 x 720</SelectItem>
                        <SelectItem value="3840x2160">3840 x 2160</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="fps" className="text-xs text-muted-foreground block mb-1">
                      FPS
                    </Label>
                    <Select 
                      value={project?.frameRate?.toString() || '30'} 
                      onValueChange={(value) => handleProjectChange('frameRate', parseInt(value))}
                    >
                      <SelectTrigger id="fps" className="bg-dark-700 border-dark-600">
                        <SelectValue placeholder="Select FPS" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="60">60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="duration" className="text-xs text-muted-foreground block mb-1">
                    Durata
                  </Label>
                  <div className="flex">
                    <Input
                      id="duration"
                      value={project?.duration ? formatDuration(project.duration) : '00:00:00'}
                      className="w-full bg-dark-700 text-sm border-dark-600"
                      readOnly
                    />
                    <Button variant="outline" size="icon" className="ml-2 h-9 w-9 bg-dark-600 hover:bg-dark-500 border-dark-600">
                      <Timer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Clip Properties Section */}
            {selectedItem && (
              <div className="p-3 border-b border-dark-600">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Elemento Selezionato</h3>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {/* Different UI based on item type */}
                  {selectedItem.type === 'text' ? (
                    // Text Item UI
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground block mb-1">
                          Testo
                        </Label>
                        <Input
                          value={selectedItem.properties?.text || 'Testo di esempio'}
                          onChange={(e) => {
                            const updatedProperties = {
                              ...selectedItem.properties,
                              text: e.target.value
                            };
                            handleItemChange('properties', updatedProperties);
                          }}
                          className="w-full bg-dark-700 text-sm border-dark-600"
                        />
                      </div>
                      
                      <div className="p-3 bg-dark-900 rounded border border-dark-600 text-center">
                        <div 
                          className="p-2"
                          style={{
                            fontSize: selectedItem.properties?.fontSize || '24px',
                            color: selectedItem.properties?.fontColor || '#FFFFFF',
                            backgroundColor: selectedItem.properties?.backgroundColor || 'rgba(0, 0, 0, 0.5)',
                            textAlign: selectedItem.properties?.alignment === 'left' ? 'left' : 
                                     selectedItem.properties?.alignment === 'right' ? 'right' : 'center',
                          }}
                        >
                          {selectedItem.properties?.text || 'Testo di esempio'}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-xs"
                          onClick={() => setActiveTab('effects')}
                        >
                          <AlignCenter className="h-3 w-3 mr-1" />
                          Stile
                        </Button>
                        
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="h-8 px-2 text-xs bg-primary"
                        >
                          <Type className="h-3 w-3 mr-1" />
                          Modifica Completa
                        </Button>
                      </div>
                    </>
                  ) : (
                    // Standard media item UI
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground block mb-1">
                          Anteprima
                        </Label>
                        <div className="relative">
                          <img
                            src={selectedAsset?.thumbnail || 'https://placehold.co/250x141/222/444?text=No+Preview'}
                            alt="Selected clip preview"
                            className="w-full rounded border border-dark-600"
                          />
                          <Button
                            variant="default"
                            size="icon"
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </Button>
                        </div>
                      </div>
                      
                      {selectedItem.type === 'video' || selectedItem.type === 'audio' ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="startTime" className="text-xs text-muted-foreground block mb-1">
                                Inizio
                              </Label>
                              <Input
                                id="startTime"
                                value={formatMilliseconds(selectedItem.startTime)}
                                onChange={(e) => handleItemChange('startTime', parseTimeToMilliseconds(e.target.value))}
                                className="w-full bg-dark-700 text-sm border-dark-600"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="endTime" className="text-xs text-muted-foreground block mb-1">
                                Fine
                              </Label>
                              <Input
                                id="endTime"
                                value={formatMilliseconds(selectedItem.endTime)}
                                onChange={(e) => handleItemChange('endTime', parseTimeToMilliseconds(e.target.value))}
                                className="w-full bg-dark-700 text-sm border-dark-600"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="volume" className="text-xs text-muted-foreground block mb-1">
                              Volume
                            </Label>
                            <div className="flex items-center">
                              <Slider
                                id="volume"
                                min={0}
                                max={100}
                                step={1}
                                defaultValue={[selectedItem.properties?.volume ? parseInt(selectedItem.properties.volume) : 80]}
                                onValueChange={(value) => {
                                  const updatedProperties = {
                                    ...selectedItem.properties,
                                    volume: value[0].toString()
                                  };
                                  handleItemChange('properties', updatedProperties);
                                }}
                                className="flex-1"
                              />
                              <span className="ml-2 text-xs text-muted-foreground">
                                {selectedItem.properties?.volume || '80'}%
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="speed" className="text-xs text-muted-foreground block mb-1">
                              Velocità
                            </Label>
                            <div className="flex items-center">
                              <Slider
                                id="speed"
                                min={25}
                                max={200}
                                step={1}
                                defaultValue={[selectedItem.properties?.speed ? parseInt(selectedItem.properties.speed) : 100]}
                                onValueChange={(value) => {
                                  const updatedProperties = {
                                    ...selectedItem.properties,
                                    speed: value[0].toString()
                                  };
                                  handleItemChange('properties', updatedProperties);
                                }}
                                className="flex-1"
                              />
                              <span className="ml-2 text-xs text-muted-foreground">
                                {selectedItem.properties?.speed 
                                  ? (parseInt(selectedItem.properties.speed) / 100).toFixed(1) 
                                  : '1.0'}x
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        // Image specific controls
                        <div>
                          <Label htmlFor="scale" className="text-xs text-muted-foreground block mb-1">
                            Scala
                          </Label>
                          <div className="flex items-center">
                            <Slider
                              id="scale"
                              min={25}
                              max={200}
                              step={1}
                              defaultValue={[selectedItem.properties?.scale ? parseFloat(selectedItem.properties.scale) * 100 : 100]}
                              onValueChange={(value) => {
                                const updatedProperties = {
                                  ...selectedItem.properties,
                                  scale: (value[0] / 100).toString()
                                };
                                handleItemChange('properties', updatedProperties);
                              }}
                              className="flex-1"
                            />
                            <span className="ml-2 text-xs text-muted-foreground">
                              {selectedItem.properties?.scale 
                                ? (parseFloat(selectedItem.properties.scale)).toFixed(1) 
                                : '1.0'}x
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Common timing controls for all items */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-dark-600">
                    <div>
                      <Label htmlFor="itemStartTime" className="text-xs text-muted-foreground block mb-1">
                        Inizio
                      </Label>
                      <Input
                        id="itemStartTime"
                        value={formatMilliseconds(selectedItem.startTime)}
                        onChange={(e) => handleItemChange('startTime', parseTimeToMilliseconds(e.target.value))}
                        className="w-full bg-dark-700 text-sm border-dark-600"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="itemDuration" className="text-xs text-muted-foreground block mb-1">
                        Durata
                      </Label>
                      <Input
                        id="itemDuration"
                        value={formatMilliseconds(selectedItem.endTime - selectedItem.startTime)}
                        className="w-full bg-dark-700 text-sm border-dark-600"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        {/* Effects Tab */}
        <TabsContent value="effects" className="flex-1 p-0 m-0">
          <ScrollArea className="flex-1 h-full">
            <div className="p-4">
              {selectedItem?.type === 'text' ? (
                // Text formatting options
                <>
                  <h3 className="text-sm font-medium mb-3">Formattazione Testo</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fontSize" className="text-xs text-muted-foreground block mb-1">
                        Dimensione Font
                      </Label>
                      <div className="flex items-center">
                        <Slider
                          id="fontSize"
                          min={12}
                          max={72}
                          step={1}
                          defaultValue={[parseInt(selectedItem.properties?.fontSize || '24')]}
                          onValueChange={(value) => {
                            const updatedProperties = {
                              ...selectedItem.properties,
                              fontSize: `${value[0]}px`
                            };
                            handleItemChange('properties', updatedProperties);
                          }}
                          className="flex-1"
                        />
                        <span className="ml-2 text-xs text-muted-foreground">
                          {selectedItem.properties?.fontSize?.replace('px', '') || '24'}px
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground block mb-1">
                        Allineamento
                      </Label>
                      <div className="flex space-x-2 mt-1">
                        <Button 
                          variant={selectedItem.properties?.alignment === 'left' ? 'default' : 'outline'} 
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const updatedProperties = {
                              ...selectedItem.properties,
                              alignment: 'left'
                            };
                            handleItemChange('properties', updatedProperties);
                          }}
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={!selectedItem.properties?.alignment || selectedItem.properties?.alignment === 'center' ? 'default' : 'outline'} 
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const updatedProperties = {
                              ...selectedItem.properties,
                              alignment: 'center'
                            };
                            handleItemChange('properties', updatedProperties);
                          }}
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={selectedItem.properties?.alignment === 'right' ? 'default' : 'outline'} 
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const updatedProperties = {
                              ...selectedItem.properties,
                              alignment: 'right'
                            };
                            handleItemChange('properties', updatedProperties);
                          }}
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground block mb-1">
                        Colori
                      </Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <Label htmlFor="fontColor" className="text-xs text-muted-foreground block mb-1">
                            Testo
                          </Label>
                          <div className="flex">
                            <Input
                              id="fontColor"
                              type="color"
                              value={selectedItem.properties?.fontColor || '#FFFFFF'}
                              onChange={(e) => {
                                const updatedProperties = {
                                  ...selectedItem.properties,
                                  fontColor: e.target.value
                                };
                                handleItemChange('properties', updatedProperties);
                              }}
                              className="w-12 h-7 p-0 bg-dark-700 border-dark-600"
                            />
                            <Input
                              value={selectedItem.properties?.fontColor || '#FFFFFF'}
                              onChange={(e) => {
                                const updatedProperties = {
                                  ...selectedItem.properties,
                                  fontColor: e.target.value
                                };
                                handleItemChange('properties', updatedProperties);
                              }}
                              className="w-full ml-2 bg-dark-700 text-sm border-dark-600"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="bgColor" className="text-xs text-muted-foreground block mb-1">
                            Sfondo
                          </Label>
                          <div className="flex">
                            <Input
                              id="bgColor"
                              type="color"
                              value={selectedItem.properties?.backgroundColor?.includes('rgba') 
                                ? '#000000' 
                                : (selectedItem.properties?.backgroundColor || '#000000')}
                              onChange={(e) => {
                                const updatedProperties = {
                                  ...selectedItem.properties,
                                  backgroundColor: e.target.value
                                };
                                handleItemChange('properties', updatedProperties);
                              }}
                              className="w-12 h-7 p-0 bg-dark-700 border-dark-600"
                            />
                            <Input
                              value={selectedItem.properties?.backgroundColor || 'rgba(0, 0, 0, 0.5)'}
                              onChange={(e) => {
                                const updatedProperties = {
                                  ...selectedItem.properties,
                                  backgroundColor: e.target.value
                                };
                                handleItemChange('properties', updatedProperties);
                              }}
                              className="w-full ml-2 bg-dark-700 text-sm border-dark-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Visual effects for videos and images
                <>
                  <h3 className="text-sm font-medium mb-3">Effetti Visivi</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="brightness" className="text-xs text-muted-foreground block mb-1">
                        Luminosità
                      </Label>
                      <div className="flex items-center">
                        <Slider
                          id="brightness"
                          min={-100}
                          max={100}
                          step={1}
                          defaultValue={[parseInt(selectedItem?.properties?.brightness || '0')]}
                          onValueChange={(value) => {
                            const updatedProperties = {
                              ...selectedItem?.properties,
                              brightness: value[0].toString()
                            };
                            handleItemChange('properties', updatedProperties);
                          }}
                          className="flex-1"
                        />
                        <span className="ml-2 text-xs text-muted-foreground">
                          {selectedItem?.properties?.brightness || '0'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="contrast" className="text-xs text-muted-foreground block mb-1">
                        Contrasto
                      </Label>
                      <div className="flex items-center">
                        <Slider
                          id="contrast"
                          min={-100}
                          max={100}
                          step={1}
                          defaultValue={[parseInt(selectedItem?.properties?.contrast || '0')]}
                          onValueChange={(value) => {
                            const updatedProperties = {
                              ...selectedItem?.properties,
                              contrast: value[0].toString()
                            };
                            handleItemChange('properties', updatedProperties);
                          }}
                          className="flex-1"
                        />
                        <span className="ml-2 text-xs text-muted-foreground">
                          {selectedItem?.properties?.contrast || '0'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="saturation" className="text-xs text-muted-foreground block mb-1">
                        Saturazione
                      </Label>
                      <div className="flex items-center">
                        <Slider
                          id="saturation"
                          min={-100}
                          max={100}
                          step={1}
                          defaultValue={[parseInt(selectedItem?.properties?.saturation || '0')]}
                          onValueChange={(value) => {
                            const updatedProperties = {
                              ...selectedItem?.properties,
                              saturation: value[0].toString()
                            };
                            handleItemChange('properties', updatedProperties);
                          }}
                          className="flex-1"
                        />
                        <span className="ml-2 text-xs text-muted-foreground">
                          {selectedItem?.properties?.saturation || '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {(selectedItem?.type === 'video' || selectedItem?.type === 'audio') && (
                    <>
                      <h3 className="text-sm font-medium mt-6 mb-3">Effetti Audio</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="bass" className="text-xs text-muted-foreground block mb-1">
                            Bassi
                          </Label>
                          <div className="flex items-center">
                            <Slider
                              id="bass"
                              min={-12}
                              max={12}
                              step={1}
                              defaultValue={[parseInt(selectedItem?.properties?.bass || '0')]}
                              onValueChange={(value) => {
                                const updatedProperties = {
                                  ...selectedItem?.properties,
                                  bass: value[0].toString()
                                };
                                handleItemChange('properties', updatedProperties);
                              }}
                              className="flex-1"
                            />
                            <span className="ml-2 text-xs text-muted-foreground">
                              {selectedItem?.properties?.bass || '0'} dB
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="treble" className="text-xs text-muted-foreground block mb-1">
                            Alti
                          </Label>
                          <div className="flex items-center">
                            <Slider
                              id="treble"
                              min={-12}
                              max={12}
                              step={1}
                              defaultValue={[parseInt(selectedItem?.properties?.treble || '0')]}
                              onValueChange={(value) => {
                                const updatedProperties = {
                                  ...selectedItem?.properties,
                                  treble: value[0].toString()
                                };
                                handleItemChange('properties', updatedProperties);
                              }}
                              className="flex-1"
                            />
                            <span className="ml-2 text-xs text-muted-foreground">
                              {selectedItem?.properties?.treble || '0'} dB
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        {/* AI Tab */}
        <TabsContent value="ai" className="flex-1 p-0 m-0">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Strumenti IA</h3>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </Button>
            </div>
            
            <div className="space-y-2">
              <Button
                className="w-full py-2 px-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={onGenerateVideo}
              >
                <FlaskRound className="h-4 w-4 mr-2" />
                Genera Video
              </Button>
              
              <Button
                className="w-full py-2 px-3"
                variant="outline"
                onClick={onGenerateVoiceOver}
              >
                <MicIcon className="h-4 w-4 mr-2" />
                Genera Voce
              </Button>
              
              <Button
                className="w-full py-2 px-3"
                variant="outline"
              >
                <ScissorsIcon className="h-4 w-4 mr-2" />
                Taglia Automatico
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}