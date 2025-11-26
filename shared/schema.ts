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

// Formulation Content table - admin-managed page content for each formulation
export const formulationContent = pgTable("formulation_content", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  formulationId: uuid("formulation_id").notNull().references(() => formulations.id).unique(), // One content per formulation
  overviewTitle: text("overview_title"),
  overviewContent: text("overview_content"), // Rich HTML content
  benefitsTitle: text("benefits_title"),
  benefitsContent: text("benefits_content"), // Rich HTML content
  applicationsTitle: text("applications_title"),
  applicationsContent: text("applications_content"), // Rich HTML content
  usageTitle: text("usage_title"),
  usageContent: text("usage_content"), // Rich HTML content
  safetyTitle: text("safety_title"),
  safetyContent: text("safety_content"), // Rich HTML content
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  formulationIndex: index("formulation_content_formulation_idx").on(table.formulationId),
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

// Pages table for custom content
export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  metaDescription: text("meta_description"),
  keywords: text("keywords"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  slugIndex: index("pages_slug_idx").on(table.slug),
}));

// Blog posts table
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  author: text("author"),
  featuredImage: text("featured_image"),
  metaDescription: text("meta_description"),
  keywords: text("keywords"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  slugIndex: index("blog_posts_slug_idx").on(table.slug),
  publishedIndex: index("blog_posts_published_idx").on(table.isPublished),
}));

// User table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  country: text("country"),
  profileImageUrl: text("profile_image_url"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  emailIndex: index("users_email_idx").on(table.email),
}));

// User formulation requests table
export const userFormulationRequests = pgTable("user_formulation_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  formulationId: uuid("formulation_id").references(() => formulations.id),
  productName: text("product_name"),
  email: text("email"),
  customerName: text("customer_name"),
  productCategory: text("product_category"),
  productDescription: text("product_description"),
  formData: text("form_data"), // JSON string of entire form submission
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by"),
});

// User downloads tracking
export const userDownloads = pgTable("user_downloads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  formulationId: varchar("formulation_id").notNull(),
  formulationName: text("formulation_name").notNull(), // Denormalized for quick access
  categoryName: text("category_name").notNull(), // Denormalized for quick access
  downloadedAt: timestamp("downloaded_at").notNull().default(sql`now()`),
}, (table) => ({
  userIndex: index("user_downloads_user_idx").on(table.userId),
  formulationIndex: index("user_downloads_formulation_idx").on(table.formulationId),
  downloadedAtIndex: index("user_downloads_date_idx").on(table.downloadedAt),
}));

export type UserDownload = typeof userDownloads.$inferSelect;

// User favorites table - tracks user's favorite formulations
export const userFavorites = pgTable("user_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  formulationId: varchar("formulation_id").notNull(),
  addedAt: timestamp("added_at").notNull().default(sql`now()`),
}, (table) => ({
  userIndex: index("user_favorites_user_idx").on(table.userId),
  formulationIndex: index("user_favorites_formulation_idx").on(table.formulationId),
  uniqueFavorite: index("user_favorites_unique_idx").on(table.userId, table.formulationId),
}));

export type UserFavorite = typeof userFavorites.$inferSelect;

// Sample Products table for homepage showcase
export const sampleProducts = pgTable("sample_products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  link: text("link").notNull(),
  category: text("category").notNull().default("General"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Schemas
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

export const insertFormulationContentSchema = createInsertSchema(formulationContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  overviewTitle: true,
  overviewContent: true,
  benefitsTitle: true,
  benefitsContent: true,
  applicationsTitle: true,
  applicationsContent: true,
  usageTitle: true,
  usageContent: true,
  safetyTitle: true,
  safetyContent: true,
});

export const insertGeneratedFormulationSchema = createInsertSchema(generatedFormulations).omit({
  id: true,
  createdAt: true,
}).partial({
  createdBy: true,
  category: true,
});

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

export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  metaDescription: true,
  keywords: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  excerpt: true,
  author: true,
  featuredImage: true,
  metaDescription: true,
  keywords: true,
  publishedAt: true,
});

export const insertSampleProductSchema = createInsertSchema(sampleProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertFormulation = z.infer<typeof insertFormulationSchema>;
export type Formulation = typeof formulations.$inferSelect;
export type InsertFormulationContent = z.infer<typeof insertFormulationContentSchema>;
export type FormulationContent = typeof formulationContent.$inferSelect;
export type InsertGeneratedFormulation = z.infer<typeof insertGeneratedFormulationSchema>;
export type GeneratedFormulation = typeof generatedFormulations.$inferSelect;
export type InsertProductProperties = z.infer<typeof insertProductPropertiesSchema>;
export type ProductProperties = typeof productProperties.$inferSelect;
export type InsertUserNote = z.infer<typeof insertUserNoteSchema>;
export type UserNote = typeof userNotes.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pages.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertSampleProduct = z.infer<typeof insertSampleProductSchema>;
export type SampleProduct = typeof sampleProducts.$inferSelect;

// Chat
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export type InsertChatMessage = Omit<ChatMessage, "id" | "timestamp">;

// Auth schemas
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

export type InsertUserFormulationRequest = typeof userFormulationRequests.$inferInsert;
export type UserFormulationRequest = typeof userFormulationRequests.$inferSelect;
