import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  X, 
  PlusIcon, 
  ChevronRight, 
  Video, 
  Layout, 
  Settings, 
  FileIcon,
  CheckCircle2,
  Type,
  Music,
  Image,
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InsertProject, InsertTimelineItem } from '@shared/schema';
import { cn } from '@/lib/utils';

interface ProjectCreationWizardProps {
  userId: string | number;
  onClose?: () => void;
  onSuccess?: (project: any) => void;
}

export default function ProjectCreationWizard({ userId, onClose, onSuccess }: ProjectCreationWizardProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // State for the multi-step form
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState('blank'); // blank, template, import
  
  // Project details
  const [title, setTitle] = useState('Nuovo Progetto');
  const [description, setDescription] = useState('');
  
  // Project settings
  const [resolution, setResolution] = useState('1920x1080');
  const [frameRate, setFrameRate] = useState(30);
  
  // Validation state
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
  }>({});
  
  // Funzione per aggiungere elementi di template alla timeline
  const addTemplateItemsToProject = async (projectId: number) => {
    try {
      // Elementi predefiniti per il template
      const templateElements: InsertTimelineItem[] = [
        // Testo di introduzione
        {
          projectId,
          assetId: null,
          type: 'text',
          track: 2, // Track per il testo
          startTime: 0,
          endTime: 5000, // 5 secondi
          properties: {
            text: 'Titolo Principale',
            fontSize: '44px',
            fontColor: '#FFFFFF',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            alignment: 'center',
            position: 'center',
            animation: 'fade-in',
          }
        },
        // Seconda schermata di testo
        {
          projectId,
          assetId: null,
          type: 'text',
          track: 2,
          startTime: 6000, // Inizia dopo 6 secondi
          endTime: 12000, // Dura 6 secondi
          properties: {
            text: 'Sottotitolo Introduttivo',
            fontSize: '32px',
            fontColor: '#FFFFFF',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignment: 'center',
            position: 'center',
            animation: 'slide-up',
          }
        }
      ];
      
      // Aggiungi gli elementi alla timeline
      for (const element of templateElements) {
        await apiRequest('POST', '/api/timeline-items', element);
      }
      
    } catch (error) {
      console.error('Errore durante l\'aggiunta degli elementi template:', error);
      toast({
        title: 'Attenzione',
        description: 'Progetto creato, ma non è stato possibile aggiungere tutti gli elementi del template.',
        variant: 'destructive',
      });
    }
  };

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      return apiRequest('POST', '/api/projects', projectData);
    },
    onSuccess: async (response) => {
      const project = await response.json();
      toast({
        title: 'Progetto creato',
        description: 'Il tuo nuovo progetto è stato creato con successo.',
      });
      
      if (onSuccess) {
        onSuccess(project);
      } else {
        navigate(`/editor/${project.id}`);
      }
      
      if (onClose) {
        onClose();
      }
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
    // Validazione finale prima di creare il progetto
    if (!validateStep(step)) {
      toast({
        title: 'Errore di validazione',
        description: 'Ci sono errori nei dati del progetto. Correggi gli errori prima di procedere.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!title.trim()) {
      setErrors({...errors, title: 'Il titolo è obbligatorio'});
      toast({
        title: 'Errore',
        description: 'Inserisci un titolo per il progetto.',
        variant: 'destructive',
      });
      return;
    }
    
    // Creazione di un progetto con i dati base
    const projectData = {
      userId: typeof userId === 'number' ? userId.toString() : userId,
      title: title.trim(),
      description: description.trim(),
      resolution,
      frameRate,
      duration: 0
    };
    
    // Debug: visualizziamo i dati del progetto prima di inviarli
    console.log('Project data being sent:', projectData);
    
    // Se è un template, aggiungiamo dati specifici per il template
    if (projectType === 'template') {
      toast({
        title: 'Template selezionato',
        description: 'Il tuo progetto sarà creato con un template predefinito.'
      });
      
      // Prima creiamo il progetto (senza templateType)
      createProjectMutation.mutate(projectData, {
        onSuccess: async (response) => {
          try {
            const project = await response.json();
            
            // Dopo che il progetto è creato, aggiungiamo degli elementi preimpostati alla timeline
            // per simulare un template
            await addTemplateItemsToProject(project.id);
          } catch (error) {
            console.error("Errore durante l'aggiunta di elementi template:", error);
          }
        }
      });
    } else {
      // Se è un progetto vuoto, basta creare il progetto senza elementi aggiuntivi
      createProjectMutation.mutate(projectData);
    }
  };
  
  // Funzione di validazione
  const validateStep = (currentStep: number): boolean => {
    const currentErrors: {
      title?: string;
      description?: string;
    } = {};
    
    // Validazione specifica per ogni step
    switch (currentStep) {
      case 1:
        // Step 1: Tipo di progetto (non necessita validazione)
        break;
      case 2:
        // Step 2: Informazioni di base
        if (!title.trim()) {
          currentErrors.title = 'Il titolo è obbligatorio';
        } else if (title.trim().length < 3) {
          currentErrors.title = 'Il titolo deve contenere almeno 3 caratteri';
        } else if (title.trim().length > 50) {
          currentErrors.title = 'Il titolo non può superare i 50 caratteri';
        }
        
        if (description.trim().length > 500) {
          currentErrors.description = 'La descrizione non può superare i 500 caratteri';
        }
        break;
      case 3:
        // Step 3: Impostazioni (non necessita validazione)
        break;
      case 4:
        // Step 4: Riepilogo (non necessita validazione)
        break;
    }
    
    // Aggiorna gli errori
    setErrors(currentErrors);
    
    // Ritorna true se non ci sono errori
    return Object.keys(currentErrors).length === 0;
  };
  
  // Navigation functions
  const goToNextStep = () => {
    // Valida lo step corrente prima di procedere
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      toast({
        title: 'Errore di validazione',
        description: 'Correggi gli errori prima di procedere.',
        variant: 'destructive'
      });
    }
  };
  
  const goToPreviousStep = () => setStep(step - 1);
  
  // Define steps
  const steps = [
    { id: 1, title: 'Tipo di Progetto', icon: <FileIcon className="h-5 w-5" /> },
    { id: 2, title: 'Informazioni di Base', icon: <Layout className="h-5 w-5" /> },
    { id: 3, title: 'Impostazioni', icon: <Settings className="h-5 w-5" /> },
    { id: 4, title: 'Riepilogo', icon: <CheckCircle2 className="h-5 w-5" /> }
  ];
  
  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden max-w-4xl w-full mx-auto">
      {/* Wizard Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Crea Nuovo Progetto</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Steps indicator */}
        <div className="flex justify-between mt-6">
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center w-1/4">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center text-white mb-2",
                step >= s.id ? "bg-indigo-600" : "bg-gray-300"
              )}>
                {s.icon}
              </div>
              <div className={cn(
                "text-xs font-medium text-center",
                step >= s.id ? "text-indigo-600" : "text-gray-500"
              )}>
                {s.title}
              </div>
              {s.id < steps.length && (
                <div className={cn(
                  "h-0.5 w-full mt-4",
                  step > s.id ? "bg-indigo-600" : "bg-gray-300"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Wizard Content */}
      <div className="p-6">
        {/* Step 1: Project Type */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Scegli il tipo di progetto</h3>
            <p className="text-sm text-gray-500">Seleziona come iniziare il tuo nuovo progetto video.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card 
                className={cn(
                  "p-4 cursor-pointer border-2 hover:border-indigo-500 hover:shadow-md transition-all",
                  projectType === 'blank' ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
                )}
                onClick={() => setProjectType('blank')}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                    <PlusIcon className="h-6 w-6" />
                  </div>
                  <h4 className="font-medium text-gray-900">Progetto Vuoto</h4>
                  <p className="text-xs text-gray-500 mt-2">Inizia da zero con una timeline vuota</p>
                </div>
              </Card>
              
              <Card 
                className={cn(
                  "p-4 cursor-pointer border-2 hover:border-indigo-500 hover:shadow-md transition-all",
                  projectType === 'template' ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
                )}
                onClick={() => setProjectType('template')}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                    <Layout className="h-6 w-6" />
                  </div>
                  <h4 className="font-medium text-gray-900">Da Template</h4>
                  <p className="text-xs text-gray-500 mt-2">Usa un modello predefinito come base</p>
                </div>
              </Card>
              
              <Card 
                className={cn(
                  "p-4 cursor-pointer border-2 hover:border-indigo-500 hover:shadow-md transition-all",
                  projectType === 'import' ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
                )}
                onClick={() => setProjectType('import')}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                    <Video className="h-6 w-6" />
                  </div>
                  <h4 className="font-medium text-gray-900">Importa Video</h4>
                  <p className="text-xs text-gray-500 mt-2">Inizia importando un video esistente</p>
                </div>
              </Card>
            </div>
          </div>
        )}
        
        {/* Step 2: Basic Information */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Informazioni di Base</h3>
            <p className="text-sm text-gray-500">Inserisci i dettagli essenziali del tuo progetto.</p>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Titolo del Progetto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  className={cn(
                    "w-full bg-white rounded-md", 
                    errors.title ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300"
                  )}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    // Reset error on change
                    if (errors.title) {
                      setErrors({...errors, title: undefined});
                    }
                  }}
                  onBlur={() => validateStep(2)}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.title}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione (opzionale)
                </Label>
                <Textarea
                  id="description"
                  className={cn(
                    "w-full bg-white rounded-md", 
                    errors.description ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300"
                  )}
                  placeholder="Descrivi il tuo progetto..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    // Reset error on change
                    if (errors.description) {
                      setErrors({...errors, description: undefined});
                    }
                  }}
                  onBlur={() => validateStep(2)}
                  rows={4}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {description.length}/500 caratteri
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3: Project Settings */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Impostazioni del Progetto</h3>
            <p className="text-sm text-gray-500">Configura le specifiche tecniche del tuo video.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <Label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-1">
                  Risoluzione
                </Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger
                    id="resolution"
                    className="w-full bg-white border-gray-300 rounded-md"
                  >
                    <SelectValue placeholder="Scegli la risoluzione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1920x1080">1920 x 1080 (Full HD)</SelectItem>
                    <SelectItem value="1280x720">1280 x 720 (HD)</SelectItem>
                    <SelectItem value="3840x2160">3840 x 2160 (4K)</SelectItem>
                    <SelectItem value="1080x1920">1080 x 1920 (Verticale Full HD)</SelectItem>
                    <SelectItem value="1080x1080">1080 x 1080 (Quadrato)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-gray-500">La dimensione in pixel del tuo video.</p>
              </div>
              
              <div>
                <Label htmlFor="frameRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Frame Rate
                </Label>
                <Select 
                  value={frameRate.toString()} 
                  onValueChange={(value) => setFrameRate(parseInt(value))}
                >
                  <SelectTrigger
                    id="frameRate"
                    className="w-full bg-white border-gray-300 rounded-md"
                  >
                    <SelectValue placeholder="Scegli il frame rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 fps (Cinema)</SelectItem>
                    <SelectItem value="30">30 fps (Standard)</SelectItem>
                    <SelectItem value="60">60 fps (Fluido)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-gray-500">Il numero di fotogrammi al secondo.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 4: Summary */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Riepilogo del Progetto</h3>
            <p className="text-sm text-gray-500">Verifica i dettagli del tuo progetto prima di crearlo.</p>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
              <dl className="divide-y divide-gray-200">
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500">Tipo di Progetto</dt>
                  <dd className="text-sm text-gray-900 col-span-2 capitalize">
                    {projectType === 'blank' ? 'Progetto Vuoto' : 
                     projectType === 'template' ? 'Da Template' : 'Importa Video'}
                  </dd>
                </div>
                
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500">Titolo</dt>
                  <dd className="text-sm text-gray-900 col-span-2">{title}</dd>
                </div>
                
                {description && (
                  <div className="py-3 grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Descrizione</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{description}</dd>
                  </div>
                )}
                
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500">Risoluzione</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {resolution === '1920x1080' ? '1920 x 1080 (Full HD)' :
                     resolution === '1280x720' ? '1280 x 720 (HD)' :
                     resolution === '3840x2160' ? '3840 x 2160 (4K)' :
                     resolution === '1080x1920' ? '1080 x 1920 (Verticale Full HD)' :
                     '1080 x 1080 (Quadrato)'}
                  </dd>
                </div>
                
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500">Frame Rate</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {frameRate === 24 ? '24 fps (Cinema)' :
                     frameRate === 30 ? '30 fps (Standard)' :
                     '60 fps (Fluido)'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
      
      {/* Wizard Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
        {step > 1 ? (
          <Button 
            variant="outline" 
            onClick={goToPreviousStep}
            className="text-sm"
          >
            Indietro
          </Button>
        ) : (
          <div></div>
        )}
        
        {step < steps.length ? (
          <Button 
            onClick={goToNextStep}
            className="bg-indigo-600 hover:bg-indigo-700 text-sm"
          >
            Continua
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleCreateProject}
            className="bg-indigo-600 hover:bg-indigo-700 text-sm"
            disabled={createProjectMutation.isPending}
          >
            {createProjectMutation.isPending ? 'Creazione in corso...' : 'Crea Progetto'}
          </Button>
        )}
      </div>
    </div>
  );
}