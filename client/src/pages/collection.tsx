import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Category, Formulation } from "@shared/schema";

export default function Collection() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Fetch all categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch all formulations
  const { data: allFormulations = [], isLoading: formulationsLoading } = useQuery<Formulation[]>({
    queryKey: ["/api/formulations"],
  });

  // Set first category as default when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories]);

  // Get formulations for selected category
  const getFormulationsByCategory = (categoryId: string) => {
    return allFormulations.filter((f) => {
      // Handle both direct match and string comparison in case of type mismatches
      return String(f.categoryId) === String(categoryId);
    });
  };

  // Filter formulations by selected category
  const filteredFormulations = selectedCategoryId
    ? getFormulationsByCategory(selectedCategoryId)
    : [];

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  if (categoriesLoading || formulationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F5F2" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b py-6 px-4 sm:px-6 lg:px-8" style={{ borderColor: "#E3E3E3" }}>
          <h1 className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>Formula Collection</h1>
          <p className="mt-2" style={{ color: "#4A4A4A" }}>Browse professional chemical formulations by category</p>
        </div>

        {/* Main Content */}
        <div className="flex gap-6 p-6 sm:p-6 lg:p-8 flex-1 min-h-[calc(100vh-180px)]">
          {/* Left Sidebar - Categories */}
          <div className="w-full sm:w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col" style={{ borderRight: "1px solid #E3E3E3" }}>
              {/* Sidebar Header */}
              <div className="p-5 border-b" style={{ borderColor: "#E3E3E3", backgroundColor: "#FFFFFF" }}>
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                  <Filter className="h-5 w-5" />
                  Categories
                </h2>
              </div>

              {/* Categories List */}
              <div className="flex-1 overflow-y-auto bg-white">
                <nav className="space-y-2 p-3">
                  {categories.map((category) => {
                    const formulationCount = getFormulationsByCategory(category.id).length;
                    const isSelected = selectedCategoryId === category.id;

                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between group font-medium ${
                          isSelected
                            ? "text-white shadow-md"
                            : "hover:shadow-sm"
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: "#2458F6", color: "#FFFFFF" }
                            : { color: "#1A1A1A", backgroundColor: "transparent" }
                        }
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = "#EEF3FF";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }
                        }}
                        data-testid={`category-item-${category.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold line-clamp-2">{category.name}</p>
                          <p className="text-xs mt-1" style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "#4A4A4A" }}>
                            {formulationCount} product{formulationCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ChevronRight
                          className={`h-5 w-5 flex-shrink-0 transition-transform ml-2 ${
                            isSelected ? "translate-x-1" : ""
                          }`}
                        />
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Right Side - Formulations Grid */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {selectedCategory && (
              <>
                {/* Category Header & Search */}
                <div className="mb-6 flex-shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>{selectedCategory.name}</h2>
                      <p className="mt-1" style={{ color: "#4A4A4A" }}>{selectedCategory.description}</p>
                    </div>
                    <div className="px-3 py-1 rounded-md text-sm font-medium" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E4E4E4", color: "#1A1A1A" }}>
                      {filteredFormulations.length} items
                    </div>
                  </div>

                </div>

                {/* Formulations Grid */}
                {filteredFormulations.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto auto-rows-max">
                    {filteredFormulations.map((formulation) => (
                      <div
                        key={formulation.id}
                        className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden h-72"
                        style={{ 
                          background: "linear-gradient(135deg, #FFFFFF 0%, #F0F4FF 100%)",
                          border: "1px solid #E4E9F8"
                        }}
                        data-testid={`formula-card-${formulation.id}`}
                      >
                        {/* Card Image */}
                        {formulation.image ? (
                          <div className="w-full h-40 flex items-center justify-center" style={{ backgroundColor: "#F0F4FF" }}>
                            <img
                              src={formulation.image}
                              alt={formulation.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-40 flex items-center justify-center" style={{ backgroundColor: "#F0F4FF" }}>
                            <div className="text-center">
                              <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: "#FFFFFF", border: "1px solid #DDE6FF" }}>
                                <span className="text-3xl">🧪</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="p-4 h-32 flex flex-col justify-between">
                          {/* Status Badge */}
                          <div className="flex items-start justify-between">
                            <h3 className="font-bold line-clamp-2 flex-1 text-sm" style={{ color: "#1A1A1A" }}>
                              {formulation.name}
                            </h3>
                            <div
                              className="ml-2 text-xs font-semibold flex-shrink-0 px-2 py-1 rounded-md"
                              style={
                                formulation.isActive
                                  ? { backgroundColor: "#D7FAD7", color: "#1A7B1A" }
                                  : { backgroundColor: "#FEF3C7", color: "#92400E" }
                              }
                            >
                              {formulation.isActive ? "Active" : "Draft"}
                            </div>
                          </div>

                          {/* View Details Button */}
                          <Link href={`/formulation/${formulation.slug || formulation.id}`}>
                            <Button
                              className="w-full text-white h-9 text-sm font-semibold rounded-full transition-all hover:opacity-90"
                              style={{ backgroundColor: "#2458F6" }}
                              size="sm"
                              data-testid={`view-details-${formulation.id}`}
                            >
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg mb-2" style={{ color: "#4A4A4A" }}>No formulas found</p>
                      <p className="text-sm" style={{ color: "#6A6A6A" }}>
                        No formulas available in this category
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
