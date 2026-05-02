import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit, Trash2, Plus, Save, X, Eye, EyeOff, RefreshCw, Clock, AlertCircle, Upload, Image, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BlogPost, InsertBlogPost } from "@shared/schema";
import { blogCategories, blogProductTypes, blogRegions } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";

const CATEGORY_PRODUCT_RULES: Record<string, string[]> = {
  "Skincare": ["Serum", "Cream", "Gel", "Liquid"],
  "Hair Care": ["Shampoo", "Cream", "Gel", "Liquid"],
  "Cleaning Products": ["Liquid", "Powder", "Gel"],
  "Adhesives": ["Gel", "Liquid"],
  "Industrial": ["Liquid", "Powder", "Gel"],
  "Ingredients": [],
  "Business": [],
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const BLOG_PAGE_SIZE = 9;

function BlogPagination({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / BLOG_PAGE_SIZE);
  if (totalPages <= 1) return null;
  const from = (page - 1) * BLOG_PAGE_SIZE + 1;
  const to = Math.min(page * BLOG_PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between py-4 border-t mt-2">
      <span className="text-sm text-gray-500">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)} className="h-8 w-8 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "…")[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
            ) : (
              <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => onPage(p as number)} className="h-8 w-8 p-0 text-xs">
                {p}
              </Button>
            )
          )}
        <Button variant="outline" size="sm" disabled={page === Math.ceil(total / BLOG_PAGE_SIZE)} onClick={() => onPage(page + 1)} className="h-8 w-8 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function BlogManagementTab() {
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [blogPage, setBlogPage] = useState(1);
  const [formData, setFormData] = useState<Partial<InsertBlogPost>>({
    title: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    category: "Skincare",
    productType: null,
    featureTags: "[]",
    region: null,
    readingTime: 5,
    featured: false,
    authorName: "AI Formulator Team",
    isPublished: false,
  });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setFormData(prev => ({ ...prev, featuredImage: response.objectPath }));
      toast({
        title: "Image Uploaded",
        description: "Featured image uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPEG, PNG, WebP)",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    await uploadFile(file);
  };

  const { data: postsAll = [], isLoading, error, refetch } = useQuery<BlogPost[]>({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const response = await fetch("/api/blog", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
    retry: 1,
    staleTime: 0,
  });

  const posts = postsAll.slice((blogPage - 1) * BLOG_PAGE_SIZE, blogPage * BLOG_PAGE_SIZE);

  const validateCategoryProductMatch = (category: string, productType: string | null | undefined): boolean => {
    if (!productType) return true;
    
    if (productType === "Shampoo" && category !== "Hair Care") {
      setValidationError("Shampoo products can only be in Hair Care category");
      return false;
    }
    if (productType === "Serum" && category !== "Skincare") {
      setValidationError("Serum products can only be in Skincare category");
      return false;
    }
    
    const allowedProducts = CATEGORY_PRODUCT_RULES[category];
    if (allowedProducts && allowedProducts.length > 0 && !allowedProducts.includes(productType)) {
      setValidationError(`${productType} is not valid for ${category} category`);
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  useEffect(() => {
    if (formData.category && formData.productType) {
      validateCategoryProductMatch(formData.category, formData.productType);
    }
  }, [formData.category, formData.productType]);

  const createPostMutation = useMutation({
    mutationFn: async (data: InsertBlogPost) => {
      const response = await apiRequest("POST", "/api/blog", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      refetch();
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Blog post created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create blog post",
        variant: "destructive",
      });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertBlogPost> }) => {
      const response = await apiRequest("PUT", `/api/blog/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      refetch();
      setIsDialogOpen(false);
      setEditingPost(null);
      resetForm();
      toast({
        title: "Success",
        description: "Blog post updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update blog post",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/blog/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      refetch();
      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete blog post",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      metaTitle: "",
      metaDescription: "",
      excerpt: "",
      content: "",
      featuredImage: "",
      category: "Skincare",
      productType: null,
      featureTags: "[]",
      region: null,
      readingTime: 5,
      featured: false,
      authorName: "AI Formulator Team",
      isPublished: false,
    });
    setValidationError(null);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
      excerpt: post.excerpt || "",
      content: post.content,
      featuredImage: post.featuredImage || "",
      category: post.category as typeof blogCategories[number] || "Skincare",
      productType: post.productType as typeof blogProductTypes[number] || null,
      featureTags: post.featureTags || "[]",
      region: post.region as typeof blogRegions[number] || null,
      readingTime: post.readingTime || 5,
      featured: post.featured || false,
      authorName: post.authorName,
      isPublished: post.isPublished,
    });
    setIsDialogOpen(true);
  };

  const handleNewPost = () => {
    setEditingPost(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    if (!validateCategoryProductMatch(formData.category!, formData.productType)) {
      return;
    }

    const slug = formData.slug || generateSlug(formData.title);

    const submitData: InsertBlogPost = {
      title: formData.title!,
      slug,
      metaTitle: formData.metaTitle || null,
      metaDescription: formData.metaDescription || null,
      excerpt: formData.excerpt || null,
      content: formData.content!,
      featuredImage: formData.featuredImage || null,
      category: formData.category as typeof blogCategories[number],
      productType: formData.productType || null,
      featureTags: formData.featureTags || null,
      region: formData.region || null,
      readingTime: formData.readingTime || 5,
      featured: formData.featured || false,
      authorName: formData.authorName || "AI Formulator Team",
      isPublished: formData.isPublished || false,
    };

    if (editingPost) {
      updatePostMutation.mutate({ id: editingPost.id, data: submitData });
    } else {
      createPostMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      deletePostMutation.mutate(id);
    }
  };

  const getAvailableProductTypes = (category: string) => {
    const rules = CATEGORY_PRODUCT_RULES[category];
    if (!rules || rules.length === 0) {
      return blogProductTypes;
    }
    return blogProductTypes.filter(pt => rules.includes(pt));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-inter font-bold text-gray-900">Blog Management</h2>
          <p className="text-sm text-gray-600 mt-1">Create and manage how-to guides and articles for your knowledge hub</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleNewPost}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Posts Grid */}
      {error && (
        <div className="text-center py-8 text-red-600">
          <p className="font-medium">Error loading blog posts:</p>
          <p className="text-sm">{(error as Error).message}</p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">Loading blog posts...</div>
      )}

      {!isLoading && !error && postsAll.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium">No blog posts created yet</p>
            <p className="text-sm text-gray-500 mt-2">Create your first how-to guide to get started</p>
            <Button className="mt-4" onClick={handleNewPost}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Post
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && postsAll.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                    <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      /{post.slug}
                    </code>
                  </div>
                  <Badge variant={post.isPublished ? "default" : "secondary"}>
                    {post.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline">{post.category}</Badge>
                  {post.productType && (
                    <Badge variant="outline">{post.productType}</Badge>
                  )}
                  {post.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {post.readingTime} min
                  </span>
                  {post.region && (
                    <span>{post.region}</span>
                  )}
                </div>
                {post.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id)}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {postsAll.length > 0 && (
        <BlogPagination total={postsAll.length} page={blogPage} onPage={setBlogPage} />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingPost(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="How to Create a Professional Vitamin C Serum"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug || ""}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="how-to-create-vitamin-c-serum"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated if left empty</p>
              </div>
              <div>
                <Label htmlFor="readingTime">Reading Time (minutes)</Label>
                <Input
                  id="readingTime"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.readingTime || 5}
                  onChange={(e) => setFormData({ ...formData, readingTime: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>

            {/* Category & Product Type */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Category *</Label>
                <Select
                  value={formData.category || "Skincare"}
                  onValueChange={(value) => {
                    setFormData({ ...formData, category: value as typeof blogCategories[number], productType: null });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {blogCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Product Type</Label>
                <Select
                  value={formData.productType || "none"}
                  onValueChange={(value) => setFormData({ ...formData, productType: value === "none" ? null : value as typeof blogProductTypes[number] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {getAvailableProductTypes(formData.category || "Skincare").map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Region (Optional)</Label>
                <Select
                  value={formData.region || "none"}
                  onValueChange={(value) => setFormData({ ...formData, region: value === "none" ? null : value as typeof blogRegions[number] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Regions</SelectItem>
                    {blogRegions.filter(r => r !== "All").map((region) => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SEO Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metaTitle">SEO Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle || ""}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="How to Create Vitamin C Serum | AI Formulator"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">{(formData.metaTitle?.length || 0)}/60 characters</p>
              </div>
              <div>
                <Label>Featured Image</Label>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                    {formData.featuredImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, featuredImage: "" })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {formData.featuredImage && (
                    <div className="relative w-full max-w-xs">
                      <img
                        src={formData.featuredImage}
                        alt="Featured image preview"
                        className="w-full h-auto rounded-md border object-cover"
                        style={{ aspectRatio: "3/2", maxHeight: "130px" }}
                      />
                      <p className="text-xs text-gray-500 mt-1 truncate">{formData.featuredImage}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Recommended: 1200×675 (16:9) WebP, max 5MB</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription || ""}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="Learn how to formulate a professional vitamin C serum with our step-by-step guide..."
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">{(formData.metaDescription?.length || 0)}/160 characters</p>
            </div>

            <div>
              <Label htmlFor="excerpt">Short Description / Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt || ""}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief description for article previews..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="content">Content * (HTML supported)</Label>
              <Textarea
                id="content"
                value={formData.content || ""}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="<h2>What is a Vitamin C Serum?</h2><p>Vitamin C serums are...</p>"
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Use HTML tags for structure: h2, h3, p, ul, li, etc.</p>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={formData.featured || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured Article</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isPublished"
                  checked={formData.isPublished || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                />
                <Label htmlFor="isPublished">Published</Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createPostMutation.isPending || updatePostMutation.isPending || !!validationError}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingPost ? "Update Post" : "Create Post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
