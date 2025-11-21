import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Category, Formulation } from "@shared/schema";

export default function Collection() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter formulations by selected category and search query
  const filteredFormulations = selectedCategoryId
    ? getFormulationsByCategory(selectedCategoryId)
        .filter((f) =>
          searchQuery.trim() === ""
            ? true
            : f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              f.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Formula Collection</h1>
          <p className="text-gray-600 mt-2">Browse professional chemical formulations by category</p>
        </div>

        {/* Main Content */}
        <div className="flex gap-6 p-4 sm:p-6 lg:p-8 flex-1 min-h-[calc(100vh-180px)]">
          {/* Left Sidebar - Categories */}
          <div className="w-full sm:w-72 flex-shrink-0">
            <div className="bg-gray-700 rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="p-5 border-b border-gray-600 bg-gray-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Categories
                </h2>
              </div>

              {/* Categories List */}
              <div className="flex-1 overflow-y-auto">
                <nav className="space-y-2 p-3">
                  {categories.map((category) => {
                    const formulationCount = getFormulationsByCategory(category.id).length;
                    const isSelected = selectedCategoryId === category.id;

                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setSearchQuery("");
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between group font-medium ${
                          isSelected
                            ? "bg-blue-500 text-white shadow-lg scale-105"
                            : "text-gray-100 hover:bg-gray-600 hover:text-white"
                        }`}
                        data-testid={`category-item-${category.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold line-clamp-2`}>{category.name}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isSelected ? "text-blue-100" : "text-gray-300"
                            }`}
                          >
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
                      <h2 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h2>
                      <p className="text-gray-600 mt-1">{selectedCategory.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      {filteredFormulations.length} items
                    </Badge>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search formulas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 py-2 w-full max-w-md"
                      data-testid="search-formulations-collection"
                    />
                  </div>
                </div>

                {/* Formulations Grid */}
                {filteredFormulations.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto auto-rows-max">
                    {filteredFormulations.map((formulation) => (
                      <div
                        key={formulation.id}
                        className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden hover:scale-105 hover:border-blue-300 h-72"
                        data-testid={`formula-card-${formulation.id}`}
                      >
                        {/* Card Image */}
                        {formulation.image ? (
                          <img
                            src={formulation.image}
                            alt={formulation.name}
                            className="w-full h-40 object-cover"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-14 h-14 bg-primary/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                                <span className="text-3xl">🧪</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="p-4 h-32 flex flex-col justify-between">
                          {/* Status Badge */}
                          <div className="flex items-start justify-between">
                            <h3 className="font-bold text-gray-900 line-clamp-2 flex-1 text-sm">
                              {formulation.name}
                            </h3>
                            <Badge
                              className={`ml-2 text-xs font-semibold flex-shrink-0 px-2 py-1 ${
                                formulation.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {formulation.isActive ? "Active" : "Draft"}
                            </Badge>
                          </div>

                          {/* View Details Button */}
                          <Link href={`/formulation/${formulation.slug || formulation.id}`}>
                            <Button
                              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 h-9 text-sm font-semibold rounded-lg transition-all"
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
                      <p className="text-lg text-gray-600 mb-2">No formulas found</p>
                      <p className="text-sm text-gray-500">
                        {searchQuery
                          ? `Try adjusting your search for "${searchQuery}"`
                          : "No formulas available in this category"}
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
