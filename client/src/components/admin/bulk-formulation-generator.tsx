import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2, FlaskConical, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Category } from "@shared/schema";

interface BulkFormulationGeneratorProps {
  categories: Category[];
}

export default function BulkFormulationGenerator({ categories }: BulkFormulationGeneratorProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [formulationCount, setFormulationCount] = useState("5");
  const { toast } = useToast();

  const generateBulkFormulations = useMutation({
    mutationFn: ({ categoryId, count }: { categoryId: string; count: number }) => 
      apiRequest("POST", "/api/ai/generate-bulk-formulations", { categoryId, count }),
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
            Select an existing category and generate multiple professional formulations automatically. 
            Perfect for quickly populating your product database with diverse chemical formulations.
          </p>
          <div className="flex gap-4 text-sm text-green-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              AI-generated unique formulations
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Complete with INCI names & instructions
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Professional technical specifications
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

            {/* Preview */}
            {selectedCategory && formulationCount && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Generation Preview
                </h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                    {formulationCount} Formulations
                  </Badge>
                  <span className="text-purple-700 text-sm">for {selectedCategory.name}</span>
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              disabled={generateBulkFormulations.isPending || !selectedCategoryId || !formulationCount}
              className="bg-accent text-white hover:bg-orange-600 w-full"
              data-testid="button-generate-bulk-formulations"
            >
              {generateBulkFormulations.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating {formulationCount} formulations...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate {formulationCount} Formulations
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Category Statistics */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      className="h-8 w-8 rounded-md object-cover"
                      src={category.image}
                      alt={category.name}
                    />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                      <p className="text-xs text-gray-500">{category.description.substring(0, 50)}...</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    Available
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}