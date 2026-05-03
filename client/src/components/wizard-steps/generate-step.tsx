import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, Beaker, Settings, FileText, Download, Loader2, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Captcha } from '@/components/ui/captcha';
interface FormData {
  // Step 1
  category: string;
  productType: string;
  performanceLevel: string;
  baseType: string;
  productName: string;
  consistencyType: string;
  volume: string;
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

interface GenerateStepProps {
  formData: FormData;
  onBack: () => void;
}

export default function GenerateStep({ formData, onBack }: GenerateStepProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);

  const formatPropertyName = (prop: string) => {
    return prop.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const GENERATION_TIMEOUT_MS = 90_000; // 90 seconds

  const generateFormulation = useMutation({
    mutationFn: async (data: FormData) => {
      const requestData = {
        productName: data.productName || 'Custom Product',
        productDescription: `${data.productType || data.consistencyType} ${data.baseType ? `(${data.baseType})` : ''} formulation with ${data.specialProperties.join(', ') || 'standard'} properties`,
        productType: data.productType || data.consistencyType || 'cream',
        category: data.category || '',
        performanceLevel: data.performanceLevel || 'Standard',
        baseType: data.baseType || '',
        phLevel: data.phLevel || 7,
        costLevel: data.budgetCategory || 'Medium Quality',
        budgetCategory: data.budgetCategory || 'Medium Quality',
        viscosity: data.viscosity || 'Medium',
        shelfLife: data.shelfLife || 12,
        storageTemperature: data.storageTemperature || 'Room Temperature',
        productionVolume: data.productionVolume || '',
        color: 'Default',
        fragrance: 'Default',
        specialRequirements: [
          ...data.specialProperties,
          ...data.regulatoryRequirements,
          data.additionalNotes
        ].filter(Boolean).join(', '),
        logoSettings: {
          showLogo: true,
          companyName: 'AIFormulator.com'
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

      try {
        const response = await fetch('/api/ai/custom-formulation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Server error (${response.status}). Please try again.`);
        }

        const result = await response.json();
        return result.formulation;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new Error('Generation timed out after 90 seconds. The AI is under heavy load — please try again in a moment.');
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    onSuccess: (formulation: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/generated'] });
      setLocation(`/formulation-confirmation/${formulation.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate formulation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!isCaptchaVerified) {
      toast({
        title: "Verification Required",
        description: "Please complete the captcha verification first.",
        variant: "destructive",
      });
      return;
    }
    
    generateFormulation.mutate(formData);
  };

  const handleCaptchaVerify = (isValid: boolean) => {
    console.log('GenerateStep: Captcha verification received:', isValid);
    setIsCaptchaVerified(isValid);
  };

  const resetCaptcha = () => {
    setIsCaptchaVerified(false);
    setCaptchaKey(prev => prev + 1);
  };

  // Reset captcha after generation completes (success or error)
  useEffect(() => {
    if (!generateFormulation.isPending && (generateFormulation.isSuccess || generateFormulation.isError)) {
      const timer = setTimeout(() => {
        resetCaptcha();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [generateFormulation.isPending, generateFormulation.isSuccess, generateFormulation.isError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Single View Professional Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4">
        {/* Header with Title and Status */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg shadow-md">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Ready to Generate</h2>
                <p className="text-sm text-gray-600">Professional chemical formulation configured</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Step 4 of 4</p>
              <p className="text-xs text-gray-500">100% Complete</p>
            </div>
          </div>
        </div>

        {/* Main Content - Formulation Summary */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Formulation Summary</h3>
            <p className="text-gray-600 text-xs mt-1">Review your configuration before generating</p>
          </div>
          
          <div className="p-4">
            {/* Top Row - 4 Main Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {/* Product Details */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="bg-blue-600 p-1 rounded">
                    <Beaker className="h-3 w-3 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-xs">Product Details</h4>
                </div>
                <div className="space-y-1">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Name</Label>
                    <p className="text-gray-900 font-medium text-xs truncate" title={formData.productName}>{formData.productName || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Type</Label>
                    <span className="inline-block px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded text-xs font-medium capitalize">
                      {formData.consistencyType || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="bg-purple-600 p-1 rounded">
                    <Settings className="h-3 w-3 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-xs">Technical Specs</h4>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">pH</Label>
                    <p className="text-purple-700 font-medium">{formData.phLevel}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Viscosity</Label>
                    <p className="text-gray-800 capitalize truncate">{formData.viscosity || "Standard"}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Shelf Life</Label>
                    <p className="text-gray-800">{formData.shelfLife} months</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Storage</Label>
                    <p className="text-gray-800 truncate" title={formData.storageTemperature}>{formData.storageTemperature || "Room temp"}</p>
                  </div>
                </div>
              </div>

              {/* Special Properties */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="bg-green-600 p-1 rounded">
                    <FileText className="h-3 w-3 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-xs">Special Properties</h4>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.specialProperties.length > 0 ? (
                    formData.specialProperties.slice(0, 4).map((prop: string) => (
                      <span key={prop} className="px-1.5 py-0.5 bg-green-200 text-green-800 rounded text-xs font-medium">
                        {formatPropertyName(prop)}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-xs">None specified</span>
                  )}
                  {formData.specialProperties.length > 4 && (
                    <span className="text-xs text-gray-500">+{formData.specialProperties.length - 4}</span>
                  )}
                </div>
              </div>

              {/* Production Requirements */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="bg-orange-600 p-1 rounded">
                    <Settings className="h-3 w-3 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-xs">Production</h4>
                </div>
                <div className="space-y-1">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Budget</Label>
                    <span className="inline-block px-1.5 py-0.5 bg-orange-200 text-orange-800 rounded text-xs font-medium">
                      {formData.budgetCategory || "Standard"}
                    </span>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Volume</Label>
                    <p className="text-gray-800 text-xs truncate">{formData.productionVolume || "Not specified"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Verification - Mobile-First Responsive Layout */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
              {/* Header - Always visible */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-2 rounded-lg shadow-md">
                  <span className="text-lg">🔒</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Security Verification</h3>
                  <p className="text-gray-600 text-xs">Complete verification to enable generation</p>
                </div>
              </div>
              
              {/* Mobile: Stack vertically, Desktop: Horizontal */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                {/* Captcha Section */}
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 w-full lg:w-auto">
                  <Captcha 
                    key={captchaKey}
                    onVerify={handleCaptchaVerify}
                    onReset={resetCaptcha}
                  />
                </div>
                
                {/* Button Section - Prominent on Mobile */}
                <div className="w-full lg:w-auto">
                  <div className="text-center mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      isCaptchaVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isCaptchaVerified ? '✅ Verified' : '⏳ Pending'}
                    </span>
                  </div>
                  
                  {!isCaptchaVerified ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-center">
                      <span className="text-red-700 font-medium text-sm">🔒 Complete verification above</span>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                      <p className="text-blue-900 font-medium text-sm mb-3">
                        ✅ Ready to Generate Your Professional Formulation!
                      </p>
                      <Button
                        onClick={handleGenerate}
                        disabled={generateFormulation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-base font-bold rounded-lg shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 w-full lg:w-auto min-h-[56px]"
                        data-testid="button-generate-formulation"
                      >
                        {generateFormulation.isPending ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                            Generating Formulation...
                          </>
                        ) : (
                          <>
                            <Download className="h-5 w-5 mr-3" />
                            Generate & Download PDF
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        {formData.additionalNotes && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Additional Notes</h4>
            <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
              <p className="text-gray-700 text-xs leading-relaxed">{formData.additionalNotes}</p>
            </div>
          </div>
        )}

        {/* Footer Info & Navigation */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600">
              <FileText className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Professional PDF & Text Format</span>
            </div>
            <Button
              onClick={onBack}
              variant="outline"
              className="px-4 py-2 text-sm"
              disabled={generateFormulation.isPending}
              data-testid="button-back-to-requirements"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}