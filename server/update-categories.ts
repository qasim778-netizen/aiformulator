import { db, categoriesTable } from "./db";
import { eq } from "drizzle-orm";
import { FORMULATION_CATEGORIES } from "../client/src/constants/categories";

// Mapping of old category names to new category names
const CATEGORY_NAME_UPDATES = [
  { old: "3D Printing Materials", new: "3D Printing Materials Formulations" },
  { old: "Advanced Agricultural Chemicals", new: "Advanced Agricultural Chemicals Formulations" },
  { old: "Aromatherapy Innovations", new: "Aromatherapy Innovations Formulations" },
  { old: "Automotive Coating Solutions", new: "Automotive Coating Solutions Formulations" },
  { old: "Baby Care", new: "Baby Care Formulations" },
  { old: "Beauty Products", new: "Beauty Products Formulations" },
  { old: "Biodegradable Packaging Solutions", new: "Biodegradable Packaging Solutions Formulations" },
  { old: "Cleaning Products", new: "Cleaning Products Formulations" },
  { old: "Detergent", new: "Detergent Formulations" },
  { old: "Hair Enrichment Solutions", new: "Hair Enrichment Solutions Formulations" },
  { old: "Leather Products", new: "Leather Products Formulations" },
  { old: "Men Care", new: "Men's Care & Style Formulations" },
  { old: "Oral Care", new: "Oral Care Formulations" },
  { old: "Organic Care", new: "Organic Care Products Formulations" },
  { old: "Professional Grooming Essentials", new: "Professional Grooming Essentials Formulations" },
  { old: "Salon Base Innovations", new: "Salon Base Innovations Formulations" },
  { old: "Saloon Hair Treatment", new: "Saloon Hair Treatment Formulations" },
  { old: "Shoe Care", new: "Shoe Care Formulations" },
  { old: "Skin Care", new: "Skin Care Formulations" },
  { old: "Smart Textile Coatings", new: "Smart Textile Coatings Formulations" },
  { old: "Water Treatment Solutions", new: "Water Treatment Solutions Formulations" },
  { old: "Construction Material", new: "Construction Material Formulations" },
  { old: "Pet Care", new: "Pet Care Formulations" }
];

export async function updateCategoryNames() {
  try {
    console.log("Starting category name update...");

    // Get all current categories
    const allCategories = await db.select().from(categoriesTable);
    console.log(`Found ${allCategories.length} existing categories`);

    let updatedCount = 0;

    // Update each category name if it matches our mapping
    for (const update of CATEGORY_NAME_UPDATES) {
      const categoryToUpdate = allCategories.find(cat => cat.name === update.old);
      
      if (categoryToUpdate) {
        console.log(`Updating: "${update.old}" → "${update.new}"`);
        
        await db
          .update(categoriesTable)
          .set({ name: update.new })
          .where(eq(categoriesTable.id, categoryToUpdate.id));
        
        updatedCount++;
      } else {
        console.log(`Category "${update.old}" not found (may already be updated)`);
      }
    }

    // Also ensure descriptions are updated to match FORMULATION_CATEGORIES
    console.log("\nUpdating category descriptions...");
    const updatedCategories = await db.select().from(categoriesTable);
    
    for (const category of updatedCategories) {
      const formCategory = FORMULATION_CATEGORIES.find(fc => fc.name === category.name);
      if (formCategory && category.description !== formCategory.description) {
        console.log(`Updating description for: "${category.name}"`);
        await db
          .update(categoriesTable)
          .set({ description: formCategory.description })
          .where(eq(categoriesTable.id, category.id));
      }
    }

    console.log(`\nUpdate completed! Updated ${updatedCount} category names.`);
    
    // Show final state
    const finalCategories = await db.select({
      name: categoriesTable.name,
      description: categoriesTable.description
    }).from(categoriesTable);
    
    console.log("\nFinal category list:");
    finalCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name}`);
    });

    return { success: true, updatedCount };
  } catch (error) {
    console.error("Error updating category names:", error);
    throw error;
  }
}

// Run the update if this file is executed directly
if (require.main === module) {
  updateCategoryNames()
    .then(() => {
      console.log("Category update completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Category update failed:", error);
      process.exit(1);
    });
}