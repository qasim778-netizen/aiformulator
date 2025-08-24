import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  image: text("image").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const formulations = pgTable("formulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
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
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const aiFormulations = pgTable("ai_formulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  productCategory: text("product_category").notNull(),
  consistency: text("consistency").notNull(),
  targetViscosity: text("target_viscosity").notNull(),
  specialProperties: text("special_properties").notNull(), // JSON array
  phLevel: text("ph_level").notNull(),
  shelfLife: text("shelf_life").notNull(),
  storageTemperature: text("storage_temperature").notNull(),
  budgetCategory: text("budget_category").notNull(),
  productionVolume: text("production_volume").notNull(),
  regulatoryRequirements: text("regulatory_requirements"),
  additionalNotes: text("additional_notes"),
  generatedFormulation: text("generated_formulation").notNull(), // JSON of complete formulation
  costAnalysis: text("cost_analysis"), // JSON of cost breakdown
  status: text("status").notNull().default("generated"), // generated, approved, rejected
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertFormulationSchema = createInsertSchema(formulations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiFormulationSchema = createInsertSchema(aiFormulations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertFormulation = z.infer<typeof insertFormulationSchema>;
export type Formulation = typeof formulations.$inferSelect;
export type InsertAiFormulation = z.infer<typeof insertAiFormulationSchema>;
export type AiFormulation = typeof aiFormulations.$inferSelect;
