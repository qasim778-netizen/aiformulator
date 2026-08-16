import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Clock, ChevronRight, ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { BlogPost } from "@shared/schema";

function readServerBlogPostData(slug: string | undefined): BlogPost | null {
  if (!slug) return null;
  try {
    const el = document.getElementById('__BLOG_POST_DATA__');
    if (!el) return null;
    const data = JSON.parse(el.textContent || '');
    if (data && data.slug === slug) return data as BlogPost;
    return null;
  } catch {
    return null;
  }
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  const serverPost = readServerBlogPostData(slug);

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog/slug/${slug}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
    enabled: !!slug,
    initialData: serverPost || undefined,
    initialDataUpdatedAt: serverPost ? Date.now() : undefined,
  });

  const { data: relatedPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ["related-posts", post?.category],
    queryFn: async () => {
      const response = await fetch(`/api/blog/published?category=${post?.category}`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      const allPosts = await response.json();
      return allPosts.filter((p: BlogPost) => p.id !== post?.id).slice(0, 3);
    },
    enabled: !!post?.category,
  });

  useEffect(() => {
    if (post) {
      const pageTitle = post.metaTitle || `${post.title} | AI Formulator Blog`;
      document.title = pageTitle;

      const pageDesc = post.metaDescription || post.excerpt || '';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && pageDesc) metaDesc.setAttribute('content', pageDesc);

      const pageUrl = `https://aiformulator.net/blog/${post.slug}`;

      function setMeta(selector: string, attr: string, value: string) {
        let el = document.querySelector(selector);
        if (!el) {
          el = document.createElement('meta');
          const match = selector.match(/\[([^=]+)="([^"]+)"\]/);
          if (match) el.setAttribute(match[1], match[2]);
          document.head.appendChild(el);
        }
        el.setAttribute(attr, value);
      }

      setMeta('meta[property="og:title"]', 'content', pageTitle);
      setMeta('meta[property="og:description"]', 'content', pageDesc);
      setMeta('meta[property="og:type"]', 'content', 'article');
      setMeta('meta[property="og:url"]', 'content', pageUrl);
      if (post.featuredImage) {
        setMeta('meta[property="og:image"]', 'content', post.featuredImage);
        setMeta('meta[name="twitter:image"]', 'content', post.featuredImage);
      }
      setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
      setMeta('meta[name="twitter:title"]', 'content', pageTitle);
      setMeta('meta[name="twitter:description"]', 'content', pageDesc);

      const existingSchemas = document.querySelectorAll('script[data-schema^="blog-post"]');
      existingSchemas.forEach(s => s.remove());
      
      const blogPostingSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.metaDescription || post.excerpt || "",
        "datePublished": post.publishedAt || post.createdAt,
        "dateModified": post.updatedAt,
        "author": {
          "@type": "Person",
          "name": post.authorName
        },
        "publisher": {
          "@type": "Organization",
          "name": "AI Formulator",
          "url": window.location.origin
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `${window.location.origin}/blog/${post.slug}`
        },
        "articleSection": post.category,
        "image": post.featuredImage || undefined,
        "wordCount": post.content?.split(/\s+/).length || 0,
        "timeRequired": `PT${post.readingTime || 5}M`
      };
      
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": window.location.origin
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Blog",
            "item": `${window.location.origin}/blog`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": post.category,
            "item": `${window.location.origin}/blog?category=${post.category}`
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": post.title,
            "item": `${window.location.origin}/blog/${post.slug}`
          }
        ]
      };
      
      const blogScript = document.createElement('script');
      blogScript.type = 'application/ld+json';
      blogScript.setAttribute('data-schema', 'blog-post-article');
      blogScript.textContent = JSON.stringify(blogPostingSchema);
      document.head.appendChild(blogScript);
      
      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.setAttribute('data-schema', 'blog-post-breadcrumb');
      breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(breadcrumbScript);
      
      const isHowToArticle = post.title.toLowerCase().includes('how to') || 
                            post.content.toLowerCase().includes('step 1') ||
                            post.content.toLowerCase().includes('step-by-step');
      
      if (isHowToArticle) {
        const steps = [];
        const stepRegex = /<h[23][^>]*>(?:step\s*\d+[:\s-]*)?([^<]+)<\/h[23]>/gi;
        let match;
        let position = 1;
        while ((match = stepRegex.exec(post.content)) !== null && position <= 10) {
          steps.push({
            "@type": "HowToStep",
            "position": position,
            "name": match[1].trim()
          });
          position++;
        }
        
        if (steps.length > 0) {
          const howToSchema = {
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": post.title,
            "description": post.metaDescription || post.excerpt || "",
            "totalTime": `PT${post.readingTime || 5}M`,
            "step": steps
          };
          
          const howToScript = document.createElement('script');
          howToScript.type = 'application/ld+json';
          howToScript.setAttribute('data-schema', 'blog-post-howto');
          howToScript.textContent = JSON.stringify(howToSchema);
          document.head.appendChild(howToScript);
        }
      }
      
      const faqMatch = post.content.match(/<h[23][^>]*>[^<]*\?<\/h[23]>/gi);
      if (faqMatch && faqMatch.length > 0) {
        const faqItems: { "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } }[] = [];
        const faqRegex = /<h[23][^>]*>([^<]+\?)<\/h[23]>\s*<p>([^<]+)<\/p>/gi;
        let faqMatchResult;
        while ((faqMatchResult = faqRegex.exec(post.content)) !== null && faqItems.length < 5) {
          faqItems.push({
            "@type": "Question",
            "name": faqMatchResult[1].trim(),
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faqMatchResult[2].trim()
            }
          });
        }
        
        if (faqItems.length > 0) {
          const faqSchema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqItems
          };
          
          const faqScript = document.createElement('script');
          faqScript.type = 'application/ld+json';
          faqScript.setAttribute('data-schema', 'blog-post-faq');
          faqScript.textContent = JSON.stringify(faqSchema);
          document.head.appendChild(faqScript);
        }
      }
      
      return () => {
        const schemas = document.querySelectorAll('script[data-schema^="blog-post"]');
        schemas.forEach(s => s.remove());
      };
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
            <p className="text-gray-600 mb-6">The article you're looking for doesn't exist or has been removed.</p>
            <Link href="/blog">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const featureTags = post.featureTags ? JSON.parse(post.featureTags) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-primary">
                Home
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <li>
              <Link href="/blog" className="text-gray-500 hover:text-primary">
                Blog
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <li>
              <Link href={`/blog?category=${post.category}`} className="text-gray-500 hover:text-primary">
                {post.category}
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <li className="text-gray-900 font-medium truncate max-w-[200px]">
              {post.title}
            </li>
          </ol>
        </div>
      </nav>

      <article className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-inter font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>
            
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {post.readingTime} min read
              </div>
              <Badge variant="secondary">{post.category}</Badge>
              {post.productType && (
                <Badge variant="outline">{post.productType}</Badge>
              )}
              {featureTags.map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="bg-gray-50">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Hero Image - 1200×675 (16:9) with eager loading */}
            {post.featuredImage && (
              <div className="bg-gray-100 rounded-xl overflow-hidden mb-8" style={{ aspectRatio: "16/9" }}>
                <img
                  src={post.featuredImage}
                  alt={`${post.title} - ${post.category} formulation guide`}
                  width={1200}
                  height={675}
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            )}
          </header>

          {/* Article Content */}
          <div 
            className="prose prose-lg max-w-none prose-headings:font-inter prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA Section */}
          <div className="mt-12 p-8 bg-gradient-to-br from-primary/10 to-blue-50 rounded-2xl text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              Ready to Create Your Own Formula?
            </h3>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Use our AI-powered generator to create a custom formulation based on your specific requirements.
            </p>
            <Link href="/browse">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Sparkles className="mr-2 h-5 w-5" />
                Generate with AI
              </Button>
            </Link>
          </div>

          <Separator className="my-12" />

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <BookOpen className="mr-3 h-6 w-6 text-primary" />
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((related) => (
                  <Card key={related.id} className="hover:shadow-md transition-shadow">
                    {related.featuredImage && (
                      <div className="bg-gray-100 overflow-hidden" style={{ aspectRatio: "3/2" }}>
                        <img
                          src={related.featuredImage}
                          alt={`${related.title} - ${related.category} formulation guide`}
                          width={400}
                          height={260}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {related.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {related.readingTime} min read
                        </span>
                        <Link href={`/blog/${related.slug}`}>
                          <Button variant="link" size="sm" className="text-primary p-0">
                            Read More
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Back to Blog */}
          <div className="mt-12 text-center">
            <Link href="/blog">
              <Button variant="outline" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Articles
              </Button>
            </Link>
          </div>
        </div>
      </article>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.metaDescription || post.excerpt,
            image: post.featuredImage,
            author: {
              "@type": "Organization",
              name: post.authorName,
            },
            publisher: {
              "@type": "Organization",
              name: "AI Formulator",
              logo: {
                "@type": "ImageObject",
                url: "https://aiformulator.net/logo.png",
              },
            },
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://aiformulator.net/blog/${post.slug}`,
            },
          }),
        }}
      />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://aiformulator.net",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: "https://aiformulator.net/blog",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: post.category,
                item: `https://aiformulator.net/blog?category=${post.category}`,
              },
              {
                "@type": "ListItem",
                position: 4,
                name: post.title,
                item: `https://aiformulator.net/blog/${post.slug}`,
              },
            ],
          }),
        }}
      />
    </div>
  );
}
