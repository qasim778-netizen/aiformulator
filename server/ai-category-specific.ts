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
  } else if (category.includes('cosmetic') || category.includes('skincare')) {
    return getCosmeticPrompt(categoryName, productDescription);
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
  
  REQUIREMENTS:
  - All percentages MUST add up to exactly 100%
  - Use appropriate ingredients for the category
  - Include realistic processing parameters
  
  Return JSON with complete formulation details.`;
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