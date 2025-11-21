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

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
}).partial({
  image: true, // Make image optional for insert
  slug: true,  // slug is auto-generated
  seoTitle: true,
  metaDescription: true,
  keywords: true,
});

export const insertFormulationSchema = createInsertSchema(formulations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  slug: z.string().optional(), // Allow manual slug editing, auto-generated if not provided
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  imageFilename: z.string().optional(),
  viscosity: z.string().optional(),
  certification: z.string().optional(),
}).partial({
  // Make these fields optional for form submission
  slug: true,
  categoryId: true, // Allow custom formulations without category
  viscosity: true,
  certification: true,
  image: true,
  imageAlt: true,
  imageFilename: true,
  seoTitle: true,
  metaDescription: true,
  keywords: true,
  pdfPath: true, // File paths are optional
  textPath: true,
  userId: true, // User ID is optional
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

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertFormulation = z.infer<typeof insertFormulationSchema>;
export type Formulation = typeof formulations.$inferSelect;
export type InsertFormulationContent = z.infer<typeof insertFormulationContentSchema>;
export type FormulationContent = typeof formulationContent.$inferSelect;
export type InsertProductProperties = z.infer<typeof insertProductPropertiesSchema>;
export type ProductProperties = typeof productProperties.$inferSelect;
export type InsertUserNote = z.infer<typeof insertUserNoteSchema>;
export type UserNote = typeof userNotes.$inferSelect;

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // Hashed password using bcrypt
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  country: varchar("country"), // User's country
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Signup schema for user registration
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  country: z.string().min(1, "Country is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignupInput = z.infer<typeof signupSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Chat messages table for human farmulator chat
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  message: text("message").notNull(),
  senderType: varchar("sender_type").notNull(), // 'user' or 'admin'
  senderName: varchar("sender_name"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// User formulation requests table - tracks user interests and custom formulation requests
export const userFormulationRequests = pgTable("user_formulation_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(), // Session ID to group requests from same user
  productName: text("product_name").notNull(),
  productCategory: text("product_category").notNull(),
  consistencyType: text("consistency_type"),
  viscosity: text("viscosity"),
  phLevel: text("ph_level"),
  shelfLife: text("shelf_life"),
  specialProperties: jsonb("special_properties"), // Array of selected special properties
  budgetCategory: text("budget_category"),
  productionVolume: text("production_volume"),
  regulatoryRequirements: jsonb("regulatory_requirements"), // Array of regulatory requirements
  additionalNotes: text("additional_notes"),
  formData: jsonb("form_data").notNull(), // Complete form data for reference
  formulationId: uuid("formulation_id").references(() => formulations.id), // Link to generated formulation if created
  status: text("status").notNull().default("pending"), // pending, reviewed, approved, rejected
  adminNotes: text("admin_notes"), // Admin comments/notes about this request
  ipAddress: text("ip_address"), // For analytics and spam prevention
  userAgent: text("user_agent"), // Browser info for analytics
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  reviewedAt: timestamp("reviewed_at"), // When admin reviewed this request
  reviewedBy: varchar("reviewed_by"), // Admin who reviewed this
}, (table) => ({
  sessionIndex: index("user_requests_session_idx").on(table.sessionId),
  categoryIndex: index("user_requests_category_idx").on(table.productCategory),
  statusIndex: index("user_requests_status_idx").on(table.status),
  createdAtIndex: index("user_requests_created_idx").on(table.createdAt),
}));

export const insertUserFormulationRequestSchema = createInsertSchema(userFormulationRequests).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  reviewedBy: true,
});

export type InsertUserFormulationRequest = z.infer<typeof insertUserFormulationRequestSchema>;
export type UserFormulationRequest = typeof userFormulationRequests.$inferSelect;

// Pages content management table
export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(), // e.g., "about", "faq", "terms-of-service", "privacy-policy", "disclaimer"
  title: text("title").notNull(),
  content: text("content").notNull(), // HTML content
  metaDescription: text("meta_description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pages.$inferSelect;

// Blog posts table
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(), // SEO-friendly URL slug
  excerpt: text("excerpt"), // Short description for preview
  content: text("content").notNull(), // Full HTML content
  featuredImage: text("featured_image"), // Optional featured image URL
  metaDescription: text("meta_description"), // SEO meta description
  keywords: text("keywords"), // SEO keywords (comma-separated)
  authorName: text("author_name").notNull().default("AI Formulator Team"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  slugIndex: index("blog_post_slug_idx").on(table.slug), // Index for SEO URL lookups
  publishedIndex: index("blog_post_published_idx").on(table.isPublished, table.publishedAt),
}));

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
}).extend({
  publishedAt: z.union([z.date(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') {
      if (val === '') return null;
      return new Date(val);
    }
    return val;
  }).nullable().optional(),
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// User downloads table - tracks formulation PDF downloads
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
  // Unique constraint: a user can only favorite a formulation once
  uniqueFavorite: index("user_favorites_unique_idx").on(table.userId, table.formulationId),
}));

export type UserFavorite = typeof userFavorites.$inferSelect;
