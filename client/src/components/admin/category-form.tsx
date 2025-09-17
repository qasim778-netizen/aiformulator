import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertCategorySchema } from "@shared/schema";
import type { Category, InsertCategory } from "@shared/schema";
import { SimpleImageUploader } from "@/components/SimpleImageUploader";

interface CategoryFormProps {
  category?: Category | any | null;
  onSuccess: () => void;
}

export default function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const { toast } = useToast();
  const isEditing = !!category;
  
  // All categories are now database categories and can be edited
  const isConstantCategory = false;

  const form = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    mode: "onChange",
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      icon: category?.icon || "fas fa-flask",
      image: category?.image || "",
      isActive: category?.isActive ?? true,
    },
  });

  const [isImageUploading, setIsImageUploading] = useState(false);

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name || "",
        description: category.description || "",
        icon: category.icon || "fas fa-flask",
        image: category.image || "",
        isActive: category.isActive ?? true,
      });
    }
  }, [category, form]);

  const uploadImageMutation = useMutation({
    mutationFn: async (imageURL: string) => {
      if (!category?.id) throw new Error("Category ID is required for image upload");
      const response = await apiRequest("PUT", `/api/categories/${category.id}/image`, { imageURL });
      return await response.json();
    },
    onSuccess: (data: any) => {
      form.setValue("image", data.objectPath);
      toast({ title: "Image uploaded successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsImageUploading(false);
    },
    onError: (error: any) => {
      console.error("Image upload error:", error);
      toast({ 
        title: "Failed to upload image", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
      setIsImageUploading(false);
    },
  });

  const handleImageUpload = async (imageURL: string) => {
    setIsImageUploading(true);
    
    if (isConstantCategory) {
      // For constant categories (FORMULATION_CATEGORIES), we can't upload to database
      toast({ 
        title: "Image upload not available", 
        description: "System-defined categories cannot have custom images uploaded.",
        variant: "destructive" 
      });
      setIsImageUploading(false);
      return;
    }
    
    if (isEditing && category?.id) {
      // For existing database categories, upload immediately and set ACL
      uploadImageMutation.mutate(imageURL);
    } else {
      // For new categories, just set the URL to be saved with the category
      form.setValue("image", imageURL);
      toast({ title: "Image selected successfully" });
      setIsImageUploading(false);
    }
  };

  const removeImage = () => {
    form.setValue("image", "");
    toast({ title: "Image removed" });
  };

  const createCategory = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const response = await apiRequest("POST", "/api/categories", data);
      const category = await response.json();
      
      // If there's an uploaded image URL, set its ACL policy
      if (data.image && data.image.startsWith('https://storage.googleapis.com/')) {
        try {
          const imageResponse = await apiRequest("PUT", `/api/categories/${category.id}/image`, { 
            imageURL: data.image 
          });
          const imageData = await imageResponse.json();
          // Update the category with the processed image path
          return { ...category, image: imageData.objectPath };
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
    mutationFn: async (data: InsertCategory) => {
      const response = await apiRequest("PUT", `/api/categories/${category?.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Category updated successfully" });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Update category error:", error);
      toast({ 
        title: "Failed to update category", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: InsertCategory) => {
    if (isConstantCategory) {
      toast({ 
        title: "Cannot edit system category", 
        description: "System-defined categories cannot be modified. These are built-in formulation categories.",
        variant: "destructive" 
      });
      return;
    }
    
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
        {isConstantCategory && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  System-Defined Category
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  This is a built-in formulation category. You can view the details but cannot modify the category or upload custom images.
                </p>
              </div>
            </div>
          </div>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="category-name">Category Name</FormLabel>
              <FormControl>
                <Input 
                  id="category-name"
                  placeholder="Enter category name" 
                  autoComplete="off"
                  disabled={isConstantCategory}
                  {...field} 
                />
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
              <FormLabel htmlFor="category-description">Description</FormLabel>
              <FormControl>
                <Textarea 
                  id="category-description"
                  placeholder="Enter category description" 
                  autoComplete="off"
                  disabled={isConstantCategory}
                  {...field} 
                />
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
              <FormLabel htmlFor="category-icon">Icon Class</FormLabel>
              <FormControl>
                <Input 
                  id="category-icon"
                  placeholder="e.g., fas fa-flask" 
                  autoComplete="off"
                  disabled={isConstantCategory}
                  {...field} 
                />
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
                <SimpleImageUploader
                  value={field.value}
                  onChange={handleImageUpload}
                  onRemove={removeImage}
                  maxFileSize={5 * 1024 * 1024} // 5MB
                  isUploading={isImageUploading}
                />
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
                  disabled={isConstantCategory}
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
            disabled={isLoading || isImageUploading || isConstantCategory}
            data-testid="button-save-category"
          >
            {isConstantCategory ? "System Category (Read-Only)" : 
             isLoading ? "Saving..." : isEditing ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
