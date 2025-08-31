import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit, Trash2, Plus, Save, X, Eye, EyeOff, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BlogPost, InsertBlogPost } from "@shared/schema";

export default function BlogManagementTab() {
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertBlogPost>>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    metaDescription: "",
    keywords: "",
    authorName: "AI Formulator Team",
    isPublished: false,
  });
  const { toast } = useToast();

  const { data: posts = [], isLoading, error, refetch } = useQuery<BlogPost[]>({
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
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

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
      return await response.json();
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
      excerpt: "",
      content: "",
      featuredImage: "",
      metaDescription: "",
      keywords: "",
      authorName: "AI Formulator Team",
      isPublished: false,
    });
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featuredImage: post.featuredImage,
      metaDescription: post.metaDescription,
      keywords: post.keywords,
      authorName: post.authorName,
      isPublished: post.isPublished,
      publishedAt: post.publishedAt,
    });
    setIsDialogOpen(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug || !formData.content) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      publishedAt: formData.isPublished ? new Date().toISOString() : null,
    } as InsertBlogPost;

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

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingPost(null);
    resetForm();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-inter font-bold text-gray-900">Blog Management</h2>
          <p className="text-sm text-gray-600 mt-1">Create and manage blog posts for your website</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => {
              refetch();
            }}
            variant="outline"
            data-testid="button-refresh-posts"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingPost(null);
                  resetForm();
                }}
                data-testid="button-create-post"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPost ? "Edit Blog Post" : "Create New Blog Post"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g., The Future of Chemical Formulation"
                      required
                      data-testid="input-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e.g., future-of-chemical-formulation"
                      required
                      data-testid="input-slug"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL-friendly identifier (auto-generated from title)
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt || ""}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief description for blog previews (optional)"
                    className="min-h-[80px]"
                    data-testid="textarea-excerpt"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter blog post content (HTML supported)"
                    className="min-h-[200px]"
                    required
                    data-testid="textarea-content"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    HTML tags are supported for formatting
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="featuredImage">Featured Image URL</Label>
                    <Input
                      id="featuredImage"
                      value={formData.featuredImage || ""}
                      onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      data-testid="input-featured-image"
                    />
                  </div>
                  <div>
                    <Label htmlFor="authorName">Author Name</Label>
                    <Input
                      id="authorName"
                      value={formData.authorName}
                      onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                      placeholder="AI Formulator Team"
                      data-testid="input-author"
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
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords || ""}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="chemical formulation, skincare, innovation (comma-separated)"
                    data-testid="input-keywords"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                    data-testid="switch-published"
                  />
                  <Label htmlFor="isPublished">Published (visible to users)</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPostMutation.isPending || updatePostMutation.isPending}
                    data-testid="button-save-post"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {editingPost ? "Update Post" : "Create Post"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="text-center py-8 text-red-600">
          <p className="font-medium">Error loading blog posts:</p>
          <p className="text-sm">{error.message}</p>
          <Button onClick={() => refetch()} className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-8">Loading blog posts...</div>
      ) : !error ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                      {post.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        /{post.slug}
                      </code>
                      {post.isPublished ? (
                        <div className="flex items-center text-green-600">
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="text-xs">Published</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-400">
                          <EyeOff className="h-3 w-3 mr-1" />
                          <span className="text-xs">Draft</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Not published'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {post.excerpt && (
                  <p className="text-sm text-gray-600 mb-3">{post.excerpt}</p>
                )}
                <div className="text-sm text-gray-600 mb-4">
                  <div 
                    className="line-clamp-3"
                    dangerouslySetInnerHTML={{ 
                      __html: post.content.length > 150 
                        ? post.content.substring(0, 150) + "..." 
                        : post.content 
                    }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-400">
                    By {post.authorName}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(post)}
                      data-testid={`button-edit-${post.slug}`}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-delete-${post.slug}`}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {posts.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg font-medium">No blog posts created yet</p>
              <p className="text-sm">Create your first blog post to get started</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}