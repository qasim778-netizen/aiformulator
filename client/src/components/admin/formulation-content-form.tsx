import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface FormulationContentFormProps {
  formulationId: string;
  formulationName: string;
  category?: string;
  onSuccess: () => void;
}

export default function FormulationContentForm({
  formulationId,
  formulationName,
  category = "",
  onSuccess
}: FormulationContentFormProps) {
  const { toast } = useToast();
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Get category group for tone display
  const getCategoryGroup = (categoryName: string) => {
    const lower = categoryName.toLowerCase();
    
    if (/baby|kids|child|infant|baby wash|baby lotion/.test(lower)) 
      return { group: "A", name: "Baby & Gentle Care", tone: "Gentle, reassuring, mild tone" };
    if (/shampoo|skin|hair|face wash|cosmetic|beauty|scrub|lotion|cream/.test(lower)) 
      return { group: "B", name: "Skin / Hair / Beauty / Grooming", tone: "Soft, premium, cosmetic-style tone" };
    if (/cleaner|cleaning|toilet|fabric|laundry|all-purpose|detergent/.test(lower)) 
      return { group: "C", name: "Cleaning / Detergent / Household", tone: "Practical, instructional, performance-focused tone" };
    if (/car|automotive|vehicle|polish|tire|dashboard|shoe|leather/.test(lower)) 
      return { group: "D", name: "Car / Auto / Shoe / Leather", tone: "Professional detailing tone" };
    if (/adhesive|sealant|epoxy|tile|grout|marble|stone|construction/.test(lower)) 
      return { group: "E", name: "Adhesives / Sealants / Construction", tone: "Technical, structural, engineering-oriented tone" };
    if (/3d printing|filament|abs|pla|resin|polymer|industrial|coating/.test(lower)) 
      return { group: "F", name: "Industrial / 3D Printing / Coatings / Resins", tone: "Material-science tone" };
    if (/agro|agriculture|pest|mosquito|mite|flea|water treatment/.test(lower)) 
      return { group: "G", name: "Agriculture / Water Treatment / Pest", tone: "Compliance-aware tone" };
    if (/pet|dog|cat|pet spray|pet wash|deodorizer/.test(lower)) 
      return { group: "H", name: "Pet Care", tone: "Friendly, pet-safe, reassuring tone" };
    if (/organic|herbal|natural|essential oil|aroma/.test(lower)) 
      return { group: "I", name: "Herbal / Organic / Aromatherapy", tone: "Natural, botanical, eco-friendly tone" };
    
    return { group: "J", name: "Default", tone: "Standard professional tone" };
  };

  const categoryGroup = getCategoryGroup(category);

  // Fetch existing page content
  const { isLoading: isFetching } = useQuery({
    queryKey: ["/api/formulation-page-content", formulationId],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/formulation-page-content/${formulationId}`);
        if (response.status === 404) return null;
        const data = await response.json();
        if (data.content) {
          setContent(data.content);
        }
        return data;
      } catch (error) {
        console.error("Error fetching content:", error);
        return null;
      }
    },
  });

  // Save mutation - reusing the same endpoint as auto-generate tab
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!content.trim()) {
        throw new Error("Content cannot be empty");
      }
      const response = await apiRequest("POST", "/api/formulation-page-content", {
        formulationId,
        content
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Page content saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/formulation-page-content", formulationId] });
      onSuccess();
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
    saveMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Manual Page Content Editor for: {formulationName}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Edit the complete formulation page content in HTML format, then save.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Group & Tone Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div>
              <h4 className="font-semibold text-sm text-purple-900 mb-1">📂 Category Group</h4>
              <p className="text-sm text-purple-800"><strong>Group {categoryGroup.group}:</strong> {categoryGroup.name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-purple-900 mb-1">🎯 Tone Style</h4>
              <p className="text-sm text-purple-800">{categoryGroup.tone}</p>
            </div>
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Full Page Content (HTML supported)
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or edit your complete HTML page content here..."
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              data-testid="textarea-page-content"
            />
            <p className="text-xs text-gray-500">
              You can include HTML tags like &lt;h1&gt;, &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || isFetching || !content.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            data-testid="button-save-content"
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
