import { db, categoriesTable, formulationsTable } from "./db";
import { count } from "drizzle-orm";
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
      console.log("Categories already exist, skipping category seeding.");
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