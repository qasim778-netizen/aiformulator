import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Settings, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/search-bar";
import logoImage from "@assets/logo_1756133481367.png";

interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isAdmin?: boolean;
}

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

  // Check if user is authenticated
  const { data: user, isLoading: isLoadingUser } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
    // If user is not authenticated, the endpoint will return 401, which we'll handle as null
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      if (response.status === 401) {
        return null;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
  });

  const isAuthenticated = !!user;
  
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
  
  const getUserDisplayName = () => {
    if (!user) return "";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split('@')[0];
    return "User";
  };

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
        <div className="flex items-center justify-between min-h-[120px] py-2">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <img 
                src={logoSettings.logoUrl} 
                alt={`${logoSettings.companyName} Logo`}
                style={{ height: `${logoSettings.logoSize}px` }}
                className="w-auto object-contain"
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

          {/* Left side - Navigation Menu */}
          <div className="hidden sm:flex items-center space-x-6 flex-1">
            <div className="flex items-center space-x-4">
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
              <Link href="/faq">
                <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                  isActive("/faq") 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-600 hover:text-primary"
                }`}>
                  FAQ
                </span>
              </Link>
              <Link href="/blog">
                <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                  isActive("/blog") 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-600 hover:text-primary"
                }`}>
                  Blog
                </span>
              </Link>
            </div>
          </div>

          {/* Right side - Search Bar and Auth Buttons */}
          <div className="hidden sm:flex items-center space-x-4">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search formulations..."
              className="w-80"
            />
            
            {!isLoadingUser && (
              <>
                {isAuthenticated ? (
                  // Show user info and logout when authenticated
                  <>
                    {user?.isAdmin && (
                      <Link href="/admin/user-activity">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center space-x-2"
                          data-testid="button-admin-dashboard"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Admin</span>
                        </Button>
                      </Link>
                    )}
                    <Link href="/my-account">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center space-x-2"
                        data-testid="button-my-account"
                      >
                        <User className="h-4 w-4" />
                        <span>{getUserDisplayName()}</span>
                      </Button>
                    </Link>
                    <a 
                      href="/api/logout"
                      className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded whitespace-nowrap"
                      data-testid="button-logout"
                    >
                      Logout
                    </a>
                  </>
                ) : (
                  // Show login and sign up buttons when not authenticated
                  <>
                    <Link href="/login">
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid="button-login"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button 
                        size="sm"
                        data-testid="button-signup"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
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
              <Link href="/blog">
                <span 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 cursor-pointer ${
                    isActive("/blog") 
                      ? "text-primary bg-primary/10 font-semibold" 
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                  data-testid="mobile-link-blog"
                >
                  Blog
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
              
              {/* Mobile Auth Section */}
              {!isLoadingUser && (
                <>
                  {isAuthenticated ? (
                    // Show user info and logout when authenticated
                    <>
                      <Link href="/my-account">
                        <span 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-primary hover:bg-gray-50 cursor-pointer"
                          data-testid="mobile-link-my-account"
                        >
                          <User className="h-4 w-4" />
                          <span>{getUserDisplayName()}</span>
                        </span>
                      </Link>
                      <a 
                        href="/api/logout"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        data-testid="mobile-button-logout"
                      >
                        Logout
                      </a>
                    </>
                  ) : (
                    // Show login and sign up buttons when not authenticated
                    <div className="px-3 py-2 space-y-2">
                      <Link href="/login" className="block">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          data-testid="mobile-button-login"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Login
                        </Button>
                      </Link>
                      <Link href="/signup" className="block">
                        <Button 
                          className="w-full"
                          data-testid="mobile-button-signup"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
