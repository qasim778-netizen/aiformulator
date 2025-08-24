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

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertFormulationSchema = createInsertSchema(formulations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertFormulation = z.infer<typeof insertFormulationSchema>;
export type Formulation = typeof formulations.$inferSelect;
