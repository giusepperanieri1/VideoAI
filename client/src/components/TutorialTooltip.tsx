import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
  id: number;
  title: string;
  content: string;
  position: 'top' | 'right' | 'bottom' | 'left' | 'center';
  targetElement?: string;
  width?: number;
}

interface TutorialTooltipProps {
  steps: TutorialStep[];
  onComplete?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialTooltip({ steps, onComplete, isOpen, onClose }: TutorialTooltipProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  // Posiziona il tooltip rispetto all'elemento target
  useEffect(() => {
    if (!isOpen || !steps[currentStep]?.targetElement) {
      setShowTooltip(false);
      return;
    }

    const positionTooltip = () => {
      const targetElement = document.querySelector(steps[currentStep].targetElement as string);
      if (!targetElement) {
        // Se non trova l'elemento target, posiziona al centro
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        setTooltipPosition({
          left: viewportWidth / 2 - 150,
          top: viewportHeight / 2 - 100
        });
        setShowTooltip(true);
        return;
      }
      
      const rect = targetElement.getBoundingClientRect();
      const tooltipWidth = steps[currentStep].width || 300;
      const tooltipHeight = 180; // Altezza stimata del tooltip
      
      // Calcola la posizione in base alla direzione specificata
      let top = 0;
      let left = 0;
      
      switch (steps[currentStep].position) {
        case 'top':
          top = rect.top - tooltipHeight - 10;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + 10;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - 10;
          break;
        case 'center':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
      }
      
      // Assicurati che il tooltip rimanga all'interno della viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (left < 20) left = 20;
      if (left + tooltipWidth > viewportWidth - 20) left = viewportWidth - tooltipWidth - 20;
      if (top < 20) top = 20;
      if (top + tooltipHeight > viewportHeight - 20) top = viewportHeight - tooltipHeight - 20;
      
      setTooltipPosition({ top, left });
      setShowTooltip(true);
    };
    
    // Posiziona il tooltip e aggiungi event listener per il resize
    positionTooltip();
    window.addEventListener('resize', positionTooltip);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', positionTooltip);
    };
  }, [isOpen, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onClose();
    if (onComplete) onComplete();
    
    // Salva che il tutorial è stato completato
    localStorage.setItem('tutorialCompleted', 'true');
  };

  if (!isOpen || !showTooltip) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={handleComplete}
      />
      
      <div 
        className={cn(
          "fixed z-50 rounded-lg shadow-xl bg-white border border-gray-200 p-5",
          "w-[300px] transition-all duration-200 ease-in-out"
        )}
        style={{ 
          top: `${tooltipPosition.top}px`, 
          left: `${tooltipPosition.left}px`,
          width: `${steps[currentStep].width || 300}px`
        }}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-100 border border-gray-300 hover:bg-gray-200"
          onClick={handleComplete}
        >
          <X className="h-3 w-3" />
        </Button>
        
        <div className="flex items-center mb-1 text-indigo-600">
          <HelpCircle className="h-4 w-4 mr-1" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Tutorial {currentStep + 1} di {steps.length}
          </span>
        </div>
        
        <h3 className="text-base font-bold mb-1 text-gray-900">
          {steps[currentStep].title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          {steps[currentStep].content}
        </p>
        
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="h-8 px-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Indietro
          </Button>
          
          <div className="flex items-center">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "mx-0.5 h-1.5 w-1.5 rounded-full",
                  index === currentStep ? "bg-indigo-600" : "bg-gray-300"
                )}
              />
            ))}
          </div>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={handleNext}
            className="h-8 px-2 bg-indigo-600 hover:bg-indigo-700"
          >
            {currentStep < steps.length - 1 ? (
              <>Avanti <ChevronRight className="h-4 w-4 ml-1" /></>
            ) : "Completa"}
          </Button>
        </div>
      </div>
    </>
  );
}

export default TutorialTooltip;