import { db, categoriesTable, formulationsTable, wizardCategoriesTable, wizardProductTypesTable, wizardBaseTypesTable, wizardCategoryBaseTypesTable, generatedFormulasTable, formulaGenerationFailuresTable } from "./db";
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

    // Seed wizard data (idempotent)
    await seedWizardData();

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

    // Create formulation_content table for admin-managed custom page content
    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS formulation_content (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        formulation_id uuid NOT NULL UNIQUE REFERENCES formulations(id) ON DELETE CASCADE,
        overview_title text,
        overview_content text,
        benefits_title text,
        benefits_content text,
        applications_title text,
        applications_content text,
        usage_title text,
        usage_content text,
        safety_title text,
        safety_content text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create sample_products table for homepage showcase
    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS sample_products (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text NOT NULL,
        image text NOT NULL,
        link text NOT NULL,
        category text NOT NULL DEFAULT 'General',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create users table for authentication
    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        first_name text,
        last_name text,
        country text,
        is_admin boolean NOT NULL DEFAULT false,
        reset_token text,
        reset_token_expires_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    // ── Wizard tables ────────────────────────────────────────────────────────
    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS wizard_categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        slug text NOT NULL UNIQUE,
        icon text,
        is_active boolean NOT NULL DEFAULT true
      )
    `);

    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS wizard_product_types (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id uuid NOT NULL REFERENCES wizard_categories(id) ON DELETE CASCADE,
        subcategory_name text,
        name text NOT NULL,
        slug text NOT NULL,
        is_active boolean NOT NULL DEFAULT true
      )
    `);

    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS wizard_base_types (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        slug text NOT NULL UNIQUE
      )
    `);

    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS wizard_category_base_types (
        category_id uuid NOT NULL REFERENCES wizard_categories(id) ON DELETE CASCADE,
        base_type_id uuid NOT NULL REFERENCES wizard_base_types(id) ON DELETE CASCADE,
        sort_order integer NOT NULL DEFAULT 0,
        PRIMARY KEY (category_id, base_type_id)
      )
    `);

    // Database Builder tables (feature chips, safety notes, prompt rules)
    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS wizard_feature_chips (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id uuid NOT NULL REFERENCES wizard_categories(id) ON DELETE CASCADE,
        name text NOT NULL,
        slug text NOT NULL,
        is_active boolean NOT NULL DEFAULT true
      )
    `);

    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS wizard_safety_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id uuid NOT NULL REFERENCES wizard_categories(id) ON DELETE CASCADE,
        content text NOT NULL,
        is_active boolean NOT NULL DEFAULT true
      )
    `);

    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS wizard_prompt_rules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id uuid NOT NULL REFERENCES wizard_categories(id) ON DELETE CASCADE,
        content text NOT NULL,
        is_active boolean NOT NULL DEFAULT true
      )
    `);

    // ── Formula cache tables ──────────────────────────────────────────────────
    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS generated_formulas (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        formula_key text NOT NULL UNIQUE,
        formula_key_version integer NOT NULL DEFAULT 1,
        input_json jsonb NOT NULL,
        output_json jsonb NOT NULL,
        source text NOT NULL DEFAULT 'openai',
        model text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        usage_count integer NOT NULL DEFAULT 1,
        last_used_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS formula_generation_failures (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        input_json jsonb NOT NULL,
        formula_key text,
        error_message text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    // Add new columns to users table if they don't exist yet
    await db.execute(/* sql */ `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS login_provider text DEFAULT 'email';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamp;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id varchar UNIQUE;
      ALTER TABLE users ALTER COLUMN password SET DEFAULT '';
    `);

    await db.execute(/* sql */ `
      CREATE TABLE IF NOT EXISTS api_usage_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar,
        user_email text,
        user_name text,
        user_country text,
        model text NOT NULL DEFAULT 'gpt-4o',
        input_tokens integer NOT NULL DEFAULT 0,
        output_tokens integer NOT NULL DEFAULT 0,
        total_tokens integer NOT NULL DEFAULT 0,
        estimated_cost text NOT NULL DEFAULT '0.000000',
        cache_hit boolean NOT NULL DEFAULT false,
        product_name text,
        product_type text,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    console.log("Database tables created successfully!");
  } catch (error) {
    console.log("Tables might already exist or creation failed:", error);
    // Continue anyway - tables might already exist
  }
}

async function seedWizardData() {
  try {
    const existing = await db.select({ c: count() }).from(wizardCategoriesTable);
    if (Number(existing[0].c) > 0) {
      console.log("Wizard data already seeded, skipping.");
      return;
    }

    console.log("Seeding wizard data...");

    // ── Categories ────────────────────────────────────────────────────────────
    const cats = await db.insert(wizardCategoriesTable).values([
      { name: "Paint & Coatings",     slug: "paint-coatings" },
      { name: "Cleaning Products",    slug: "cleaning-products" },
      { name: "Personal Care",        slug: "personal-care" },
      { name: "Industrial Chemicals", slug: "industrial-chemicals" },
      { name: "Auto Care",            slug: "auto-care" },
      { name: "Pet Care",             slug: "pet-care" },
    ]).returning();

    const catId = (slug: string) => cats.find(c => c.slug === slug)!.id;

    // ── Product Types ─────────────────────────────────────────────────────────
    await db.insert(wizardProductTypesTable).values([
      // Paint & Coatings
      { categoryId: catId("paint-coatings"), name: "Interior Wall Paint",   slug: "interior-wall-paint" },
      { categoryId: catId("paint-coatings"), name: "Exterior Paint",        slug: "exterior-paint" },
      { categoryId: catId("paint-coatings"), name: "Anti-Rust Metal Paint", slug: "anti-rust-metal-paint" },
      { categoryId: catId("paint-coatings"), name: "Wood Coating",          slug: "wood-coating" },
      { categoryId: catId("paint-coatings"), name: "Floor Paint",           slug: "floor-paint" },
      { categoryId: catId("paint-coatings"), name: "Powder Coating",        slug: "powder-coating" },
      { categoryId: catId("paint-coatings"), name: "Primer",                slug: "primer" },
      { categoryId: catId("paint-coatings"), name: "Varnish",               slug: "varnish" },

      // Cleaning Products
      { categoryId: catId("cleaning-products"), name: "All Purpose Cleaner",       slug: "all-purpose-cleaner" },
      { categoryId: catId("cleaning-products"), name: "Glass Cleaner",             slug: "glass-cleaner" },
      { categoryId: catId("cleaning-products"), name: "Floor Cleaner",             slug: "floor-cleaner" },
      { categoryId: catId("cleaning-products"), name: "Kitchen Cleaner",           slug: "kitchen-cleaner" },
      { categoryId: catId("cleaning-products"), name: "Bathroom Cleaner",          slug: "bathroom-cleaner" },
      { categoryId: catId("cleaning-products"), name: "Disinfectant",              slug: "disinfectant" },
      { categoryId: catId("cleaning-products"), name: "Degreaser",                 slug: "degreaser" },
      { categoryId: catId("cleaning-products"), name: "Toilet Bowl Cleaner",       slug: "toilet-bowl-cleaner" },
      { categoryId: catId("cleaning-products"), name: "Carpet & Upholstery Cleaner", slug: "carpet-upholstery-cleaner" },
      { categoryId: catId("cleaning-products"), name: "Custom Cleaner",            slug: "custom-cleaner" },

      // Personal Care
      { categoryId: catId("personal-care"), name: "Shampoo",         slug: "shampoo" },
      { categoryId: catId("personal-care"), name: "Conditioner",     slug: "conditioner" },
      { categoryId: catId("personal-care"), name: "Body Lotion",     slug: "body-lotion" },
      { categoryId: catId("personal-care"), name: "Face Moisturizer",slug: "face-moisturizer" },
      { categoryId: catId("personal-care"), name: "Face Wash",       slug: "face-wash" },
      { categoryId: catId("personal-care"), name: "Sunscreen",       slug: "sunscreen" },
      { categoryId: catId("personal-care"), name: "Body Wash",       slug: "body-wash" },
      { categoryId: catId("personal-care"), name: "Deodorant",       slug: "deodorant" },
      { categoryId: catId("personal-care"), name: "Hair Serum",      slug: "hair-serum" },
      { categoryId: catId("personal-care"), name: "Lip Balm",        slug: "lip-balm" },

      // Industrial Chemicals
      { categoryId: catId("industrial-chemicals"), name: "Solvent Cleaner",  slug: "solvent-cleaner" },
      { categoryId: catId("industrial-chemicals"), name: "Rust Inhibitor",   slug: "rust-inhibitor" },
      { categoryId: catId("industrial-chemicals"), name: "Industrial Adhesive", slug: "industrial-adhesive" },
      { categoryId: catId("industrial-chemicals"), name: "Lubricant",        slug: "lubricant" },
      { categoryId: catId("industrial-chemicals"), name: "Cutting Fluid",    slug: "cutting-fluid" },
      { categoryId: catId("industrial-chemicals"), name: "Concrete Sealer",  slug: "concrete-sealer" },
      { categoryId: catId("industrial-chemicals"), name: "Epoxy Coating",    slug: "epoxy-coating" },
      { categoryId: catId("industrial-chemicals"), name: "pH Adjuster",      slug: "ph-adjuster" },

      // Auto Care
      { categoryId: catId("auto-care"), name: "Car Wash Shampoo",     slug: "car-wash-shampoo" },
      { categoryId: catId("auto-care"), name: "Wheel Cleaner",        slug: "wheel-cleaner" },
      { categoryId: catId("auto-care"), name: "Dashboard Polish",     slug: "dashboard-polish" },
      { categoryId: catId("auto-care"), name: "Wax & Sealant",        slug: "wax-sealant" },
      { categoryId: catId("auto-care"), name: "Engine Degreaser",     slug: "engine-degreaser" },
      { categoryId: catId("auto-care"), name: "Tire Dressing",        slug: "tire-dressing" },
      { categoryId: catId("auto-care"), name: "Glass Treatment",      slug: "glass-treatment" },
      { categoryId: catId("auto-care"), name: "Paint Scratch Remover",slug: "paint-scratch-remover" },

      // Pet Care
      { categoryId: catId("pet-care"), name: "Pet Shampoo",          slug: "pet-shampoo" },
      { categoryId: catId("pet-care"), name: "Pet Conditioner",      slug: "pet-conditioner" },
      { categoryId: catId("pet-care"), name: "Pet Odor Eliminator",  slug: "pet-odor-eliminator" },
      { categoryId: catId("pet-care"), name: "Flea & Tick Treatment",slug: "flea-tick-treatment" },
      { categoryId: catId("pet-care"), name: "Pet Skin Spray",       slug: "pet-skin-spray" },
      { categoryId: catId("pet-care"), name: "Pet Dental Rinse",     slug: "pet-dental-rinse" },
    ]);

    // ── Base Types ────────────────────────────────────────────────────────────
    const bts = await db.insert(wizardBaseTypesTable).values([
      { name: "Water-Based",         slug: "water-based" },
      { name: "Solvent-Based",       slug: "solvent-based" },
      { name: "Solvent-Less",        slug: "solvent-less" },
      { name: "Oil-Based",           slug: "oil-based" },
      { name: "Alcohol-Based",       slug: "alcohol-based" },
      { name: "Concentrate",         slug: "concentrate" },
      { name: "Polymer-Based",       slug: "polymer-based" },
      { name: "Hybrid / Other",      slug: "hybrid-other" },
      { name: "Powder System",       slug: "powder-system" },
      { name: "Wax-Based",           slug: "wax-based" },
      { name: "Natural / Plant-Based", slug: "natural-plant-based" },
      { name: "Alcohol-Free",        slug: "alcohol-free" },
    ]).returning();

    const btId = (slug: string) => bts.find(b => b.slug === slug)!.id;

    // ── Category ↔ Base Type Mappings ─────────────────────────────────────────
    await db.insert(wizardCategoryBaseTypesTable).values([
      // Paint & Coatings
      { categoryId: catId("paint-coatings"), baseTypeId: btId("water-based"),   sortOrder: 0 },
      { categoryId: catId("paint-coatings"), baseTypeId: btId("solvent-based"), sortOrder: 1 },
      { categoryId: catId("paint-coatings"), baseTypeId: btId("powder-system"), sortOrder: 2 },

      // Cleaning Products
      { categoryId: catId("cleaning-products"), baseTypeId: btId("water-based"),   sortOrder: 0 },
      { categoryId: catId("cleaning-products"), baseTypeId: btId("solvent-based"), sortOrder: 1 },
      { categoryId: catId("cleaning-products"), baseTypeId: btId("solvent-less"),  sortOrder: 2 },
      { categoryId: catId("cleaning-products"), baseTypeId: btId("concentrate"),   sortOrder: 3 },
      { categoryId: catId("cleaning-products"), baseTypeId: btId("hybrid-other"),  sortOrder: 4 },

      // Personal Care
      { categoryId: catId("personal-care"), baseTypeId: btId("water-based"),   sortOrder: 0 },
      { categoryId: catId("personal-care"), baseTypeId: btId("oil-based"),     sortOrder: 1 },
      { categoryId: catId("personal-care"), baseTypeId: btId("alcohol-based"), sortOrder: 2 },
      { categoryId: catId("personal-care"), baseTypeId: btId("hybrid-other"),  sortOrder: 3 },

      // Industrial Chemicals
      { categoryId: catId("industrial-chemicals"), baseTypeId: btId("water-based"),   sortOrder: 0 },
      { categoryId: catId("industrial-chemicals"), baseTypeId: btId("solvent-based"), sortOrder: 1 },
      { categoryId: catId("industrial-chemicals"), baseTypeId: btId("oil-based"),     sortOrder: 2 },
      { categoryId: catId("industrial-chemicals"), baseTypeId: btId("concentrate"),   sortOrder: 3 },

      // Auto Care
      { categoryId: catId("auto-care"), baseTypeId: btId("water-based"),   sortOrder: 0 },
      { categoryId: catId("auto-care"), baseTypeId: btId("solvent-based"), sortOrder: 1 },
      { categoryId: catId("auto-care"), baseTypeId: btId("polymer-based"), sortOrder: 2 },
      { categoryId: catId("auto-care"), baseTypeId: btId("wax-based"),     sortOrder: 3 },

      // Pet Care
      { categoryId: catId("pet-care"), baseTypeId: btId("water-based"),        sortOrder: 0 },
      { categoryId: catId("pet-care"), baseTypeId: btId("natural-plant-based"),sortOrder: 1 },
      { categoryId: catId("pet-care"), baseTypeId: btId("alcohol-free"),       sortOrder: 2 },
    ]);

    console.log("✅ Wizard data seeded successfully!");
  } catch (err) {
    console.error("Wizard seed failed:", err);
    // Non-fatal — don't block server startup
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