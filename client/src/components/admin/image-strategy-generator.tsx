import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ImageStrategyGeneratorProps {
  formulationId: string;
  formulationName: string;
  category: string;
  onImagesGenerated?: (images: { image1Url?: string; image2Url?: string; image3Url?: string; image4Url?: string }) => void;
}

export default function ImageStrategyGenerator({
  formulationId,
  formulationName,
  category,
  onImagesGenerated
}: ImageStrategyGeneratorProps) {
  const { toast } = useToast();
  const [generatedImages, setGeneratedImages] = useState<{ image1Url?: string; image2Url?: string; image3Url?: string; image4Url?: string }>({});

  const generateImagesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/generate-strategy-images", {
        formulationId,
        formulationName,
        category,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedImages(data.images);
      onImagesGenerated?.(data.images);
      toast({
        title: "Success",
        description: "4 strategy images generated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate strategy images",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            🎨 Image Strategy Engine for: {formulationName}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Generate 4 professional product images automatically tailored to your formulation category.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Strategy Instructions */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-3">
            <h4 className="font-semibold text-sm text-amber-900">📋 4 Strategy Images:</h4>
            <div className="space-y-2 text-sm text-amber-800">
              <p><strong>Image 1 — Main Branding Image:</strong> Product icon with name on white background (Yellow #FFB100, Teal #2E8B9C)</p>
              <p><strong>Image 2 — Technical Illustration:</strong> 3 key technical features with bold headings</p>
              <p><strong>Image 3 — How It Works Process:</strong> 3-4 step application/usage diagram with category-specific steps</p>
              <p><strong>Image 4 — Manufacturing Flow:</strong> 3-5 step manufacturing process adapted to product type</p>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={() => generateImagesMutation.mutate()}
            disabled={generateImagesMutation.isPending}
            className="w-full bg-[#2E8B9C] hover:bg-[#236b7a] text-white rounded-xl"
            data-testid="button-generate-strategy-images"
          >
            {generateImagesMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating 4 Images...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate 4 Strategy Images
              </>
            )}
          </Button>

          {/* Display Generated Images */}
          {Object.keys(generatedImages).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
              {generatedImages.image1Url && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-green-900">✓ Main Branding Image</h4>
                  <img src={generatedImages.image1Url} alt="Branding" className="w-full h-auto rounded border" />
                </div>
              )}
              {generatedImages.image2Url && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-green-900">✓ Technical Features</h4>
                  <img src={generatedImages.image2Url} alt="Technical" className="w-full h-auto rounded border" />
                </div>
              )}
              {generatedImages.image3Url && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-green-900">✓ How It Works</h4>
                  <img src={generatedImages.image3Url} alt="Process" className="w-full h-auto rounded border" />
                </div>
              )}
              {generatedImages.image4Url && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-green-900">✓ Manufacturing Flow</h4>
                  <img src={generatedImages.image4Url} alt="Manufacturing" className="w-full h-auto rounded border" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
