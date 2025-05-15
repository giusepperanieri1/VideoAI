import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  VideoIcon, 
  MicIcon, 
  ShareIcon, 
  Sparkles,
  FolderOpen as FolderOpenIcon,
  Wand2,
  HelpCircle,
  Info
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import TutorialTooltip from "@/components/TutorialTooltip";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Controlla se è il primo accesso dell'utente
  useEffect(() => {
    if (isAuthenticated) {
      const tutorialCompleted = localStorage.getItem('tutorialCompleted');
      if (!tutorialCompleted) {
        // Mostra il tutorial dopo un breve ritardo, per dare tempo alla pagina di caricarsi
        const timer = setTimeout(() => {
          setShowTutorial(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated]);

  // Passi del tutorial per i nuovi utenti
  const tutorialSteps = [
    {
      id: 1,
      title: 'Benvenuto in VideoGenAI!',
      content: 'Questa applicazione ti permette di creare, modificare e distribuire contenuti video professionali utilizzando l\'intelligenza artificiale.',
      position: 'center' as const,
      width: 350
    },
    {
      id: 2,
      title: 'Crea un nuovo progetto',
      content: 'Clicca su "Nuovo Progetto" per iniziare a creare il tuo primo video. Puoi scegliere di partire da zero o utilizzare un template.',
      position: 'bottom' as const,
      targetElement: '[data-tutorial="new-project"]',
      width: 300
    },
    {
      id: 3,
      title: 'Esplora i tuoi progetti',
      content: 'Qui puoi vedere tutti i progetti che hai creato e continuare a lavorarci in qualsiasi momento.',
      position: 'bottom' as const,
      targetElement: '[data-tutorial="my-projects"]',
      width: 300
    },
    {
      id: 4,
      title: 'Strumenti disponibili',
      content: 'VideoGenAI offre strumenti potenti come generazione di video da testo, voice-over IA e pubblicazione diretta sui social media.',
      position: 'top' as const,
      targetElement: '[data-tutorial="features"]',
      width: 350
    },
    {
      id: 5,
      title: 'Hai bisogno di aiuto?',
      content: 'Puoi rivedere questo tutorial in qualsiasi momento cliccando sull\'icona di aiuto in alto a destra.',
      position: 'left' as const,
      targetElement: '[data-tutorial="help-button"]',
      width: 280
    }
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Tutorial Tooltip */}
      <TutorialTooltip
        steps={tutorialSteps}
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
      
      {/* Help Button in Top Right */}
      <div className="absolute top-4 right-4 z-10" data-tutorial="help-button">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10 bg-white/80 backdrop-blur shadow-sm"
                onClick={() => setShowTutorial(true)}
              >
                <HelpCircle className="h-5 w-5 text-indigo-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mostra la guida</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Hero Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* Minimalist background element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-30"></div>
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="flex flex-col items-center text-center">
            {/* Simple logo */}
            <div className="bg-gradient-primary rounded-lg p-3 mb-8 shadow-sm">
              <VideoIcon className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              VideoGen<span className="text-gradient-primary">AI</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Crea, modifica e distribuisci contenuti video professionali con strumenti AI in un unica piattaforma semplice da usare.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/create">
                <Button 
                  size="lg" 
                  className="bg-gradient-primary hover:opacity-90 font-medium px-8 py-4 shadow-sm"
                  data-tutorial="new-project"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Nuovo Progetto
                </Button>
              </Link>
              <Link href="/projects">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="font-medium px-8 py-4 border-primary/30 hover:bg-primary/5"
                  data-tutorial="my-projects"
                >
                  <FolderOpenIcon className="mr-2 h-4 w-4" />
                  I Miei Progetti
                </Button>
              </Link>
            </div>
            
            {/* Minimal feature indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-2xl mx-auto" data-tutorial="features">
              <div className="flex flex-col items-center">
                <Wand2 className="h-8 w-8 text-primary mb-2" />
                <span className="font-medium">Text-to-Video</span>
              </div>
              <div className="flex flex-col items-center">
                <MicIcon className="h-8 w-8 text-primary mb-2" />
                <span className="font-medium">Voice-over AI</span>
              </div>
              <div className="flex flex-col items-center">
                <ShareIcon className="h-8 w-8 text-primary mb-2" />
                <span className="font-medium">Pubblicazione</span>
              </div>
            </div>
            
            {/* User welcome - only when authenticated */}
            {isAuthenticated && (
              <div className="mt-12 w-full max-w-md bg-card rounded-xl border border-border/10 p-5 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                    <AvatarImage src={user?.profileImageUrl || ""} />
                    <AvatarFallback className="bg-primary/5 text-primary">
                      {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-lg">Bentornato{user?.firstName ? `, ${user.firstName}` : ""}!</h3>
                    <p className="text-sm text-muted-foreground">Continua da dove hai lasciato</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" className="text-sm justify-start px-3 shadow-sm">
                    <FolderOpenIcon className="h-4 w-4 mr-2" />
                    Progetti Recenti
                  </Button>
                  <Button variant="outline" size="sm" className="text-sm justify-start px-3 shadow-sm">
                    <VideoIcon className="h-4 w-4 mr-2" />
                    Ultimo Progetto
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            <div className="flex items-center">
              <div className="bg-gradient-primary rounded-md p-1.5 mr-2">
                <VideoIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">
                VideoGen<span className="text-primary">AI</span>
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} VideoGenAI. Tutti i diritti riservati.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
