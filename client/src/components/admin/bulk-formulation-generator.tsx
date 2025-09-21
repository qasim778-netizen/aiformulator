import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2, FlaskConical, Package, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import FormulationPreview from "@/components/formulation-preview";
import type { Category, Formulation } from "@shared/schema";

interface BulkFormulationGeneratorProps {
  categories: Category[];
}

export default function BulkFormulationGenerator({ categories }: BulkFormulationGeneratorProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [formulationCount, setFormulationCount] = useState("5");
  const [showGeneratedFormulations, setShowGeneratedFormulations] = useState(false);
  const [generatedFormulations, setGeneratedFormulations] = useState<Formulation[]>([]);
  const { toast } = useToast();

  // Use database categories
  const allBulkCategories = categories;

  const generateBulkFormulations = useMutation({
    mutationFn: async ({ categoryId, count }: { categoryId: string; count: number }) => {
      // All categories are now interface categories (use categorySlug)
      const response = await apiRequest("POST", "/api/ai/generate-bulk-formulations-with-keywords", { 
        categorySlug: categoryId, 
        count 
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Invalidate all formulation-related queries to ensure fresh data appears immediately
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/formulations", "category"] });
      queryClient.invalidateQueries({ queryKey: ["/api/formulations-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/formulations-all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      // Use the actual generated formulations from the API response
      const formulations = data?.formulations || data?.createdFormulations || [];
      const count = formulations.length || data?.count || 0;
      
      toast({ 
        title: "Professional formulations generated!", 
        description: `Successfully generated ${count} formulations with professional 9-section structure`
      });
      
      // Store and show the exact generated formulations
      setGeneratedFormulations(formulations);
      setShowGeneratedFormulations(true);
      
      // Reset form
      setSelectedCategoryId("");
      setFormulationCount("5");
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

    generateBulkFormulations.mutate({ categoryId: selectedCategoryId, count });
  };

  const selectedCategory = allBulkCategories.find(c => c.slug === selectedCategoryId);

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
                  {allBulkCategories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
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
                  Generating {formulationCount} formula formulations...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Generate {formulationCount} Formula Formulations
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Generated Formulations Preview */}
      {showGeneratedFormulations && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Eye className="h-5 w-5" />
              Recently Generated Professional Formulations
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Professional 9-Section Structure
              </Badge>
            </CardTitle>
            <p className="text-green-700">
              Your formulations have been generated with the same professional structure as AIFormulator individual generations.
              Each includes enhanced descriptions, category-specific ingredients, and detailed technical specifications.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {generatedFormulations && generatedFormulations.length > 0 ? (
                <>
                  <div className="text-center mb-6">
                    <Badge className="bg-green-600 text-white text-sm px-4 py-2">
                      {generatedFormulations.length} Professional Formulations Generated
                    </Badge>
                    <p className="text-green-700 text-sm mt-2">
                      These are the exact formulations that were just created with professional 9-section structure
                    </p>
                  </div>
                  {generatedFormulations.slice(0, 3).map((formulation) => (
                    <div key={formulation.id} className="border-l-4 border-green-500 pl-4">
                      <FormulationPreview 
                        formulation={formulation} 
                        category={allBulkCategories.find(c => c.id === formulation.categoryId)}
                      />
                    </div>
                  ))}
                  {generatedFormulations.length > 3 && (
                    <div className="text-center pt-4">
                      <p className="text-green-700 text-sm">
                        And {generatedFormulations.length - 3} more formulations with the same professional structure...
                      </p>
                      <p className="text-green-600 text-xs mt-2">
                        View all formulations in the admin panel or browse categories to see individual details.
                      </p>
                    </div>
                  )}
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowGeneratedFormulations(false);
                        setGeneratedFormulations([]);
                      }}
                      className="text-green-700 border-green-300 hover:bg-green-50"
                    >
                      Hide Preview
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-green-700">No formulations to display</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}