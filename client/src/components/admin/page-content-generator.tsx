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

  // Fetch saved page content from database
  const { data: savedContent } = useQuery<{ content: string } | null>({
    queryKey: ["/api/formulation-page-content", formulationId],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/formulation-page-content/${formulationId}`);
        if (response.status === 404) return null;
        return response.json();
      } catch (e) {
        return null;
      }
    },
  });

  // Update content when initialContent prop changes or saved content is fetched
  useEffect(() => {
    const contentToUse = savedContent?.content || initialContent || "";
    setContent(contentToUse);
  }, [initialContent, formulationId, savedContent]);

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

  // Extract strategies from content
  const extractStrategies = (html: string) => {
    const keywordMatch = html.match(/<h2>Keyword Strategy<\/h2>([\s\S]*?)(?=<h2>|$)/i);
    const ctaMatch = html.match(/<h2>CTA Strategy<\/h2>([\s\S]*?)(?=<h2>|$)/i);
    const pageMatch = html.match(/<h2>Page Strategy<\/h2>([\s\S]*?)(?=<h2>|$)/i);

    const extractText = (match: RegExpMatchArray | null) => {
      if (!match) return "";
      const text = match[1]
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim()
        .substring(0, 200);
      return text;
    };

    return {
      keywordStrategy: extractText(keywordMatch),
      ctaStrategy: extractText(ctaMatch),
      pageStrategy: extractText(pageMatch),
    };
  };

  const strategies = extractStrategies(content);

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
          {/* Page Strategy Info */}
          {content && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              {strategies.pageStrategy && (
                <div>
                  <h4 className="font-semibold text-sm text-blue-900 mb-2">📋 Page Strategy</h4>
                  <p className="text-sm text-blue-800">{strategies.pageStrategy}...</p>
                </div>
              )}
              {strategies.keywordStrategy && (
                <div>
                  <h4 className="font-semibold text-sm text-blue-900 mb-2">🔑 Keyword Strategy</h4>
                  <p className="text-sm text-blue-800">{strategies.keywordStrategy}...</p>
                </div>
              )}
            </div>
          )}

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
