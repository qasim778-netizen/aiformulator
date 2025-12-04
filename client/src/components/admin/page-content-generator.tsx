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

  // Category-to-Group mapping (Tone Engine V1 + Structure Engine V1)
  const getCategoryGroup = (categoryName: string) => {
    const lower = categoryName.toLowerCase();
    
    // PATTERN-BABY-A: Baby Care / Sensitive
    if (/baby|kids|child|infant|baby wash|baby lotion|sensitive/.test(lower)) 
      return { 
        group: "BABY", 
        name: "Baby Care / Sensitive", 
        tone: "Very soft, safe, protective tone with parental trust voice",
        pattern: "PATTERN-BABY-A",
        vocabulary: "hypoallergenic, tear-free, ultra-gentle"
      };
    
    // PATTERN-BEAUTY-A: Cosmetics / Skin / Hair
    if (/shampoo|skin|hair|face wash|cosmetic|beauty|scrub|lotion|cream|moisturizer/.test(lower)) 
      return { 
        group: "BEAUTY", 
        name: "Cosmetics / Skin & Hair Care", 
        tone: "Soft, sensory, benefit-driven tone with smooth voice",
        pattern: "PATTERN-BEAUTY-A",
        vocabulary: "hydrate, nourish, pH-balanced, conditioning, botanical extracts"
      };
    
    // PATTERN-CLEAN-A: Cleaning Products
    if (/cleaner|cleaning|toilet|fabric|laundry|all-purpose|detergent|disinfect/.test(lower)) 
      return { 
        group: "CLEANING", 
        name: "Cleaning Products", 
        tone: "Functional, performance-focused tone with direct voice",
        pattern: "PATTERN-CLEAN-A",
        vocabulary: "surfactant system, stain removal, degreasing, foam profile"
      };
    
    // PATTERN-AUTO-A: Automotive / Car Care
    if (/car|automotive|vehicle|polish|tire|dashboard|wax|detailing/.test(lower)) 
      return { 
        group: "AUTO", 
        name: "Automotive / Car Care", 
        tone: "Premium performance, technical tone with confident detailer voice",
        pattern: "PATTERN-AUTO-A",
        vocabulary: "hydrophobic layer, gloss, cutting power, lubrication, UV resistance"
      };
    
    // Leather & Shoe Care (uses AUTO pattern)
    if (/shoe|leather|footwear/.test(lower)) 
      return { 
        group: "LEATHER", 
        name: "Leather & Shoe Care", 
        tone: "Premium protective tone with balanced functional + luxury voice",
        pattern: "PATTERN-AUTO-A",
        vocabulary: "conditioning oils, waterproofing barrier, color restoration"
      };
    
    // PATTERN-CONST-A: Construction / Adhesives / Building Materials
    if (/adhesive|sealant|epoxy|tile|grout|marble|stone|construction|cement|concrete/.test(lower)) 
      return { 
        group: "CONSTRUCTION", 
        name: "Construction / Adhesives / Building Materials", 
        tone: "Technical, engineering, structured tone with objective voice",
        pattern: "PATTERN-CONST-A",
        vocabulary: "substrate, tensile strength, curing, rheology, adhesion, polymer dispersion"
      };
    
    // PATTERN-CLEAN-A (Industrial): Industrial / 3D Printing / Coatings
    if (/3d printing|filament|abs|pla|resin|polymer|industrial|coating/.test(lower)) 
      return { 
        group: "INDUSTRIAL", 
        name: "Industrial / 3D Printing / Coatings", 
        tone: "Material-science, technical tone with engineering-focused voice",
        pattern: "PATTERN-CLEAN-A",
        vocabulary: "polymer, resin, dimensional accuracy, layer adhesion"
      };
    
    // Agriculture / Water Treatment / Pest
    if (/agro|agriculture|pest|mosquito|mite|flea|water treatment|fertilizer/.test(lower)) 
      return { 
        group: "AGRO", 
        name: "Agriculture / Water Treatment / Pest", 
        tone: "Compliance-aware tone with precise voice",
        pattern: "PATTERN-CLEAN-A",
        vocabulary: "efficacy, safe handling, environmental compliance"
      };
    
    // Pet Care
    if (/pet|dog|cat|pet spray|pet wash|deodorizer|animal/.test(lower)) 
      return { 
        group: "PET", 
        name: "Pet Care", 
        tone: "Friendly, pet-safe, reassuring tone with pet-loving voice",
        pattern: "PATTERN-BABY-A",
        vocabulary: "coat health, odor control, pet-friendly, non-toxic"
      };
    
    // PATTERN-CLINICAL-A: Oral Care / Probiotics
    if (/oral|dental|toothpaste|mouthwash|probiotic/.test(lower)) 
      return { 
        group: "ORAL", 
        name: "Oral Care / Probiotics", 
        tone: "Clinical, hygienic, friendly tone with scientific but soft voice",
        pattern: "PATTERN-CLINICAL-A",
        vocabulary: "oral microbiome, plaque, fresh breath, enamel-safe"
      };
    
    // Herbal / Organic / Aromatherapy
    if (/organic|herbal|natural|essential oil|aroma|botanical/.test(lower)) 
      return { 
        group: "HERBAL", 
        name: "Herbal / Organic / Aromatherapy", 
        tone: "Natural, botanical, eco-friendly tone with wellness-oriented voice",
        pattern: "PATTERN-BEAUTY-A",
        vocabulary: "plant extracts, essential oils, sustainability, natural ingredients"
      };
    
    // Food-Contact or Near-Body Industrial
    if (/food|beverage|kitchen|food-grade/.test(lower)) 
      return { 
        group: "FOOD", 
        name: "Food-Contact / Near-Body Industrial", 
        tone: "Safety + compliance tone with precise voice",
        pattern: "PATTERN-CLEAN-A",
        vocabulary: "food-grade, non-toxic, compliant"
      };
    
    return { 
      group: "DEFAULT", 
      name: "General Formulation", 
      tone: "Standard professional explanatory tone",
      pattern: "PATTERN-CLEAN-A",
      vocabulary: "professional, effective, reliable"
    };
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
  const categoryGroup = getCategoryGroup(category);

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
          {/* Category-Based Generation Info (Tone Engine + Structure Engine) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div>
              <h4 className="font-semibold text-sm text-purple-900 mb-1">📂 Category Group</h4>
              <p className="text-sm text-purple-800"><strong>{categoryGroup.group}:</strong> {categoryGroup.name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-purple-900 mb-1">🎯 Tone Engine</h4>
              <p className="text-sm text-purple-800">{categoryGroup.tone}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-purple-900 mb-1">📐 Structure Pattern</h4>
              <p className="text-sm text-purple-800">{categoryGroup.pattern}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-purple-900 mb-1">📝 Category Vocabulary</h4>
              <p className="text-sm text-purple-800 italic">{categoryGroup.vocabulary}</p>
            </div>
          </div>

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
