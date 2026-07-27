import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit, Trash2, Plus, Save, X, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Page, InsertPage } from "@shared/schema";

export default function ContentManagementTab() {
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertPage>>({
    slug: "",
    title: "",
    content: "",
    metaDescription: "",
    isActive: true,
  });
  const { toast } = useToast();

  const { data: pages = [], isLoading, error, refetch } = useQuery<Page[]>({
    queryKey: ["pages"],
    queryFn: async () => {
      const response = await fetch("/api/pages", {
        credentials: "include",
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
    retry: 1,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const createPageMutation = useMutation({
    mutationFn: async (data: InsertPage) => {
      const response = await apiRequest("POST", "/api/pages", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      refetch();
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Page created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create page",
        variant: "destructive",
      });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPage> }) => {
      const response = await apiRequest("PUT", `/api/pages/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      refetch();
      setIsDialogOpen(false);
      setEditingPage(null);
      resetForm();
      toast({
        title: "Success",
        description: "Page updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update page",
        variant: "destructive",
      });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/pages/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      refetch();
      toast({
        title: "Success",
        description: "Page deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete page",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      slug: "",
      title: "",
      content: "",
      metaDescription: "",
      isActive: true,
    });
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content,
      metaDescription: page.metaDescription,
      isActive: page.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.slug || !formData.title || !formData.content) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingPage) {
      updatePageMutation.mutate({ id: editingPage.id, data: formData as InsertPage });
    } else {
      createPageMutation.mutate(formData as InsertPage);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this page? This action cannot be undone.")) {
      deletePageMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingPage(null);
    resetForm();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-inter font-bold text-gray-900">Content Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage static pages like About Us, FAQ, Terms & Conditions</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => {
              console.log("Manual refresh triggered");
              refetch();
            }}
            variant="outline"
            data-testid="button-refresh-pages"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingPage(null);
                  resetForm();
                }}
                data-testid="button-create-page"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPage ? "Edit Page" : "Create New Page"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e.g., about, faq, terms"
                      required
                      data-testid="input-slug"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL-friendly identifier (no spaces, lowercase)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., About Us"
                      required
                      data-testid="input-title"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Input
                    id="metaDescription"
                    value={formData.metaDescription || ""}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    placeholder="Brief description for search engines (optional)"
                    maxLength={160}
                    data-testid="input-meta-description"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.metaDescription?.length || 0}/160 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter page content (HTML supported)"
                    className="min-h-[200px]"
                    required
                    data-testid="textarea-content"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    HTML tags are supported for formatting
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    data-testid="switch-active"
                  />
                  <Label htmlFor="isActive">Active (visible to users)</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPageMutation.isPending || updatePageMutation.isPending}
                    data-testid="button-save-page"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {editingPage ? "Update Page" : "Create Page"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="text-center py-8 text-red-600">
          <p className="font-medium">Error loading pages:</p>
          <p className="text-sm">{error.message}</p>
          <Button onClick={() => refetch()} className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-8">Loading pages...</div>
      ) : !error ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {pages.map((page) => (
            <Card key={page.id} className="bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                      {page.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        /{page.slug}
                      </code>
                      {page.isActive ? (
                        <div className="flex items-center text-green-600">
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="text-xs">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-400">
                          <EyeOff className="h-3 w-3 mr-1" />
                          <span className="text-xs">Inactive</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-gray-600 mb-4">
                  <div 
                    className="line-clamp-3"
                    dangerouslySetInnerHTML={{ 
                      __html: page.content.length > 150 
                        ? page.content.substring(0, 150) + "..." 
                        : page.content 
                    }}
                  />
                </div>
                {page.metaDescription && (
                  <p className="text-xs text-gray-500 italic mb-4">
                    {page.metaDescription}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-400">
                    Updated: {new Date(page.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(page)}
                      data-testid={`button-edit-${page.slug}`}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(page.id)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-delete-${page.slug}`}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {pages.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-lg font-medium">No pages created yet</p>
              <p className="text-sm">Create your first page to get started with content management</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}