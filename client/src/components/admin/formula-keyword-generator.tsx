import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Image as ImageIcon, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category } from "@shared/schema";

interface FormulaKeywordGeneratorProps {
  categories: Category[];
  onSuccess: () => void;
}

export default function FormulaKeywordGenerator({ categories, onSuccess }: FormulaKeywordGeneratorProps) {
  const [categoryId, setCategoryId] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [includeImage, setIncludeImage] = useState(true);
  const { toast } = useToast();

  const generateFormulation = useMutation({
    mutationFn: ({ categoryId, productDescription, includeImage }: { 
      categoryId: string; 
      productDescription: string; 
      includeImage: boolean;
    }) => 
      apiRequest("POST", "/api/ai/generate-formulation-with-keywords", { 
        categoryId, 
        productDescription, 
        includeImage 
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      // Invalidate cache so generated formulas appear in customer dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/user/generated'] });
      toast({ 
        title: "Formula generation completed!", 
        description: `Created formulation: ${data.name} ${data.image ? 'with matching image' : ''}` 
      });
      setCategoryId("");
      setProductDescription("");
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate formula", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast({ 
        title: "Category required", 
        description: "Please select a category",
        variant: "destructive" 
      });
      return;
    }
    if (!productDescription.trim()) {
      toast({ 
        title: "Description required", 
        description: "Please enter a product description",
        variant: "destructive" 
      });
      return;
    }
    generateFormulation.mutate({ categoryId, productDescription, includeImage });
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <FlaskConical className="h-5 w-5" />
          Formula Generator with Keywords & Images
        </CardTitle>
        <p className="text-sm text-purple-600">
          Generate professional formulations with "Formula" or "Formulation" in the title, 
          optionally including AI-generated product images for visual marketing.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="category" className="block text-sm font-medium mb-2">
              Product Category
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <i className={category.icon} />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory && (
              <p className="text-xs text-gray-600 mt-1">
                {selectedCategory.description}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className="block text-sm font-medium mb-2">
              Product Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the product you want to create a formulation for. Be specific about its intended use, key benefits, and target market..."
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={4}
              className="resize-none"
              data-testid="textarea-product-description"
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: "A gentle daily cleanser for sensitive skin with anti-aging properties"
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              <div>
                <Label htmlFor="include-image" className="font-medium text-blue-900">
                  Generate Product Image
                </Label>
                <p className="text-xs text-blue-700">
                  Create AI-generated product photography for marketing
                </p>
              </div>
            </div>
            <Switch
              id="include-image"
              checked={includeImage}
              onCheckedChange={setIncludeImage}
              data-testid="switch-include-image"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-yellow-600" />
              <h4 className="text-sm font-medium text-yellow-800">Formula Features</h4>
            </div>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Product names will include "Formula" or "Formulation" keywords</li>
              <li>• Professional chemical formulations with INCI ingredients</li>
              <li>• Complete manufacturing instructions and specifications</li>
              <li>• Optional AI-generated product images for marketing use</li>
              <li>• SEO-optimized content for better discoverability</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={generateFormulation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-generate-formula"
            >
              {generateFormulation.isPending ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating Formula...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Generate Formula {includeImage ? '+ Image' : ''}
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setCategoryId("");
                setProductDescription("");
                setIncludeImage(true);
              }}
              disabled={generateFormulation.isPending}
              data-testid="button-clear-form"
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}