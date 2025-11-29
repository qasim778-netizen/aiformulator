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
  onImagesGenerated?: (images: { image1Url?: string }) => void;
}

export default function ImageStrategyGenerator({
  formulationId,
  formulationName,
  category,
  onImagesGenerated
}: ImageStrategyGeneratorProps) {
  const { toast } = useToast();
  const [generatedImages, setGeneratedImages] = useState<{ image1Url?: string }>({});

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
        description: "Main branding image generated successfully!",
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
            🎨 Social Media Post Generator for: {formulationName}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Generate a professional AI Formulator social media post with product icon and branding.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Strategy Instructions */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-3">
            <h4 className="font-semibold text-sm text-amber-900">📋 Social Media Post Format:</h4>
            <div className="space-y-2 text-sm text-amber-800">
              <p><strong>Cream-yellow background (#FFF9D9)</strong> • Bold product name (2 lines) • "Ready-to-manufacture recipe" subheadline • Centered line-art icon with teal decorative elements • AI Formulator branding at bottom • Minimal, flat design style</p>
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
                Generating Image...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate Main Branding Image
              </>
            )}
          </Button>

          {/* Display Generated Image */}
          {generatedImages.image1Url && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-sm text-green-900 mb-3">✓ Social Media Post Generated</h4>
              <div className="overflow-auto bg-white rounded border min-h-[700px] flex items-center justify-center p-2">
                <img src={generatedImages.image1Url} alt="Social Media Post" className="w-full h-auto rounded" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
