import { eq, desc, and, sql as drizzleSql } from "drizzle-orm";
import { db, categoriesTable, formulationsTable, productPropertiesTable, userNotesTable, pagesTable, blogPostsTable, userFormulationRequestsTable, formulationContentTable, sampleProductsTable, usersTable, sql } from "./db";
import type { Category, InsertCategory, Formulation, InsertFormulation, UserNote, InsertUserNote, User, UpsertUser, Page, InsertPage, BlogPost, InsertBlogPost, ChatMessage, InsertChatMessage, UserFormulationRequest, InsertUserFormulationRequest, FormulationContent, InsertFormulationContent, SampleProduct, InsertSampleProduct } from "@shared/schema";
import type { IStorage, IAiGeneration } from "./storage";
import crypto from "crypto";
import { randomUUID } from "crypto";

export class DatabaseStorage implements IStorage {
  // In-memory AI generations tracking (for demo purposes)
  private aiGenerations: Map<string, IAiGeneration> = new Map();
  // In-memory formulation content (fallback storage)
  private formulationContent: Map<string, FormulationContent> = new Map();

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
      
      // Try variations of the slug (with -formula, -formulation suffixes)
      const slugVariations = [
        slug,
        slug.endsWith('-formula') ? slug : slug + '-formula',
        slug.endsWith('-formulation') ? slug : slug + '-formulation',
      ];
      
      for (const variation of slugVariations) {
        const [result] = await db.select().from(formulationsTable).where(eq(formulationsTable.slug, variation));
        if (result) {
          return this.mapDbFormulationToFormulation(result);
        }
      }
      
      // If no exact match, try to find by generated slug from name
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
    // Use custom slug if provided, otherwise generate from name
    const slug = formulation.slug?.trim() 
      ? this.generateSlugFromName(formulation.slug.trim())
      : this.generateSlugFromNameWithCategory(formulation.name, formulation.categoryId);
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
      pdfPath: formulation.pdfPath,
      textPath: formulation.textPath,
      userId: formulation.userId,
      isActive: formulation.isActive ?? true,
    }).returning();
    return this.mapDbFormulationToFormulation(created);
  }

  async updateFormulation(id: string, formulation: Partial<InsertFormulation>): Promise<Formulation | undefined> {
    const updateData = { ...formulation };
    
    // Process slug if it's being updated
    if (updateData.slug !== undefined) {
      if (updateData.slug?.trim()) {
        // Custom slug provided - sanitize it
        updateData.slug = this.generateSlugFromName(updateData.slug.trim());
      } else if (updateData.name) {
        // Slug cleared but name provided - generate from name
        updateData.slug = this.generateSlugFromNameWithCategory(updateData.name, updateData.categoryId || '');
      }
    }
    
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
      pdfPath: dbFormulation.pdfPath,
      textPath: dbFormulation.textPath,
      userId: dbFormulation.userId,
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

  // User Authentication methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
      return user || undefined;
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
      return user || undefined;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }

  async createUser(userData: { email: string; password: string; firstName?: string; lastName?: string; country?: string }): Promise<User> {
    try {
      const [user] = await db
        .insert(usersTable)
        .values({
          id: randomUUID(),
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          country: userData.country || null,
          profileImageUrl: null,
          isAdmin: false,
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const { isAdmin, ...updateData } = userData;
      
      const [user] = await db
        .insert(usersTable)
        .values({
          id: userData.id,
          email: userData.email || '',
          password: userData.password || '',
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          country: userData.country || null,
          profileImageUrl: userData.profileImageUrl || null,
          isAdmin: userData.isAdmin || false,
        })
        .onConflictDoUpdate({
          target: usersTable.id,
          set: {
            ...updateData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
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
      const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
      return user?.isAdmin || false;
    } catch (error) {
      console.log("Error checking admin status by email:", error);
      return false;
    }
  }

  async grantAdminRights(email: string): Promise<boolean> {
    try {
      const result = await db
        .update(usersTable)
        .set({ 
          isAdmin: true,
          updatedAt: new Date()
        })
        .where(eq(usersTable.email, email))
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

  // User downloads and favorites methods
  async trackDownload(userId: string, formulationId: string, formulationName: string, categoryName: string): Promise<void> {
    try {
      const { userDownloads } = await import("@shared/schema");
      await db.insert(userDownloads).values({
        userId,
        formulationId,
        formulationName,
        categoryName,
        downloadedAt: new Date(),
      });
    } catch (error) {
      console.error("Error tracking download:", error);
    }
  }

  async getUserDownloads(userId: string): Promise<any[]> {
    try {
      const { userDownloads, formulations, categories } = await import("@shared/schema");
      const downloads = await db
        .select({
          id: userDownloads.id,
          formulationId: userDownloads.formulationId,
          formulationName: userDownloads.formulationName,
          categoryName: userDownloads.categoryName,
          downloadedAt: userDownloads.downloadedAt,
          formulation: formulations,
        })
        .from(userDownloads)
        .leftJoin(formulations, sql`${userDownloads.formulationId}::uuid = ${formulations.id}`)
        .where(eq(userDownloads.userId, userId))
        .orderBy(desc(userDownloads.downloadedAt));
      return downloads;
    } catch (error) {
      console.error("Error getting user downloads:", error);
      return [];
    }
  }

  async addFavorite(userId: string, formulationId: string): Promise<void> {
    try {
      const { userFavorites } = await import("@shared/schema");
      await db.insert(userFavorites).values({
        userId,
        formulationId,
        addedAt: new Date(),
      });
    } catch (error) {
      console.error("Error adding favorite:", error);
      throw error;
    }
  }

  async removeFavorite(userId: string, formulationId: string): Promise<void> {
    try {
      const { userFavorites } = await import("@shared/schema");
      await db
        .delete(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, userId),
            eq(userFavorites.formulationId, formulationId)
          )
        );
    } catch (error) {
      console.error("Error removing favorite:", error);
      throw error;
    }
  }

  async getUserFavorites(userId: string): Promise<any[]> {
    try {
      const { userFavorites, formulations, categories } = await import("@shared/schema");
      const favorites = await db
        .select({
          id: userFavorites.id,
          formulationId: userFavorites.formulationId,
          addedAt: userFavorites.addedAt,
          formulation: formulations,
          categoryName: categories.name,
        })
        .from(userFavorites)
        .leftJoin(formulations, eq(userFavorites.formulationId, formulations.slug))
        .leftJoin(categories, eq(formulations.categoryId, categories.id))
        .where(eq(userFavorites.userId, userId))
        .orderBy(desc(userFavorites.addedAt));
      return favorites;
    } catch (error) {
      console.error("Error getting user favorites:", error);
      return [];
    }
  }

  async getUserGeneratedFormulations(userId: string): Promise<any[]> {
    try {
      const { formulations, categories } = await import("@shared/schema");
      const generated = await db
        .select({
          id: formulations.id,
          name: formulations.name,
          slug: formulations.slug,
          description: formulations.description,
          createdAt: formulations.createdAt,
          categoryName: categories.name,
        })
        .from(formulations)
        .leftJoin(categories, eq(formulations.categoryId, categories.id))
        .where(eq(formulations.userId, userId))
        .orderBy(desc(formulations.createdAt));
      return generated;
    } catch (error) {
      console.error("Error getting user generated formulations:", error);
      return [];
    }
  }

  // Admin methods
  async getUserById(userId: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
      return user || undefined;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          country: usersTable.country,
          isAdmin: usersTable.isAdmin,
          createdAt: usersTable.createdAt,
        })
        .from(usersTable)
        .orderBy(desc(usersTable.createdAt));
      return allUsers as User[];
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  async getAllDownloadsAdmin(): Promise<any[]> {
    try {
      const { userDownloads, formulations } = await import("@shared/schema");
      const downloads = await db
        .select({
          id: userDownloads.id,
          userId: userDownloads.userId,
          formulationId: userDownloads.formulationId,
          formulationName: userDownloads.formulationName,
          categoryName: userDownloads.categoryName,
          downloadedAt: userDownloads.downloadedAt,
          userEmail: usersTable.email,
          userFirstName: usersTable.firstName,
          userLastName: usersTable.lastName,
          userCountry: usersTable.country,
          formulation: formulations,
        })
        .from(userDownloads)
        .leftJoin(usersTable, eq(userDownloads.userId, usersTable.id))
        .leftJoin(formulations, sql`cast(${userDownloads.formulationId} as uuid) = ${formulations.id}`)
        .orderBy(desc(userDownloads.downloadedAt));
      return downloads;
    } catch (error) {
      console.error("Error getting all downloads:", error);
      return [];
    }
  }

  async getAllFavoritesAdmin(): Promise<any[]> {
    try {
      const { userFavorites, formulations } = await import("@shared/schema");
      const favorites = await db
        .select({
          id: userFavorites.id,
          userId: userFavorites.userId,
          formulationId: userFavorites.formulationId,
          addedAt: userFavorites.addedAt,
          userEmail: usersTable.email,
          userFirstName: usersTable.firstName,
          userLastName: usersTable.lastName,
          userCountry: usersTable.country,
          formulation: formulations,
        })
        .from(userFavorites)
        .leftJoin(usersTable, eq(userFavorites.userId, usersTable.id))
        .leftJoin(formulations, eq(userFavorites.formulationId, formulations.slug))
        .orderBy(desc(userFavorites.addedAt));
      return favorites;
    } catch (error) {
      console.error("Error getting all favorites:", error);
      return [];
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
      // Use Neon client directly with parameterized query to bypass Drizzle ORM
      const sessionId = requestData.sessionId || 'unknown-session';
      const query = `
        INSERT INTO user_formulation_requests (
          id, user_id, session_id, customer_name, email, country, product_name, product_category,
          consistency_type, viscosity, ph_level, shelf_life, special_properties, budget_category,
          production_volume, regulatory_requirements, additional_notes, form_data, formulation_id,
          status, admin_notes, ip_address, user_agent, created_at, reviewed_at, reviewed_by
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
          null, null, null, now(), null, null
        )
        RETURNING *;
      `;
      
      const result = await sql(query, [
        requestData.userId || null,
        sessionId,
        requestData.customerName || null,
        requestData.email || null,
        requestData.country || null,
        requestData.productName,
        requestData.productCategory,
        requestData.consistencyType || null,
        requestData.viscosity || null,
        requestData.phLevel || null,
        requestData.shelfLife || null,
        requestData.specialProperties ? JSON.stringify(requestData.specialProperties) : null,
        requestData.budgetCategory || null,
        requestData.productionVolume || null,
        requestData.regulatoryRequirements ? JSON.stringify(requestData.regulatoryRequirements) : null,
        requestData.additionalNotes || null,
        JSON.stringify(requestData.formData),
        requestData.formulationId || null,
        requestData.status || 'pending'
      ]);
      
      const records = result as UserFormulationRequest[];
      if (!records || records.length === 0) {
        throw new Error("No record returned from insert");
      }
      return records[0];
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

  // Formulation Content methods (database storage)
  async getFormulationContent(formulationId: string): Promise<FormulationContent | undefined> {
    try {
      const [content] = await db
        .select()
        .from(formulationContentTable)
        .where(eq(formulationContentTable.formulationId, formulationId));
      return content;
    } catch (error) {
      console.error("Failed to get formulation content:", error);
      return undefined;
    }
  }

  async createFormulationContent(contentData: InsertFormulationContent): Promise<FormulationContent> {
    try {
      const [created] = await db
        .insert(formulationContentTable)
        .values(contentData)
        .returning();
      return created;
    } catch (error) {
      console.error("Failed to create formulation content:", error);
      throw error;
    }
  }

  async updateFormulationContent(formulationId: string, contentData: Partial<InsertFormulationContent>): Promise<FormulationContent | undefined> {
    try {
      const [updated] = await db
        .update(formulationContentTable)
        .set({
          ...contentData,
          updatedAt: new Date(),
        })
        .where(eq(formulationContentTable.formulationId, formulationId))
        .returning();
      return updated;
    } catch (error) {
      console.error("Failed to update formulation content:", error);
      return undefined;
    }
  }

  async deleteFormulationContent(formulationId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(formulationContentTable)
        .where(eq(formulationContentTable.formulationId, formulationId));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Failed to delete formulation content:", error);
      return false;
    }
  }

  // Sample Products Management
  async getSampleProducts(): Promise<SampleProduct[]> {
    try {
      const products = await db
        .select()
        .from(sampleProductsTable)
        .where(eq(sampleProductsTable.isActive, true))
        .orderBy(desc(sampleProductsTable.createdAt));
      return products;
    } catch (error) {
      console.error("Failed to fetch sample products:", error);
      return [];
    }
  }

  async getSampleProduct(id: string): Promise<SampleProduct | undefined> {
    try {
      const [product] = await db
        .select()
        .from(sampleProductsTable)
        .where(eq(sampleProductsTable.id, id));
      return product;
    } catch (error) {
      console.error("Failed to fetch sample product:", error);
      return undefined;
    }
  }

  async createSampleProduct(product: InsertSampleProduct): Promise<SampleProduct> {
    try {
      const [created] = await db
        .insert(sampleProductsTable)
        .values({
          title: product.title,
          description: product.description,
          image: product.image,
          link: product.link,
          category: product.category || "General",
          isActive: product.isActive ?? true,
        })
        .returning();
      return created;
    } catch (error) {
      console.error("Failed to create sample product:", error);
      throw error;
    }
  }

  async updateSampleProduct(id: string, product: Partial<InsertSampleProduct>): Promise<SampleProduct | undefined> {
    try {
      const [updated] = await db
        .update(sampleProductsTable)
        .set({
          ...product,
          updatedAt: new Date(),
        })
        .where(eq(sampleProductsTable.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Failed to update sample product:", error);
      return undefined;
    }
  }

  async deleteSampleProduct(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(sampleProductsTable)
        .where(eq(sampleProductsTable.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Failed to delete sample product:", error);
      return false;
    }
  }
}