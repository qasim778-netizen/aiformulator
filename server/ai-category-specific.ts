import OpenAI from "openai";
import type { InsertFormulation } from "@shared/schema";

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
    requiredIngredients: ['protective-wax', 'conditioning-agent'],
    prohibitedIngredients: ['water-damage-agents'],
    phRange: { min: 6, max: 8 },
    processingTime: '30 minutes - 2 hours',
    temperature: 'Room temperature (20-25°C)',
    formType: 'cream/liquid'
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

// Validation function
export function validateFormulation(formulation: any, categoryKey: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const specs = categorySpecs[categoryKey as keyof typeof categorySpecs];
  
  if (!specs) {
    errors.push(`Unknown category: ${categoryKey}`);
    return { isValid: false, errors };
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

  // Check percentage totals
  const totalPercentage = ingredients.reduce((total, ing) => {
    const percentage = parseFloat(ing.percentage?.replace('%', '') || '0');
    return total + percentage;
  }, 0);

  if (Math.abs(totalPercentage - 100) > 1) {
    errors.push(`Ingredients must add up to 100%, got ${totalPercentage.toFixed(1)}%`);
  }

  // Check required ingredients for category
  if (categoryKey === 'glass-cleaners') {
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

  // Check prohibited ingredients for category
  if (categoryKey === 'glass-cleaners' || categoryKey === 'cleaning-products') {
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

  return { isValid: errors.length === 0, errors };
}

// Category-specific prompt generator
export function getCategoryPrompt(categoryName: string, productDescription: string): string {
  const category = categoryName.toLowerCase().replace(/\s+/g, '-');
  
  if (category.includes('glass') || category.includes('cleaning')) {
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

function getCleaningProductPrompt(categoryName: string, productDescription: string): string {
  return `You are a professional cleaning product formulation expert. Generate a complete, professional cleaning formulation for small business manufacturers.

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
        "steps": ["Step 1", "Step 2", "Step 3"]
      }
    ],
    "usageInstructions": "Application instructions for cleaning",
    "phLevel": "8.0-11.0",
    "shelfLife": "24 months",
    "viscosity": "Low/water-like",
    "storageConditions": "Cool, dry place away from direct sunlight",
    "batchSize": "100-1000L",
    "processingTime": "15-30 minutes",
    "temperature": "Room temperature (20-25°C)",
    "equipment": "Standard mixing tank with agitation",
    "certification": "Meets cleaning industry standards",
    "isActive": true
  }

  Example proper glass cleaner ingredients:
  - Isopropyl Alcohol (25-35%) - Primary cleaning solvent
  - Water (55-65%) - Base solvent  
  - Nonionic Surfactant (1-2%) - Cleaning agent
  - Ammonia substitute (2-3%) - Enhanced cleaning
  - Anti-static agent (0.1%) - Dust prevention
  - Dye (trace amounts) - Visual identification`;
}

function getCosmeticPrompt(categoryName: string, productDescription: string): string {
  return `You are a professional cosmetic formulation expert. Generate a complete, professional cosmetic formulation for small business manufacturers.

  REQUIREMENTS for ${categoryName}:
  - MUST contain appropriate preservative system (0.5-1%)
  - MUST include emulsification system if cream/lotion
  - pH must be 4.5-7.5 for skin compatibility
  - Processing: Heat and hold phase at 70-75°C
  - All percentages MUST add up to exactly 100%

  Return JSON with proper cosmetic formulation structure including heating phases, emulsification, and cooling phases.`;
}

function getGenericPrompt(categoryName: string, productDescription: string): string {
  return `You are a professional chemical formulation expert. Generate a complete formulation for ${categoryName}.
  
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
  return `You are a professional gentle formulation expert specializing in ${categoryName}. Generate a complete, gentle formulation for small business manufacturers.

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

  Return JSON with complete gentle formulation including soothing ingredients like aloe vera, chamomile, etc.`;
}

function getDetergentPrompt(categoryName: string, productDescription: string): string {
  return `You are a professional detergent formulation expert. Generate a complete detergent formulation for ${categoryName}.

  CRITICAL REQUIREMENTS:
  - MUST contain effective surfactant system (15-25%)
  - MUST include builders for water hardness (5-15%) 
  - MUST contain enzymes for stain removal (1-3%)
  - pH must be 8-11 for effective cleaning
  - Processing: Room temperature mixing
  - All percentages MUST add up to exactly 100%

  Return JSON with complete detergent formulation including brighteners, anti-redeposition agents, etc.`;
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
  return `You are a professional industrial chemical formulation expert. Generate a complete industrial formulation for ${categoryName}.

  CRITICAL REQUIREMENTS:
  - MUST use appropriate industrial-grade solvents and chemicals
  - MUST include anti-corrosive agents for metal protection
  - MUST contain precision cleaning agents
  - pH must be 6-8 for material compatibility
  - Processing: Controlled environment, precise mixing
  - All percentages MUST add up to exactly 100%
  - Must meet industrial safety standards

  Return JSON with complete industrial formulation.`;
}

function getFoodGradePrompt(categoryName: string, productDescription: string): string {
  return `You are a professional food-grade formulation expert. Generate a complete food-grade formulation for ${categoryName}.

  CRITICAL REQUIREMENTS:
  - MUST use only FDA-approved, food-grade ingredients
  - MUST contain GRAS (Generally Recognized as Safe) compounds only
  - MUST include appropriate food preservatives
  - pH must be 3-9 depending on application
  - Processing: Food-safe processing temperatures and conditions
  - All percentages MUST add up to exactly 100%
  - Must meet FDA food additive regulations

  Return JSON with complete food-grade formulation.`;
}

// Enhanced generation function with category-specific logic
export async function generateCategorySpecificFormulation(
  categoryName: string, 
  productDescription: string
): Promise<Omit<InsertFormulation, 'categoryId'>> {
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
            content: prompt
          },
          {
            role: "user",
            content: `Generate a ${categoryName} formulation for: ${productDescription}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3 // Lower temperature for more consistent results
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      const formulation = {
        name: result.name || `Professional ${productDescription}`,
        description: result.description || `High-quality ${productDescription.toLowerCase()}`,
        ingredients: JSON.stringify(result.ingredients || []),
        instructions: JSON.stringify(result.instructions || []),
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
          throw new Error(`Failed to generate valid formulation after ${maxAttempts} attempts. Errors: ${validation.errors.join(', ')}`);
        }
        // Continue to retry
      }
    } catch (error) {
      console.error(`❌ Generation failed on attempt ${attempts}:`, error);
      if (attempts === maxAttempts) {
        throw error;
      }
    }
  }
  
  throw new Error(`Failed to generate formulation after ${maxAttempts} attempts`);
}