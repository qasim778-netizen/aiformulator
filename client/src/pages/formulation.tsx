import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, Download, Printer, Bookmark, BookmarkCheck, ArrowRight, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Formulation, Category, FormulationContent } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Captcha } from "@/components/ui/captcha";
import Breadcrumb from "@/components/breadcrumb";
import FormulationSupport from "@/components/formulation-support";
import woodFloorCleaner from "@/assets/generated-images/wood-floor-cleaner.png";
import glassCleaner from "@/assets/generated-images/glass-cleaner.png";
import multiSurfaceCleaner from "@/assets/generated-images/multi-surface-cleaner.png";
import bathroomCleaner from "@/assets/generated-images/bathroom-cleaner.png";
import degreaser from "@/assets/generated-images/degreaser.png";
import allPurposeCleaner from "@/assets/generated-images/all-purpose-cleaner.png";
import refrigeratorCleaner from "@/assets/generated-images/refrigerator-cleaner.png";
import carpetCleaner from "@/assets/generated-images/carpet-cleaner.png";
import tileGroutCleaner from "@/assets/generated-images/tile-grout-cleaner.png";
import applianceCleaner from "@/assets/generated-images/appliance-cleaner.png";
import floorCleaner from "@/assets/generated-images/floor-cleaner.png";
import ovenCleaner from "@/assets/generated-images/oven-cleaner.png";
import woodSurfaceCleaner from "@/assets/generated-images/wood-surface-cleaner.png";
import ecoFriendlyCleaner from "@/assets/generated-images/eco-friendly-cleaner.png";
import concentratedCleaner from "@/assets/generated-images/concentrated-cleaner.png";

// Read server-injected formulation JSON (embedded in HTML at SSR time).
// This ensures React has the formulation data immediately on first render
// without waiting for an API call — prevents Google's renderer from
// ever seeing "Formulation Not Found" due to an in-flight fetch.
function readServerFormulationData(slug: string | undefined): any {
  if (typeof window === 'undefined' || !slug) return undefined;
  try {
    const el = document.getElementById('__FORMULATION_DATA__');
    if (el && el.textContent) {
      const data = JSON.parse(el.textContent);
      if (data && data.slug === slug) return data;
    }
  } catch { }
  return undefined;
}

export default function FormulationPage() {
  const params = useParams();
  const formulationId = params.id;
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(true);
  const [captchaKey, setCaptchaKey] = useState(0);

  // Server-injected hydration data — available synchronously on first render
  const serverFormulationData = useMemo(
    () => readServerFormulationData(formulationId),
    [formulationId]
  );

  const { data: formulation, isLoading: formulationLoading } = useQuery<any>({
    queryKey: ["/api/formulations", formulationId],
    initialData: serverFormulationData,
    // Mark injected data as fresh so React doesn't immediately re-fetch
    initialDataUpdatedAt: serverFormulationData ? Date.now() : undefined,
  });

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories", formulation?.categoryId],
    enabled: !!formulation?.categoryId,
  });

  const { data: allFormulations = [] } = useQuery<Formulation[]>({
    queryKey: ["/api/formulations"],
    enabled: !!formulation?.categoryId,
  });

  const relatedProducts = useMemo(() => {
    if (!formulation || !allFormulations.length) return [];
    return allFormulations
      .filter((f) => f.categoryId === formulation.categoryId && f.id !== formulation.id && f.isActive && f.status === 'published')
      .slice(0, 6);
  }, [allFormulations, formulation]);

  // Check if already favorited on load from backend
  const { data: userFavorites } = useQuery<any[]>({
    queryKey: ['/api/user/favorites'],
    enabled: !!user,
  });

  useEffect(() => {
    if (userFavorites && formulationId) {
      const isFav = userFavorites.some(fav => fav.formulationId === formulationId);
      setIsFavorited(isFav);
    }
  }, [userFavorites, formulationId]);

  // Update SEO metadata when formulation loads
  useEffect(() => {
    if (formulation && category) {
      // Create optimized page title (under 60 characters, keyword-rich)
      const shortName = formulation.name.length > 35 ? 
        formulation.name.substring(0, 32) + '...' : 
        formulation.name;
      let seoTitle = formulation.seoTitle || shortName;
      
      // Enforce 60 character limit even for stored seoTitle
      if (seoTitle.length > 60) {
        seoTitle = seoTitle.substring(0, 57) + '...';
      }
      
      document.title = seoTitle;

      // Create optimized meta description (under 160 characters, compelling)
      let metaDescription = formulation.metaDescription || 
        `Download the complete ${formulation.name} formulation with ingredients, manufacturing process, applications, and scale-up guidance.`;
      
      // Enforce 160 character limit even for stored metaDescription
      if (metaDescription.length > 160) {
        metaDescription = metaDescription.substring(0, 157) + '...';
      }
      
      let metaDescElement = document.querySelector('meta[name="description"]');
      if (!metaDescElement) {
        metaDescElement = document.createElement('meta');
        metaDescElement.setAttribute('name', 'description');
        document.head.appendChild(metaDescElement);
      }
      metaDescElement.setAttribute('content', metaDescription);

      // Update or create meta keywords
      if (formulation.keywords) {
        let metaKeywordsElement = document.querySelector('meta[name="keywords"]');
        if (!metaKeywordsElement) {
          metaKeywordsElement = document.createElement('meta');
          metaKeywordsElement.setAttribute('name', 'keywords');
          document.head.appendChild(metaKeywordsElement);
        }
        metaKeywordsElement.setAttribute('content', formulation.keywords);
      }

      // Update Open Graph tags for social sharing
      const ogTitle = seoTitle; // Use the already-trimmed seoTitle
      const ogDescription = metaDescription; // Use the already-trimmed metaDescription
      
      // Update or create og:title
      let ogTitleElement = document.querySelector('meta[property="og:title"]');
      if (!ogTitleElement) {
        ogTitleElement = document.createElement('meta');
        ogTitleElement.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitleElement);
      }
      ogTitleElement.setAttribute('content', ogTitle);

      // Update or create og:description
      let ogDescElement = document.querySelector('meta[property="og:description"]');
      if (!ogDescElement) {
        ogDescElement = document.createElement('meta');
        ogDescElement.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescElement);
      }
      ogDescElement.setAttribute('content', ogDescription);

      // Update or create og:type
      let ogTypeElement = document.querySelector('meta[property="og:type"]');
      if (!ogTypeElement) {
        ogTypeElement = document.createElement('meta');
        ogTypeElement.setAttribute('property', 'og:type');
        document.head.appendChild(ogTypeElement);
      }
      ogTypeElement.setAttribute('content', 'article');

      // Update or create og:url
      const pageUrl = `https://aiformulator.net${window.location.pathname}`;
      let ogUrlElement = document.querySelector('meta[property="og:url"]');
      if (!ogUrlElement) {
        ogUrlElement = document.createElement('meta');
        ogUrlElement.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrlElement);
      }
      ogUrlElement.setAttribute('content', pageUrl);

      let robotsElement = document.querySelector('meta[name="robots"]');
      if (!formulation.isActive) {
        if (!robotsElement) {
          robotsElement = document.createElement('meta');
          robotsElement.setAttribute('name', 'robots');
          document.head.appendChild(robotsElement);
        }
        robotsElement.setAttribute('content', 'noindex, nofollow');
      } else {
        if (robotsElement) {
          robotsElement.remove();
        }
      }
    }

    return () => {
      const robotsEl = document.querySelector('meta[name="robots"]');
      if (robotsEl) robotsEl.remove();
    };
  }, [formulation, category, formulationId]);

  // PDF Generation function
  const generatePDF = useCallback(async () => {
    if (!formulation) return;
    
    try {
      // Get logo settings from localStorage
      const logoSettings = JSON.parse(localStorage.getItem('ai_formulator_logo_settings') || '{}');
      
      const response = await fetch(`/api/formulations/${formulation.id}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoSettings }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setLocation(`/login?returnTo=${encodeURIComponent(location)}`);
          return;
        }
        throw new Error("Failed to generate PDF");
      }

      const pdfBlob = await response.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formulation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_formulation.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Download is automatically tracked on the backend when PDF is generated

      toast({
        title: "PDF Downloaded",
        description: `Formulation report for ${formulation.name} has been downloaded. Check My Account to see your downloads.`
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the formulation report. Please try again.",
        variant: "destructive"
      });
    }
  }, [formulation, category, user, toast, setLocation]);

  // Print function
  const handlePrint = useCallback(() => {
    window.print();
    toast({
      title: "Print Dialog Opened",
      description: "Use your browser's print dialog to print this formulation."
    });
  }, [toast]);

  // Favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async (formulationId: string) => {
      return apiRequest('POST', '/api/user/favorites', { formulationId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/favorites'] });
      setIsFavorited(true);
      toast({
        title: "Added to Favorites",
        description: `${formulation?.name} has been saved to your favorites.`
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to favorites. Please try again.",
        variant: "destructive"
      });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (formulationId: string) => {
      return apiRequest('DELETE', `/api/user/favorites/${formulationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/favorites'] });
      setIsFavorited(false);
      toast({
        title: "Removed from Favorites",
        description: `${formulation?.name} has been removed from your favorites.`
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive"
      });
    },
  });

  // Favorites function
  const toggleFavorite = useCallback(() => {
    if (!formulation || !formulationId) return;
    
    // Check if user is logged in
    if (!user) {
      setLocation(`/login?returnTo=${encodeURIComponent(location)}`);
      return;
    }
    
    if (isFavorited) {
      removeFavoriteMutation.mutate(formulationId);
    } else {
      addFavoriteMutation.mutate(formulationId);
    }
  }, [formulation, formulationId, isFavorited, user, addFavoriteMutation, removeFavoriteMutation, setLocation, location]);

  // Captcha verification handlers
  const handleCaptchaVerify = useCallback((verified: boolean) => {
    setIsCaptchaVerified(verified);
    if (verified) {
      toast({
        title: "Verification Successful",
        description: "You can now view the complete formulation details."
      });
    }
  }, [toast]);

  const resetCaptcha = useCallback(() => {
    setIsCaptchaVerified(false);
    setCaptchaKey(prev => prev + 1);
  }, []);

  if (formulationLoading || categoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!formulation) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-404-title">
                Formulation Not Found
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Sorry, we couldn't find the formulation you're looking for. It may have been removed or the link might be outdated.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/browse">
                <Button className="min-w-[200px]" data-testid="button-browse-all">
                  Browse All Formulations
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="min-w-[200px]" data-testid="button-home">
                  Return Home
                </Button>
              </Link>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-500 mb-4">
                <strong>What you can do:</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-2 max-w-md mx-auto text-left">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Browse our complete library of professional chemical formulations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Use the search feature to find specific formulations by name or category</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Contact us if you believe this is an error</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show captcha verification first
  if (!isCaptchaVerified) {
    return (
      <div className="bg-white py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Link href="/browse">
              <Button variant="ghost" className="text-primary hover:text-blue-700 mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Browse
              </Button>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Security Verification Required</h2>
            <p className="text-lg text-gray-600 mb-8">
              To access detailed formulation information for <strong>{formulation.name}</strong>, please complete the security verification below.
            </p>
          </div>
          
          <div className="max-w-lg mx-auto">
            <Captcha
              key={captchaKey}
              onVerify={handleCaptchaVerify}
              onReset={resetCaptcha}
            />
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              This verification helps protect against automated access and ensures the security of our formulation database.
            </p>
          </div>
        </div>
      </div>
    );
  }

  let ingredients: any[] = [];
  let instructions: any[] = [];
  try { ingredients = JSON.parse(formulation.ingredients) || []; } catch { ingredients = []; }
  try { instructions = JSON.parse(formulation.instructions) || []; } catch { instructions = []; }

  return (
    <div className="bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: category?.name || "Category", href: `/category/${category?.slug || formulation.categoryId}` },
            { label: formulation.name }
          ]}
        />

        {/* TOP CTA — before product title */}
        <a href="/" className="block my-4 group" style={{ textDecoration: "none" }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 rounded-2xl" style={{ background: "linear-gradient(135deg, #0D9488 0%, #059669 100%)" }}>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-base sm:text-lg leading-tight">Generate Your Custom Formula Instantly</p>
                <p className="text-teal-100 text-xs sm:text-sm mt-0.5">Want a different version? Our AI tailors it to your exact specs</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold text-sm px-5 py-2.5 rounded-full shadow group-hover:bg-teal-50 transition-colors">
                Start Now <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </a>

        <Card className="bg-white rounded-lg shadow-lg border border-gray-200">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-inter font-bold text-gray-900">
                {formulation.name}
              </h1>
              <Badge className={formulation.isActive ? "bg-success text-white" : "bg-yellow-500 text-white"}>
                {formulation.isActive ? "Active Formula" : "Draft Formula"}
              </Badge>
            </div>

            {/* Formula Image - Full Size (never uses thumbnail) */}
            {formulation.image && (
              <div className="mb-8 rounded-xl overflow-hidden" style={{ backgroundColor: "#F0F4FF" }}>
                <img
                  src={formulation.image}
                  alt={formulation.imageAlt || formulation.name}
                  className="w-full max-h-[500px] object-contain mx-auto"
                  data-testid="formulation-detail-image"
                />
              </div>
            )}
            
            {/* Description */}
            {formulation.description && (
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">{formulation.description}</p>
            )}

            {/* Admin-Generated Page Content - marketing copy, FAQs, benefits, etc. */}
            {formulation?.customPageContent && (
              <div className="mb-8 prose prose-lg max-w-none">
                <div
                  className="text-gray-700"
                  dangerouslySetInnerHTML={{ __html: formulation.customPageContent }}
                />
              </div>
            )}

            {/* Formula Details - Available in PDF Download Only */}
            <div className="mb-8">
              <div className="bg-teal-50 border-l-4 border-teal-500 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-teal-900 mb-4">Complete Formulation Details</h2>
                <p className="text-teal-800 mb-4">
                  The complete formulation details including ingredients, manufacturing process, equipment requirements, safety guidelines, and technical specifications are available in the PDF download.
                </p>
                <p className="text-teal-700 text-sm">
                  Click the "Download PDF" button below to access the full formulation report with all confidential information.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-8">
              <Button 
                onClick={generatePDF}
                className="bg-primary text-white hover:bg-primary/90"
                data-testid="button-download-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                onClick={handlePrint}
                className="bg-accent text-white hover:bg-orange-600"
                data-testid="button-print-formula"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Formula
              </Button>
              <Button 
                onClick={toggleFavorite}
                variant="outline" 
                className={`border-primary hover:bg-teal-50 ${
                  isFavorited 
                    ? 'bg-primary text-white hover:bg-primary/90' 
                    : 'text-primary'
                }`}
                data-testid="button-toggle-favorite"
              >
                {isFavorited ? (
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                ) : (
                  <Bookmark className="h-4 w-4 mr-2" />
                )}
                {isFavorited ? 'Favorited' : 'Save to Favorites'}
              </Button>
            </div>

            {/* BOTTOM CTA — Generate Your Custom Formula */}
            <a href="/" className="block mb-6 group" style={{ textDecoration: "none" }}>
              <div className="flex flex-col items-center text-center gap-4 px-6 py-8 rounded-2xl" style={{ background: "linear-gradient(135deg, #134E4A 0%, #0D9488 100%)" }}>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-extrabold text-xl sm:text-2xl leading-tight">Generate Your Custom Formula Instantly</p>
                  <p className="text-teal-200 text-sm sm:text-base mt-2 max-w-md mx-auto">
                    Need a personalised variation? Our AI builds a professional-grade formulation matched to your exact requirements in seconds.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold text-sm px-6 py-3 rounded-full shadow-lg group-hover:bg-teal-50 transition-colors">
                  Generate My Formula <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </a>

          </CardContent>
        </Card>

        {/* Expert Support Section — category-aware cards */}
        <FormulationSupport categorySlug={category?.slug || formulation.categoryId || ""} />

        {/* Related Products from Same Category */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-inter font-bold text-gray-900 mb-6">
              Related {category?.name || "Product"} Formulations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((product) => (
                <Link key={product.id} href={`/formulation/${product.slug || product.id}`}>
                  <Card className="h-full bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    {(product.thumbnail || product.image) && (
                      <div className="bg-gray-50 rounded-t-lg overflow-hidden" style={{ aspectRatio: "3/2" }}>
                        <img
                          src={(product.thumbnail || product.image) ?? undefined}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {category?.name || "Formula"}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Download className="h-3 w-3 mr-1" />
                          PDF Available
                        </span>
                        <span className="text-primary text-sm font-medium flex items-center">
                          View Formula
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}