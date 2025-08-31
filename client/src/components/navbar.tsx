import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/search-bar";
import logoImage from "@assets/logo_1756133481367.png";

interface LogoSettings {
  logoUrl: string;
  logoSize: number;
  companyName: string;
}

export default function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoSettings, setLogoSettings] = useState<LogoSettings>(() => {
    // Force correct branding - clear any old cached data
    const defaultSettings = {
      logoUrl: logoImage,
      logoSize: 110,
      companyName: 'AIFormulator'
    };
    
    // Clear old localStorage and set correct branding
    localStorage.removeItem('ai_formulator_logo_settings');
    localStorage.setItem('ai_formulator_logo_settings', JSON.stringify(defaultSettings));
    
    return defaultSettings;
  });
  
  // Listen for logo settings changes
  useEffect(() => {
    const handleLogoSettingsChange = (event: any) => {
      setLogoSettings(event.detail);
    };
    
    window.addEventListener('logoSettingsChanged', handleLogoSettingsChange);
    
    return () => {
      window.removeEventListener('logoSettingsChanged', handleLogoSettingsChange);
    };
  }, []);

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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Main navigation bar */}
        <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
          {/* Logo - Always visible */}
          <div className="flex-shrink-0">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <img 
                  src={logoSettings.logoUrl} 
                  alt={`${logoSettings.companyName} Logo`}
                  className="h-7 w-auto sm:h-8 lg:h-10 xl:h-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = logoImage; // Fallback to default
                  }}
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on mobile and tablet */}
          <div className="hidden xl:flex items-center space-x-6">
            <Link href="/">
              <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                isActive("/") 
                  ? "text-primary font-semibold" 
                  : "text-gray-600 hover:text-primary"
              }`}>
                Home
              </span>
            </Link>
            <Link href="/browse">
              <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                isActive("/browse") 
                  ? "text-primary font-semibold" 
                  : "text-gray-600 hover:text-primary"
              }`} data-testid="link-find-formulation">
                Find Formulation
              </span>
            </Link>
            <Link href="/about">
              <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                isActive("/about") 
                  ? "text-primary font-semibold" 
                  : "text-gray-600 hover:text-primary"
              }`} data-testid="link-about">
                About
              </span>
            </Link>
            <Link href="/contact">
              <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                isActive("/contact") 
                  ? "text-primary font-semibold" 
                  : "text-gray-600 hover:text-primary"
              }`} data-testid="link-contact">
                Contact
              </span>
            </Link>
            <Link href="/faq">
              <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                isActive("/faq") 
                  ? "text-primary font-semibold" 
                  : "text-gray-600 hover:text-primary"
              }`} data-testid="link-faq">
                FAQ
              </span>
            </Link>
          </div>

          {/* Desktop Right Side - Search and Logout */}
          <div className="hidden xl:flex items-center space-x-3">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search..."
              className="w-48 lg:w-64"
            />
            <a 
              href="/api/logout"
              className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 whitespace-nowrap"
              data-testid="logout-button-navbar"
            >
              Logout (Test)
            </a>
          </div>

          {/* Mobile menu button - Show on mobile, tablet, and small desktop */}
          <div className="xl:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center w-10 h-10 p-2 rounded-md text-gray-600 hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 touch-target"
              data-testid="mobile-menu-button"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Collapsible */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/">
                <span 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 cursor-pointer ${
                    isActive("/") 
                      ? "text-primary bg-primary/10 font-semibold" 
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                  data-testid="mobile-link-home"
                >
                  Home
                </span>
              </Link>
              <Link href="/browse">
                <span 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 cursor-pointer ${
                    isActive("/browse") 
                      ? "text-primary bg-primary/10 font-semibold" 
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                  data-testid="mobile-link-browse"
                >
                  Find Formulation
                </span>
              </Link>
              <Link href="/about">
                <span 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 cursor-pointer ${
                    isActive("/about") 
                      ? "text-primary bg-primary/10 font-semibold" 
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                  data-testid="mobile-link-about"
                >
                  About
                </span>
              </Link>
              <Link href="/contact">
                <span 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 cursor-pointer ${
                    isActive("/contact") 
                      ? "text-primary bg-primary/10 font-semibold" 
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                  data-testid="mobile-link-contact"
                >
                  Contact
                </span>
              </Link>
              <Link href="/faq">
                <span 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 cursor-pointer ${
                    isActive("/faq") 
                      ? "text-primary bg-primary/10 font-semibold" 
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                  data-testid="mobile-link-faq"
                >
                  FAQ
                </span>
              </Link>
              
              {/* Mobile Search */}
              <div className="px-3 py-2">
                <SearchBar 
                  onSearch={handleSearch}
                  placeholder="Search formulations..."
                  className="w-full"
                />
              </div>
              
              {/* Mobile Logout */}
              <a 
                href="/api/logout"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                data-testid="mobile-logout-button"
              >
                Logout (Test)
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
