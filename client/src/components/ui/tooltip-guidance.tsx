import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface TooltipStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
  action?: string;
}

interface TooltipGuidanceProps {
  steps: TooltipStep[];
  onComplete: () => void;
  onSkip: () => void;
  isActive: boolean;
}

export function TooltipGuidance({ steps, onComplete, onSkip, isActive }: TooltipGuidanceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    const step = steps[currentStep];
    const element = document.querySelector(step.target) as HTMLElement;
    
    if (element) {
      setTargetElement(element);
      element.classList.add("guidance-highlight");
      
      // Calculate tooltip position
      const rect = element.getBoundingClientRect();
      const tooltipWidth = 320;
      const tooltipHeight = 120;
      
      let top = 0;
      let left = 0;
      
      switch (step.position) {
        case "top":
          top = rect.top - tooltipHeight - 10;
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          break;
        case "bottom":
          top = rect.bottom + 10;
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          break;
        case "left":
          top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
          left = rect.left - tooltipWidth - 10;
          break;
        case "right":
          top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
          left = rect.right + 10;
          break;
      }
      
      // Ensure tooltip stays within viewport
      const maxLeft = window.innerWidth - tooltipWidth - 20;
      const maxTop = window.innerHeight - tooltipHeight - 20;
      
      left = Math.max(20, Math.min(left, maxLeft));
      top = Math.max(20, Math.min(top, maxTop));
      
      setTooltipPosition({ top, left });
      
      // Scroll element into view
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return () => {
      if (element) {
        element.classList.remove("guidance-highlight");
      }
    };
  }, [currentStep, isActive, steps]);

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
    if (targetElement) {
      targetElement.classList.remove("guidance-highlight");
    }
    onComplete();
  };

  const handleSkip = () => {
    if (targetElement) {
      targetElement.classList.remove("guidance-highlight");
    }
    onSkip();
  };

  if (!isActive || steps.length === 0) return null;

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Tooltip */}
      <Card
        className="fixed z-50 w-80 p-6 bg-white shadow-xl border-2 border-primary"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
        data-testid="guidance-tooltip"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {currentStepData.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600"
            data-testid="guidance-close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {currentStepData.action && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              💡 Try this: {currentStepData.action}
            </p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              data-testid="guidance-previous"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <Button
              size="sm"
              onClick={handleNext}
              data-testid="guidance-next"
            >
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
              {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 text-xs"
            data-testid="guidance-skip"
          >
            Skip this tutorial
          </Button>
        </div>
      </Card>
    </>
  );
}

export function GuidanceProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="guidance-container">
      {children}
    </div>
  );
}