import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Download, Printer, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import type { Formulation, Category } from "@shared/schema";
import SignInDialog from "@/components/signin-dialog";
import { Captcha } from "@/components/ui/captcha";
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

export default function FormulationPage() {
  const params = useParams();
  const formulationId = params.id;
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(true);
  const [captchaKey, setCaptchaKey] = useState(0);

  const { data: formulation, isLoading: formulationLoading } = useQuery<Formulation>({
    queryKey: ["/api/formulations", formulationId],
  });

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories", formulation?.categoryId],
    enabled: !!formulation?.categoryId,
  });

  // Check if already favorited on load
  useEffect(() => {
    if (formulationId) {
      const favorites = JSON.parse(localStorage.getItem('favoriteFormulations') || '[]');
      setIsFavorited(favorites.includes(formulationId));
    }
  }, [formulationId]);

  // Update SEO metadata when formulation loads
  useEffect(() => {
    if (formulation && category) {
      // Create optimized page title (under 60 characters, keyword-rich)
      const shortName = formulation.name.length > 35 ? 
        formulation.name.substring(0, 32) + '...' : 
        formulation.name;
      let seoTitle = formulation.seoTitle || `${shortName} - ${category.name}`;
      
      // Enforce 60 character limit even for stored seoTitle
      if (seoTitle.length > 60) {
        seoTitle = seoTitle.substring(0, 57) + '...';
      }
      
      document.title = seoTitle;

      // Create optimized meta description (under 160 characters, compelling)
      const shortFormulationName = formulation.name.length > 50 ? 
        formulation.name.substring(0, 47) + '...' : 
        formulation.name;
      let metaDescription = formulation.metaDescription || 
        `Professional ${shortFormulationName} formula. Complete ingredients, manufacturing process & specs. Download PDF now!`;
      
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
    }
  }, [formulation, category]);

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
          setShowSignInDialog(true);
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

      toast({
        title: "PDF Downloaded",
        description: `Formulation report for ${formulation.name} has been downloaded.`
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      
      // Don't show error toast if sign-in dialog is being shown
      if (showSignInDialog) {
        return;
      }
      
      toast({
        title: "Download Failed",
        description: "There was an error downloading the formulation report. Please try again.",
        variant: "destructive"
      });
    }
  }, [formulation, toast]);

  // Print function
  const handlePrint = useCallback(() => {
    window.print();
    toast({
      title: "Print Dialog Opened",
      description: "Use your browser's print dialog to print this formulation."
    });
  }, [toast]);

  // Favorites function
  const toggleFavorite = useCallback(() => {
    if (!formulation || !formulationId) return;
    
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteFormulations') || '[]');
      
      if (isFavorited) {
        // Remove from favorites
        const updatedFavorites = favorites.filter((id: string) => id !== formulationId);
        localStorage.setItem('favoriteFormulations', JSON.stringify(updatedFavorites));
        setIsFavorited(false);
        toast({
          title: "Removed from Favorites",
          description: `${formulation.name} has been removed from your favorites.`
        });
      } else {
        // Add to favorites
        const updatedFavorites = [...favorites, formulationId];
        localStorage.setItem('favoriteFormulations', JSON.stringify(updatedFavorites));
        setIsFavorited(true);
        toast({
          title: "Added to Favorites",
          description: `${formulation.name} has been saved to your favorites.`
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "There was an error updating your favorites. Please try again.",
        variant: "destructive"
      });
    }
  }, [formulation, formulationId, isFavorited, toast]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Formulation not found</h1>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Security Verification Required</h1>
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

  const ingredients = JSON.parse(formulation.ingredients);
  const instructions = JSON.parse(formulation.instructions);

  return (
    <div className="bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/category/${formulation.categoryId}`}>
            <Button variant="ghost" className="text-primary hover:text-blue-700 mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {category?.name || 'Category'} Formulations
            </Button>
          </Link>
          <div className="flex gap-2">
            <Link href="/browse">
              <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary hover:text-white">
                Browse All Formulations
              </Button>
            </Link>
            <Link href={`/category/${formulation.categoryId}`}>
              <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary hover:text-white">
                More {category?.name || 'Similar'} Products
              </Button>
            </Link>
          </div>
        </div>
        
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

            {/* Product Image Section */}
            {formulation.image && (
              <div className="mb-8">
                <div className="relative w-full max-w-2xl mx-auto">
                  <img
                    src={formulation.image}
                    alt={formulation.imageAlt || `${formulation.name} - Professional Chemical Formulation`}
                    className="w-full h-64 sm:h-80 object-cover rounded-lg border-2 border-gray-200 shadow-md"
                  />
                  {formulation.imageFilename && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {formulation.imageFilename}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            
            {/* Technical Specifications Section - Clean Layout */}
            <div className="mb-8">
              <div className="bg-white border border-gray-300 rounded-sm">
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-x divide-gray-300">
                  
                  {/* Product Shelf Life & Storage Requirements */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Product Shelf Life & Storage Requirements
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-900 font-bold">• Shelf life</span><br />
                        <span className="text-gray-700 ml-4">{formulation.shelfLife}</span>
                      </div>
                      <div>
                        <span className="text-gray-900 font-bold">• Storage Conditions</span><br />
                        <span className="text-gray-700 ml-4">{formulation.storageConditions}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chemical Product Properties & Characteristics */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Chemical Product Properties & Characteristics
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-900 font-bold">Product Type </span>
                        <span className="text-gray-700">{category?.name || 'Professional Chemical'}</span>
                      </div>
                      <div>
                        <span className="text-gray-900 font-bold">pH Level </span>
                        <span className="text-gray-700">{formulation.phLevel}</span>
                      </div>
                      {formulation.viscosity && (
                        <div>
                          <span className="text-gray-900 font-bold">Viscosity </span>
                          <span className="text-gray-700">{formulation.viscosity}</span>
                        </div>
                      )}
                      {formulation.certification && (
                        <div>
                          <span className="text-gray-900 font-bold">Complies with </span>
                          <span className="text-gray-700">{formulation.certification}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manufacturing Production Details */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Manufacturing Production Details
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-900 font-bold">Batch Size </span>
                        <span className="text-gray-700">{formulation.batchSize}</span>
                      </div>
                      <div>
                        <span className="text-gray-900 font-bold">Processing Time</span><br />
                        <span className="text-gray-700">{formulation.processingTime}</span>
                      </div>
                      <div>
                        <span className="text-gray-900 font-bold">Processing Ambient Temp</span><br />
                        <span className="text-gray-700">{formulation.temperature || 'temperature for storage and handling'}</span>
                      </div>
                      <div>
                        <span className="text-gray-900 font-bold">Required Equipment</span><br />
                        <span className="text-gray-700">section below</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Images - AI Generated or Static */}
            {(formulation.image || category?.name === "Cleaning Products") && (
              <div className="mb-8">
                <h2 className="text-xl font-inter font-semibold mb-6 text-primary border-b-2 border-primary pb-2">Professional Chemical Product Images & Visual References</h2>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  {/* AI Generated Image has priority */}
                  {formulation.image && (
                    <img 
                      src={formulation.image} 
                      alt={`${formulation.name} - Professional Chemical Formulation`}
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-ai-generated"
                    />
                  )}
                  
                  {/* Fallback to static images for Cleaning Products if no AI image */}
                  {!formulation.image && category?.name === "Cleaning Products" && (
                    <>
                  {formulation.name.includes("Wood Floor") && (
                    <img 
                      src={woodFloorCleaner} 
                      alt="Wood Floor Cleaner Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {formulation.name.includes("Glass") && !formulation.name.includes("Concentrated") && (
                    <img 
                      src={glassCleaner} 
                      alt="Glass Cleaner Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {formulation.name.includes("Bathroom") && !formulation.name.includes("Eco-Friendly") && (
                    <img 
                      src={bathroomCleaner} 
                      alt="Bathroom Cleaner Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {formulation.name.includes("Degreaser") && (
                    <img 
                      src={degreaser} 
                      alt="Heavy-Duty Degreaser Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {formulation.name.includes("All-Purpose") && (
                    <img 
                      src={allPurposeCleaner} 
                      alt="All-Purpose Cleaner Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {formulation.name.includes("Refrigerator") && (
                    <img 
                      src={refrigeratorCleaner} 
                      alt="Refrigerator Cleaner Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {(formulation.name.includes("Carpet") || formulation.name.includes("Upholstery")) && (
                    <img 
                      src={carpetCleaner} 
                      alt="Carpet Cleaner Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {(formulation.name.includes("Tile") || formulation.name.includes("Grout")) && (
                    <img 
                      src={tileGroutCleaner} 
                      alt="Tile & Grout Cleaner Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {(formulation.name.includes("Microwave") || formulation.name.includes("Appliance")) && (
                    <img 
                      src={applianceCleaner} 
                      alt="Appliance Cleaner Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {formulation.name.includes("Pet-Safe Floor") && (
                    <img 
                      src={floorCleaner} 
                      alt="Floor Cleaner Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {(formulation.name.includes("Oven") || formulation.name.includes("Grill")) && (
                    <img 
                      src={ovenCleaner} 
                      alt="Oven Cleaner Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {formulation.name.includes("Wood Surface") && (
                    <img 
                      src={woodSurfaceCleaner} 
                      alt="Wood Surface Cleaner Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {(formulation.name.includes("Eco-Friendly") || formulation.name.includes("Biodegradable")) && (
                    <img 
                      src={ecoFriendlyCleaner} 
                      alt="Eco-Friendly Cleaner Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {formulation.name.includes("Concentrated") && (
                    <img 
                      src={concentratedCleaner} 
                      alt="Concentrated Cleaner Formulation - Chemical Formula Services"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-product"
                    />
                  )}
                  {/* No fallback image for custom formulations */}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-inter font-semibold mb-6 text-primary border-b-2 border-primary pb-2">Professional Chemical Product Description & Overview</h2>
              <p className="text-gray-700 leading-relaxed">
                {formulation.description}
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-inter font-semibold mb-6 text-primary border-b-2 border-primary pb-2">Professional Formulation Ingredients Table</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Ingredient</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">INCI Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Percentage</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Function</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ingredients.map((ingredient: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-3">{ingredient.name}</td>
                        <td className="px-4 py-3">{ingredient.inci}</td>
                        <td className="px-4 py-3">{ingredient.percentage}</td>
                        <td className="px-4 py-3">{ingredient.function}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-inter font-semibold mb-6 text-primary border-b-2 border-primary pb-2">Step-by-Step Manufacturing Process</h2>
              <div className="space-y-4">
                {instructions.map((phase: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">{phase.phase}</h3>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                      {phase.steps.map((step: string, stepIndex: number) => (
                        <li key={stepIndex}>{step}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-inter font-semibold mb-6 text-primary border-b-2 border-primary pb-2">Product Usage Instructions & Application Guidelines</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <div 
                  className="text-sm text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formulation.usageInstructions
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                      .replace(/^\d+\.\s+\*\*(.*?)\*\*:/gm, '<h4 class="text-base font-semibold text-gray-900 mt-6 mb-3 border-b border-blue-200 pb-2">$1:</h4>')
                      .replace(/^   - (.*)$/gm, '<div class="ml-6 mb-2 text-gray-700">• $1</div>')
                      .replace(/^- (.*)$/gm, '<div class="ml-4 mb-2 text-gray-700">• $1</div>')
                      .replace(/\n\n+/g, '<div class="mb-4"></div>')
                      .replace(/\n/g, '<br>')
                  }}
                />
              </div>
            </div>

            {/* Required Equipment Section */}
            <div className="mb-8">
              <h2 className="text-xl font-inter font-semibold mb-6 text-primary border-b-2 border-primary pb-2">Required Manufacturing Equipment & Tools</h2>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="text-gray-700 leading-relaxed" data-testid="text-equipment">
                  {formulation.equipment || 'Standard mixing equipment, measuring instruments, pH meter, thermometer, safety equipment'}
                </p>
              </div>
            </div>

            {/* Safety Precautions Section */}
            <div className="mb-8">
              <h2 className="text-xl font-inter font-semibold mb-6 text-primary border-b-2 border-primary pb-2">Chemical Safety Precautions & Handling Guidelines</h2>
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Handling:</h3>
                    <p className="text-red-800 text-sm">Wear appropriate PPE including gloves, safety glasses, and lab coat.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">PPE Requirements:</h3>
                    <p className="text-red-800 text-sm">Chemical-resistant gloves, safety goggles, protective clothing.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Storage:</h3>
                    <p className="text-red-800 text-sm">Store in cool, dry place away from direct sunlight. Keep containers tightly closed.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Storage Conditions:</h3>
                    <p className="text-red-800 text-sm" data-testid="text-storage-conditions">
                      {formulation.storageConditions || 'Store at room temperature (15-25°C)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Packaging Notes Section */}
            <div className="mb-8">
              <h2 className="text-xl font-inter font-semibold mb-6 text-primary border-b-2 border-primary pb-2">Professional Packaging Requirements & Standards</h2>
              <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">Packaging:</h3>
                    <p className="text-amber-800 text-sm">Use chemically compatible containers (HDPE, glass, or PET).</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">Labeling:</h3>
                    <p className="text-amber-800 text-sm">Include product name, ingredients, usage instructions, and safety warnings.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">Certification:</h3>
                    <p className="text-amber-800 text-sm" data-testid="text-certification-details">
                      {formulation.certification || 'Follow applicable industry standards and regulations'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Scaling Note Section */}
            <div className="mb-8">
              <h2 className="text-xl font-inter font-semibold mb-6 text-primary border-b-2 border-primary pb-2">Production Scaling Guidelines & Considerations</h2>
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-2">Lab Scale:</h3>
                    <p className="text-purple-800 text-sm">This formulation is designed for laboratory testing and development.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-2">Pilot Scale:</h3>
                    <p className="text-purple-800 text-sm">For pilot production, scale proportionally and verify all parameters.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-2">Production Scale:</h3>
                    <p className="text-purple-800 text-sm">Consider equipment limitations, mixing efficiency, and process validation.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-2">Batch Size:</h3>
                    <p className="text-purple-800 text-sm" data-testid="text-batch-size-details">
                      Current formulation is optimized for {formulation.batchSize || 'laboratory scale'}.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-2">Scaling Factor:</h3>
                    <p className="text-purple-800 text-sm">Maintain ingredient ratios while adjusting processing parameters as needed.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-8">
              <Button 
                onClick={generatePDF}
                className="bg-primary text-white hover:bg-blue-700"
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
                className={`border-primary hover:bg-blue-50 ${
                  isFavorited 
                    ? 'bg-primary text-white hover:bg-blue-700' 
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

          </CardContent>
        </Card>
      </div>
      
      <SignInDialog 
        open={showSignInDialog}
        onOpenChange={setShowSignInDialog}
        title="Sign In to Download"
        description="Please sign in to download this formulation as a PDF report."
      />
    </div>
  );
}