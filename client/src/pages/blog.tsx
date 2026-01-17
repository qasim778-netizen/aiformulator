import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Clock, ArrowRight, Sparkles, Download, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BlogPost } from "@shared/schema";
import { blogCategories, blogRegions } from "@shared/schema";

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeRegion, setActiveRegion] = useState<string>("All");

  const { data: posts = [], isLoading, error } = useQuery<BlogPost[]>({
    queryKey: ["blog-posts-published"],
    queryFn: async () => {
      const response = await fetch("/api/blog/published", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
  });

  useEffect(() => {
    document.title = "Chemical Product Formulation & AI Manufacturing Guides | AI Formulator";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Learn how to formulate chemical products with AI-powered guides. Expert tutorials on skincare, hair care, cleaning products, adhesives and more.');
    }

    const existingSchema = document.querySelector('script[data-schema="blog-collection"]');
    if (existingSchema) {
      existingSchema.remove();
    }
    
    const collectionSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Chemical Product Formulation & AI Manufacturing Guides",
      "description": "Learn how to formulate chemical products with AI-powered guides. Expert tutorials on skincare, hair care, cleaning products, adhesives and more.",
      "url": `${window.location.origin}/blog`,
      "mainEntity": {
        "@type": "ItemList",
        "name": "Formulation Guides",
        "numberOfItems": posts.length
      },
      "publisher": {
        "@type": "Organization",
        "name": "AI Formulator",
        "url": window.location.origin
      }
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'blog-collection');
    script.textContent = JSON.stringify(collectionSchema);
    document.head.appendChild(script);
    
    return () => {
      const schemaScript = document.querySelector('script[data-schema="blog-collection"]');
      if (schemaScript) {
        schemaScript.remove();
      }
    };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const categoryMatch = activeCategory === "All" || post.category === activeCategory;
      const regionMatch = activeRegion === "All" || !post.region || post.region === activeRegion;
      return categoryMatch && regionMatch;
    });
  }, [posts, activeCategory, activeRegion]);

  const featuredPosts = useMemo(() => {
    // On "All" category: show 6 featured from all posts
    // On specific category: show 9 featured from that category
    if (activeCategory === "All") {
      return posts.filter((post) => post.featured).slice(0, 6);
    }
    return filteredPosts.filter((post) => post.featured).slice(0, 9);
  }, [posts, filteredPosts, activeCategory]);

  const latestPosts = useMemo(() => {
    // Exclude featured posts that are shown in the featured section
    const featuredIds = new Set(featuredPosts.map(p => p.id));
    return filteredPosts.filter((post) => !featuredIds.has(post.id));
  }, [filteredPosts, featuredPosts]);

  const allCategories = ["All", ...blogCategories];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading articles...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center py-12">
            <p className="text-red-600">Error loading articles. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-blue-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-inter font-bold text-gray-900 mb-6 leading-tight">
            Chemical Product Formulation &<br className="hidden md:block" /> AI Manufacturing Guides
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Expert tutorials and step-by-step guides to help you create professional-grade chemical formulations for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8">
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Formula with AI
              </Button>
            </Link>
            <Link href="/collection">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5 px-8">
                <Download className="mr-2 h-5 w-5" />
                Download Ready-Made Formulas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Category Tabs */}
      <section className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex overflow-x-auto scrollbar-hide gap-1 md:gap-2 flex-1">
              {allCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* Region Filter */}
            <div className="hidden md:flex items-center gap-2 ml-4">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={activeRegion} onValueChange={setActiveRegion}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  {blogRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured How-To Guides */}
      {featuredPosts.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-inter font-bold text-gray-900 mb-8">
              Featured How-To Guides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <FeaturedArticleCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Latest Articles Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-inter font-bold text-gray-900 mb-8">
            {activeCategory === "All" ? "Latest Articles" : `${activeCategory} Articles`}
          </h2>
          
          {latestPosts.length === 0 && featuredPosts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <div className="text-6xl mb-6">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                No Articles Yet
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                We're working on expert guides for this category. Check back soon for new content!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestPosts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mobile Region Filter */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Select value={activeRegion} onValueChange={setActiveRegion}>
          <SelectTrigger className="w-auto bg-white shadow-lg border-gray-200">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            {blogRegions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function FeaturedArticleCard({ post }: { post: BlogPost }) {
  const tags = post.featureTags ? JSON.parse(post.featureTags) : [];
  const seoAlt = `${post.title} - ${post.category} formulation guide`;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-gradient-to-br from-primary/5 to-white border-primary/20">
      {post.featuredImage && (
        <div className="bg-gray-100 overflow-hidden" style={{ aspectRatio: "3/2" }}>
          <img
            src={post.featuredImage}
            alt={seoAlt}
            width={400}
            height={260}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {post.category}
          </Badge>
          {post.productType && (
            <Badge variant="outline">{post.productType}</Badge>
          )}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            {post.readingTime} min read
          </div>
          <Link href={`/blog/${post.slug}`}>
            <Button variant="link" className="text-primary p-0 h-auto">
              Read Full Guide
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ArticleCard({ post }: { post: BlogPost }) {
  const tags = post.featureTags ? JSON.parse(post.featureTags) : [];
  const seoAlt = `${post.title} - ${post.category} formulation guide`;
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {post.featuredImage && (
        <div className="bg-gray-100 overflow-hidden" style={{ aspectRatio: "3/2" }}>
          <img
            src={post.featuredImage}
            alt={seoAlt}
            width={400}
            height={260}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {post.excerpt}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="text-xs">
            {post.category}
          </Badge>
          {post.productType && (
            <Badge variant="outline" className="text-xs">
              {post.productType}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Link href={`/blog/${post.slug}`}>
            <Button size="sm" variant="default" className="bg-primary">
              Read Full Guide
            </Button>
          </Link>
          <Link href="/">
            <Button size="sm" variant="outline">
              <Sparkles className="h-3 w-3 mr-1" />
              Generate with AI
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
