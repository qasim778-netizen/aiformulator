import { Link, useLocation } from "wouter";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/search-bar";

export default function Navbar() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  // Handle search functionality
  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // For now, navigate to home page and scroll to categories
    // In the future, you can create a dedicated search results page
    window.location.href = '/#categories';
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-xl font-inter font-bold text-primary cursor-pointer">
                  ChemFormula Pro
                </h1>
              </Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link href="/">
                  <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    isActive("/") 
                      ? "text-primary" 
                      : "text-gray-600 hover:text-primary"
                  }`}>
                    Home
                  </span>
                </Link>
                <Link href="/browse">
                  <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    isActive("/browse") 
                      ? "text-primary" 
                      : "text-gray-600 hover:text-primary"
                  }`} data-testid="link-find-formulation">
                    Find Formulation
                  </span>
                </Link>
                <a 
                  href="#about" 
                  className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  About
                </a>
                <a 
                  href="#contact" 
                  className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search formulations or categories…"
              className="w-64 md:w-80"
            />
            <div className="flex items-center space-x-2">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-gray-50">
                  <Settings className="h-4 w-4 mr-1" />
                  Admin
                </Button>
              </Link>
              <Link href="/ai-admin">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Settings className="h-4 w-4 mr-2" />
                  AI Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
