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
    <nav className="bg-white shadow-md sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main navigation bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <img 
                src={logoSettings.logoUrl} 
                alt={`${logoSettings.companyName} Logo`}
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = logoImage;
                }}
              />
            </Link>
          </div>

          {/* Always show mobile button on small screens */}
          <div className="block sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-blue-500 text-white p-3 rounded-md border-2 border-blue-600"
              data-testid="mobile-menu-button"
              style={{ minWidth: '50px', minHeight: '50px', fontSize: '20px' }}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Desktop Navigation - hide on small screens */}
          <div className="hidden sm:flex items-center space-x-4">
            <div className="flex items-baseline space-x-4">
              <Link href="/">
                <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                  isActive("/") 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-600 hover:text-primary"
                }`}>
                  Home
                </span>
              </Link>
              <Link href="/browse">
                <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                  isActive("/browse") 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-600 hover:text-primary"
                }`}>
                  Find Formulation
                </span>
              </Link>
              <Link href="/about">
                <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                  isActive("/about") 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-600 hover:text-primary"
                }`}>
                  About
                </span>
              </Link>
              <Link href="/contact">
                <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                  isActive("/contact") 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-600 hover:text-primary"
                }`}>
                  Contact
                </span>
              </Link>
              <Link href="/faq">
                <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                  isActive("/faq") 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-600 hover:text-primary"
                }`}>
                  FAQ
                </span>
              </Link>
            </div>
            
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search..."
              className="w-48"
            />
            <a 
              href="/api/logout"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded whitespace-nowrap"
            >
              Logout
            </a>
          </div>
        </div>

        {/* Mobile Menu - Collapsible */}
        {isMobileMenuOpen && (
          <div className="block sm:hidden border-t border-gray-200 bg-white">
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
