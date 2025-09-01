import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertCategorySchema } from "@shared/schema";
import type { Category, InsertCategory } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

interface CategoryFormProps {
  category?: Category | null;
  onSuccess: () => void;
}

export default function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const { toast } = useToast();
  const isEditing = !!category;

  const form = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      icon: category?.icon || "fas fa-flask",
      image: category?.image || "",
      isActive: category?.isActive ?? true,
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (imageURL: string) => {
      if (!category?.id) throw new Error("Category ID is required for image upload");
      return apiRequest("PUT", `/api/categories/${category.id}/image`, { imageURL });
    },
    onSuccess: (data: any) => {
      form.setValue("image", data.objectPath);
      toast({ title: "Image uploaded successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: any) => {
      console.error("Image upload error:", error);
      toast({ 
        title: "Failed to upload image", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload", {});
      return {
        method: "PUT" as const,
        url: response.uploadURL,
      };
    } catch (error) {
      console.error("Failed to get upload parameters:", error);
      throw error;
    }
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageURL = uploadedFile.uploadURL as string;
      
      if (isEditing && category?.id) {
        // For existing categories, upload immediately and set ACL
        uploadImageMutation.mutate(imageURL);
      } else {
        // For new categories, just set the URL to be saved with the category
        form.setValue("image", imageURL);
        toast({ title: "Image selected successfully" });
      }
    }
  };

  const removeImage = () => {
    form.setValue("image", "");
    toast({ title: "Image removed" });
  };

  const createCategory = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const category = await apiRequest("POST", "/api/categories", data);
      
      // If there's an uploaded image URL, set its ACL policy
      if (data.image && data.image.startsWith('https://storage.googleapis.com/')) {
        try {
          const imageResponse = await apiRequest("PUT", `/api/categories/${category.id}/image`, { 
            imageURL: data.image 
          });
          // Update the category with the processed image path
          return { ...category, image: imageResponse.objectPath };
        } catch (error) {
          console.error("Failed to set image ACL:", error);
          // Continue with category creation even if image upload fails
        }
      }
      
      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Category created successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    },
  });

  const updateCategory = useMutation({
    mutationFn: (data: InsertCategory) => apiRequest("PUT", `/api/categories/${category?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Category updated successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update category", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertCategory) => {
    if (isEditing) {
      updateCategory.mutate(data);
    } else {
      createCategory.mutate(data);
    }
  };

  const isLoading = createCategory.isPending || updateCategory.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter category name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter category description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon Class</FormLabel>
              <FormControl>
                <Input placeholder="e.g., fas fa-flask" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Image</FormLabel>
              <div className="space-y-4">
                {field.value ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Image selected
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeImage}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {field.value.startsWith('/objects/') && (
                      <img
                        src={field.value}
                        alt="Category preview"
                        className="h-16 w-16 object-cover rounded-lg border"
                      />
                    )}
                  </div>
                ) : (
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                    buttonClassName="w-full"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>Upload Category Image</span>
                    </div>
                  </ObjectUploader>
                )}
                <div className="text-xs text-muted-foreground">
                  Upload an image for this category. Recommended size: 400x300px or larger.
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable this category to be visible on the website
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
            {isLoading ? "Saving..." : isEditing ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
