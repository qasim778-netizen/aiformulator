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
        const slug = generateCategorySlugFromName(category.name);
        await db.insert(categoriesTable).values({
          name: category.name,
          slug: slug,
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

    // Create categories table with all required fields
    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        slug text,
        description text NOT NULL,
        meta_description text,
        keywords text,
        icon text NOT NULL,
        image text NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create formulations table with all required fields
    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS formulations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        name text NOT NULL,
        slug text,
        description text NOT NULL,
        seo_title text,
        meta_description text,
        keywords text,
        image text,
        image_alt text,
        image_filename text,
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
    console.log("Starting comprehensive category name and slug reconciliation...");

    // Get all current categories
    const allCategories = await db.select().from(categoriesTable);
    console.log(`Found ${allCategories.length} existing categories`);

    let nameUpdatedCount = 0;
    let slugUpdatedCount = 0;

    // Step 1: Update category names by exact name match
    console.log("\n=== Step 1: Updating category names by exact match ===");
    for (const update of CATEGORY_NAME_UPDATES) {
      const categoryToUpdate = allCategories.find(cat => cat.name === update.old);
      
      if (categoryToUpdate) {
        console.log(`Updating name: "${update.old}" → "${update.new}"`);
        
        const newSlug = generateCategorySlugFromName(update.new);
        console.log(`  Updating slug: "${categoryToUpdate.slug || 'null'}" → "${newSlug}"`);
        
        await db
          .update(categoriesTable)
          .set({ 
            name: update.new,
            slug: newSlug 
          })
          .where(eq(categoriesTable.id, categoryToUpdate.id));
        
        nameUpdatedCount++;
      }
    }

    // Step 2: Fallback - find categories by old slug if name lookup failed
    console.log("\n=== Step 2: Fallback lookup by old slug patterns ===");
    for (const update of CATEGORY_NAME_UPDATES) {
      const oldSlug = generateCategorySlugFromName(update.old);
      const categoryBySlug = allCategories.find(cat => cat.slug === oldSlug && cat.name !== update.new);
      
      if (categoryBySlug) {
        console.log(`Found by old slug "${oldSlug}": updating "${categoryBySlug.name}" → "${update.new}"`);
        
        const newSlug = generateCategorySlugFromName(update.new);
        console.log(`  Updating slug: "${categoryBySlug.slug}" → "${newSlug}"`);
        
        await db
          .update(categoriesTable)
          .set({ 
            name: update.new,
            slug: newSlug 
          })
          .where(eq(categoriesTable.id, categoryBySlug.id));
        
        nameUpdatedCount++;
      }
    }

    // Step 3: General slug reconciliation - fix any mismatched slugs
    console.log("\n=== Step 3: General slug reconciliation ===");
    const finalCategories = await db.select().from(categoriesTable);
    
    for (const category of finalCategories) {
      const expectedSlug = generateCategorySlugFromName(category.name);
      
      if (!category.slug || category.slug !== expectedSlug) {
        console.log(`Reconciling slug for "${category.name}": "${category.slug || 'null'}" → "${expectedSlug}"`);
        
        await db
          .update(categoriesTable)
          .set({ slug: expectedSlug })
          .where(eq(categoriesTable.id, category.id));
        
        slugUpdatedCount++;
      }
    }

    // Step 4: Update descriptions to match FORMULATION_CATEGORIES
    console.log("\n=== Step 4: Updating category descriptions ===");
    const reconciledCategories = await db.select().from(categoriesTable);
    
    for (const category of reconciledCategories) {
      const formCategory = FORMULATION_CATEGORIES.find(fc => fc.name === category.name);
      if (formCategory && category.description !== formCategory.description) {
        console.log(`Updating description for: "${category.name}"`);
        await db
          .update(categoriesTable)
          .set({ description: formCategory.description })
          .where(eq(categoriesTable.id, category.id));
      }
    }

    console.log(`\n✅ Category reconciliation completed!`);
    console.log(`   Names updated: ${nameUpdatedCount}`);
    console.log(`   Slugs reconciled: ${slugUpdatedCount}`);
    
    // Show final state for verification
    console.log("\n=== Final category state ===");
    const finalState = await db.select({
      name: categoriesTable.name,
      slug: categoriesTable.slug
    }).from(categoriesTable);
    
    finalState.forEach((cat, index) => {
      console.log(`${index + 1}. "${cat.name}" → slug: "${cat.slug}"`);
    });
    
    return { success: true, nameUpdatedCount, slugUpdatedCount };
  } catch (error) {
    console.error("Error updating category names and slugs:", error);
    throw error;
  }
}

function generateCategorySlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}