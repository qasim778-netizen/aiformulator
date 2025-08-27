import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormulationCard from "@/components/formulation-card";
import type { Category, Formulation } from "@shared/schema";
import { useState, useCallback } from "react";
import { Captcha } from "@/components/ui/captcha";
import { useToast } from "@/hooks/use-toast";

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id;
  const { toast } = useToast();
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories", categoryId],
  });

  const { data: formulations = [], isLoading: formulationsLoading } = useQuery<Formulation[]>({
    queryKey: ["/api/formulations", { categoryId }],
    queryFn: async () => {
      const response = await fetch(`/api/formulations?categoryId=${categoryId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch formulations');
      }
      return response.json();
    },
    enabled: !!categoryId,
  });

  if (categoryLoading || formulationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h1>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Captcha verification handlers
  const handleCaptchaVerify = useCallback((verified: boolean) => {
    setIsCaptchaVerified(verified);
    if (verified) {
      toast({
        title: "Verification Successful",
        description: "You can now browse the formulations in this category."
      });
    }
  }, [toast]);

  const resetCaptcha = useCallback(() => {
    setIsCaptchaVerified(false);
    setCaptchaKey(prev => prev + 1);
  }, []);

  // Show captcha verification first
  if (!isCaptchaVerified) {
    return (
      <div className="bg-white py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Link href="/browse">
              <Button variant="ghost" className="text-primary hover:text-blue-700 mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Browse
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Security Verification Required</h1>
            <p className="text-lg text-gray-600 mb-8">
              To access formulations in the <strong>{category.name}</strong> category, please complete the security verification below.
            </p>
          </div>
          
          <div className="max-w-lg mx-auto">
            <Captcha
              key={captchaKey}
              onVerify={handleCaptchaVerify}
              onReset={resetCaptcha}
            />
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              This verification helps protect against automated access and ensures the security of our formulation database.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-primary hover:text-blue-700 mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Button>
          </Link>
          <h1 className="text-3xl font-inter font-bold text-gray-900">
            {category.name} Formulations
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formulations.map((formulation) => (
            <FormulationCard key={formulation.id} formulation={formulation} />
          ))}
        </div>

        {formulations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No formulations available in this category yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
