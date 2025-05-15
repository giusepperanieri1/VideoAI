import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Asset } from "@shared/schema";
import AISegmentationButton from "../AISegmentationButton";

interface SegmentVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAsset?: Asset;
  onSegmentsCreated?: (assetIds: number[]) => void;
}

export default function SegmentVideoModal({
  isOpen,
  onClose,
  selectedAsset,
  onSegmentsCreated,
}: SegmentVideoModalProps) {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  
  const handleSegmentationComplete = (segments: any[], subtitles: any[]) => {
    setProcessing(false);
    
    if (onSegmentsCreated) {
      // Assumiamo che segments e subtitles contengano gli ID degli asset creati
      const assetIds = [...segments.map(s => s.id), ...subtitles.map(s => s.id)];
      onSegmentsCreated(assetIds);
    }
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Segmentazione Video AI</DialogTitle>
          <DialogDescription>
            Usa questa funzione per analizzare automaticamente il video e suddividerlo in segmenti logici con sottotitoli.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {!selectedAsset ? (
            <div className="bg-gray-50 rounded-md p-4 text-center">
              <p className="text-sm text-gray-500">
                Nessun video selezionato. Seleziona un video dalla libreria per utilizzare questa funzione.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                  {selectedAsset.thumbnail ? (
                    <img
                      src={selectedAsset.thumbnail}
                      alt={selectedAsset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {selectedAsset.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {selectedAsset.type === 'video' ? 'Video' : 'File'} • {selectedAsset.duration ? `${selectedAsset.duration.toFixed(0)}s` : 'Durata sconosciuta'}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    Cosa fa la segmentazione AI?
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc pl-5">
                    <li>Analizza il contenuto del video frame per frame</li>
                    <li>Identifica cambi di scena e argomenti in base al contenuto</li>
                    <li>Divide il video in segmenti logici</li>
                    <li>Genera sottotitoli automatici per ogni segmento</li>
                    <li>Aggiunge tutti i segmenti come clip separate nella libreria</li>
                  </ul>
                </div>
                
                <div className="flex justify-center">
                  <AISegmentationButton
                    videoUrl={selectedAsset.url}
                    projectId={1} // Questo è temporaneo, dovremmo ottenere l'ID effettivo del progetto
                    onComplete={handleSegmentationComplete}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}