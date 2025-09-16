import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Category } from "@shared/schema";
import { FORMULATION_CATEGORIES } from "@/constants/categories";

interface AiFormulationFormProps {
  categories?: Category[]; // Optional since we now use shared categories
  onSuccess: () => void;
}

export default function AiFormulationForm({ categories, onSuccess }: AiFormulationFormProps) {
  // Use shared formulation categories for consistency
  const formulationCategories = FORMULATION_CATEGORIES;
  const [categoryId, setCategoryId] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const { toast } = useToast();

  const generateFormulation = useMutation({
    mutationFn: ({ categoryId, productDescription }: { categoryId: string; productDescription: string }) => 
      apiRequest("POST", "/api/ai/generate-formulation", { categoryId, productDescription }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ 
        title: "Formulation generated successfully", 
        description: `Created formulation: ${data.name}` 
      });
      setCategoryId("");
      setProductDescription("");
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate formulation", 
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
    generateFormulation.mutate({ categoryId, productDescription });
  };

  const selectedCategory = formulationCategories.find(c => c.id === categoryId);

  return (
    <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-accent">
          <Sparkles className="h-5 w-5" />
          AI Formulation Generator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Select a category and describe your product requirements. AI will generate a complete professional formulation with ingredients, instructions, and technical specifications.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Product Category
            </label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={generateFormulation.isPending}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {formulationCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Selected Category:</strong> {selectedCategory.name}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {selectedCategory.description}
              </p>
            </div>
          )}

          <div>
            <label htmlFor="productDescription" className="block text-sm font-medium mb-2">
              Product Description
            </label>
            <Textarea
              id="productDescription"
              data-testid="textarea-product-description"
              placeholder="Example: A fast-setting waterproof adhesive for outdoor metal repairs that cures in 5 minutes and withstands temperatures from -40°C to 120°C"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={4}
              className="w-full"
              disabled={generateFormulation.isPending}
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={generateFormulation.isPending || !categoryId || !productDescription.trim()}
              className="bg-accent text-white hover:bg-orange-600 flex-1"
              data-testid="button-generate-formulation"
            >
              {generateFormulation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Formulation
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
              disabled={generateFormulation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}