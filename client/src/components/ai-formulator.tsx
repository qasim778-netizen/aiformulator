import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Download, FileText, Beaker } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SignInDialog from "@/components/signin-dialog";
import { Captcha } from "@/components/ui/captcha";

const formulatorSchema = z.object({
  customerName: z.string().default(""),
  email: z.string().default(""),
  country: z.string().default(""),
  productName: z.string().min(1, "Product name is required"),
  productDescription: z.string().min(10, "Product description must be at least 10 characters"),
  productType: z.enum(["liquid", "cream", "gel", "powder", "paste", "foam"]),
  phLevel: z.string().min(1, "pH level is required"),
  costLevel: z.enum(["cost_effective", "medium", "expensive"]),
  viscosity: z.string().optional(),
  color: z.string().optional(),
  fragrance: z.string().optional(),
  specialRequirements: z.string().optional(),
});

type FormulatorData = z.infer<typeof formulatorSchema>;

export default function AIFormulator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);
  const { toast } = useToast();


  const form = useForm<FormulatorData>({
    resolver: zodResolver(formulatorSchema),
    defaultValues: {
      customerName: "",
      email: "",
      country: "",
      productName: "",
      productDescription: "",
      productType: "liquid",
      phLevel: "",
      costLevel: "cost_effective",
      viscosity: "",
      color: "",
      fragrance: "",
      specialRequirements: "",
    },
  });

  const generateFormulation = useMutation<FormulatorData | null, Error, FormulatorData>({
    mutationFn: async (data: FormulatorData): Promise<FormulatorData | null> => {
      // Get logo settings from localStorage
      const logoSettings = JSON.parse(localStorage.getItem('ai_formulator_logo_settings') || '{}');
      
      const payload = {
        ...data,
        customerName: data.customerName || "",
        email: data.email || "",
        country: data.country || "",
        logoSettings
      };
      console.log('📡 Sending payload to backend:', {
        customerName: payload.customerName,
        email: payload.email,
        country: payload.country,
        productName: payload.productName
      });
      
      const response = await fetch("/api/ai/custom-formulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsGenerating(false);
          setShowSignInDialog(true);
          return null;
        }
        const error = await response.json();
        throw new Error(error.message || "Failed to generate formulation");
      }

      // Get the PDF blob
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
      
      return data;
    },
    onSuccess: (data: FormulatorData | null) => {
      if (data) {
        // Invalidate formulation caches so they appear in admin panel and browsing
        queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
        queryClient.invalidateQueries({ queryKey: ["/api/formulations-paginated"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        // Invalidate cache so generated formulas appear in dashboard
        queryClient.invalidateQueries({ queryKey: ['/api/user/generated'] });
        
        toast({
          title: "Formulation Generated Successfully!",
          description: `Created formulation for ${data.productName} and downloaded PDF`,
        });
        form.reset();
        resetCaptcha(); // Reset captcha after successful generation
      }
      setIsGenerating(false);
    },
    onError: (error: any) => {
      setIsGenerating(false);
      resetCaptcha(); // Reset captcha after error so user can try again
      
      // Don't show error toast for authentication errors since dialog will handle it
      if (error.message === "Authentication required") {
        return;
      }
      
      toast({
        title: "Generation Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormulatorData) => {
    console.log('📤 Form submitted with FULL data:', JSON.stringify(data, null, 2));
    console.log('🔍 Form watch values:', {
      customerName: form.watch('customerName'),
      email: form.watch('email'),
      country: form.watch('country'),
      productName: form.watch('productName')
    });
    console.log('🔍 Form formState:', {
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid,
      errors: form.formState.errors
    });
    
    if (!isCaptchaVerified) {
      toast({
        title: "Captcha Required",
        description: "Please complete the security verification before generating.",
        variant: "destructive"
      });
      return;
    }
    setIsGenerating(true);
    generateFormulation.mutate(data);
  };

  const handleCaptchaVerify = (isValid: boolean) => {
    setIsCaptchaVerified(isValid);
  };

  const resetCaptcha = () => {
    setIsCaptchaVerified(false);
    setCaptchaKey(prev => prev + 1);
  };

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto shadow-lg" data-testid="ai-formulator-card">
      <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-blue-50">
        <div className="flex items-center justify-center mb-4">
          <Beaker className="h-8 w-8 text-primary mr-3" />
          <CardTitle className="text-3xl font-bold text-gray-900">AI Formulator Agent</CardTitle>
        </div>
        <CardDescription className="text-lg text-gray-600">
          Describe your product requirements and get a professional chemical formulation instantly
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Contact Information
                </h3>
                
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your full name" 
                          {...field}
                          data-testid="input-customer-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="your@email.com"
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., United States"
                          {...field}
                          data-testid="input-country"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Product Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Product Information
                </h3>
                
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Gentle Face Cleanser" 
                          {...field} 
                          data-testid="input-product-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <FormField
                  control={form.control}
                  name="productDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the intended use, target audience, and key benefits..."
                          className="min-h-20"
                          {...field}
                          data-testid="input-product-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-product-type">
                            <SelectValue placeholder="Select product type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="liquid">Liquid</SelectItem>
                          <SelectItem value="cream">Cream</SelectItem>
                          <SelectItem value="gel">Gel</SelectItem>
                          <SelectItem value="powder">Powder</SelectItem>
                          <SelectItem value="paste">Paste</SelectItem>
                          <SelectItem value="foam">Foam</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Technical Specifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Beaker className="h-5 w-5 mr-2 text-primary" />
                  Technical Specifications
                </h3>

                <FormField
                  control={form.control}
                  name="phLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>pH Level *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 5.5-6.5 or neutral" 
                          {...field} 
                          data-testid="input-ph-level"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Level *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-cost-level">
                            <SelectValue placeholder="Select cost level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cost_effective">Cost Effective</SelectItem>
                          <SelectItem value="medium">Medium Range</SelectItem>
                          <SelectItem value="expensive">Premium/Expensive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="viscosity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Viscosity (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., thin, medium, thick" 
                          {...field} 
                          data-testid="input-viscosity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., clear, white, natural" 
                          {...field} 
                          data-testid="input-color"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fragrance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fragrance (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., unscented, lavender, citrus" 
                          {...field} 
                          data-testid="input-fragrance"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <FormField
              control={form.control}
              name="specialRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requirements (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific requirements like organic ingredients, preservative-free, hypoallergenic, etc."
                      className="min-h-16"
                      {...field}
                      data-testid="input-special-requirements"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-4 sm:my-6" />

            <Captcha 
              key={captchaKey}
              onVerify={handleCaptchaVerify}
              onReset={resetCaptcha}
            />

            {/* Mobile-first button layout - more prominent and visible */}
            <div className="mt-4 sm:mt-6">
              {/* Mobile: Full-width prominent button area */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6 space-y-3">
                <div className="text-center">
                  <p className="text-sm sm:text-base text-blue-900 font-medium mb-2">
                    {isCaptchaVerified ? 
                      "✅ Ready to Generate Your Formulation!" : 
                      "Complete security verification above to continue"
                    }
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isGenerating || !isCaptchaVerified}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-4 sm:px-8 sm:py-4 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-h-[56px] max-w-sm"
                    data-testid="button-generate-formulation"
                  >
                    {isGenerating ? (
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
                
                {!isCaptchaVerified && (
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-600">
                      👆 Complete the math problem above first
                    </p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
    
    <SignInDialog 
      open={showSignInDialog}
      onOpenChange={setShowSignInDialog}
      title="Sign In to Generate"
      description="Please sign in to generate and download your custom formulation as a PDF."
    />
    </>
  );
}