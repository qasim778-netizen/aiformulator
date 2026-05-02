import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle } from "lucide-react";

interface WizardCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface WizardProductType {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

interface WizardBaseType {
  id: string;
  name: string;
  slug: string;
}

interface FormData {
  category: string;
  productType: string;
  performanceLevel: string;
  baseType: string;
  productName: string;
  consistencyType: string;
  [key: string]: any;
}

interface Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  "paint-coatings": "🎨",
  "cleaning-products": "🧹",
  "personal-care": "💆",
  "industrial-chemicals": "🏭",
  "auto-care": "🚗",
  "pet-care": "🐾",
};

const PERFORMANCE_LEVELS = [
  {
    id: "Standard",
    label: "Standard",
    desc: "Reliable everyday quality",
    emoji: "⚙️",
    colors: { border: "border-gray-300", selected: "border-green-600 bg-green-600 text-white", hover: "hover:border-green-400" },
  },
  {
    id: "Premium",
    label: "Premium",
    desc: "High performance grade",
    emoji: "⭐",
    colors: { border: "border-gray-300", selected: "border-blue-600 bg-blue-600 text-white", hover: "hover:border-blue-400" },
  },
  {
    id: "Industrial Grade",
    label: "Industrial Grade",
    desc: "Maximum strength & durability",
    emoji: "🏗️",
    colors: { border: "border-gray-300", selected: "border-orange-600 bg-orange-600 text-white", hover: "hover:border-orange-400" },
  },
];

const BASE_TYPE_CONSISTENCY: Record<string, string> = {
  "water-based": "liquid",
  "solvent-based": "liquid",
  "solvent-less": "liquid",
  "oil-based": "liquid",
  "alcohol-based": "liquid",
  "concentrate": "liquid",
  "polymer-based": "liquid",
  "hybrid-other": "liquid",
  "powder-system": "powder",
  "wax-based": "cream",
  "natural-plant-based": "liquid",
  "alcohol-free": "liquid",
};

function getNameWarning(productName: string, productType: string): string | null {
  if (!productName || !productType || productName.length < 3) return null;
  const nameLower = productName.toLowerCase();
  const typeKeywords = productType.toLowerCase().split(/[\s&\/]+/).filter(kw => kw.length > 3);
  const hasMatch = typeKeywords.some(kw => nameLower.includes(kw));
  if (!hasMatch && typeKeywords.length > 0) {
    return `Consider a name that reflects "${productType}" — e.g., "Premium ${productType}" or "Advanced ${productType}"`;
  }
  return null;
}

export default function ProductTypeStep({ formData, updateFormData }: Props) {
  const [categorySlug, setCategorySlug] = useState("");

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<WizardCategory[]>({
    queryKey: ["/api/wizard/categories"],
  });

  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const cat = categories.find(c => c.name === formData.category);
      if (cat && cat.slug !== categorySlug) setCategorySlug(cat.slug);
    }
  }, [formData.category, categories]);

  const { data: productTypes = [], isLoading: typesLoading } = useQuery<WizardProductType[]>({
    queryKey: ["/api/wizard/product-types", categorySlug],
    queryFn: async () => {
      if (!categorySlug) return [];
      const res = await fetch(`/api/wizard/product-types?categorySlug=${categorySlug}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!categorySlug,
  });

  const { data: baseTypes = [], isLoading: baseTypesLoading } = useQuery<WizardBaseType[]>({
    queryKey: ["/api/wizard/base-types", categorySlug],
    queryFn: async () => {
      if (!categorySlug) return [];
      const res = await fetch(`/api/wizard/base-types?categorySlug=${categorySlug}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!categorySlug,
  });

  const handleCategorySelect = (cat: WizardCategory) => {
    setCategorySlug(cat.slug);
    updateFormData({ category: cat.name, productType: "", performanceLevel: "", baseType: "" });
  };

  const handleProductTypeSelect = (type: WizardProductType) => {
    updateFormData({ productType: type.name, baseType: "" });
  };

  const handlePerformanceSelect = (level: string) => {
    updateFormData({ performanceLevel: level });
  };

  const handleBaseTypeSelect = (type: WizardBaseType) => {
    updateFormData({
      baseType: type.name,
      consistencyType: BASE_TYPE_CONSISTENCY[type.slug] || "liquid",
    });
  };

  const nameWarning = getNameWarning(formData.productName, formData.productType);
  const isComplete =
    formData.category &&
    formData.productType &&
    formData.performanceLevel &&
    formData.baseType &&
    formData.productName.length >= 3;

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-[#1A2B4B] mb-1">Build Your Formulation</h2>
        <p className="text-[#6B7280] text-sm">Define your product step by step</p>
      </div>

      {/* ── 1. Category ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200">
        <Label className="text-base font-bold text-[#1A2B4B] mb-4 flex items-center">
          <span className="bg-blue-600 text-white w-7 h-7 rounded-full text-xs font-bold mr-3 flex items-center justify-center flex-shrink-0">1</span>
          Select Category <span className="text-red-500 ml-1">*</span>
        </Label>
        {categoriesLoading ? (
          <div className="flex items-center py-3 text-blue-600 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
            Loading categories...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map(cat => {
              const isSelected = formData.category === cat.name;
              const emoji = CATEGORY_EMOJIS[cat.slug] || "🔬";
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg scale-[1.02]"
                      : "border-gray-200 bg-white hover:border-blue-400"
                  }`}
                  data-testid={`category-${cat.slug}`}
                >
                  <div className={`text-2xl mb-2`}>{emoji}</div>
                  <p className={`text-sm font-semibold leading-tight ${isSelected ? "text-white" : "text-gray-800"}`}>
                    {cat.name}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. Product Type ──────────────────────────────────────────────── */}
      {formData.category && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200">
          <Label className="text-base font-bold text-[#1A2B4B] mb-4 flex items-center">
            <span className="bg-purple-600 text-white w-7 h-7 rounded-full text-xs font-bold mr-3 flex items-center justify-center flex-shrink-0">2</span>
            Select Product Type <span className="text-red-500 ml-1">*</span>
          </Label>
          {typesLoading ? (
            <div className="flex items-center py-3 text-purple-600 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2" />
              Loading product types...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {productTypes.map(type => {
                const isSelected = formData.productType === type.name;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleProductTypeSelect(type)}
                    className={`p-3 rounded-lg border-2 text-sm text-left transition-all duration-200 hover:shadow-sm ${
                      isSelected
                        ? "border-purple-600 bg-purple-600 text-white shadow-md"
                        : "border-gray-200 bg-white hover:border-purple-400 text-gray-700"
                    }`}
                    data-testid={`product-type-${type.slug}`}
                  >
                    <span className="font-medium">{type.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 3. Performance Level ────────────────────────────────────────── */}
      {formData.productType && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200">
          <Label className="text-base font-bold text-[#1A2B4B] mb-4 flex items-center">
            <span className="bg-green-600 text-white w-7 h-7 rounded-full text-xs font-bold mr-3 flex items-center justify-center flex-shrink-0">3</span>
            Choose Performance Level <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PERFORMANCE_LEVELS.map(level => {
              const isSelected = formData.performanceLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => handlePerformanceSelect(level.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? level.colors.selected
                      : `border-gray-200 bg-white ${level.colors.hover}`
                  }`}
                  data-testid={`performance-${level.id.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="text-xl mb-1">{level.emoji}</div>
                  <p className={`font-bold text-sm ${isSelected ? "" : "text-gray-900"}`}>{level.label}</p>
                  <p className={`text-xs mt-0.5 ${isSelected ? "opacity-80" : "text-gray-500"}`}>{level.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. Base Type ─────────────────────────────────────────────────── */}
      {formData.performanceLevel && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border-2 border-orange-200">
          <Label className="text-base font-bold text-[#1A2B4B] mb-4 flex items-center">
            <span className="bg-orange-500 text-white w-7 h-7 rounded-full text-xs font-bold mr-3 flex items-center justify-center flex-shrink-0">4</span>
            Select Base Type <span className="text-red-500 ml-1">*</span>
          </Label>
          {baseTypesLoading ? (
            <div className="flex items-center py-3 text-orange-600 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2" />
              Loading base types...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {baseTypes.map(type => {
                const isSelected = formData.baseType === type.name;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleBaseTypeSelect(type)}
                    className={`p-3 rounded-lg border-2 text-sm text-left transition-all duration-200 hover:shadow-sm ${
                      isSelected
                        ? "border-orange-500 bg-orange-500 text-white shadow-md"
                        : "border-gray-200 bg-white hover:border-orange-400 text-gray-700"
                    }`}
                    data-testid={`base-type-${type.slug}`}
                  >
                    <span className="font-medium">{type.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 5. Product Name ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-5 rounded-xl border-2 border-teal-200">
        <Label htmlFor="productName" className="text-base font-bold text-[#1A2B4B] mb-3 flex items-center">
          <span className="bg-teal-600 text-white w-7 h-7 rounded-full text-xs font-bold mr-3 flex items-center justify-center flex-shrink-0">5</span>
          Product Name <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="productName"
          type="text"
          placeholder='e.g., Premium Anti-Rust Metal Paint, Fast Drying Glass Cleaner'
          value={formData.productName}
          onChange={e => updateFormData({ productName: e.target.value })}
          maxLength={80}
          className="w-full h-12 border-2 border-teal-300 text-sm font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-200 bg-white rounded-lg"
          data-testid="input-product-name"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">Min 3 — Max 80 characters</p>
          <p className={`text-xs font-medium ${formData.productName.length > 70 ? "text-orange-600" : "text-gray-400"}`}>
            {formData.productName.length}/80
          </p>
        </div>
        {nameWarning && formData.productName.length >= 3 && (
          <div className="mt-2 flex items-start space-x-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">{nameWarning}</p>
          </div>
        )}
      </div>

      {/* ── Ready Summary ────────────────────────────────────────────────── */}
      {isComplete && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-5 shadow-lg">
          <div className="flex items-center mb-3">
            <CheckCircle className="h-5 w-5 mr-2" />
            <h4 className="font-bold text-base">Ready to continue!</h4>
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-sm opacity-90">
            <span>Category: <strong>{formData.category}</strong></span>
            <span>Type: <strong>{formData.productType}</strong></span>
            <span>Level: <strong>{formData.performanceLevel}</strong></span>
            <span>Base: <strong>{formData.baseType}</strong></span>
          </div>
          <p className="mt-2 text-sm opacity-90">Product: <strong>{formData.productName}</strong></p>
        </div>
      )}
    </div>
  );
}
