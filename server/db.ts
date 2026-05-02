import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, boolean, timestamp, uuid, jsonb, integer, varchar } from "drizzle-orm/pg-core";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('New client connected to pool');
});

export const sql = async (query: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
};

export const db = drizzle(pool);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  country: text("country"),
  profileImageUrl: text("profile_image_url"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const categoriesTable = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull(),
  metaDescription: text("meta_description"),
  keywords: text("keywords"),
  icon: text("icon").notNull(),
  image: text("image").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const formulationsTable = pgTable("formulations", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").notNull().references(() => categoriesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull(),
  seoTitle: text("seo_title"),
  metaDescription: text("meta_description"),
  keywords: text("keywords"),
  image: text("image"),
  imageAlt: text("image_alt"),
  imageFilename: text("image_filename"),
  phLevel: text("ph_level").notNull(),
  shelfLife: text("shelf_life").notNull(),
  viscosity: text("viscosity"),
  storageConditions: text("storage_conditions").notNull(),
  batchSize: text("batch_size").notNull(),
  processingTime: text("processing_time").notNull(),
  temperature: text("temperature").notNull(),
  equipment: text("equipment").notNull(),
  certification: text("certification"),
  ingredients: text("ingredients").notNull(),
  instructions: text("instructions").notNull(),
  usageInstructions: text("usage_instructions").notNull(),
  pdfPath: text("pdf_path"),
  textPath: text("text_path"),
  userId: varchar("user_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productPropertiesTable = pgTable("product_properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  productType: text("product_type").notNull(),
  properties: jsonb("properties").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userNotesTable = pgTable("user_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  productType: text("product_type").notNull(),
  additionalNote: text("additional_note").notNull(),
  specialFeatures: jsonb("special_features"),
  frequency: integer("frequency").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pagesTable = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metaDescription: text("meta_description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const blogPostsTable = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  metaDescription: text("meta_description"),
  keywords: text("keywords"),
  authorName: text("author_name").notNull().default("AI Formulator Team"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userFormulationRequestsTable = pgTable("user_formulation_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  productName: text("product_name").notNull(),
  productCategory: text("product_category").notNull(),
  consistencyType: text("consistency_type"),
  viscosity: text("viscosity"),
  phLevel: text("ph_level"),
  shelfLife: text("shelf_life"),
  specialProperties: jsonb("special_properties"),
  budgetCategory: text("budget_category"),
  productionVolume: text("production_volume"),
  regulatoryRequirements: jsonb("regulatory_requirements"),
  additionalNotes: text("additional_notes"),
  formData: jsonb("form_data").notNull(),
  formulationId: uuid("formulation_id").references(() => formulationsTable.id),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
});

export const formulationContentTable = pgTable("formulation_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  formulationId: uuid("formulation_id").notNull().references(() => formulationsTable.id, { onDelete: "cascade" }).unique(),
  overviewTitle: text("overview_title"),
  overviewContent: text("overview_content"),
  benefitsTitle: text("benefits_title"),
  benefitsContent: text("benefits_content"),
  applicationsTitle: text("applications_title"),
  applicationsContent: text("applications_content"),
  usageTitle: text("usage_title"),
  usageContent: text("usage_content"),
  safetyTitle: text("safety_title"),
  safetyContent: text("safety_content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sampleProductsTable = pgTable("sample_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  link: text("link").notNull(),
  category: text("category").notNull().default("General"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formulatorsTable = pgTable("formulators", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  photoUrl: varchar("photo_url").notNull(),
  expertiseName: varchar("expertise_name").notNull(),
  color: varchar("color").notNull().default("pink"),
  affiliateLink: varchar("affiliate_link").notNull(),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Wizard Tables ───────────────────────────────────────────────────────────

export const wizardCategoriesTable = pgTable("wizard_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  isActive: boolean("is_active").notNull().default(true),
});

export const wizardProductTypesTable = pgTable("wizard_product_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").notNull(),
  subcategoryName: text("subcategory_name"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const wizardBaseTypesTable = pgTable("wizard_base_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const wizardCategoryBaseTypesTable = pgTable("wizard_category_base_types", {
  categoryId: uuid("category_id").notNull(),
  baseTypeId: uuid("base_type_id").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ─── Formula Cache Tables ─────────────────────────────────────────────────────

export const generatedFormulasTable = pgTable("generated_formulas", {
  id: uuid("id").primaryKey().defaultRandom(),
  formulaKey: text("formula_key").notNull().unique(),
  formulaKeyVersion: integer("formula_key_version").notNull().default(1),
  inputJson: jsonb("input_json").notNull(),
  outputJson: jsonb("output_json").notNull(),
  source: text("source").notNull().default("openai"),
  model: text("model"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  usageCount: integer("usage_count").notNull().default(1),
  lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),
});

export const formulaGenerationFailuresTable = pgTable("formula_generation_failures", {
  id: uuid("id").primaryKey().defaultRandom(),
  inputJson: jsonb("input_json").notNull(),
  formulaKey: text("formula_key"),
  errorMessage: text("error_message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiUsageLogsTable = pgTable("api_usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id"),
  userEmail: text("user_email"),
  userName: text("user_name"),
  userCountry: text("user_country"),
  model: text("model").notNull().default("gpt-4o"),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  estimatedCost: text("estimated_cost").notNull().default("0.000000"),
  cacheHit: boolean("cache_hit").notNull().default(false),
  productName: text("product_name"),
  productType: text("product_type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DbCategory = typeof categoriesTable.$inferSelect;
export type DbFormulation = typeof formulationsTable.$inferSelect;
export type DbProductProperties = typeof productPropertiesTable.$inferSelect;
export type DbUserNote = typeof userNotesTable.$inferSelect;
export type DbPage = typeof pagesTable.$inferSelect;
export type DbBlogPost = typeof blogPostsTable.$inferSelect;
export type DbUserFormulationRequest = typeof userFormulationRequestsTable.$inferSelect;
export type DbFormulationContent = typeof formulationContentTable.$inferSelect;
export type DbSampleProduct = typeof sampleProductsTable.$inferSelect;
export type DbUser = typeof usersTable.$inferSelect;
export type InsertDbCategory = typeof categoriesTable.$inferInsert;
export type InsertDbFormulation = typeof formulationsTable.$inferInsert;
export type InsertDbProductProperties = typeof productPropertiesTable.$inferInsert;
export type InsertDbUserNote = typeof userNotesTable.$inferInsert;
export type InsertDbPage = typeof pagesTable.$inferInsert;
export type InsertDbBlogPost = typeof blogPostsTable.$inferInsert;
export type InsertDbUserFormulationRequest = typeof userFormulationRequestsTable.$inferInsert;
export type InsertDbFormulationContent = typeof formulationContentTable.$inferInsert;
export type InsertDbSampleProduct = typeof sampleProductsTable.$inferInsert;
export type InsertDbUser = typeof usersTable.$inferInsert;

export async function warmCache(): Promise<void> {
  const { cache, CACHE_KEYS, CACHE_TTL } = await import('./cache');
  
  try {
    console.log('🔥 Warming cache...');
    
    const categories = await db.select().from(categoriesTable);
    cache.set(CACHE_KEYS.CATEGORIES, categories, CACHE_TTL.CATEGORIES);
    console.log(`  ✓ Cached ${categories.length} categories`);
    
    const formulations = await db.select().from(formulationsTable);
    cache.set(CACHE_KEYS.FORMULATIONS, formulations, CACHE_TTL.FORMULATIONS);
    console.log(`  ✓ Cached ${formulations.length} formulations`);
    
    for (const f of formulations) {
      cache.set(CACHE_KEYS.FORMULATION(f.slug), f, CACHE_TTL.FORMULATION);
      cache.set(CACHE_KEYS.FORMULATION_BY_ID(f.id), f, CACHE_TTL.FORMULATION);
    }
    
    for (const c of categories) {
      cache.set(CACHE_KEYS.CATEGORY(c.slug), c, CACHE_TTL.CATEGORY);
      cache.set(CACHE_KEYS.CATEGORY_BY_ID(c.id), c, CACHE_TTL.CATEGORY);
      
      const categoryFormulations = formulations.filter(f => f.categoryId === c.id);
      cache.set(CACHE_KEYS.CATEGORY_FORMULATIONS(c.id), categoryFormulations, CACHE_TTL.FORMULATIONS);
    }
    
    const sampleProducts = await db.select().from(sampleProductsTable);
    cache.set(CACHE_KEYS.SAMPLE_PRODUCTS, sampleProducts, CACHE_TTL.SAMPLE_PRODUCTS);
    console.log(`  ✓ Cached ${sampleProducts.length} sample products`);
    
    console.log('✅ Cache warming complete');
  } catch (error) {
    console.error('❌ Cache warming failed:', error);
  }
}
