import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import VideoTemplateLibrary, { VideoTemplate } from '@/components/VideoTemplateLibrary';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookTemplate } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

export default function TemplatesPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // Query per ottenere progetti esistenti (per il passaggio 2)
  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Mutation per creare un nuovo progetto basato su template
  const createProjectMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });
      
      if (!response.ok) {
        throw new Error('Errore durante la creazione del progetto');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: 'Progetto creato!',
        description: 'Il nuovo progetto è stato creato con successo dal template.',
      });
      navigate(`/editor/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante la creazione del progetto.',
        variant: 'destructive',
      });
    },
  });

  const handleSelectTemplate = (template: VideoTemplate) => {
    createProjectMutation.mutate({
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      description: template.description,
      templateId: template.id,
      duration: template.duration * 1000, // Converte secondi in millisecondi
    });
    setIsCreating(true);
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="flex items-center mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Indietro
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <BookTemplate className="mr-2 h-8 w-8" />
            Template Video
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Scegli uno dei template predefiniti per iniziare rapidamente il tuo progetto video.
            Ogni template include struttura, suggerimenti e elementi di base personalizzabili.
          </p>
        </div>
      </div>

      {createProjectMutation.isPending ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <h3 className="text-lg font-medium mb-1">Creazione in corso...</h3>
          <p className="text-sm text-muted-foreground">
            Stiamo preparando il tuo nuovo progetto basato sul template selezionato.
          </p>
        </div>
      ) : (
        <VideoTemplateLibrary onSelectTemplate={handleSelectTemplate} />
      )}
    </div>
  );
}