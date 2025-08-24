import { eq, desc } from "drizzle-orm";
import { db, categoriesTable, formulationsTable } from "./db";
import type { Category, InsertCategory, Formulation, InsertFormulation } from "@shared/schema";
import type { IStorage, IAiGeneration } from "./storage";
import crypto from "crypto";

export class DatabaseStorage implements IStorage {
  // In-memory AI generations tracking (for demo purposes)
  private aiGenerations: Map<string, IAiGeneration> = new Map();

  constructor() {
    this.seedAiAnalyticsData();
  }

  private seedAiAnalyticsData() {
    // Add dummy AI generation data for analytics demonstration
    const now = new Date();
    const dummyGenerations: Omit<IAiGeneration, 'id'>[] = [
      {
        productName: "Premium Anti-Aging Serum",
        category: "Skin Care",
        sessionId: "sess_12345abc",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        responseTime: 4.2,
        formData: { productType: "Skin Care", phLevel: "5.5-6.0" }
      },
      {
        productName: "Organic Lip Balm",
        category: "Beauty Products",
        sessionId: "sess_67890def",
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        responseTime: 3.8,
        formData: { productType: "Beauty Products", phLevel: "6.0-7.0" }
      },
      {
        productName: "Whitening Toothpaste",
        category: "Oral Care",
        sessionId: "sess_abcdef12",
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        responseTime: 5.1,
        formData: { productType: "Oral Care", phLevel: "7.0-8.0" }
      },
      {
        productName: "Gentle Baby Lotion",
        category: "Baby Care",
        sessionId: "sess_789xyz45",
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        responseTime: 3.5,
        formData: { productType: "Baby Care", phLevel: "6.5-7.0" }
      },
      {
        productName: "Men's Beard Oil",
        category: "Men Care",
        sessionId: "sess_456mno78",
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        responseTime: 4.7,
        formData: { productType: "Men Care", phLevel: "5.0-6.0" }
      },
      {
        productName: "Natural Face Cleanser",
        category: "Organic Care",
        sessionId: "sess_321ghi90",
        timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        responseTime: 6.2,
        formData: { productType: "Organic Care", phLevel: "5.5-6.5" }
      },
      {
        productName: "Hydrating Foundation",
        category: "Beauty Products",
        sessionId: "sess_654jkl21",
        timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        responseTime: 4.9,
        formData: { productType: "Beauty Products", phLevel: "6.0-7.0" }
      },
      {
        productName: "Moisturizing Hand Cream",
        category: "Skin Care",
        sessionId: "sess_987pqr54",
        timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
        responseTime: 3.2,
        formData: { productType: "Skin Care", phLevel: "5.0-6.0" }
      },
      {
        productName: "Fresh Breath Mouthwash",
        category: "Oral Care",
        sessionId: "sess_147stu85",
        timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        responseTime: 5.8,
        formData: { productType: "Oral Care", phLevel: "6.5-7.5" }
      },
      {
        productName: "Nourishing Night Cream",
        category: "Skin Care",
        sessionId: "sess_258vwx96",
        timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        responseTime: 4.1,
        formData: { productType: "Skin Care", phLevel: "5.5-6.5" }
      },
      {
        productName: "Color-Safe Shampoo",
        category: "Beauty Products",
        sessionId: "sess_369yza07",
        timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        responseTime: 4.4,
        formData: { productType: "Beauty Products", phLevel: "5.0-6.0" }
      },
      {
        productName: "Soothing Baby Shampoo",
        category: "Baby Care",
        sessionId: "sess_741bcd18",
        timestamp: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
        responseTime: 3.9,
        formData: { productType: "Baby Care", phLevel: "6.0-7.0" }
      },
      {
        productName: "Aftershave Balm",
        category: "Men Care",
        sessionId: "sess_852efg29",
        timestamp: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        responseTime: 5.3,
        formData: { productType: "Men Care", phLevel: "5.5-6.5" }
      },
      {
        productName: "Organic Sunscreen",
        category: "Organic Care",
        sessionId: "sess_963hij40",
        timestamp: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days ago
        responseTime: 7.1,
        formData: { productType: "Organic Care", phLevel: "6.0-7.0" }
      },
      {
        productName: "Exfoliating Scrub",
        category: "Skin Care",
        sessionId: "sess_159klm73",
        timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
        responseTime: 4.6,
        formData: { productType: "Skin Care", phLevel: "5.0-6.0" }
      }
    ];

    // Add all dummy data to the map
    dummyGenerations.forEach(gen => {
      const id = crypto.randomUUID();
      this.aiGenerations.set(id, { id, ...gen });
    });
  }
  // Categories
  async getCategories(): Promise<Category[]> {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    return categories.map(this.mapDbCategoryToCategory);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
    return category ? this.mapDbCategoryToCategory(category) : undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categoriesTable).values({
      name: category.name,
      description: category.description,
      icon: category.icon,
      image: category.image,
      isActive: category.isActive ?? true,
    }).returning();
    return this.mapDbCategoryToCategory(created);
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db
      .update(categoriesTable)
      .set(category)
      .where(eq(categoriesTable.id, id))
      .returning();
    return updated ? this.mapDbCategoryToCategory(updated) : undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    return result.rowCount > 0;
  }

  // Formulations
  async getFormulations(): Promise<Formulation[]> {
    const formulations = await db.select().from(formulationsTable).orderBy(desc(formulationsTable.createdAt));
    return formulations.map(this.mapDbFormulationToFormulation);
  }

  async getFormulationsByCategory(categoryId: string): Promise<Formulation[]> {
    const formulations = await db
      .select()
      .from(formulationsTable)
      .where(eq(formulationsTable.categoryId, categoryId))
      .orderBy(desc(formulationsTable.createdAt));
    return formulations.map(this.mapDbFormulationToFormulation);
  }

  async getFormulation(id: string): Promise<Formulation | undefined> {
    const [formulation] = await db.select().from(formulationsTable).where(eq(formulationsTable.id, id));
    return formulation ? this.mapDbFormulationToFormulation(formulation) : undefined;
  }

  async createFormulation(formulation: InsertFormulation): Promise<Formulation> {
    const [created] = await db.insert(formulationsTable).values({
      categoryId: formulation.categoryId,
      name: formulation.name,
      description: formulation.description,
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
      isActive: formulation.isActive ?? true,
    }).returning();
    return this.mapDbFormulationToFormulation(created);
  }

  async updateFormulation(id: string, formulation: Partial<InsertFormulation>): Promise<Formulation | undefined> {
    const updateData = { ...formulation };
    if (Object.keys(updateData).length > 0) {
      (updateData as any).updatedAt = new Date();
    }
    
    const [updated] = await db
      .update(formulationsTable)
      .set(updateData)
      .where(eq(formulationsTable.id, id))
      .returning();
    return updated ? this.mapDbFormulationToFormulation(updated) : undefined;
  }

  async deleteFormulation(id: string): Promise<boolean> {
    const result = await db.delete(formulationsTable).where(eq(formulationsTable.id, id));
    return result.rowCount > 0;
  }

  // Helper methods to map database types to schema types
  private mapDbCategoryToCategory(dbCategory: any): Category {
    return {
      id: dbCategory.id,
      name: dbCategory.name,
      description: dbCategory.description,
      icon: dbCategory.icon,
      image: dbCategory.image,
      isActive: dbCategory.isActive,
      createdAt: dbCategory.createdAt,
    };
  }

  private mapDbFormulationToFormulation(dbFormulation: any): Formulation {
    return {
      id: dbFormulation.id,
      categoryId: dbFormulation.categoryId,
      name: dbFormulation.name,
      description: dbFormulation.description,
      phLevel: dbFormulation.phLevel,
      shelfLife: dbFormulation.shelfLife,
      viscosity: dbFormulation.viscosity,
      storageConditions: dbFormulation.storageConditions,
      batchSize: dbFormulation.batchSize,
      processingTime: dbFormulation.processingTime,
      temperature: dbFormulation.temperature,
      equipment: dbFormulation.equipment,
      certification: dbFormulation.certification,
      ingredients: dbFormulation.ingredients,
      instructions: dbFormulation.instructions,
      usageInstructions: dbFormulation.usageInstructions,
      isActive: dbFormulation.isActive,
      createdAt: dbFormulation.createdAt,
      updatedAt: dbFormulation.updatedAt,
    };
  }

  // AI Generation tracking methods (in-memory for demo)
  async getAiGenerations(): Promise<IAiGeneration[]> {
    return Array.from(this.aiGenerations.values());
  }

  async trackAiGeneration(generation: Omit<IAiGeneration, 'id'>): Promise<IAiGeneration> {
    const id = crypto.randomUUID();
    const newGeneration: IAiGeneration = {
      id,
      ...generation,
    };
    this.aiGenerations.set(id, newGeneration);
    return newGeneration;
  }
}