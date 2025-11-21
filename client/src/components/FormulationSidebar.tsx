import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FormulationFeature } from "@shared/schema";

interface FormulationSidebarProps {
  formulationId: string;
}

export default function FormulationSidebar({ formulationId }: FormulationSidebarProps) {
  const [selectedFeature, setSelectedFeature] = useState<FormulationFeature | null>(null);

  const { data: features = [], isLoading } = useQuery<FormulationFeature[]>({
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
    <div className="flex gap-6">
      {/* Left Sidebar - Features List */}
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

      {/* Right Side - Feature Content */}
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
          </div>
        </div>
      )}
    </div>
  );
}
