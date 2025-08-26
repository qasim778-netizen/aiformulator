import { eq, desc } from "drizzle-orm";
import { db, categoriesTable, formulationsTable, productPropertiesTable, userNotesTable, pagesTable } from "./db";
import type { Category, InsertCategory, Formulation, InsertFormulation, UserNote, InsertUserNote, User, UpsertUser, Page, InsertPage, ChatMessage, InsertChatMessage } from "@shared/schema";
import type { IStorage, IAiGeneration } from "./storage";
import crypto from "crypto";

export class DatabaseStorage implements IStorage {
  // In-memory AI generations tracking (for demo purposes)
  private aiGenerations: Map<string, IAiGeneration> = new Map();

  constructor() {
    // Initialize without dummy data
    this.clearAllAiGenerations();
  }

  // Method to clear all AI generation data
  private clearAllAiGenerations() {
    this.aiGenerations.clear();
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

  // Method to clear all AI analytics data (admin use)
  async clearAllAiAnalytics(): Promise<void> {
    this.aiGenerations.clear();
  }

  // Product Properties methods
  async getProductProperties(productType: string): Promise<string[] | undefined> {
    const result = await db.select()
      .from(productPropertiesTable)
      .where(eq(productPropertiesTable.productType, productType));
    
    if (result.length === 0) {
      return undefined;
    }
    
    return result[0].properties as string[];
  }

  // User Notes methods
  async saveUserNote(userNote: InsertUserNote): Promise<UserNote> {
    // Check if similar note exists and update frequency
    const existing = await db.select()
      .from(userNotesTable)
      .where(eq(userNotesTable.productType, userNote.productType));
    
    // Look for similar additional notes to increment frequency
    const similarNote = existing.find(note => 
      note.additionalNote.toLowerCase().includes(userNote.additionalNote.toLowerCase()) ||
      userNote.additionalNote.toLowerCase().includes(note.additionalNote.toLowerCase())
    );
    
    if (similarNote) {
      // Update frequency of existing similar note
      const [updated] = await db.update(userNotesTable)
        .set({ 
          frequency: similarNote.frequency + 1,
          updatedAt: new Date()
        })
        .where(eq(userNotesTable.id, similarNote.id))
        .returning();
      return updated;
    } else {
      // Create new note
      const [created] = await db.insert(userNotesTable)
        .values(userNote)
        .returning();
      return created;
    }
  }

  async getRecommendations(productType: string): Promise<string[]> {
    // Get most frequent special features for this product type
    const userNotes = await db.select()
      .from(userNotesTable)
      .where(eq(userNotesTable.productType, productType))
      .orderBy(desc(userNotesTable.frequency))
      .limit(5);
    
    // Extract common features from notes and return as recommendations
    const recommendations = userNotes
      .map(note => note.additionalNote)
      .filter(note => note && note.trim().length > 0);
    
    return recommendations;
  }

  // User Authentication methods (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    // This method uses shared schema which will be updated to include users table
    // For now return undefined as users table needs to be created via migration
    try {
      const { users } = await import("@shared/schema");
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      // Users table doesn't exist yet, will be created after schema update
      console.log("Users table not yet available, will be created after migration");
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const { users } = await import("@shared/schema");
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      // For now, return a mock user until migration completes
      console.log("Users table not yet available, returning mock user");
      return {
        id: userData.id || crypto.randomUUID(),
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  // Pages Content Management methods
  async getPages(): Promise<Page[]> {
    try {
      const { pages } = await import("@shared/schema");
      return await db.select().from(pages).orderBy(pages.title);
    } catch (error) {
      console.log("Pages table not yet available, returning empty array");
      return [];
    }
  }

  async getPageBySlug(slug: string): Promise<Page | undefined> {
    try {
      const { pages } = await import("@shared/schema");
      const [page] = await db.select().from(pages).where(eq(pages.slug, slug));
      return page;
    } catch (error) {
      console.log("Pages table not yet available, returning undefined");
      return undefined;
    }
  }

  async createPage(pageData: InsertPage): Promise<Page> {
    try {
      const { pages } = await import("@shared/schema");
      const [page] = await db.insert(pages).values(pageData).returning();
      return page;
    } catch (error) {
      console.error("Failed to create page:", error);
      throw new Error("Failed to create page");
    }
  }

  async updatePage(id: string, pageData: Partial<InsertPage>): Promise<Page | undefined> {
    try {
      const { pages } = await import("@shared/schema");
      const [page] = await db
        .update(pages)
        .set({ ...pageData, updatedAt: new Date() })
        .where(eq(pages.id, id))
        .returning();
      return page;
    } catch (error) {
      console.error("Failed to update page:", error);
      return undefined;
    }
  }

  async deletePage(id: string): Promise<boolean> {
    try {
      const { pages } = await import("@shared/schema");
      const result = await db.delete(pages).where(eq(pages.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Failed to delete page:", error);
      return false;
    }
  }

  // Chat methods implementation
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { chatMessages } = await import("@shared/schema");
      return await db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.timestamp);
    } catch (error) {
      console.log("Chat messages table not yet available, returning empty array");
      return [];
    }
  }

  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    try {
      const { chatMessages } = await import("@shared/schema");
      const [message] = await db.insert(chatMessages).values({
        ...messageData,
        id: crypto.randomUUID(),
        timestamp: new Date()
      }).returning();
      return message;
    } catch (error) {
      console.error("Failed to create chat message:", error);
      throw new Error("Failed to create chat message");
    }
  }
}