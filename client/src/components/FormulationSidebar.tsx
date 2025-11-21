import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Printer, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormulationSidebarProps {
  formulationId: string;
  onGeneratePDF?: () => void;
  onPrint?: () => void;
  onToggleFavorite?: () => void;
  isFavorited?: boolean;
}

export default function FormulationSidebar({ 
  formulationId, 
  onGeneratePDF, 
  onPrint, 
  onToggleFavorite,
  isFavorited = false
}: FormulationSidebarProps) {
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  const { data: features = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/formulations/${formulationId}/features`],
  });

  if (isLoading) {
    return (
      <div className="w-64 bg-gray-50 p-4 rounded-lg">
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (features.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-6 flex-row-reverse">
      {/* Right Sidebar - Features List */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow border border-gray-200 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-sm">Formula Details</h3>
          </div>
          <nav className="space-y-1 p-3">
            {features
              .sort((a, b) => a.featureOrder - b.featureOrder)
              .map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => setSelectedFeature(feature)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedFeature?.id === feature.id
                      ? "bg-blue-100 text-blue-900 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  data-testid={`feature-item-${feature.id}`}
                >
                  {feature.featureName}
                </button>
              ))}
          </nav>
        </div>
      </div>

      {/* Left Side - Feature Content */}
      {selectedFeature && (
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedFeature.featureName}</h2>
            {selectedFeature.featureContent ? (
              <div className="prose prose-sm max-w-none">
                {selectedFeature.featureContent.startsWith("http") ? (
                  <img
                    src={selectedFeature.featureContent}
                    alt={selectedFeature.featureName}
                    className="max-w-full h-auto rounded"
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-gray-700">
                    {selectedFeature.featureContent}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No content available for this feature.</p>
            )}
            
            {/* Action Buttons Below Content */}
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200">
              {onGeneratePDF && (
                <Button 
                  onClick={onGeneratePDF}
                  className="bg-primary text-white hover:bg-blue-700"
                  data-testid="button-download-pdf"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              )}
              {onPrint && (
                <Button 
                  onClick={onPrint}
                  className="bg-accent text-white hover:bg-orange-600"
                  data-testid="button-print-formula"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Formula
                </Button>
              )}
              {onToggleFavorite && (
                <Button 
                  onClick={onToggleFavorite}
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
