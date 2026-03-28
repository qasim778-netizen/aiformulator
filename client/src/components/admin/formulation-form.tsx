import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Upload, X, Wand2, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertFormulationSchema } from "@shared/schema";
import type { Formulation, InsertFormulation, Category } from "@shared/schema";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";

interface FormulationFormProps {
  formulation?: Formulation | null;
  categories: Category[];
  onSuccess: () => void;
}

interface Ingredient {
  name: string;
  inci: string;
  percentage: string;
  function: string;
}

interface InstructionPhase {
  phase: string;
  steps: string[];
}

// Image Upload Section Component
function ImageUploadSection({ form, formulationName }: { form: any, formulationName: string }) {
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  // Handle both blob URLs and object storage paths for preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    const imageValue = form.getValues("image");
    if (!imageValue) return null;
    
    // If it's already a blob URL, use it directly
    if (imageValue.startsWith('blob:')) return imageValue;
    
    // If it's an object storage path, convert it to display URL
    if (imageValue.startsWith('/objects/')) return imageValue;
    
    // Otherwise use the value as-is (for external URLs)
    return imageValue;
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateAltTextMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiRequest("POST", "/api/admin/generate-alt-text", data);
      return await response.json();
    },
    onSuccess: (data) => {
      form.setValue("imageAlt", data.altText);
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

  const handleGenerateAltText = async () => {
    if (!formulationName?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a formulation name first.",
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

  const handleFileSelection = async (file: File) => {
    if (file.size > 10485760) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate SEO-friendly filename from formulation name
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const seoFilename = formulationName?.trim() 
        ? `${formulationName.trim()}.${fileExtension}`
        : file.name;
      
      // Get upload parameters with SEO-friendly filename
      const response = await apiRequest("POST", "/api/objects/upload", { filename: seoFilename });
      const data = await response.json();
      
      // Upload file directly
      const uploadResponse = await fetch(data.uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (uploadResponse.ok) {
        // Convert GCS upload URL to our object path format
        // Extract just the filename part, removing query parameters from the signed URL
        const urlPath = data.uploadURL.split('/uploads/')[1];
        const filenameWithoutQuery = urlPath.split('?')[0]; // Remove query parameters
        const objectPath = `/objects/uploads/${filenameWithoutQuery}`;
        
        try {
          const aclResponse = await apiRequest("PUT", "/api/formulation-images", {
            imageURL: data.uploadURL
          });
          const aclData = await aclResponse.json();
          
          const finalObjectPath = aclData.objectPath || objectPath;
          setPreviewUrl(finalObjectPath);
          form.setValue("image", finalObjectPath);
          form.setValue("imageFilename", seoFilename);
          if (aclData.thumbnailPath) {
            form.setValue("thumbnail", aclData.thumbnailPath);
          }
        } catch (aclError) {
          console.error("Error setting image ACL:", aclError);
          setPreviewUrl(objectPath);
          form.setValue("image", objectPath);
          form.setValue("imageFilename", seoFilename);
        }

        toast({
          title: "Image uploaded successfully!",
          description: "Your formulation image has been uploaded to cloud storage.",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      });
    }
  };


  const removeUploadedImage = () => {
    setUploadedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    form.setValue("image", "");
    form.setValue("thumbnail", "");
    form.setValue("imageFilename", "");
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

  return (
    <div className="space-y-6">
      {/* Image Upload */}
      <div>
        <Label className="text-base font-medium">Product Image</Label>
        <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6">
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
                type="button"
                data-testid="button-remove-image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <input
                  type="file"
                  accept="image/png,image/jpg,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileSelection(file);
                    }
                  }}
                  style={{ display: 'none' }}
                  id="formulation-image-input"
                />
                <Button
                  type="button"
                  onClick={() => document.getElementById('formulation-image-input')?.click()}
                  className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  data-testid="button-upload-image"
                >
                  <div className="flex items-center">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Formulation Image
                  </div>
                </Button>
                <p className="mt-2 text-sm text-gray-500">
                  PNG, JPG, JPEG, WebP up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alt Text Generation */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="imageAlt" className="text-base font-medium">Image Alt Text</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateAltText}
              disabled={generateAltTextMutation.isPending || !formulationName?.trim()}
              data-testid="button-generate-alt-text"
            >
              {generateAltTextMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Alt Text
                </>
              )}
            </Button>
          </div>
          <FormField
            control={form.control}
            name="imageAlt"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex">
                    <Textarea
                      placeholder="AI-generated SEO alt text will appear here..."
                      rows={3}
                      {...field}
                      data-testid="textarea-image-alt"
                    />
                    {field.value && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(field.value, "Alt Text")}
                        className="ml-2"
                        data-testid="button-copy-alt-text"
                      >
                        {copiedField === "Alt Text" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <Label htmlFor="imageFilename" className="text-base font-medium">Image Filename</Label>
          <FormField
            control={form.control}
            name="imageFilename"
            render={({ field }) => (
              <FormItem className="mt-2">
                <FormControl>
                  <Input
                    placeholder="e.g., advanced-hair-shampoo.jpg"
                    {...field}
                    data-testid="input-image-filename"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default function FormulationForm({ formulation, categories, onSuccess }: FormulationFormProps) {
  const { toast } = useToast();
  const isEditing = !!formulation;

  // Parse existing data if editing - use state to manage these arrays
  const [existingIngredients, setExistingIngredients] = useState<Ingredient[]>(() => 
    formulation 
      ? JSON.parse(formulation.ingredients) 
      : [{ name: "", inci: "", percentage: "", function: "" }]
  );
  
  const [existingInstructions, setExistingInstructions] = useState<InstructionPhase[]>(() =>
    formulation 
      ? JSON.parse(formulation.instructions)
      : [{ phase: "", steps: [""] }]
  );

  const form = useForm<InsertFormulation>({
    resolver: zodResolver(insertFormulationSchema),
    defaultValues: {
      categoryId: formulation?.categoryId || "",
      name: formulation?.name || "",
      slug: formulation?.slug ?? "",
      description: formulation?.description || "",
      seoTitle: formulation?.seoTitle ?? "",
      metaDescription: formulation?.metaDescription ?? "",
      keywords: formulation?.keywords ?? "",
      image: formulation?.image ?? "",
      imageAlt: formulation?.imageAlt ?? "",
      imageFilename: formulation?.imageFilename ?? "",
      ingredients: formulation?.ingredients || JSON.stringify(existingIngredients),
      instructions: formulation?.instructions || JSON.stringify(existingInstructions),
      usageInstructions: formulation?.usageInstructions || "",
      phLevel: formulation?.phLevel || "",
      shelfLife: formulation?.shelfLife || "",
      viscosity: formulation?.viscosity ?? "",
      storageConditions: formulation?.storageConditions || "",
      batchSize: formulation?.batchSize || "",
      processingTime: formulation?.processingTime || "",
      temperature: formulation?.temperature || "",
      equipment: formulation?.equipment || "",
      certification: formulation?.certification ?? "",
      isActive: formulation?.isActive ?? true,
    },
  });

  // Reset form when formulation changes (for editing different formulations)
  useEffect(() => {
    if (formulation) {
      const ingredients = JSON.parse(formulation.ingredients);
      const instructions = JSON.parse(formulation.instructions);
      
      setExistingIngredients(ingredients);
      setExistingInstructions(instructions);
      
      form.reset({
        categoryId: formulation.categoryId || "",
        name: formulation.name || "",
        slug: formulation.slug ?? "",
        description: formulation.description || "",
        seoTitle: formulation.seoTitle ?? "",
        metaDescription: formulation.metaDescription ?? "",
        keywords: formulation.keywords ?? "",
        image: formulation.image ?? "",
        imageAlt: formulation.imageAlt ?? "",
        imageFilename: formulation.imageFilename ?? "",
        ingredients: formulation.ingredients || JSON.stringify(ingredients),
        instructions: formulation.instructions || JSON.stringify(instructions),
        usageInstructions: formulation.usageInstructions || "",
        phLevel: formulation.phLevel || "",
        shelfLife: formulation.shelfLife || "",
        viscosity: formulation.viscosity ?? "",
        storageConditions: formulation.storageConditions || "",
        batchSize: formulation.batchSize || "",
        processingTime: formulation.processingTime || "",
        temperature: formulation.temperature || "",
        equipment: formulation.equipment || "",
        certification: formulation.certification ?? "",
        isActive: formulation.isActive ?? true,
      });
    }
  }, [formulation, form]);

  // Don't use useFieldArray for now since ingredients are stored as JSON strings
  // const {
  //   fields: ingredientFields,
  //   append: appendIngredient,
  //   remove: removeIngredient,
  // } = useFieldArray({
  //   control: form.control,
  //   name: "ingredients" as any,
  // });

  // const {
  //   fields: instructionFields,
  //   append: appendInstruction,
  //   remove: removeInstruction,
  // } = useFieldArray({
  //   control: form.control,
  //   name: "instructions" as any,
  // });

  const createFormulation = useMutation({
    mutationFn: (data: InsertFormulation) => apiRequest("POST", "/api/formulations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Formulation created successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create formulation", variant: "destructive" });
    },
  });

  const updateFormulation = useMutation({
    mutationFn: async (data: InsertFormulation) => {
      const response = await apiRequest("PUT", `/api/formulations/${formulation?.id}`, data);
      return response;
    },
    onSuccess: (updatedFormulation: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      // Check if slug changed and show the new URL
      if (updatedFormulation?.slug && updatedFormulation.slug !== formulation?.slug) {
        toast({ 
          title: "Formulation updated successfully",
          description: `New URL: /formulation/${updatedFormulation.slug}`,
        });
      } else {
        toast({ title: "Formulation updated successfully" });
      }
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Update formulation error:", error);
      toast({ 
        title: "Failed to update formulation", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: InsertFormulation) => {
    // Convert ingredients and instructions arrays to JSON strings
    const processedData = {
      ...data,
      ingredients: JSON.stringify(existingIngredients),
      instructions: JSON.stringify(existingInstructions),
    };

    // Ensure image field is properly included even if empty
    if (!processedData.image) {
      processedData.image = "";
    }
    if (!processedData.imageAlt) {
      processedData.imageAlt = "";
    }
    if (!processedData.imageFilename) {
      processedData.imageFilename = "";
    }

    if (isEditing) {
      updateFormulation.mutate(processedData);
    } else {
      createFormulation.mutate(processedData);
    }
  };

  const isLoading = createFormulation.isPending || updateFormulation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formulation Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter formulation name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter formulation description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* SEO Fields Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SEO Optimization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug (Optional)</FormLabel>
                  {isEditing && formulation?.slug && (
                    <div className="text-sm bg-blue-50 border border-blue-200 rounded-md p-2 mb-2">
                      <span className="font-medium text-blue-800">Current URL: </span>
                      <span className="text-blue-600">/formulation/{formulation.slug}</span>
                    </div>
                  )}
                  <FormControl>
                    <Input 
                      placeholder="custom-url-slug (leave empty to keep current)" 
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-sm text-gray-500">
                    {isEditing 
                      ? "Leave empty to keep the current URL. Changing the slug will make the old URL stop working."
                      : "Custom URL path for this formulation. Use lowercase letters, numbers, and hyphens only."
                    }
                  </p>
                  {isEditing && field.value && field.value !== formulation?.slug && (
                    <div className="text-sm bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
                      <span className="font-medium text-amber-800">Warning: </span>
                      <span className="text-amber-700">
                        Changing the URL slug will make the old URL stop working. 
                        The new URL will be: /formulation/{field.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
                      </span>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seoTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO Title (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Custom page title for search engines (max 60 characters)" 
                      maxLength={60}
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-sm text-gray-500">
                    {field.value?.length || 0}/60 characters
                  </p>
                  <p className="text-sm text-amber-600">
                    Must relate to the formulation name above. Unrelated titles are ignored automatically to prevent SEO mismatch errors.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metaDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description for search engine results (max 160 characters)"
                      maxLength={160}
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-sm text-gray-500">
                    {field.value?.length || 0}/160 characters
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO Keywords (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="comma, separated, keywords, for, search, engines"
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-sm text-gray-500">
                    Use commas to separate keywords (e.g., "skincare, formulation, organic")
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Image & SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUploadSection 
              form={form}
              formulationName={form.watch("name")}
            />

            {/* Hidden fields to ensure image data is submitted */}
            <div style={{ display: 'none' }}>
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <Input type="hidden" {...field} />
                )}
              />
              <FormField
                control={form.control}
                name="imageAlt"
                render={({ field }) => (
                  <Input type="hidden" {...field} />
                )}
              />
              <FormField
                control={form.control}
                name="imageFilename"
                render={({ field }) => (
                  <Input type="hidden" {...field} />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="phLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>pH Level</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 5.5 - 6.0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shelfLife"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shelf Life</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 24 months" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="viscosity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Viscosity (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 2500-3000 cP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storageConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Conditions</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Cool, dry place" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="batchSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch Size</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 100-500 kg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="processingTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Processing Time</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 2-3 hours" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 60-70°C" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="equipment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., High-shear mixer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="certification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Certification (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., ISO 22716" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="usageInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usage Instructions</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter detailed usage instructions" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Ingredients
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExistingIngredients([...existingIngredients, { name: "", inci: "", percentage: "", function: "" }])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Ingredient
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingIngredients.map((ingredient, index) => (
              <div key={`ingredient-${index}-${ingredient.name || 'empty'}`} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <Input
                  placeholder="Ingredient name"
                  value={existingIngredients[index]?.name || ""}
                  onChange={(e) => {
                    const updatedIngredients = [...existingIngredients];
                    updatedIngredients[index] = { ...updatedIngredients[index], name: e.target.value };
                    setExistingIngredients(updatedIngredients);
                  }}
                />
                <Input
                  placeholder="INCI name"
                  value={existingIngredients[index]?.inci || ""}
                  onChange={(e) => {
                    const updatedIngredients = [...existingIngredients];
                    updatedIngredients[index] = { ...updatedIngredients[index], inci: e.target.value };
                    setExistingIngredients(updatedIngredients);
                  }}
                />
                <Input
                  placeholder="Percentage"
                  value={existingIngredients[index]?.percentage || ""}
                  onChange={(e) => {
                    const updatedIngredients = [...existingIngredients];
                    updatedIngredients[index] = { ...updatedIngredients[index], percentage: e.target.value };
                    setExistingIngredients(updatedIngredients);
                  }}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Function"
                    value={existingIngredients[index]?.function || ""}
                    onChange={(e) => {
                      const updatedIngredients = [...existingIngredients];
                      updatedIngredients[index] = { ...updatedIngredients[index], function: e.target.value };
                      setExistingIngredients(updatedIngredients);
                    }}
                  />
                  {existingIngredients.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updatedIngredients = existingIngredients.filter((_, i) => i !== index);
                        setExistingIngredients(updatedIngredients);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable this formulation to be visible on the website
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : isEditing ? "Update Formulation" : "Create Formulation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
