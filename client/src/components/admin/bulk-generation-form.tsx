import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2, Package, Plus } from "lucide-react";
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
  const [categoryDescriptions, setCategoryDescriptions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentCategory: "" });
  const { toast } = useToast();

  const createCategory = useMutation({
    mutationFn: (description: string) => 
      apiRequest("POST", "/api/ai/generate-category", { description }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryDescriptions.trim()) {
      toast({ 
        title: "Category descriptions required", 
        description: "Please describe the types of categories you want to create",
        variant: "destructive" 
      });
      return;
    }

    // Split descriptions by line and filter out empty lines
    const descriptions = categoryDescriptions
      .split('\n')
      .map(desc => desc.trim())
      .filter(desc => desc.length > 0);

    if (descriptions.length === 0) {
      toast({ 
        title: "No valid descriptions found", 
        description: "Please enter at least one category description",
        variant: "destructive" 
      });
      return;
    }

    if (descriptions.length > 10) {
      toast({ 
        title: "Too many categories", 
        description: "Please limit to 10 categories at once",
        variant: "destructive" 
      });
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: descriptions.length, currentCategory: "" });

    const createdCategories = [];
    
    try {
      for (let i = 0; i < descriptions.length; i++) {
        const description = descriptions[i];
        setProgress({ current: i + 1, total: descriptions.length, currentCategory: description });
        
        try {
          const category = await createCategory.mutateAsync(description) as any;
          createdCategories.push(category);
          
          // Small delay between requests
          if (i < descriptions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Failed to create category: ${description}`, error);
        }
      }

      // Update cache
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      toast({ 
        title: "Bulk category generation completed!", 
        description: `Successfully created ${createdCategories.length} out of ${descriptions.length} categories`
      });

      // Reset form
      setCategoryDescriptions("");
      setProgress({ current: 0, total: 0, currentCategory: "" });
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
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Package className="h-5 w-5" />
          Bulk Category Generator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Create multiple new categories at once. AI will generate unique categories that don't already exist.
          Each category gets its own professional details, icon, and image.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="categoryDescriptions" className="block text-sm font-medium mb-2">
              Category Descriptions (One per line)
            </label>
            <Textarea
              id="categoryDescriptions"
              data-testid="textarea-bulk-categories"
              placeholder={`Example (one per line):
Professional hair care products for salons
Industrial cleaning solvents for manufacturing
Natural skincare for sensitive skin
Automotive paint protection systems
Pet grooming and hygiene products`}
              value={categoryDescriptions}
              onChange={(e) => setCategoryDescriptions(e.target.value)}
              rows={8}
              className="w-full"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter up to 10 category descriptions, one per line. AI will avoid creating duplicates.
            </p>
          </div>

          {/* Progress Display */}
          {isGenerating && (
            <div className="p-4 bg-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Creating category {progress.current} of {progress.total}
                </span>
              </div>
              {progress.currentCategory && (
                <div className="text-xs text-blue-600 mt-1">
                  Current: {progress.currentCategory.substring(0, 60)}...
                </div>
              )}
            </div>
          )}

          {/* Generation Preview */}
          {!isGenerating && categoryDescriptions.trim() && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Generation Preview
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    {categoryDescriptions.split('\n').filter(line => line.trim()).length} Categories
                  </Badge>
                  <span className="text-green-700">AI-generated with unique details</span>
                </div>
                <div className="text-green-600 text-xs">
                  Each category will get professional description, icon, and image
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isGenerating || !categoryDescriptions.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700 flex-1"
              data-testid="button-bulk-generate-categories"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Categories...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Generate {categoryDescriptions.split('\n').filter(line => line.trim()).length} Categories
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