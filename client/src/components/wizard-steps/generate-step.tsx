import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Download, ArrowLeft, CheckCircle, FileText, Beaker, Settings } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { Captcha } from "@/components/ui/captcha";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  productName: string;
  productCategory: string;
  consistencyType: string;
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

interface Props {
  formData: FormData;
  generateFormulation: UseMutationResult<FormData, Error, FormData>;
  onBack: () => void;
}

const formatPropertyName = (prop: string) => {
  return prop.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function GenerateStep({ formData, generateFormulation, onBack }: Props) {
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!isCaptchaVerified) {
      toast({
        title: "Captcha Required",
        description: "Please complete the security verification before generating.",
        variant: "destructive"
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
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="bg-green-100 text-green-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Generate!</h3>
        <p className="text-gray-600">
          Review your specifications below and generate your professional formulation
        </p>
      </div>

      {/* Formulation Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Details */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Beaker className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-900">Product Details</h4>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Product Name</Label>
                <p className="text-gray-900 font-medium">{formData.productName || "Not specified"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Category</Label>
                <p className="text-gray-900">{formData.productCategory || "Not specified"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Consistency Type</Label>
                <Badge variant="secondary" className="capitalize">
                  {formData.consistencyType || "Not specified"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Specs */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-900">Technical Specifications</h4>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">pH Level</Label>
                <p className="text-gray-900 font-medium">{formData.phLevel}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Viscosity</Label>
                <p className="text-gray-900 capitalize">{formData.viscosity || "Not specified"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Shelf Life</Label>
                <p className="text-gray-900">{formData.shelfLife} months</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Storage Temperature</Label>
                <p className="text-gray-900 text-sm">{formData.storageTemperature || "Not specified"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Special Properties */}
        {formData.specialProperties.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-900">Special Properties</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specialProperties.map((prop) => (
                  <Badge key={prop} variant="outline" className="text-xs">
                    {formatPropertyName(prop)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Production Requirements */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-900">Production Requirements</h4>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Budget Category</Label>
                <Badge variant="secondary">{formData.budgetCategory || "Not specified"}</Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Production Volume</Label>
                <p className="text-gray-900 text-sm">{formData.productionVolume || "Not specified"}</p>
              </div>
              {formData.regulatoryRequirements.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Regulatory Requirements</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.regulatoryRequirements.map((req) => (
                      <Badge key={req} variant="outline" className="text-xs">
                        {formatPropertyName(req)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Notes */}
      {formData.additionalNotes && (
        <Card>
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Additional Notes</h4>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
              {formData.additionalNotes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Security Verification - Prominent Section */}
      <div className="my-8">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center">
            <div className="bg-yellow-100 p-2 rounded-full mr-3">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-yellow-800">Security Check Required</h3>
              <p className="text-yellow-700 text-sm">Complete verification to generate your formulation</p>
            </div>
          </div>
        </div>
        
        <Captcha 
          key={captchaKey}
          onVerify={handleCaptchaVerify}
          onReset={resetCaptcha}
        />
        
        {/* Debug info */}
        <div className="text-center mt-2 text-sm text-gray-600">
          Captcha Status: {isCaptchaVerified ? '✅ Verified' : '❌ Not Verified'}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-6 py-3"
          disabled={generateFormulation.isPending}
          data-testid="button-back-to-requirements"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {!isCaptchaVerified ? (
          <div className="bg-red-50 border border-red-200 rounded-lg px-8 py-3 text-center">
            <span className="text-red-700 font-medium">🔒 Complete security verification above to enable generation</span>
          </div>
        ) : (
          <Button
            onClick={handleGenerate}
            disabled={generateFormulation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
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
                Generate Formulation
              </>
            )}
          </Button>
        )}
      </div>

      {/* Information Footer */}
      <div className="text-center pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 flex items-center justify-center">
          <FileText className="h-4 w-4 mr-2" />
          Your formulation will be generated as a professional PDF with complete specifications and manufacturing instructions
        </p>
      </div>
    </div>
  );
}