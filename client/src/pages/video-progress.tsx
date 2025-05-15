import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRenderNotifications, usePublishNotifications, RenderStatus, PublishStatus } from "@/lib/websocket";

// Definiamo i tipi per migliorare la gestione degli errori TypeScript
interface VideoRequest {
  id: number;
  userId: string;
  title: string;
  prompt?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Clock, Loader2, Video, Share2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import VideoPreviewPlayer from "@/components/VideoPreviewPlayer";
import VideoRenderingStatus from "@/components/VideoRenderingStatus";

export default function VideoProgress() {
  const { user } = useAuth();
  const { renderUpdates, error: renderError } = useRenderNotifications();
  const { publishUpdates, error: publishError } = usePublishNotifications();
  const [activeTab, setActiveTab] = useState<string>("rendering");
  
  // Fetch delle richieste di generazione video
  const { data: videoRequests, isLoading: isLoadingVideos } = useQuery<VideoRequest[]>({
    queryKey: ["/api/videos/requests"],
    enabled: !!user
  });
  
  // Combinazione dei dati dal server con gli aggiornamenti in tempo reale
  const combinedVideoRequests = React.useMemo(() => {
    if (!videoRequests || !Array.isArray(videoRequests)) return [];
    
    return videoRequests.map((request) => {
      const liveUpdate = renderUpdates?.find(update => update.id === request.id);
      if (liveUpdate) {
        return {
          ...request,
          status: liveUpdate.status,
          progress: liveUpdate.progress,
          resultUrl: liveUpdate.videoUrl || request.resultUrl,
          thumbnailUrl: liveUpdate.thumbnailUrl || request.thumbnailUrl,
          errorMessage: liveUpdate.error || request.errorMessage
        };
      }
      return request;
    });
  }, [videoRequests, renderUpdates]);
  
  // Ordinamento per data di creazione (più recenti prima)
  const sortedVideoRequests = React.useMemo(() => {
    return [...(combinedVideoRequests || [])].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [combinedVideoRequests]);
  
  // Download di un video
  const handleDownloadVideo = (videoUrl: string, title: string) => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // Condivisione di un video
  const handleShareVideo = (videoUrl: string, title: string) => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: "Guarda questo video che ho creato!",
        url: videoUrl
      });
    } else {
      navigator.clipboard.writeText(videoUrl);
      // Feedback utente (toast) sarebbe ideale qui
    }
  };
  
  // Contenuto della scheda "Rendering"
  const renderRenderingTab = () => {
    if (isLoadingVideos) {
      return (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Caricamento richieste video...</p>
        </div>
      );
    }
    
    if (!sortedVideoRequests || sortedVideoRequests.length === 0) {
      return (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <Video className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nessuna richiesta di generazione video</h3>
          <p className="text-muted-foreground max-w-md">
            Non hai ancora generato alcun video. Vai alla sezione "Crea" per generare il tuo primo video.
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 gap-6">
        {sortedVideoRequests.map((request: any) => (
          <VideoRenderingStatus
            key={request.id}
            status={request.status}
            progress={request.progress}
            videoTitle={request.title || request.prompt?.slice(0, 50) || "Video senza titolo"}
            errorMessage={request.errorMessage}
            completedVideoUrl={request.resultUrl}
            thumbnailUrl={request.thumbnailUrl}
            onRetry={() => console.log("Retry", request.id)}
            onDownload={() => handleDownloadVideo(request.resultUrl, request.title || "video")}
            onShare={() => handleShareVideo(request.resultUrl, request.title || "video")}
          />
        ))}
      </div>
    );
  };
  
  // Contenuto della scheda "Pubblicazioni"
  const renderPublishingTab = () => {
    // TODO: Implementare la visualizzazione delle pubblicazioni
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <Share2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium mb-2">Nessuna pubblicazione in corso</h3>
        <p className="text-muted-foreground max-w-md">
          Non hai ancora pubblicato alcun video sui social media. Utilizza la funzione "Pubblica" 
          dalla pagina di un progetto o di un video completato.
        </p>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-heading font-bold">Attività</h1>
        <p className="text-muted-foreground">Monitora lo stato delle tue generazioni video e pubblicazioni</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="rendering">Generazione Video</TabsTrigger>
          <TabsTrigger value="publishing">Pubblicazioni Social</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rendering" className="pt-2">
          {renderRenderingTab()}
        </TabsContent>
        
        <TabsContent value="publishing" className="pt-2">
          {renderPublishingTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}