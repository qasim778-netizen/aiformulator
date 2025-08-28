import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, Beaker, Settings, FileText, Download, Loader2, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Captcha } from '@/components/ui/captcha';
interface FormData {
  productName: string;
  productCategory: string;
  consistencyType: string;
  volume: string;
  viscosity: string;
  specialProperties: string[];
  phLevel: number;
  shelfLife: number;
  storageTemperature: string;
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
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);

  const formatPropertyName = (prop: string) => {
    return prop.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const generateFormulation = useMutation({
    mutationFn: async (data: FormData) => {
      // Map our FormData to the expected API format
      const requestData = {
        productName: data.productName || 'Custom Product',
        productDescription: `${data.productCategory} - ${data.consistencyType}`,
        productType: data.consistencyType || 'cream',
        phLevel: data.phLevel || 7,
        costLevel: data.budgetCategory || 'Medium Quality',
        viscosity: data.viscosity || 'Medium',
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
      
      console.log('🚀 Sending request to API:', requestData);
      
      // Use direct fetch instead of apiRequest
      const response = await fetch('/api/ai/custom-formulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate formulation');
      }
      
      const result = await response.json();
      
      console.log('✅ API Response received:', result);
      return result;
    },
    onSuccess: (data: any) => {
      console.log('Generation success:', data);
      
      // Show success message
      toast({
        title: "Success!",
        description: "Your formulation has been generated successfully!",
        variant: "default",
      });
      
      // For now, just show success since we're using mock PDF data
      // In the future, this will handle real PDF downloads
      if (data.formulation) {
        console.log('Generated formulation:', data.formulation);
      }
    },
    onError: (error) => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="text-center py-12 px-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle className="h-12 w-12" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Generate</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Your professional chemical formulation is ready to be created based on your specifications
        </p>
      </div>

      {/* Elegant Summary Section */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-900">Formulation Summary</h3>
            <p className="text-gray-600 mt-2">Review your configuration before generating</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
            {/* Product Details */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Beaker className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Product Details</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Product Name</Label>
                  <p className="text-gray-900 font-semibold text-lg">{formData.productName || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Category</Label>
                  <p className="text-gray-800">{formData.productCategory || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Consistency Type</Label>
                  <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                    {formData.consistencyType || "Not specified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Specs */}
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Technical Specifications</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">pH Level</Label>
                  <p className="text-purple-700 font-semibold text-lg">{formData.phLevel}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Viscosity</Label>
                  <p className="text-gray-800 capitalize">{formData.viscosity || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Shelf Life</Label>
                  <p className="text-gray-800">{formData.shelfLife} months</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Storage Temperature</Label>
                  <p className="text-gray-800">{formData.storageTemperature || "Not specified"}</p>
                </div>
              </div>
            </div>

            {/* Special Properties */}
            {formData.specialProperties.length > 0 && (
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Special Properties</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specialProperties.map((prop: string) => (
                    <span key={prop} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {formatPropertyName(prop)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Production Requirements */}
            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Settings className="h-5 w-5 text-orange-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Production Requirements</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Budget Category</Label>
                  <span className="inline-block mt-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    {formData.budgetCategory || "Not specified"}
                  </span>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Production Volume</Label>
                  <p className="text-gray-800">{formData.productionVolume || "Not specified"}</p>
                </div>
                {formData.regulatoryRequirements.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Regulatory Requirements</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.regulatoryRequirements.map((req: string) => (
                        <span key={req} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                          {formatPropertyName(req)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        {formData.additionalNotes && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mt-8">
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h4>
            <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-blue-500">
              <p className="text-gray-700 leading-relaxed">{formData.additionalNotes}</p>
            </div>
          </div>
        )}

        {/* Security Verification */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mt-8">
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Security Verification</h3>
            <p className="text-gray-600">Please complete the verification below to generate your formulation</p>
          </div>
          
          <Captcha 
            key={captchaKey}
            onVerify={handleCaptchaVerify}
            onReset={resetCaptcha}
          />
          
          {/* Verification Status */}
          <div className="text-center mt-4">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              isCaptchaVerified 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {isCaptchaVerified ? '✅ Verification Complete' : '⏳ Please Complete Verification'}
            </span>
          </div>

          {/* Generation Button */}
          <div className="text-center mt-8">
            {!isCaptchaVerified ? (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl px-8 py-4 text-center">
                <span className="text-red-700 font-semibold">🔒 Please complete the security verification above to enable generation</span>
              </div>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={generateFormulation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-xl font-semibold rounded-xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300"
                data-testid="button-generate-formulation"
              >
                {generateFormulation.isPending ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    Generating Your Formulation...
                  </>
                ) : (
                  <>
                    <Download className="h-6 w-6 mr-3" />
                    Generate Professional Formulation
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Information Footer */}
        <div className="text-center pt-8 border-t border-gray-200 mt-8">
          <div className="flex items-center justify-center text-gray-600 mb-2">
            <FileText className="h-5 w-5 mr-2" />
            <span className="text-lg font-medium">Professional PDF Generation</span>
          </div>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Your formulation will be generated as a comprehensive professional PDF including complete specifications, 
            ingredient lists, manufacturing instructions, and quality control guidelines.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center pt-8">
          <Button
            onClick={onBack}
            variant="outline"
            className="px-8 py-3 text-lg"
            disabled={generateFormulation.isPending}
            data-testid="button-back-to-requirements"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Requirements
          </Button>
        </div>
      </div>
    </div>
  );
}