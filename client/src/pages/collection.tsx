import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearch } from "wouter";
import { ChevronRight, Filter, Zap, ArrowRight } from "lucide-react";
import Breadcrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import type { Category, Formulation } from "@shared/schema";

function CategorySkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white animate-pulse">
      <div className="w-full h-48 bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-9 bg-gray-100 rounded-full mt-3" />
      </div>
    </div>
  );
}

export default function Collection() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchString = useSearch();

  const urlCategorySlug = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("category");
  }, [searchString]);

  useEffect(() => {
    document.title = "Chemical Formulation Collections by Category | AI Formulator";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Browse professional chemical formulation collections across multiple product categories.');
    }
  }, []);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allFormulations = [], isLoading: formulationsLoading } = useQuery<Formulation[]>({
    queryKey: ["/api/formulations"],
  });

  // Count formulations per category once — O(n) instead of O(n×m)
  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of allFormulations) {
      if (f.categoryId) {
        map[String(f.categoryId)] = (map[String(f.categoryId)] || 0) + 1;
      }
    }
    return map;
  }, [allFormulations]);

  // Sort categories by product count (highest first)
  const sortedCategories = useMemo(() => {
    return [...categories].sort(
      (a, b) => (countByCategory[b.id] || 0) - (countByCategory[a.id] || 0)
    );
  }, [categories, countByCategory]);

  // Select category from URL param, otherwise auto-select the first (most populated)
  useEffect(() => {
    if (sortedCategories.length === 0) return;
    if (urlCategorySlug) {
      const matched = sortedCategories.find((c) => c.slug === urlCategorySlug);
      if (matched) {
        setSelectedCategoryId(matched.id);
        return;
      }
    }
    if (!selectedCategoryId) {
      setSelectedCategoryId(sortedCategories[0].id);
    }
  }, [sortedCategories, urlCategorySlug]);

  const filteredFormulations = useMemo(() => {
    if (!selectedCategoryId) return [];
    return allFormulations.filter(
      (f) => String(f.categoryId) === String(selectedCategoryId)
    );
  }, [allFormulations, selectedCategoryId]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F5F2" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b py-6 px-4 sm:px-6 lg:px-8" style={{ borderColor: "#E3E3E3" }}>
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Collections" }]} />
          <h1 className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>
            Chemical Formulation Collections by Category
          </h1>
          <p className="mt-2" style={{ color: "#4A4A4A" }}>
            Browse professional chemical formulations by category
          </p>
        </div>

        {/* Main Content */}
        <div className="flex gap-6 p-6 sm:p-6 lg:p-8">
          {/* Left Sidebar - Categories */}
          <div className="w-full sm:w-72 flex-shrink-0">
            <div
              className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col sticky top-4"
              style={{ borderRight: "1px solid #E3E3E3", maxHeight: "calc(100vh - 2rem)" }}
            >
              <div className="p-5 border-b" style={{ borderColor: "#E3E3E3" }}>
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                  <Filter className="h-5 w-5" />
                  Categories
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto bg-white">
                {categoriesLoading ? (
                  <CategorySkeleton />
                ) : (
                  <nav className="space-y-2 p-3">
                    {sortedCategories.map((category) => {
                      const formulationCount = countByCategory[category.id] || 0;
                      const isSelected = selectedCategoryId === category.id;
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between font-medium ${
                            isSelected ? "text-white shadow-md" : "hover:shadow-sm"
                          }`}
                          style={
                            isSelected
                              ? { backgroundColor: "#0D9488", color: "#FFFFFF" }
                              : { color: "#1A1A1A", backgroundColor: "transparent" }
                          }
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "#EEF3FF";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold line-clamp-2">{category.name}</p>
                            <p className="text-xs mt-1" style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "#4A4A4A" }}>
                              {formulationCount} product{formulationCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <ChevronRight
                            className={`h-5 w-5 flex-shrink-0 transition-transform ml-2 ${isSelected ? "translate-x-1" : ""}`}
                          />
                        </button>
                      );
                    })}
                  </nav>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Formulations Grid */}
          <div ref={contentRef} className="flex-1 flex flex-col min-w-0">
            {/* Category header — show as soon as category is selected */}
            {selectedCategory && (
              <div className="mb-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>
                      {selectedCategory.name}
                    </h2>
                    <p className="mt-1" style={{ color: "#4A4A4A" }}>
                      {selectedCategory.description}
                    </p>
                  </div>
                  {!formulationsLoading && (
                    <div
                      className="px-3 py-1 rounded-md text-sm font-medium"
                      style={{ backgroundColor: "#FFFFFF", border: "1px solid #E4E4E4", color: "#1A1A1A" }}
                    >
                      {filteredFormulations.length} items
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TOP CTA */}
            <a href="/#ai-formulator" className="block mb-6 flex-shrink-0 rounded-2xl overflow-hidden group" style={{ textDecoration: "none" }}>
              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 rounded-2xl" style={{ background: "linear-gradient(135deg, #0D9488 0%, #059669 100%)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-base sm:text-lg leading-tight">Generate Your Custom Formula Instantly</p>
                    <p className="text-teal-100 text-xs sm:text-sm mt-0.5">AI-powered — get a professional formulation in seconds</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold text-sm px-5 py-2.5 rounded-full shadow group-hover:bg-teal-50 transition-colors">
                    Start Now <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </a>

            {/* Skeleton cards while formulations are loading */}
            {formulationsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : filteredFormulations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFormulations.map((formulation) => (
                  <div
                    key={formulation.id}
                    className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #FFFFFF 0%, #F0F4FF 100%)",
                      border: "1px solid #E4E9F8",
                    }}
                  >
                    {(formulation.thumbnail || formulation.image) ? (
                      <img
                        src={(formulation.thumbnail || formulation.image) ?? undefined}
                        alt={formulation.name}
                        loading="lazy"
                        className="w-full h-48 object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center" style={{ backgroundColor: "#F0F4FF" }}>
                        <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: "#FFFFFF", border: "1px solid #DDE6FF" }}>
                          <span className="text-3xl">🧪</span>
                        </div>
                      </div>
                    )}

                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {formulation.isActive && (
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-green-600 font-medium">Active</span>
                          </div>
                        )}
                      </div>

                      <h3 className="font-bold line-clamp-2 text-sm mb-3" style={{ color: "#1A1A1A" }}>
                        {formulation.name}
                      </h3>

                      <a
                        href={`/formulation/${formulation.slug || formulation.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          className="w-full text-white h-9 text-sm font-semibold rounded-full transition-all hover:opacity-90"
                          style={{ backgroundColor: "#0D9488" }}
                          size="sm"
                        >
                          View Details
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedCategory ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg mb-2" style={{ color: "#4A4A4A" }}>No formulas found</p>
                  <p className="text-sm" style={{ color: "#6A6A6A" }}>
                    No formulas available in this category
                  </p>
                </div>
              </div>
            ) : null}

            {/* BOTTOM CTA */}
            {!formulationsLoading && (
              <a href="/#ai-formulator" className="block mt-8 flex-shrink-0 rounded-2xl overflow-hidden group" style={{ textDecoration: "none" }}>
                <div className="relative flex flex-col items-center text-center gap-4 px-6 py-8 rounded-2xl" style={{ background: "linear-gradient(135deg, #134E4A 0%, #0D9488 100%)" }}>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-extrabold text-xl sm:text-2xl leading-tight">Generate Your Custom Formula Instantly</p>
                    <p className="text-teal-200 text-sm sm:text-base mt-2 max-w-md mx-auto">
                      Can't find exactly what you need? Our AI creates a professional-grade formulation tailored to your product in seconds.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold text-sm px-6 py-3 rounded-full shadow-lg group-hover:bg-teal-50 transition-colors">
                    Generate My Formula <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
