import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit, Trash2, Plus, Save, X, Eye, EyeOff, RefreshCw, Calendar, Sparkles, TrendingUp, Target, Zap } from "lucide-react";
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
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiGenerationMode, setAIGenerationMode] = useState<'single' | 'batch' | 'trending'>('single');
  const [aiTopic, setAITopic] = useState('');
  const [aiKeywords, setAIKeywords] = useState('');
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

  // AI content suggestions queries
  const { data: contentGaps = [], isLoading: isLoadingGaps } = useQuery<any[]>({
    queryKey: ["ai-blog-content-gaps"],
    queryFn: async () => {
      const response = await fetch("/api/ai-blog/content-gaps", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });

  const { data: trendingTopics = [], isLoading: isLoadingTrending } = useQuery<any[]>({
    queryKey: ["ai-blog-trending-topics"],
    queryFn: async () => {
      const response = await fetch("/api/ai-blog/trending-topics", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

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

  // AI blog generation mutations
  const generateAIBlogMutation = useMutation({
    mutationFn: async ({ topic, keywords, shouldPublish }: { topic: string; keywords: string[]; shouldPublish: boolean }) => {
      const response = await apiRequest("POST", "/api/ai-blog/generate", {
        topic,
        targetKeywords: keywords,
        shouldPublish
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.id) {
        // Post was published, refresh the posts list
        queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
        refetch();
        toast({
          title: "Success",
          description: "AI blog post generated and published successfully",
        });
      } else {
        // Post was generated but not published, populate the form
        setFormData({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          featuredImage: data.featuredImage,
          metaDescription: data.metaDescription,
          keywords: data.keywords,
          authorName: data.authorName || "AI Formulator Team",
          isPublished: false,
        });
        setIsAIDialogOpen(false);
        setIsDialogOpen(true);
        toast({
          title: "Content Generated",
          description: "AI content generated successfully. Review and publish when ready.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI blog post",
        variant: "destructive",
      });
    },
  });

  const generateBatchBlogMutation = useMutation({
    mutationFn: async ({ topics, shouldPublish }: { topics: string[]; shouldPublish: boolean }) => {
      const response = await apiRequest("POST", "/api/ai-blog/generate-batch", {
        topics,
        shouldPublish
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      refetch();
      setIsAIDialogOpen(false);
      toast({
        title: "Success",
        description: `${data.length} AI blog posts generated successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate batch blog posts",
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

  const handleAIGenerate = () => {
    if (!aiTopic.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a topic for AI generation",
        variant: "destructive",
      });
      return;
    }

    const keywords = aiKeywords.split(',').map(k => k.trim()).filter(k => k);
    generateAIBlogMutation.mutate({
      topic: aiTopic,
      keywords,
      shouldPublish: false // Always generate as draft first
    });
  };

  const handleGenerateFromSuggestion = (suggestion: any, shouldPublish: boolean = false) => {
    generateAIBlogMutation.mutate({
      topic: suggestion.title,
      keywords: suggestion.targetKeywords || [],
      shouldPublish
    });
  };

  const handleBatchGenerate = (topics: string[], shouldPublish: boolean = false) => {
    generateBatchBlogMutation.mutate({
      topics,
      shouldPublish
    });
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
          <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                data-testid="button-ai-generate"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                AI Generate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
                  AI Blog Content Generator
                </DialogTitle>
              </DialogHeader>
              
              {/* Featured Manual Topic Input */}
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                <h3 className="text-xl font-bold flex items-center mb-4">
                  <Zap className="mr-3 h-5 w-5 text-blue-600" />
                  Create Custom Blog Post
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter any topic you want and let AI generate a professional, SEO-optimized blog post for your chemical formulation website.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ai-topic" className="text-sm font-medium">Blog Topic or Title</Label>
                    <Input
                      id="ai-topic"
                      value={aiTopic}
                      onChange={(e) => setAITopic(e.target.value)}
                      placeholder="e.g., How to Create Natural Preservatives for Skincare"
                      className="mt-1"
                      data-testid="input-ai-topic"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ai-keywords" className="text-sm font-medium">Target Keywords (optional)</Label>
                    <Input
                      id="ai-keywords"
                      value={aiKeywords}
                      onChange={(e) => setAIKeywords(e.target.value)}
                      placeholder="e.g., natural preservatives, skincare formulation"
                      className="mt-1"
                      data-testid="input-ai-keywords"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="text-xs text-gray-500">
                    ✨ AI will generate 500 words of professional content with proper SEO optimization
                  </div>
                  <Button 
                    onClick={handleAIGenerate}
                    disabled={generateAIBlogMutation.isPending || !aiTopic.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    data-testid="button-generate-manual"
                  >
                    {generateAIBlogMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Blog Post
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Topic Examples */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Target className="mr-2 h-4 w-4 text-green-500" />
                    Quick Topic Ideas
                  </h3>
                  <div className="space-y-2">
                    {[
                      "Essential Oils in Natural Cosmetics: Safety and Efficacy",
                      "Understanding pH Balance in Skincare Formulations", 
                      "Sustainable Packaging for Chemical Products",
                      "Regulatory Compliance for Small Cosmetic Manufacturers",
                      "Cost-Effective Ingredient Sourcing Strategies"
                    ].map((topic, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-sm text-gray-700">{topic}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAITopic(topic);
                            setAIKeywords('');
                          }}
                          className="text-xs"
                          data-testid={`button-use-topic-${index}`}
                        >
                          Use This
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Content Gap Analysis */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                    AI Content Suggestions
                  </h3>
                  {isLoadingGaps ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Analyzing content gaps...</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {contentGaps.slice(0, 5).map((gap, index) => (
                        <div key={index} className="p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm">{gap.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              gap.estimatedDifficulty === 'low' ? 'bg-green-100 text-green-800' :
                              gap.estimatedDifficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {gap.estimatedDifficulty}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{gap.description}</p>
                          <div className="flex justify-between items-center">
                            <div className="flex flex-wrap gap-1">
                              {gap.targetKeywords?.slice(0, 2).map((keyword: string, idx: number) => (
                                <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateFromSuggestion(gap)}
                              data-testid={`button-generate-gap-${index}`}
                            >
                              Generate
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Trending Topics */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold flex items-center mb-4">
                  <TrendingUp className="mr-2 h-4 w-4 text-orange-500" />
                  Trending Topics
                </h3>
                {isLoadingTrending ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Finding trending topics...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trendingTopics.slice(0, 6).map((topic, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                        <h4 className="font-medium text-sm mb-2">{topic.title}</h4>
                        <p className="text-xs text-gray-600 mb-3">{topic.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            {topic.contentType}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateFromSuggestion(topic)}
                            data-testid={`button-generate-trending-${index}`}
                          >
                            Generate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAIDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const topSuggestions = contentGaps.slice(0, 3).map(gap => gap.title);
                    if (topSuggestions.length > 0) {
                      handleBatchGenerate(topSuggestions, false);
                    }
                  }}
                  disabled={generateBatchBlogMutation.isPending || contentGaps.length === 0}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  data-testid="button-batch-generate"
                >
                  {generateBatchBlogMutation.isPending ? "Generating..." : "Batch Generate Top 3"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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