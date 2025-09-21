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
        productCategory: data.productCategory,
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
      
      // Get the PDF blob and trigger download
      const pdfBlob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.productName.replace(/\s+/g, '_')}_formulation.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF generated and downloaded');
      return data;
    },
    onSuccess: (data: any) => {
      console.log('Generation success:', data);
      
      // Show success message
      toast({
        title: "Success!",
        description: "Your formulation has been generated and downloaded as PDF!",
        variant: "default",
      });
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
      {/* Compact Hero Section */}
      <div className="text-center py-6 px-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Ready to Generate</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your professional chemical formulation is ready to be created based on your specifications
        </p>
      </div>

      {/* Professional Horizontal Summary Section */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Formulation Summary</h3>
            <p className="text-gray-600 text-sm mt-1">Review your configuration before generating</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-6">
            {/* Product Details */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Beaker className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Product Details</h4>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Product Name</Label>
                  <p className="text-gray-900 font-medium text-sm truncate" title={formData.productName}>{formData.productName || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Category</Label>
                  <p className="text-gray-800 text-sm truncate" title={formData.productCategory}>{formData.productCategory || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Type</Label>
                  <span className="inline-block px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium capitalize">
                    {formData.consistencyType || "Not specified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-purple-600 p-1.5 rounded-lg">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Technical Specifications</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-medium text-gray-600">pH Level</Label>
                  <p className="text-purple-700 font-medium text-sm">{formData.phLevel}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Viscosity</Label>
                  <p className="text-gray-800 text-sm capitalize truncate">{formData.viscosity || "Standard"}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Shelf Life</Label>
                  <p className="text-gray-800 text-sm">{formData.shelfLife} months</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Storage</Label>
                  <p className="text-gray-800 text-sm truncate" title={formData.storageTemperature}>{formData.storageTemperature || "Room temp"}</p>
                </div>
              </div>
            </div>

            {/* Special Properties */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-green-600 p-1.5 rounded-lg">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Special Properties</h4>
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.specialProperties.length > 0 ? (
                  formData.specialProperties.map((prop: string) => (
                    <span key={prop} className="px-2 py-0.5 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                      {formatPropertyName(prop)}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">None specified</span>
                )}
              </div>
            </div>

            {/* Production Requirements */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-orange-600 p-1.5 rounded-lg">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Production Requirements</h4>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Budget</Label>
                  <span className="inline-block px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full text-xs font-medium">
                    {formData.budgetCategory || "Standard"}
                  </span>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Volume</Label>
                  <p className="text-gray-800 text-sm truncate">{formData.productionVolume || "Not specified"}</p>
                </div>
                {formData.regulatoryRequirements.length > 0 && (
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Regulatory</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.regulatoryRequirements.slice(0, 2).map((req: string) => (
                        <span key={req} className="px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full text-xs font-medium">
                          {formatPropertyName(req)}
                        </span>
                      ))}
                      {formData.regulatoryRequirements.length > 2 && (
                        <span className="text-xs text-gray-500">+{formData.regulatoryRequirements.length - 2} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        {formData.additionalNotes && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mt-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Additional Notes</h4>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <p className="text-gray-700 text-sm leading-relaxed">{formData.additionalNotes}</p>
            </div>
          </div>
        )}

        {/* Security Verification */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-6">
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