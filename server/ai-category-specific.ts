import OpenAI from "openai";
import type { InsertFormulation } from "@shared/schema";
import { normalizePercentages } from "./ai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Category-specific knowledge base
export const categorySpecs = {
  'cleaning-products': {
    name: 'Cleaning Products',
    requiredIngredients: ['surfactant', 'solvent'],
    prohibitedIngredients: ['carbomer', 'glycerin', 'emulsifier'],
    phRange: { min: 8, max: 12 },
    processingTime: '15-60 minutes',
    temperature: 'Room temperature (20-25°C)',
    formType: 'liquid'
  },
  'glass-cleaners': {
    name: 'Glass Cleaners',
    requiredIngredients: ['alcohol', 'surfactant'],
    prohibitedIngredients: ['thickener', 'emulsifier', 'glycerin', 'carbomer'],
    phRange: { min: 8, max: 11 },
    processingTime: '10-30 minutes',
    temperature: 'Room temperature (20-25°C)',
    formType: 'liquid',
    specialRequirements: ['streak-free', 'anti-static', 'quick-drying']
  },
  'skincare': {
    name: 'Skincare Products',
    requiredIngredients: ['preservative', 'emulsifier'],
    prohibitedIngredients: ['ammonia', 'strong-alkaline'],
    phRange: { min: 4.5, max: 7.5 },
    processingTime: '2-4 hours',
    temperature: '70-80°C heating phase',
    formType: 'cream/lotion'
  },
  'cosmetics': {
    name: 'Cosmetics',
    requiredIngredients: ['preservative'],
    prohibitedIngredients: ['industrial-solvents'],
    phRange: { min: 4.0, max: 8.0 },
    processingTime: '1-3 hours',
    temperature: '60-75°C heating phase',
    formType: 'various'
  },
  'baby-care': {
    name: 'Baby Care',
    requiredIngredients: ['gentle-preservative', 'mild-surfactant'],
    prohibitedIngredients: ['sulfates', 'parabens', 'strong-acids', 'essential-oils', 'alcohol'],
    phRange: { min: 5.5, max: 7.0 },
    processingTime: '2-4 hours',
    temperature: '60-70°C heating phase',
    formType: 'cream/lotion',
    specialRequirements: ['hypoallergenic', 'tear-free', 'dermatologist-tested']
  },
  'beauty-products': {
    name: 'Beauty Products',
    requiredIngredients: ['preservative', 'pigment-stabilizer'],
    prohibitedIngredients: ['harsh-chemicals'],
    phRange: { min: 4.0, max: 8.5 },
    processingTime: '1-3 hours',
    temperature: '50-75°C heating phase',
    formType: 'various'
  },
  'detergent-formulation': {
    name: 'Detergent Formulation',
    requiredIngredients: ['surfactant', 'builder', 'enzyme'],
    prohibitedIngredients: ['cosmetic-emulsifiers', 'glycerin'],
    phRange: { min: 8, max: 11 },
    processingTime: '30-90 minutes',
    temperature: 'Room temperature (20-25°C)',
    formType: 'liquid/powder'
  },
  'electronic-chemicals': {
    name: 'Electronic Chemicals',
    requiredIngredients: ['flux', 'anti-corrosive'],
    prohibitedIngredients: ['water-based', 'conductive-salts'],
    phRange: { min: 6, max: 8 },
    processingTime: '1-2 hours',
    temperature: 'Controlled environment (15-25°C)',
    formType: 'specialized',
    specialRequirements: ['anti-static', 'precision-cleaning', 'residue-free']
  },
  'food-beverage-additives': {
    name: 'Food & Beverage Additives',
    requiredIngredients: ['food-grade-preservative'],
    prohibitedIngredients: ['industrial-chemicals', 'toxic-compounds'],
    phRange: { min: 3, max: 9 },
    processingTime: '30 minutes - 2 hours',
    temperature: 'Food-safe processing (varies)',
    formType: 'various',
    specialRequirements: ['FDA-approved', 'food-grade', 'GRAS-status']
  },
  'leather-products': {
    name: 'Leather Products',
    requiredIngredients: ['conditioning-agent', 'protective-coating'],
    prohibitedIngredients: ['water-soluble-salts', 'strong-acids'],
    phRange: { min: 4, max: 7 },
    processingTime: '1-3 hours',
    temperature: 'Room temperature (20-25°C)',
    formType: 'cream/liquid'
  },
  'men-care': {
    name: 'Men Care',
    requiredIngredients: ['preservative', 'emulsifier'],
    prohibitedIngredients: ['harsh-sulfates'],
    phRange: { min: 5, max: 8 },
    processingTime: '2-4 hours',
    temperature: '65-75°C heating phase',
    formType: 'various'
  },
  'oral-care': {
    name: 'Oral Care',
    requiredIngredients: ['fluoride', 'abrasive', 'antimicrobial'],
    prohibitedIngredients: ['toxic-compounds', 'industrial-solvents'],
    phRange: { min: 6, max: 9 },
    processingTime: '1-2 hours',
    temperature: 'Room temperature (20-25°C)',
    formType: 'paste/liquid',
    specialRequirements: ['safe-if-swallowed', 'enamel-safe']
  },
  'organic-care': {
    name: 'Organic Care',
    requiredIngredients: ['natural-preservative', 'organic-emulsifier'],
    prohibitedIngredients: ['synthetic-chemicals', 'sulfates', 'parabens', 'artificial-colors'],
    phRange: { min: 5, max: 7.5 },
    processingTime: '2-5 hours',
    temperature: '50-70°C heating phase',
    formType: 'various',
    specialRequirements: ['organic-certified', 'natural-ingredients', 'eco-friendly']
  },
  'shoe-care': {
    name: 'Shoe Care',
    requiredIngredients: ['wax', 'oil', 'stearic-acid'],
    prohibitedIngredients: ['water', 'aqua'],
    phRange: { min: 6, max: 8 },
    processingTime: '30 minutes - 2 hours',
    temperature: '70-85°C (wax melting phase)',
    formType: 'anhydrous cream/paste',
    allowWater: false,
    specialRequirements: ['anhydrous', 'wax-based', 'oil-based']
  },
  'skin-care': {
    name: 'Skin Care',
    requiredIngredients: ['preservative', 'emulsifier', 'humectant'],
    prohibitedIngredients: ['ammonia', 'strong-alkaline'],
    phRange: { min: 4.5, max: 7.5 },
    processingTime: '2-4 hours',
    temperature: '70-80°C heating phase',
    formType: 'cream/lotion'
  },
  'construction-material': {
    name: 'Construction Material',
    requiredIngredients: ['binder', 'additive'],
    prohibitedIngredients: ['cosmetic-ingredients'],
    phRange: { min: 8, max: 13 },
    processingTime: '1-6 hours',
    temperature: 'Ambient to high heat (varies)',
    formType: 'paste/liquid',
    specialRequirements: ['structural-integrity', 'weather-resistant']
  },
  'pet-care': {
    name: 'Pet Care',
    requiredIngredients: ['gentle-preservative', 'mild-surfactant'],
    prohibitedIngredients: ['toxic-to-animals', 'essential-oils', 'xylitol'],
    phRange: { min: 6, max: 8 },
    processingTime: '1-3 hours',
    temperature: '60-70°C heating phase',
    formType: 'various',
    specialRequirements: ['pet-safe', 'non-toxic', 'veterinarian-approved']
  }
};

// Ingredient validation lists
export const ingredientDatabase = {
  cleaning: {
    surfactants: ['Sodium Lauryl Sulfate', 'Cocamidopropyl Betaine', 'Linear Alkylbenzene Sulfonate'],
    solvents: ['Isopropyl Alcohol', 'Ethanol', 'Propylene Glycol'],
    builders: ['Sodium Carbonate', 'Potassium Hydroxide', 'Sodium Hydroxide'],
    antiStatic: ['Quaternary Ammonium Compounds']
  },
  cosmetic: {
    emulsifiers: ['Cetyl Alcohol', 'Stearic Acid', 'Polysorbate 60'],
    preservatives: ['Phenoxyethanol', 'Benzyl Alcohol', 'Potassium Sorbate'],
    humectants: ['Glycerin', 'Hyaluronic Acid', 'Propylene Glycol'],
    thickeners: ['Carbomer', 'Xanthan Gum', 'Cetyl Alcohol']
  },
  baby: {
    gentlePreservatives: ['Benzyl Alcohol', 'Potassium Sorbate', 'Sodium Benzoate'],
    mildSurfactants: ['Cocamidopropyl Betaine', 'Decyl Glucoside', 'Coco Glucoside'],
    soothing: ['Chamomile Extract', 'Aloe Vera', 'Calendula Extract'],
    moisturizers: ['Shea Butter', 'Coconut Oil', 'Jojoba Oil']
  },
  detergent: {
    surfactants: ['Linear Alkylbenzene Sulfonate', 'Sodium Laureth Sulfate', 'Alpha Olefin Sulfonate'],
    builders: ['Sodium Carbonate', 'Sodium Silicate', 'Zeolite A'],
    enzymes: ['Protease', 'Amylase', 'Lipase', 'Cellulase'],
    brighteners: ['Optical Brightening Agents', 'Fluorescent Whitening Agents']
  },
  electronic: {
    flux: ['Rosin Flux', 'No-Clean Flux', 'Water-Soluble Flux'],
    solvents: ['Isopropyl Alcohol', 'Acetone', 'Methanol'],
    antiCorrosive: ['Benzotriazole', 'Corrosion Inhibitor A', 'Protective Coating'],
    antiStatic: ['Conductive Polymers', 'Ionic Liquids']
  },
  food: {
    preservatives: ['Sodium Benzoate', 'Potassium Sorbate', 'Citric Acid'],
    emulsifiers: ['Lecithin', 'Mono- and Diglycerides', 'Polysorbate 80'],
    stabilizers: ['Guar Gum', 'Xanthan Gum', 'Carrageenan'],
    antioxidants: ['Vitamin E', 'BHT', 'BHA', 'Ascorbic Acid']
  },
  leather: {
    conditioners: ['Lanolin', 'Neatsfoot Oil', 'Mink Oil'],
    protectants: ['Carnauba Wax', 'Beeswax', 'Silicone Polymers'],
    cleaners: ['Saddle Soap', 'Mild Detergents', 'Glycerin Soap']
  },
  oral: {
    abrasives: ['Hydrated Silica', 'Calcium Carbonate', 'Aluminum Hydroxide'],
    fluoride: ['Sodium Fluoride', 'Stannous Fluoride', 'Sodium Monofluorophosphate'],
    antimicrobials: ['Triclosan', 'Cetylpyridinium Chloride', 'Zinc Citrate'],
    thickeners: ['Carrageenan', 'Xanthan Gum', 'Cellulose Gum']
  },
  organic: {
    naturalPreservatives: ['Rosemary Extract', 'Vitamin E', 'Grapefruit Seed Extract'],
    organicEmulsifiers: ['Lecithin', 'Cetyl Alcohol (plant-derived)', 'Glyceryl Stearate'],
    plantExtracts: ['Aloe Vera', 'Green Tea Extract', 'Chamomile Extract'],
    naturalOils: ['Jojoba Oil', 'Argan Oil', 'Sweet Almond Oil']
  },
  shoe: {
    waxes: ['Carnauba Wax', 'Beeswax', 'Candelilla Wax'],
    conditioners: ['Lanolin', 'Mink Oil', 'Leather Conditioner'],
    protectants: ['Silicone Water Repellent', 'Fluoropolymer Coating'],
    pigments: ['Iron Oxide', 'Carbon Black', 'Leather Dyes']
  },
  construction: {
    binders: ['Portland Cement', 'Epoxy Resin', 'Polyurethane'],
    additives: ['Plasticizers', 'Accelerators', 'Retarders'],
    reinforcements: ['Fiber Mesh', 'Steel Fibers', 'Polymer Fibers'],
    fillers: ['Silica Sand', 'Limestone', 'Fly Ash']
  },
  pet: {
    gentlePreservatives: ['Potassium Sorbate', 'Sodium Benzoate', 'Vitamin E'],
    mildSurfactants: ['Cocamidopropyl Betaine', 'Decyl Glucoside'],
    naturalExtracts: ['Oatmeal Extract', 'Aloe Vera', 'Chamomile'],
    conditioners: ['Coconut Oil', 'Shea Butter', 'Jojoba Oil']
  }
};

// Safe JSON parser with fallback
function safeParse(content: string): any | null {
  try {
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown code fences or other wrapper text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Get fallback formulation for demo when AI fails
export function getFallbackFormulation(categoryName: string, productDescription: string): any {
  // Check if this is a shoe care/polish category (ANHYDROUS - NO WATER)
  const isShoeCategory = categoryName.toLowerCase().includes('shoe') || 
                         productDescription.toLowerCase().includes('shoe') ||
                         productDescription.toLowerCase().includes('polish') ||
                         productDescription.toLowerCase().includes('leather care');

  if (isShoeCategory) {
    // INDUSTRIAL STANDARD SHOE POLISH - ANHYDROUS (0% Water)
    return {
      name: `Professional ${productDescription}`,
      description: `Premium anhydrous shoe care formulation with industrial-grade wax blend. This professional-grade formula provides superior leather conditioning, lasting shine, and water-resistant protection for all leather footwear.`,
      ingredients: [
        { name: "Carnauba Wax", inci: "Copernicia Cerifera Cera", percentage: "25.0%", function: "Primary hard wax for high gloss and durability" },
        { name: "Beeswax", inci: "Cera Alba", percentage: "15.0%", function: "Structural wax, flexibility and water resistance" },
        { name: "Paraffin Wax", inci: "Paraffin", percentage: "5.0%", function: "Base wax, spreadability" },
        { name: "Mineral Oil", inci: "Paraffinum Liquidum", percentage: "18.0%", function: "Carrier oil, leather conditioning" },
        { name: "Silicone Oil", inci: "Dimethicone", percentage: "8.0%", function: "Water repellency, shine enhancement" },
        { name: "Lanolin", inci: "Lanolin", percentage: "7.0%", function: "Leather softening, moisturizing" },
        { name: "Stearic Acid", inci: "Stearic Acid", percentage: "10.0%", function: "Structure, consistency, emulsification" },
        { name: "Triethanolamine", inci: "Triethanolamine", percentage: "3.0%", function: "pH adjustment, emulsion stability" },
        { name: "Turpentine", inci: "Turpentine", percentage: "5.0%", function: "Solvent, wax softener, penetration aid" },
        { name: "Iron Oxide Black", inci: "CI 77499", percentage: "2.5%", function: "Color pigment (adjust for desired shade)" },
        { name: "Antioxidant BHT", inci: "Butylated Hydroxytoluene", percentage: "0.5%", function: "Preservative, prevents oxidation" },
        { name: "Fragrance", inci: "Parfum", percentage: "1.0%", function: "Classic leather scent" }
      ],
      instructions: [
        { 
          phase: "Wax Melting Phase", 
          steps: [
            "Heat all waxes (carnauba, beeswax, paraffin) to 80-85°C in stainless steel vessel",
            "Stir continuously until completely melted and homogeneous",
            "Monitor temperature carefully - do not exceed 90°C"
          ] 
        },
        { 
          phase: "Oil Addition Phase", 
          steps: [
            "Add mineral oil and silicone oil to melted wax blend at 75-80°C",
            "Incorporate lanolin while stirring",
            "Add stearic acid and mix until dissolved"
          ] 
        },
        { 
          phase: "Finishing Phase", 
          steps: [
            "Add TEA slowly while stirring at 70°C",
            "Incorporate turpentine and mix thoroughly",
            "Add pigment dispersion and fragrance at 65°C",
            "Add antioxidant, stir for 5 minutes",
            "Pour into containers at 55-60°C before setting"
          ] 
        }
      ],
      usageInstructions: "Apply thin layer with soft cloth or applicator brush. Allow to set for 2-3 minutes. Buff vigorously with horsehair brush or soft cloth for high shine.",
      phLevel: "N/A (anhydrous system)",
      shelfLife: "36 months in sealed container",
      viscosity: "Soft paste at 20°C, melts at body temperature",
      storageConditions: "Store at 15-25°C, away from heat sources and direct sunlight",
      batchSize: "100 kg",
      processingTime: "2-3 hours",
      temperature: "Wax melting: 80-85°C, Filling: 55-60°C",
      equipment: "Jacketed mixing vessel with temperature control, high-shear mixer, filling equipment",
      certification: "Meets international shoe care industry standards",
      isActive: true
    };
  }

  // Check if this is a detergent-related category
  const isDetergentCategory = categoryName.toLowerCase().includes('detergent') || 
                              categoryName.toLowerCase().includes('cleaning') ||
                              productDescription.toLowerCase().includes('detergent') ||
                              productDescription.toLowerCase().includes('dishwashing');

  if (isDetergentCategory) {
    // Use detergent-specific ingredients for dishwashing/detergent formulations
    return {
      name: `Professional ${productDescription}`,
      description: `High-quality ${productDescription.toLowerCase()} formulations - powder - powder with low viscosity, ph 7, medium quality cost level, special requirements: fabric softening, stain removal for professional use`,
      ingredients: [
        { name: "Linear Alkylbenzene Sulfonate", inci: "Linear Alkylbenzene Sulfonate", percentage: "25.0%", function: "Primary surfactant" },
        { name: "Sodium Carbonate", inci: "Sodium Carbonate", percentage: "20.0%", function: "Builder/pH adjuster" },
        { name: "Zeolite A", inci: "Zeolite A", percentage: "15.0%", function: "Water softener" },
        { name: "Sodium Silicate", inci: "Sodium Silicate", percentage: "12.0%", function: "Alkalinity builder" },
        { name: "Protease Enzyme", inci: "Protease", percentage: "8.0%", function: "Protein stain removal" },
        { name: "Amylase Enzyme", inci: "Amylase", percentage: "5.0%", function: "Starch stain removal" },
        { name: "Optical Brightening Agent", inci: "Optical Brightening Agent", percentage: "3.0%", function: "Whitening" },
        { name: "Anti-redeposition Agent", inci: "Carboxymethyl Cellulose", percentage: "2.0%", function: "Prevents soil redeposition" },
        { name: "Fragrance", inci: "Parfum", percentage: "1.5%", function: "Scent" },
        { name: "Colorant", inci: "CI 74160", percentage: "0.5%", function: "Visual appeal" },
        { name: "Filler", inci: "Sodium Sulfate", percentage: "8.0%", function: "Bulk agent" }
      ],
      instructions: [
        { 
          phase: "Dry Blending Phase", 
          steps: [
            "Pre-mix all powdered ingredients in order of decreasing particle size",
            "Add surfactants and blend thoroughly for 15 minutes",
            "Incorporate builders and enzymes with continuous mixing"
          ] 
        },
        { 
          phase: "Final Processing", 
          steps: [
            "Add fragrance and colorant during final mixing stage",
            "Ensure uniform distribution through ribbon blending",
            "Compress into tablet form using hydraulic press",
            "Package in moisture-resistant containers"
          ] 
        }
      ],
      usageInstructions: "Use 1 tablet per wash cycle. Dissolves completely in both hot and cold water. Safe for all dishware types.",
      phLevel: "10.5",
      shelfLife: "24 months",
      viscosity: "N/A (solid tablet)",
      storageConditions: "Store in cool, dry place away from moisture",
      batchSize: "500 kg",
      processingTime: "4 hours",
      temperature: "Room temperature (20-25°C)",
      equipment: "Ribbon blender, tablet press, packaging equipment",
      certification: "Meets industry standards for dishwashing detergents",
      isActive: true
    };
  }

  // Default fallback for non-detergent categories
  return {
    name: `Professional ${productDescription}`,
    description: `High-quality ${productDescription.toLowerCase()} for professional use`,
    ingredients: [
      { name: "Water", inci: "Aqua", percentage: "85.0%", function: "Base solvent" },
      { name: "Glycerin", inci: "Glycerin", percentage: "10.0%", function: "Humectant" },
      { name: "Preservative", inci: "Phenoxyethanol", percentage: "3.0%", function: "Preservation" },
      { name: "Fragrance", inci: "Parfum", percentage: "2.0%", function: "Scent" }
    ],
    instructions: [
      { phase: "Main Phase", steps: ["Combine all ingredients", "Mix thoroughly", "Package"] }
    ],
    usageInstructions: "Apply as directed",
    phLevel: "7.0",
    shelfLife: "24 months",
    viscosity: "Medium",
    storageConditions: "Cool, dry place",
    batchSize: "100 kg",
    processingTime: "2 hours",
    temperature: "Room temperature",
    equipment: "Standard mixer",
    certification: "Meets industry standards",
    isActive: true
  };
}

// Validation function
export function validateFormulation(formulation: any, categoryKey: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const specs = categorySpecs[categoryKey as keyof typeof categorySpecs];
  
  // For all 23 categories displayed in the interface, use generic validation
  const supportedCategories = [
    // Database categories
    'baby-care', 'beauty-products', 'cleaning-products', 'detergent-formulation', 
    'electronic-chemicals', 'food-beverage-additives', 'leather-products', 'men-care', 
    'oral-care', 'organic-care', 'shoe-care', 'skin-care', 'construction-material', 'pet-care',
    // Additional interface categories  
    '3d-printing-materials', 'advanced-agricultural-chemicals-formulations', 'aromatherapy-innovations',
    'automotive-coating-solutions', 'biodegradable-packaging-solutions', 'hair-enrichment-solutions',
    'professional-grooming-essentials', 'salon-base-innovations', 'saloon-hair-treatment', 
    'smart-textile-coatings', 'water-treatment-solutions'
  ];
  
  if (!supportedCategories.includes(categoryKey) && !specs) {
    console.log(`⚠️ Using generic validation for category: ${categoryKey}`);
  }

  // Parse ingredients
  let ingredients: any[] = [];
  try {
    ingredients = typeof formulation.ingredients === 'string' 
      ? JSON.parse(formulation.ingredients) 
      : formulation.ingredients || [];
  } catch {
    errors.push('Invalid ingredients format');
    return { isValid: false, errors };
  }

  // Check percentage totals - handle both string ("12.5%") and number (12.5) formats
  const totalPercentage = ingredients.reduce((total, ing) => {
    if (!ing.percentage) return total;
    const pct = typeof ing.percentage === 'number' 
      ? ing.percentage 
      : parseFloat(String(ing.percentage).replace('%', '')) || 0;
    return total + pct;
  }, 0);

  if (Math.abs(totalPercentage - 100) > 5) {
    errors.push(`Ingredients must add up to 100%, got ${totalPercentage.toFixed(1)}%`);
  }

  // Check required ingredients for category (only if specs available)
  if (specs && categoryKey === 'glass-cleaners') {
    const hasAlcohol = ingredients.some(ing => 
      ing.name.toLowerCase().includes('alcohol') || 
      ing.name.toLowerCase().includes('ethanol') ||
      ing.name.toLowerCase().includes('isopropyl')
    );
    if (!hasAlcohol) {
      errors.push('Glass cleaners must contain alcohol or alcohol-based solvent');
    }

    const hasSurfactant = ingredients.some(ing => 
      ing.function?.toLowerCase().includes('surfactant') ||
      ing.function?.toLowerCase().includes('cleaning')
    );
    if (!hasSurfactant) {
      errors.push('Glass cleaners must contain surfactant for cleaning action');
    }
  }

  // Check prohibited ingredients for category (only if specs available)
  if (specs && (categoryKey === 'glass-cleaners' || categoryKey === 'cleaning-products')) {
    const hasProhibited = ingredients.some(ing => {
      const name = ing.name.toLowerCase();
      return name.includes('carbomer') || 
             name.includes('glycerin') || 
             name.includes('emulsifier') ||
             ing.function?.toLowerCase().includes('thickening');
    });
    if (hasProhibited) {
      errors.push('Cleaning products should not contain thickeners, glycerin, or emulsifiers');
    }
  }

  // CRITICAL: Validate anhydrous (water-free) categories
  const anhydrousCategories = ['shoe-care', 'shoe', 'polish', 'leather-care'];
  const isAnhydrous = anhydrousCategories.some(cat => categoryKey.includes(cat)) ||
                      (specs && (specs as any).allowWater === false);
  
  if (isAnhydrous) {
    const hasWater = ingredients.some(ing => {
      const name = ing.name.toLowerCase();
      const inci = (ing.inci || '').toLowerCase();
      return name === 'water' || name === 'aqua' || 
             name.includes('deionized water') || name.includes('purified water') ||
             inci === 'aqua' || inci === 'water';
    });
    
    if (hasWater) {
      errors.push('CRITICAL: Shoe care/polish formulations must be ANHYDROUS (0% water). Water damages leather and is prohibited in shoe polish.');
    }
    
    // Check for required waxes
    const hasWax = ingredients.some(ing => {
      const name = ing.name.toLowerCase();
      return name.includes('wax') || name.includes('cera') || name.includes('carnauba') || name.includes('beeswax');
    });
    if (!hasWax) {
      errors.push('Shoe polish must contain wax ingredients (carnauba, beeswax, paraffin)');
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Category-specific prompt generator
export function getCategoryPrompt(categoryName: string, productDescription: string): string {
  const category = categoryName.toLowerCase().replace(/\s+/g, '-');
  const desc = productDescription.toLowerCase();
  
  // SHOE CARE - must be checked FIRST (anhydrous formulations)
  if (category.includes('shoe') || desc.includes('shoe') || desc.includes('polish') || desc.includes('leather care')) {
    return getShoeCarePrompt(categoryName, productDescription);
  } else if (category.includes('glass') || category.includes('cleaning')) {
    return getCleaningProductPrompt(categoryName, productDescription);
  } else if (category.includes('cosmetic') || category.includes('skincare') || category.includes('beauty')) {
    return getCosmeticPrompt(categoryName, productDescription);
  } else if (category.includes('baby') || category.includes('pet')) {
    return getGentleFormulationPrompt(categoryName, productDescription);
  } else if (category.includes('detergent') || category.includes('laundry')) {
    return getDetergentPrompt(categoryName, productDescription);
  } else if (category.includes('oral') || category.includes('dental')) {
    return getOralCarePrompt(categoryName, productDescription);
  } else if (category.includes('organic') || category.includes('natural')) {
    return getOrganicPrompt(categoryName, productDescription);
  } else if (category.includes('electronic') || category.includes('industrial')) {
    return getIndustrialPrompt(categoryName, productDescription);
  } else if (category.includes('food') || category.includes('beverage')) {
    return getFoodGradePrompt(categoryName, productDescription);
  } else {
    return getGenericPrompt(categoryName, productDescription);
  }
}

// SHOE CARE PROMPT - ANHYDROUS (0% WATER) FORMULATIONS
function getShoeCarePrompt(categoryName: string, productDescription: string): string {
  return `You are a senior industrial chemist specializing in ANHYDROUS shoe care formulations. Generate production-ready shoe polish/cream formulations.

═══════════════════════════════════════════════════════════════
CRITICAL: THIS IS AN ANHYDROUS (WATER-FREE) FORMULATION
═══════════════════════════════════════════════════════════════

ABSOLUTELY NO WATER OR AQUA ALLOWED - NOT EVEN TRACE AMOUNTS!

MANDATORY INDUSTRIAL STANDARD FOR SHOE POLISH/CREAM:
✅ 35-45% WAXES (carnauba + beeswax + paraffin)
   - Carnauba Wax: 20-30% (hardness, shine)
   - Beeswax: 10-15% (flexibility, water resistance)
   - Paraffin/Microcrystalline: 5-10% (spreadability)

✅ 30-35% OILS (silicone + mineral + lanolin)
   - Mineral Oil: 15-20% (carrier, conditioning)
   - Silicone Oil/Dimethicone: 5-10% (water repellency)
   - Lanolin: 5-8% (leather softening)

✅ 10% STEARIC ACID (structure, consistency)

✅ 0-5% TRIETHANOLAMINE (TEA) for emulsion stability

✅ 1-3% DYE/PIGMENT
   - Iron Oxide (black, brown, tan shades)
   - Carbon Black (for black polish)

✅ 0.5-1% PRESERVATIVE/ANTIOXIDANT (BHT)

✅ 3-5% SOLVENT (turpentine or mineral spirits)

✅ 0-1% FRAGRANCE

═══════════════════════════════════════════════════════════════
PROHIBITED INGREDIENTS - WILL CAUSE FORMULATION REJECTION:
═══════════════════════════════════════════════════════════════
❌ Water/Aqua - ABSOLUTELY FORBIDDEN
❌ Glycerin - leaves residue on leather
❌ Surfactants - not needed for anhydrous system
❌ Emulsifiers for water-based systems
❌ Carbomer or water-soluble thickeners

PROCESSING REQUIREMENTS:
- Wax melting temperature: 80-85°C
- Oil addition: 75-80°C
- Pigment dispersion: 65-70°C
- Fill temperature: 55-60°C
- Equipment: Jacketed vessel with temperature control

ALL PERCENTAGES MUST SUM TO EXACTLY 100%

Return JSON format:
{
  "name": "Professional Shoe Polish/Cream Name",
  "description": "Description mentioning anhydrous wax-based formula, leather conditioning, shine, protection",
  "ingredients": [
    {"name": "Ingredient", "inci": "INCI Name", "percentage": "X.X%", "function": "Function"}
  ],
  "instructions": [{"phase": "Phase Name", "steps": ["Step 1", "Step 2"]}],
  "usageInstructions": "Application instructions for shoe care",
  "phLevel": "N/A (anhydrous system)",
  "shelfLife": "36 months",
  "viscosity": "Soft paste at 20°C",
  "storageConditions": "15-25°C, away from heat",
  "batchSize": "100 kg",
  "processingTime": "2-3 hours",
  "temperature": "Wax melting: 80-85°C, Filling: 55-60°C",
  "equipment": "Jacketed mixing vessel, high-shear mixer",
  "certification": "Industrial shoe care standards",
  "isActive": true
}

Generate a professional ${productDescription} formulation for ${categoryName}.
Remember: ZERO WATER - this is an anhydrous wax-based system!`;
}

function getCleaningProductPrompt(categoryName: string, productDescription: string): string {
  return `You are a professional cleaning product formulation expert with expertise in industrial manufacturing. Generate detailed commercial cleaning formulations with professional-grade specifications.

  CRITICAL REQUIREMENTS for ${categoryName}:
  - MUST contain alcohol-based solvent (isopropyl alcohol 20-40% OR ethanol 15-30%)
  - MUST contain low-foam surfactant (1-3%) for cleaning action
  - SHOULD include anti-static agent (0.1-0.5%) to prevent dust attraction
  - pH must be 8-11 for effective cleaning
  - Processing time: 10-30 minutes maximum (simple mixing)
  - Temperature: Room temperature mixing only
  - Form: Clear liquid, no thickeners
  - All percentages MUST add up to exactly 100%

  PROHIBITED ingredients:
  - NO glycerin (leaves residue)
  - NO carbomer or thickeners (creates streaks)
  - NO emulsifiers (inappropriate for cleaning)
  - NO heating phases (unnecessary for cleaners)

  Return JSON in this exact format:
  {
    "name": "Product Name",
    "description": "3-4 line professional description that introduces the product's purpose, mentions main function (e.g., removes grease, cuts through grime, provides streak-free cleaning), highlights key benefits for end users (e.g., safe for surfaces, quick-drying, antimicrobial action), using simple non-technical language",
    "ingredients": [
      {
        "name": "Specific Ingredient Name",
        "inci": "Official INCI Name", 
        "percentage": "X.X%",
        "function": "Detailed function in formulation"
      }
    ],
    "instructions": [
      {
        "phase": "Specific Phase Name (e.g., Main Mixing Phase, Quality Control)",
        "steps": [
          "Detailed step with specific temperatures and timing",
          "Precise mixing instructions with equipment specifications", 
          "Quality control checkpoints and parameters"
        ]
      }
    ],
    "usageInstructions": "Detailed professional usage instructions with application methods and dosage",
    "phLevel": "Specific pH value or tight range (e.g., 9.2, 10.5)",
    "shelfLife": "Specific shelf life with storage conditions",
    "viscosity": "Specific viscosity measurement or description",
    "storageConditions": "Detailed storage requirements with temperature and humidity",
    "batchSize": "Professional batch size (e.g., 500 L, 1000 L)",
    "processingTime": "Specific processing time with phases",
    "temperature": "Exact temperature requirements for each phase",
    "equipment": "Professional equipment list with specifications",
    "certification": "Industry certifications and compliance standards",
    "isActive": true
  }

  ENHANCED GUIDELINES:
  - Use authentic chemical ingredients with proper INCI nomenclature
  - Percentages must add up to exactly 100% with realistic proportions
  - Include cleaning-specific ingredients (surfactants, solvents, pH adjusters)
  - Provide detailed manufacturing processes with quality control
  - Ensure formulations meet industry safety and efficacy standards
  - Include specific technical parameters (pH, viscosity, temperature, time)
  - Make each formulation unique, practical, and production-ready

  Example proper glass cleaner ingredients:
  - Isopropyl Alcohol (25-35%) - Primary cleaning solvent
  - Water (55-65%) - Base solvent  
  - Nonionic Surfactant (1-2%) - Cleaning agent
  - Ammonia substitute (2-3%) - Enhanced cleaning
  - Anti-static agent (0.1%) - Dust prevention
  - Dye (trace amounts) - Visual identification`;
}

function getCosmeticPrompt(categoryName: string, productDescription: string): string {
  return `You are a professional cosmetic formulation expert with expertise in industrial manufacturing. Generate detailed commercial cosmetic formulations with professional-grade specifications.

  REQUIREMENTS for ${categoryName}:
  - MUST contain appropriate preservative system (0.5-1%)
  - MUST include emulsification system if cream/lotion
  - pH must be 4.5-7.5 for skin compatibility
  - Processing: Heat and hold phase at 70-75°C
  - All percentages MUST add up to exactly 100%

  Return JSON in this exact format:
  {
    "name": "Product Name",
    "description": "3-4 line professional description that introduces the product's purpose, mentions main function (e.g., hydrates skin, reduces wrinkles, protects barrier), highlights key benefits for end users (e.g., smoother skin, anti-aging effects, suitable for sensitive skin), using simple non-technical language",
    "ingredients": [
      {
        "name": "Specific Ingredient Name",
        "inci": "Official INCI Name",
        "percentage": "X.X%",
        "function": "Detailed function in formulation"
      }
    ],
    "instructions": [
      {
        "phase": "Specific Phase Name (e.g., Water Phase, Oil Phase, Cool Down)",
        "steps": [
          "Detailed step with specific temperatures and timing",
          "Precise mixing instructions with equipment specifications", 
          "Quality control checkpoints and parameters"
        ]
      }
    ],
    "usageInstructions": "Detailed professional usage instructions with application methods and dosage",
    "phLevel": "Specific pH value or tight range (e.g., 5.5, 6.2)",
    "shelfLife": "Specific shelf life with storage conditions",
    "viscosity": "Specific viscosity measurement or description",
    "storageConditions": "Detailed storage requirements with temperature and humidity",
    "batchSize": "Professional batch size (e.g., 500 kg, 1000 L)",
    "processingTime": "Specific processing time with phases",
    "temperature": "Exact temperature requirements for each phase",
    "equipment": "Professional equipment list with specifications",
    "certification": "Industry certifications and compliance standards",
    "isActive": true
  }

  ENHANCED GUIDELINES:
  - Use authentic cosmetic ingredients with proper INCI nomenclature
  - Percentages must add up to exactly 100% with realistic proportions
  - Include cosmetic-specific ingredients (emulsifiers, preservatives, actives)
  - Provide detailed multi-phase manufacturing processes
  - Ensure formulations meet cosmetic safety and efficacy standards
  - Include specific technical parameters (pH, viscosity, temperature, time)
  - Make each formulation unique, practical, and production-ready`;
}

function getGenericPrompt(categoryName: string, productDescription: string): string {
  return `You are a professional chemical formulation expert with expertise in industrial manufacturing. Generate detailed commercial formulations for ${categoryName} with professional-grade specifications.

  Return JSON in this exact format:
  {
    "name": "Product Name",
    "description": "3-4 line professional description that introduces the product's purpose, mentions main function, highlights key benefits for end users, using simple non-technical language",
    "ingredients": [
      {
        "name": "Specific Ingredient Name",
        "inci": "Official INCI Name",
        "percentage": "X.X%",
        "function": "Detailed function in formulation"
      }
    ],
    "instructions": [
      {
        "phase": "Specific Phase Name (e.g., Preparation Phase, Processing Phase)",
        "steps": [
          "Detailed step with specific temperatures and timing",
          "Precise mixing instructions with equipment specifications", 
          "Quality control checkpoints and parameters"
        ]
      }
    ],
    "usageInstructions": "Detailed professional usage instructions with application methods and dosage",
    "phLevel": "Specific pH value or tight range",
    "shelfLife": "Specific shelf life with storage conditions",
    "viscosity": "Specific viscosity measurement or description",
    "storageConditions": "Detailed storage requirements with temperature and humidity",
    "batchSize": "Professional batch size (e.g., 500 kg, 1000 L)",
    "processingTime": "Specific processing time with phases",
    "temperature": "Exact temperature requirements for each phase",
    "equipment": "Professional equipment list with specifications",
    "certification": "Industry certifications and compliance standards",
    "isActive": true
  }

  ENHANCED GUIDELINES:
  - Use authentic chemical ingredients with proper INCI nomenclature
  - Percentages must add up to exactly 100% with realistic proportions
  - Include category-specific ingredients appropriate for ${categoryName}
  - Provide detailed multi-phase manufacturing processes
  - Ensure formulations meet industry safety and efficacy standards
  - Include specific technical parameters (pH, viscosity, temperature, time)
  - Make each formulation unique, practical, and production-ready
  
  CRITICAL REQUIREMENTS:
  - All percentages MUST add up to exactly 100%
  - Use appropriate ingredients for the category
  - Include realistic processing parameters
  - Include proper pH, shelf life, and storage conditions
  
  Return JSON in this exact format:
  {
    "name": "Product Name",
    "description": "Professional product description", 
    "ingredients": [
      {
        "name": "Ingredient Name",
        "inci": "INCI Name",
        "percentage": "X.X%", 
        "function": "Function in formulation"
      }
    ],
    "instructions": [
      {
        "phase": "Phase Name",
        "steps": ["Step 1", "Step 2"]
      }
    ],
    "usageInstructions": "Application instructions",
    "phLevel": "X.X",
    "shelfLife": "XX months", 
    "viscosity": "Viscosity type",
    "storageConditions": "Storage conditions",
    "batchSize": "XXX kg",
    "processingTime": "X hours",
    "temperature": "Temperature range",
    "equipment": "Required equipment",
    "certification": "Industry standards"
  }`;
}

function getGentleFormulationPrompt(categoryName: string, productDescription: string): string {
  return `You are a professional gentle formulation expert with expertise in industrial manufacturing. Generate detailed commercial gentle formulations with professional-grade specifications.

  CRITICAL REQUIREMENTS for ${categoryName}:
  - MUST use only gentle, mild ingredients (no sulfates, parabens, harsh chemicals)
  - MUST contain mild preservative system (0.5-1%)  
  - MUST include gentle surfactants if cleansing product
  - pH must be 5.5-7.0 for gentle, non-irritating formula
  - Processing: Gentle heating to 60-70°C maximum
  - All percentages MUST add up to exactly 100%
  - Must be hypoallergenic and dermatologist-tested safe

  PROHIBITED ingredients:
  - NO sulfates (SLS, SLES)
  - NO parabens 
  - NO harsh alcohols
  - NO essential oils (can cause reactions)
  - NO strong fragrances

  Return JSON in this exact format:
  {
    "name": "Product Name",
    "description": "3-4 line professional description that introduces the product's purpose, mentions main function (e.g., gently cleanses, soothes sensitive skin, hypoallergenic care), highlights key benefits for end users (e.g., safe for babies, reduces irritation, dermatologist recommended), using simple non-technical language",
    "ingredients": [
      {
        "name": "Specific Ingredient Name",
        "inci": "Official INCI Name",
        "percentage": "X.X%",
        "function": "Detailed function in formulation"
      }
    ],
    "instructions": [
      {
        "phase": "Specific Phase Name (e.g., Gentle Heating Phase, Cool Down Phase)",
        "steps": [
          "Detailed step with specific temperatures and timing",
          "Precise mixing instructions with equipment specifications", 
          "Quality control checkpoints and parameters"
        ]
      }
    ],
    "usageInstructions": "Detailed professional usage instructions with application methods and dosage",
    "phLevel": "Specific pH value or tight range (e.g., 6.2, 5.8)",
    "shelfLife": "Specific shelf life with storage conditions",
    "viscosity": "Specific viscosity measurement or description",
    "storageConditions": "Detailed storage requirements with temperature and humidity",
    "batchSize": "Professional batch size (e.g., 300 kg, 500 L)",
    "processingTime": "Specific processing time with phases",
    "temperature": "Exact temperature requirements for each phase",
    "equipment": "Professional equipment list with specifications",
    "certification": "Industry certifications and compliance standards",
    "isActive": true
  }

  ENHANCED GUIDELINES:
  - Use authentic gentle ingredients with proper INCI nomenclature
  - Percentages must add up to exactly 100% with realistic proportions
  - Include gentle-specific ingredients (mild surfactants, natural extracts, soothing agents)
  - Provide detailed multi-phase manufacturing processes
  - Ensure formulations meet gentle care safety and efficacy standards
  - Include specific technical parameters (pH, viscosity, temperature, time)
  - Make each formulation unique, practical, and production-ready`;
}

function getDetergentPrompt(categoryName: string, productDescription: string): string {
  return `You are a professional detergent formulation expert with expertise in industrial manufacturing. Generate detailed commercial detergent formulations with professional-grade specifications.

  CRITICAL REQUIREMENTS for ${categoryName}:
  - MUST contain effective surfactant system (15-25%)
  - MUST include builders for water hardness (5-15%) 
  - MUST contain enzymes for stain removal (1-3%)
  - pH must be 8-11 for effective cleaning
  - Processing: Room temperature mixing
  - All percentages MUST add up to exactly 100%

  Return JSON in this exact format:
  {
    "name": "Product Name",
    "description": "3-4 line professional description that introduces the product's purpose, mentions main function (e.g., removes tough stains, brightens fabrics, deep cleaning action), highlights key benefits for end users (e.g., works in cold water, removes grease, protects colors), using simple non-technical language",
    "ingredients": [
      {
        "name": "Specific Ingredient Name",
        "inci": "Official INCI Name",
        "percentage": "X.X%",
        "function": "Detailed function in formulation"
      }
    ],
    "instructions": [
      {
        "phase": "Specific Phase Name (e.g., Dry Blending Phase, Liquid Addition)",
        "steps": [
          "Detailed step with specific temperatures and timing",
          "Precise mixing instructions with equipment specifications", 
          "Quality control checkpoints and parameters"
        ]
      }
    ],
    "usageInstructions": "Detailed professional usage instructions with application methods and dosage",
    "phLevel": "Specific pH value or tight range (e.g., 10.2, 9.8)",
    "shelfLife": "Specific shelf life with storage conditions",
    "viscosity": "Specific viscosity measurement or description",
    "storageConditions": "Detailed storage requirements with temperature and humidity",
    "batchSize": "Professional batch size (e.g., 1000 kg, 500 L)",
    "processingTime": "Specific processing time with phases",
    "temperature": "Exact temperature requirements for each phase",
    "equipment": "Professional equipment list with specifications",
    "certification": "Industry certifications and compliance standards",
    "isActive": true
  }

  ENHANCED GUIDELINES:
  - Use authentic detergent ingredients with proper nomenclature
  - Percentages must add up to exactly 100% with realistic proportions
  - Include detergent-specific ingredients (surfactants, builders, enzymes, brighteners)
  - Provide detailed multi-phase manufacturing processes
  - Ensure formulations meet detergent industry standards
  - Include specific technical parameters (pH, viscosity, temperature, time)
  - Make each formulation unique, practical, and production-ready`;
}

function getOralCarePrompt(categoryName: string, productDescription: string): string {
  return `You are a professional oral care formulation expert. Generate a complete oral care formulation for ${categoryName}.

  CRITICAL REQUIREMENTS:
  - MUST contain fluoride compound (0.1-0.3%)
  - MUST include mild abrasive system (20-40%)
  - MUST contain antimicrobial agents (0.1-1%)
  - pH must be 6-9 for oral safety
  - Processing: Room temperature mixing
  - All percentages MUST add up to exactly 100%
  - Must be safe if accidentally swallowed

  Return JSON with complete oral care formulation.`;
}

function getOrganicPrompt(categoryName: string, productDescription: string): string {
  return `You are a professional organic formulation expert. Generate a complete organic/natural formulation for ${categoryName}.

  CRITICAL REQUIREMENTS:
  - MUST use only natural, organic ingredients
  - MUST contain natural preservative system (1-2%)
  - MUST use plant-derived emulsifiers and surfactants
  - pH must be 5-7.5 for natural skin compatibility
  - Processing: Gentle, minimal heat processing
  - All percentages MUST add up to exactly 100%
  - Must be certified organic compliant

  Return JSON with complete organic formulation using natural oils, extracts, and botanicals.`;
}

function getIndustrialPrompt(categoryName: string, productDescription: string): string {
  return `You are a professional industrial chemical formulation expert with expertise in industrial manufacturing. Generate detailed commercial industrial formulations with professional-grade specifications.

  CRITICAL REQUIREMENTS for ${categoryName}:
  - MUST use appropriate industrial-grade solvents and chemicals
  - MUST include anti-corrosive agents for metal protection
  - MUST contain precision cleaning agents
  - pH must be 6-8 for material compatibility
  - Processing: Controlled environment, precise mixing
  - All percentages MUST add up to exactly 100%
  - Must meet industrial safety standards

  Return JSON in this exact format:
  {
    "name": "Product Name",
    "description": "3-4 line professional description that introduces the product's purpose, mentions main function (e.g., protects metals, removes contaminants, provides conductivity), highlights key benefits for end users (e.g., long-lasting protection, industrial-grade performance, chemical resistance), using simple non-technical language",
    "ingredients": [
      {
        "name": "Specific Ingredient Name",
        "inci": "Official INCI Name",
        "percentage": "X.X%",
        "function": "Detailed function in formulation"
      }
    ],
    "instructions": [
      {
        "phase": "Specific Phase Name (e.g., Pre-treatment Phase, Main Processing)",
        "steps": [
          "Detailed step with specific temperatures and timing",
          "Precise mixing instructions with equipment specifications", 
          "Quality control checkpoints and parameters"
        ]
      }
    ],
    "usageInstructions": "Detailed professional usage instructions with application methods and dosage",
    "phLevel": "Specific pH value or tight range (e.g., 7.2, 6.8)",
    "shelfLife": "Specific shelf life with storage conditions",
    "viscosity": "Specific viscosity measurement or description",
    "storageConditions": "Detailed storage requirements with temperature and humidity",
    "batchSize": "Professional batch size (e.g., 1000 kg, 500 L)",
    "processingTime": "Specific processing time with phases",
    "temperature": "Exact temperature requirements for each phase",
    "equipment": "Professional equipment list with specifications",
    "certification": "Industry certifications and compliance standards",
    "isActive": true
  }

  ENHANCED GUIDELINES:
  - Use authentic industrial chemicals with proper nomenclature
  - Percentages must add up to exactly 100% with realistic proportions
  - Include industrial-specific ingredients (solvents, corrosion inhibitors, surfactants)
  - Provide detailed multi-phase manufacturing processes
  - Ensure formulations meet industrial safety and performance standards
  - Include specific technical parameters (pH, viscosity, temperature, time)
  - Make each formulation unique, practical, and production-ready`;
}

function getFoodGradePrompt(categoryName: string, productDescription: string): string {
  return `You are a professional food-grade formulation expert with expertise in industrial manufacturing. Generate detailed commercial food-grade formulations with professional-grade specifications.

  CRITICAL REQUIREMENTS for ${categoryName}:
  - MUST use only FDA-approved, food-grade ingredients
  - MUST contain GRAS (Generally Recognized as Safe) compounds only
  - MUST include appropriate food preservatives
  - pH must be 3-9 depending on application
  - Processing: Food-safe processing temperatures and conditions
  - All percentages MUST add up to exactly 100%
  - Must meet FDA food additive regulations

  Return JSON in this exact format:
  {
    "name": "Product Name",
    "description": "3-4 line professional description that introduces the product's purpose, mentions main function (e.g., enhances flavor, extends shelf life, improves texture), highlights key benefits for end users (e.g., safe for consumption, natural ingredients, meets FDA standards), using simple non-technical language",
    "ingredients": [
      {
        "name": "Specific Ingredient Name",
        "inci": "Official INCI Name",
        "percentage": "X.X%",
        "function": "Detailed function in formulation"
      }
    ],
    "instructions": [
      {
        "phase": "Specific Phase Name (e.g., Mixing Phase, Heat Treatment)",
        "steps": [
          "Detailed step with specific temperatures and timing",
          "Precise mixing instructions with equipment specifications", 
          "Quality control checkpoints and parameters"
        ]
      }
    ],
    "usageInstructions": "Detailed professional usage instructions with application methods and dosage",
    "phLevel": "Specific pH value or tight range (e.g., 4.5, 6.8)",
    "shelfLife": "Specific shelf life with storage conditions",
    "viscosity": "Specific viscosity measurement or description",
    "storageConditions": "Detailed storage requirements with temperature and humidity",
    "batchSize": "Professional batch size (e.g., 500 kg, 1000 L)",
    "processingTime": "Specific processing time with phases",
    "temperature": "Exact temperature requirements for each phase",
    "equipment": "Professional equipment list with specifications",
    "certification": "Industry certifications and compliance standards",
    "isActive": true
  }

  ENHANCED GUIDELINES:
  - Use authentic food-grade ingredients with proper nomenclature
  - Percentages must add up to exactly 100% with realistic proportions
  - Include food-specific ingredients (preservatives, emulsifiers, flavor enhancers)
  - Provide detailed multi-phase manufacturing processes
  - Ensure formulations meet FDA safety and quality standards
  - Include specific technical parameters (pH, viscosity, temperature, time)
  - Make each formulation unique, practical, and production-ready`;
}

// Enhanced generation function with category-specific logic
export async function generateCategorySpecificFormulation(
  categoryName: string, 
  productDescription: string
): Promise<Omit<InsertFormulation, 'categoryId'>> {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY not found, using fallback formulation");
    return getFallbackFormulation(categoryName, productDescription);
  }
  
  const prompt = getCategoryPrompt(categoryName, productDescription);
  
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: prompt + "\n\nIMPORTANT: Return ONLY valid JSON. No explanations, no code fences, just the JSON object."
          },
          {
            role: "user",
            content: `Generate a ${categoryName} formulation for: ${productDescription}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const rawContent = response.choices[0].message.content || "{}";
      console.log(`🔍 AI Raw Response (attempt ${attempts}):`, rawContent.substring(0, 200) + "...");
      
      const result = safeParse(rawContent);
      if (!result) {
        throw new Error(`Failed to parse AI response as JSON: ${rawContent.substring(0, 100)}...`);
      }
      
      // Extract ingredients with explicit array checks
      let ingredients: any[] = Array.isArray(result.ingredients) ? result.ingredients : [];
      
      console.log("🔍 Debug - result keys:", Object.keys(result));
      console.log("🔍 Debug - result.ingredients type:", typeof result.ingredients, "isArray:", Array.isArray(result.ingredients));
      console.log("🔍 Debug - result.formulation type:", typeof result.formulation);
      
      // If no valid ingredients array found, try to extract from nested structures
      if (ingredients.length === 0) {
        // Parse formulation if it's a string
        const formulationObj = typeof result.formulation === 'string' 
          ? safeParse(result.formulation) 
          : result.formulation;
          
        if (formulationObj && typeof formulationObj === 'object') {
          // Try specific nested paths first
          if (Array.isArray(formulationObj.water_phase?.ingredients)) {
            ingredients = formulationObj.water_phase.ingredients;
            console.log("🔍 Found ingredients in water_phase.ingredients:", ingredients.length);
          } else if (Array.isArray(formulationObj.water_phase)) {
            ingredients = formulationObj.water_phase;
            console.log("🔍 Found ingredients in water_phase array:", ingredients.length);
          } else if (Array.isArray(formulationObj.ingredients)) {
            ingredients = formulationObj.ingredients;
            console.log("🔍 Found ingredients in formulation.ingredients:", ingredients.length);
          } else {
            // Flatten all arrays from common phase keys
            const allIngredients = [];
            const phaseKeys = ['water_phase', 'oil_phase', 'cooling_phase', 'main_phase', 'active_phase'];
            
            for (const [key, value] of Object.entries(formulationObj)) {
              if (Array.isArray(value)) {
                allIngredients.push(...value);
                console.log(`🔍 Found ${value.length} ingredients in ${key}`);
              } else if (value && typeof value === 'object' && Array.isArray((value as any).ingredients)) {
                allIngredients.push(...(value as any).ingredients);
                console.log(`🔍 Found ${(value as any).ingredients.length} ingredients in ${key}.ingredients`);
              }
            }
            
            if (allIngredients.length > 0) {
              ingredients = allIngredients;
              console.log("🔍 Total flattened ingredients:", ingredients.length);
            }
          }
        }
        
        // Check for phases array structure (seen in AI response attempt 1)
        if (ingredients.length === 0 && Array.isArray(result.phases)) {
          const phaseIngredients = [];
          for (const phase of result.phases) {
            if (Array.isArray(phase.ingredients)) {
              phaseIngredients.push(...phase.ingredients);
              console.log(`🔍 Found ${phase.ingredients.length} ingredients in phase: ${phase.name}`);
            }
          }
          if (phaseIngredients.length > 0) {
            ingredients = phaseIngredients;
            console.log("🔍 Total ingredients from phases:", ingredients.length);
          }
        }
        
        // Also check if result.ingredients is an object with nested arrays
        if (ingredients.length === 0 && result.ingredients && typeof result.ingredients === 'object') {
          const collected = [];
          for (const [key, value] of Object.entries(result.ingredients)) {
            if (Array.isArray(value)) {
              collected.push(...value);
            } else if (value && typeof value === 'object' && Array.isArray((value as any).ingredients)) {
              collected.push(...(value as any).ingredients);
            }
          }
          if (collected.length > 0) {
            ingredients = collected;
            console.log("🔍 Found ingredients in result.ingredients object:", ingredients.length);
          }
        }
      }
      
      // Ensure ingredients is always an array and normalize format
      if (!Array.isArray(ingredients)) {
        console.warn("⚠️ Ingredients is not an array, falling back to empty array");
        ingredients = [];
      }
      
      // Normalize ingredient format - handle both "name" and "ingredient" fields
      ingredients = ingredients
        .filter((ing: any) => ing && typeof ing === 'object') // Filter out invalid entries
        .map((ing: any) => ({
          name: ing.name || ing.ingredient || 'Unknown Ingredient',
          inci: ing.inci || ing.name || ing.ingredient || '',
          percentage: typeof ing.percentage === 'string' ? ing.percentage : `${ing.percentage || 0}%`,
          function: ing.function || ing.role || 'Active ingredient'
        }));
      
      // Normalize ingredient percentages to exactly 100%
      ingredients = normalizePercentages(ingredients);
      
      // Ensure instructions is always an array
      let instructions = Array.isArray(result.instructions) ? result.instructions : [];
      if (!Array.isArray(instructions)) {
        console.warn("⚠️ Instructions is not an array, falling back to empty array");
        instructions = [];
      }
      
      console.log("🔍 AI Parsed Ingredients:", ingredients?.length || 0, "ingredients");
      console.log("🔍 AI Parsed Instructions:", instructions?.length || 0, "instruction phases");
      
      const formulation = {
        name: result.name || result.product || result.product_type || `Professional ${productDescription}`,
        description: result.description || `High-quality ${productDescription.toLowerCase()}`,
        ingredients: JSON.stringify(ingredients),
        instructions: JSON.stringify(instructions),
        usageInstructions: result.usageInstructions || "",
        phLevel: result.phLevel || "7.0",
        shelfLife: result.shelfLife || "24 months",
        viscosity: result.viscosity || "",
        storageConditions: result.storageConditions || "Cool, dry place",
        batchSize: result.batchSize || "100-500 kg",
        processingTime: result.processingTime || "1-2 hours",
        temperature: result.temperature || "Room temperature",
        equipment: result.equipment || "Standard mixer",
        certification: result.certification || "",
        isActive: result.isActive ?? true
      };

      // Validate the formulation
      const validation = validateFormulation(formulation, categoryName.toLowerCase().replace(/\s+/g, '-'));
      
      if (validation.isValid) {
        console.log(`✅ Generated valid ${categoryName} formulation on attempt ${attempts}`);
        return formulation;
      } else {
        console.log(`❌ Validation failed on attempt ${attempts}:`, validation.errors);
        if (attempts === maxAttempts) {
          // For demo purposes, use fallback instead of throwing error
          console.log(`⚠️ Using fallback formulation for demo after ${maxAttempts} failed attempts`);
          return getFallbackFormulation(categoryName, productDescription);
        }
        // Continue to retry
      }
    } catch (error) {
      console.error(`❌ Generation failed on attempt ${attempts}:`, error);
      if (attempts === maxAttempts) {
        // For demo purposes, use fallback instead of throwing error  
        console.log(`⚠️ Using fallback formulation for demo after generation error`);
        return getFallbackFormulation(categoryName, productDescription);
      }
    }
  }
  
  // If all attempts failed, return fallback formulation for demo
  console.warn(`⚠️ All ${maxAttempts} attempts failed, using fallback formulation`);
  return getFallbackFormulation(categoryName, productDescription);
}