import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Video, Folder } from "lucide-react";

export default function ProjectsSimple() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Caricamento manuale dei progetti
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/projects", { credentials: "include" });
        
        if (!response.ok) {
          throw new Error(`Errore nel caricamento dei progetti: ${response.status}`);
        }
        
        const data = await response.json();
        setProjects(data || []);
        setError(null);
      } catch (err: any) {
        // Gestiamo gli errori in modo silenzioso senza log
        setError(err.message || "Errore sconosciuto");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="text-center py-16 bg-card border border-border/50 rounded-lg">
          <div className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40">👋</div>
          <h2 className="text-xl font-medium mb-2">Accedi per vedere i tuoi progetti</h2>
          <p className="text-muted-foreground mb-6">Per visualizzare i tuoi progetti, accedi alla piattaforma</p>
          <Button 
            className="bg-gradient-primary hover:opacity-90 shadow-sm"
            onClick={() => window.location.href = "/api/login"}
          >
            Accedi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">I miei Progetti</h1>
          <p className="text-muted-foreground">Gestisci e modifica i tuoi progetti video</p>
        </div>
        
        <Button 
          onClick={() => navigate("/create")}
          className="bg-gradient-primary hover:opacity-90 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Progetto
        </Button>
      </div>
      
      {/* Projects grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border-border/40 shadow-sm">
              <Skeleton className="h-44 w-full" />
              <CardContent className="pt-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-card border border-border/50 rounded-lg">
          <h2 className="text-xl font-medium mb-2 text-destructive">Errore</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Riprova
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border/50 rounded-lg">
          <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h2 className="text-xl font-medium mb-2">Nessun progetto trovato</h2>
          <p className="text-muted-foreground mb-6">Inizia creando il tuo primo progetto</p>
          <Button 
            className="bg-gradient-primary hover:opacity-90 shadow-sm"
            onClick={() => navigate("/create")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Crea Nuovo Progetto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Card key={project.id} className="overflow-hidden border-border/40 shadow-sm group card-interactive">
              <div className="h-44 bg-muted flex items-center justify-center relative">
                {project.thumbnail ? (
                  <img 
                    src={project.thumbnail} 
                    alt={project.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted-foreground/5 to-muted-foreground/10">
                    <Video className="h-12 w-12 text-muted-foreground/40 mb-2" />
                    <span className="text-xs text-muted-foreground">Nessuna anteprima</span>
                  </div>
                )}
              </div>
              
              <CardContent className="pt-5">
                <h3 className="text-lg font-semibold mb-1.5 truncate group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {project.resolution || '1920x1080'} • {project.frameRate || 30}fps
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 pb-5">
                <Button 
                  variant="outline" 
                  asChild 
                  className="w-full border-primary/30 hover:bg-primary/5 group-hover:border-primary/50"
                >
                  <Link href={`/editor/${project.id}`}>
                    <Edit className="mr-2 h-4 w-4" /> Apri nell'Editor
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}