import { db, categoriesTable, formulationsTable } from "./db";
import { count } from "drizzle-orm";
import { MemStorage } from "./storage";

export async function runMigrations() {
  try {
    console.log("Running database migrations...");

    // First, create tables if they don't exist
    await createTables();

    // Check if tables have data
    const [categoryCount] = await db.select({ count: count() }).from(categoriesTable);
    const [formulationCount] = await db.select({ count: count() }).from(formulationsTable);

    console.log(`Found ${categoryCount.count} categories and ${formulationCount.count} formulations`);

    // Only seed data if database is empty
    if (categoryCount.count === 0 && formulationCount.count === 0) {
      console.log("Database is empty, seeding initial data...");

      // Create temporary in-memory storage to get demo data
      const tempStorage = new MemStorage();
      const tempCategories = await tempStorage.getCategories();
      const tempFormulations = await tempStorage.getFormulations();

      // Insert categories
      console.log(`Inserting ${tempCategories.length} categories...`);
      for (const category of tempCategories) {
        await db.insert(categoriesTable).values({
          name: category.name,
          description: category.description,
          icon: category.icon,
          image: category.image,
          isActive: category.isActive,
        });
      }

      // Insert formulations
      console.log(`Inserting ${tempFormulations.length} formulations...`);
      for (const formulation of tempFormulations) {
        await db.insert(formulationsTable).values({
          categoryId: formulation.categoryId,
          name: formulation.name,
          slug: formulation.slug || formulation.name.toLowerCase().replace(/\s+/g, '-'),
          description: formulation.description,
          metaDescription: formulation.metaDescription || formulation.description?.slice(0, 160),
          keywords: formulation.keywords,
          image: formulation.image,
          phLevel: formulation.phLevel,
          shelfLife: formulation.shelfLife,
          viscosity: formulation.viscosity,
          storageConditions: formulation.storageConditions,
          batchSize: formulation.batchSize,
          processingTime: formulation.processingTime,
          temperature: formulation.temperature,
          equipment: formulation.equipment,
          certification: formulation.certification,
          ingredients: formulation.ingredients,
          instructions: formulation.instructions,
          usageInstructions: formulation.usageInstructions,
          isActive: formulation.isActive,
        });
      }

      console.log("Database seeding completed successfully!");
    } else {
      console.log("Database already contains data, skipping seeding.");
    }

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