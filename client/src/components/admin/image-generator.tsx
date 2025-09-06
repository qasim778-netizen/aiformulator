import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Check, Image, Wand2, Upload, X } from "lucide-react";

// Image compression utility function
const compressImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width = (width * maxWidth) / height;
          height = maxWidth;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg', // Always convert to JPEG for better compression
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Fallback to original if compression fails
        }
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

interface GeneratedImage {
  imageUrl: string;
  fileName: string;
  seoData: {
    altText: string;
    title: string;
    description: string;
    keywords: string;
  };
}

export function ImageGenerator() {
  const [formulationName, setFormulationName] = useState("");
  const [brandName, setBrandName] = useState("AIFormulator");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const generateImageMutation = useMutation({
    mutationFn: async (data: { name: string; brandName: string; referenceImageBase64?: string }) => {
      const response = await apiRequest("POST", "/api/admin/generate-image", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data);
      toast({
        title: "Image Generated Successfully!",
        description: "Your custom formulation image has been created with SEO optimization.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulationName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a formulation name.",
        variant: "destructive",
      });
      return;
    }

    // Convert reference image to base64 if provided
    let referenceImageBase64: string | undefined;
    if (referenceImage) {
      // Compress and resize image before converting to base64
      const compressedImage = await compressImage(referenceImage, 800, 0.7); // Max 800px, 70% quality
      const reader = new FileReader();
      referenceImageBase64 = await new Promise((resolve) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data:image/... prefix
        };
        reader.readAsDataURL(compressedImage);
      });
    }

    generateImageMutation.mutate({
      name: formulationName.trim(),
      brandName: brandName.trim() || "AIFormulator",
      referenceImageBase64
    });
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
        setReferenceImage(file);
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

  const removeReferenceImage = () => {
    setReferenceImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const downloadImage = () => {
    if (generatedImage?.imageUrl) {
      const link = document.createElement('a');
      link.href = generatedImage.imageUrl;
      link.download = generatedImage.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Generate Image
            </CardTitle>
            <CardDescription>
              Create a professional flat 2D illustration for your formulation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="formulation-name">Formulation Name *</Label>
                <Input
                  id="formulation-name"
                  value={formulationName}
                  onChange={(e) => setFormulationName(e.target.value)}
                  placeholder="e.g., Advanced Hair Shampoo"
                  disabled={generateImageMutation.isPending}
                  data-testid="input-formulation-name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will appear as "[Name] Formulation" in the image
                </p>
              </div>

              <div>
                <Label htmlFor="brand-name">Brand Name</Label>
                <Input
                  id="brand-name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="AIFormulator"
                  disabled={generateImageMutation.isPending}
                  data-testid="input-brand-name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will appear at the bottom of the image
                </p>
              </div>

              <div>
                <Label htmlFor="reference-image">Reference Image (Optional)</Label>
                <div className="mt-1">
                  {!referenceImage ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        id="reference-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={generateImageMutation.isPending}
                        className="hidden"
                        data-testid="input-reference-image"
                      />
                      <label
                        htmlFor="reference-image"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Upload a reference image
                        </span>
                        <span className="text-xs text-gray-500">
                          PNG, JPG, JPEG, WebP up to 10MB
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={previewUrl!}
                        alt="Reference image"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <Button
                        type="button"
                        onClick={removeReferenceImage}
                        disabled={generateImageMutation.isPending}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white"
                        size="sm"
                        data-testid="button-remove-reference"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="mt-2 text-xs text-gray-600">
                        <strong>File:</strong> {referenceImage.name}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Upload an image to guide the AI generation style and appearance
                </p>
              </div>

              <Button
                type="submit"
                disabled={generateImageMutation.isPending || !formulationName.trim()}
                className="w-full"
                data-testid="button-generate-image"
              >
                {generateImageMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Image className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview and Results */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
            <CardDescription>
              Your custom formulation image with SEO optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generateImageMutation.isPending ? (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-gray-600">Generating your image...</p>
                  <p className="text-xs text-gray-500 mt-1">This may take 10-30 seconds</p>
                </div>
              </div>
            ) : generatedImage ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={generatedImage.imageUrl}
                    alt={generatedImage.seoData.altText}
                    className="w-full rounded-lg border border-gray-200"
                    data-testid="img-generated-preview"
                  />
                  <Button
                    onClick={downloadImage}
                    className="absolute top-2 right-2 bg-white/90 text-gray-700 hover:bg-white"
                    size="sm"
                    data-testid="button-download-image"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Image className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Generated image will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEO Data Section */}
      {generatedImage && (
        <Card>
          <CardHeader>
            <CardTitle>SEO Optimization Data</CardTitle>
            <CardDescription>
              Copy these SEO-optimized values for your website or marketing materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="html" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="html">HTML Code</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="alt-text">Alt Text</TabsTrigger>
              </TabsList>

              <TabsContent value="html" className="mt-4">
                <div className="space-y-3">
                  <Label>HTML Image Tag</Label>
                  <div className="relative">
                    <Textarea
                      value={`<img src="${generatedImage.imageUrl}" alt="${generatedImage.seoData.altText}" title="${generatedImage.seoData.title}" class="formulation-image" />`}
                      readOnly
                      className="font-mono text-sm h-20"
                      data-testid="textarea-html-code"
                    />
                    <Button
                      onClick={() => copyToClipboard(
                        `<img src="${generatedImage.imageUrl}" alt="${generatedImage.seoData.altText}" title="${generatedImage.seoData.title}" class="formulation-image" />`,
                        "HTML Code"
                      )}
                      className="absolute top-2 right-2"
                      size="sm"
                      variant="outline"
                      data-testid="button-copy-html"
                    >
                      {copiedField === "HTML Code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label>Image Title</Label>
                    <div className="relative">
                      <Input
                        value={generatedImage.seoData.title}
                        readOnly
                        data-testid="input-seo-title"
                      />
                      <Button
                        onClick={() => copyToClipboard(generatedImage.seoData.title, "Title")}
                        className="absolute top-1 right-1 h-8 w-8"
                        size="sm"
                        variant="outline"
                        data-testid="button-copy-title"
                      >
                        {copiedField === "Title" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <div className="relative">
                      <Textarea
                        value={generatedImage.seoData.description}
                        readOnly
                        className="h-16"
                        data-testid="textarea-seo-description"
                      />
                      <Button
                        onClick={() => copyToClipboard(generatedImage.seoData.description, "Description")}
                        className="absolute top-2 right-2"
                        size="sm"
                        variant="outline"
                        data-testid="button-copy-description"
                      >
                        {copiedField === "Description" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Keywords</Label>
                    <div className="relative">
                      <Input
                        value={generatedImage.seoData.keywords}
                        readOnly
                        data-testid="input-seo-keywords"
                      />
                      <Button
                        onClick={() => copyToClipboard(generatedImage.seoData.keywords, "Keywords")}
                        className="absolute top-1 right-1 h-8 w-8"
                        size="sm"
                        variant="outline"
                        data-testid="button-copy-keywords"
                      >
                        {copiedField === "Keywords" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="alt-text" className="mt-4">
                <div>
                  <Label>Alt Text for Accessibility</Label>
                  <div className="relative">
                    <Textarea
                      value={generatedImage.seoData.altText}
                      readOnly
                      className="h-16"
                      data-testid="textarea-alt-text"
                    />
                    <Button
                      onClick={() => copyToClipboard(generatedImage.seoData.altText, "Alt Text")}
                      className="absolute top-2 right-2"
                      size="sm"
                      variant="outline"
                      data-testid="button-copy-alt-text"
                    >
                      {copiedField === "Alt Text" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Optimized for screen readers and SEO accessibility
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}