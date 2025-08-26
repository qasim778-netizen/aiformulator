import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2, FlaskConical, Package, Image, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Category } from "@shared/schema";

interface BulkFormulationGeneratorProps {
  categories: Category[];
}

export default function BulkFormulationGenerator({ categories }: BulkFormulationGeneratorProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [formulationCount, setFormulationCount] = useState("5");
  const [includeAiImages, setIncludeAiImages] = useState(false);
  const { toast } = useToast();

  const generateBulkFormulations = useMutation({
    mutationFn: ({ categoryId, count, includeImages }: { categoryId: string; count: number; includeImages: boolean }) => 
      apiRequest("POST", "/api/ai/generate-bulk-formulations-with-keywords", { categoryId, count, includeImages }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ 
        title: "Bulk generation completed!", 
        description: `Successfully generated ${data.count} formulations`
      });
      // Reset form
      setSelectedCategoryId("");
      setFormulationCount("5");
      setIncludeAiImages(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate formulations", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategoryId) {
      toast({ 
        title: "Category required", 
        description: "Please select a category first",
        variant: "destructive" 
      });
      return;
    }

    const count = parseInt(formulationCount);
    if (!count || count < 1 || count > 50) {
      toast({ 
        title: "Invalid formulation count", 
        description: "Please enter a number between 1 and 50",
        variant: "destructive" 
      });
      return;
    }

    generateBulkFormulations.mutate({ categoryId: selectedCategoryId, count, includeImages: includeAiImages });
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <FlaskConical className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-inter font-semibold text-green-900">
              Bulk Formulation Generator
            </h3>
          </div>
          <p className="text-green-700 mb-4">
            Generate multiple professional formulations with "Formula" or "Formulation" keywords in titles, complete INCI ingredients, manufacturing instructions, and optional AI-generated product images.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-600">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-green-500" />
              Product names with "Formula" or "Formulation" keywords
            </div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-green-500" />
              Professional chemical formulations with INCI ingredients
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-green-500" />
              Complete manufacturing instructions and specifications
            </div>
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-green-500" />
              Optional AI-generated product images for marketing
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Generate Formulations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2">
                Select Category
              </label>
              <Select 
                value={selectedCategoryId} 
                onValueChange={setSelectedCategoryId} 
                disabled={generateBulkFormulations.isPending}
              >
                <SelectTrigger data-testid="select-bulk-category">
                  <SelectValue placeholder="Choose a category for bulk generation" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCategory && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    className="h-12 w-12 rounded-lg object-cover"
                    src={selectedCategory.image}
                    alt={selectedCategory.name}
                  />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">{selectedCategory.name}</h4>
                    <p className="text-xs text-blue-600">{selectedCategory.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Product Photography - PROMINENT SECTION */}
            <div className={`p-6 rounded-xl border-2 transition-all ${
              includeAiImages 
                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-400 shadow-lg' 
                : 'bg-gray-50 border-gray-300 hover:border-blue-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${includeAiImages ? 'bg-blue-500' : 'bg-gray-400'}`}>
                    <Image className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${includeAiImages ? 'text-blue-900' : 'text-gray-700'}`}>
                      🎨 AI Product Photography
                    </h3>
                    <p className={`text-sm ${includeAiImages ? 'text-blue-700' : 'text-gray-600'}`}>
                      Generate professional product images with DALL-E AI
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${includeAiImages ? 'text-blue-700' : 'text-gray-500'}`}>
                    {includeAiImages ? 'ENABLED' : 'DISABLED'}
                  </span>
                  <Switch
                    checked={includeAiImages}
                    onCheckedChange={setIncludeAiImages}
                    disabled={generateBulkFormulations.isPending}
                    data-testid="switch-include-ai-images"
                    className="scale-125"
                  />
                </div>
              </div>
              {includeAiImages && (
                <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800">✅ Images will be generated for each formulation</p>
                  <p className="text-xs text-blue-600 mt-1">Professional product photography with clean backgrounds</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="formulationCount" className="block text-sm font-medium mb-2">
                Number of Formulations
              </label>
              <Input
                id="formulationCount"
                data-testid="input-bulk-formulation-count"
                type="number"
                min="1"
                max="50"
                value={formulationCount}
                onChange={(e) => setFormulationCount(e.target.value)}
                className="w-32"
                disabled={generateBulkFormulations.isPending}
                placeholder="5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Generate between 1-50 formulations (recommended: 5-10)
              </p>
            </div>

            {/* Formula Features Info */}
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <h4 className="text-sm font-medium text-yellow-800 mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Formula Features
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-yellow-700">
                <div>• Product names will include "Formula" or "Formulation" keywords</div>
                <div>• Professional chemical formulations with INCI ingredients</div>
                <div>• Complete manufacturing instructions and specifications</div>
                <div>• {includeAiImages ? "✅ AI-generated" : "❌ No"} product images for marketing use</div>
                <div>• SEO-optimized content for better discoverability</div>
              </div>
            </div>

            {/* Preview */}
            {selectedCategory && formulationCount && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Generation Preview
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                    {formulationCount} Formula Formulations
                  </Badge>
                  <span className="text-purple-700 text-sm">for {selectedCategory.name}</span>
                  {includeAiImages && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      + AI Images
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              disabled={generateBulkFormulations.isPending || !selectedCategoryId || !formulationCount}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 w-full"
              data-testid="button-generate-bulk-formulations"
            >
              {generateBulkFormulations.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating {formulationCount} formula formulations{includeAiImages ? " with images" : ""}...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Generate {formulationCount} Formula Formulations{includeAiImages ? " + Images" : ""}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}