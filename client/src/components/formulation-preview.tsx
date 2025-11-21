import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Formulation, FormulationContent } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface FormulationPreviewProps {
  formulation: Formulation;
  category?: { name: string };
  adminContent?: FormulationContent | null;
  isPublic?: boolean;
}

export default function FormulationPreview({ formulation, category, adminContent: initialAdminContent, isPublic = true }: FormulationPreviewProps) {
  // Fetch admin content for this formulation if it exists
  const { data: fetchedAdminContent } = useQuery<FormulationContent | null>({
    queryKey: ["/api/formulation-content", formulation.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/formulation-content/${formulation.id}`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Failed to fetch content");
        return await response.json();
      } catch (error) {
        return null;
      }
    },
    enabled: isPublic,
  });

  const adminContent = initialAdminContent || fetchedAdminContent;

  let ingredients: any[] = [];
  try {
    ingredients = typeof formulation.ingredients === 'string' 
      ? JSON.parse(formulation.ingredients) 
      : formulation.ingredients || [];
  } catch (error) {
    console.warn('Failed to parse ingredients:', error);
    ingredients = [];
  }

  let instructions: any[] = [];
  try {
    instructions = typeof formulation.instructions === 'string'
      ? JSON.parse(formulation.instructions)
      : formulation.instructions || [];
  } catch (error) {
    console.warn('Failed to parse instructions:', error);
    instructions = [];
  }

  return (
    <Card className="bg-white rounded-lg shadow-lg border border-gray-200" data-testid={`preview-formulation-${formulation.id}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-inter font-bold text-gray-900" data-testid={`text-formulation-name-${formulation.id}`}>{formulation.name}</h3>
          {!isPublic && (
            <Badge className={formulation.isActive ? "bg-green-600 text-white" : "bg-yellow-500 text-white"} data-testid={`badge-status-${formulation.id}`}>
              {formulation.isActive ? "Active Formula" : "Draft Formula"}
            </Badge>
          )}
        </div>

        {/* Enhanced Description */}
        <div className="mb-6">
          <p className="text-gray-600 leading-relaxed" data-testid={`text-description-${formulation.id}`}>{formulation.description}</p>
        </div>

        {/* Admin Custom Content - Display if available on public pages */}
        {isPublic && adminContent && (
          <div className="space-y-6">
            {adminContent.overviewContent && (
              <div>
                <h2 className="text-lg font-inter font-semibold mb-3 text-primary border-b-2 border-primary pb-2">
                  {adminContent.overviewTitle || "Overview"}
                </h2>
                <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: adminContent.overviewContent }} />
              </div>
            )}

            {adminContent.benefitsContent && (
              <div>
                <h2 className="text-lg font-inter font-semibold mb-3 text-primary border-b-2 border-primary pb-2">
                  {adminContent.benefitsTitle || "Key Benefits"}
                </h2>
                <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: adminContent.benefitsContent }} />
              </div>
            )}

            {adminContent.applicationsContent && (
              <div>
                <h2 className="text-lg font-inter font-semibold mb-3 text-primary border-b-2 border-primary pb-2">
                  {adminContent.applicationsTitle || "Applications"}
                </h2>
                <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: adminContent.applicationsContent }} />
              </div>
            )}

            {adminContent.usageContent && (
              <div>
                <h2 className="text-lg font-inter font-semibold mb-3 text-primary border-b-2 border-primary pb-2">
                  {adminContent.usageTitle || "Usage Instructions"}
                </h2>
                <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: adminContent.usageContent }} />
              </div>
            )}

            {adminContent.safetyContent && (
              <div>
                <h2 className="text-lg font-inter font-semibold mb-3 text-primary border-b-2 border-primary pb-2">
                  {adminContent.safetyTitle || "Safety Information"}
                </h2>
                <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: adminContent.safetyContent }} />
              </div>
            )}
          </div>
        )}

        {/* Professional Product Specifications Section - Hidden on public pages with admin content */}
        {(!isPublic || !adminContent) && (
          <div className="mb-6">
            <h2 className="text-lg font-inter font-semibold mb-4 text-primary border-b-2 border-primary pb-2">Professional Chemical Specifications</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Shelf Life & Storage */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <h3 className="text-md font-semibold text-blue-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Product Shelf Life & Storage
                </h3>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-blue-700 font-medium text-xs">Shelf Life</span>
                    <span className="text-blue-900 font-semibold" data-testid={`text-shelf-life-${formulation.id}`}>{formulation.shelfLife}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-blue-700 font-medium text-xs">Storage Conditions</span>
                    <span className="text-blue-900 text-sm leading-relaxed" data-testid={`text-storage-${formulation.id}`}>{formulation.storageConditions}</span>
                  </div>
                </div>
              </div>

              {/* Product Properties */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <h3 className="text-md font-semibold text-green-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Chemical Properties
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-700 font-medium text-xs">Product Type</span>
                    <span className="text-green-900 font-semibold text-sm" data-testid={`text-product-type-${formulation.id}`}>{category?.name || 'Formula'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 font-medium text-xs">pH Level</span>
                    <span className="text-green-900 font-semibold" data-testid={`text-ph-level-${formulation.id}`}>{formulation.phLevel || "—"}</span>
                  </div>
                  {formulation.viscosity && (
                    <div className="flex justify-between">
                      <span className="text-green-700 font-medium text-xs">Viscosity</span>
                      <span className="text-green-900 font-semibold text-sm" data-testid={`text-viscosity-${formulation.id}`}>{formulation.viscosity}</span>
                    </div>
                  )}
                  {formulation.certification && (
                    <div className="flex flex-col">
                      <span className="text-green-700 font-medium text-xs">Certification</span>
                      <span className="text-green-900 font-semibold text-xs" data-testid={`text-certification-${formulation.id}`}>{formulation.certification}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Production Details */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <h3 className="text-md font-semibold text-orange-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Manufacturing Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-orange-700 font-medium text-xs">Batch Size</span>
                    <span className="text-orange-900 font-semibold text-sm" data-testid={`text-batch-size-${formulation.id}`}>{formulation.batchSize || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700 font-medium text-xs">Processing Time</span>
                    <span className="text-orange-900 font-semibold text-sm" data-testid={`text-processing-time-${formulation.id}`}>{formulation.processingTime || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700 font-medium text-xs">Processing Temp</span>
                    <span className="text-orange-900 font-semibold text-sm" data-testid={`text-temperature-${formulation.id}`}>{formulation.temperature || "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-orange-700 font-medium text-xs">Equipment</span>
                    <span className="text-orange-900 text-xs" data-testid={`text-equipment-${formulation.id}`}>{formulation.equipment || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Ingredients Section - Hidden on public pages with admin content */}
        {(!isPublic || !adminContent) && (
          <div className="mb-6">
            <h2 className="text-lg font-inter font-semibold mb-4 text-primary border-b-2 border-primary pb-2">Ingredients & Manufacturing</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Ingredients List */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-md font-semibold text-purple-900 mb-3">INCI Ingredients ({ingredients.length})</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {ingredients.slice(0, 5).map((ingredient, index) => (
                    <div key={index} className="flex justify-between text-sm border-b border-purple-200 pb-1">
                      <span className="text-purple-700 font-medium">{ingredient.name || '—'}</span>
                      <span className="text-purple-900 font-semibold">{ingredient.percentage || '—'}</span>
                    </div>
                  ))}
                  {ingredients.length > 5 && (
                    <div className="text-center text-purple-600 text-xs">
                      +{ingredients.length - 5} more ingredients
                    </div>
                  )}
                </div>
              </div>

              {/* Manufacturing Process */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h3 className="text-md font-semibold text-indigo-900 mb-3">Manufacturing Process</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {instructions.slice(0, 3).map((instruction, index) => (
                    <div key={index} className="border-b border-indigo-200 pb-2">
                      <div className="text-indigo-800 font-medium text-sm">{instruction.phase || `Phase ${index + 1}`}</div>
                      <div className="text-indigo-600 text-xs">
                        {instruction.steps ? instruction.steps[0]?.substring(0, 60) || '—' : '—'}...
                      </div>
                    </div>
                  ))}
                  {instructions.length > 3 && (
                    <div className="text-center text-indigo-600 text-xs">
                      +{instructions.length - 3} more phases
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Instructions - Hidden on public pages with admin content */}
        {(!isPublic || !adminContent) && (
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-800 mb-2">Professional Usage</h2>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-700 text-sm" data-testid={`text-usage-${formulation.id}`}>
                {formulation.usageInstructions?.substring(0, 120) || "Professional usage instructions included"}...
              </p>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
