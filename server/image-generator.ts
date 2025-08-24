import { db, formulationsTable, categoriesTable } from "./db";
import { eq } from "drizzle-orm";

interface FormulationImagePrompt {
  formulation: any;
  category: any;
  imagePrompt: string;
  altText: string;
  filename: string;
}

// Category-specific icons and design elements
const categoryIcons: Record<string, string> = {
  "Skin Care": "skincare bottles and cream jars with botanical elements",
  "Beauty Products": "makeup brushes, lipstick, and cosmetic containers", 
  "Oral Care": "toothbrush and dental care products",
  "Baby Care": "baby bottle and gentle care items",
  "Men Care": "razor, aftershave bottle, and masculine grooming products",
  "Organic Care": "organic leaves, natural ingredients, and eco symbols",
  "Shoe Care": "leather shoes and polish bottles",
  "Detergent": "washing machine and laundry products",
  "Cleaning Products": "spray bottles and cleaning supplies",
  "Leather Products": "leather goods and conditioning products"
};

// Generate SEO-friendly filename
function generateSEOFilename(formulation: any, category: any): string {
  const categorySlug = category.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const productSlug = formulation.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${categorySlug}-${productSlug}-chemical-formulation-guide`;
}

// Generate SEO-optimized alt text
function generateAltText(formulation: any, category: any): string {
  const productType = formulation.name.split(' - ')[0];
  return `Professional ${productType} manufacturing guide for ${category.name} - Complete chemical formulation with ingredients, procedures, and quality control specifications`;
}

// Generate detailed image prompt
function generateImagePrompt(formulation: any, category: any): string {
  const icon = categoryIcons[category.name] || "chemical laboratory equipment";
  const productType = formulation.name.split(' - ')[0];
  
  return `Professional product guide design for "${productType}" in ${category.name} category. 
  
  Design elements:
  - Modern gradient background in professional blue and purple colors
  - Company logo "CFS" in circle with "Chemical Formula Services" text
  - Main title: "${category.name}" in large, bold navy text
  - Subtitle: "Product Making Guide" in white text on blue banner
  - Central icon: ${icon} in purple circular background
  - Side panel with bullet points:
    • Professional Formula Recipe
    • Ingredient Specifications  
    • Step-by-Step Procedures
    • Quality Control Standards
    • Industrial Requirements
    • Technical Documentation
  - Bottom text: "www.chemicalformulaservices.com"
  - Clean, professional layout with modern typography
  - High contrast for readability
  - Optimized for web display and social sharing
  - Similar style to professional chemical industry marketing materials`;
}

export async function generateFormulationImages(): Promise<{ success: boolean; generated: number; message: string }> {
  try {
    console.log("🎨 Starting formulation image generation...");
    
    // Get all formulations with their categories
    const formulations = await db
      .select({
        formulation: formulationsTable,
        category: categoriesTable
      })
      .from(formulationsTable)
      .leftJoin(categoriesTable, eq(formulationsTable.categoryId, categoriesTable.id));
    
    console.log(`Found ${formulations.length} formulations to generate images for`);
    
    const imagePrompts: FormulationImagePrompt[] = [];
    
    for (const { formulation, category } of formulations) {
      if (!category) continue;
      
      const filename = generateSEOFilename(formulation, category);
      const altText = generateAltText(formulation, category);
      const imagePrompt = generateImagePrompt(formulation, category);
      
      imagePrompts.push({
        formulation,
        category, 
        imagePrompt,
        altText,
        filename
      });
    }
    
    console.log("📋 Generated image prompts and metadata for all formulations");
    console.log("🚀 Ready to generate images with AI image generation tool");
    
    return {
      success: true,
      generated: imagePrompts.length,
      message: `Generated ${imagePrompts.length} SEO-optimized image prompts for formulations. Images include professional design, category-specific icons, and optimized filenames/alt-text for Google Images ranking.`
    };
    
  } catch (error) {
    console.error("Image generation preparation failed:", error);
    throw error;
  }
}

// Add image field to formulations table
export async function addImageFieldToFormulations() {
  try {
    console.log("🔧 Adding image field to formulations table...");
    
    await db.execute(`
      ALTER TABLE formulations 
      ADD COLUMN IF NOT EXISTS image_url text,
      ADD COLUMN IF NOT EXISTS image_alt text,
      ADD COLUMN IF NOT EXISTS image_filename text
    `);
    
    console.log("✅ Image fields added to formulations table");
    
  } catch (error) {
    console.error("Failed to add image fields:", error);
    throw error;
  }
}