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
                Browse and discover ready-to-use chemical formulations for small business manufacturers across 10 categories with 68+ professional formulations
              </p>
              <Link href="/formulations">
                <Button 
                  className="bg-accent text-white px-8 py-3 text-lg font-medium hover:bg-orange-600"
                  data-testid="button-find-formulations"
                >
                  Find Formulations
                </Button>
              </Link>
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

      {/* About Section */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-inter font-bold text-gray-900 mb-4">About ChemFormula Pro</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We are dedicated to empowering small business manufacturers with professional-grade chemical formulations. 
              Our comprehensive database contains expertly crafted recipes across multiple industries, complete with detailed 
              manufacturing instructions, ingredient specifications, and quality control measures.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-inter font-semibold mb-4">Our Mission</h3>
              <p className="text-gray-600 mb-6">
                To democratize access to professional chemical formulations and manufacturing knowledge, enabling small 
                businesses to compete with larger corporations while maintaining the highest quality standards.
              </p>
              <h3 className="text-2xl font-inter font-semibold mb-4">What We Offer</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• 68+ Professional chemical formulations</li>
                <li>• Laboratory-tested and commercially proven recipes</li>
                <li>• Detailed manufacturing procedures and equipment requirements</li>
                <li>• Quality control specifications and batch documentation</li>
                <li>• Regulatory compliance guidance</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-inter font-semibold mb-4">Why Choose Us?</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold">Expert Formulations</h4>
                    <p className="text-gray-600 text-sm">Developed by experienced chemists and industry professionals</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold">Commercial Ready</h4>
                    <p className="text-gray-600 text-sm">All formulations are tested for commercial production</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold">Ongoing Support</h4>
                    <p className="text-gray-600 text-sm">Technical assistance and guidance for your manufacturing needs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-inter font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-lg text-gray-600">
              Get in touch with our team for technical support, custom formulations, or partnership opportunities
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-inter font-semibold mb-3">Email</h3>
              <p className="text-gray-600">info@chemformulapro.com</p>
              <p className="text-gray-600">support@chemformulapro.com</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-inter font-semibold mb-3">Phone</h3>
              <p className="text-gray-600">+1 (555) 123-4567</p>
              <p className="text-gray-600 text-sm">Mon-Fri 9AM-6PM EST</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-inter font-semibold mb-3">Address</h3>
              <p className="text-gray-600">123 Chemistry Lane</p>
              <p className="text-gray-600">Lab City, LC 12345</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <div className="bg-white p-8 rounded-lg shadow-sm max-w-2xl mx-auto">
              <h3 className="text-xl font-inter font-semibold mb-4">Technical Support</h3>
              <p className="text-gray-600 mb-4">
                Our team of experienced chemists and technical experts are available to assist with:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <ul className="text-gray-600 space-y-2">
                  <li>• Formulation customization</li>
                  <li>• Manufacturing guidance</li>
                  <li>• Quality control support</li>
                </ul>
                <ul className="text-gray-600 space-y-2">
                  <li>• Regulatory compliance</li>
                  <li>• Scaling production</li>
                  <li>• Technical troubleshooting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
