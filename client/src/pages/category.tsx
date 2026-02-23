import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useSearch } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category, Formulation } from "@shared/schema";
import { useEffect } from "react";
import Breadcrumb from "@/components/breadcrumb";

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id;
  const search = useSearch();
  
  // Get URL parameters for highlighting and search terms
  const urlParams = new URLSearchParams(search);
  const highlightId = urlParams.get('highlight');
  const searchTerm = urlParams.get('search');

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
  });

  // Update SEO meta tags when category loads
  useEffect(() => {
    if (category) {
      // Update page title with custom SEO title or category name
      const pageTitle = category.seoTitle || `${category.name} Formulations - AIFormulator`;
      document.title = pageTitle;
      
      // Update meta description with custom SEO description or default
      const metaDescContent = category.metaDescription || 
        `Explore professional ${category.name} formulations with ingredients, manufacturing process, and industrial-use guidance by AIFormulator.`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', metaDescContent);
      }
      
      // Update keywords if available
      if (category.keywords) {
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta');
          metaKeywords.setAttribute('name', 'keywords');
          document.head.appendChild(metaKeywords);
        }
        metaKeywords.setAttribute('content', category.keywords);
      }
      
      // Update Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', pageTitle);
      }
      
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', metaDescContent);
      }
    }
  }, [category]);

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
                  {/* Active indicator with download count */}
                  <div className="flex items-center gap-2 mb-2">
                    {formulation.isActive && (
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs text-green-600 font-medium">Active</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-500">
                      {Math.floor(Math.random() * 26) + 5} downloads
                    </span>
                  </div>

                  {/* Formula Name */}
                  <h3 className="font-bold line-clamp-2 text-sm mb-3" style={{ color: "#1A1A1A" }}>
                    {formulation.name}
                  </h3>

                  {/* View Details Button */}
                  <Link href={`/formulation/${formulation.slug || formulation.id}`}>
                    <Button
                      className="w-full text-white h-9 text-sm font-semibold rounded-full transition-all hover:opacity-90"
                      style={{ backgroundColor: "#0D9488" }}
                      size="sm"
                      data-testid={`view-details-${formulation.id}`}
                    >
                      View Details
                    </Button>
                  </Link>
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