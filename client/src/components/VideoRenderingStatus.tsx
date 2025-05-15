import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/lib/websocket';
import { CheckCircle, AlertCircle, Clock, PlayCircle, FileVideo, Copy } from 'lucide-react';

interface VideoRenderingStatusProps {
  videoId?: string;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  videoTitle?: string;
  errorMessage?: string;
  completedVideoUrl?: string;
  thumbnailUrl?: string;
  onComplete?: (videoUrl: string, thumbnailUrl: string) => void;
  onRetry?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

interface RenderStatus {
  id: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  message: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export default function VideoRenderingStatus({ 
  videoId, 
  status: externalStatus, 
  progress: externalProgress, 
  videoTitle,
  errorMessage: externalError,
  completedVideoUrl, 
  thumbnailUrl: externalThumbnail,
  onComplete,
  onRetry,
  onDownload,
  onShare
}: VideoRenderingStatusProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<RenderStatus | null>(null);
  const { socket, connected } = useWebSocket();

  // Carica lo stato iniziale del rendering
  const { data, isLoading, error } = useQuery({
    queryKey: videoId ? [`/api/videos/${videoId}/status`] : ['/api/videos/recent'],
    enabled: !!videoId || true,
  });

  // Utilizzo proprietà esterne se fornite, altrimenti dati dal server
  useEffect(() => {
    if (externalStatus) {
      // Se i dati vengono passati come props, crea un oggetto di stato
      setStatus({
        id: parseInt(videoId || '0'),
        status: externalStatus,
        progress: externalProgress || 0,
        stage: '',
        message: videoTitle || '',
        videoUrl: completedVideoUrl,
        thumbnailUrl: externalThumbnail,
        error: externalError,
        createdAt: new Date().toISOString()
      });
    } else if (data) {
      // Altrimenti usa i dati caricati dal server
      setStatus(Array.isArray(data) ? data[0] : data);
    }
  }, [data, externalStatus, externalProgress, videoTitle, externalError, completedVideoUrl, externalThumbnail, videoId]);

  // Gestione messaggi WebSocket per aggiornamenti in tempo reale
  useEffect(() => {
    if (!socket || !connected) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        // Aggiorna solo se è pertinente al video corrente o, se nessun ID è specificato, prendi l'ultimo
        if (message.type === 'render_update' && 
            (!videoId || message.payload.id === parseInt(videoId))) {
          setStatus(message.payload);
          
          // Notifica di completamento
          if (message.payload.status === 'completed' && onComplete && message.payload.videoUrl) {
            onComplete(message.payload.videoUrl, message.payload.thumbnailUrl || '');
            toast({
              title: 'Rendering completato!',
              description: 'Il tuo video è pronto per essere visualizzato e condiviso.',
            });
          }
          
          // Notifica di errore
          if (message.payload.status === 'failed') {
            toast({
              variant: 'destructive',
              title: 'Errore durante il rendering',
              description: message.payload.error || 'Si è verificato un errore imprevisto.',
            });
          }
        }
      } catch (e) {
        console.error('Errore nel parsing del messaggio WebSocket:', e);
      }
    };

    socket.addEventListener('message', handleMessage);
    
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, connected, videoId, onComplete, toast]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Caricamento stato rendering...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-primary/10"></div>
            <div className="h-4 w-3/4 animate-pulse rounded bg-primary/5"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Errore</AlertTitle>
        <AlertDescription>
          Impossibile caricare lo stato del rendering. Riprova più tardi.
        </AlertDescription>
      </Alert>
    );
  }

  if (!status) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileVideo className="mr-2 h-5 w-5" />
            Nessun video in elaborazione
          </CardTitle>
          <CardDescription>
            Non ci sono rendering video attivi o recenti.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Aggiunti pulsanti per azioni personalizzate
  const renderActionButtons = () => {
    const buttons = [];
    
    if (status?.status === 'completed' && status.videoUrl) {
      // Pulsante copia URL
      buttons.push(
        <Button 
          key="copy"
          variant="outline" 
          onClick={() => {
            navigator.clipboard.writeText(status.videoUrl || '');
            toast({
              title: 'URL copiato!',
              description: 'Link al video copiato negli appunti',
            });
          }}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copia URL
        </Button>
      );
      
      // Pulsante apri video
      buttons.push(
        <Button key="open" asChild>
          <a href={status.videoUrl} target="_blank" rel="noopener noreferrer">
            <PlayCircle className="h-4 w-4 mr-2" />
            Apri video
          </a>
        </Button>
      );
      
      // Pulsanti personalizzati se forniti
      if (onDownload) {
        buttons.push(
          <Button key="download" variant="secondary" onClick={onDownload}>
            <span className="h-4 w-4 mr-2">⬇️</span>
            Scarica
          </Button>
        );
      }
      
      if (onShare) {
        buttons.push(
          <Button key="share" variant="outline" onClick={onShare}>
            <span className="h-4 w-4 mr-2">🔗</span>
            Condividi
          </Button>
        );
      }
    }
    
    if (status?.status === 'failed' && onRetry) {
      buttons.push(
        <Button key="retry" variant="secondary" onClick={onRetry}>
          <span className="h-4 w-4 mr-2">🔄</span>
          Riprova
        </Button>
      );
    }
    
    return buttons;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            {status?.status === 'completed' && <CheckCircle className="mr-2 h-5 w-5 text-green-500" />}
            {status?.status === 'processing' && <FileVideo className="mr-2 h-5 w-5 text-blue-500 animate-pulse" />}
            {status?.status === 'queued' && <Clock className="mr-2 h-5 w-5 text-amber-500" />}
            {status?.status === 'failed' && <AlertCircle className="mr-2 h-5 w-5 text-red-500" />}
            
            {status?.status === 'completed' && 'Video pronto'}
            {status?.status === 'processing' && 'Rendering in corso'}
            {status?.status === 'queued' && 'In attesa di elaborazione'}
            {status?.status === 'failed' && 'Rendering fallito'}
          </CardTitle>
          
          <Badge 
            variant={
              status?.status === 'completed' ? 'default' : 
              status?.status === 'processing' ? 'secondary' :
              status?.status === 'queued' ? 'outline' : 'destructive'
            }
          >
            {status?.status === 'completed' && 'Completato'}
            {status?.status === 'processing' && `${Math.round(status.progress)}%`}
            {status?.status === 'queued' && 'In coda'}
            {status?.status === 'failed' && 'Errore'}
          </Badge>
        </div>
        
        <CardDescription>
          {status?.stage && <span className="block mt-1">{status.stage}</span>}
          {status?.message && <span className="block mt-1">{status.message}</span>}
          
          {status?.status === 'completed' && status.completedAt && (
            <span className="block mt-1">
              Completato il {new Date(status.completedAt).toLocaleString()}
            </span>
          )}
          
          {status?.status === 'failed' && status.error && (
            <Alert variant="destructive" className="mt-3">
              <AlertTitle>Dettagli errore</AlertTitle>
              <AlertDescription>
                {status.error}
              </AlertDescription>
            </Alert>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {status?.status === 'processing' && (
          <Progress value={status.progress} className="h-2" />
        )}
        
        {status?.status === 'completed' && (status.videoUrl || completedVideoUrl) && (
          <div className="aspect-video rounded-md overflow-hidden bg-black">
            <video 
              src={status.videoUrl || completedVideoUrl} 
              poster={status.thumbnailUrl || externalThumbnail}
              controls
              className="w-full h-full"
            />
          </div>
        )}
      </CardContent>
      
      {(status?.status === 'completed' || status?.status === 'failed') && (
        <CardFooter className="flex flex-wrap justify-between gap-2">
          {renderActionButtons()}
        </CardFooter>
      )}
    </Card>
  );
}