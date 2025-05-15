import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Clock, Palette, Text, Move } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimelineItem } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Schema per validare i dati dell'overlay di testo
const textOverlaySchema = z.object({
  text: z.string().min(1, 'Il testo è richiesto'),
  fontSize: z.number().min(12).max(72).default(24),
  fontColor: z.string().default('#FFFFFF'),
  backgroundColor: z.string().default('rgba(0, 0, 0, 0.5)'),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  fontWeight: z.enum(['normal', 'bold']).default('normal'),
  fontStyle: z.enum(['normal', 'italic']).default('normal'),
  startTime: z.number().min(0).default(0),
  duration: z.number().min(1).default(5),
  position: z.object({
    x: z.number().min(0).max(100).default(50),
    y: z.number().min(0).max(100).default(50),
  }).default({ x: 50, y: 50 }),
});

type TextOverlayFormValues = z.infer<typeof textOverlaySchema>;

interface TextOverlayModalProps {
  projectId: number;
  onClose: () => void;
  onSuccess: (item: TimelineItem) => void;
  editItem?: TimelineItem; // Optional existing item to edit
}

export default function TextOverlayModal({ projectId, onClose, onSuccess, editItem }: TextOverlayModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('text');
  const [previewBackground, setPreviewBackground] = useState('dark');
  
  // Prepare default values based on existing item if provided
  const defaultValues: TextOverlayFormValues = editItem?.type === 'text' && editItem.properties
    ? {
        text: editItem.properties.text || '',
        fontSize: parseInt(editItem.properties.fontSize?.replace('px', '') || '24'),
        fontColor: editItem.properties.fontColor || '#FFFFFF',
        backgroundColor: editItem.properties.backgroundColor || 'rgba(0, 0, 0, 0.5)',
        alignment: (editItem.properties.alignment as 'left' | 'center' | 'right') || 'center',
        fontWeight: (editItem.properties.fontWeight as 'normal' | 'bold') || 'normal',
        fontStyle: (editItem.properties.fontStyle as 'normal' | 'italic') || 'normal',
        startTime: editItem.startTime / 1000, // Convert ms to seconds for the form
        duration: (editItem.endTime - editItem.startTime) / 1000, // Convert ms to seconds
        position: editItem.properties.position || { x: 50, y: 50 },
      }
    : {
        text: 'Testo di esempio',
        fontSize: 24,
        fontColor: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignment: 'center',
        fontWeight: 'normal',
        fontStyle: 'normal',
        startTime: 0,
        duration: 5,
        position: { x: 50, y: 50 },
      };
  
  // Form setup with schema validation
  const form = useForm<TextOverlayFormValues>({
    resolver: zodResolver(textOverlaySchema),
    defaultValues
  });
  
  // Get values from form for preview
  const watchedValues = form.watch();
  
  // Create or update text overlay
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: TextOverlayFormValues) => {
      // Calculate start and end times in milliseconds
      const startTimeMs = data.startTime * 1000;
      const endTimeMs = startTimeMs + (data.duration * 1000);
      
      // Format properties for the timeline item
      const properties = {
        text: data.text,
        fontSize: `${data.fontSize}px`,
        fontColor: data.fontColor,
        backgroundColor: data.backgroundColor,
        alignment: data.alignment,
        fontWeight: data.fontWeight,
        fontStyle: data.fontStyle,
        position: data.position,
      };
      
      // Create the timeline item object
      const timelineItem: Partial<TimelineItem> = {
        projectId,
        type: 'text',
        track: 1, // Default to track 1 for text overlays
        startTime: startTimeMs,
        endTime: endTimeMs,
        properties,
      };
      
      try {
        if (editItem) {
          // If editing, update the existing item
          return await apiRequest(`/api/timeline-items/${editItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(timelineItem),
          });
        } else {
          // Otherwise create a new item
          return await apiRequest('/api/timeline-items', {
            method: 'POST',
            body: JSON.stringify(timelineItem),
          });
        }
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Si è verificato un errore');
      }
    },
    onSuccess: (data) => {
      toast({
        title: editItem ? "Testo aggiornato" : "Testo aggiunto",
        description: editItem 
          ? "L'elemento di testo è stato aggiornato con successo" 
          : "Il nuovo elemento di testo è stato aggiunto alla timeline",
      });
      onSuccess(data as TimelineItem);
    },
    onError: (error) => {
      console.error('Error saving text overlay:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore durante il salvataggio",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: TextOverlayFormValues) => {
    mutate(data);
  };
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            {editItem ? 'Modifica Testo' : 'Aggiungi Testo'}
          </DialogTitle>
          <DialogDescription>
            {editItem 
              ? 'Modifica le proprietà del testo esistente nella timeline' 
              : 'Crea un nuovo elemento di testo e aggiungilo alla timeline del progetto'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <Text className="h-4 w-4" />
                  <span>Testo</span>
                </TabsTrigger>
                <TabsTrigger value="style" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <span>Stile</span>
                </TabsTrigger>
                <TabsTrigger value="timing" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Tempistica</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="space-y-4">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Testo</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="resize-none h-32"
                          placeholder="Inserisci il testo da mostrare"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="relative mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Anteprima</h3>
                    <div className="flex border border-gray-200 rounded-md overflow-hidden shadow-sm">
                      <Button
                        type="button"
                        variant={previewBackground === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-8 rounded-none font-normal"
                        onClick={() => setPreviewBackground('dark')}
                      >
                        Sfondo scuro
                      </Button>
                      <Button
                        type="button"
                        variant={previewBackground === 'light' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-8 rounded-none font-normal"
                        onClick={() => setPreviewBackground('light')}
                      >
                        Sfondo chiaro
                      </Button>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-6 rounded-md border border-gray-200 flex items-center justify-center h-36 shadow-inner ${
                      previewBackground === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                    }`}
                  >
                    <div
                      className="p-3 max-w-full"
                      style={{
                        fontSize: `${watchedValues.fontSize}px`,
                        fontWeight: watchedValues.fontWeight,
                        fontStyle: watchedValues.fontStyle,
                        color: watchedValues.fontColor,
                        backgroundColor: watchedValues.backgroundColor,
                        textAlign: watchedValues.alignment,
                        borderRadius: '4px',
                      }}
                    >
                      {watchedValues.text || 'Testo di esempio'}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fontColor"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Colore Testo</FormLabel>
                        <div className="flex space-x-2 items-center">
                          <FormControl>
                            <Input 
                              type="color" 
                              {...field} 
                              className="w-12 h-10 p-1"
                            />
                          </FormControl>
                          <Input
                            value={field.value}
                            onChange={field.onChange}
                            className="flex-1 h-10 font-mono text-sm"
                          />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="backgroundColor"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Colore Sfondo</FormLabel>
                        <div className="flex space-x-2 items-center">
                          <FormControl>
                            <Input 
                              type="color" 
                              {...field} 
                              className="w-12 h-10 p-1"
                            />
                          </FormControl>
                          <Input
                            value={field.value}
                            onChange={field.onChange}
                            className="flex-1 h-10 font-mono text-sm"
                          />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="fontSize"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex justify-between">
                        <FormLabel>Dimensione Testo</FormLabel>
                        <span className="text-sm font-medium text-gray-700">{field.value}px</span>
                      </div>
                      <FormControl>
                        <Slider 
                          min={12} 
                          max={72} 
                          step={1} 
                          value={[field.value]} 
                          onValueChange={(value) => field.onChange(value[0])}
                          className="py-2"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="alignment"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Allineamento</FormLabel>
                      <div className="bg-gray-50 p-1 rounded-md border border-gray-200 flex shadow-inner">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={`flex-1 rounded-md h-10 ${field.value === 'left' 
                            ? 'bg-white shadow-sm border border-gray-200' 
                            : 'hover:bg-white/70'}`}
                          onClick={() => field.onChange('left')}
                        >
                          <AlignLeft className="mr-2 h-4 w-4" /> Sinistra
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={`flex-1 rounded-md h-10 ${field.value === 'center' 
                            ? 'bg-white shadow-sm border border-gray-200' 
                            : 'hover:bg-white/70'}`}
                          onClick={() => field.onChange('center')}
                        >
                          <AlignCenter className="mr-2 h-4 w-4" /> Centro
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={`flex-1 rounded-md h-10 ${field.value === 'right' 
                            ? 'bg-white shadow-sm border border-gray-200' 
                            : 'hover:bg-white/70'}`}
                          onClick={() => field.onChange('right')}
                        >
                          <AlignRight className="mr-2 h-4 w-4" /> Destra
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fontWeight"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Stile Testo</FormLabel>
                        <div className="bg-gray-50 p-1 rounded-md border border-gray-200 flex shadow-inner">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`flex-1 rounded-md h-10 ${field.value === 'normal' 
                              ? 'bg-white shadow-sm border border-gray-200' 
                              : 'hover:bg-white/70'}`}
                            onClick={() => field.onChange('normal')}
                          >
                            <Type className="mr-2 h-4 w-4" /> Normale
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`flex-1 rounded-md h-10 ${field.value === 'bold' 
                              ? 'bg-white shadow-sm border border-gray-200' 
                              : 'hover:bg-white/70'}`}
                            onClick={() => field.onChange('bold')}
                          >
                            <Bold className="mr-2 h-4 w-4" /> Grassetto
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fontStyle"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Inclinazione</FormLabel>
                        <div className="bg-gray-50 p-1 rounded-md border border-gray-200 flex shadow-inner">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`flex-1 rounded-md h-10 ${field.value === 'normal' 
                              ? 'bg-white shadow-sm border border-gray-200' 
                              : 'hover:bg-white/70'}`}
                            onClick={() => field.onChange('normal')}
                          >
                            <Type className="mr-2 h-4 w-4" /> Normale
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`flex-1 rounded-md h-10 ${field.value === 'italic' 
                              ? 'bg-white shadow-sm border border-gray-200' 
                              : 'hover:bg-white/70'}`}
                            onClick={() => field.onChange('italic')}
                          >
                            <Italic className="mr-2 h-4 w-4" /> Corsivo
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="timing" className="space-y-5">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex justify-between">
                        <FormLabel>Tempo Iniziale</FormLabel>
                        <span className="text-sm font-medium text-gray-700">{field.value.toFixed(1)} secondi</span>
                      </div>
                      <FormControl>
                        <Slider 
                          min={0} 
                          max={60} 
                          step={0.5} 
                          value={[field.value]} 
                          onValueChange={(value) => field.onChange(value[0])}
                          className="py-2"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex justify-between">
                        <FormLabel>Durata</FormLabel>
                        <span className="text-sm font-medium text-gray-700">{field.value.toFixed(1)} secondi</span>
                      </div>
                      <FormControl>
                        <Slider 
                          min={1} 
                          max={30} 
                          step={0.5} 
                          value={[field.value]} 
                          onValueChange={(value) => field.onChange(value[0])}
                          className="py-2"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex justify-between items-center">
                        <FormLabel className="flex items-center gap-1">
                          <Move className="h-4 w-4" /> Posizione
                        </FormLabel>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          X: {field.value.x}%, Y: {field.value.y}%
                        </span>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-md bg-gray-50 relative h-40 shadow-inner">
                        <div 
                          className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold cursor-move shadow-md transform hover:scale-110 transition-transform"
                          style={{
                            left: `calc(${field.value.x}% - 16px)`,
                            top: `calc(${field.value.y}% - 16px)`,
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            
                            const container = e.currentTarget.parentElement;
                            if (!container) return;
                            
                            const rect = container.getBoundingClientRect();
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const x = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                              const y = Math.max(0, Math.min(100, ((moveEvent.clientY - rect.top) / rect.height) * 100));
                              
                              field.onChange({
                                x: Math.round(x),
                                y: Math.round(y)
                              });
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                          T
                        </div>
                        {/* Guide lines */}
                        <div className="absolute left-1/2 top-0 bottom-0 border-dashed border-l border-gray-400 opacity-50"></div>
                        <div className="absolute top-1/2 left-0 right-0 border-dashed border-t border-gray-400 opacity-50"></div>
                        
                        {/* Corner indicators */}
                        <span className="absolute top-1 left-1 text-xs text-gray-400">TL</span>
                        <span className="absolute top-1 right-1 text-xs text-gray-400">TR</span>
                        <span className="absolute bottom-1 left-1 text-xs text-gray-400">BL</span>
                        <span className="absolute bottom-1 right-1 text-xs text-gray-400">BR</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Trascina l'indicatore "T" per posizionare il testo nel video
                      </p>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="mr-2">
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isPending ? 'Salvataggio...' : editItem ? 'Aggiorna' : 'Aggiungi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}