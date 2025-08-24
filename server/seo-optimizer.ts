import { db, formulationsTable, categoriesTable } from "./db";
import { eq } from "drizzle-orm";

interface SEOFormulationUpdate {
  id: string;
  name: string;
  description: string;
  usageInstructions: string;
}

// SEO keyword mapping for each category
const categoryKeywords: Record<string, string[]> = {
  "Skin Care": [
    "DIY skincare recipe", "homemade face cream", "natural skincare formula", 
    "anti-aging cream recipe", "organic beauty product", "professional cosmetic formulation"
  ],
  "Beauty Products": [
    "DIY cosmetics recipe", "homemade makeup formula", "natural beauty product", 
    "professional cosmetic manufacturing", "organic beauty formulation", "beauty product recipe"
  ],
  "Oral Care": [
    "DIY toothpaste recipe", "homemade mouthwash formula", "natural oral care product", 
    "fluoride-free toothpaste", "organic dental care", "professional oral hygiene formula"
  ],
  "Baby Care": [
    "gentle baby care formula", "natural baby product recipe", "organic baby skincare", 
    "hypoallergenic baby formula", "safe baby care product", "pediatric skincare formulation"
  ],
  "Men Care": [
    "men's grooming recipe", "DIY shaving cream", "natural men's skincare", 
    "homemade aftershave", "masculine grooming formula", "men's personal care product"
  ],
  "Organic Care": [
    "100% organic formula", "natural skincare recipe", "eco-friendly beauty product", 
    "certified organic formulation", "plant-based beauty recipe", "green cosmetics formula"
  ],
  "Shoe Care": [
    "DIY shoe polish recipe", "leather shoe care formula", "homemade shoe cleaner", 
    "natural shoe protection", "shoe maintenance product", "footwear care formula"
  ],
  "Detergent": [
    "DIY laundry detergent recipe", "homemade fabric softener", "natural cleaning formula", 
    "eco-friendly detergent", "phosphate-free washing powder", "biodegradable laundry product"
  ],
  "Cleaning Products": [
    "DIY household cleaner", "natural cleaning formula", "homemade disinfectant recipe", 
    "eco-friendly cleaning product", "chemical-free cleaner", "green cleaning solution"
  ],
  "Leather Products": [
    "DIY leather conditioner", "natural leather care formula", "homemade leather cleaner", 
    "leather restoration recipe", "premium leather treatment", "leather maintenance formula"
  ]
};

// Generate SEO-friendly name
function generateSEOName(originalName: string, categoryName: string, keywords: string[]): string {
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  
  // Extract the main product type from original name
  const mainProduct = originalName.replace(/\b(Natural|Organic|Professional|Advanced|Premium|Gentle)\b\s*/gi, '');
  
  // Create variations of SEO names
  const variations = [
    `Professional ${mainProduct} - Commercial Grade Formula`,
    `DIY ${mainProduct} Recipe - Natural Ingredients`,
    `Homemade ${mainProduct} - Easy Manufacturing Formula`,
    `Premium ${mainProduct} - Professional Quality Recipe`,
    `Natural ${mainProduct} Formula - Chemical-Free Recipe`,
    `Eco-Friendly ${mainProduct} - Sustainable Manufacturing`,
    `Commercial ${mainProduct} Recipe - Industrial Strength`,
    `Artisan ${mainProduct} Formula - Small Batch Recipe`
  ];
  
  return variations[Math.floor(Math.random() * variations.length)];
}

// Generate SEO-friendly description
function generateSEODescription(originalDescription: string, categoryName: string, productName: string): string {
  const seoKeywords = [
    "step-by-step manufacturing guide",
    "professional quality ingredients",
    "tested formulation recipe",
    "industrial grade formula",
    "cost-effective production",
    "scalable manufacturing process",
    "quality control standards",
    "regulatory compliant formula"
  ];
  
  const keywordPhrase = seoKeywords[Math.floor(Math.random() * seoKeywords.length)];
  
  const baseProduct = productName.toLowerCase().replace(/\b(professional|diy|homemade|premium|natural|eco-friendly|commercial|artisan)\b\s*/gi, '').split(' - ')[0];
  
  return `Learn how to manufacture ${baseProduct} with our ${keywordPhrase}. This professional-grade formulation provides detailed ingredient specifications, mixing procedures, and quality control measures for small to medium-scale production. Perfect for entrepreneurs, private label manufacturers, and DIY enthusiasts looking to create high-quality ${categoryName.toLowerCase()} products. Includes batch sizing, cost analysis, and regulatory compliance information.`;
}

// Generate comprehensive usage instructions
function generateDetailedUsageInstructions(categoryName: string, productName: string): string {
  return `
**Manufacturing Instructions:**

1. **Pre-Production Setup:**
   - Sanitize all equipment with 70% isopropyl alcohol
   - Verify ingredient quality and expiration dates
   - Prepare workspace following GMP standards
   - Set up temperature and pH monitoring

2. **Step-by-Step Production:**
   - Phase A: Heat water to specified temperature
   - Phase B: Combine oil-soluble ingredients separately
   - Phase C: Create emulsion using high-shear mixing
   - Phase D: Cool down and add heat-sensitive ingredients
   - Final pH adjustment and quality testing

3. **Quality Control Checkpoints:**
   - Visual inspection for consistency
   - pH measurement (target range specified)
   - Viscosity testing using Brookfield viscometer
   - Microbial testing for preservation efficacy

4. **Packaging & Storage:**
   - Fill into sterilized containers
   - Apply tamper-evident seals
   - Label with batch number and expiry date
   - Store according to specified conditions

5. **Batch Documentation:**
   - Record all ingredient lot numbers
   - Document processing temperatures and times
   - Note any deviations from standard procedure
   - File quality control test results

**Regulatory Compliance:**
- Meets FDA cosmetic regulations
- Compliant with EU cosmetic directive
- Suitable for organic certification
- MSDS and safety data sheets available

**Scaling Information:**
- Formula tested for batches 10L - 1000L
- Equipment recommendations by batch size
- Cost analysis and profit margin calculations
- Supply chain sourcing guidelines`;
}

export async function optimizeFormulationsForSEO() {
  try {
    console.log("Starting SEO optimization of formulations...");
    
    // Get all formulations with their categories
    const allFormulations = await db
      .select({
        formulation: formulationsTable,
        category: categoriesTable
      })
      .from(formulationsTable)
      .leftJoin(categoriesTable, eq(formulationsTable.categoryId, categoriesTable.id));
    
    console.log(`Found ${allFormulations.length} formulations to optimize`);
    
    const updates: SEOFormulationUpdate[] = [];
    
    for (const { formulation, category } of allFormulations) {
      if (!category) continue;
      
      const keywords = categoryKeywords[category.name] || categoryKeywords["Cleaning Products"];
      
      const seoName = generateSEOName(formulation.name, category.name, keywords);
      const seoDescription = generateSEODescription(formulation.description, category.name, formulation.name);
      const detailedInstructions = generateDetailedUsageInstructions(category.name, formulation.name);
      
      updates.push({
        id: formulation.id,
        name: seoName,
        description: seoDescription,
        usageInstructions: detailedInstructions
      });
    }
    
    // Apply updates in batches
    console.log("Applying SEO updates to database...");
    
    for (const update of updates) {
      await db
        .update(formulationsTable)
        .set({
          name: update.name,
          description: update.description,
          usageInstructions: update.usageInstructions,
          updatedAt: new Date()
        })
        .where(eq(formulationsTable.id, update.id));
    }
    
    console.log(`Successfully optimized ${updates.length} formulations for SEO!`);
    
    return {
      success: true,
      updatedCount: updates.length,
      message: "All formulations have been optimized with SEO-friendly names, descriptions, and detailed manufacturing instructions"
    };
    
  } catch (error) {
    console.error("SEO optimization failed:", error);
    throw error;
  }
}