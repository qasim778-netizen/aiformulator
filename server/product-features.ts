export const PRODUCT_CATEGORIES = [
  {
    id: "skincare",
    name: "Skincare",
    description: "Face creams, serums, cleansers, moisturizers",
    examples: ["Anti-aging cream", "Vitamin C serum", "Gentle cleanser"]
  },
  {
    id: "pharmaceutical", 
    name: "Pharmaceutical",
    description: "Topical treatments, oral formulations, medical devices",
    examples: ["Pain relief gel", "Antiseptic solution", "Oral suspension"]
  },
  {
    id: "food",
    name: "Food & Beverage", 
    description: "Functional foods, supplements, beverages",
    examples: ["Protein powder", "Energy drink", "Probiotic supplement"]
  },
  {
    id: "industrial",
    name: "Industrial",
    description: "Lubricants, coatings, adhesives, specialty chemicals",
    examples: ["Metal cleaner", "Protective coating", "Industrial adhesive"]
  },
  {
    id: "cleaning",
    name: "Cleaning Products",
    description: "Detergents, sanitizers, household cleaners",
    examples: ["All-purpose cleaner", "Hand sanitizer", "Laundry detergent"]
  }
];

export const CONSISTENCIES = [
  {
    id: "liquid",
    name: "Liquid",
    description: "Free-flowing liquid consistency",
    icon: "💧"
  },
  {
    id: "cream",
    name: "Cream",
    description: "Thick, spreadable cream texture",
    icon: "🧴"
  },
  {
    id: "gel", 
    name: "Gel",
    description: "Semi-solid gel consistency",
    icon: "🫧"
  },
  {
    id: "powder",
    name: "Powder",
    description: "Dry powder formulation",
    icon: "✨"
  }
];

export const VISCOSITY_LEVELS = [
  {
    id: "low",
    name: "Low Viscosity",
    description: "Thin, water-like consistency",
    range: "1-100 cP",
    examples: ["Toners", "Serums", "Sprays"],
    icon: "💧"
  },
  {
    id: "medium", 
    name: "Medium Viscosity",
    description: "Honey-like consistency",
    range: "100-10,000 cP", 
    examples: ["Lotions", "Gels", "Shampoos"],
    icon: "🍯"
  },
  {
    id: "high",
    name: "High Viscosity", 
    description: "Thick, creamy consistency",
    range: "10,000+ cP",
    examples: ["Creams", "Ointments", "Thick gels"],
    icon: "🧴"
  },
  {
    id: "custom",
    name: "Custom",
    description: "Specify exact viscosity requirements",
    range: "Custom range",
    examples: ["Specialized applications"],
    icon: "⚙️"
  }
];

export const SPECIAL_PROPERTIES: Record<string, string[]> = {
  skincare: [
    "Anti-aging",
    "Moisturizing", 
    "Sun protection",
    "Whitening/Brightening",
    "Anti-acne",
    "Sensitive skin",
    "Natural/Organic",
    "Long-lasting",
    "Quick absorption",
    "Non-comedogenic"
  ],
  pharmaceutical: [
    "Antibacterial",
    "Anti-inflammatory", 
    "Pain relief",
    "Wound healing",
    "Controlled release",
    "Biocompatible",
    "Sterile",
    "pH buffered",
    "Preservative-free",
    "Child-safe"
  ],
  food: [
    "Sugar-free",
    "Gluten-free",
    "Vegan",
    "High protein",
    "Low sodium", 
    "Probiotic",
    "Extended shelf life",
    "Natural flavor",
    "Fortified",
    "Organic"
  ],
  industrial: [
    "Heat resistant",
    "Chemical resistant",
    "Waterproof",
    "UV stable",
    "Anti-corrosive",
    "Conductive",
    "Insulating", 
    "Fire retardant",
    "Low VOC",
    "Biodegradable"
  ],
  cleaning: [
    "Antibacterial",
    "Biodegradable",
    "Concentrated",
    "Non-toxic",
    "Streak-free",
    "Heavy-duty",
    "Gentle formula",
    "Quick-dry",
    "Fragrance-free",
    "Multi-surface"
  ]
};

export const STORAGE_TEMPERATURES = [
  { id: "room", name: "Room Temperature (15-25°C)", description: "Standard storage conditions" },
  { id: "cool", name: "Cool (2-8°C)", description: "Refrigerated storage" },
  { id: "frozen", name: "Frozen (-18°C)", description: "Frozen storage required" },
  { id: "controlled", name: "Controlled (Custom)", description: "Specific temperature requirements" }
];

export const BUDGET_CATEGORIES = [
  {
    id: "cost-effective",
    name: "Cost-Effective",
    description: "Budget-friendly formulations",
    priceRange: "$2-8/kg",
    features: ["Basic ingredients", "Standard performance", "Mass market appeal"]
  },
  {
    id: "medium",
    name: "Medium",
    description: "Balanced cost and performance", 
    priceRange: "$8-20/kg",
    features: ["Quality ingredients", "Enhanced performance", "Professional grade"]
  },
  {
    id: "premium",
    name: "Premium", 
    description: "High-end formulations",
    priceRange: "$20-50+/kg",
    features: ["Premium ingredients", "Superior performance", "Luxury positioning"]
  }
];

export const PRODUCTION_VOLUMES = [
  { id: "pilot", name: "Pilot Scale (1-10kg)", description: "Small batch testing" },
  { id: "small", name: "Small Scale (10-100kg)", description: "Boutique production" },
  { id: "medium", name: "Medium Scale (100-1000kg)", description: "Regional distribution" },
  { id: "large", name: "Large Scale (1000+kg)", description: "Mass production" }
];

export function getSpecialProperties(category: string): string[] {
  return SPECIAL_PROPERTIES[category] || [];
}

export function getCategoryExamples(categoryId: string): string[] {
  const category = PRODUCT_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.examples || [];
}