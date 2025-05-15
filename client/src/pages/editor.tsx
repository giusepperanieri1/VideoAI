import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import VideoPreview from "@/components/editor/VideoPreview";
import Timeline from "@/components/editor/Timeline";
import MediaLibrary from "@/components/editor/MediaLibrary";
import PropertiesPanel from "@/components/editor/PropertiesPanel";
import TextToVideoModal from "@/components/modals/TextToVideoModal";
import VoiceOverModal from "@/components/modals/VoiceOverModal";
import PublishModal from "@/components/modals/PublishModal";
import NewProjectModal from "@/components/modals/NewProjectModal";
import TextOverlayModal from "@/components/modals/TextOverlayModal";
import SegmentVideoModal from "@/components/modals/SegmentVideoModal";
import { Button } from "@/components/ui/button";
import { 
  PlusIcon, 
  UploadIcon, 
  SaveIcon, 
  ShareIcon, 
  Type, 
  VideoIcon, 
  MicIcon, 
  ImageIcon, 
  Layers,
  ScissorsIcon
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Asset, Project, TimelineItem } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Editor() {
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showTextToVideoModal, setShowTextToVideoModal] = useState(false);
  const [showVoiceOverModal, setShowVoiceOverModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showTextOverlayModal, setShowTextOverlayModal] = useState(false);
  const [showSegmentVideoModal, setShowSegmentVideoModal] = useState(false);
  const [selectedAssetForSegmentation, setSelectedAssetForSegmentation] = useState<Asset | undefined>();
  
  // Use authenticated user ID
  const userId = 1; // This will be replaced with the actual user ID from auth
  
  // Fetch project if ID is provided
  const { 
    data: project, 
    isLoading: isLoadingProject 
  } = useQuery({
    queryKey: id ? [`/api/projects/${id}`] : [],
    enabled: !!id,
  });
  
  // Fetch timeline items for the project
  const { 
    data: timelineItems = [], 
    isLoading: isLoadingTimeline,
    refetch: refetchTimeline
  } = useQuery({
    queryKey: id ? [`/api/projects/${id}/timeline`] : [],
    enabled: !!id,
  });
  
  // Fetch assets
  const { 
    data: assets = [], 
    isLoading: isLoadingAssets,
    refetch: refetchAssets
  } = useQuery({
    queryKey: ["/api/assets", { userId }],
  });
  
  // Save project mutation
  const saveProjectMutation = useMutation({
    mutationFn: async (projectData: Partial<Project>) => {
      if (id) {
        // Update existing project
        return apiRequest("PUT", `/api/projects/${id}`, projectData);
      } else {
        // Create new project if there's none
        return apiRequest("POST", "/api/projects", {
          userId,
          title: "Untitled Project",
          ...projectData
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Progetto salvato",
        description: "Il tuo progetto è stato salvato con successo.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare il progetto. Riprova più tardi.",
        variant: "destructive",
      });
    }
  });
  
  // Save timeline item mutation
  const saveTimelineItemMutation = useMutation({
    mutationFn: async (itemData: Partial<TimelineItem>) => {
      if (itemData.id) {
        // Update existing item
        return apiRequest("PUT", `/api/timeline-items/${itemData.id}`, itemData);
      } else {
        // Create new item
        return apiRequest("POST", "/api/timeline-items", {
          projectId: Number(id),
          ...itemData
        });
      }
    },
    onSuccess: () => {
      refetchTimeline();
    }
  });
  
  // Handle save project
  const handleSaveProject = () => {
    if (project && 'title' in project && 'description' in project) {
      saveProjectMutation.mutate({
        title: project.title,
        description: project.description
      });
    } else {
      setShowNewProjectModal(true);
    }
  };
  
  // Handle adding an asset to the timeline
  const handleAddAssetToTimeline = (asset: Asset, track: number) => {
    if (!id) {
      toast({
        title: "Nessun progetto aperto",
        description: "Crea o apri un progetto prima di continuare.",
        variant: "destructive",
      });
      return;
    }
    
    const newItem: Partial<TimelineItem> = {
      projectId: Number(id),
      assetId: asset.id,
      type: asset.type,
      track: track,
      startTime: 0, // Default start time
      endTime: (asset.duration || 10) * 1000, // Convert seconds to milliseconds
      properties: {}
    };
    
    saveTimelineItemMutation.mutate(newItem);
  };
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-50">
      {/* Top Header */}
      <header className="border-b border-gray-200 px-4 py-2.5 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">
            {project && 'title' in project ? project.title : "Nuovo Progetto"}
          </h1>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewProjectModal(true)}
              className="text-xs bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <PlusIcon className="h-3.5 w-3.5 mr-1" />
              Nuovo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveProject}
              className="text-xs bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <SaveIcon className="h-3.5 w-3.5 mr-1" />
              Salva
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <UploadIcon className="h-3.5 w-3.5 mr-1" />
            Carica
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowPublishModal(true)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700"
          >
            <ShareIcon className="h-3.5 w-3.5 mr-1" />
            Pubblica
          </Button>
        </div>
      </header>
      
      {/* Guida Rapida */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-indigo-100 rounded-full p-2 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-700" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-indigo-900">Come usare l'editor</h3>
            <p className="text-xs text-indigo-700">Trascina gli elementi dalla libreria alla timeline, poi modifica le proprietà nel pannello a destra</p>
          </div>
        </div>
        <Button variant="link" className="text-xs text-indigo-600 hover:text-indigo-800">
          Mostra tutorial completo
        </Button>
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Media Library */}
        <div className="w-[280px] bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-sm font-medium text-gray-900">Libreria Media</h2>
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">Aggiungi contenuti</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 bg-gray-100 hover:bg-gray-200 rounded-full shadow-sm">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <MediaLibrary 
              assets={assets || []}
              isLoading={isLoadingAssets}
              onAddToTimeline={handleAddAssetToTimeline}
              onRefresh={refetchAssets}
            />
          </div>
        </div>
        
        {/* Center Panel - Preview and Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Preview */}
          <div className="flex-1 bg-gray-100 flex items-center justify-center relative">
            <VideoPreview
              timelineItems={timelineItems as TimelineItem[]}
              assets={assets as Asset[]}
              isLoading={isLoadingTimeline}
            />
            
            {/* Empty state overlay */}
            {(!timelineItems || timelineItems.length === 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 bg-opacity-90 text-center p-8">
                <div className="mb-4 w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Nessun video nella timeline</h3>
                <p className="text-gray-500 max-w-md mt-1">
                  Aggiungi contenuti dalla libreria media o crea nuovi elementi video, audio o testo.
                </p>
                <div className="flex mt-4 gap-2">
                  <Button 
                    size="sm"
                    className="text-xs bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setShowTextToVideoModal(true)}
                  >
                    <VideoIcon className="h-3.5 w-3.5 mr-1" />
                    Crea Video da Testo
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Tools Bar */}
          <div className="h-10 bg-white border-y border-gray-200 flex items-center justify-between px-3">
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => setShowTextToVideoModal(true)}
              >
                <VideoIcon className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => setShowVoiceOverModal(true)}
              >
                <MicIcon className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => setShowTextOverlayModal(true)}
              >
                <Type className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  const selectedVideoAsset = assets.find(a => a.type === 'video');
                  if (selectedVideoAsset) {
                    setSelectedAssetForSegmentation(selectedVideoAsset);
                    setShowSegmentVideoModal(true);
                  } else {
                    toast({
                      title: "Nessun video disponibile",
                      description: "Aggiungi un video alla libreria per utilizzare questa funzionalità.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <ScissorsIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Elementi attivi:</span>
              <span className="font-medium text-gray-800">{timelineItems?.length || 0}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Zoom:</span>
              <div className="flex bg-gray-100 rounded">
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none">
                  <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none">
                  <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="h-40 bg-white">
            <Timeline 
              items={timelineItems as TimelineItem[]}
              assets={assets as Asset[]}
              isLoading={isLoadingTimeline}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
              onUpdateItem={(item) => saveTimelineItemMutation.mutate(item)}
              onRefresh={refetchTimeline}
            />
          </div>
        </div>
        
        {/* Right Panel - Properties */}
        <div className="w-[280px] bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900">Proprietà</h2>
          </div>
          <div className="flex-1 overflow-auto">
            <PropertiesPanel 
              selectedItem={selectedItem}
              project={project as Project}
              assets={assets as Asset[]}
              onUpdateProject={(data) => saveProjectMutation.mutate(data)}
              onUpdateItem={(item) => saveTimelineItemMutation.mutate(item)}
              onGenerateVideo={() => setShowTextToVideoModal(true)}
              onGenerateVoiceOver={() => setShowVoiceOverModal(true)}
            />
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {showNewProjectModal && (
        <NewProjectModal 
          userId={userId}
          onClose={() => setShowNewProjectModal(false)}
        />
      )}
      
      {showTextToVideoModal && (
        <TextToVideoModal 
          userId={userId}
          onClose={() => setShowTextToVideoModal(false)}
          onSuccess={() => {
            refetchAssets();
            setShowTextToVideoModal(false);
          }}
        />
      )}
      
      {showVoiceOverModal && id && (
        <VoiceOverModal 
          projectId={parseInt(id)}
          onClose={() => setShowVoiceOverModal(false)}
          onSave={(voiceOverUrl, duration) => {
            // Qui possiamo eventualmente aggiungere il voice-over alla timeline
            toast({
              title: "Voice-over aggiunto",
              description: "Il voice-over è stato aggiunto al progetto.",
            });
            // Aggiungi il voice-over alla timeline
            saveTimelineItemMutation.mutate({
              projectId: parseInt(id),
              assetId: null, // Il voice-over non necessita di un asset
              type: 'audio',
              track: 1, // Traccia audio
              startTime: 0,
              endTime: duration * 1000, // Convertiamo in millisecondi
              properties: {
                url: voiceOverUrl,
                type: 'voice-over',
                volume: 1
              }
            });
            refetchAssets();
            refetchTimeline();
            setShowVoiceOverModal(false);
          }}
        />
      )}
      
      {showPublishModal && (
        <PublishModal 
          project={project as Project}
          onClose={() => setShowPublishModal(false)}
        />
      )}
      
      {showTextOverlayModal && id && (
        <TextOverlayModal 
          projectId={parseInt(id)}
          onClose={() => setShowTextOverlayModal(false)}
          onSuccess={(item) => {
            refetchTimeline();
            setShowTextOverlayModal(false);
          }}
          editItem={selectedItem?.type === 'text' ? selectedItem : undefined}
        />
      )}
      
      <SegmentVideoModal
        isOpen={showSegmentVideoModal}
        onClose={() => setShowSegmentVideoModal(false)}
        selectedAsset={selectedAssetForSegmentation}
        onSegmentsCreated={(assetIds) => {
          toast({
            title: "Segmentazione completata",
            description: `${assetIds.length} nuovi segmenti sono stati creati e aggiunti alla libreria.`,
          });
          refetchAssets();
        }}
      />
    </div>
  );
}
