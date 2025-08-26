import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Settings } from "lucide-react";
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
  const [logoSettings, setLogoSettings] = useState<LogoSettings>(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('ai_formulator_logo_settings');
    const defaultSettings = {
      logoUrl: logoImage,
      logoSize: 40,
      companyName: 'AIFormulator'
    };
    
    // If saved settings exist but company name is old format, update it
    if (saved) {
      const parsedSettings = JSON.parse(saved);
      if (parsedSettings.companyName === 'AI Formulator') {
        parsedSettings.companyName = 'AIFormulator';
        localStorage.setItem('ai_formulator_logo_settings', JSON.stringify(parsedSettings));
        return parsedSettings;
      }
      return parsedSettings;
    }
    
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center" style={{ minHeight: `${Math.max(48, logoSettings.logoSize + 16)}px` }}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <img 
                    src={logoSettings.logoUrl} 
                    alt={`${logoSettings.companyName} Logo`}
                    style={{ 
                      height: `${logoSettings.logoSize}px`,
                      maxHeight: `${logoSettings.logoSize}px`,
                      width: 'auto'
                    }}
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.src = logoImage; // Fallback to default
                    }}
                  />
                  <h1 className="text-lg font-inter font-bold text-primary">
                    {logoSettings.companyName}
                  </h1>
                </div>
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
                <Link href="/about">
                  <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    isActive("/about") 
                      ? "text-primary" 
                      : "text-gray-600 hover:text-primary"
                  }`} data-testid="link-about">
                    About
                  </span>
                </Link>
                <Link href="/contact">
                  <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    isActive("/contact") 
                      ? "text-primary" 
                      : "text-gray-600 hover:text-primary"
                  }`} data-testid="link-contact">
                    Contact
                  </span>
                </Link>
                <Link href="/faq">
                  <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    isActive("/faq") 
                      ? "text-primary" 
                      : "text-gray-600 hover:text-primary"
                  }`} data-testid="link-faq">
                    FAQ
                  </span>
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search formulations or categories…"
              className="w-64 md:w-80"
            />
            <a 
              href="/api/logout"
              className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
              data-testid="logout-button-navbar"
            >
              Logout (Test)
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
