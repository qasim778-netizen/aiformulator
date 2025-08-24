import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Settings, BarChart, FileText, Beaker } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

export default function AIFormulatorWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showWizard, setShowWizard] = useState(false);
  const { toast } = useToast();

  const steps = [
    { title: "Product Type", icon: "✓" },
    { title: "Specifications", icon: "⚙️" },
    { title: "Requirements", icon: "📋" },
    { title: "Generate", icon: "✏️" }
  ];

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

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
  };

  const generateFormulation = useMutation({
    mutationFn: async (data: FormData) => {
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
      <Card className="w-full max-w-6xl mx-auto shadow-lg bg-gradient-to-br from-blue-50 to-white" data-testid="ai-formulator-landing">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                <Beaker className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ChemFormulaPro AI Agent</h1>
                <p className="text-xs text-gray-600">FREE Professional Formulation Tool</p>
              </div>
            </div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
              100% FREE
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Left Column - Main Content */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Create Perfect Formulations
              </h2>
              <p className="text-gray-600 mb-4 text-sm">
                Advanced AI-powered formulation platform with precise specifications, manufacturing 
                protocols, and comprehensive documentation.
              </p>

              {/* Feature Highlights - Ultra Compact */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="bg-green-100 text-green-600 p-1.5 rounded">
                    <Settings className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">Technical Precision</span>
                    <p className="text-xs text-gray-600">Lab-grade accuracy with precise pH and viscosity control</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-orange-100 text-orange-600 p-1.5 rounded">
                    <BarChart className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">Cost Optimization</span>
                    <p className="text-xs text-gray-600">Budget-optimized ingredient selection</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-100 text-blue-600 p-1.5 rounded">
                    <FileText className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">Professional Reports</span>
                    <p className="text-xs text-gray-600">Industry-standard documentation and protocols</p>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <Button
                onClick={() => setShowWizard(true)}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
                data-testid="button-start-formulation"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Start New Formulation
              </Button>

              {/* Footer Text */}
              <p className="text-xs text-gray-500 mt-3 flex items-center">
                <span className="mr-1">🔓</span>
                100% Free • No Registration • Professional Results
              </p>
            </div>

            {/* Right Column - Visual Elements */}
            <div className="hidden lg:block">
              <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <div className="text-center mb-3">
                  <div className="bg-blue-600 text-white p-3 rounded-lg w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <Beaker className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Ready to Start?</h3>
                  <p className="text-xs text-gray-600">4-step guided process</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center text-xs">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2">1</div>
                    <span className="text-gray-700">Select product type & category</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2">2</div>
                    <span className="text-gray-700">Define technical specifications</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2">3</div>
                    <span className="text-gray-700">Set budget & requirements</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2">4</div>
                    <span className="text-gray-700">Generate & download PDF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg" data-testid="ai-formulator-wizard">
      <CardContent className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white p-3 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <Beaker className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-blue-600 mb-2">Formulation Process</h2>
          <p className="text-blue-600">
            <span className="bg-blue-100 px-2 py-1 rounded-full text-sm font-medium">
              Step {currentStep + 1} of {steps.length}
            </span>
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-8 px-4">
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
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="min-h-96">
          {currentStep === 0 && (
            <ProductTypeStep 
              formData={formData} 
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 1 && (
            <SpecificationsStep 
              formData={formData} 
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 2 && (
            <RequirementsStep 
              formData={formData} 
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 3 && (
            <GenerateStep 
              formData={formData} 
              generateFormulation={generateFormulation}
              onBack={prevStep}
            />
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