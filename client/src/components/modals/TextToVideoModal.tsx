import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { 
  Video, 
  FlashlightOff, 
  Clock, 
  Layout, 
  Mic, 
  PenLine, 
  Settings, 
  Paintbrush, 
  SparkleIcon,
  Zap
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { InsertAiVideoRequest } from '@shared/schema';

interface TextToVideoModalProps {
  userId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TextToVideoModal({ userId, onClose, onSuccess }: TextToVideoModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('content');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('professional');
  const [duration, setDuration] = useState(30);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [voiceOver, setVoiceOver] = useState('none');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Generate video mutation
  const generateVideoMutation = useMutation({
    mutationFn: async (data: InsertAiVideoRequest) => {
      return apiRequest('/api/ai/generate-video', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Generazione video avviata',
        description: 'Il tuo video è in fase di creazione e sarà disponibile a breve nella libreria.',
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile generare il video. Riprova più tardi.',
        variant: 'destructive',
      });
    }
  });
  
  const handleGenerateVideo = () => {
    if (!prompt.trim()) {
      toast({
        title: 'Campo richiesto',
        description: 'Inserisci una descrizione per il video che vuoi creare.',
        variant: 'destructive',
      });
      return;
    }
    
    // Prepare voice over settings
    const voiceOverSettings = voiceOver !== 'none' ? { 
      enabled: true, 
      voice: voiceOver 
    } : { 
      enabled: false 
    };
    
    // Submit request
    generateVideoMutation.mutate({
      userId,
      prompt,
      style,
      duration,
      aspectRatio,
      voiceOverSettings,
    });
  };
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <SparkleIcon className="text-indigo-500 mr-2 h-5 w-5" />
            Genera Video da Testo
          </DialogTitle>
          <DialogDescription>
            Descrivi il video che desideri e l'intelligenza artificiale lo creerà per te
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-3 mb-4 p-1 bg-indigo-50 rounded-xl">
            <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md">
              <PenLine className="h-4 w-4" />
              <span>Contenuto</span>
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md">
              <Paintbrush className="h-4 w-4" />
              <span>Stile</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md">
              <Settings className="h-4 w-4" />
              <span>Impostazioni</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompt" className="text-base font-medium flex items-center gap-2 text-indigo-800">
                  <PenLine className="h-5 w-5 text-indigo-600" />
                  Descrivi il video che vuoi creare
                </Label>
                <div className="text-xs text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                  {prompt.length} / 500 caratteri
                </div>
              </div>
              
              <div className="relative bg-white rounded-lg shadow-sm overflow-hidden border border-indigo-100">
                <Textarea
                  id="prompt"
                  className="resize-none h-40 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
                  placeholder="Es. Un video promozionale che mostra professionisti che utilizzano la nostra app per editing video su diversi dispositivi, con una grafica moderna e dinamica..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <div className="absolute bottom-2 right-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-xs hover:bg-indigo-50 text-indigo-600"
                    onClick={() => setPrompt("")}
                    disabled={!prompt}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Z"></path>
                      <path d="m15 9-6 6"></path>
                      <path d="m9 9 6 6"></path>
                    </svg>
                    Cancella
                  </Button>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100 shadow-sm">
                <h3 className="text-sm font-medium text-indigo-700 flex items-center mb-2">
                  <Zap className="h-4 w-4 mr-2" /> 
                  Suggerimenti per un video migliore
                </h3>
                <ul className="text-xs space-y-1.5 text-indigo-600">
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-400 font-bold mt-0.5">•</span> 
                    <span>Descrivi con precisione il <strong>soggetto principale</strong> e le <strong>azioni</strong> che vuoi nel video</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-400 font-bold mt-0.5">•</span> 
                    <span>Specifica lo <strong>stile visivo</strong>, i <strong>colori</strong> e l'<strong>atmosfera</strong> che desideri</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-400 font-bold mt-0.5">•</span> 
                    <span>Indica il <strong>contesto</strong> e l'<strong>ambientazione</strong> (es. "in ufficio", "all'aperto", "urbano")</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-400 font-bold mt-0.5">•</span> 
                    <span>Menziona eventuali <strong>elementi di brand</strong> da includere per personalizzare il video</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Esempi di prompt efficaci:</h4>
                <div className="space-y-2">
                  <div 
                    className="text-xs p-2 bg-gray-50 hover:bg-indigo-50 rounded border border-gray-200 hover:border-indigo-200 cursor-pointer transition-colors"
                    onClick={() => setPrompt("Un video promozionale che mostra professionisti che utilizzano la nostra app di editing video. L'atmosfera è moderna e professionale, con colori vibranti e transizioni fluide. Include close-up delle interfacce dell'app sui dispositivi e mostra il risultato finale dei progetti video.")}
                  >
                    "Un video promozionale che mostra professionisti che utilizzano la nostra app di editing video. L'atmosfera è moderna e professionale, con colori vibranti e transizioni fluide..."
                  </div>
                  <div 
                    className="text-xs p-2 bg-gray-50 hover:bg-indigo-50 rounded border border-gray-200 hover:border-indigo-200 cursor-pointer transition-colors"
                    onClick={() => setPrompt("Un tutorial breve che spiega come utilizzare la funzione di voice-over nella nostra app. Il video deve mostrare i passaggi con una grafica chiara e pulita, evidenziando i pulsanti dell'interfaccia. Lo stile è minimalista con sfondo chiaro e accenti blu.")}
                  >
                    "Un tutorial breve che spiega come utilizzare la funzione di voice-over nella nostra app. Il video deve mostrare i passaggi con una grafica chiara e pulita..."
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="style" className="space-y-5">
            <div className="flex items-center justify-between mb-4">
              <Label htmlFor="style" className="text-base font-medium flex items-center gap-2 text-indigo-800">
                <Paintbrush className="h-5 w-5 text-indigo-600" />
                Scegli lo stile visivo
              </Label>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 'professional', name: 'Professionale', icon: '💼', desc: 'Pulito e formale, ideale per affari', color: 'from-blue-500 to-indigo-700' },
                { id: 'minimalist', name: 'Minimalista', icon: '⚪', desc: 'Semplice ed essenziale', color: 'from-gray-400 to-gray-600' },
                { id: 'creative', name: 'Creativo', icon: '🎨', desc: 'Colori vivaci ed energie', color: 'from-pink-500 to-purple-700' },
                { id: 'corporate', name: 'Corporate', icon: '🏢', desc: 'Serio e istituzionale', color: 'from-blue-600 to-blue-900' },
                { id: 'social', name: 'Social Media', icon: '📱', desc: 'Dinamico e moderno', color: 'from-indigo-500 to-purple-600' },
                { id: 'cinematic', name: 'Cinematografico', icon: '🎬', desc: 'Drammatico e coinvolgente', color: 'from-gray-700 to-gray-900' }
              ].map(styleOption => (
                <div 
                  key={styleOption.id}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    style === styleOption.id 
                      ? 'border-indigo-500 shadow-md scale-105' 
                      : 'border-transparent hover:border-indigo-200'
                  }`}
                  onClick={() => setStyle(styleOption.id)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${styleOption.color} opacity-80`}></div>
                  <div className="relative p-4 text-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{styleOption.icon}</span>
                      {style === styleOption.id && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                      )}
                    </div>
                    <h3 className="font-bold text-sm">{styleOption.name}</h3>
                    <p className="text-xs opacity-80">{styleOption.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-indigo-100 p-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-indigo-800">Dettagli dello stile selezionato</h3>
              </div>
              
              {style === 'professional' && (
                <div className="text-sm text-gray-600">
                  <p>Lo stile professionale utilizza colori neutri e sofisticati con un'estetica pulita e ordinata. Ideale per presentazioni aziendali, dimostrazioni di prodotti e contenuti formativi.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600"></span>
                    <span className="w-4 h-4 rounded-full bg-indigo-700"></span>
                    <span className="w-4 h-4 rounded-full bg-gray-700"></span>
                  </div>
                </div>
              )}
              
              {style === 'minimalist' && (
                <div className="text-sm text-gray-600">
                  <p>Lo stile minimalista si concentra sull'essenziale con ampio spazio bianco, tipografia pulita e colori delicati. Perfetto per presentazioni eleganti e contenuti informativi.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-4 h-4 rounded-full bg-gray-200"></span>
                    <span className="w-4 h-4 rounded-full bg-gray-500"></span>
                    <span className="w-4 h-4 rounded-full bg-gray-800"></span>
                  </div>
                </div>
              )}
              
              {style === 'creative' && (
                <div className="text-sm text-gray-600">
                  <p>Lo stile creativo utilizza colori vivaci, forme dinamiche e transizioni energiche. Ideale per contenuti artistici, promozioni di eventi e video musicali.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-4 h-4 rounded-full bg-pink-500"></span>
                    <span className="w-4 h-4 rounded-full bg-purple-600"></span>
                    <span className="w-4 h-4 rounded-full bg-yellow-400"></span>
                  </div>
                </div>
              )}
              
              {style === 'corporate' && (
                <div className="text-sm text-gray-600">
                  <p>Lo stile corporate è formale e strutturato, con tonalità blu tradizionali ed elementi grafici ordinati. Perfetto per rapporti aziendali, presentazioni istituzionali e video formativi.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-4 h-4 rounded-full bg-blue-800"></span>
                    <span className="w-4 h-4 rounded-full bg-blue-600"></span>
                    <span className="w-4 h-4 rounded-full bg-gray-300"></span>
                  </div>
                </div>
              )}
              
              {style === 'social' && (
                <div className="text-sm text-gray-600">
                  <p>Lo stile social media è moderno e accattivante, con colori brillanti e transizioni rapide. Ottimo per contenuti di tendenza, annunci promozionali e video per i social network.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-500"></span>
                    <span className="w-4 h-4 rounded-full bg-purple-500"></span>
                    <span className="w-4 h-4 rounded-full bg-pink-400"></span>
                  </div>
                </div>
              )}
              
              {style === 'cinematic' && (
                <div className="text-sm text-gray-600">
                  <p>Lo stile cinematografico offre un look drammatico con contrasti marcati, colori ricchi e composizioni considerate. Ideale per narrazioni emozionali e presentazioni d'impatto.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-4 h-4 rounded-full bg-gray-900"></span>
                    <span className="w-4 h-4 rounded-full bg-gray-700"></span>
                    <span className="w-4 h-4 rounded-full bg-amber-700"></span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-5">
            <div className="flex items-center justify-between mb-4">
              <Label htmlFor="settings" className="text-base font-medium flex items-center gap-2 text-indigo-800">
                <Settings className="h-5 w-5 text-indigo-600" />
                Personalizza le impostazioni del video
              </Label>
            </div>
            
            <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
              <div className="border-b border-indigo-100 p-4">
                <label className="text-sm font-medium flex items-center text-indigo-800 mb-3">
                  <Clock className="h-4 w-4 mr-2 text-indigo-500" /> Durata target
                </label>
                
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { value: "15", label: "15s", desc: "Short" },
                    { value: "30", label: "30s", desc: "Social" },
                    { value: "60", label: "1m", desc: "Standard" },
                    { value: "120", label: "2m", desc: "Extended" },
                    { value: "300", label: "5m", desc: "Long" }
                  ].map(option => (
                    <div 
                      key={option.value}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all ${
                        duration.toString() === option.value 
                          ? 'bg-indigo-100 border-2 border-indigo-400 shadow-sm' 
                          : 'bg-gray-50 border border-gray-200 hover:border-indigo-200'
                      }`}
                      onClick={() => setDuration(parseInt(option.value))}
                    >
                      <span className={`text-sm font-bold ${duration.toString() === option.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-500">{option.desc}</span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-indigo-50 mt-2 p-2 rounded-md">
                  <div className="flex items-center gap-2 text-xs text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 8v4l3 3"></path>
                    </svg>
                    <span>Video più lunghi richiedono più tempo per essere generati</span>
                  </div>
                </div>
              </div>
              
              <div className="border-b border-indigo-100 p-4">
                <label className="text-sm font-medium flex items-center text-indigo-800 mb-3">
                  <Layout className="h-4 w-4 mr-2 text-indigo-500" /> Formato video
                </label>
                
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: "16:9", label: "Landscape", icon: "🖥️", size: "1920×1080" },
                    { value: "9:16", label: "Portrait", icon: "📱", size: "1080×1920" },
                    { value: "1:1", label: "Square", icon: "⬛", size: "1080×1080" },
                    { value: "4:5", label: "Instagram", icon: "📷", size: "1080×1350" }
                  ].map(option => (
                    <div 
                      key={option.value}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer transition-all ${
                        aspectRatio === option.value 
                          ? 'bg-indigo-100 border border-indigo-400 shadow-sm' 
                          : 'bg-gray-50 border border-gray-200 hover:border-indigo-200'
                      }`}
                      onClick={() => setAspectRatio(option.value)}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <span className={`text-sm font-medium ${aspectRatio === option.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">{option.value} · {option.size}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4">
                <label className="text-sm font-medium flex items-center text-indigo-800 mb-3">
                  <Mic className="h-4 w-4 mr-2 text-indigo-500" /> Voice-over
                </label>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { value: "none", label: "Nessuna voce", icon: "🔇" },
                    { value: "male_it", label: "Voce maschile", desc: "Italiano", icon: "🇮🇹" },
                    { value: "female_it", label: "Voce femminile", desc: "Italiano", icon: "🇮🇹" },
                    { value: "male_en", label: "Voce maschile", desc: "Inglese", icon: "🇬🇧" },
                    { value: "female_en", label: "Voce femminile", desc: "Inglese", icon: "🇬🇧" }
                  ].map(option => (
                    <div 
                      key={option.value}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                        voiceOver === option.value 
                          ? 'bg-indigo-100 border border-indigo-400 shadow-sm' 
                          : 'bg-gray-50 border border-gray-200 hover:border-indigo-200'
                      }`}
                      onClick={() => setVoiceOver(option.value)}
                    >
                      <div className="text-xl">{option.icon}</div>
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${voiceOver === option.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                          {option.label}
                        </span>
                        {option.desc && (
                          <span className="text-xs text-gray-500">{option.desc}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-indigo-50 mt-3 p-2 rounded-md">
                  <div className="flex items-start gap-2 text-xs text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                      <path d="M12 9v4"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                    <span>La voice-over leggerà il testo della descrizione o un testo generato automaticamente in base al contenuto. Assicurati che il prompt sia nella stessa lingua della voce scelta.</span>
                  </div>
                </div>
              </div>
            </div>
            
            {showAdvanced ? (
              <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-indigo-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-indigo-500">
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Impostazioni avanzate
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowAdvanced(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 6-12 12"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </Button>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Qualità video</label>
                    <Select value="high">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona qualità" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="ultra">Ultra HD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Framerate</label>
                    <Select value="30">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona framerate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 fps (Cinematografico)</SelectItem>
                        <SelectItem value="30">30 fps (Standard)</SelectItem>
                        <SelectItem value="60">60 fps (Fluido)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={() => setShowAdvanced(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Mostra impostazioni avanzate
              </Button>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 bg-white border border-indigo-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-100 p-1.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                  <path d="M3 3v18h18"></path>
                  <path d="m19 9-5 5-4-4-3 3"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-indigo-800">Riepilogo generazione</h3>
                <p className="text-xs text-gray-500">Verifica i dettagli prima di generare</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {activeTab !== 'content' && prompt.trim() ? (
                <div className="px-2 py-1 bg-indigo-50 rounded-md">
                  <span className="text-xs font-medium text-indigo-600">
                    {prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt}
                  </span>
                </div>
              ) : null}
              {activeTab !== 'style' ? (
                <div className="px-2 py-1 bg-indigo-50 rounded-md">
                  <span className="text-xs font-medium text-indigo-600 capitalize">
                    {style === 'professional' ? 'Professionale' : 
                     style === 'minimalist' ? 'Minimalista' : 
                     style === 'creative' ? 'Creativo' : 
                     style === 'corporate' ? 'Corporate' : 
                     style === 'social' ? 'Social Media' : 
                     style === 'cinematic' ? 'Cinematografico' : style}
                  </span>
                </div>
              ) : null}
              {activeTab !== 'settings' ? (
                <div className="px-2 py-1 bg-indigo-50 rounded-md">
                  <span className="text-xs font-medium text-indigo-600">
                    {duration}s · {aspectRatio}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
              Annulla
            </Button>
            
            <Button 
              type="button" 
              className={
                !prompt.trim() 
                  ? "border border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed flex-1" 
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg flex-1"
              }
              onClick={handleGenerateVideo}
              disabled={generateVideoMutation.isPending || !prompt.trim()}
            >
              {generateVideoMutation.isPending ? (
                <div className="flex items-center justify-center w-full">
                  <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-medium">Generazione in corso...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full py-1">
                  <Video className="mr-2 h-5 w-5" />
                  <span className="font-medium">Genera il mio video</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 text-indigo-200">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}