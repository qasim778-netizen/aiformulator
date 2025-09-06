import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, Upload, X, Wand2 } from "lucide-react";

export function ImageGenerator() {
  const [formulationName, setFormulationName] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedAltText, setGeneratedAltText] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const generateAltTextMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiRequest("POST", "/api/admin/generate-alt-text", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedAltText(data.altText);
      toast({
        title: "Alt Text Generated Successfully!",
        description: "SEO-optimized alt text has been created for your formulation.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate alt text. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateAltText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulationName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a formulation name.",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateAltTextMutation.mutateAsync({
        name: formulationName,
      });
    } catch (error) {
      console.error("Error generating alt text:", error);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setUploadedImage(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (PNG, JPG, JPEG, WebP).",
          variant: "destructive",
        });
      }
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎨 AI Image Generator
        </h1>
        <p className="text-gray-600">
          Generate professional formulation images with custom branding and SEO optimization
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Alt Text Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Generate Alt Text
            </CardTitle>
            <CardDescription>
              Create SEO-optimized alt text for your formulation image
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateAltText} className="space-y-4">
              <div>
                <Label htmlFor="formulation-name">Formulation Name *</Label>
                <Input
                  id="formulation-name"
                  value={formulationName}
                  onChange={(e) => setFormulationName(e.target.value)}
                  placeholder="e.g., Advanced Hair Shampoo"
                  className="mt-1"
                  data-testid="input-formulation-name"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will appear as '[Name] Formulation' in the alt text
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={generateAltTextMutation.isPending || !formulationName.trim()}
                data-testid="button-generate-alt-text"
              >
                {generateAltTextMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Alt Text...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Alt Text
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Manual Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Image
            </CardTitle>
            <CardDescription>
              Manually upload your formulation image
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Uploaded image preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={removeUploadedImage}
                      data-testid="button-remove-image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload a formulation image
                        </span>
                        <span className="mt-1 block text-sm text-gray-500">
                          PNG, JPG, JPEG, WebP up to 10MB
                        </span>
                      </Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="sr-only"
                        data-testid="input-image-upload"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Alt Text Results */}
      {generatedAltText && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Alt Text</CardTitle>
            <CardDescription>
              Your SEO-optimized alt text is ready to use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-700">Alt Text</Label>
                  <Textarea
                    value={generatedAltText}
                    readOnly
                    className="mt-1 bg-white"
                    rows={3}
                    data-testid="textarea-generated-alt-text"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedAltText, "Alt Text")}
                  className="ml-3"
                  data-testid="button-copy-alt-text"
                >
                  {copiedField === "Alt Text" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}