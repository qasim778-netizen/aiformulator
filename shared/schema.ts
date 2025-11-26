import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull(), // SEO-friendly URL slug
  description: text("description").notNull(),
  seoTitle: text("seo_title"), // SEO page title (max 60 chars)
  metaDescription: text("meta_description"), // SEO meta description (max 160 chars)
  keywords: text("keywords"), // SEO keywords (comma-separated)
  icon: text("icon").notNull(),
  image: text("image").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  slugIndex: index("category_slug_idx").on(table.slug), // Index for SEO URL lookups
}));

export const formulations = pgTable("formulations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: uuid("category_id").references(() => categories.id), // Made nullable for custom formulations
  name: text("name").notNull(),
  slug: text("slug").notNull(), // SEO-friendly URL slug
  description: text("description").notNull(),
  seoTitle: text("seo_title"), // SEO page title (max 60 chars)
  metaDescription: text("meta_description"), // SEO meta description (max 160 chars)
  keywords: text("keywords"), // SEO keywords (comma-separated)
  image: text("image"), // Optional AI-generated product image URL
  imageAlt: text("image_alt"), // SEO alt text for the image
  imageFilename: text("image_filename"), // Original filename of uploaded image
  ingredients: text("ingredients").notNull(), // JSON string of ingredients array
  instructions: text("instructions").notNull(), // JSON string of instruction steps
  usageInstructions: text("usage_instructions").notNull(),
  phLevel: text("ph_level").notNull(),
  shelfLife: text("shelf_life").notNull(),
  viscosity: text("viscosity"),
  storageConditions: text("storage_conditions").notNull(),
  batchSize: text("batch_size").notNull(),
  processingTime: text("processing_time").notNull(),
  temperature: text("temperature").notNull(),
  equipment: text("equipment").notNull(),
  certification: text("certification"),
  pdfPath: text("pdf_path"), // Path to stored PDF file
  textPath: text("text_path"), // Path to stored text file
  userId: varchar("user_id"), // Owner of custom formulation
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  slugIndex: index("formulation_slug_idx").on(table.slug), // Index for SEO URL lookups
}));

// Generated Formulations table - AI-generated master formulations for admin use
export const generatedFormulations = pgTable("generated_formulations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productName: text("product_name").notNull(),
  category: text("category").notNull().default("Custom Innovations"),
  content: text("content").notNull(), // Full generated formulation content
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by"), // Admin user ID who generated it
});

// Product special properties table for dynamic properties based on product type
export const productProperties = pgTable("product_properties", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productType: text("product_type").notNull(), // e.g., "skincare", "hair_care", "oral_care"
  properties: jsonb("properties").notNull(), // Array of available special properties for this product type
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// User notes and recommendations table
export const userNotes = pgTable("user_notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productType: text("product_type").notNull(),
  additionalNote: text("additional_note").notNull(),
  specialFeatures: jsonb("special_features"), // Extracted special features from the note
  frequency: integer("frequency").notNull().default(1), // How many times this feature was requested
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
}).partial({
  image: true,
  slug: true,
  seoTitle: true,
  metaDescription: true,
  keywords: true,
});

export const insertFormulationSchema = createInsertSchema(formulations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  slug: z.string().optional(),
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  imageFilename: z.string().optional(),
  viscosity: z.string().optional(),
  certification: z.string().optional(),
}).partial({
  slug: true,
  categoryId: true,
  viscosity: true,
  certification: true,
  image: true,
  imageAlt: true,
  imageFilename: true,
  seoTitle: true,
  metaDescription: true,
  keywords: true,
  pdfPath: true,
  textPath: true,
  userId: true,
});

export const insertGeneratedFormulationSchema = createInsertSchema(generatedFormulations).omit({
  id: true,
  createdAt: true,
}).partial({
  createdBy: true,
  category: true,
});

// Export insert schemas
export const insertProductPropertiesSchema = createInsertSchema(productProperties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserNoteSchema = createInsertSchema(userNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertFormulation = z.infer<typeof insertFormulationSchema>;
export type Formulation = typeof formulations.$inferSelect;
export type InsertGeneratedFormulation = z.infer<typeof insertGeneratedFormulationSchema>;
export type GeneratedFormulation = typeof generatedFormulations.$inferSelect;
export type InsertProductProperties = z.infer<typeof insertProductPropertiesSchema>;
export type ProductProperties = typeof productProperties.$inferSelect;
export type InsertUserNote = z.infer<typeof insertUserNoteSchema>;
export type UserNote = typeof userNotes.$inferSelect;

// Chat and pages schemas
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export type InsertChatMessage = Omit<ChatMessage, "id" | "timestamp">;

// Signup/Login schemas
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// User type
export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  profileImageUrl?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};
