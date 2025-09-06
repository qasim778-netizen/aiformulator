import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Upload, X } from "lucide-react";
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
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

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

export default function FormulationForm({ formulation, categories, onSuccess }: FormulationFormProps) {
  const { toast } = useToast();
  const isEditing = !!formulation;

  // Parse existing data if editing
  const existingIngredients: Ingredient[] = formulation 
    ? JSON.parse(formulation.ingredients) 
    : [{ name: "", inci: "", percentage: "", function: "" }];
  
  const existingInstructions: InstructionPhase[] = formulation 
    ? JSON.parse(formulation.instructions)
    : [{ phase: "", steps: [""] }];

  const form = useForm<InsertFormulation>({
    resolver: zodResolver(insertFormulationSchema),
    defaultValues: {
      categoryId: formulation?.categoryId || "",
      name: formulation?.name || "",
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
    mutationFn: (data: InsertFormulation) => apiRequest("PUT", `/api/formulations/${formulation?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Formulation updated successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update formulation", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertFormulation) => {
    // Convert ingredients and instructions arrays to JSON strings
    const processedData = {
      ...data,
      ingredients: JSON.stringify(existingIngredients),
      instructions: JSON.stringify(existingInstructions),
    };

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
            <CardTitle className="text-lg">Product Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Image Display */}
            {form.watch("image") && (
              <div className="relative">
                <img 
                  src={form.watch("image") || ""} 
                  alt={form.watch("imageAlt") || "Product image"} 
                  className="w-full max-w-md h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    form.setValue("image", "");
                    form.setValue("imageAlt", "");
                    form.setValue("imageFilename", "");
                  }}
                  data-testid="button-remove-image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Image Upload Button */}
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={5242880} // 5MB
              onGetUploadParameters={async () => {
                const response = await fetch('/api/objects/upload', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                return {
                  method: 'PUT' as const,
                  url: data.uploadURL,
                };
              }}
              onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                if (result.successful && result.successful.length > 0) {
                  const uploadedFile = result.successful[0];
                  const uploadURL = uploadedFile.uploadURL;
                  
                  // Set the image URL in the form
                  form.setValue("image", uploadURL);
                  form.setValue("imageFilename", uploadedFile.name);
                  
                  // Make a call to set the image ACL policy
                  fetch('/api/formulation-images', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageURL: uploadURL }),
                  }).then(() => {
                    toast({ title: "Image uploaded successfully" });
                  }).catch(() => {
                    toast({ title: "Image uploaded but failed to set permissions", variant: "destructive" });
                  });
                }
              }}
            >
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>{form.watch("image") ? "Replace Image" : "Upload Image"}</span>
              </div>
            </ObjectUploader>

            {/* Image Alt Text */}
            <FormField
              control={form.control}
              name="imageAlt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image Alt Text (SEO)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Describe the image for screen readers and SEO"
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-sm text-gray-500">
                    Alt text helps with accessibility and SEO. Describe what's in the image.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                onClick={() => existingIngredients.push({ name: "", inci: "", percentage: "", function: "" })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Ingredient
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingIngredients.map((_, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <Input
                  placeholder="Ingredient name"
                  value={existingIngredients[index]?.name || ""}
                  onChange={(e) => {
                    existingIngredients[index] = { ...existingIngredients[index], name: e.target.value };
                  }}
                />
                <Input
                  placeholder="INCI name"
                  value={existingIngredients[index]?.inci || ""}
                  onChange={(e) => {
                    existingIngredients[index] = { ...existingIngredients[index], inci: e.target.value };
                  }}
                />
                <Input
                  placeholder="Percentage"
                  value={existingIngredients[index]?.percentage || ""}
                  onChange={(e) => {
                    existingIngredients[index] = { ...existingIngredients[index], percentage: e.target.value };
                  }}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Function"
                    value={existingIngredients[index]?.function || ""}
                    onChange={(e) => {
                      existingIngredients[index] = { ...existingIngredients[index], function: e.target.value };
                    }}
                  />
                  {existingIngredients.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => existingIngredients.splice(index, 1)}
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEditing ? "Update Formulation" : "Create Formulation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
