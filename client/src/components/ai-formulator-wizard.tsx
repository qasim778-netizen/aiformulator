import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Settings, BarChart, FileText, Beaker } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HelpButton } from "@/components/ui/help-button";
import { useGuidance } from "@/hooks/use-guidance";
import ProductTypeStep from "./wizard-steps/product-type-step";
import SpecificationsStep from "./wizard-steps/specifications-step";
import RequirementsStep from "./wizard-steps/requirements-step";
import GenerateStep from "./wizard-steps/generate-step";

interface FormData {
  // Product Type
  productName: string;
  productCategory: string;
  consistencyType: string;
  
  // Specifications
  viscosity: string;
  specialProperties: string[];
  phLevel: number;
  shelfLife: number;
  storageTemperature: string;
  
  // Requirements
  budgetCategory: string;
  productionVolume: string;
  regulatoryRequirements: string[];
  additionalNotes: string;
}

interface DynamicPropertiesProps {
  productCategory: string;
  availableProperties: string[];
}

const initialFormData: FormData = {
  productName: "",
  productCategory: "",
  consistencyType: "",
  viscosity: "",
  specialProperties: [],
  phLevel: 7,
  shelfLife: 12,
  storageTemperature: "",
  budgetCategory: "",
  productionVolume: "",
  regulatoryRequirements: [],
  additionalNotes: "",
};

interface AIFormulatorWizardProps {
  onWizardStateChange?: (isActive: boolean) => void;
}

export default function AIFormulatorWizard({ onWizardStateChange }: AIFormulatorWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showWizard, setShowWizard] = useState(false);
  const [dynamicProperties, setDynamicProperties] = useState<string[]>([]);
  const { startGuidance, isCompleted } = useGuidance();
  const { toast } = useToast();

  // Query for dynamic special properties based on product category
  const { data: availableProperties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/product-properties', formData.productCategory],
    enabled: !!formData.productCategory,
  });

  const steps = [
    { title: "Product Type", icon: "✓" },
    { title: "Specifications", icon: "⚙️" },
    { title: "Requirements", icon: "📋" },
    { title: "Generate", icon: "✏️" }
  ];

  const updateFormData = (data: Partial<FormData>) => {
    const newFormData = { ...formData, ...data };
    setFormData(newFormData);
    
    // Update dynamic properties when product category changes
    if (data.productCategory && data.productCategory !== formData.productCategory) {
      // Clear existing special properties when category changes
      setFormData(prev => ({ ...prev, ...data, specialProperties: [] }));
    }
  };

  // Update dynamic properties when available properties change
  useEffect(() => {
    if (availableProperties && Array.isArray(availableProperties)) {
      setDynamicProperties(availableProperties);
    }
  }, [availableProperties]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setFormData(initialFormData);
    setShowWizard(false);
    onWizardStateChange?.(false);
  };

  const saveUserNote = useMutation({
    mutationFn: async (data: { productType: string; additionalNote: string }) => {
      const response = await fetch("/api/user-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save user note");
      }

      return response.json();
    },
  });

  const generateFormulation = useMutation({
    mutationFn: async (data: FormData) => {
      // Save user note for future recommendations if additional notes exist
      if (data.additionalNotes && data.additionalNotes.trim().length > 0) {
        try {
          await saveUserNote.mutateAsync({
            productType: data.productCategory.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            additionalNote: data.additionalNotes,
          });
        } catch (error) {
          console.warn("Failed to save user note:", error);
        }
      }

      const requestData = {
        productName: data.productName,
        productDescription: `${data.productCategory} - ${data.consistencyType} formulation with ${data.specialProperties.join(', ')} properties`,
        productType: data.consistencyType.toLowerCase(),
        phLevel: data.phLevel.toString(),
        costLevel: data.budgetCategory === 'Cost-Effective' ? 'cost_effective' : data.budgetCategory === 'Medium Quality' ? 'medium' : 'expensive',
        viscosity: data.viscosity,
        specialRequirements: `${data.specialProperties.join(', ')}. ${data.regulatoryRequirements.join(', ')}. ${data.additionalNotes}`,
      };

      const response = await fetch("/api/ai/custom-formulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate formulation");
      }

      const pdfBlob = await response.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.productName.replace(/\s+/g, '_')}_formulation.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Formulation Generated Successfully!",
        description: "Your PDF has been downloaded",
      });
      resetWizard();
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  if (!showWizard) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg bg-gradient-to-br from-blue-50 to-white overflow-hidden" data-testid="ai-formulator-landing">
        <CardContent className="p-3 text-center w-full box-border">
          {/* Header */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 text-white p-3 rounded-xl">
              <Beaker className="h-6 w-6" />
            </div>
          </div>

          {/* Main Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Perfect Formulations
          </h2>
          <p className="text-gray-600 mb-4 max-w-2xl mx-auto text-sm">
            Advanced AI-powered formulation platform with precise specifications, manufacturing 
            protocols, and comprehensive documentation.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 overflow-hidden">
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <div className="bg-green-100 text-green-600 p-3 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Settings className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Precision</h3>
              <p className="text-gray-600 mb-3 text-sm">
                Scientific accuracy with precise pH levels, viscosity parameters, and validated specifications
              </p>
              <div className="flex items-center justify-center">
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                  ✓ Lab-Grade Accuracy
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <div className="bg-orange-100 text-orange-600 p-3 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <BarChart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cost Optimization</h3>
              <p className="text-gray-600 mb-3 text-sm">
                Intelligent ingredient selection to maximize quality while minimizing production costs
              </p>
              <div className="flex items-center justify-center">
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                  $ Budget-Optimized
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Reports</h3>
              <p className="text-gray-600 mb-3 text-sm">
                Comprehensive documentation with batch records, quality protocols, and specifications
              </p>
              <div className="flex items-center justify-center">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                  🏭 Industry Standard
                </span>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={() => {
              setShowWizard(true);
              onWizardStateChange?.(true);
              
              // Start guidance for first-time users
              if (!isCompleted("ai-formulator")) {
                setTimeout(() => {
                  startGuidance("ai-formulator");
                }, 500);
              }
            }}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            data-testid="button-start-formulation"
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Start New Formulation
          </Button>

          {/* Footer Text */}
          <p className="text-xs text-gray-500 mt-4 flex items-center justify-center">
            <span className="mr-2">🔓</span>
            100% Free • No Registration Required • Professional Results
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg overflow-hidden" data-testid="ai-formulator-wizard">
      <CardContent className="p-4 w-full box-border">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-blue-600 mb-2">Formulation Process</h2>
          <p className="text-blue-600">
            <span className="bg-blue-100 px-2 py-1 rounded-full text-sm font-medium">
              Step {currentStep + 1} of {steps.length}
            </span>
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-4 px-2 w-full overflow-hidden">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                index <= currentStep 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}>
                {index < currentStep ? '✓' : step.icon}
              </div>
              <span className={`text-sm font-medium mt-2 transition-colors duration-300 ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className="absolute top-6 left-1/2 transform -translate-y-1/2 w-full h-0.5 bg-gray-200 -z-10">
                  <div 
                    className={`h-full bg-blue-600 transition-all duration-500 ${
                      index < currentStep ? 'w-full' : 'w-0'
                    }`} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="min-h-80 w-full overflow-hidden">
          {currentStep === 0 && (
            <div data-testid="wizard-step-1">
              <ProductTypeStep 
                formData={formData} 
                updateFormData={updateFormData}
              />
            </div>
          )}
          {currentStep === 1 && (
            <div data-testid="wizard-step-2">
              <SpecificationsStep 
                formData={formData} 
                updateFormData={updateFormData}
                availableProperties={dynamicProperties}
                propertiesLoading={propertiesLoading}
              />
            </div>
          )}
          {currentStep === 2 && (
            <div data-testid="wizard-step-3">
              <RequirementsStep 
                formData={formData} 
                updateFormData={updateFormData}
              />
            </div>
          )}
          {currentStep === 3 && (
            <div data-testid="wizard-step-4">
              <GenerateStep 
                formData={formData} 
                generateFormulation={generateFormulation}
                onBack={prevStep}
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep < 3 && (
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Button
              onClick={prevStep}
              disabled={currentStep === 0}
              variant="outline"
              className="px-6 py-3"
              data-testid="button-previous-step"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              data-testid="button-next-step"
            >
              Next Step
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}