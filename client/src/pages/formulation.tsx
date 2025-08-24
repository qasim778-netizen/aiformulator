import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Download, Printer, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import type { Formulation, Category } from "@shared/schema";
import cleaningProductsGuide from "@/assets/generated-images/cleaning-products-guide.png";
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

  // PDF Generation function
  const generatePDF = useCallback(() => {
    if (!formulation) return;
    
    try {
      const ingredients = JSON.parse(formulation.ingredients);
      const instructions = JSON.parse(formulation.instructions);
      
      const content = `
CHEMICAL FORMULATION REPORT
==========================

Product Name: ${formulation.name}
Category: ${category?.name || 'Unknown'}
pH Level: ${formulation.phLevel}
Batch Size: ${formulation.batchSize}
Shelf Life: ${formulation.shelfLife}
Processing Time: ${formulation.processingTime}
Temperature: ${formulation.temperature}
Equipment: ${formulation.equipment}
Storage: ${formulation.storageConditions}
${formulation.viscosity ? `Viscosity: ${formulation.viscosity}` : ''}
${formulation.certification ? `Certification: ${formulation.certification}` : ''}

DESCRIPTION:
${formulation.description}

INGREDIENTS:
${ingredients.map((ing: any, index: number) => 
  `${index + 1}. ${ing.name} (${ing.inci}) - ${ing.percentage} - ${ing.function}`
).join('\n')}

MANUFACTURING INSTRUCTIONS:
${instructions.map((phase: any, index: number) => 
  `${index + 1}. ${phase.phase}:\n${phase.steps.map((step: string, stepIndex: number) => 
    `   ${stepIndex + 1}. ${step}`
  ).join('\n')}`
).join('\n\n')}

USAGE INSTRUCTIONS:
${formulation.usageInstructions}

Generated on: ${new Date().toLocaleDateString()}
`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formulation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_formulation.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "File Downloaded",
        description: `Formulation report for ${formulation.name} has been downloaded.`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the formulation report. Please try again.",
        variant: "destructive"
      });
    }
  }, [formulation, category, toast]);

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

  const ingredients = JSON.parse(formulation.ingredients);
  const instructions = JSON.parse(formulation.instructions);

  return (
    <div className="bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <Link href={`/category/${formulation.categoryId}`}>
            <Button variant="ghost" className="text-primary hover:text-blue-700 mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {category?.name || 'Category'}
            </Button>
          </Link>
        </div>
        
        <Card className="bg-white rounded-lg shadow-lg border border-gray-200">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-inter font-bold text-gray-900">{formulation.name}</h1>
              <Badge className={formulation.isActive ? "bg-success text-white" : "bg-yellow-500 text-white"}>
                {formulation.isActive ? "Active Formula" : "Draft Formula"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-inter font-semibold mb-4">Product Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Product Type:</span>
                    <span className="font-medium">{category?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">pH Level:</span>
                    <span className="font-medium">{formulation.phLevel}</span>
                  </div>
                  {formulation.viscosity && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Viscosity:</span>
                      <span className="font-medium">{formulation.viscosity}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Shelf Life:</span>
                    <span className="font-medium">{formulation.shelfLife}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Storage:</span>
                    <span className="font-medium">{formulation.storageConditions}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-inter font-semibold mb-4">Production Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Batch Size:</span>
                    <span className="font-medium">{formulation.batchSize}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Processing Time:</span>
                    <span className="font-medium">{formulation.processingTime}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Temperature:</span>
                    <span className="font-medium">{formulation.temperature}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Equipment:</span>
                    <span className="font-medium">{formulation.equipment}</span>
                  </div>
                  {formulation.certification && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Certification:</span>
                      <span className="font-medium">{formulation.certification}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Images for All Cleaning Products */}
            {category?.name === "Cleaning Products" && (
              <div className="mb-8">
                <h3 className="text-lg font-inter font-semibold mb-4">Product Formulation</h3>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
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
                  {/* Fallback image for any products that don't match specific categories */}
                  {!formulation.name.includes("Wood Floor") && 
                   !formulation.name.includes("Glass") && 
                   !formulation.name.includes("Bathroom") &&
                   !formulation.name.includes("Degreaser") &&
                   !formulation.name.includes("All-Purpose") &&
                   !formulation.name.includes("Refrigerator") &&
                   !formulation.name.includes("Carpet") &&
                   !formulation.name.includes("Upholstery") &&
                   !formulation.name.includes("Tile") &&
                   !formulation.name.includes("Grout") &&
                   !formulation.name.includes("Microwave") &&
                   !formulation.name.includes("Appliance") &&
                   !formulation.name.includes("Pet-Safe Floor") &&
                   !formulation.name.includes("Oven") &&
                   !formulation.name.includes("Grill") &&
                   !formulation.name.includes("Wood Surface") &&
                   !formulation.name.includes("Eco-Friendly") &&
                   !formulation.name.includes("Biodegradable") &&
                   !formulation.name.includes("Concentrated") && (
                    <img 
                      src={cleaningProductsGuide} 
                      alt="Professional Cleaning Products manufacturing guide - Complete chemical formulation with ingredients, procedures, and quality control specifications"
                      className="w-full max-w-sm mx-auto rounded-lg"
                      data-testid="img-formulation-guide"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-lg font-inter font-semibold mb-4">Product Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {formulation.description}
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-inter font-semibold mb-4">Ingredients List</h3>
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
              <h3 className="text-lg font-inter font-semibold mb-4">Manufacturing Instructions</h3>
              <div className="space-y-4">
                {instructions.map((phase: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">{phase.phase}</h4>
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
              <h3 className="text-lg font-inter font-semibold mb-4">Usage Instructions</h3>
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

            <div className="flex flex-wrap gap-4">
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
    </div>
  );
}