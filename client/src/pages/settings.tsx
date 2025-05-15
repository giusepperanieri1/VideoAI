import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, Trash2, Save, User, Key, Globe, Shield, AlertCircle, Bell } from "lucide-react";

export default function Settings() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("account");
  
  // Stati per le impostazioni
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Gestione esportazione dati
  const handleExportData = async () => {
    try {
      toast({
        title: "Download avviato",
        description: "Stiamo preparando i tuoi dati per il download...",
      });
      
      // Richiedi l'esportazione dati
      window.location.href = "/api/user/export-data";
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'esportazione dei dati.",
        variant: "destructive",
      });
    }
  };
  
  // Gestione cancellazione account
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "CANCELLA") {
      toast({
        title: "Errore",
        description: "Per favore, conferma l'eliminazione digitando 'CANCELLA'.",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione dell'account");
      }
      
      toast({
        title: "Account eliminato",
        description: "Il tuo account è stato eliminato con successo. Verrai reindirizzato alla pagina iniziale.",
      });
      
      // Reindirizza alla home dopo un breve ritardo
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione dell'account.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation("");
    }
  };
  
  // Se l'utente non è autenticato, reindirizza alla home
  if (!isLoading && !user) {
    navigate("/");
    return null;
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="flex justify-center items-center p-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-heading font-bold">Impostazioni</h1>
        <p className="text-muted-foreground">Gestisci il tuo account e le tue preferenze</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="account">
            <User className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="mr-2 h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifiche
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="pt-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informazioni Personali</CardTitle>
              <CardDescription>
                Gestisci le tue informazioni di base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-gray-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.email || "Utente"}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <p className="text-muted-foreground text-sm mb-4">
                Le informazioni personali vengono gestite tramite Replit Auth.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" onClick={() => window.location.href = "/api/logout"}>
                Logout
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy" className="pt-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Privacy e Dati
              </CardTitle>
              <CardDescription>
                Gestisci i tuoi dati personali e le impostazioni sulla privacy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Dati personali</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Puoi esportare tutti i tuoi dati in un file JSON. Questo include i tuoi progetti, risorse,
                    impostazioni e altre informazioni associate al tuo account.
                  </p>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="mr-2 h-4 w-4" />
                    Esporta Dati
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2 text-destructive flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Elimina Account
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Eliminando il tuo account, tutti i tuoi dati verranno rimossi permanentemente dai nostri server.
                    Questa azione è irreversibile.
                  </p>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Elimina Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro di voler eliminare il tuo account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Questa azione è irreversibile. Tutti i tuoi dati, progetti e impostazioni verranno
                          eliminati permanentemente.
                          <div className="mt-4">
                            <Label htmlFor="confirmDelete" className="text-sm font-medium">
                              Per confermare, digita "CANCELLA" qui sotto:
                            </Label>
                            <Input
                              id="confirmDelete"
                              value={deleteConfirmation}
                              onChange={(e) => setDeleteConfirmation(e.target.value)}
                              className="mt-2"
                              placeholder="CANCELLA"
                            />
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={isDeleting || deleteConfirmation !== "CANCELLA"}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                              Eliminazione in corso...
                            </>
                          ) : (
                            "Elimina definitivamente"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="pt-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notifiche
              </CardTitle>
              <CardDescription>
                Gestisci le impostazioni delle notifiche dell'applicazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications" className="text-base">Notifiche in-app</Label>
                    <p className="text-sm text-muted-foreground">
                      Ricevi notifiche all'interno dell'applicazione
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications" className="text-base">Notifiche email</Label>
                    <p className="text-sm text-muted-foreground">
                      Ricevi aggiornamenti e notifiche via email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    disabled={!notificationsEnabled}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Salva impostazioni
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}