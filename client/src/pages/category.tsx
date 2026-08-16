import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useSearch } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category, Formulation } from "@shared/schema";
import { useEffect } from "react";
import Breadcrumb from "@/components/breadcrumb";

function readServerCategoryData(slug: string | undefined): { category: Category; formulations: Formulation[] } | null {
  if (!slug) return null;
  try {
    const el = document.getElementById('__CATEGORY_DATA__');
    if (!el) return null;
    const data = JSON.parse(el.textContent || '');
    if (data && data.category && data.category.slug === slug) return data;
    return null;
  } catch {
    return null;
  }
}

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id;
  const search = useSearch();
  
  // Get URL parameters for highlighting and search terms
  const urlParams = new URLSearchParams(search);
  const highlightId = urlParams.get('highlight');
  const searchTerm = urlParams.get('search');

  const serverData = readServerCategoryData(categoryId);

  // Fetch the category from database
  const { data: category, isLoading: categoryLoading } = useQuery<Category>({ 
    queryKey: ["/api/categories", categoryId],
    queryFn: async () => {
      const response = await fetch(`/api/categories/${categoryId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch category');
      }
      return response.json();
    },
    enabled: !!categoryId,
    initialData: serverData?.category || undefined,
    initialDataUpdatedAt: serverData ? Date.now() : undefined,
  });

  const { data: formulations = [], isLoading: formulationsLoading } = useQuery<Formulation[]>({
    queryKey: ["/api/formulations", { categoryId }],
    queryFn: async () => {
      if (!category) {
        return [];
      }
      
      // Get all formulations and filter them client-side to handle both new and old categoryId formats
      const response = await fetch(`/api/formulations`);
      if (!response.ok) {
        throw new Error('Failed to fetch formulations');
      }
      const allFormulations = await response.json();
      
      // Filter formulations by category ID
      return allFormulations.filter((formulation: Formulation) => 
        formulation.categoryId === category.id
      );
    },
    enabled: !!categoryId && !!category,
    initialData: serverData?.formulations || undefined,
    initialDataUpdatedAt: serverData ? Date.now() : undefined,
  });

  // Update SEO meta tags when category loads
  useEffect(() => {
    if (!category) return;

    const pageTitle = category.seoTitle || `${category.name} Formulations | AIFormulator`;
    document.title = pageTitle;

    // Avoid "Formulations formulations" duplication when the category name already ends with that word.
    const catNameHasFormulations = /\bformula(?:tion)?s?\b$/i.test(category.name.trim());
    const metaDescContent = category.metaDescription ||
      (catNameHasFormulations
        ? `Browse professional ${category.name} — complete ingredient lists, manufacturing processes, and technical specifications for each formula.`
        : `Browse professional ${category.name} formulations with complete ingredient lists, manufacturing processes, and technical specifications.`);

    function setMeta(selector: string, attr: string, value: string) {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        // Parse the selector to set identifying attribute
        const match = selector.match(/\[([^=]+)="([^"]+)"\]/);
        if (match) el.setAttribute(match[1], match[2]);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    }

    setMeta('meta[name="description"]', 'content', metaDescContent);
    if (category.keywords) setMeta('meta[name="keywords"]', 'content', category.keywords);

    // Full Open Graph suite
    const pageUrl = `https://aiformulator.net/category/${category.slug || categoryId}`;
    setMeta('meta[property="og:title"]', 'content', pageTitle);
    setMeta('meta[property="og:description"]', 'content', metaDescContent);
    setMeta('meta[property="og:type"]', 'content', 'website');
    setMeta('meta[property="og:url"]', 'content', pageUrl);
    if ((category as any).image) {
      const imgUrl = (category as any).image.startsWith('http')
        ? (category as any).image
        : `https://aiformulator.net${(category as any).image}`;
      setMeta('meta[property="og:image"]', 'content', imgUrl);
      setMeta('meta[name="twitter:image"]', 'content', imgUrl);
    }
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', pageTitle);
    setMeta('meta[name="twitter:description"]', 'content', metaDescContent);

    // noindex empty categories
    const isEmptyCategory = formulations.length === 0;
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (isEmptyCategory) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, follow');
    } else if (robotsMeta) {
      robotsMeta.remove();
    }

    return () => {
      const robotsEl = document.querySelector('meta[name="robots"]');
      if (robotsEl) robotsEl.remove();
    };
  }, [category, formulations, categoryId]);

  // JSON-LD CollectionPage structured data
  useEffect(() => {
    if (!category) return;
    const SITE_URL = 'https://aiformulator.net';
    const schemaId = 'category-schema';
    const existing = document.getElementById(schemaId);
    if (existing) existing.remove();

    const visibleFormulations = formulations.filter(f => f.isActive);
    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': `${category.name} Formulations`,
      'description': category.metaDescription || category.description ||
        `Professional ${category.name} formulations with manufacturing guides.`,
      'url': `${SITE_URL}/category/${category.slug || categoryId}`,
      'publisher': { '@type': 'Organization', 'name': 'AIFormulator', 'url': SITE_URL },
    };

    if (visibleFormulations.length > 0) {
      schema['hasPart'] = visibleFormulations.slice(0, 20).map(f => ({
        '@type': 'TechArticle',
        'name': f.name,
        'url': `${SITE_URL}/formulation/${f.slug || f.id}`,
      }));
    }

    const script = document.createElement('script');
    script.id = schemaId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const s = document.getElementById(schemaId);
      if (s) s.remove();
    };
  }, [category, formulations, categoryId]);

  // Scroll to highlighted formulation when page loads
  useEffect(() => {
    if (highlightId && formulations.length > 0) {
      setTimeout(() => {
        const highlightedCard = document.getElementById(`formulation-${highlightId}`);
        if (highlightedCard) {
          highlightedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [highlightId, formulations]);

  if (categoryLoading || formulationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h2>
          <Link href="/browse">
            <Button>Return to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Browse", href: "/browse" },
            { label: category.name }
          ]}
        />
        
        <h1 className="text-3xl font-inter font-bold text-gray-900 mb-6">
          {category.name} Formulations
            {searchTerm && (
              <span className="block text-lg font-normal text-primary mt-1">
                Search results for "{searchTerm}"
              </span>
            )}
        </h1>
        
        {formulations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formulations
              .sort((a, b) => {
                // Put highlighted formulation first
                if (highlightId === a.id) return -1;
                if (highlightId === b.id) return 1;
                
                // If there's a search term, put matching formulations first
                if (searchTerm) {
                  const aMatches = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 a.description.toLowerCase().includes(searchTerm.toLowerCase());
                  const bMatches = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 b.description.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  if (aMatches && !bMatches) return -1;
                  if (!aMatches && bMatches) return 1;
                }
                
                return 0;
              })
              .map((formulation) => (
              <div 
                key={formulation.id} 
                id={`formulation-${formulation.id}`}
                className={`rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${
                  highlightId === formulation.id 
                    ? 'ring-2 ring-primary ring-opacity-50 scale-105' 
                    : ''
                }`}
                style={{ 
                  background: "linear-gradient(135deg, #FFFFFF 0%, #F0F4FF 100%)",
                  border: "1px solid #E4E9F8"
                }}
                data-testid={`formula-card-${formulation.id}`}
              >
                {/* Card Image */}
                {(formulation.thumbnail || formulation.image) ? (
                  <img
                    src={(formulation.thumbnail || formulation.image) ?? undefined}
                    alt={formulation.name}
                    className="w-full h-48 object-cover object-center"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center" style={{ backgroundColor: "#F0F4FF" }}>
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: "#FFFFFF", border: "1px solid #DDE6FF" }}>
                        <span className="text-3xl">🧪</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3">
                  {/* Active indicator */}
                  {formulation.isActive && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-xs text-green-600 font-medium">Active</span>
                    </div>
                  )}

                  {/* Formula Name */}
                  <h3 className="font-bold line-clamp-2 text-sm mb-3" style={{ color: "#1A1A1A" }}>
                    {formulation.name}
                  </h3>

                  {/* View Details Button */}
                  <a
                    href={`/formulation/${formulation.slug || formulation.id}`}
                    data-testid={`view-details-${formulation.id}`}
                  >
                    <Button
                      className="w-full text-white h-9 text-sm font-semibold rounded-full transition-all hover:opacity-90"
                      style={{ backgroundColor: "#0D9488" }}
                      size="sm"
                    >
                      View Details
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">No formulations found</h2>
            <p className="text-gray-600 text-lg mb-6">
              There are currently no formulations available in the {category.name} category.
            </p>
            <Link href="/browse">
              <Button className="bg-primary text-white hover:bg-primary/90">
                Browse Other Categories
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}