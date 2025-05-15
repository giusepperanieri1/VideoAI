import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, ArrowLeft, VideoIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-background">
      {/* Subtle background element */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-30"></div>
      
      <div className="text-center max-w-md z-10 animate-fade-in">
        <div className="mb-8 bg-gradient-primary rounded-full p-4 inline-flex shadow-sm">
          <VideoIcon className="h-8 w-8 text-white" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Pagina non trovata
        </h1>
        
        <p className="text-muted-foreground text-lg mb-8">
          La pagina che stai cercando non esiste.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="bg-gradient-primary hover:opacity-90 shadow-sm flex items-center gap-2">
              <Home className="h-4 w-4" />
              Torna alla home
            </Button>
          </Link>
          
          <Link href="/projects">
            <Button variant="outline" className="border-primary/30 hover:bg-primary/5 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              I miei progetti
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
