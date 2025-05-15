import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Grid3X3, Clock, Star, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  duration: number;
  tags: string[];
  popularity: number;
}

interface VideoTemplateLibraryProps {
  onSelectTemplate: (template: VideoTemplate) => void;
}

const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: "template-1",
    name: "Introduzione prodotto",
    description: "Template per presentare un nuovo prodotto con presentazione, caratteristiche e call-to-action.",
    thumbnailUrl: "https://via.placeholder.com/300x200?text=Prodotto",
    category: "Marketing",
    duration: 60,
    tags: ["prodotto", "presentazione", "commerciale"],
    popularity: 94,
  },
  {
    id: "template-2",
    name: "Tutorial passo-passo",
    description: "Spiega come utilizzare una funzionalità o completare un processo specifico.",
    thumbnailUrl: "https://via.placeholder.com/300x200?text=Tutorial",
    category: "Educativo",
    duration: 180,
    tags: ["tutorial", "istruzioni", "passo-passo"],
    popularity: 88,
  },
  {
    id: "template-3",
    name: "Testimonianza cliente",
    description: "Presenta la storia di un cliente soddisfatto che racconta la sua esperienza con il prodotto o servizio.",
    thumbnailUrl: "https://via.placeholder.com/300x200?text=Testimonianza",
    category: "Marketing",
    duration: 90,
    tags: ["testimonianza", "cliente", "esperienza"],
    popularity: 76,
  },
  {
    id: "template-4",
    name: "Esplora funzionalità",
    description: "Mostra le funzionalità principali di un prodotto o servizio con esempi pratici.",
    thumbnailUrl: "https://via.placeholder.com/300x200?text=Funzionalità",
    category: "Prodotto",
    duration: 120,
    tags: ["funzionalità", "prodotto", "demo"],
    popularity: 82,
  },
  {
    id: "template-5",
    name: "Annuncio sociale breve",
    description: "Template ottimizzato per social media con introduzione rapida e messaggio d'impatto.",
    thumbnailUrl: "https://via.placeholder.com/300x200?text=Social",
    category: "Social Media",
    duration: 30,
    tags: ["social", "breve", "impatto"],
    popularity: 91,
  },
  {
    id: "template-6",
    name: "Intervista esperto",
    description: "Formato intervista per presentare un esperto che condivide conoscenze sul settore.",
    thumbnailUrl: "https://via.placeholder.com/300x200?text=Intervista",
    category: "Educativo",
    duration: 300,
    tags: ["intervista", "esperto", "conoscenza"],
    popularity: 65,
  },
  {
    id: "template-7",
    name: "Confronto prima/dopo",
    description: "Mostra risultati o miglioramenti confrontando situazioni prima e dopo l'uso del prodotto.",
    thumbnailUrl: "https://via.placeholder.com/300x200?text=Prima/Dopo",
    category: "Marketing",
    duration: 45,
    tags: ["confronto", "risultati", "prima-dopo"],
    popularity: 79,
  },
  {
    id: "template-8",
    name: "Lancio evento",
    description: "Annuncia un evento importante con tutte le informazioni necessarie per partecipare.",
    thumbnailUrl: "https://via.placeholder.com/300x200?text=Evento",
    category: "Eventi",
    duration: 60,
    tags: ["evento", "lancio", "annuncio"],
    popularity: 73,
  },
  {
    id: "template-9",
    name: "Notizia del settore",
    description: "Presenta le ultime novità del settore in formato notiziario professionale.",
    thumbnailUrl: "https://via.placeholder.com/300x200?text=News",
    category: "Notizie",
    duration: 120,
    tags: ["notizie", "settore", "aggiornamento"],
    popularity: 63,
  },
  {
    id: "template-10",
    name: "Presentazione dati",
    description: "Visualizza statistiche e dati in modo chiaro e coinvolgente con grafici animati.",
    thumbnailUrl: "https://via.placeholder.com/300x200?text=Dati",
    category: "Business",
    duration: 90,
    tags: ["dati", "statistiche", "grafici"],
    popularity: 87,
  }
];

const CATEGORIES = [
  "Tutti", 
  "Marketing", 
  "Educativo", 
  "Social Media", 
  "Prodotto", 
  "Eventi", 
  "Notizie", 
  "Business"
];

export default function VideoTemplateLibrary({ onSelectTemplate }: VideoTemplateLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [sortBy, setSortBy] = useState<'popularity' | 'duration'>('popularity');
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);

  // Filtraggio e ordinamento dei template
  const filteredTemplates = VIDEO_TEMPLATES.filter(template => {
    // Filtra per categoria
    const categoryMatch = selectedCategory === 'Tutti' || template.category === selectedCategory;
    
    // Filtra per termine di ricerca
    const searchMatch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return categoryMatch && searchMatch;
  }).sort((a, b) => {
    // Ordinamento
    if (sortBy === 'popularity') {
      return b.popularity - a.popularity;
    } else {
      return a.duration - b.duration;
    }
  });

  const handleTemplateSelect = (template: VideoTemplate) => {
    setSelectedTemplate(template);
  };

  const handleConfirmSelection = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  return (
    <div className="w-full">
      {/* Barra di ricerca e filtri */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cerca template..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant={sortBy === 'popularity' ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy('popularity')}
          >
            <Star className="h-4 w-4 mr-1" />
            Popolari
          </Button>
          <Button
            variant={sortBy === 'duration' ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy('duration')}
          >
            <Clock className="h-4 w-4 mr-1" />
            Durata
          </Button>
        </div>
        
        {/* Categorie */}
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex gap-2 w-max px-1">
            {CATEGORIES.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {/* Griglia template */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card 
            key={template.id} 
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedTemplate?.id === template.id ? "ring-2 ring-primary" : ""
            )}
            onClick={() => handleTemplateSelect(template)}
          >
            <div 
              className="h-40 bg-muted bg-cover bg-center rounded-t-lg" 
              style={{ backgroundImage: `url(${template.thumbnailUrl})` }}
            >
              {selectedTemplate?.id === template.id && (
                <div className="w-full h-full flex items-center justify-center bg-primary/20">
                  <Check className="h-10 w-10 text-white bg-primary rounded-full p-2" />
                </div>
              )}
            </div>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>{Math.floor(template.duration / 60)}:{(template.duration % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 mr-1 text-amber-500" />
                <span>{template.popularity}%</span>
              </div>
            </CardFooter>
          </Card>
        ))}
        
        {/* Card per creazione template personalizzato */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer transition-all hover:shadow-md h-full flex flex-col items-center justify-center p-6 border-dashed">
              <Plus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">Template personalizzato</h3>
              <p className="text-sm text-muted-foreground text-center">
                Crea un nuovo template partendo da zero
              </p>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea template personalizzato</DialogTitle>
              <DialogDescription>
                Questa funzionalità sarà disponibile nella prossima versione.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline">Annulla</Button>
              <Button type="button" disabled>Crea template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Pulsante di conferma selezione */}
      {selectedTemplate && (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleConfirmSelection}>
            Usa questo template
          </Button>
        </div>
      )}
    </div>
  );
}