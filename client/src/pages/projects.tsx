import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Video, 
  Search, 
  Calendar, 
  Clock, 
  Filter, 
  SlidersHorizontal,
  ArrowUpDown,
  Folder,
  PlayCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Project } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { it as itLocale } from "date-fns/locale";

export default function Projects() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  
  // Query projects - eseguita solo quando l'utente è autenticato
  const { 
    data: projects = [], 
    isLoading: projectsLoading,
    error: projectsError,
    refetch 
  } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      try {
        // Aggiungiamo gestione esplicita dell'errore
        const response = await fetch("/api/projects", { credentials: "include" });
        if (!response.ok) {
          if (response.status === 401) {
            console.log("Utente non autenticato durante il caricamento dei progetti");
            return [];
          }
          throw new Error(`Errore nel caricamento dei progetti: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Errore nel caricamento dei progetti:", error);
        return [];
      }
    },
    enabled: !!user, // Esegui la query solo se c'è un utente
    retry: 2,
    retryDelay: 1000,
  });
  
  // Stato di caricamento complessivo
  const isLoading = isAuthLoading || projectsLoading;
  
  // Debugging
  console.log("Projects query:", { 
    projects, 
    projectsLoading, 
    projectsError, 
    user
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (title: string) => {
      return apiRequest("POST", "/api/projects", {
        title,
        description: "",
        resolution: "1920x1080",
        frameRate: 30
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Progetto creato",
        description: "Il tuo nuovo progetto è stato creato con successo."
      });
      refetch();
      setShowCreateDialog(false);
      // Redirect to the editor with the new project
      navigate(`/editor/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile creare il progetto. Riprova più tardi.",
        variant: "destructive"
      });
    }
  });
  
  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      toast({
        title: "Progetto eliminato",
        description: "Il progetto è stato eliminato con successo."
      });
      refetch();
      setShowDeleteDialog(false);
      setProjectToDelete(null);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il progetto. Riprova più tardi.",
        variant: "destructive"
      });
    }
  });
  
  // Handle project creation
  const handleCreateProject = () => {
    if (!newProjectTitle.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un titolo per il progetto.",
        variant: "destructive"
      });
      return;
    }
    
    createProjectMutation.mutate(newProjectTitle);
  };
  
  // Handle project deletion
  const handleDeleteProject = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
    }
  };
  
  // Filter and sort projects
  // Stampa diretta dei progetti per debug
  console.log("Progetti ricevuti:", projects);
  
  // Assicuriamoci che i progetti siano sempre un array valido
  const projectsArray = Array.isArray(projects) ? projects : [];
  console.log("Progetti come array:", projectsArray);
  
  // Filter and sort
  const filteredProjects = projectsArray
    .filter((project: any) => {
      console.log("Filtrando progetto:", project);
      // Verifica prima che project e project.title esistano
      return project && project.title && project.title.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a: any, b: any) => {
      switch(sortBy) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "name":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
  // Log finale dei progetti filtrati per debug
  console.log("Progetti filtrati:", filteredProjects);
  
  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">I miei Progetti</h1>
          <p className="text-muted-foreground">Gestisci e modifica i tuoi progetti video</p>
        </div>
        
        {user && (
          <Button 
            onClick={() => {
              setNewProjectTitle("");
              setShowCreateDialog(true);
            }}
            className="bg-gradient-primary hover:opacity-90 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Progetto
          </Button>
        )}
      </div>
      
      {/* Filters bar - Visible only when user is authenticated */}
      {user && (
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-card border border-border/50 rounded-lg p-4">
          <div className="flex-1 w-full sm:w-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cerca progetti..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                  <span>{sortBy === "newest" ? "Più recenti" : sortBy === "oldest" ? "Meno recenti" : "Nome"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  <Clock className="mr-2 h-4 w-4" />
                  Più recenti
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Meno recenti
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Nome (A-Z)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="sm" className="flex items-center">
              <Filter className="mr-2 h-3.5 w-3.5" />
              Filtri
            </Button>
          </div>
        </div>
      )}
      
      {/* Projects grid */}
      {!user ? (
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
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      ) : (
        <div>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border/50 rounded-lg">
              {searchQuery ? (
                <>
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h2 className="text-xl font-medium mb-2">Nessun risultato trovato</h2>
                  <p className="text-muted-foreground mb-6">Nessun progetto corrisponde alla tua ricerca "{searchQuery}"</p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Cancella ricerca
                  </Button>
                </>
              ) : (
                <>
                  <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h2 className="text-xl font-medium mb-2">Nessun progetto trovato</h2>
                  <p className="text-muted-foreground mb-6">Inizia creando il tuo primo progetto</p>
                  <Button 
                    className="bg-gradient-primary hover:opacity-90 shadow-sm"
                    onClick={() => {
                      setNewProjectTitle("");
                      setShowCreateDialog(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crea Nuovo Progetto
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project: any) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onDelete={(project) => {
                    setProjectToDelete(project);
                    setShowDeleteDialog(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crea Nuovo Progetto</DialogTitle>
            <DialogDescription>
              Inserisci un titolo per il tuo nuovo progetto. Potrai modificare i dettagli successivamente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="projectTitle">Titolo del Progetto</Label>
            <Input 
              id="projectTitle" 
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              placeholder="Inserisci titolo del progetto" 
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button 
              className="bg-gradient-primary hover:opacity-90"
              onClick={handleCreateProject} 
              disabled={createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? "Creazione in corso..." : "Crea Progetto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Elimina Progetto</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare "{projectToDelete?.title}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject}
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? "Eliminazione in corso..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (project: Project) => void }) {
  const time = project.createdAt 
    ? formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: itLocale }) 
    : '';
  
  return (
    <Card className="overflow-hidden border-border/40 shadow-sm group card-interactive">
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
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
          <Button 
            size="sm" 
            variant="outline" 
            className="border-white/20 bg-black/30 text-white hover:bg-black/50 hover:border-white/30"
            asChild
          >
            <Link href={`/editor/${project.id}`}>
              <PlayCircle className="mr-1 h-3.5 w-3.5" />
              Apri
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-black/30 border-white/20 text-white hover:bg-black/50 hover:border-white/30">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/editor/${project.id}`}>
                  <Edit className="mr-2 h-4 w-4" /> Modifica
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Video className="mr-2 h-4 w-4" /> Anteprima
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(project)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Status badge */}
        {(project as any).status && (
          <Badge 
            className="absolute top-3 left-3 capitalize" 
            variant={(project as any).status === "completed" ? "success" : "default"}
          >
            {(project as any).status === "completed" ? "Completato" : "In progresso"}
          </Badge>
        )}
      </div>
      
      <CardContent className="pt-5">
        <h3 className="text-lg font-semibold mb-1.5 truncate group-hover:text-primary transition-colors">
          {project.title}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {project.resolution} • {project.frameRate}fps
          </p>
          <p className="text-xs text-muted-foreground">
            {time}
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
  );
}
