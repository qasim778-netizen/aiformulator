import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, User, ArrowRight, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TrendingFormulations from "@/components/blog/trending-formulations";
import type { BlogPost } from "@shared/schema";

export default function BlogPage() {
  useEffect(() => {
    document.title = "AI Formulation Insights & Articles | AI Formulator Blog"
  }, [])

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading blog posts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">Error loading blog posts. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl font-inter font-bold text-gray-900 dark:text-white">
              AI Formulator Blog
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Insights, tips, and innovations in chemical formulation and AI-powered product development
          </p>
        </div>
      </div>

      {/* Trending Formulations Section */}
      <div className="bg-white dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <TrendingFormulations />
        </div>
      </div>

      {/* Blog Posts */}
      <div className="container mx-auto px-4 py-16">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-2xl font-inter font-semibold text-gray-900 dark:text-white mb-4">
              Coming Soon
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              We're working on exciting content about chemical formulation and AI innovation. 
              Check back soon for our latest insights and tips!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Card key={post.id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow duration-300">
                {post.featuredImage && (
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      data-testid={`img-featured-${post.slug}`}
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {post.authorName}
                    </div>
                  </div>
                  <h2 className="text-xl font-inter font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href={`/blog/${post.slug}`}>
                    <span 
                      className="inline-flex items-center text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors"
                      data-testid={`link-read-more-${post.slug}`}
                    >
                      Read More
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </span>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        {posts.length > 0 && (
          <div className="text-center mt-16 py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <h3 className="text-2xl font-inter font-semibold text-gray-900 dark:text-white mb-4">
              Ready to Start Formulating?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Discover our AI-powered formulation platform and create professional-grade products 
              for your business in minutes.
            </p>
            <Link href="/">
              <span 
                className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium cursor-pointer"
                data-testid="button-get-started"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}