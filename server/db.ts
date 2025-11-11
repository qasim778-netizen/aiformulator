import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { pgTable, text, boolean, timestamp, uuid, jsonb, integer, varchar } from "drizzle-orm/pg-core";

// Database connection
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// Categories table
export const categoriesTable = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(), // SEO-friendly URL slug
  description: text("description").notNull(),
  metaDescription: text("meta_description"), // SEO meta description
  keywords: text("keywords"), // SEO keywords
  icon: text("icon").notNull(),
  image: text("image").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Formulations table
export const formulationsTable = pgTable("formulations", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").notNull().references(() => categoriesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(), // SEO-friendly URL slug
  description: text("description").notNull(),
  seoTitle: text("seo_title"), // SEO page title (max 60 chars)
  metaDescription: text("meta_description"), // SEO meta description
  keywords: text("keywords"), // SEO keywords
  image: text("image"), // Optional AI-generated product image URL
  imageAlt: text("image_alt"), // SEO alt text for the image
  imageFilename: text("image_filename"), // Original filename of uploaded image
  phLevel: text("ph_level").notNull(),
  shelfLife: text("shelf_life").notNull(),
  viscosity: text("viscosity"),
  storageConditions: text("storage_conditions").notNull(),
  batchSize: text("batch_size").notNull(),
  processingTime: text("processing_time").notNull(),
  temperature: text("temperature").notNull(),
  equipment: text("equipment").notNull(),
  certification: text("certification"),
  ingredients: text("ingredients").notNull(), // JSON string
  instructions: text("instructions").notNull(), // JSON string
  usageInstructions: text("usage_instructions").notNull(),
  pdfPath: text("pdf_path"), // Path to stored PDF file
  textPath: text("text_path"), // Path to stored text file
  userId: varchar("user_id"), // Owner of custom formulation
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Product Properties table
export const productPropertiesTable = pgTable("product_properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  productType: text("product_type").notNull(),
  properties: jsonb("properties").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User Notes table
export const userNotesTable = pgTable("user_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  productType: text("product_type").notNull(),
  additionalNote: text("additional_note").notNull(),
  specialFeatures: jsonb("special_features"),
  frequency: integer("frequency").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Pages table for content management
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

// Blog posts table
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

// User formulation requests table - tracks user interests and custom formulation requests
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

export type DbCategory = typeof categoriesTable.$inferSelect;
export type DbFormulation = typeof formulationsTable.$inferSelect;
export type DbProductProperties = typeof productPropertiesTable.$inferSelect;
export type DbUserNote = typeof userNotesTable.$inferSelect;
export type DbPage = typeof pagesTable.$inferSelect;
export type DbBlogPost = typeof blogPostsTable.$inferSelect;
export type DbUserFormulationRequest = typeof userFormulationRequestsTable.$inferSelect;
export type InsertDbCategory = typeof categoriesTable.$inferInsert;
export type InsertDbFormulation = typeof formulationsTable.$inferInsert;
export type InsertDbProductProperties = typeof productPropertiesTable.$inferInsert;
export type InsertDbUserNote = typeof userNotesTable.$inferInsert;
export type InsertDbPage = typeof pagesTable.$inferInsert;
export type InsertDbBlogPost = typeof blogPostsTable.$inferInsert;
export type InsertDbUserFormulationRequest = typeof userFormulationRequestsTable.$inferInsert;