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
  onImagesGenerated?: (images: { image1Url?: string; image2Url?: string; image3Url?: string }) => void;
}

export default function ImageStrategyGenerator({
  formulationId,
  formulationName,
  category,
  onImagesGenerated
}: ImageStrategyGeneratorProps) {
  const { toast } = useToast();
  const [generatedImages, setGeneratedImages] = useState<{ image1Url?: string; image2Url?: string; image3Url?: string }>({});

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
        description: "3 strategy images generated successfully!",
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
            Generate 3 professional product images automatically tailored to your formulation category.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Strategy Instructions */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-3">
            <h4 className="font-semibold text-sm text-amber-900">📋 3 Required Images:</h4>
            <div className="space-y-2 text-sm text-amber-800">
              <p><strong>Image 1 — Main Branding Image:</strong> Product icon with name on white background (Yellow #FFB100, Teal #2E8B9C)</p>
              <p><strong>Image 2 — Technical Illustration:</strong> Formula concept with 3 key features and category symbol</p>
              <p><strong>Image 3 — Process/Mechanism Diagram:</strong> How It Works flowchart or ingredient breakdown</p>
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
                Generating 3 Images...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate 3 Strategy Images
              </>
            )}
          </Button>

          {/* Display Generated Images */}
          {Object.keys(generatedImages).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
              {generatedImages.image1Url && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-green-900">✓ Branding Image</h4>
                  <img src={generatedImages.image1Url} alt="Branding" className="w-full h-auto rounded border" />
                </div>
              )}
              {generatedImages.image2Url && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-green-900">✓ Technical Illustration</h4>
                  <img src={generatedImages.image2Url} alt="Technical" className="w-full h-auto rounded border" />
                </div>
              )}
              {generatedImages.image3Url && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-green-900">✓ Process Diagram</h4>
                  <img src={generatedImages.image3Url} alt="Process" className="w-full h-auto rounded border" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
