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
  const { data: allFormulations = [] } = useQuery<Formulation[]>({
    queryKey: ["/api/formulations"],
  });

  // Set first category as default when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // Filter formulations by selected category and search query
  const filteredFormulations = selectedCategoryId
    ? allFormulations
        .filter((f) => f.categoryId === selectedCategoryId)
        .filter((f) =>
          searchQuery.trim() === ""
            ? true
            : f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              f.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : [];

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  if (categoriesLoading) {
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
        <div className="flex h-[calc(100vh-180px)] gap-6 p-4 sm:p-6 lg:p-8">
          {/* Left Sidebar - Categories */}
          <div className="w-full sm:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Categories
                </h2>
              </div>

              {/* Categories List */}
              <div className="flex-1 overflow-y-auto">
                <nav className="space-y-1 p-3">
                  {categories.map((category) => {
                    const formulationCount = allFormulations.filter(
                      (f) => f.categoryId === category.id
                    ).length;
                    const isSelected = selectedCategoryId === category.id;

                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setSearchQuery("");
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-between group ${
                          isSelected
                            ? "bg-primary text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        data-testid={`category-item-${category.id}`}
                      >
                        <div>
                          <p className={`font-medium text-sm line-clamp-2`}>{category.name}</p>
                          <p
                            className={`text-xs ${
                              isSelected ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {formulationCount} products
                          </p>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 flex-shrink-0 transition-transform ${
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
          <div className="flex-1 flex flex-col min-w-0">
            {selectedCategory && (
              <>
                {/* Category Header & Search */}
                <div className="mb-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 pr-4">
                    {filteredFormulations.map((formulation) => (
                      <Card
                        key={formulation.id}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 h-fit overflow-hidden hover:scale-[1.02]"
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
                              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                                <span className="text-2xl">🧪</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <CardContent className="p-4">
                          {/* Status Badge */}
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                              {formulation.name}
                            </h3>
                            <Badge
                              className={`ml-2 text-xs flex-shrink-0 ${
                                formulation.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {formulation.isActive ? "Active" : "Draft"}
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {formulation.description}
                          </p>

                          {/* Specs */}
                          <div className="space-y-2 mb-4 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">pH Level:</span>
                              <span className="font-medium text-gray-900">{formulation.phLevel}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Shelf Life:</span>
                              <span className="font-medium text-gray-900">
                                {formulation.shelfLife} months
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Batch Size:</span>
                              <span className="font-medium text-gray-900">{formulation.batchSize}</span>
                            </div>
                          </div>

                          {/* View Details Button */}
                          <Link href={`/formulation/${formulation.slug || formulation.id}`}>
                            <Button
                              className="w-full bg-primary text-white hover:bg-blue-700"
                              size="sm"
                              data-testid={`view-details-${formulation.id}`}
                            >
                              View Details
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
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
