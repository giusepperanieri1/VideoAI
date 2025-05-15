import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, ShareIcon, InstagramIcon, YoutubeIcon, LinkedinIcon, FacebookIcon, TwitterIcon, FileText, User as UserIcon } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Project, SocialAccount } from '@shared/schema';

interface PublishModalProps {
  project: Project | undefined;
  onClose: () => void;
}

export default function PublishModal({ project, onClose }: PublishModalProps) {
  const { toast } = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [title, setTitle] = useState(project?.title || '');
  const [description, setDescription] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [currentTab, setCurrentTab] = useState('platforms');
  
  // Query social accounts
  const { 
    data: socialAccounts = [], 
    isLoading: loadingAccounts 
  } = useQuery({
    queryKey: ['/api/social-accounts', { userId: project?.userId }],
    enabled: !!project?.userId,
  });
  
  // Connect account mutation
  const connectAccountMutation = useMutation({
    mutationFn: async (accountData: { platform: string; accountName: string; userId: number }) => {
      return apiRequest('POST', '/api/social-accounts', {
        ...accountData,
        connected: true,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Account collegato',
        description: 'Il tuo account social è stato collegato con successo.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
    },
    onError: () => {
      toast({
        title: 'Errore',
        description: 'Impossibile collegare l\'account. Riprova più tardi.',
        variant: 'destructive',
      });
    }
  });
  
  // Publish video mutation
  const publishVideoMutation = useMutation({
    mutationFn: async (publishData: { 
      projectId: number; 
      platforms: string[]; 
      title: string; 
      description: string; 
      scheduleDate?: string;
      scheduleTime?: string;
    }) => {
      return apiRequest('POST', '/api/publish', publishData);
    },
    onSuccess: () => {
      toast({
        title: 'Video pubblicato',
        description: scheduleDate && scheduleTime 
          ? 'Il tuo video è stato programmato per la pubblicazione.' 
          : 'Il tuo video è stato pubblicato con successo.',
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Errore',
        description: 'Impossibile pubblicare il video. Riprova più tardi.',
        variant: 'destructive',
      });
    }
  });
  
  // Handle platform selection
  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform) 
        : [...prev, platform]
    );
  };
  
  // Handle publish
  const handlePublish = () => {
    if (!project) {
      toast({
        title: 'Errore',
        description: 'Nessun progetto selezionato per la pubblicazione.',
        variant: 'destructive',
      });
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Errore',
        description: 'Seleziona almeno una piattaforma per la pubblicazione.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!title.trim()) {
      toast({
        title: 'Errore',
        description: 'Inserisci un titolo per il tuo video.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if we have connected accounts for selected platforms
    const connectedPlatforms = socialAccounts.map((account: SocialAccount) => account.platform);
    const unconnectedPlatforms = selectedPlatforms.filter(platform => !connectedPlatforms.includes(platform));
    
    if (unconnectedPlatforms.length > 0) {
      toast({
        title: 'Account non collegati',
        description: `Collega prima i tuoi account ${unconnectedPlatforms.join(', ')}.`,
        variant: 'destructive',
      });
      setCurrentTab('accounts');
      return;
    }
    
    // Prepare scheduling data
    const scheduleData: {
      scheduleDate?: string;
      scheduleTime?: string;
    } = {};
    
    if (scheduleDate && scheduleTime) {
      scheduleData.scheduleDate = scheduleDate;
      scheduleData.scheduleTime = scheduleTime;
    }
    
    // Submit publish request
    publishVideoMutation.mutate({
      projectId: project.id,
      platforms: selectedPlatforms,
      title,
      description,
      ...scheduleData
    });
  };
  
  // Helper function to get icon for platform
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <InstagramIcon className="h-5 w-5" />;
      case 'youtube':
        return <YoutubeIcon className="h-5 w-5" />;
      case 'linkedin':
        return <LinkedinIcon className="h-5 w-5" />;
      case 'facebook':
        return <FacebookIcon className="h-5 w-5" />;
      case 'twitter':
        return <TwitterIcon className="h-5 w-5" />;
      default:
        return <ShareIcon className="h-5 w-5" />;
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border border-indigo-100 shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold text-indigo-700">
            <div className="mr-3 p-2 rounded-full bg-indigo-100">
              <ShareIcon className="h-5 w-5 text-indigo-600" />
            </div>
            Pubblica sui Social Media
          </DialogTitle>
          <Button 
            className="absolute right-4 top-4 hover:bg-indigo-100" 
            variant="ghost" 
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6 p-1 bg-indigo-50/70 rounded-xl">
            <TabsTrigger 
              value="platforms" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all duration-200"
            >
              <ShareIcon className="mr-2 h-4 w-4" />
              Piattaforme
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all duration-200"
            >
              <FileText className="mr-2 h-4 w-4" />
              Dettagli
            </TabsTrigger>
            <TabsTrigger 
              value="accounts" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all duration-200"
            >
              <UserIcon className="mr-2 h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>
          
          {/* Platforms Tab */}
          <TabsContent value="platforms" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Seleziona le piattaforme di pubblicazione:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <PlatformCard 
                  platform="instagram" 
                  name="Instagram" 
                  icon={<InstagramIcon className="h-5 w-5" />}
                  selected={selectedPlatforms.includes('instagram')}
                  onToggle={() => togglePlatform('instagram')}
                />
                
                <PlatformCard 
                  platform="youtube" 
                  name="YouTube" 
                  icon={<YoutubeIcon className="h-5 w-5" />}
                  selected={selectedPlatforms.includes('youtube')}
                  onToggle={() => togglePlatform('youtube')}
                />
                
                <PlatformCard 
                  platform="linkedin" 
                  name="LinkedIn" 
                  icon={<LinkedinIcon className="h-5 w-5" />}
                  selected={selectedPlatforms.includes('linkedin')}
                  onToggle={() => togglePlatform('linkedin')}
                />
                
                <PlatformCard 
                  platform="facebook" 
                  name="Facebook" 
                  icon={<FacebookIcon className="h-5 w-5" />}
                  selected={selectedPlatforms.includes('facebook')}
                  onToggle={() => togglePlatform('facebook')}
                />
                
                <PlatformCard 
                  platform="twitter" 
                  name="Twitter" 
                  icon={<TwitterIcon className="h-5 w-5" />}
                  selected={selectedPlatforms.includes('twitter')}
                  onToggle={() => togglePlatform('twitter')}
                />
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button 
                variant="default"
                onClick={() => setCurrentTab('details')}
                disabled={selectedPlatforms.length === 0}
              >
                Continua
              </Button>
            </div>
          </TabsContent>
          
          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div>
              <Label htmlFor="title" className="block text-sm font-medium mb-2">
                Titolo
              </Label>
              <Input
                id="title"
                className="w-full bg-dark-700 text-white border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="block text-sm font-medium mb-2">
                Descrizione
              </Label>
              <Textarea
                id="description"
                className="w-full bg-dark-700 text-white border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary text-sm h-24"
                placeholder="Descrivi il tuo video..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="bg-dark-700 border border-dark-600 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">Pianificazione pubblicazione:</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label htmlFor="scheduleDate" className="block text-xs text-muted-foreground mb-1">
                    Data
                  </Label>
                  <Input
                    id="scheduleDate"
                    type="date"
                    className="w-full bg-dark-700 text-white border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="scheduleTime" className="block text-xs text-muted-foreground mb-1">
                    Ora
                  </Label>
                  <Input
                    id="scheduleTime"
                    type="time"
                    className="w-full bg-dark-700 text-white border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Lascia vuoto per pubblicare immediatamente.
              </p>
            </div>
            
            <div className="pt-4 flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setCurrentTab('platforms')}
              >
                Indietro
              </Button>
              <Button 
                variant="default"
                onClick={() => setCurrentTab('accounts')}
              >
                Continua
              </Button>
            </div>
          </TabsContent>
          
          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Account collegati:</h3>
              <div className="space-y-2">
                {loadingAccounts ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Caricamento account...</p>
                  </div>
                ) : (
                  <>
                    {socialAccounts.length === 0 ? (
                      <div className="text-center py-4 bg-dark-700 border border-dark-600 rounded-lg">
                        <p className="text-sm text-muted-foreground">Nessun account collegato</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Collega i tuoi account social per pubblicare i tuoi video.
                        </p>
                      </div>
                    ) : (
                      socialAccounts.map((account: SocialAccount) => (
                        <div 
                          key={account.id}
                          className="flex items-center justify-between p-3 bg-dark-700 border border-dark-600 rounded-lg"
                        >
                          <div className="flex items-center">
                            {getPlatformIcon(account.platform)}
                            <span className="ml-2 text-sm">{account.accountName}</span>
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-600/20 text-green-500 rounded">
                              Connesso
                            </span>
                          </div>
                          <Button variant="ghost" size="sm">
                            Disconnetti
                          </Button>
                        </div>
                      ))
                    )}
                    
                    {/* Connect new account form */}
                    <div className="mt-4 p-4 bg-dark-700 border border-dark-600 rounded-lg">
                      <h4 className="text-sm font-medium mb-3">Collega nuovo account:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <Select>
                          <SelectTrigger className="bg-dark-700 border-dark-600">
                            <SelectValue placeholder="Piattaforma" />
                          </SelectTrigger>
                          <SelectContent className="bg-dark-700 border-dark-600 text-foreground">
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="twitter">Twitter</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button className="bg-primary hover:bg-primary/90">
                          Autorizza
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Verrai reindirizzato al sito della piattaforma per autorizzare l'accesso.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="pt-4 flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setCurrentTab('details')}
              >
                Indietro
              </Button>
              <Button 
                variant="default"
                onClick={handlePublish}
                disabled={publishVideoMutation.isPending}
              >
                {publishVideoMutation.isPending ? 'Pubblicazione...' : 'Pubblica'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-end">
          <Button 
            variant="outline" 
            className="bg-dark-600 hover:bg-dark-500 text-white text-sm font-medium"
            onClick={onClose}
          >
            Annulla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PlatformCardProps {
  platform: string;
  name: string;
  icon: React.ReactNode;
  selected: boolean;
  onToggle: () => void;
}

function PlatformCard({ platform, name, icon, selected, onToggle }: PlatformCardProps) {
  return (
    <div 
      className={`p-3 rounded-lg flex items-center cursor-pointer transition-colors ${
        selected 
          ? 'bg-primary/20 border border-primary' 
          : 'bg-dark-700 border border-dark-600 hover:border-dark-500'
      }`}
      onClick={onToggle}
    >
      <Checkbox 
        id={`platform-${platform}`}
        checked={selected}
        className="mr-2"
      />
      <div className="flex items-center justify-between w-full">
        <Label 
          htmlFor={`platform-${platform}`} 
          className="flex items-center cursor-pointer"
        >
          {icon}
          <span className="ml-2 text-sm">{name}</span>
        </Label>
      </div>
    </div>
  );
}
