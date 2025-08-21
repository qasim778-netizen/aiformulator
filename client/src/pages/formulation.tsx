import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Download, Printer, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Formulation, Category } from "@shared/schema";

export default function FormulationPage() {
  const params = useParams();
  const formulationId = params.id;

  const { data: formulation, isLoading: formulationLoading } = useQuery<Formulation>({
    queryKey: ["/api/formulations", formulationId],
  });

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories", formulation?.categoryId],
    enabled: !!formulation?.categoryId,
  });

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
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  {formulation.usageInstructions}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button className="bg-primary text-white hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button className="bg-accent text-white hover:bg-orange-600">
                <Printer className="h-4 w-4 mr-2" />
                Printer Formula
              </Button>
              <Button variant="outline" className="border-primary text-primary hover:bg-blue-50">
                <Bookmark className="h-4 w-4 mr-2" />
                Save to Favorites
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
