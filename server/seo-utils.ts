import { InsertFormulation, InsertCategory } from '../shared/schema';

/**
 * Generate SEO-friendly URL slug from formulation name
 */
export function generateSEOSlug(name: string, categoryName: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Return only the base slug without category name
  return baseSlug;
}

/**
 * Generate SEO meta description (max 160 characters)
 */
export function generateMetaDescription(name: string, categoryName: string, description: string): string {
  const baseDescription = `Professional ${name} formulation for ${categoryName.toLowerCase()}. Complete manufacturing guide with ingredients, instructions, and quality control. Perfect for small business production.`;
  
  // Truncate to 160 characters if needed
  return baseDescription.length > 160 
    ? baseDescription.substring(0, 157) + '...'
    : baseDescription;
}

/**
 * Generate SEO keywords from formulation data
 */
export function generateSEOKeywords(name: string, categoryName: string, ingredients: any[]): string {
  const keywords = [];
  
  // Base keywords
  keywords.push(name.toLowerCase().replace(/[^a-z0-9\s]/g, ''));
  keywords.push(`${categoryName.toLowerCase()} formula`);
  keywords.push(`${categoryName.toLowerCase()} formulation`);
  keywords.push('manufacturing guide');
  keywords.push('chemical formula');
  keywords.push('professional recipe');
  
  // Extract main ingredients
  if (ingredients && Array.isArray(ingredients)) {
    ingredients.slice(0, 3).forEach(ingredient => {
      if (ingredient.name) {
        keywords.push(ingredient.name.toLowerCase());
      }
    });
  }
  
  // Product-specific keywords
  const productKeywords = [
    'DIY recipe',
    'commercial production',
    'small batch',
    'quality control',
    'ingredient list',
    'step by step guide'
  ];
  
  keywords.push(...productKeywords);
  
  // Remove duplicates and join
  const uniqueKeywords = Array.from(new Set(keywords));
  return uniqueKeywords.join(', ');
}

/**
 * Enhanced formulation generation with SEO fields
 */
export function addSEOFields(
  formulation: Omit<InsertFormulation, 'slug' | 'metaDescription' | 'keywords'>, 
  categoryName: string
): InsertFormulation {
  const ingredients = JSON.parse(formulation.ingredients || '[]');
  
  return {
    ...formulation,
    slug: generateSEOSlug(formulation.name, categoryName),
    metaDescription: generateMetaDescription(formulation.name, categoryName, formulation.description),
    keywords: generateSEOKeywords(formulation.name, categoryName, ingredients)
  };
}

/**
 * Generate structured data (JSON-LD) for formulation pages
 */
export function generateStructuredData(formulation: any, categoryName: string, baseUrl: string) {
  const ingredients = JSON.parse(formulation.ingredients || '[]');
  
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": formulation.name,
    "description": formulation.metaDescription || formulation.description,
    "image": formulation.image || `${baseUrl}/images/default-formulation.jpg`,
    "author": {
      "@type": "Organization",
      "name": "AIFormulator"
    },
    "datePublished": formulation.createdAt,
    "dateModified": formulation.updatedAt,
    "prepTime": formulation.processingTime || "PT2H",
    "cookTime": "PT0M",
    "totalTime": formulation.processingTime || "PT2H",
    "recipeCategory": categoryName,
    "recipeCuisine": "Chemical Formulation",
    "recipeYield": formulation.batchSize || "1000ml",
    "keywords": formulation.keywords,
    "recipeIngredient": ingredients.map((ing: any) => `${ing.percentage} ${ing.name}`),
    "recipeInstructions": JSON.parse(formulation.instructions || '[]').flatMap((phase: any) => 
      phase.steps.map((step: string, index: number) => ({
        "@type": "HowToStep",
        "position": index + 1,
        "text": step
      }))
    ),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "12"
    }
  };
}

/**
 * Generate SEO-friendly URL slug from category name
 */
export function generateCategorySEOSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate SEO meta description for category
 */
export function generateCategoryMetaDescription(name: string, description: string): string {
  const baseDescription = `Explore professional ${name.toLowerCase()} formulations. ${description} Complete manufacturing guides, ingredients, and instructions for small business production.`;
  
  // Truncate to 160 characters if needed
  return baseDescription.length > 160 
    ? baseDescription.substring(0, 157) + '...'
    : baseDescription;
}

/**
 * Generate SEO keywords for category
 */
export function generateCategorySEOKeywords(name: string, description: string): string {
  const keywords = [];
  
  // Base keywords
  keywords.push(name.toLowerCase());
  keywords.push(`${name.toLowerCase()} formulations`);
  keywords.push(`${name.toLowerCase()} formulas`);
  keywords.push(`${name.toLowerCase()} manufacturing`);
  keywords.push('chemical formulation');
  keywords.push('professional recipes');
  keywords.push('manufacturing guide');
  keywords.push('small business production');
  
  return keywords.join(', ');
}