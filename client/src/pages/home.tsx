import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import CategoryCard from "@/components/category-card";
import SearchBar from "@/components/search-bar";
import { FlaskConical, Factory, Rocket } from "lucide-react";
import { Link } from "wouter";
import type { Category } from "@shared/schema";
import chemicalBannerImage from "@assets/483526757_122151147650449958_5670030473145342152_n_1755891598926.jpg";

export default function Home() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allFormulations = [] } = useQuery<any[]>({
    queryKey: ["/api/formulations"],
  });

  const getFormulationCount = (categoryId: string) => {
    return allFormulations.filter((f: any) => f.categoryId === categoryId).length;
  };

  // Handle search functionality
  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // For now, just scroll to categories section
    // In the future, you can filter categories or create a search results page
    document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative">
        <div 
          className="h-96 bg-cover bg-center relative" 
          style={{
            backgroundImage: `url(${chemicalBannerImage})`
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-6xl font-inter font-bold mb-4">
                Professional Chemical Formulations
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-2xl">
                Ready-to-use formulations for small business manufacturers across 50+ product categories with 1000+ formulations
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="bg-accent text-white px-8 py-3 text-lg font-medium hover:bg-orange-600"
                  onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="button-explore-categories"
                >
                  Explore Categories
                </Button>
                <Link href="/formulations/b1252d0f-4414-446c-9c5b-4676e8dd2ad8">
                  <Button 
                    className="bg-primary text-white px-8 py-3 text-lg font-medium hover:bg-blue-700 border-2 border-white"
                    data-testid="button-view-first-formulation"
                  >
                    View First Formulation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-inter font-bold text-gray-900 mb-4">
              Why Choose ChemFormula Pro?
            </h2>
            <p className="text-lg text-gray-600">
              Professional-grade formulations designed for small business success
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <FlaskConical className="text-white text-2xl h-8 w-8" />
              </div>
              <h3 className="text-xl font-inter font-semibold mb-3">Tested Formulations</h3>
              <p className="text-gray-600">
                All formulations are laboratory-tested and proven for commercial use
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Factory className="text-white text-2xl h-8 w-8" />
              </div>
              <h3 className="text-xl font-inter font-semibold mb-3">Factory Compliant</h3>
              <p className="text-gray-600">
                Meet regulatory standards and safety requirements
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="text-white text-2xl h-8 w-8" />
              </div>
              <h3 className="text-xl font-inter font-semibold mb-3">Quick Start</h3>
              <p className="text-gray-600">
                Ready-to-use formulations to accelerate your product development
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Overview */}
      <section id="categories" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-inter font-bold text-gray-900 mb-4">Product Categories</h2>
            <p className="text-lg text-gray-600 mb-6">
              Choose from our comprehensive range of formulation categories
            </p>
            <div className="flex justify-center">
              <SearchBar 
                onSearch={handleSearch}
                placeholder="Search formulations or categories…"
                className="w-full max-w-md"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                formulationCount={getFormulationCount(category.id)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
