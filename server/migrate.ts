import { db, categoriesTable, formulationsTable } from "./db";
import { count, eq } from "drizzle-orm";
import { MemStorage } from "./storage";
import { FORMULATION_CATEGORIES } from "../client/src/constants/categories";

export async function runMigrations() {
  try {
    console.log("Running database migrations...");

    // First, create tables if they don't exist
    await createTables();

    // Check if tables have data
    const [categoryCount] = await db.select({ count: count() }).from(categoriesTable);
    const [formulationCount] = await db.select({ count: count() }).from(formulationsTable);

    console.log(`Found ${categoryCount.count} categories and ${formulationCount.count} formulations`);

    // Seed the 22 formulation categories if database is empty or missing our categories
    if (categoryCount.count === 0) {
      console.log("Database has no categories, seeding the 22 formulation categories...");

      // Insert the 22 FORMULATION_CATEGORIES
      console.log(`Inserting ${FORMULATION_CATEGORIES.length} formulation categories...`);
      for (const category of FORMULATION_CATEGORIES) {
        const slug = category.id; // Use the id as slug since it's already URL-friendly
        await db.insert(categoriesTable).values({
          name: category.name,
          description: category.description,
          icon: "fas fa-flask", // Default icon for all categories
          image: "/placeholder-category.jpg", // Default placeholder image
          isActive: true,
        });
      }
      console.log("Formulation categories seeded successfully!");
    } else {
      console.log("Categories already exist, checking if category names need updating...");
      await updateCategoryNames();
    }

    // Skip demo formulation seeding for now - the 22 categories are ready for use
    console.log("Categories are ready! Admin can now create formulations through the interface.");

    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

async function createTables() {
  try {
    console.log("Creating database tables...");

    // Create categories table
    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text NOT NULL,
        icon text NOT NULL,
        image text NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create formulations table
    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS formulations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text NOT NULL,
        ph_level text NOT NULL,
        shelf_life text NOT NULL,
        viscosity text,
        storage_conditions text NOT NULL,
        batch_size text NOT NULL,
        processing_time text NOT NULL,
        temperature text NOT NULL,
        equipment text NOT NULL,
        certification text,
        ingredients text NOT NULL,
        instructions text NOT NULL,
        usage_instructions text NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    console.log("Database tables created successfully!");
  } catch (error) {
    console.log("Tables might already exist or creation failed:", error);
    // Continue anyway - tables might already exist
  }
}

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

async function updateCategoryNames() {
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

    console.log(`\nCategory update completed! Updated ${updatedCount} category names.`);
    
    return { success: true, updatedCount };
  } catch (error) {
    console.error("Error updating category names:", error);
    throw error;
  }
}