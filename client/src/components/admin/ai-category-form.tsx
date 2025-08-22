import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface AiCategoryFormProps {
  onSuccess: () => void;
}

export default function AiCategoryForm({ onSuccess }: AiCategoryFormProps) {
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const generateCategory = useMutation({
    mutationFn: (description: string) => 
      apiRequest("POST", "/api/ai/generate-category", { description }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ 
        title: "Category generated successfully", 
        description: `Created category: ${data.name}` 
      });
      setDescription("");
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate category", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({ 
        title: "Description required", 
        description: "Please enter a description for the category",
        variant: "destructive" 
      });
      return;
    }
    generateCategory.mutate(description);
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          AI Category Generator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Describe the type of chemical products you want to manufacture, and AI will create a professional category with appropriate details.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Product Category Description
            </label>
            <Textarea
              id="description"
              data-testid="textarea-category-description"
              placeholder="Example: Industrial adhesives for bonding metals and plastics in automotive manufacturing"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full"
              disabled={generateCategory.isPending}
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={generateCategory.isPending || !description.trim()}
              className="bg-primary text-white hover:bg-blue-700 flex-1"
              data-testid="button-generate-category"
            >
              {generateCategory.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Category
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
              disabled={generateCategory.isPending}
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