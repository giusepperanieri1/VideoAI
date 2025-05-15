import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Mic, Volume2, X, Play, Pause, RotateCcw, CheckCircle, Loader2, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { generateVoiceOver } from '@/lib/api';
import { generateScript } from '@/lib/openai';

interface VoiceOverModalProps {
  projectId: number;
  onClose: () => void;
  onSave: (voiceOverUrl: string, duration: number) => void;
}

// Elenco voci disponibili
const VOICES = [
  { id: 'alloy', name: 'Alessandro (Maschile)', language: 'Italiano', emoji: '👨', color: '#4F46E5' },
  { id: 'echo', name: 'Elena (Femminile)', language: 'Italiano', emoji: '👩', color: '#8B5CF6' },
  { id: 'fable', name: 'Francesco (Maschile)', language: 'Italiano', emoji: '👨', color: '#3B82F6' },
  { id: 'nova', name: 'Giulia (Femminile)', language: 'Italiano', emoji: '👩', color: '#EC4899' },
  { id: 'shimmer', name: 'Marco (Maschile)', language: 'Italiano', emoji: '👨', color: '#0EA5E9' },
  { id: 'onyx', name: 'Sofia (Femminile)', language: 'Italiano', emoji: '👩', color: '#D946EF' },
];

// Esempi di testo predefiniti
const TEXT_EXAMPLES = [
  { 
    id: 'intro',
    title: 'Introduzione al prodotto',
    text: 'Benvenuti alla presentazione del nostro innovativo prodotto. Siamo entusiasti di mostrarvi le incredibili funzionalità che abbiamo sviluppato per soddisfare le vostre esigenze.',
    icon: '🚀'
  },
  { 
    id: 'outro',
    title: 'Conclusione video',
    text: 'Grazie per aver guardato questo video. Non dimenticate di lasciare un commento e di iscrivervi al nostro canale per rimanere aggiornati sulle nostre novità.',
    icon: '👋'
  },
  { 
    id: 'call-to-action',
    title: 'Call to action',
    text: 'Per saperne di più visita il nostro sito web o contattaci direttamente. Offriamo una consulenza gratuita per aiutarti a trovare la soluzione perfetta per te.',
    icon: '📱'
  },
  { 
    id: 'tutorial',
    title: 'Tutorial step',
    text: 'Per utilizzare questa funzione, fai clic sul pulsante in alto a destra. Si aprirà un menu a tendina con varie opzioni tra cui scegliere.',
    icon: '📝'
  },
];

export default function VoiceOverModal({ projectId, onClose, onSave }: VoiceOverModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('text');
  const [text, setText] = useState('');
  const [voice, setVoice] = useState(VOICES[0].id);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [scriptPrompt, setScriptPrompt] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  
  // Script generation mutation
  const generateScriptMutation = useMutation({
    mutationFn: async (prompt: string) => {
      return generateScript(prompt, 30, 'professionale');
    },
    onSuccess: (script) => {
      setText(script);
      setActiveTab('text');
      toast({
        title: 'Script generato',
        description: 'Il testo del voice-over è stato generato con successo.',
      });
    },
    onError: () => {
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante la generazione dello script.',
        variant: 'destructive',
      });
    }
  });
  
  // Voice-over generation mutation
  const generateVoiceOverMutation = useMutation({
    mutationFn: async () => {
      return generateVoiceOver(text, voice, speed, pitch);
    },
    onSuccess: (data) => {
      setPreviewUrl(data.url);
      setDuration(data.duration);
      toast({
        title: 'Voice-over generato',
        description: 'L\'audio è stato generato con successo. Fai play per ascoltare l\'anteprima.',
      });
      setGenerating(false);
    },
    onError: () => {
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante la generazione del voice-over.',
        variant: 'destructive',
      });
      setGenerating(false);
    }
  });
  
  // Init audio element
  useEffect(() => {
    const audio = new Audio();
    setAudioElem(audio);
    
    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => setIsPlaying(false));
    
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, []);
  
  // Update audio source when preview URL changes
  useEffect(() => {
    if (audioElem && previewUrl) {
      audioElem.src = previewUrl;
      audioElem.load();
    }
  }, [previewUrl, audioElem]);
  
  // Toggle play/pause
  const togglePlayback = () => {
    if (!audioElem || !previewUrl) return;
    
    if (isPlaying) {
      audioElem.pause();
    } else {
      audioElem.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle text generation
  const handleGenerateScript = () => {
    if (!scriptPrompt.trim()) {
      toast({
        title: 'Errore',
        description: 'Inserisci una descrizione per generare il testo.',
        variant: 'destructive',
      });
      return;
    }
    
    generateScriptMutation.mutate(scriptPrompt);
  };
  
  // Handle voice-over generation
  const handleGenerateVoiceOver = () => {
    if (!text.trim()) {
      toast({
        title: 'Errore',
        description: 'Inserisci un testo per il voice-over.',
        variant: 'destructive',
      });
      return;
    }
    
    setGenerating(true);
    generateVoiceOverMutation.mutate();
  };
  
  // Handle saving the voice-over
  const handleSave = () => {
    if (!previewUrl) {
      toast({
        title: 'Errore',
        description: 'Genera prima un voice-over.',
        variant: 'destructive',
      });
      return;
    }
    
    onSave(previewUrl, duration);
    onClose();
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white border border-indigo-100 shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold text-indigo-700">
            <div className="mr-3 p-2 rounded-full bg-indigo-100">
              <Mic className="h-5 w-5 text-indigo-600" />
            </div>
            Genera Voice-Over
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6 p-1 bg-indigo-50/70 rounded-xl">
            <TabsTrigger 
              value="text" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all duration-200"
            >
              <FileText className="mr-2 h-4 w-4" />
              Testo
            </TabsTrigger>
            <TabsTrigger 
              value="generate" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all duration-200"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Genera Testo
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="voice-text" className="text-sm font-medium text-indigo-800">
                  Testo da convertire in voce
                </Label>
                <div className="text-xs text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded">
                  {text.length} caratteri
                </div>
              </div>
              <Textarea 
                id="voice-text"
                placeholder="Inserisci il testo da convertire in audio..."
                className="min-h-[150px] border-indigo-100 focus:ring-indigo-200"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-indigo-800">Esempi di testo</h4>
                  <div className="text-xs text-indigo-500">Clicca per utilizzare</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TEXT_EXAMPLES.map((example) => (
                    <div 
                      key={example.id}
                      className="border border-indigo-100 rounded-lg p-3 hover:bg-indigo-50 transition-colors cursor-pointer group"
                      onClick={() => setText(example.text)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{example.icon}</span>
                        <h5 className="font-medium text-indigo-700 text-sm group-hover:text-indigo-800">{example.title}</h5>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 group-hover:text-gray-700">{example.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="generate" className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
              <Label htmlFor="script-prompt" className="text-sm font-medium mb-2 block text-indigo-800">
                Descrizione del testo da generare
              </Label>
              <Textarea 
                id="script-prompt"
                placeholder="Descrivi cosa vuoi che venga detto nel voice-over..."
                className="min-h-[150px] border-indigo-100 focus:ring-indigo-200"
                value={scriptPrompt}
                onChange={(e) => setScriptPrompt(e.target.value)}
              />
            </div>
            <Button 
              variant="default" 
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              onClick={handleGenerateScript}
              disabled={generateScriptMutation.isPending}
            >
              {generateScriptMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generazione in corso...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Genera Testo
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
        
        <div className="space-y-6 mt-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100">
            <h3 className="text-base font-bold text-indigo-700 mb-4 flex items-center">
              <Volume2 className="mr-2 h-5 w-5 text-indigo-500" />
              Impostazioni Voce
            </h3>
            
            <div className="mb-5">
              <Label htmlFor="voice" className="text-sm font-medium mb-2 block text-indigo-800">
                Seleziona voce
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VOICES.map((voiceOption) => (
                  <div 
                    key={voiceOption.id}
                    className={cn(
                      "border rounded-lg p-3 cursor-pointer transition-all duration-200 flex flex-col items-center gap-1",
                      voice === voiceOption.id 
                        ? "border-indigo-500 bg-indigo-50 shadow-sm" 
                        : "border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50"
                    )}
                    onClick={() => setVoice(voiceOption.id)}
                  >
                    <div 
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full mb-1",
                        voice === voiceOption.id ? "bg-indigo-100" : "bg-gray-100"
                      )}
                      style={{
                        color: voice === voiceOption.id ? voiceOption.color : '#6B7280'
                      }}
                    >
                      <span className="text-lg">{voiceOption.emoji}</span>
                    </div>
                    <span className={cn(
                      "text-sm font-medium", 
                      voice === voiceOption.id ? "text-indigo-700" : "text-gray-700"
                    )}>
                      {voiceOption.name.split(' ')[0]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {voiceOption.language}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="bg-indigo-50/50 p-3 rounded-lg">
                <Label htmlFor="speed" className="text-sm font-medium mb-3 block text-indigo-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M19 5v14"></path>
                      <path d="M5 5v14"></path>
                      <path d="M5 9h14"></path>
                      <path d="M5 15h14"></path>
                    </svg>
                    <span>Velocità</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      onClick={() => setSpeed(Math.max(0.5, speed - 0.1))}
                    >-</button>
                    <span className="text-indigo-600 bg-white px-2 py-1 rounded-md text-xs font-bold border border-indigo-100">
                      {speed.toFixed(1)}x
                    </span>
                    <button 
                      type="button"
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      onClick={() => setSpeed(Math.min(2.0, speed + 0.1))}
                    >+</button>
                  </div>
                </Label>
                <Slider
                  id="speed"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[speed]}
                  onValueChange={(values) => setSpeed(values[0])}
                  className="mt-2"
                />
                <div className="flex justify-between mt-1 text-xs text-indigo-400">
                  <span>Lenta</span>
                  <span>Standard</span>
                  <span>Veloce</span>
                </div>
              </div>
              
              <div className="bg-indigo-50/50 p-3 rounded-lg">
                <Label htmlFor="pitch" className="text-sm font-medium mb-3 block text-indigo-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M2 12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2 2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
                      <path d="m7 8 5-5 5 5"></path>
                      <path d="m7 16 5 5 5-5"></path>
                    </svg>
                    <span>Tono</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      onClick={() => setPitch(Math.max(-10, pitch - 1))}
                    >-</button>
                    <span className="text-indigo-600 bg-white px-2 py-1 rounded-md text-xs font-bold border border-indigo-100 min-w-8 text-center">
                      {pitch > 0 ? `+${pitch}` : pitch}
                    </span>
                    <button 
                      type="button"
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      onClick={() => setPitch(Math.min(10, pitch + 1))}
                    >+</button>
                  </div>
                </Label>
                <Slider
                  id="pitch"
                  min={-10}
                  max={10}
                  step={1}
                  value={[pitch]}
                  onValueChange={(values) => setPitch(values[0])}
                  className="py-1"
                />
                <div className="flex justify-between mt-1 text-xs text-indigo-400">
                  <span>Grave</span>
                  <span>Neutro</span>
                  <span>Acuto</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            variant="default" 
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 py-6 rounded-xl"
            onClick={handleGenerateVoiceOver}
            disabled={!text.trim() || generating || generateVoiceOverMutation.isPending}
          >
            {(generating || generateVoiceOverMutation.isPending) ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generazione voice-over...
              </>
            ) : (
              <>
                <Volume2 className="mr-2 h-5 w-5" />
                {previewUrl ? 'Rigenera Voice-Over' : 'Genera Voice-Over'}
              </>
            )}
          </Button>
          <div className="text-center mt-2 text-xs text-indigo-500">
            {!previewUrl && !generating && 'L\'audio verrà generato utilizzando le impostazioni selezionate'}
          </div>
        </div>
        
        {previewUrl && (
          <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-indigo-700 flex items-center">
              <Volume2 className="mr-2 h-4 w-4 text-indigo-500" />
              Anteprima Audio
            </h3>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white rounded-full p-1.5 shadow-sm border border-indigo-100">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-12 w-12 rounded-full text-indigo-600",
                    isPlaying 
                      ? "bg-indigo-100 hover:bg-indigo-200" 
                      : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700"
                  )}
                  onClick={togglePlayback}
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                </Button>
              </div>
              
              <div className="flex-1 bg-white rounded-full p-2 shadow-sm border border-indigo-100">
                <div className="flex flex-col gap-1 relative">
                  <Progress 
                    value={progress} 
                    className="h-3 bg-indigo-100" 
                    style={{
                      background: "linear-gradient(to right, #e0e7ff 30%, #f3e8ff 100%)"
                    }}
                  />
                  <div className="flex justify-between text-xs font-medium text-indigo-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(audioElem?.duration || 0)}</span>
                  </div>
                  
                  {/* Waveform simulation */}
                  <div className="absolute top-0 left-0 right-0 h-3 overflow-hidden pointer-events-none opacity-30">
                    <div className="flex items-center justify-around h-full">
                      {Array.from({length: 30}).map((_, i) => (
                        <div 
                          key={i} 
                          className="bg-indigo-500 rounded-full w-1"
                          style={{
                            height: `${Math.max(15, Math.floor(Math.random() * 100))}%`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: VOICES.find(v => v.id === voice)?.color || '#4F46E5', opacity: 0.2 }}
                >
                  <span className="text-sm">{VOICES.find(v => v.id === voice)?.emoji}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-indigo-800">
                    {VOICES.find(v => v.id === voice)?.name || 'Voce'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {text.length} caratteri · {formatTime(audioElem?.duration || 0)} durata · {speed.toFixed(1)}x velocità
                  </div>
                </div>
                <div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-xs"
                    onClick={() => toast({
                      title: 'Audio scaricato',
                      description: 'Il file audio è stato scaricato con successo.'
                    })}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Scarica
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex items-center justify-between mt-6 pt-4 border-t border-indigo-100">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            Annulla
          </Button>
          <Button 
            variant="default"
            className={cn(
              "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200",
              !previewUrl && "opacity-50 cursor-not-allowed"
            )}
            onClick={handleSave}
            disabled={!previewUrl}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Salva e Applica
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}