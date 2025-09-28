import { eq, desc } from "drizzle-orm";
import { db, categoriesTable, formulationsTable, productPropertiesTable, userNotesTable, pagesTable, blogPostsTable, userFormulationRequestsTable } from "./db";
import type { Category, InsertCategory, Formulation, InsertFormulation, UserNote, InsertUserNote, User, UpsertUser, Page, InsertPage, BlogPost, InsertBlogPost, ChatMessage, InsertChatMessage, UserFormulationRequest, InsertUserFormulationRequest } from "@shared/schema";
import type { IStorage, IAiGeneration } from "./storage";
import crypto from "crypto";

export class DatabaseStorage implements IStorage {
  // In-memory AI generations tracking (for demo purposes)
  private aiGenerations: Map<string, IAiGeneration> = new Map();

  constructor() {
    // Initialize with empty AI generations map - no dummy data
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

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, slug));
    return category ? this.mapDbCategoryToCategory(category) : undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const slug = category.slug || this.generateCategorySlugFromName(category.name);
    const [created] = await db.insert(categoriesTable).values({
      name: category.name,
      slug: slug,
      description: category.description,
      metaDescription: category.metaDescription || `Explore professional ${category.name.toLowerCase()} formulations with complete manufacturing guides.`,
      keywords: category.keywords || `${category.name.toLowerCase()}, formulations, manufacturing, chemical recipes`,
      icon: category.icon || "fas fa-flask",
      image: category.image || "",
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

  async getFormulationBySlug(slug: string): Promise<Formulation | undefined> {
    try {
      // First try to find by exact slug match
      const [formulation] = await db.select().from(formulationsTable).where(eq(formulationsTable.slug, slug));
      if (formulation) {
        return this.mapDbFormulationToFormulation(formulation);
      }
      
      // If no exact match, try to find by generated slug from name (with and without category)
      const allFormulations = await db.select().from(formulationsTable);
      for (const f of allFormulations) {
        const generatedSlug = this.generateSlugFromName(f.name);
        const generatedSlugWithCategory = this.generateSlugFromNameWithCategory(f.name, f.categoryId);
        if (generatedSlug === slug || generatedSlugWithCategory === slug) {
          return this.mapDbFormulationToFormulation(f);
        }
      }
      
      return undefined;
    } catch (error) {
      console.error('Error fetching formulation by slug:', error);
      return undefined;
    }
  }

  async createFormulation(formulation: InsertFormulation): Promise<Formulation> {
    const slug = this.generateSlugFromNameWithCategory(formulation.name, formulation.categoryId);
    const [created] = await db.insert(formulationsTable).values({
      categoryId: formulation.categoryId,
      name: formulation.name,
      slug: slug,
      description: formulation.description,
      seoTitle: formulation.seoTitle,
      metaDescription: formulation.metaDescription || `Professional ${formulation.name} formulation with complete manufacturing guide and ingredients.`,
      keywords: formulation.keywords || `${formulation.name}, chemical formulation, manufacturing guide`,
      image: formulation.image,
      imageAlt: formulation.imageAlt,
      imageFilename: formulation.imageFilename,
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

  // Admin formulation methods
  async getAllFormulations(): Promise<Formulation[]> {
    // Get all formulations including inactive ones for admin management
    const formulations = await db.select().from(formulationsTable)
      .orderBy(desc(formulationsTable.createdAt));
    return formulations.map(this.mapDbFormulationToFormulation);
  }

  async updateFormulationStatus(id: string, isActive: boolean): Promise<Formulation | undefined> {
    const [updated] = await db
      .update(formulationsTable)
      .set({ 
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(formulationsTable.id, id))
      .returning();
    return updated ? this.mapDbFormulationToFormulation(updated) : undefined;
  }

  // Helper methods to map database types to schema types
  private mapDbCategoryToCategory = (dbCategory: any): Category => {
    // Generate SEO slug on-the-fly if missing
    const slug = dbCategory.slug || this.generateCategorySlugFromName(dbCategory.name);
    
    return {
      id: dbCategory.id,
      name: dbCategory.name,
      slug: slug,
      description: dbCategory.description,
      metaDescription: dbCategory.metaDescription || `Explore professional ${dbCategory.name.toLowerCase()} formulations with complete manufacturing guides.`,
      keywords: dbCategory.keywords || `${dbCategory.name.toLowerCase()}, formulations, manufacturing, chemical recipes`,
      icon: dbCategory.icon,
      image: dbCategory.image,
      isActive: dbCategory.isActive ?? true,
      createdAt: dbCategory.createdAt,
    };
  }

  private generateCategorySlugFromName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  private mapDbFormulationToFormulation = (dbFormulation: any): Formulation => {
    // Generate SEO slug on-the-fly if missing, including category name
    const slug = dbFormulation.slug || this.generateSlugFromNameWithCategory(dbFormulation.name, dbFormulation.categoryId);
    
    return {
      id: dbFormulation.id,
      categoryId: dbFormulation.categoryId,
      name: dbFormulation.name,
      slug: slug,
      description: dbFormulation.description,
      seoTitle: dbFormulation.seoTitle,
      metaDescription: dbFormulation.metaDescription || `Professional ${dbFormulation.name} formulation with complete manufacturing guide and ingredients.`,
      keywords: dbFormulation.keywords || `${dbFormulation.name}, chemical formulation, manufacturing guide`,
      image: dbFormulation.image,
      imageAlt: dbFormulation.imageAlt,
      imageFilename: dbFormulation.imageFilename,
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
      isActive: dbFormulation.isActive ?? true,
      createdAt: dbFormulation.createdAt,
      updatedAt: dbFormulation.updatedAt,
    };
  }

  private generateSlugFromName(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Don't add -formula suffix if it already contains 'formula'
    if (baseSlug.includes('formula')) {
      return baseSlug;
    }
    
    return baseSlug + '-formula';
  }

  private generateSlugFromNameWithCategory(name: string, categoryId: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Return only the base slug without category name
    return baseSlug;
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
  async clearAiGenerations(): Promise<boolean> {
    this.aiGenerations.clear();
    return true;
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
        isAdmin: userData.isAdmin || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      return user?.isAdmin || false;
    } catch (error) {
      console.log("Error checking admin status:", error);
      return false;
    }
  }

  async isUserAdminByEmail(email: string): Promise<boolean> {
    try {
      const { users } = await import("@shared/schema");
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user?.isAdmin || false;
    } catch (error) {
      console.log("Error checking admin status by email:", error);
      return false;
    }
  }

  async grantAdminRights(email: string): Promise<boolean> {
    try {
      const { users } = await import("@shared/schema");
      const result = await db
        .update(users)
        .set({ 
          isAdmin: true,
          updatedAt: new Date()
        })
        .where(eq(users.email, email))
        .returning();
      
      if (result.length > 0) {
        console.log(`✅ Admin rights granted to ${email}`);
        return true;
      } else {
        console.log(`❌ User with email ${email} not found`);
        return false;
      }
    } catch (error) {
      console.error("Error granting admin rights:", error);
      return false;
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

  // Blog posts methods implementation
  async getBlogPosts(): Promise<BlogPost[]> {
    try {
      const { blogPosts } = await import("@shared/schema");
      return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
    } catch (error) {
      console.log("Blog posts table not yet available, returning empty array");
      return [];
    }
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    try {
      const { blogPosts } = await import("@shared/schema");
      return await db.select()
        .from(blogPosts)
        .where(eq(blogPosts.isPublished, true))
        .orderBy(desc(blogPosts.publishedAt));
    } catch (error) {
      console.log("Blog posts table not yet available, returning empty array");
      return [];
    }
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    try {
      const { blogPosts } = await import("@shared/schema");
      const [blogPost] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
      return blogPost;
    } catch (error) {
      console.log("Blog posts table not yet available, returning undefined");
      return undefined;
    }
  }

  async createBlogPost(blogPostData: InsertBlogPost): Promise<BlogPost> {
    try {
      const { blogPosts } = await import("@shared/schema");
      const [blogPost] = await db.insert(blogPosts).values({
        ...blogPostData,
        publishedAt: blogPostData.isPublished ? new Date() : null,
      }).returning();
      return blogPost;
    } catch (error) {
      console.error("Failed to create blog post:", error);
      throw new Error("Failed to create blog post");
    }
  }

  async updateBlogPost(id: string, blogPostData: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    try {
      const { blogPosts } = await import("@shared/schema");
      const existingPost = await this.getBlogPosts();
      const currentPost = existingPost.find(p => p.id === id);
      
      const updateData = {
        ...blogPostData,
        publishedAt: blogPostData.isPublished !== undefined 
          ? (blogPostData.isPublished ? (currentPost?.publishedAt || new Date()) : null)
          : currentPost?.publishedAt || null,
        updatedAt: new Date()
      };

      const [blogPost] = await db
        .update(blogPosts)
        .set(updateData)
        .where(eq(blogPosts.id, id))
        .returning();
      return blogPost;
    } catch (error) {
      console.error("Failed to update blog post:", error);
      return undefined;
    }
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    try {
      const { blogPosts } = await import("@shared/schema");
      const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Failed to delete blog post:", error);
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

  // User Formulation Requests methods
  async getUserFormulationRequests(): Promise<UserFormulationRequest[]> {
    try {
      return await db.select().from(userFormulationRequestsTable).orderBy(desc(userFormulationRequestsTable.createdAt));
    } catch (error) {
      console.log("User formulation requests table not yet available, returning empty array");
      return [];
    }
  }

  async getUserFormulationRequest(id: string): Promise<UserFormulationRequest | undefined> {
    try {
      const [request] = await db.select().from(userFormulationRequestsTable).where(eq(userFormulationRequestsTable.id, id));
      return request;
    } catch (error) {
      console.error("Failed to get user formulation request:", error);
      return undefined;
    }
  }

  async createUserFormulationRequest(requestData: InsertUserFormulationRequest): Promise<UserFormulationRequest> {
    try {
      const [request] = await db.insert(userFormulationRequestsTable).values(requestData).returning();
      return request;
    } catch (error) {
      console.error("Failed to create user formulation request:", error);
      throw new Error("Failed to create user formulation request");
    }
  }

  async updateUserFormulationRequestStatus(id: string, status: string, adminNotes?: string, reviewedBy?: string): Promise<UserFormulationRequest | undefined> {
    try {
      const [updated] = await db
        .update(userFormulationRequestsTable)
        .set({ 
          status,
          adminNotes,
          reviewedBy,
          reviewedAt: new Date()
        })
        .where(eq(userFormulationRequestsTable.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Failed to update user formulation request status:", error);
      return undefined;
    }
  }

  async deleteUserFormulationRequest(id: string): Promise<boolean> {
    try {
      const result = await db.delete(userFormulationRequestsTable).where(eq(userFormulationRequestsTable.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Failed to delete user formulation request:", error);
      return false;
    }
  }
}