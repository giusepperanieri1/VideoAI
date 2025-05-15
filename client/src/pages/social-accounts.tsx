import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  SiYoutube,
  SiTiktok,
  SiInstagram,
  SiLinkedin,
  SiFacebook
} from "react-icons/si";
import { SiX } from "react-icons/si"; // Nuova icona per Twitter/X

import {
  Trash2,
  Plus,
  Lock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Key
} from "lucide-react";

interface SocialAccount {
  id: number;
  userId: string | number;
  platform: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt?: Date;
  lastPublished?: Date;
  token?: string; // This is sensitive and should not be displayed
}

export default function SocialAccounts() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("youtube");
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<SocialAccount | null>(null);
  
  // Gestione dei messaggi basati su query parameters per OAuth callback
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const successMessage = searchParams.get('success');
  const errorMessage = searchParams.get('error');
  
  // Form state for adding a new account
  const [newAccount, setNewAccount] = useState({
    platform: activeTab,
    accountName: "",
    accountId: "",
    token: ""
  });
  
  // Query to fetch user's social accounts
  const { data: socialAccounts, isLoading } = useQuery({
    queryKey: ["/api/social-accounts"],
    enabled: isAuthenticated
  });
  
  // Mostra messaggi toast basati sui parametri URL dopo OAuth
  useEffect(() => {
    if (successMessage === 'connected') {
      toast({
        title: "Account collegato con successo",
        description: "Il tuo account social è stato collegato correttamente.",
        variant: "default",
      });
      
      // Rimuovi i parametri dalla URL senza ricaricare la pagina
      window.history.replaceState({}, document.title, "/social-accounts");
    } else if (errorMessage) {
      let errorDescription = "Si è verificato un errore durante il collegamento dell'account.";
      
      switch (errorMessage) {
        case 'auth_init_failed':
          errorDescription = "Impossibile avviare l'autenticazione. Per favore riprova.";
          break;
        case 'invalid_state':
          errorDescription = "Autenticazione non valida. Per motivi di sicurezza, riprova il collegamento.";
          break;
        case 'oauth_callback_failed':
          errorDescription = "Si è verificato un errore durante il processo di autenticazione. Riprova più tardi.";
          break;
      }
      
      toast({
        title: "Errore di collegamento",
        description: errorDescription,
        variant: "destructive",
      });
      
      // Rimuovi i parametri dalla URL senza ricaricare la pagina
      window.history.replaceState({}, document.title, "/social-accounts");
    }
  }, [successMessage, errorMessage, toast]);

  // Mutation to add a new social account
  const addAccountMutation = useMutation({
    mutationFn: async (accountData: any) => {
      const response = await fetch("/api/social-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountData),
      });
      if (!response.ok) {
        throw new Error("Errore durante il collegamento dell'account");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      toast({
        title: "Account social aggiunto",
        description: "L'account è stato collegato con successo."
      });
      setIsAddingAccount(false);
      setNewAccount({
        platform: activeTab,
        accountName: "",
        accountId: "",
        token: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante il collegamento dell'account.",
        variant: "destructive",
      });
    }
  });

  // Mutation to update a social account
  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/social-accounts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        throw new Error("Errore durante l'aggiornamento dell'account");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      toast({
        title: "Account aggiornato",
        description: "Lo stato dell'account è stato aggiornato con successo."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'aggiornamento dell'account.",
        variant: "destructive",
      });
    }
  });

  // Mutation to delete a social account
  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/social-accounts/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Errore durante la rimozione dell'account");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      toast({
        title: "Account rimosso",
        description: "L'account è stato scollegato con successo."
      });
      setAccountToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante la rimozione dell'account.",
        variant: "destructive",
      });
    }
  });

  // Function to handle new account form submission
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se l'accountName non è specificato, usiamo un valore predefinito
    const accountName = newAccount.accountName || `Il mio account ${currentPlatform.name}`;
    
    // Se accountId non è specificato, usiamo "auto" per far generare automaticamente al backend
    const accountId = newAccount.accountId || "auto";
    
    addAccountMutation.mutate({
      token: newAccount.token,
      accountName,
      accountId,
      platform: activeTab,
      userId: user?.id,
      isActive: true,
      isVerified: false
    });
  };

  // Function to toggle account active status
  const toggleAccountActive = (account: SocialAccount) => {
    updateAccountMutation.mutate({
      id: account.id,
      isActive: !account.isActive
    });
  };

  // Function to handle account deletion
  const handleDeleteAccount = () => {
    if (accountToDelete) {
      deleteAccountMutation.mutate(accountToDelete.id);
    }
  };

  // Helper function to determine if the user has an account for the current platform
  const hasPlatformAccount = (platform: string) => {
    if (!socialAccounts || !Array.isArray(socialAccounts)) return false;
    return socialAccounts.some((account: SocialAccount) => account.platform === platform);
  };
  
  // Helper function to get accounts for the current platform
  const getCurrentPlatformAccounts = () => {
    if (!socialAccounts || !Array.isArray(socialAccounts)) return [];
    return socialAccounts.filter((account: SocialAccount) => account.platform === activeTab);
  };
  
  // Platform-specific settings and information
  const platforms = {
    youtube: {
      name: "YouTube",
      icon: <SiYoutube className="w-6 h-6 text-red-600" />,
      color: "bg-red-600",
      lightColor: "bg-red-100",
      textColor: "text-red-600",
      borderColor: "border-red-200",
      description: "Pubblica video automaticamente sul tuo canale YouTube."
    },
    tiktok: {
      name: "TikTok",
      icon: <SiTiktok className="w-6 h-6 text-black" />,
      color: "bg-black",
      lightColor: "bg-gray-100",
      textColor: "text-black",
      borderColor: "border-gray-300",
      description: "Condividi i tuoi video direttamente su TikTok."
    },
    instagram: {
      name: "Instagram",
      icon: <SiInstagram className="w-6 h-6 text-pink-600" />,
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      lightColor: "bg-pink-50",
      textColor: "text-pink-600",
      borderColor: "border-pink-200",
      description: "Pubblica su Instagram i tuoi video e Reels."
    },
    twitter: {
      name: "Twitter/X",
      icon: <SiX className="w-6 h-6 text-black" />,
      color: "bg-black",
      lightColor: "bg-gray-100",
      textColor: "text-black",
      borderColor: "border-gray-300",
      description: "Condividi i tuoi video con il tuo pubblico su X."
    },
    linkedin: {
      name: "LinkedIn",
      icon: <SiLinkedin className="w-6 h-6 text-blue-700" />,
      color: "bg-blue-700",
      lightColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      description: "Pubblica contenuti professionali sul tuo profilo LinkedIn."
    },
    facebook: {
      name: "Facebook",
      icon: <SiFacebook className="w-6 h-6 text-blue-600" />,
      color: "bg-blue-600",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-200",
      description: "Condividi i tuoi video sulla tua pagina Facebook."
    }
  };

  const currentPlatform = platforms[activeTab as keyof typeof platforms];
  
  return (
    <>
      <div className="container max-w-6xl py-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Social</h1>
            <p className="text-muted-foreground mt-1">
              Collega i tuoi account social per pubblicare direttamente i tuoi video.
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <TabsList className="bg-muted/60 p-1 h-auto">
              {Object.entries(platforms).map(([key, platform]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center gap-2 px-3 py-2 data-[state=active]:shadow-sm"
                >
                  {platform.icon}
                  <span className="hidden sm:inline">{platform.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {!isAddingAccount && !hasPlatformAccount(activeTab) && (
              <Button 
                onClick={() => setIsAddingAccount(true)}
                className={`${currentPlatform.color} hover:opacity-90 text-white`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Collega {currentPlatform.name}
              </Button>
            )}
          </div>
          
          {/* Content for each platform */}
          {Object.keys(platforms).map((platform) => (
            <TabsContent key={platform} value={platform} className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : isAddingAccount && activeTab === platform ? (
                <Card className={`border-2 ${currentPlatform.borderColor}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`${currentPlatform.lightColor} p-2 rounded-full`}>
                        {currentPlatform.icon}
                      </div>
                      <div>
                        <CardTitle>Collega il tuo account {currentPlatform.name}</CardTitle>
                        <CardDescription>
                          Inserisci le tue credenziali per collegare il tuo account {currentPlatform.name}.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form id="add-account-form" onSubmit={handleAddAccount} className="space-y-4">
                      <div className="space-y-6">
                        <div className="grid gap-6">
                          <div className="flex flex-col gap-2">
                            <Label className="text-base font-medium">Scegli un metodo di collegamento</Label>
                            <div className="grid gap-3">
                              <div 
                                className="relative flex items-center justify-center p-6 border border-muted bg-background rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex flex-col items-center gap-3 text-center">
                                  <div className={`${currentPlatform.lightColor} p-3 rounded-full`}>
                                    {currentPlatform.icon}
                                  </div>
                                  <div>
                                    <h3 className="font-medium">Accesso diretto con {currentPlatform.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Il modo più semplice e sicuro per collegare il tuo account
                                    </p>
                                  </div>
                                  <Button 
                                    className={`${currentPlatform.color} hover:opacity-90 text-white mt-2`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Avvia il flusso OAuth
                                      fetch(`/api/oauth/${activeTab}/auth`)
                                        .then(response => response.json())
                                        .then(data => {
                                          if (data.authUrl) {
                                            window.location.href = data.authUrl;
                                          } else {
                                            toast({
                                              title: "Errore",
                                              description: "Impossibile avviare l'autenticazione",
                                              variant: "destructive"
                                            });
                                          }
                                        })
                                        .catch(error => {
                                          toast({
                                            title: "Errore",
                                            description: "Impossibile avviare l'autenticazione",
                                            variant: "destructive"
                                          });
                                          console.error(error);
                                        });
                                    }}
                                  >
                                    Accedi con {currentPlatform.name}
                                  </Button>
                                </div>
                              </div>
                              
                              <Separator>
                                <span className="text-xs text-muted-foreground px-2">oppure</span>
                              </Separator>
                              
                              <div className="border border-muted rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="p-2 rounded-full bg-muted">
                                    <Key className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-medium">Usa token API (avanzato)</h3>
                                    <p className="text-xs text-muted-foreground">
                                      Solo per utenti esperti. L'autenticazione diretta è più sicura e semplice.
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="apiToken" className="text-sm">Token API</Label>
                                    <div className="relative mt-1.5">
                                      <Input 
                                        id="apiToken"
                                        type="password"
                                        className="pr-10 bg-white"
                                        placeholder={`Incolla il tuo token API ${currentPlatform.name} qui`}
                                        value={newAccount.token}
                                        onChange={(e) => setNewAccount({...newAccount, token: e.target.value})}
                                      />
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                                        <Lock className="h-4 w-4" />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="accountName" className="text-sm">
                                      Nome personalizzato (opzionale)
                                    </Label>
                                    <Input 
                                      id="accountName"
                                      className="mt-1.5"
                                      placeholder={`Es. "Account aziendale" o "Canale personale"`}
                                      value={newAccount.accountName}
                                      onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})}
                                    />
                                  </div>
                                  
                                  {/* I campi ID e altre info sono nascosti e popolati automaticamente dal backend */}
                                  <input type="hidden" name="accountId" value={newAccount.accountId || "auto"} />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M12 16v.01"></path>
                              <path d="M12 8v4"></path>
                            </svg>
                            <span className="text-blue-700">
                              Consigliamo di usare l'accesso diretto quando possibile per una configurazione più semplice e sicura.
                            </span>
                          </div>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddingAccount(false)}
                    >
                      Annulla
                    </Button>
                    <Button 
                      type="submit"
                      form="add-account-form"
                      className={`${currentPlatform.color} hover:opacity-90 text-white`}
                      disabled={addAccountMutation.isPending}
                    >
                      {addAccountMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Collegamento...
                        </>
                      ) : (
                        <>
                          Collega tramite token
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ) : getCurrentPlatformAccounts().length > 0 ? (
                <div className="space-y-4">
                  {getCurrentPlatformAccounts().map((account: SocialAccount) => (
                    <Card key={account.id} className="mb-4 overflow-hidden group">
                      <div className={`h-1 w-full ${account.isActive ? currentPlatform.color : 'bg-gray-300'}`}></div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className={`${currentPlatform.lightColor} p-2 rounded-full`}>
                              {currentPlatform.icon}
                            </div>
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                {account.accountName}
                                {account.isVerified && (
                                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 hover:bg-green-50 border-green-200 flex items-center gap-1 py-0 h-5">
                                    <CheckCircle className="h-3 w-3" /> 
                                    <span className="text-xs">Verificato</span>
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="flex flex-col space-y-1">
                                <div className="flex items-center text-xs">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                  </svg>
                                  <span>ID: {account.accountId}</span>
                                </div>
                                {!account.isVerified && (
                                  <div className="flex items-center justify-between text-xs text-amber-600 mt-1 bg-amber-50 p-1 px-2 rounded-sm">
                                    <div className="flex items-center">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      <span>Token da verificare - potrebbe non funzionare correttamente</span>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 ml-2 px-2"
                                      onClick={() => {
                                        // Inizia il processo di autenticazione OAuth per questo account
                                        fetch(`/api/oauth/${account.platform}/auth`)
                                          .then(response => response.json())
                                          .then(data => {
                                            if (data.authUrl) {
                                              window.location.href = data.authUrl;
                                            } else {
                                              toast({
                                                title: "Errore",
                                                description: "Impossibile avviare l'autenticazione",
                                                variant: "destructive"
                                              });
                                            }
                                          })
                                          .catch(error => {
                                            toast({
                                              title: "Errore",
                                              description: "Impossibile avviare l'autenticazione",
                                              variant: "destructive"
                                            });
                                            console.error(error);
                                          });
                                      }}
                                    >
                                      Verifica
                                    </Button>
                                  </div>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setAccountToDelete(account)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Rimuovere questo account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler rimuovere l'account {account.accountName}? 
                                  Non potrai più pubblicare contenuti su questo account finché non lo colleghi nuovamente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setAccountToDelete(null)}>
                                  Annulla
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handleDeleteAccount}
                                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                >
                                  {deleteAccountMutation.isPending ? (
                                    <>
                                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                      Rimozione...
                                    </>
                                  ) : (
                                    <>Rimuovi</>
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={account.isActive}
                              onCheckedChange={() => toggleAccountActive(account)}
                              id={`active-${account.id}`}
                              className="data-[state=checked]:bg-green-500"
                            />
                            <Label htmlFor={`active-${account.id}`} className={`text-sm ${account.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                              {account.isActive ? "Attivo" : "Disattivato"}
                            </Label>
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            {account.lastPublished ? (
                              <span>Ultimo publish: {new Date(account.lastPublished).toLocaleDateString()}</span>
                            ) : (
                              <span>Nessuna pubblicazione recente</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`w-full text-sm ${currentPlatform.textColor} border-gray-200 hover:bg-${currentPlatform.lightColor} hover:border-current`}
                          onClick={() => window.open(`https://${account.platform}.com/${account.accountId}`, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Visualizza account
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                  
                  {!hasPlatformAccount(activeTab) && (
                    <Button 
                      onClick={() => setIsAddingAccount(true)}
                      className={`${currentPlatform.color} hover:opacity-90 text-white`}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Collega un altro account {currentPlatform.name}
                    </Button>
                  )}
                </div>
              ) : (
                <Card className="border border-dashed">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {currentPlatform.icon}
                      <span>Collega il tuo account {currentPlatform.name}</span>
                    </CardTitle>
                    <CardDescription>
                      {currentPlatform.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className={`${currentPlatform.lightColor} p-4 rounded-full mb-4`}>
                      {currentPlatform.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Nessun account {currentPlatform.name} collegato
                    </h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Collega il tuo account {currentPlatform.name} in modo semplice utilizzando solo il tuo token API.
                      Potrai pubblicare automaticamente i tuoi video direttamente dalla piattaforma VideoGenAI.
                    </p>
                    <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-5 max-w-md text-left">
                      <div className="flex gap-2 text-sm text-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 16v.01"></path>
                          <path d="M12 8v4"></path>
                        </svg>
                        <div>
                          <p className="font-medium">Collegamento semplificato</p>
                          <p className="text-blue-600 text-xs mt-1">
                            Abbiamo semplificato il processo di connessione: è sufficiente inserire il token API e tutto il resto viene gestito automaticamente.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setIsAddingAccount(true)}
                      className={`${currentPlatform.color} hover:opacity-90 text-white`}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Collega {currentPlatform.name} con un token
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              <div className="bg-muted/40 rounded-lg p-4 text-sm text-muted-foreground">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4" />
                  Informazioni sulla privacy
                </h3>
                <p>
                  Per pubblicare contenuti sul tuo account {currentPlatform.name}, VideoGenAI richiede 
                  le autorizzazioni necessarie per accedere al tuo account. I tuoi dati di accesso sono 
                  criptati e non vengono mai condivisi con terze parti.
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}