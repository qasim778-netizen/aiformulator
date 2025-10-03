import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useSearch } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Category, Formulation } from "@shared/schema";
import { useEffect } from "react";

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
        `Browse ${category.name.toLowerCase()} formulations. Professional chemical formulations for small business manufacturers.`;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h1>
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
        <div className="flex items-center mb-6">
          <Link href="/browse">
            <Button variant="ghost" className="text-primary hover:text-blue-700 mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
          <h1 className="text-3xl font-inter font-bold text-gray-900">
            {category.name} Formulations ({formulations.length})
            {searchTerm && (
              <span className="block text-lg font-normal text-primary mt-1">
                Search results for "{searchTerm}"
              </span>
            )}
          </h1>
        </div>
        
        {formulations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <Card 
                key={formulation.id} 
                id={`formulation-${formulation.id}`}
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border ${
                  highlightId === formulation.id 
                    ? 'border-primary ring-2 ring-primary ring-opacity-50 bg-primary/5 scale-105' 
                    : 'border-gray-200'
                }`}
              >
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">{formulation.name}</h3>
                      <Badge className={formulation.isActive ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}>
                        {formulation.isActive ? "Active" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-3">{formulation.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">pH Level:</span>
                      <span className="font-medium">{formulation.phLevel}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shelf Life:</span>
                      <span className="font-medium">{formulation.shelfLife} months</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Batch Size:</span>
                      <span className="font-medium">{formulation.batchSize}</span>
                    </div>
                  </div>
                    <Link href={`/formulation/${formulation.slug || formulation.id}`}>
                      <Button className="w-full bg-primary text-white hover:bg-blue-700">
                        View Details
                      </Button>
                    </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">No formulations found</h2>
            <p className="text-gray-600 text-lg mb-6">
              There are currently no formulations available in the {category.name} category.
            </p>
            <Link href="/browse">
              <Button className="bg-primary text-white hover:bg-blue-700">
                Browse Other Categories
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}