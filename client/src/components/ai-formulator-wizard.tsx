import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Settings, BarChart, FileText, Beaker } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HelpButton } from "@/components/ui/help-button";
import { validateProductName } from "@/lib/validate-product-name";
import { useAuth } from "@/hooks/useAuth";
import ProductTypeStep from "./wizard-steps/product-type-step";
import SpecificationsStep from "./wizard-steps/specifications-step";
import RequirementsStep from "./wizard-steps/requirements-step";
import GenerateStep from "./wizard-steps/generate-step";

interface FormData {
  // Step 1 — structured product identity
  category: string;
  productType: string;
  performanceLevel: string;
  baseType: string;
  productName: string;
  consistencyType: string; // derived from baseType for backward-compat

  // Specifications
  volume: string;
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

interface PropertyWithMeta {
  name: string;
  compulsory: boolean;
}

interface DynamicPropertiesProps {
  availableProperties: PropertyWithMeta[];
}

// Smart initial defaults
const getInitialFormData = (): FormData => {
  return {
    // Step 1
    category: "",
    productType: "",
    performanceLevel: "",
    baseType: "",
    productName: "",
    consistencyType: "cream",
    // Specifications
    viscosity: "High",
    volume: "50ml",
    specialProperties: [],
    phLevel: 7,
    shelfLife: 12,
    storageTemperature: "Room Temperature (15-25°C)",
    // Requirements
    budgetCategory: "Medium Quality",
    productionVolume: "Small Batch (1-100 units)",
    regulatoryRequirements: [],
    additionalNotes: "",
  };
};

const initialFormData: FormData = getInitialFormData();

interface AIFormulatorWizardProps {
  onWizardStateChange?: (isActive: boolean) => void;
}

export interface AIFormulatorWizardHandle {
  start: () => void;
}

const AIFormulatorWizard = forwardRef<AIFormulatorWizardHandle, AIFormulatorWizardProps>(
  function AIFormulatorWizard({ onWizardStateChange } = {}, ref) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showWizard, setShowWizard] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const requireAuth = () => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return false;
    }
    return true;
  };

  useImperativeHandle(ref, () => ({
    start() {
      if (!requireAuth()) return;
      setShowWizard(true);
      onWizardStateChange?.(true);
    },
  }));

  // Fetch properties dynamically from AI based on product name
  const { data: availableProperties = [], isLoading: propertiesLoading } = useQuery<PropertyWithMeta[]>({
    queryKey: ["/api/product-properties", formData.productName],
    queryFn: async () => {
      if (!formData.productName) {
        return [
          { name: 'Professional grade', compulsory: true },
          { name: 'Enhanced formula', compulsory: false },
          { name: 'High quality', compulsory: true },
          { name: 'Reliable performance', compulsory: false }
        ];
      }
      
      const response = await fetch(`/api/product-properties/${encodeURIComponent(formData.productName)}?description=${encodeURIComponent(formData.consistencyType)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json();
    },
    enabled: !!formData.productName,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1
  });

  const steps = [
    { title: "Product Name & Type", icon: "✓" },
    { title: "Specifications", icon: "⚙️" },
    { title: "Requirements", icon: "📋" },
    { title: "Generate", icon: "✏️" }
  ];

  // Smart consistency type selection based on product name
  const getSmartConsistencyType = (productName?: string): string => {
    const nameLower = (productName || '').toLowerCase();
    
    // Product name-based detection
    if (nameLower.includes('cleaner') || nameLower.includes('glass') || nameLower.includes('window')) return 'liquid';
    if (nameLower.includes('cream') || nameLower.includes('moisturizer') || nameLower.includes('lotion')) return 'cream';
    if (nameLower.includes('paste') || nameLower.includes('ointment')) return 'cream';
    if (nameLower.includes('gel') || nameLower.includes('aloe')) return 'gel';
    if (nameLower.includes('powder') || nameLower.includes('foundation') || nameLower.includes('dry')) return 'powder';
    if (nameLower.includes('scrub') || nameLower.includes('exfoliant')) return 'cream';
    if (nameLower.includes('shampoo') || nameLower.includes('soap') || nameLower.includes('wash')) return 'liquid';
    if (nameLower.includes('oil') || nameLower.includes('serum')) return 'liquid';
    if (nameLower.includes('balm') || nameLower.includes('stick') || nameLower.includes('wax')) return 'cream';
    
    // Default fallback
    return 'cream';
  };

  // Smart volume selection based on product name
  const getSmartDefaultVolume = (productName?: string): string => {
    const nameLower = (productName || '').toLowerCase();
    
    // Product name-based detection
    if (nameLower.includes('serum') || nameLower.includes('essence') || nameLower.includes('oil')) return '30ml';
    if (nameLower.includes('eye') || nameLower.includes('spot') || nameLower.includes('treatment')) return '15ml';
    if (nameLower.includes('toner') || nameLower.includes('mist') || nameLower.includes('spray')) return '100ml';
    if (nameLower.includes('shampoo') || nameLower.includes('conditioner') || nameLower.includes('wash')) return '100ml';
    if (nameLower.includes('cleaner') || nameLower.includes('detergent')) return '100ml';
    if (nameLower.includes('cream') || nameLower.includes('moisturizer') || nameLower.includes('lotion')) return '50ml';
    if (nameLower.includes('mask') || nameLower.includes('scrub')) return '50ml';
    if (nameLower.includes('balm') || nameLower.includes('ointment')) return '30ml';
    if (nameLower.includes('toothpaste') || nameLower.includes('gel')) return '50ml';
    if (nameLower.includes('mouthwash')) return '100ml';
    
    // Default fallback
    return '50ml';
  };

  // Smart viscosity selection based on consistency type and product name
  const getSmartViscosity = (consistencyType: string, productName?: string): string => {
    const nameLower = (productName || '').toLowerCase();
    
    // Product name-based detection (highest priority)
    if (nameLower.includes('serum') || nameLower.includes('essence')) return 'Low';
    if (nameLower.includes('oil') || nameLower.includes('toner')) return 'Low';
    if (nameLower.includes('cleaner') || nameLower.includes('spray') || nameLower.includes('glass')) return 'Low';
    if (nameLower.includes('shampoo') || nameLower.includes('wash')) return 'Medium';
    if (nameLower.includes('cream') || nameLower.includes('moisturizer')) return 'High';
    if (nameLower.includes('paste') || nameLower.includes('balm') || nameLower.includes('ointment')) return 'High';
    if (nameLower.includes('gel') && nameLower.includes('hair')) return 'High';
    if (nameLower.includes('mask') || nameLower.includes('treatment')) return 'High';
    if (nameLower.includes('wax') || nameLower.includes('pomade')) return 'High';
    
    // Consistency type-based defaults
    if (consistencyType === 'liquid') return 'Low';
    if (consistencyType === 'cream') return 'High';
    if (consistencyType === 'gel') return 'Medium';
    if (consistencyType === 'powder') return 'High';
    
    // Default fallback
    return 'Medium';
  };

  // Intelligent Default Properties Mapper based on product name
  const getSmartDefaultProperties = (productName?: string, availableProps: PropertyWithMeta[] = []): string[] => {
    const nameLower = (productName || '').toLowerCase();
    const defaultProperties: string[] = [];
    
    // ALWAYS add all compulsory properties first
    const compulsoryProps = availableProps.filter(p => p.compulsory).map(p => p.name);
    defaultProperties.push(...compulsoryProps);
    
    // Helper function to add optional property if it exists in available props
    const addProperty = (prop: string) => {
      const found = availableProps.find(p => 
        !p.compulsory && p.name.toLowerCase().includes(prop.toLowerCase())
      );
      if (found && !defaultProperties.includes(found.name)) {
        defaultProperties.push(found.name);
      }
    };
    
    // Product name-based intelligent selection
    if (nameLower.includes('anti-aging') || nameLower.includes('wrinkle') || nameLower.includes('firming')) {
      addProperty('Anti-aging');
      addProperty('Long-lasting');
    }
    
    if (nameLower.includes('moisturizer') || nameLower.includes('hydrating') || nameLower.includes('dry skin')) {
      addProperty('Moisturizing');
      addProperty('Gentle formula');
    }
    
    if (nameLower.includes('acne') || nameLower.includes('blemish') || nameLower.includes('pimple')) {
      addProperty('Antibacterial');
      addProperty('Non-toxic');
    }
    
    if (nameLower.includes('whitening') || nameLower.includes('brightening') || nameLower.includes('lightening')) {
      addProperty('Whitening');
      addProperty('Enhanced formula');
    }
    
    if (nameLower.includes('sensitive') || nameLower.includes('gentle') || nameLower.includes('baby')) {
      addProperty('Gentle formula');
      addProperty('Hypoallergenic');
    }
    
    if (nameLower.includes('sun') || nameLower.includes('spf') || nameLower.includes('uv')) {
      addProperty('UV Protection');
      addProperty('Professional grade');
    }
    
    if (nameLower.includes('cleaner') || nameLower.includes('cleaning')) {
      addProperty('Antibacterial');
      addProperty('Eco-friendly');
    }
    
    if (nameLower.includes('eco') || nameLower.includes('green') || nameLower.includes('natural')) {
      addProperty('Eco-friendly');
      addProperty('Natural ingredients');
    }
    
    if (nameLower.includes('stain') || nameLower.includes('spot')) {
      addProperty('Professional grade');
      addProperty('Long-lasting');
    }
    
    // Default properties if none were selected (only add if no optional properties were added)
    const optionalProps = defaultProperties.filter(
      prop => !compulsoryProps.some(cp => cp === prop)
    );
    if (optionalProps.length === 0) {
      addProperty('Professional grade');
      addProperty('Enhanced formula');
    }
    
    // Return all compulsory properties + limited optional properties
    // Ensure we never remove compulsory properties, only limit optional ones
    const finalCompulsory = compulsoryProps;
    const finalOptional = defaultProperties
      .filter(prop => !compulsoryProps.includes(prop))
      .slice(0, 2); // Limit optional properties to 2
    
    return [...finalCompulsory, ...finalOptional];
  };

  const updateFormData = (data: Partial<FormData>) => {
    let updatedData = { ...data };
    
    // Auto-select consistency type, volume, and viscosity when product name changes
    if (data.productName && data.productName !== formData.productName) {
      const smartConsistency = getSmartConsistencyType(data.productName);
      const smartVolume = getSmartDefaultVolume(data.productName);
      
      updatedData.consistencyType = smartConsistency;
      updatedData.volume = smartVolume;
      
      // Auto-select smart viscosity based on consistency type
      const smartViscosity = getSmartViscosity(smartConsistency, data.productName);
      updatedData.viscosity = smartViscosity;
      
      // Auto-select intelligent default properties based on product name
      const smartProperties = getSmartDefaultProperties(
        data.productName, 
        Array.isArray(availableProperties) ? availableProperties : []
      );
      updatedData.specialProperties = smartProperties;
    }
    
    
    // Auto-update viscosity when consistency type changes manually
    if (data.consistencyType && data.consistencyType !== formData.consistencyType) {
      const smartViscosity = getSmartViscosity(data.consistencyType, formData.productName);
      updatedData.viscosity = smartViscosity;
    }
    
    const newFormData = { ...formData, ...updatedData };
    setFormData(newFormData);
  };

  // Auto-select compulsory and intelligent properties when properties are loaded
  useEffect(() => {
    // Ensure properties are loaded and product name is set
    if (formData.productName && availableProperties.length > 0 && !propertiesLoading) {
      // Get all compulsory properties
      const compulsoryProps = availableProperties
        .filter(p => p.compulsory)
        .map(p => p.name);
      
      // Check if we need to add compulsory properties
      const missingCompulsory = compulsoryProps.filter(
        prop => !formData.specialProperties.includes(prop)
      );
      
      // If there are missing compulsory properties OR no properties selected at all, refresh the selection
      if (missingCompulsory.length > 0 || formData.specialProperties.length === 0) {
        const smartProperties = getSmartDefaultProperties(
          formData.productName, 
          availableProperties
        );
        
        if (smartProperties.length > 0) {
          setFormData(prev => ({
            ...prev,
            specialProperties: smartProperties
          }));
        }
      }
    }
  }, [formData.productName, availableProperties, propertiesLoading]);

  const nextStep = () => {
    if (currentStep === 0) {
      if (!formData.category) {
        toast({ title: "Select a Category", description: "Please choose a product category to continue.", variant: "destructive" });
        return;
      }
      if (!formData.productType) {
        toast({ title: "Select a Product Type", description: "Please choose a product type to continue.", variant: "destructive" });
        return;
      }
      if (!formData.performanceLevel) {
        toast({ title: "Choose Performance Level", description: "Please select a performance level to continue.", variant: "destructive" });
        return;
      }
      if (!formData.baseType) {
        toast({ title: "Select Base Type", description: "Please choose a base type to continue.", variant: "destructive" });
        return;
      }
      if (!formData.productName || formData.productName.trim().length < 3) {
        toast({ title: "Product Name Required", description: "Please enter a product name (minimum 3 characters).", variant: "destructive" });
        return;
      }
      if (formData.productName.length > 80) {
        toast({ title: "Product Name Too Long", description: "Product name must be 80 characters or fewer.", variant: "destructive" });
        return;
      }
      const nameCheck = validateProductName(formData.productName);
      if (!nameCheck.valid) {
        toast({ title: "Invalid Product Name", description: nameCheck.error, variant: "destructive" });
        return;
      }
    }

    if (currentStep === 1) {
      if (!formData.viscosity) {
        toast({ title: "Select Viscosity", description: "Please choose a target viscosity to continue.", variant: "destructive" });
        return;
      }
      if (!formData.storageTemperature) {
        toast({ title: "Select Storage Temperature", description: "Please choose a storage temperature to continue.", variant: "destructive" });
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.budgetCategory) {
        toast({ title: "Select Budget Category", description: "Please choose a budget category to continue.", variant: "destructive" });
        return;
      }
      if (!formData.productionVolume) {
        toast({ title: "Select Production Volume", description: "Please choose your production volume to continue.", variant: "destructive" });
        return;
      }
    }

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
            productType: data.consistencyType.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            additionalNote: data.additionalNotes,
          });
        } catch (error) {
          console.warn("Failed to save user note:", error);
        }
      }

      const requestData = {
        productName: data.productName,
        productDescription: `${data.consistencyType} formulation with ${data.specialProperties.join(', ')} properties`,
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
      <Card className="w-full max-w-4xl mx-auto shadow-lg bg-gradient-to-br from-teal-50 to-white overflow-hidden" data-testid="ai-formulator-landing">
        <CardContent className="p-3 text-center w-full box-border">
          {/* Header */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary text-white p-3 rounded-xl">
              <Beaker className="h-6 w-6" />
            </div>
          </div>


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
              <div className="bg-teal-100 text-teal-600 p-3 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Reports</h3>
              <p className="text-gray-600 mb-3 text-sm">
                Comprehensive documentation with batch records, quality protocols, and specifications
              </p>
              <div className="flex items-center justify-center">
                <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                  🏭 Industry Standard
                </span>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={() => {
              if (!requireAuth()) return;
              setShowWizard(true);
              onWizardStateChange?.(true);
            }}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            data-testid="button-start-formulation"
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Start New Formulation
          </Button>

          {/* Footer Text */}
          <p className="text-xs text-gray-500 mt-4 flex items-center justify-center">
            <span className="mr-2">🔓</span>
            Free Account • Secure Access • Professional-Grade Results
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
          <h2 className="text-xl font-bold text-primary mb-2">Formulation Process</h2>
          <p className="text-primary">
            <span className="bg-teal-100 px-2 py-1 rounded-full text-sm font-medium">
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
                  ? 'bg-primary border-primary text-white' 
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}>
                {index < currentStep ? '✓' : step.icon}
              </div>
              <span className={`text-sm font-medium mt-2 transition-colors duration-300 ${
                index <= currentStep ? 'text-primary' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className="absolute top-6 left-1/2 transform -translate-y-1/2 w-full h-0.5 bg-gray-200 -z-10">
                  <div 
                    className={`h-full bg-primary transition-all duration-500 ${
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
                availableProperties={availableProperties || []}
                propertiesLoading={propertiesLoading}
                productName={formData.productName}
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
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
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
});

export default AIFormulatorWizard;