import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// ── Static fallback data ─────────────────────────────────────────────────────
// Always available regardless of DB state, ensuring the wizard never gets stuck.

const STATIC_CATEGORIES: WizardCategory[] = [
  { id: "paint-coatings",       name: "Paint & Coatings",     slug: "paint-coatings",       icon: null },
  { id: "cleaning-products",    name: "Cleaning Products",    slug: "cleaning-products",    icon: null },
  { id: "personal-care",        name: "Personal Care",        slug: "personal-care",        icon: null },
  { id: "industrial-chemicals", name: "Industrial Chemicals", slug: "industrial-chemicals", icon: null },
  { id: "auto-care",            name: "Auto Care",            slug: "auto-care",            icon: null },
  { id: "pet-care",             name: "Pet Care",             slug: "pet-care",             icon: null },
];

const STATIC_PRODUCT_TYPES: Record<string, WizardProductType[]> = {
  "paint-coatings": [
    { id: "iw",  name: "Interior Wall Paint",   slug: "interior-wall-paint",   categoryId: "paint-coatings" },
    { id: "ex",  name: "Exterior Paint",        slug: "exterior-paint",        categoryId: "paint-coatings" },
    { id: "ar",  name: "Anti-Rust Metal Paint", slug: "anti-rust-metal-paint", categoryId: "paint-coatings" },
    { id: "wc",  name: "Wood Coating",          slug: "wood-coating",          categoryId: "paint-coatings" },
    { id: "fp",  name: "Floor Paint",           slug: "floor-paint",           categoryId: "paint-coatings" },
    { id: "pco", name: "Powder Coating",        slug: "powder-coating",        categoryId: "paint-coatings" },
    { id: "pr",  name: "Primer",                slug: "primer",                categoryId: "paint-coatings" },
    { id: "vr",  name: "Varnish",               slug: "varnish",               categoryId: "paint-coatings" },
  ],
  "cleaning-products": [
    { id: "apc",  name: "All Purpose Cleaner",        slug: "all-purpose-cleaner",       categoryId: "cleaning-products" },
    { id: "gc",   name: "Glass Cleaner",              slug: "glass-cleaner",             categoryId: "cleaning-products" },
    { id: "fc",   name: "Floor Cleaner",              slug: "floor-cleaner",             categoryId: "cleaning-products" },
    { id: "kc",   name: "Kitchen Cleaner",            slug: "kitchen-cleaner",           categoryId: "cleaning-products" },
    { id: "bc",   name: "Bathroom Cleaner",           slug: "bathroom-cleaner",          categoryId: "cleaning-products" },
    { id: "dis",  name: "Disinfectant",               slug: "disinfectant",              categoryId: "cleaning-products" },
    { id: "deg",  name: "Degreaser",                  slug: "degreaser",                 categoryId: "cleaning-products" },
    { id: "tbc",  name: "Toilet Bowl Cleaner",        slug: "toilet-bowl-cleaner",       categoryId: "cleaning-products" },
    { id: "cuc",  name: "Carpet & Upholstery Cleaner",slug: "carpet-upholstery-cleaner", categoryId: "cleaning-products" },
    { id: "ccl",  name: "Custom Cleaner",             slug: "custom-cleaner",            categoryId: "cleaning-products" },
  ],
  "personal-care": [
    { id: "sh",  name: "Shampoo",          slug: "shampoo",          categoryId: "personal-care" },
    { id: "co",  name: "Conditioner",      slug: "conditioner",      categoryId: "personal-care" },
    { id: "bl",  name: "Body Lotion",      slug: "body-lotion",      categoryId: "personal-care" },
    { id: "fm",  name: "Face Moisturizer", slug: "face-moisturizer", categoryId: "personal-care" },
    { id: "fw",  name: "Face Wash",        slug: "face-wash",        categoryId: "personal-care" },
    { id: "sun", name: "Sunscreen",        slug: "sunscreen",        categoryId: "personal-care" },
    { id: "bw",  name: "Body Wash",        slug: "body-wash",        categoryId: "personal-care" },
    { id: "deo", name: "Deodorant",        slug: "deodorant",        categoryId: "personal-care" },
    { id: "hs",  name: "Hair Serum",       slug: "hair-serum",       categoryId: "personal-care" },
    { id: "lb",  name: "Lip Balm",         slug: "lip-balm",         categoryId: "personal-care" },
  ],
  "industrial-chemicals": [
    { id: "sc",  name: "Solvent Cleaner",    slug: "solvent-cleaner",    categoryId: "industrial-chemicals" },
    { id: "ri",  name: "Rust Inhibitor",     slug: "rust-inhibitor",     categoryId: "industrial-chemicals" },
    { id: "ia",  name: "Industrial Adhesive",slug: "industrial-adhesive",categoryId: "industrial-chemicals" },
    { id: "lub", name: "Lubricant",          slug: "lubricant",          categoryId: "industrial-chemicals" },
    { id: "cf",  name: "Cutting Fluid",      slug: "cutting-fluid",      categoryId: "industrial-chemicals" },
    { id: "cs",  name: "Concrete Sealer",    slug: "concrete-sealer",    categoryId: "industrial-chemicals" },
    { id: "ec",  name: "Epoxy Coating",      slug: "epoxy-coating",      categoryId: "industrial-chemicals" },
    { id: "pha", name: "pH Adjuster",        slug: "ph-adjuster",        categoryId: "industrial-chemicals" },
  ],
  "auto-care": [
    { id: "cws", name: "Car Wash Shampoo",    slug: "car-wash-shampoo",    categoryId: "auto-care" },
    { id: "whl", name: "Wheel Cleaner",       slug: "wheel-cleaner",       categoryId: "auto-care" },
    { id: "dp",  name: "Dashboard Polish",    slug: "dashboard-polish",    categoryId: "auto-care" },
    { id: "ws",  name: "Wax & Sealant",       slug: "wax-sealant",         categoryId: "auto-care" },
    { id: "ed",  name: "Engine Degreaser",    slug: "engine-degreaser",    categoryId: "auto-care" },
    { id: "td",  name: "Tire Dressing",       slug: "tire-dressing",       categoryId: "auto-care" },
    { id: "gt",  name: "Glass Treatment",     slug: "glass-treatment",     categoryId: "auto-care" },
    { id: "psr", name: "Paint Scratch Remover",slug: "paint-scratch-remover",categoryId: "auto-care" },
  ],
  "pet-care": [
    { id: "ps",  name: "Pet Shampoo",         slug: "pet-shampoo",         categoryId: "pet-care" },
    { id: "pco", name: "Pet Conditioner",     slug: "pet-conditioner",     categoryId: "pet-care" },
    { id: "poe", name: "Pet Odor Eliminator", slug: "pet-odor-eliminator", categoryId: "pet-care" },
    { id: "ft",  name: "Flea & Tick Treatment",slug: "flea-tick-treatment",categoryId: "pet-care" },
    { id: "pss", name: "Pet Skin Spray",      slug: "pet-skin-spray",      categoryId: "pet-care" },
    { id: "pdr", name: "Pet Dental Rinse",    slug: "pet-dental-rinse",    categoryId: "pet-care" },
  ],
};

const STATIC_BASE_TYPES: Record<string, WizardBaseType[]> = {
  "paint-coatings":       [
    { id: "wb", name: "Water-Based",   slug: "water-based"   },
    { id: "sb", name: "Solvent-Based", slug: "solvent-based" },
    { id: "ps", name: "Powder System", slug: "powder-system" },
    { id: "ho", name: "Hybrid / Other",slug: "hybrid-other"  },
  ],
  "cleaning-products":    [
    { id: "wb", name: "Water-Based",   slug: "water-based"   },
    { id: "sb", name: "Solvent-Based", slug: "solvent-based" },
    { id: "sl", name: "Solvent-Less",  slug: "solvent-less"  },
    { id: "co", name: "Concentrate",   slug: "concentrate"   },
    { id: "ho", name: "Hybrid / Other",slug: "hybrid-other"  },
  ],
  "personal-care":        [
    { id: "wb",  name: "Water-Based",           slug: "water-based"        },
    { id: "ob",  name: "Oil-Based",             slug: "oil-based"          },
    { id: "ab",  name: "Alcohol-Based",         slug: "alcohol-based"      },
    { id: "npb", name: "Natural / Plant-Based", slug: "natural-plant-based"},
    { id: "af",  name: "Alcohol-Free",          slug: "alcohol-free"       },
    { id: "ho",  name: "Hybrid / Other",        slug: "hybrid-other"       },
  ],
  "industrial-chemicals": [
    { id: "wb", name: "Water-Based",   slug: "water-based"   },
    { id: "sb", name: "Solvent-Based", slug: "solvent-based" },
    { id: "ob", name: "Oil-Based",     slug: "oil-based"     },
    { id: "co", name: "Concentrate",   slug: "concentrate"   },
  ],
  "auto-care":            [
    { id: "wb",   name: "Water-Based",   slug: "water-based"   },
    { id: "sb",   name: "Solvent-Based", slug: "solvent-based" },
    { id: "pb",   name: "Polymer-Based", slug: "polymer-based" },
    { id: "waxb", name: "Wax-Based",     slug: "wax-based"     },
  ],
  "pet-care":             [
    { id: "wb",  name: "Water-Based",           slug: "water-based"        },
    { id: "npb", name: "Natural / Plant-Based", slug: "natural-plant-based"},
    { id: "af",  name: "Alcohol-Free",          slug: "alcohol-free"       },
  ],
};

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_EMOJIS: Record<string, string> = {
  "paint-coatings":       "🎨",
  "cleaning-products":    "🧹",
  "personal-care":        "💆",
  "industrial-chemicals": "🏭",
  "auto-care":            "🚗",
  "pet-care":             "🐾",
};

const PERFORMANCE_LEVELS = [
  {
    id: "Standard",
    label: "Standard",
    desc: "Reliable everyday quality",
    emoji: "⚙️",
    colors: { selected: "border-green-600 bg-green-600 text-white", hover: "hover:border-green-400" },
  },
  {
    id: "Premium",
    label: "Premium",
    desc: "High performance grade",
    emoji: "⭐",
    colors: { selected: "border-blue-600 bg-blue-600 text-white", hover: "hover:border-blue-400" },
  },
  {
    id: "Industrial Grade",
    label: "Industrial Grade",
    desc: "Maximum strength & durability",
    emoji: "🏗️",
    colors: { selected: "border-orange-600 bg-orange-600 text-white", hover: "hover:border-orange-400" },
  },
];

const BASE_TYPE_CONSISTENCY: Record<string, string> = {
  "water-based":        "liquid",
  "solvent-based":      "liquid",
  "solvent-less":       "liquid",
  "oil-based":          "liquid",
  "alcohol-based":      "liquid",
  "concentrate":        "liquid",
  "polymer-based":      "liquid",
  "hybrid-other":       "liquid",
  "powder-system":      "powder",
  "wax-based":          "cream",
  "natural-plant-based":"liquid",
  "alcohol-free":       "liquid",
};

function getNameWarning(productName: string, productType: string): string | null {
  if (!productName || !productType || productName.length < 3) return null;
  const nameLower = productName.toLowerCase();
  const typeKeywords = productType.toLowerCase().split(/[\s&\/]+/).filter(kw => kw.length > 3);
  const hasMatch = typeKeywords.some(kw => nameLower.includes(kw));
  if (!hasMatch && typeKeywords.length > 0) {
    return `Consider a name that reflects "${productType}" — e.g., "Premium ${productType}"`;
  }
  return null;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProductTypeStep({ formData, updateFormData }: Props) {
  const [categorySlug, setCategorySlug] = useState("");

  // ── Fetch categories from DB, fall back to static data ───────────────────
  const {
    data: dbCategories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useQuery<WizardCategory[]>({
    queryKey: ["/api/wizard/categories"],
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const categories = dbCategories.length > 0 ? dbCategories : STATIC_CATEGORIES;

  // ── Sync category slug from formData ─────────────────────────────────────
  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const cat = categories.find(c => c.name === formData.category);
      if (cat && cat.slug !== categorySlug) setCategorySlug(cat.slug);
    }
  }, [formData.category, categories]);

  // ── Fetch product types, fall back to static data ────────────────────────
  const {
    data: dbProductTypes = [],
    isLoading: typesLoading,
    isError: typesError,
    refetch: refetchTypes,
  } = useQuery<WizardProductType[]>({
    queryKey: ["/api/wizard/product-types", categorySlug],
    queryFn: async () => {
      if (!categorySlug) return [];
      const res = await fetch(`/api/wizard/product-types?categorySlug=${categorySlug}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!categorySlug,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const productTypes =
    dbProductTypes.length > 0
      ? dbProductTypes
      : (STATIC_PRODUCT_TYPES[categorySlug] ?? []);

  // ── Fetch base types, fall back to static data ───────────────────────────
  const {
    data: dbBaseTypes = [],
    isLoading: baseTypesLoading,
    isError: baseTypesError,
    refetch: refetchBaseTypes,
  } = useQuery<WizardBaseType[]>({
    queryKey: ["/api/wizard/base-types", categorySlug],
    queryFn: async () => {
      if (!categorySlug) return [];
      const res = await fetch(`/api/wizard/base-types?categorySlug=${categorySlug}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!categorySlug,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const baseTypes =
    dbBaseTypes.length > 0
      ? dbBaseTypes
      : (STATIC_BASE_TYPES[categorySlug] ?? []);

  // ── Handlers ──────────────────────────────────────────────────────────────

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

      {/* ── 1. Category ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200">
        <Label className="text-base font-bold text-[#1A2B4B] mb-4 flex items-center">
          <span className="bg-blue-600 text-white w-7 h-7 rounded-full text-xs font-bold mr-3 flex items-center justify-center flex-shrink-0">1</span>
          Select Category <span className="text-red-500 ml-1">*</span>
        </Label>

        {categoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl border-2 border-gray-200 bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {categoriesError && dbCategories.length === 0 && (
              <div className="flex items-center justify-between mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">Using offline category list</p>
                <Button variant="ghost" size="sm" onClick={() => refetchCategories()} className="h-7 text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" /> Retry
                </Button>
              </div>
            )}
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
                    <div className="text-2xl mb-2">{emoji}</div>
                    <p className={`text-sm font-semibold leading-tight ${isSelected ? "text-white" : "text-gray-800"}`}>
                      {cat.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── 2. Product Type ───────────────────────────────────────────────── */}
      {formData.category && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200">
          <Label className="text-base font-bold text-[#1A2B4B] mb-4 flex items-center">
            <span className="bg-purple-600 text-white w-7 h-7 rounded-full text-xs font-bold mr-3 flex items-center justify-center flex-shrink-0">2</span>
            Select Product Type <span className="text-red-500 ml-1">*</span>
          </Label>

          {typesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg border-2 border-gray-200 bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : productTypes.length === 0 ? (
            <div className="space-y-3">
              {typesError && (
                <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700">Could not load product types</p>
                  <Button variant="ghost" size="sm" onClick={() => refetchTypes()} className="h-7 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" /> Retry
                  </Button>
                </div>
              )}
              <div className="p-3 bg-white border-2 border-dashed border-purple-300 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Enter your product type manually:</p>
                <Input
                  placeholder={`e.g., Moisturizing Cream, Glass Cleaner, Floor Paint...`}
                  value={formData.productType}
                  onChange={e => updateFormData({ productType: e.target.value })}
                  className="border-purple-300 focus:border-purple-600"
                  data-testid="input-product-type-manual"
                />
              </div>
            </div>
          ) : (
            <>
              {typesError && dbProductTypes.length === 0 && (
                <div className="flex items-center justify-between mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700">Using offline product type list</p>
                  <Button variant="ghost" size="sm" onClick={() => refetchTypes()} className="h-7 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" /> Retry
                  </Button>
                </div>
              )}
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
                {/* Always offer a "Custom / Other" escape hatch */}
                <button
                  onClick={() => updateFormData({ productType: "Custom / Other" })}
                  className={`p-3 rounded-lg border-2 text-sm text-left transition-all duration-200 hover:shadow-sm border-dashed ${
                    formData.productType === "Custom / Other"
                      ? "border-purple-600 bg-purple-600 text-white shadow-md"
                      : "border-gray-300 bg-gray-50 hover:border-purple-400 text-gray-500"
                  }`}
                  data-testid="product-type-custom"
                >
                  <span className="font-medium">+ Custom / Other</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 3. Performance Level ──────────────────────────────────────────── */}
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

      {/* ── 4. Base Type ──────────────────────────────────────────────────── */}
      {formData.performanceLevel && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border-2 border-orange-200">
          <Label className="text-base font-bold text-[#1A2B4B] mb-4 flex items-center">
            <span className="bg-orange-500 text-white w-7 h-7 rounded-full text-xs font-bold mr-3 flex items-center justify-center flex-shrink-0">4</span>
            Select Base Type <span className="text-red-500 ml-1">*</span>
          </Label>

          {baseTypesLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg border-2 border-gray-200 bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : baseTypes.length === 0 ? (
            <div className="space-y-3">
              {baseTypesError && (
                <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700">Could not load base types</p>
                  <Button variant="ghost" size="sm" onClick={() => refetchBaseTypes()} className="h-7 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" /> Retry
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "wb", name: "Water-Based",   slug: "water-based"   },
                  { id: "sb", name: "Solvent-Based",  slug: "solvent-based" },
                  { id: "ob", name: "Oil-Based",      slug: "oil-based"     },
                  { id: "ho", name: "Hybrid / Other", slug: "hybrid-other"  },
                ].map(type => {
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
                    >
                      <span className="font-medium">{type.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {baseTypesError && dbBaseTypes.length === 0 && (
                <div className="flex items-center justify-between mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700">Using offline base type list</p>
                  <Button variant="ghost" size="sm" onClick={() => refetchBaseTypes()} className="h-7 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" /> Retry
                  </Button>
                </div>
              )}
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
            </>
          )}
        </div>
      )}

      {/* ── 5. Product Name ───────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-5 rounded-xl border-2 border-teal-200">
        <Label htmlFor="productName" className="text-base font-bold text-[#1A2B4B] mb-3 flex items-center">
          <span className="bg-teal-600 text-white w-7 h-7 rounded-full text-xs font-bold mr-3 flex items-center justify-center flex-shrink-0">5</span>
          Product Name <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="productName"
          type="text"
          placeholder="e.g., Premium Anti-Rust Metal Paint, Fast Drying Glass Cleaner"
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

      {/* ── Ready Summary ─────────────────────────────────────────────────── */}
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
