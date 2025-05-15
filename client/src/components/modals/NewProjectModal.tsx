import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { X, PlusIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InsertProject } from '@shared/schema';

interface NewProjectModalProps {
  userId: number;
  onClose: () => void;
}

export default function NewProjectModal({ userId, onClose }: NewProjectModalProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [title, setTitle] = useState('Nuovo Progetto');
  const [description, setDescription] = useState('');
  const [resolution, setResolution] = useState('1920x1080');
  const [frameRate, setFrameRate] = useState(30);
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: InsertProject) => {
      return apiRequest('POST', '/api/projects', projectData);
    },
    onSuccess: async (response) => {
      const project = await response.json();
      toast({
        title: 'Progetto creato',
        description: 'Il tuo nuovo progetto è stato creato con successo.',
      });
      navigate(`/editor/${project.id}`);
      onClose();
    },
    onError: () => {
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante la creazione del progetto.',
        variant: 'destructive',
      });
    }
  });
  
  const handleCreateProject = () => {
    if (!title.trim()) {
      toast({
        title: 'Errore',
        description: 'Inserisci un titolo per il progetto.',
        variant: 'destructive',
      });
      return;
    }
    
    createProjectMutation.mutate({
      userId,
      title,
      description,
      resolution,
      frameRate,
      duration: 0
    });
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-dark-800 border-dark-600 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-heading font-semibold">
            <PlusIcon className="text-primary mr-2 h-5 w-5" />
            Crea Nuovo Progetto
          </DialogTitle>
          <Button 
            className="absolute right-4 top-4" 
            variant="ghost" 
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="block text-sm font-medium mb-2">
              Titolo
            </Label>
            <Input
              id="title"
              className="w-full bg-dark-700 text-white border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="block text-sm font-medium mb-2">
              Descrizione (opzionale)
            </Label>
            <Textarea
              id="description"
              className="w-full bg-dark-700 text-white border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary text-sm h-20"
              placeholder="Descrivi il tuo progetto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="resolution" className="block text-sm font-medium mb-2">
                Risoluzione
              </Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger
                  id="resolution"
                  className="w-full bg-dark-700 text-white border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                >
                  <SelectValue placeholder="Scegli la risoluzione" />
                </SelectTrigger>
                <SelectContent className="bg-dark-700 border-dark-600 text-foreground">
                  <SelectItem value="1920x1080">1920 x 1080 (Full HD)</SelectItem>
                  <SelectItem value="1280x720">1280 x 720 (HD)</SelectItem>
                  <SelectItem value="3840x2160">3840 x 2160 (4K)</SelectItem>
                  <SelectItem value="1080x1920">1080 x 1920 (Verticale Full HD)</SelectItem>
                  <SelectItem value="1080x1080">1080 x 1080 (Quadrato)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="frameRate" className="block text-sm font-medium mb-2">
                Frame Rate
              </Label>
              <Select 
                value={frameRate.toString()} 
                onValueChange={(value) => setFrameRate(parseInt(value))}
              >
                <SelectTrigger
                  id="frameRate"
                  className="w-full bg-dark-700 text-white border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                >
                  <SelectValue placeholder="Scegli il frame rate" />
                </SelectTrigger>
                <SelectContent className="bg-dark-700 border-dark-600 text-foreground">
                  <SelectItem value="24">24 fps (Cinema)</SelectItem>
                  <SelectItem value="30">30 fps (Standard)</SelectItem>
                  <SelectItem value="60">60 fps (Fluido)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            className="bg-dark-600 hover:bg-dark-500 text-white text-sm font-medium"
            onClick={onClose}
          >
            Annulla
          </Button>
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary/90 text-white text-sm font-medium"
            onClick={handleCreateProject}
            disabled={createProjectMutation.isPending}
          >
            {createProjectMutation.isPending ? 'Creazione...' : 'Crea Progetto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
