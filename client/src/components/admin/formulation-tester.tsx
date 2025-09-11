import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Beaker, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface FormulationResult {
  formulation: any;
  validation: ValidationResult;
  processingTime: number;
  category: string;
}

export default function FormulationTester() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [productDescription, setProductDescription] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<FormulationResult | null>(null);
  const { toast } = useToast();

  const testCategories = [
    { value: "glass-cleaners", label: "Glass Cleaners", description: "Window and glass surface cleaners" },
    { value: "cleaning-products", label: "General Cleaning Products", description: "All-purpose cleaners" },
    { value: "skincare", label: "Skincare Products", description: "Cosmetic and skincare formulations" },
    { value: "cosmetics", label: "Cosmetic Products", description: "Makeup and beauty products" }
  ];

  const testExamples = {
    "glass-cleaners": "Professional glass cleaner for streak-free cleaning",
    "cleaning-products": "Multi-surface kitchen cleaner",
    "skincare": "Anti-aging moisturizing cream",
    "cosmetics": "Long-lasting liquid foundation"
  };

  const handleGenerateTest = async () => {
    if (!selectedCategory || !productDescription) {
      toast({
        title: "Missing Information",
        description: "Please select a category and enter a product description",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    const startTime = Date.now();

    try {
      const response = await fetch("/api/demo-formulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: selectedCategory,
          description: productDescription
        }),
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      setResult({
        formulation: data.formulation,
        validation: data.validation,
        processingTime,
        category: selectedCategory
      });

      toast({
        title: data.validation.isValid ? "✅ Valid Formulation Generated" : "⚠️ Invalid Formulation Generated",
        description: data.validation.isValid 
          ? `Generated in ${(processingTime / 1000).toFixed(1)}s`
          : `${data.validation.errors.length} validation errors found`,
        variant: data.validation.isValid ? "default" : "destructive"
      });

    } catch (error) {
      console.error("Failed to generate test formulation:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const setExample = (category: string) => {
    setSelectedCategory(category);
    setProductDescription(testExamples[category as keyof typeof testExamples] || "");
  };

  const parseIngredients = (ingredientsJson: string) => {
    try {
      return JSON.parse(ingredientsJson);
    } catch {
      return [];
    }
  };

  const calculateTotalPercentage = (ingredients: any[]) => {
    return ingredients.reduce((total, ing) => {
      const percentage = parseFloat(ing.percentage?.replace('%', '') || '0');
      return total + percentage;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            AI Formulation System Tester
          </CardTitle>
          <p className="text-sm text-gray-600">
            Test the improved category-specific AI formulation system with validation
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category to test" />
              </SelectTrigger>
              <SelectContent>
                {testCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div>
                      <div className="font-medium">{category.label}</div>
                      <div className="text-xs text-gray-500">{category.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Examples */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Test Examples</label>
            <div className="flex flex-wrap gap-2">
              {testCategories.map((category) => (
                <Button
                  key={category.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setExample(category.value)}
                  data-testid={`button-example-${category.value}`}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Product Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Description</label>
            <Textarea
              placeholder="Enter a product description to generate..."
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={3}
              data-testid="textarea-product-description"
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerateTest}
            disabled={isGenerating || !selectedCategory || !productDescription}
            className="w-full"
            data-testid="button-generate-test"
          >
            {isGenerating ? "Generating & Validating..." : "Generate & Test Formulation"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Results</span>
              <div className="flex items-center gap-2">
                {result.validation.isValid ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Invalid
                  </Badge>
                )}
                <Badge variant="outline">
                  {(result.processingTime / 1000).toFixed(1)}s
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Validation Status */}
            {!result.validation.isValid && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Validation Errors</span>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.validation.errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Formulation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Basic Information</h4>
                <div className="text-sm space-y-2">
                  <div><strong>Name:</strong> {result.formulation.name}</div>
                  <div><strong>Category:</strong> {result.category}</div>
                  <div><strong>pH Level:</strong> {result.formulation.phLevel}</div>
                  <div><strong>Processing Time:</strong> {result.formulation.processingTime}</div>
                  <div><strong>Temperature:</strong> {result.formulation.temperature}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Technical Specs</h4>
                <div className="text-sm space-y-2">
                  <div><strong>Viscosity:</strong> {result.formulation.viscosity}</div>
                  <div><strong>Batch Size:</strong> {result.formulation.batchSize}</div>
                  <div><strong>Shelf Life:</strong> {result.formulation.shelfLife}</div>
                  <div><strong>Equipment:</strong> {result.formulation.equipment}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Ingredients Analysis */}
            <div className="space-y-3">
              <h4 className="font-medium">Ingredients Analysis</h4>
              {(() => {
                const ingredients = parseIngredients(result.formulation.ingredients);
                const totalPercentage = calculateTotalPercentage(ingredients);
                
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Percentage:</span>
                      <Badge variant={Math.abs(totalPercentage - 100) <= 1 ? "default" : "destructive"}>
                        {totalPercentage.toFixed(1)}%
                      </Badge>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1">Ingredient</th>
                            <th className="text-left py-1">INCI Name</th>
                            <th className="text-right py-1">%</th>
                            <th className="text-left py-1">Function</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ingredients.map((ingredient: any, index: number) => (
                            <tr key={index} className="border-b border-gray-200">
                              <td className="py-1">{ingredient.name}</td>
                              <td className="py-1 text-gray-600">{ingredient.inci}</td>
                              <td className="py-1 text-right font-mono">{ingredient.percentage}</td>
                              <td className="py-1 text-gray-600">{ingredient.function}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* System Improvements Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">System Improvements Active</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✅ Category-specific prompts and ingredient knowledge</li>
                <li>✅ Automated validation for ingredient appropriateness</li>
                <li>✅ Percentage total checking (must equal 100%)</li>
                <li>✅ Prohibited ingredient detection for category</li>
                <li>✅ Processing parameter validation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}