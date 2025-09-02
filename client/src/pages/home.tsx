import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Calendar, ArrowRight, BookOpen } from 'lucide-react'
import { Link } from 'wouter'
import AIFormulatorWizard from '@/components/ai-formulator-wizard'
import type { BlogPost } from '@shared/schema'

export default function Home() {
  const [isWizardActive, setIsWizardActive] = useState(false)

  // Fetch recent blog posts
  const { data: recentPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ["recent-blog-posts"],
    queryFn: async () => {
      const response = await fetch("/api/blog/published", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const posts = await response.json();
      return posts.slice(0, 3); // Get only the 3 most recent posts
    },
    retry: 1,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-white overflow-x-hidden w-full">
      <div className="responsive-container mx-auto py-4 sm:py-6 lg:py-8 w-full max-w-7xl">
        {/* Hero Section - Hidden when in wizard */}
        <div className="text-center mb-4"></div>

        {/* Single Custom Formula Option */}
        <div className="w-full max-w-6xl mx-auto">
          {!isWizardActive && (
            <div className="flex justify-center mb-4 sm:mb-6">
              <Card className="max-w-md w-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] touch-target ring-2 ring-primary bg-primary/5 border-primary">
                <CardContent className="p-4 sm:p-5 lg:p-6 text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-4 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="text-responsive-xl font-bold text-gray-900 mb-2">Create Custom Formula</h3>
                  <p className="text-gray-600 text-responsive-sm">AI-powered formulation wizard with precise specifications</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className={isWizardActive ? "mt-0" : "mt-8"}>
            <AIFormulatorWizard onWizardStateChange={setIsWizardActive} />
          </div>

          {/* Recent Blog Posts Section - Only show when wizard is not active */}
          {!isWizardActive && recentPosts.length > 0 && (
            <div className="mt-12">
              <Card className="w-full">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <BookOpen className="h-6 w-6 text-primary mr-2" />
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Latest Blog Posts
                    </CardTitle>
                  </div>
                  <p className="text-gray-600">
                    Stay updated with the latest insights in chemical formulation
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    {recentPosts.map((post) => (
                      <Card 
                        key={post.id} 
                        className="hover:shadow-lg transition-shadow duration-300 border-gray-200 hover:border-primary/30"
                        data-testid={`blog-card-${post.slug}`}
                      >
                        <CardContent className="p-4">
                          {post.featuredImage && (
                            <img 
                              src={post.featuredImage} 
                              alt={post.title}
                              className="w-full h-32 object-cover rounded-md mb-3"
                            />
                          )}
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(post.createdAt).toLocaleDateString()}
                            </div>
                            <span>{post.authorName}</span>
                          </div>
                          <Link href={`/blog/${post.slug}`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              data-testid={`link-blog-${post.slug}`}
                            >
                              Read More
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* View All Blog Posts Button */}
                  <div className="text-center mt-6">
                    <Link href="/blog">
                      <Button variant="default" data-testid="button-view-all-blog">
                        View All Blog Posts
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}