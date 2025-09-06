import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CategorySuggestion {
  name: string;
  description: string;
  icon: string;
  reasoning: string;
}

export default function AICategorySuggestions() {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const generateSuggestions = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/suggest-categories"),
    onSuccess: (data: { suggestions: CategorySuggestion[] }) => {
      setSuggestions(data.suggestions || []);
      setDialogOpen(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate category suggestions. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to generate suggestions:", error);
    },
  });

  const createCategory = useMutation({
    mutationFn: (suggestion: CategorySuggestion) =>
      apiRequest("POST", "/api/admin/categories", {
        name: suggestion.name,
        description: suggestion.description,
        icon: suggestion.icon,
      }),
    onSuccess: (data: { category: { name: string; id: string } }) => {
      toast({
        title: "Success",
        description: `Category "${data.category.name}" created successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      // Remove the created suggestion from the list
      setSuggestions(prev => prev.filter(s => s.name !== data.category.name));
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category. It may already exist.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Button 
        onClick={() => generateSuggestions.mutate()}
        disabled={generateSuggestions.isPending}
        variant="outline"
        className="ml-2"
        data-testid="button-ai-suggest-categories"
      >
        {generateSuggestions.isPending ? (
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        AI Suggest Categories
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              AI Category Suggestions
            </DialogTitle>
            <DialogDescription>
              Here are AI-generated suggestions for new categories that don't exist in your system yet.
              Click "Add Category" to create any that would be valuable for your formulation database.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  No suggestions generated yet. Click "AI Suggest Categories" to get started.
                </CardContent>
              </Card>
            ) : (
              suggestions.map((suggestion, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {suggestion.name}
                      </CardTitle>
                      <Button
                        onClick={() => createCategory.mutate(suggestion)}
                        disabled={createCategory.isPending}
                        size="sm"
                        data-testid={`button-add-suggested-category-${index}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Category
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <p className="text-gray-700">{suggestion.description}</p>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Icon: {suggestion.icon}
                        </Badge>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>Why this category:</strong> {suggestion.reasoning}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => generateSuggestions.mutate()}
                disabled={generateSuggestions.isPending}
                variant="outline"
              >
                {generateSuggestions.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Generate New Suggestions
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}