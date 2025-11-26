import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Save, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PageContentGeneratorProps {
  formulationId: string;
  formulationName: string;
  category: string;
  initialContent?: string;
}

export default function PageContentGenerator({
  formulationId,
  formulationName,
  category,
  initialContent = "",
}: PageContentGeneratorProps) {
  const [content, setContent] = useState(initialContent);
  const { toast } = useToast();

  // Update content when initialContent prop changes
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    } else {
      setContent("");
    }
  }, [initialContent, formulationId]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/generate-full-page", {
        productName: formulationName,
        category,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setContent(data.content);
      toast({
        title: "Success",
        description: "Full page content generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate page content",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/formulation-page-content", {
        formulationId,
        content,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Page content saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/formulation-page-content", formulationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save page content",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: "Empty content",
        description: "Please add content before saving",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            AI Page Content Generator for: {formulationName}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Generate complete formulation page content in one click, then customize as needed.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generate Button */}
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full bg-[#2E8B9C] hover:bg-[#236b7a] text-white rounded-xl"
            data-testid="button-generate-full-page"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Full Page with AI
              </>
            )}
          </Button>

          {/* Content Textarea */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Full Page Content (HTML supported)
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Generated content will appear here. You can edit it before saving."
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="textarea-page-content"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !content.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-white"
            data-testid="button-save-page-content"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
