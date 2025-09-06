import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Plus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  const generateSuggestions = useMutation({
    mutationFn: async () => {
      const result = await apiRequest("POST", "/api/admin/suggest-categories");
      return result;
    },
    onSuccess: (data: any) => {
      const suggestions = data?.suggestions || [];
      setSuggestions(suggestions);
      setShowSuggestions(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate category suggestions. Please try again.",
        variant: "destructive",
      });
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
        onClick={() => {
          if (suggestions.length === 0 || !showSuggestions) {
            // Generate new suggestions
            generateSuggestions.mutate();
          } else {
            // Hide suggestions
            setShowSuggestions(false);
          }
        }}
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
        {showSuggestions && suggestions.length > 0 ? "Hide Suggestions" : "AI Suggest Categories"}
      </Button>

      {/* Inline suggestions display */}
      {(showSuggestions || generateSuggestions.isPending) && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">AI Category Suggestions</h3>
            </div>
            {showSuggestions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(false)}
                data-testid="button-close-suggestions"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <p className="text-sm text-gray-600">
            AI-generated suggestions for new categories that don't exist in your system yet.
          </p>

          <div className="space-y-4">
            {generateSuggestions.isPending ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-600">Generating AI-powered category suggestions...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {suggestions.map((suggestion, index) => (
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
                ))}
                
                {suggestions.length > 0 && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={() => generateSuggestions.mutate()}
                      disabled={generateSuggestions.isPending}
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate New Suggestions
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}