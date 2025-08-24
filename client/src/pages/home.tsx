import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Beaker, Zap, Sparkles, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { 
  PRODUCT_CATEGORIES, 
  CONSISTENCIES, 
  VISCOSITY_LEVELS, 
  SPECIAL_PROPERTIES,
  STORAGE_TEMPERATURES,
  BUDGET_CATEGORIES,
  PRODUCTION_VOLUMES,
  getSpecialProperties 
} from "../../../server/product-features";

const formulationSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  productCategory: z.string().min(1, "Product category is required"),
  consistency: z.string().min(1, "Consistency is required"),
  targetViscosity: z.string().min(1, "Target viscosity is required"),
  specialProperties: z.array(z.string()).min(1, "At least one special property is required"),
  phLevel: z.string().min(1, "pH level is required"),
  shelfLife: z.string().min(1, "Shelf life is required"),
  storageTemperature: z.string().min(1, "Storage temperature is required"),
  budgetCategory: z.string().min(1, "Budget category is required"),
  productionVolume: z.string().min(1, "Production volume is required"),
  regulatoryRequirements: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type FormulationFormData = z.infer<typeof formulationSchema>;

interface FormulationResult {
  name: string;
  description: string;
  ingredients: Array<{
    name: string;
    percentage: number;
    function: string;
    supplier?: string;
    cost?: number;
  }>;
  manufacturingProcess: Array<{
    step: number;
    instruction: string;
    temperature?: string;
    duration?: string;
    equipment?: string;
  }>;
  properties: {
    viscosity: string;
    phLevel: string;
    appearance: string;
    shelfLife: string;
    storageConditions: string;
  };
  costAnalysis: {
    totalCostPerKg: number;
    budgetCategory: string;
    profitability: string;
  };
}

export default function Home() {
  const [generatedFormulation, setGeneratedFormulation] = useState<FormulationResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<FormulationFormData>({
    resolver: zodResolver(formulationSchema),
    defaultValues: {
      specialProperties: [],
      regulatoryRequirements: "",
      additionalNotes: "",
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: FormulationFormData) => {
      const response = await apiRequest("POST", `/api/ai-formulations/generate`, data);
      return response.json();
    },
    onSuccess: (data: any) => {
      setGeneratedFormulation(data.generatedData);
      toast({
        title: "Success!",
        description: "Your custom formulation has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate formulation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormulationFormData) => {
    generateMutation.mutate(data);
  };

  const availableProperties = selectedCategory ? getSpecialProperties(selectedCategory) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
              <Beaker className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Formulation Generator
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Create professional chemical formulations in minutes with AI-powered precision. 
            Tell us what you need, and we'll generate a complete formulation with ingredients, 
            process steps, and cost analysis.
          </p>
          
          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <Zap className="h-6 w-6 text-blue-500" />
              <span className="font-medium">Instant Generation</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-500" />
              <span className="font-medium">AI-Powered Precision</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <span className="font-medium">Professional Quality</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                Formulation Requirements
              </CardTitle>
              <CardDescription>
                Specify your product requirements to generate a custom formulation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Product Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Premium Anti-Aging Serum" 
                            {...field} 
                            data-testid="input-product-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Product Category */}
                  <FormField
                    control={form.control}
                    name="productCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Category</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCategory(value);
                            form.setValue("specialProperties", []);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-product-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRODUCT_CATEGORIES.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Consistency */}
                  <FormField
                    control={form.control}
                    name="consistency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consistency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-consistency">
                              <SelectValue placeholder="Select consistency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONSISTENCIES.map((consistency) => (
                              <SelectItem key={consistency.id} value={consistency.id}>
                                <div className="flex items-center gap-2">
                                  <span>{consistency.icon}</span>
                                  {consistency.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Target Viscosity */}
                  <FormField
                    control={form.control}
                    name="targetViscosity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Viscosity</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-viscosity">
                              <SelectValue placeholder="Select viscosity level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {VISCOSITY_LEVELS.map((viscosity) => (
                              <SelectItem key={viscosity.id} value={viscosity.id}>
                                <div className="flex items-center gap-2">
                                  <span>{viscosity.icon}</span>
                                  <div>
                                    <div className="font-medium">{viscosity.name}</div>
                                    <div className="text-xs text-gray-500">{viscosity.range}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Special Properties */}
                  {availableProperties.length > 0 && (
                    <FormField
                      control={form.control}
                      name="specialProperties"
                      render={() => (
                        <FormItem>
                          <FormLabel>Special Properties</FormLabel>
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                            {availableProperties.map((property) => (
                              <FormField
                                key={property}
                                control={form.control}
                                name="specialProperties"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={property}
                                      className="flex flex-row items-start space-x-2 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(property)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, property])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== property
                                                  )
                                                );
                                          }}
                                          data-testid={`checkbox-property-${property.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {property}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* pH Level */}
                  <FormField
                    control={form.control}
                    name="phLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>pH Level</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 5.5-6.5" 
                            {...field} 
                            data-testid="input-ph-level"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Budget Category */}
                  <FormField
                    control={form.control}
                    name="budgetCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-budget-category">
                              <SelectValue placeholder="Select budget category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BUDGET_CATEGORIES.map((budget) => (
                              <SelectItem key={budget.id} value={budget.id}>
                                <div>
                                  <div className="font-medium">{budget.name}</div>
                                  <div className="text-xs text-gray-500">{budget.priceRange}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Production Volume */}
                  <FormField
                    control={form.control}
                    name="productionVolume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Production Volume</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-production-volume">
                              <SelectValue placeholder="Select production volume" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRODUCTION_VOLUMES.map((volume) => (
                              <SelectItem key={volume.id} value={volume.id}>
                                {volume.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Additional Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shelfLife"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shelf Life</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 24 months" 
                              {...field} 
                              data-testid="input-shelf-life"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="storageTemperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Storage Temperature</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-storage-temperature">
                                <SelectValue placeholder="Select storage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {STORAGE_TEMPERATURES.map((temp) => (
                                <SelectItem key={temp.id} value={temp.id}>
                                  {temp.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Optional Fields */}
                  <FormField
                    control={form.control}
                    name="regulatoryRequirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regulatory Requirements (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., FDA, EU Cosmetics Regulation" 
                            {...field} 
                            data-testid="input-regulatory-requirements"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any specific requirements or preferences..." 
                            {...field} 
                            data-testid="textarea-additional-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={generateMutation.isPending}
                    data-testid="button-generate-formulation"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Generating Formulation...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Professional Formulation
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                Generated Formulation
              </CardTitle>
              <CardDescription>
                Your custom formulation will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generateMutation.isPending ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <Clock className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-lg font-medium">Generating your formulation...</p>
                    <p className="text-gray-500">This may take 30-60 seconds</p>
                  </div>
                </div>
              ) : generatedFormulation ? (
                <div className="space-y-6" data-testid="formulation-results">
                  {/* Formulation Overview */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                      {generatedFormulation.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {generatedFormulation.description}
                    </p>
                  </div>

                  {/* Key Properties */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Viscosity</div>
                      <div className="text-blue-700 dark:text-blue-300">{generatedFormulation.properties.viscosity}</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div className="text-sm font-medium text-green-900 dark:text-green-100">pH Level</div>
                      <div className="text-green-700 dark:text-green-300">{generatedFormulation.properties.phLevel}</div>
                    </div>
                  </div>

                  {/* Cost Analysis */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Cost Analysis</h4>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      ${generatedFormulation.costAnalysis.totalCostPerKg.toFixed(2)}/kg
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">
                      {generatedFormulation.costAnalysis.budgetCategory} • {generatedFormulation.costAnalysis.profitability}
                    </div>
                  </div>

                  {/* Ingredients Preview */}
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">
                      Ingredients ({generatedFormulation.ingredients.length} total)
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {generatedFormulation.ingredients.slice(0, 5).map((ingredient, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="font-medium">{ingredient.name}</span>
                          <Badge variant="outline">{ingredient.percentage}%</Badge>
                        </div>
                      ))}
                      {generatedFormulation.ingredients.length > 5 && (
                        <div className="text-xs text-gray-500 text-center pt-2">
                          +{generatedFormulation.ingredients.length - 5} more ingredients
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manufacturing Steps Preview */}
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">
                      Manufacturing Process ({generatedFormulation.manufacturingProcess.length} steps)
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {generatedFormulation.manufacturingProcess.slice(0, 3).map((step) => (
                        <div key={step.step} className="text-sm">
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            Step {step.step}:
                          </span>
                          <span className="ml-2">{step.instruction}</span>
                        </div>
                      ))}
                      {generatedFormulation.manufacturingProcess.length > 3 && (
                        <div className="text-xs text-gray-500 text-center pt-2">
                          +{generatedFormulation.manufacturingProcess.length - 3} more steps
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-500 mb-4">
                      Want to see the complete formulation with detailed ingredients, full process, 
                      and safety guidelines?
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        View Full Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-12 text-center">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-fit mx-auto">
                      <Beaker className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">No formulation yet</p>
                      <p className="text-sm text-gray-500">
                        Fill out the form and click generate to create your custom formulation
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}