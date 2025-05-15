import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Scissors, Wand2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useWebSocket } from '@/lib/websocket';

interface AISegmentationButtonProps {
  videoUrl: string;
  projectId: number;
  disabled?: boolean;
  onComplete?: (segments: any[], subtitles: any[]) => void;
}

export default function AISegmentationButton({ 
  videoUrl, 
  projectId, 
  disabled = false,
  onComplete
}: AISegmentationButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<number | null>(null);
  const { socket, connected } = useWebSocket();
  
  // Mutation per richiedere la segmentazione
  const segmentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/video/segment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl, projectId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Si è verificato un errore durante la richiesta di segmentazione');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setRequestId(data.requestId);
      setStatus('processing');
      setProgress(0);
      setMessage('Inizializzazione analisi AI...');
    },
    onError: (error: any) => {
      setStatus('failed');
      setError(error.message || 'Si è verificato un errore durante la richiesta di segmentazione');
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.message || 'Si è verificato un errore durante la richiesta di segmentazione',
      });
    },
  });
  
  // Effetto per ascoltare gli aggiornamenti via WebSocket
  React.useEffect(() => {
    if (!socket || !connected || !requestId) return;
    
    // Invia autenticazione al WebSocket server
    socket.send(JSON.stringify({
      type: 'auth',
      payload: { userId: '1' } // Utilizziamo un ID utente di default per questo esempio
    }));
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Messaggio WebSocket ricevuto:', data);
        
        if (data.type === 'auth_success') {
          console.log('Autenticazione WebSocket avvenuta con successo');
        }
        
        if (data.type === 'segmentation_update' && data.payload.requestId === requestId) {
          const { status, progress, message, error, data: resultData } = data.payload;
          
          setStatus(status);
          
          if (progress !== undefined) {
            setProgress(progress);
          }
          
          if (message) {
            setMessage(message);
          }
          
          if (error) {
            setError(error);
            toast({
              variant: 'destructive',
              title: 'Errore segmentazione',
              description: error,
            });
          }
          
          if (status === 'completed' && resultData) {
            toast({
              title: 'Segmentazione completata',
              description: `${resultData.segments} segmenti e ${resultData.subtitles} sottotitoli generati`,
            });
            
            // Chiudi il dialog dopo il completamento
            setTimeout(() => {
              setIsOpen(false);
              // Notifica il completamento
              if (onComplete) {
                onComplete(resultData.segments, resultData.subtitles);
              }
            }, 2000);
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
  }, [socket, connected, requestId, toast, onComplete]);
  
  // Avvia la segmentazione
  const startSegmentation = () => {
    setIsOpen(true);
    setStatus('idle');
    setProgress(0);
    setMessage('');
    setError(null);
    setRequestId(null);
    
    segmentMutation.mutate();
  };
  
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            size="sm"
            className="gap-1"
            disabled={disabled}
          >
            <Scissors className="h-4 w-4 mr-1" />
            Segmentazione AI
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Segmentazione AI</h4>
              <p className="text-sm text-muted-foreground">
                Questa funzione analizza automaticamente il video, lo suddivide in segmenti logici in base al contenuto e genera sottotitoli per ciascun segmento.
              </p>
            </div>
            <div className="pt-2">
              <Button onClick={startSegmentation} className="w-full">
                <Wand2 className="h-4 w-4 mr-2" />
                Avvia segmentazione
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Segmentazione AI del video</DialogTitle>
            <DialogDescription>
              L'AI sta analizzando il video, individuando i segmenti in base al contenuto e generando sottotitoli.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              {status === 'processing' && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              {status === 'completed' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {status === 'failed' && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {status === 'idle' && 'In attesa di inizio...'}
                  {status === 'processing' && message}
                  {status === 'completed' && 'Segmentazione completata con successo!'}
                  {status === 'failed' && 'Si è verificato un errore durante la segmentazione'}
                </p>
                
                {status === 'failed' && error && (
                  <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
              </div>
            </div>
            
            {(status === 'processing' || status === 'completed') && (
              <Progress value={progress} className="h-2" />
            )}
            
            <p className="text-xs text-muted-foreground">
              {progress > 0 && progress < 100 && `${Math.round(progress)}% completato`}
              {progress === 100 && 'Analisi completata, elaborazione risultati...'}
            </p>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={status === 'processing'}
            >
              {status === 'completed' || status === 'failed' ? 'Chiudi' : 'Annulla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}