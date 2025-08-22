import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2, Zap, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface BulkGenerationFormProps {
  onSuccess: () => void;
}

export default function BulkGenerationForm({ onSuccess }: BulkGenerationFormProps) {
  const [categoryDescription, setCategoryDescription] = useState("");
  const [formulationCount, setFormulationCount] = useState("5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ step: "", categoryId: "", generatedCount: 0 });
  const { toast } = useToast();

  const createCategory = useMutation({
    mutationFn: (description: string) => 
      apiRequest("POST", "/api/ai/generate-category", { description }),
  });

  const generateBulkFormulations = useMutation({
    mutationFn: ({ categoryId, count }: { categoryId: string; count: number }) => 
      apiRequest("POST", "/api/ai/generate-bulk-formulations", { categoryId, count }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryDescription.trim()) {
      toast({ 
        title: "Category description required", 
        description: "Please describe the type of products you want to create",
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

    setIsGenerating(true);
    setProgress({ step: "Creating category...", categoryId: "", generatedCount: 0 });

    try {
      // Step 1: Create category
      const category = await createCategory.mutateAsync(categoryDescription) as any;
      setProgress({ 
        step: "Generating formulations...", 
        categoryId: category.id, 
        generatedCount: 0 
      });

      // Step 2: Generate formulations
      const result = await generateBulkFormulations.mutateAsync({
        categoryId: category.id,
        count: count
      }) as any;

      // Update cache
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      toast({ 
        title: "Bulk generation completed!", 
        description: `Created category "${category.name}" with ${result.count} formulations`
      });

      // Reset form
      setCategoryDescription("");
      setFormulationCount("5");
      setProgress({ step: "", categoryId: "", generatedCount: 0 });
      onSuccess();

    } catch (error: any) {
      toast({ 
        title: "Bulk generation failed", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Zap className="h-5 w-5" />
          Bulk Category & Formulations Generator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Create a complete product category with multiple formulations in one operation. 
          AI will generate both the category details and all specified formulations automatically.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="categoryDescription" className="block text-sm font-medium mb-2">
              Product Category Description
            </label>
            <Textarea
              id="categoryDescription"
              data-testid="textarea-bulk-category-description"
              placeholder="Example: Professional automotive detailing products including polishes, waxes, cleaners, and protective coatings for car care businesses"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              rows={4}
              className="w-full"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Describe the type of chemical products you want to manufacture
            </p>
          </div>

          <div>
            <label htmlFor="formulationCount" className="block text-sm font-medium mb-2">
              Number of Formulations to Generate
            </label>
            <Input
              id="formulationCount"
              data-testid="input-formulation-count"
              type="number"
              min="1"
              max="50"
              value={formulationCount}
              onChange={(e) => setFormulationCount(e.target.value)}
              className="w-32"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose between 1-50 formulations (recommended: 5-10 for variety)
            </p>
          </div>

          {/* Progress Display */}
          {isGenerating && (
            <div className="p-4 bg-purple-100 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span className="text-sm font-medium text-purple-800">
                  {progress.step}
                </span>
              </div>
              {progress.categoryId && (
                <div className="text-xs text-purple-600">
                  Category created! Generating {formulationCount} formulations...
                </div>
              )}
            </div>
          )}

          {/* Generation Preview */}
          {!isGenerating && categoryDescription && formulationCount && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Generation Preview
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    1 Category
                  </Badge>
                  <span className="text-blue-700">Auto-generated with AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                    {formulationCount} Formulations
                  </Badge>
                  <span className="text-purple-700">Complete with ingredients & instructions</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isGenerating || !categoryDescription.trim() || !formulationCount}
              className="bg-purple-600 text-white hover:bg-purple-700 flex-1"
              data-testid="button-bulk-generate"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Category + {formulationCount} Formulations
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
              disabled={isGenerating}
              data-testid="button-cancel-bulk"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}