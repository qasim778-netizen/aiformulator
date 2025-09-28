import type { Express } from "express";
import express from "express";
import path from "path";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";
import { storage } from "./storage";
import { insertCategorySchema, insertFormulationSchema, insertUserNoteSchema, insertPageSchema, insertBlogPostSchema } from "@shared/schema";
import type { ChatMessage, InsertChatMessage } from "@shared/schema";
import { generateCategory, generateFormulation, generateFormulationWithKeywords, generateBulkFormulations, generateBulkFormulationsWithKeywords, generateProductTypes, generateCustomFormulation } from "./ai";
import { generateCategorySuggestions } from "./services/openai";
import { generateFormulationPDF } from "./pdf-generator";
import { optimizeFormulationsForSEO } from "./seo-optimizer";
import { generateFormulationImages, addImageFieldToFormulations } from "./image-generator";
import { addSEOFields, generateStructuredData } from "./seo-utils";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { aiBlogGenerator } from "./ai-blog-generator";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Object Storage routes for image uploads
  app.post("/api/objects/upload", isAdmin, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Endpoint for setting ACL policy on formulation images
  app.put("/api/formulation-images", isAuthenticated, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: (req.user as any)?.claims?.sub || "system",
          visibility: "public", // Formulation images should be publicly visible
        }
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting formulation image ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/categories/:id/image", isAuthenticated, async (req, res) => {
    try {
      if (!req.body.imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      const categoryId = req.params.id;
      const objectStorageService = new ObjectStorageService();
      
      // Set ACL policy for public access (category images should be public)
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: (req.user as any)?.claims?.sub || "admin",
          visibility: "public",
        }
      );

      // Update category with the new image path
      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const updatedCategory = await storage.updateCategory(categoryId, {
        image: objectPath
      });

      res.json({ 
        success: true, 
        objectPath,
        category: updatedCategory 
      });
    } catch (error) {
      console.error("Error updating category image:", error);
      res.status(500).json({ error: "Failed to update category image" });
    }
  });

  app.put("/api/formulation-images", async (req, res) => {
    try {
      const { imageURL } = req.body;
      if (!imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(imageURL);

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting formulation image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve uploaded objects
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 1000; // Default large limit for non-paginated requests
      const offset = (page - 1) * limit;
      
      const allCategories = await storage.getCategories();
      const totalItems = allCategories.length;
      const totalPages = Math.ceil(totalItems / limit);
      
      const categories = allCategories.slice(offset, offset + limit);
      
      if (req.query.paginated === 'true') {
        res.json({
          data: categories,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit
          }
        });
      } else {
        res.json(categories);
      }
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      console.error("Stack trace:", error.stack);
      res.status(500).json({ message: "Failed to fetch categories", error: error.message });
    }
  });

  app.get("/api/categories/:identifier", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      let category;
      
      // Check if identifier is a UUID (contains hyphens and is 36 chars long)
      if (identifier.includes('-') && identifier.length === 36) {
        category = await storage.getCategory(identifier);
      } else {
        // Try to find by slug
        category = await storage.getCategoryBySlug(identifier);
      }
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", isAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", isAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid category data" });
    }
  });

  app.delete("/api/categories/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteCategory(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Formulations API
  app.get("/api/formulations", async (req, res) => {
    try {
      const { categoryId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 1000; // Default large limit for non-paginated requests
      const offset = (page - 1) * limit;
      
      let allFormulations;
      
      if (categoryId) {
        allFormulations = await storage.getFormulationsByCategory(categoryId as string);
      } else {
        allFormulations = await storage.getFormulations();
      }
      
      const totalItems = allFormulations.length;
      const totalPages = Math.ceil(totalItems / limit);
      const formulations = allFormulations.slice(offset, offset + limit);
      
      if (req.query.paginated === 'true') {
        res.json({
          data: formulations,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit
          }
        });
      } else {
        res.json(formulations);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch formulations" });
    }
  });

  // Get formulation by ID or slug
  app.get("/api/formulations/:identifier", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      let formulation;
      
      // Check if identifier is a UUID (contains hyphens and proper length)
      if (identifier.includes('-') && identifier.length === 36) {
        formulation = await storage.getFormulation(identifier);
      } else {
        // Try to find by slug
        formulation = await storage.getFormulationBySlug(identifier);
      }
      
      if (!formulation) {
        return res.status(404).json({ message: "Formulation not found" });
      }
      res.json(formulation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch formulation" });
    }
  });

  app.post("/api/formulations", isAdmin, async (req, res) => {
    try {
      const validatedData = insertFormulationSchema.parse(req.body);
      const formulation = await storage.createFormulation(validatedData);
      res.status(201).json(formulation);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid formulation data" });
    }
  });

  app.put("/api/formulations/:id", isAdmin, async (req, res) => {
    try {
      const validatedData = insertFormulationSchema.partial().parse(req.body);
      const formulation = await storage.updateFormulation(req.params.id, validatedData);
      if (!formulation) {
        return res.status(404).json({ message: "Formulation not found" });
      }
      res.json(formulation);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid formulation data" });
    }
  });

  app.delete("/api/formulations/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteFormulation(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Formulation not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete formulation" });
    }
  });

  // Dashboard stats (protected admin route)
  app.get("/api/stats", isAdmin, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      const formulations = await storage.getFormulations();
      
      const stats = {
        totalCategories: categories.length,
        totalFormulations: formulations.length,
        activeFormulations: formulations.filter(f => f.isActive).length,
        draftFormulations: formulations.filter(f => !f.isActive).length,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // AI Analytics endpoint (protected admin route)
  app.get("/api/ai-analytics", isAdmin, async (req, res) => {
    try {
      // Get real AI generation data from storage
      const aiGenerations = await storage.getAiGenerations();
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
      const thisMonth = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

      // Calculate statistics
      const totalAiGenerations = aiGenerations.length;
      const dailyGenerations = aiGenerations.filter(gen => new Date(gen.timestamp) >= today).length;
      const weeklyGenerations = aiGenerations.filter(gen => new Date(gen.timestamp) >= thisWeek).length;
      const monthlyGenerations = aiGenerations.filter(gen => new Date(gen.timestamp) >= thisMonth).length;

      // Popular categories
      const categoryCount: Record<string, number> = {};
      aiGenerations.forEach(gen => {
        categoryCount[gen.category] = (categoryCount[gen.category] || 0) + 1;
      });
      const popularCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Usage by country
      const countryCount: Record<string, number> = {};
      aiGenerations.forEach(gen => {
        if (gen.country) {
          countryCount[gen.country] = (countryCount[gen.country] || 0) + 1;
        }
      });
      const usageByCountry = Object.entries(countryCount)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Recent generations with pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const sortedGenerations = aiGenerations
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const recentGenerations = sortedGenerations
        .slice(offset, offset + limit)
        .map(gen => ({
          id: gen.id,
          productName: gen.productName,
          category: gen.category,
          timestamp: gen.timestamp,
          sessionId: gen.sessionId,
          country: gen.country,
          city: gen.city,
        }));
      
      const totalPages = Math.ceil(sortedGenerations.length / limit);

      // Generations by hour (24 hour format)
      const hourCounts = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
      aiGenerations.forEach(gen => {
        const hour = new Date(gen.timestamp).getHours();
        if (hourCounts[hour]) {
          hourCounts[hour].count++;
        }
      });

      // Average response time
      const responseTimes = aiGenerations.map(gen => gen.responseTime || 5);
      const avgResponseTime = responseTimes.length > 0 
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length * 10) / 10
        : 0;

      const analytics = {
        totalAiGenerations,
        dailyGenerations,
        weeklyGenerations,
        monthlyGenerations,
        popularCategories,
        usageByCountry,
        recentGenerations,
        generationsByHour: hourCounts,
        avgResponseTime,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: sortedGenerations.length,
          itemsPerPage: limit
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error("Failed to fetch AI analytics:", error);
      res.status(500).json({ message: "Failed to fetch AI analytics" });
    }
  });

  // Admin Image Generator endpoint
  app.post('/api/admin/generate-image', isAdmin, async (req, res) => {
    try {
      const { name, brandName, referenceImageBase64 } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "Formulation name is required" });
      }

      const cleanName = name.trim();
      const cleanBrandName = (brandName || "AIFormulator").trim();
      
      console.log(`🎨 Admin generating image for: ${cleanName}${referenceImageBase64 ? ' (with reference image)' : ''}`);

      // Generate the image with exact specifications
      const { generateFormulationImageWithReference } = await import('./ai');
      const result = await generateFormulationImageWithReference(cleanName, cleanBrandName, referenceImageBase64);
      
      if (!result.imageUrl) {
        throw new Error("Failed to generate image");
      }

      // Track AI generation for analytics
      await storage.trackAiGeneration({
        productName: cleanName,
        category: 'image_generation',
        sessionId: req.sessionID || 'admin',
        timestamp: new Date().toISOString(),
        formData: { input: cleanName, output: result.fileName }
      });
      
      console.log(`✅ Admin image generated successfully: ${result.fileName}`);
      
      res.json({
        imageUrl: result.imageUrl,
        fileName: result.fileName,
        seoData: result.seoData
      });

    } catch (error) {
      console.error("Error generating admin image:", error);
      res.status(500).json({ 
        error: "Failed to generate image", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin Alt Text Generator endpoint
  app.post('/api/admin/generate-alt-text', isAdmin, async (req, res) => {
    try {
      const { name } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "Formulation name is required" });
      }

      const cleanName = name.trim();
      
      console.log(`📝 Admin generating alt text for: ${cleanName}`);

      // Generate alt text using AI
      const { generateAltText } = await import('./ai');
      const altText = await generateAltText(cleanName);
      
      if (!altText) {
        throw new Error("Failed to generate alt text");
      }

      // Track AI generation for analytics
      await storage.trackAiGeneration({
        productName: cleanName,
        category: 'alt_text_generation',
        sessionId: req.sessionID || 'admin',
        timestamp: new Date().toISOString(),
        formData: { input: cleanName, output: altText }
      });
      
      console.log(`✅ Admin alt text generated successfully: ${altText}`);
      
      res.json({
        altText: altText
      });

    } catch (error) {
      console.error("Error generating alt text:", error);
      res.status(500).json({ 
        error: "Failed to generate alt text", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Clear AI analytics data (admin only)
  app.delete("/api/ai-analytics", isAdmin, async (req, res) => {
    try {
      const success = await storage.clearAiGenerations();
      if (success) {
        res.json({ message: "AI analytics data cleared successfully" });
      } else {
        res.status(500).json({ message: "Failed to clear AI analytics data" });
      }
    } catch (error) {
      console.error("Failed to clear AI analytics:", error);
      res.status(500).json({ message: "Failed to clear AI analytics data" });
    }
  });

  // SEO Optimization endpoint (protected admin route)
  app.post("/api/admin/optimize-seo", isAdmin, async (req, res) => {
    try {
      const result = await optimizeFormulationsForSEO();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to optimize formulations for SEO" });
    }
  });

  // Image Generation endpoints (protected admin route)
  app.post("/api/admin/setup-images", isAdmin, async (req, res) => {
    try {
      await addImageFieldToFormulations();
      res.status(200).json({ message: "Image fields added to database successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to setup image fields" });
    }
  });

  app.post("/api/admin/generate-images", isAdmin, async (req, res) => {
    try {
      const result = await generateFormulationImages();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate formulation images" });
    }
  });

  // Admin formulation management endpoints
  app.get("/api/admin/formulations", isAdmin, async (req, res) => {
    try {
      const { categoryId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      let formulations;
      
      if (categoryId && categoryId !== "all") {
        // Filter by category if categoryId is provided
        formulations = await storage.getFormulationsByCategory(categoryId as string);
      } else {
        // Get all formulations including inactive
        formulations = await storage.getAllFormulations();
      }
      
      const totalItems = formulations.length;
      const totalPages = Math.ceil(totalItems / limit);
      const paginatedFormulations = formulations
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Newest first
        .slice(offset, offset + limit);
      
      res.json({
        data: paginatedFormulations,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin formulations" });
    }
  });

  app.patch("/api/admin/formulations/:id/status", isAdmin, async (req, res) => {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }

      const formulation = await storage.updateFormulationStatus(req.params.id, isActive);
      if (!formulation) {
        return res.status(404).json({ message: "Formulation not found" });
      }

      res.json({ 
        message: `Formulation ${isActive ? 'activated' : 'deactivated'} successfully`,
        formulation 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update formulation status" });
    }
  });

  // User Formulation Requests management endpoints (admin only)
  app.get("/api/admin/user-formulation-requests", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;
      
      let requests = await storage.getUserFormulationRequests();
      
      // Filter by status if specified
      if (status && status !== "all") {
        requests = requests.filter(request => request.status === status);
      }
      
      const totalItems = requests.length;
      const totalPages = Math.ceil(totalItems / limit);
      const offset = (page - 1) * limit;
      const paginatedRequests = requests.slice(offset, offset + limit);
      
      res.json({
        data: paginatedRequests,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error("Failed to fetch user formulation requests:", error);
      res.status(500).json({ message: "Failed to fetch user formulation requests" });
    }
  });

  app.get("/api/admin/user-formulation-requests/:id", async (req, res) => {
    try {
      const request = await storage.getUserFormulationRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "User formulation request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Failed to fetch user formulation request:", error);
      res.status(500).json({ message: "Failed to fetch user formulation request" });
    }
  });

  app.patch("/api/admin/user-formulation-requests/:id/status", isAdmin, async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      if (!status || !["pending", "reviewed", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Valid status is required (pending, reviewed, approved, rejected)" });
      }

      // TODO: Get admin user from req.user when authentication is fully implemented
      const reviewedBy = "admin"; // In future, get from req.user

      const updatedRequest = await storage.updateUserFormulationRequestStatus(
        req.params.id,
        status,
        adminNotes,
        reviewedBy
      );

      if (!updatedRequest) {
        return res.status(404).json({ message: "User formulation request not found" });
      }

      res.json({
        message: `User formulation request status updated to ${status}`,
        request: updatedRequest
      });
    } catch (error) {
      console.error("Failed to update user formulation request status:", error);
      res.status(500).json({ message: "Failed to update user formulation request status" });
    }
  });

  app.delete("/api/admin/user-formulation-requests/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteUserFormulationRequest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User formulation request not found" });
      }
      res.json({ message: "User formulation request deleted successfully" });
    } catch (error) {
      console.error("Failed to delete user formulation request:", error);
      res.status(500).json({ message: "Failed to delete user formulation request" });
    }
  });

  // AI Category Suggestion endpoints
  app.post("/api/admin/suggest-categories", isAdmin, async (req, res) => {
    try {
      // Get existing categories
      const existingCategories = await storage.getCategories();
      const categoryNames = existingCategories.map(cat => cat.name);
      
      // Generate AI suggestions
      const suggestions = await generateCategorySuggestions(categoryNames);
      
      res.json({ suggestions });
    } catch (error) {
      console.error("Failed to generate category suggestions:", error);
      res.status(500).json({ message: "Failed to generate category suggestions" });
    }
  });

  app.post("/api/admin/categories", isAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse({
        ...req.body,
        // Provide default image if not specified
        image: req.body.image || "/placeholder-category.jpg"
      });
      
      // Check if category with same name already exists
      const existingCategories = await storage.getCategories();
      const existingNames = existingCategories.map(cat => cat.name.toLowerCase());
      
      if (existingNames.includes(validatedData.name.toLowerCase())) {
        return res.status(400).json({ message: "Category with this name already exists" });
      }

      const category = await storage.createCategory(validatedData);
      res.status(201).json({
        message: "Category created successfully",
        category
      });
    } catch (error) {
      console.error("Failed to create category:", error);
      if (error instanceof Error && error.message.includes('validation')) {
        res.status(400).json({ message: "Invalid category data provided" });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  // AI Generation endpoints (protected admin routes)
  app.post("/api/ai/generate-category", isAdmin, async (req, res) => {
    try {
      const { description } = req.body;
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }

      // Get existing category names to avoid duplicates
      const existingCategories = await storage.getCategories();
      const existingNames = existingCategories.map(cat => cat.name);

      const categoryData = await generateCategory(description, existingNames);
      const category = await storage.createCategory(categoryData);
      
      res.status(201).json(category);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate category" });
    }
  });

  app.post("/api/ai/generate-formulation", isAdmin, async (req, res) => {
    try {
      const { categoryId, productDescription } = req.body;
      if (!categoryId || !productDescription) {
        return res.status(400).json({ message: "Category ID and product description are required" });
      }

      // Only handle new formulation categories (22 categories)
      const formulation_categories: Record<string, { name: string; description: string }> = {
        "3d-printing-materials-formulations": { name: "3D Printing Materials Formulations", description: "Advanced materials for 3D printing applications" },
        "advanced-agricultural-chemicals-formulations": { name: "Advanced Agricultural Chemicals Formulations", description: "Professional agricultural chemical solutions" },
        "automotive-coating-solutions-formulations": { name: "Automotive Coating Solutions Formulations", description: "Protective coatings for automotive applications" },
        "baby-care-formulations": { name: "Baby Care Formulations", description: "Safe and gentle baby care products" },
        "beauty-products-formulations": { name: "Beauty Products Formulations", description: "Beauty and cosmetic formulations" },
        "biodegradable-packaging-solutions-formulations": { name: "Biodegradable Packaging Solutions Formulations", description: "Eco-friendly packaging materials" },
        "cleaning-products-formulations": { name: "Cleaning Products Formulations", description: "Household and industrial cleaning solutions" },
        "detergent-formulations": { name: "Detergent Formulations", description: "Laundry and dishwashing detergent formulations" },
        "hair-enrichment-solutions-formulations": { name: "Hair Enrichment Solutions Formulations", description: "Advanced hair care and treatment products" },
        "leather-products-formulations": { name: "Leather Products Formulations", description: "Leather care and treatment formulations" },
        "mens-care-style-formulations": { name: "Men's Care & Style Formulations", description: "Men's grooming and styling products" },
        "oral-care-formulations": { name: "Oral Care Formulations", description: "Dental and oral hygiene products" },
        "organic-care-products-formulations": { name: "Organic Care Products Formulations", description: "Natural and organic care formulations" },
        "professional-grooming-essentials-formulations": { name: "Professional Grooming Essentials Formulations", description: "Professional grooming and styling products" },
        "salon-base-innovations-formulations": { name: "Salon Base Innovations Formulations", description: "Innovative salon treatment bases" },
        "saloon-hair-treatment-formulations": { name: "Saloon Hair Treatment Formulations", description: "Professional salon hair treatments" },
        "shoe-care-formulations": { name: "Shoe Care Formulations", description: "Footwear care and maintenance products" },
        "skin-care-formulations": { name: "Skin Care Formulations", description: "Skincare and dermatological formulations" },
        "smart-textile-coatings-formulations": { name: "Smart Textile Coatings Formulations", description: "Advanced textile coating technologies" },
        "water-treatment-solutions-formulations": { name: "Water Treatment Solutions Formulations", description: "Water purification and treatment chemicals" },
        "construction-material-formulations": { name: "Construction Material Formulations", description: "Building and construction material formulations" },
        "pet-care-formulations": { name: "Pet Care Formulations", description: "Pet care and veterinary formulations" }
      };

      const selectedCategory = formulation_categories[categoryId];
      if (!selectedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      const categoryName = selectedCategory.name;
      
      // Map to appropriate database category for storage
      const categoryMapping: Record<string, string> = {
        "3d-printing-materials-formulations": "construction material",
        "advanced-agricultural-chemicals-formulations": "Electronic Chemicals", 
        "automotive-coating-solutions-formulations": "Cleaning Products",
        "baby-care-formulations": "Baby Care",
        "beauty-products-formulations": "Beauty Products",
        "biodegradable-packaging-solutions-formulations": "construction material",
        "cleaning-products-formulations": "Cleaning Products",
        "detergent-formulations": "Detergent formulation",
        "hair-enrichment-solutions-formulations": "Beauty Products",
        "leather-products-formulations": "Leather Products",
        "mens-care-style-formulations": "Men Care",
        "oral-care-formulations": "Oral Care",
        "organic-care-products-formulations": "Organic Care",
        "professional-grooming-essentials-formulations": "Men Care",
        "salon-base-innovations-formulations": "Beauty Products",
        "saloon-hair-treatment-formulations": "Beauty Products",
        "shoe-care-formulations": "Shoe Care",
        "skin-care-formulations": "Skin Care",
        "smart-textile-coatings-formulations": "Cleaning Products",
        "water-treatment-solutions-formulations": "Cleaning Products",
        "construction-material-formulations": "construction material",
        "pet-care-formulations": "pet care"
      };

      const targetCategoryName = categoryMapping[categoryId];
      const categories = await storage.getCategories();
      const targetCategory = categories.find(c => c.name === targetCategoryName);
      const finalCategoryId = targetCategory?.id || categories[0]?.id || categoryId;

      const formulationData = await generateFormulation(categoryName, productDescription);
      const formulation = await storage.createFormulation({
        ...formulationData,
        categoryId: finalCategoryId
      });
      
      res.status(201).json(formulation);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate formulation" });
    }
  });

  // Generate formulation with formula keywords and image
  app.post("/api/ai/generate-formulation-with-keywords", isAdmin, async (req, res) => {
    try {
      const { categoryId, productDescription, includeImage = false } = req.body;
      if (!categoryId || !productDescription) {
        return res.status(400).json({ message: "Category ID and product description are required" });
      }

      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const formulationData = await generateFormulationWithKeywords(category.name, productDescription, includeImage);
      const formulation = await storage.createFormulation({
        ...formulationData,
        categoryId
      });
      
      res.status(201).json(formulation);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate formulation with keywords" });
    }
  });

  // Bulk AI Generation endpoint (protected admin route)
  app.post("/api/ai/generate-bulk-formulations", isAdmin, async (req, res) => {
    try {
      const { categoryId, count } = req.body;
      if (!categoryId || !count) {
        return res.status(400).json({ message: "Category ID and count are required" });
      }

      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Generate product types based on the category
      const productTypes = await generateProductTypes(category.name, category.description, count);
      const formulations = await generateBulkFormulations(category.name, count, productTypes);
      
      // Create all formulations in the database
      const createdFormulations = [];
      for (const formulationData of formulations) {
        try {
          // Add SEO fields to formulation data
          const formulationWithSEO = addSEOFields({
            ...formulationData,
            categoryId
          }, category.name);
          
          const formulation = await storage.createFormulation(formulationWithSEO);
          createdFormulations.push(formulation);
          
          // Track each AI generation for analytics
          await storage.trackAiGeneration({
            productName: formulation.name,
            category: categoryId,
            sessionId: req.sessionID || 'admin-bulk',
            timestamp: new Date().toISOString(),
            responseTime: undefined,
            formData: { categoryId, count, bulkGeneration: true },
            country: undefined,
            city: undefined
          });
        } catch (error) {
          console.error('Failed to save formulation:', error);
        }
      }
      console.log(`📊 Tracked ${createdFormulations.length} AI generations for analytics`);
      
      res.status(201).json({ 
        message: `Successfully generated ${createdFormulations.length} formulations`,
        count: createdFormulations.length,
        formulations: createdFormulations
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate bulk formulations" });
    }
  });

  // Bulk AI Generation with Keywords & Images endpoint (protected admin route)
  app.post("/api/ai/generate-bulk-formulations-with-keywords", isAdmin, async (req, res) => {
    try {
      const { categoryId, categorySlug, count, includeImages = false } = req.body;
      console.log(`=== BULK API ENDPOINT ===`);
      console.log(`Request body:`, req.body);
      console.log(`includeImages value:`, includeImages);
      console.log(`includeImages type:`, typeof includeImages);
      
      if (!categorySlug || !count) {
        return res.status(400).json({ message: "Category slug and count are required" });
      }

      let category = null;
      let categoryName = "";
      let categoryDescription = "";
      let finalCategoryId = "";

      // Only handle new formulation categories via categorySlug
      if (!categorySlug) {
        return res.status(400).json({ message: "Category slug is required" });
      }

      // Look up category from database by slug
      const selectedCategory = await storage.getCategoryBySlug(categorySlug);
      if (!selectedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      categoryName = selectedCategory.name;
      categoryDescription = selectedCategory.description;
      
      // Use the database category ID for formulations
      finalCategoryId = selectedCategory.id;

      // Generate product types based on the category
      const productTypes = await generateProductTypes(categoryName, categoryDescription, count);
      const formulations = await generateBulkFormulationsWithKeywords(categoryName, count, productTypes, includeImages);
      
      // Create all formulations in the database
      const createdFormulations = [];
      for (const formulationData of formulations) {
        try {
          // Add SEO fields to formulation data
          const formulationWithSEO = addSEOFields({
            ...formulationData,
            categoryId: finalCategoryId
          }, categoryName);
          
          const formulation = await storage.createFormulation(formulationWithSEO);
          createdFormulations.push(formulation);
          
          // Track each AI generation for analytics
          await storage.trackAiGeneration({
            productName: formulation.name,
            category: finalCategoryId,
            sessionId: req.sessionID || 'admin-bulk',
            timestamp: new Date().toISOString(),
            responseTime: undefined,
            formData: { categoryId: categoryId || null, categorySlug: categorySlug || null, count, includeImages, bulkGeneration: true },
            country: undefined,
            city: undefined
          });
        } catch (error) {
          console.error('Failed to save formulation:', error);
        }
      }
      console.log(`📊 Tracked ${createdFormulations.length} AI generations for analytics`);
      
      res.status(201).json({ 
        message: `Successfully generated ${createdFormulations.length} formula formulations${includeImages ? ' with images' : ''}`,
        count: createdFormulations.length,
        formulations: createdFormulations
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate bulk formulations with keywords" });
    }
  });

  // Helper function to map product types to category IDs
  const getProductTypeCategory = async (productType: string): Promise<string | null> => {
    const categories = await storage.getCategories();
    
    // Create mapping from product types to category names
    const typeToCategory: Record<string, string> = {
      'liquid': 'Cleaning Products',
      'cream': 'Skin Care', 
      'gel': 'Beauty Products',
      'powder': 'Baby Care',
      'paste': 'Oral Care',
      'foam': 'Men Care'
    };
    
    // Default category name based on product type
    const categoryName = typeToCategory[productType] || 'Beauty Products';
    
    // Find matching category
    const category = categories.find(cat => 
      cat.name.toLowerCase().includes(categoryName.toLowerCase()) ||
      categoryName.toLowerCase().includes(cat.name.toLowerCase())
    );
    
    return category?.id || null;
  };

  // Test endpoint to verify routing works
  app.get("/api/test", (req, res) => {
    console.log('✅ Test endpoint hit!');
    res.json({ success: true, message: "API working" });
  });

  // Robots.txt endpoint
  app.get("/robots.txt", (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    const baseUrl = `https://${req.get('host')}` || 'https://your-domain.replit.app';
    
    const robotsTxt = `User-agent: *
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin pages
Disallow: /admin

# Allow important pages
Allow: /
Allow: /browse
Allow: /category/
Allow: /formulation/
Allow: /about
Allow: /contact
Allow: /faq
Allow: /terms-of-service
Allow: /privacy-policy
Allow: /disclaimer`;

    res.send(robotsTxt);
    console.log('🤖 Robots.txt served');
  });

  // Sitemap.xml generation endpoint
  app.get("/sitemap.xml", async (req, res) => {
    try {
      // Set content type to XML
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      // Get base URL from request headers
      const baseUrl = `https://${req.get('host')}` || 'https://your-domain.replit.app';
      
      // Get all categories and formulations
      const categories = await storage.getCategories();
      const formulations = await storage.getFormulations();
      
      // Static pages
      const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/browse', priority: '0.9', changefreq: 'daily' },
        { url: '/about', priority: '0.5', changefreq: 'monthly' },
        { url: '/contact', priority: '0.5', changefreq: 'monthly' },
        { url: '/faq', priority: '0.6', changefreq: 'weekly' },
        { url: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
        { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
        { url: '/disclaimer', priority: '0.3', changefreq: 'yearly' }
      ];
      
      // Generate XML sitemap
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      // Add static pages
      staticPages.forEach(page => {
        sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;
      });

      // Add category pages  
      categories.forEach(category => {
        // Always generate SEO-friendly URLs from category name for better SEO
        const friendlySlug = category.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');
        const categoryUrl = `/category/${friendlySlug}`;
        
        sitemap += `
  <url>
    <loc>${baseUrl}${categoryUrl}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;
      });

      // Add formulation pages (only active ones)
      formulations.filter(f => f.isActive).forEach(formulation => {
        const url = formulation.slug ? `/formulation/${formulation.slug}` : `/formulation/${formulation.id}`;
        sitemap += `
  <url>
    <loc>${baseUrl}${url}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;
      });

      sitemap += `
</urlset>`;

      res.send(sitemap);
      console.log(`📋 Sitemap generated with ${staticPages.length + categories.length + formulations.filter(f => f.isActive).length} URLs`);
    } catch (error) {
      console.error('Failed to generate sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Helper function to determine product category from product type and description
  function determineProductCategory(productType: string, description: string, specialRequirements?: string): string {
    const input = `${productType} ${description} ${specialRequirements || ''}`.toLowerCase();
    
    // Industrial Chemical Formulations
    if (input.includes('ink') || input.includes('printing') || input.includes('pigment') ||
        input.includes('dye') || input.includes('security') || input.includes('anti-counterfeit')) {
      return 'smart textile coatings'; // Printing inks are similar to textile coatings
    }
    
    if (input.includes('adhesive') || input.includes('glue') || input.includes('bonding') ||
        input.includes('sealant') || input.includes('epoxy') || input.includes('resin')) {
      return 'construction material'; // Adhesives are used in construction
    }
    
    if (input.includes('cement') || input.includes('concrete') || input.includes('construction') ||
        input.includes('building material') || input.includes('mortar')) {
      return 'construction material';
    }
    
    if (input.includes('coating') || input.includes('paint') || input.includes('primer') ||
        input.includes('automotive') || input.includes('metal') || input.includes('rust') ||
        input.includes('protective') || input.includes('industrial coating')) {
      return 'automotive coating solutions';
    }
    
    if (input.includes('textile') || input.includes('fabric') || input.includes('fiber') ||
        input.includes('waterproof') || input.includes('flame retardant') || input.includes('smart textile')) {
      return 'smart textile coatings';
    }
    
    if (input.includes('water treatment') || input.includes('purification') || input.includes('filtration') ||
        input.includes('chlorination') || input.includes('coagulant') || input.includes('flocculant')) {
      return 'water treatment solutions';
    }
    
    if (input.includes('3d print') || input.includes('filament') || input.includes('resin') ||
        input.includes('polymer') || input.includes('additive manufacturing')) {
      return '3d printing materials';
    }
    
    if (input.includes('agricultural') || input.includes('pesticide') || input.includes('herbicide') ||
        input.includes('fertilizer') || input.includes('crop') || input.includes('plant growth')) {
      return 'advanced agricultural chemicals';
    }
    
    // Personal Care Products
    if (input.includes('cream') || input.includes('lotion') || input.includes('moisturizer') || 
        input.includes('serum') || input.includes('facial') || input.includes('anti-aging') ||
        input.includes('wrinkle') || input.includes('acne') || input.includes('hydrating') ||
        input.includes('nourishing') || input.includes('brightening')) {
      return 'skin care';
    }
    
    if (input.includes('shampoo') || input.includes('conditioner') || input.includes('hair') ||
        input.includes('scalp') || input.includes('styling') || input.includes('hair mask') ||
        input.includes('salon') || input.includes('grooming')) {
      return 'beauty products';
    }
    
    if (input.includes('makeup') || input.includes('foundation') || input.includes('lipstick') ||
        input.includes('mascara') || input.includes('eyeshadow') || input.includes('blush') ||
        input.includes('concealer') || input.includes('cosmetic')) {
      return 'beauty products';
    }
    
    if (input.includes('baby') || input.includes('infant') || input.includes('toddler') ||
        input.includes('gentle') || input.includes('mild') || input.includes('tear-free')) {
      return 'baby care';
    }
    
    if (input.includes('men') || input.includes('masculine') || input.includes('aftershave') ||
        input.includes('beard') || input.includes('shaving')) {
      return 'mens care style';
    }
    
    if (input.includes('organic') || input.includes('natural') || input.includes('eco-friendly') ||
        input.includes('sustainable') || input.includes('bio')) {
      return 'organic care products';
    }
    
    // Cleaning and Household
    if (input.includes('clean') || input.includes('detergent') || input.includes('soap') ||
        input.includes('dish') || input.includes('laundry') || input.includes('surface') ||
        input.includes('disinfectant') || input.includes('sanitizer')) {
      return 'cleaning products';
    }
    
    if (input.includes('toothpaste') || input.includes('mouthwash') || input.includes('dental') ||
        input.includes('oral') || input.includes('teeth') || input.includes('gum')) {
      return 'oral care';
    }
    
    // Specialty Products
    if (input.includes('leather') || input.includes('shoe') || input.includes('boot') ||
        input.includes('polish') || input.includes('protect')) {
      return 'leather products';
    }
    
    if (input.includes('pet') || input.includes('animal') || input.includes('veterinary') ||
        input.includes('dog') || input.includes('cat') || input.includes('livestock')) {
      return 'pet care';
    }
    
    if (input.includes('packaging') || input.includes('biodegradable') || input.includes('compostable') ||
        input.includes('sustainable packaging')) {
      return 'biodegradable packaging solutions';
    }
    
    // Default to construction material for industrial/chemical products
    return 'construction material';
  }

  // Custom AI Formulation with PDF Generation - Public Access with Captcha Security
  app.post("/api/ai/custom-formulation", async (req, res) => {
    console.log('🔥 Custom formulation endpoint hit!');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    const startTime = Date.now();
    try {
      const {
        productName,
        productCategory,
        productDescription,
        productType,
        phLevel,
        costLevel,
        viscosity,
        color,
        fragrance,
        specialRequirements,
        logoSettings
      } = req.body;

      // Validate required fields
      if (!productName || !productDescription || !productType || !phLevel || !costLevel) {
        return res.status(400).json({ 
          message: "Missing required fields: productName, productDescription, productType, phLevel, costLevel" 
        });
      }

      // Use direct AI generation based on product description without category constraints
      console.log(`🧠 Generating AI formulation directly from product description: ${productName}`);
      
      let formulation;
      try {
        // Import the flexible custom formulation generator
        const { generateCustomFormulation } = await import('./ai');
        
        // Create comprehensive request for AI
        const customRequest = {
          productName: productName,
          productDescription: productDescription,
          productType: productType,
          phLevel: phLevel,
          costLevel: costLevel,
          viscosity: viscosity,
          color: color,
          fragrance: fragrance,
          specialRequirements: specialRequirements
        };
        
        console.log(`🔍 AI Request:`, customRequest);
        
        // Generate using flexible AI that works with any product type
        const aiFormulation = await generateCustomFormulation(customRequest);
        
        console.log(`🔍 AI Formulation Response:`, {
          hasIngredients: !!aiFormulation.ingredients,
          ingredientsType: typeof aiFormulation.ingredients,
          hasInstructions: !!aiFormulation.instructions,
          instructionsType: typeof aiFormulation.instructions
        });
        
        formulation = {
          name: productName,
          description: aiFormulation.description || `Professional ${productType} formulation for ${productDescription}`,
          ingredients: typeof aiFormulation.ingredients === 'string' ? aiFormulation.ingredients : JSON.stringify(aiFormulation.ingredients || []),
          instructions: typeof aiFormulation.instructions === 'string' ? aiFormulation.instructions : JSON.stringify(aiFormulation.instructions || []),
          usageInstructions: aiFormulation.usageInstructions || 'Apply as needed according to product instructions',
          phLevel: aiFormulation.phLevel || phLevel.toString(),
          shelfLife: aiFormulation.shelfLife || "24 months when stored properly",
          viscosity: aiFormulation.viscosity || viscosity || 'Medium',
          storageConditions: aiFormulation.storageConditions || "Store in cool, dry place away from direct sunlight",
          batchSize: aiFormulation.batchSize || "1000ml",
          processingTime: aiFormulation.processingTime || "2-3 hours",
          temperature: aiFormulation.temperature || "Room temperature (20-25°C)",
          equipment: aiFormulation.equipment || "Standard mixing equipment, pH meter, thermometer",
          certification: aiFormulation.certification || "Meets industry standards",
          isActive: false // This will make it appear in pending approval
        };
        
      } catch (aiError) {
        console.error("AI generation failed, using fallback:", aiError);
        // Fallback to basic template if AI fails
        formulation = {
          name: productName,
          description: `Professional ${productType} formulation for ${productDescription}`,
          ingredients: JSON.stringify([
            {
              "name": "Water",
              "inci": "Aqua",
              "percentage": "80.0%",
              "function": "Base solvent"
            },
            {
              "name": "Active Complex",
              "inci": "Active Ingredients",
              "percentage": "15.0%",
              "function": "Primary active"
            },
            {
              "name": "Stabilizer",
              "inci": "Stabilizer System",
              "percentage": "3.0%",
              "function": "Stabilization"
            },
            {
              "name": "Preservative",
              "inci": "Preservative System",
              "percentage": "2.0%",
              "function": "Preservation"
            }
          ]),
          instructions: JSON.stringify([
            {
              "phase": "Phase A",
              "steps": [
                "Combine base ingredients in main vessel",
                "Mix until uniform at room temperature"
              ]
            },
            {
              "phase": "Phase B",
              "steps": [
                "Add active complex gradually while stirring",
                "Ensure complete dissolution"
              ]
            },
            {
              "phase": "Phase C",
              "steps": [
                "Add stabilizer system and mix well",
                "Add preservative system last",
                "Perform final quality checks"
              ]
            }
          ]),
          usageInstructions: 'Apply as needed according to product instructions',
          phLevel: phLevel.toString(),
          shelfLife: "24 months when stored properly",
          viscosity: viscosity || 'Medium',
          storageConditions: "Store in cool, dry place away from direct sunlight",
          batchSize: "1000ml",
          processingTime: "2-3 hours",
          temperature: "Room temperature (20-25°C)",
          equipment: "Standard mixing equipment, pH meter, thermometer",
          certification: "Meets industry standards",
          isActive: false
        }
      };

      // Determine category for storage purposes only (doesn't constrain AI generation)
      const inferredCategory = determineProductCategory(productType, productDescription, specialRequirements);
      console.log(`📂 Inferred category for storage: ${inferredCategory}`);
      
      // Get category ID based on inferred category or use a default
      const categories = await storage.getCategories();
      let selectedCategory = categories.find(cat => 
        cat.name.toLowerCase().includes(inferredCategory.toLowerCase()) || 
        inferredCategory.toLowerCase().includes(cat.name.toLowerCase().split(' ')[0])
      );
      
      // If no matching category found, use a default category
      if (!selectedCategory) {
        selectedCategory = categories.find(cat => cat.name.includes('Construction Material')) || categories[0];
      }
      
      const categoryId = selectedCategory?.id || categories[0]?.id;

      // Save formulation to database with isActive: false (pending approval)
      // Add SEO fields to custom formulation  
      const categoryResult = await storage.getCategory(categoryId!);
      const categoryName = categoryResult ? categoryResult.name : 'Custom Formulation';
      
      const formulationWithSEO = addSEOFields({
        ...formulation,
        categoryId,
        isActive: false // This will make it appear in pending approval
      }, categoryName);
      
      const formulationToSave = formulationWithSEO;

      try {
        const savedFormulation = await storage.createFormulation(formulationToSave);
        console.log('✅ Formulation saved to database for approval:', savedFormulation.id);

        // Save user formulation request for admin review
        try {
          const userRequest: any = {
            sessionId: req.sessionID || 'anonymous',
            productName,
            productCategory: categoryName,
            productDescription,
            productType,
            consistencyType: viscosity || undefined,
            phLevel: phLevel?.toString() || undefined,
            viscosity: viscosity || undefined,
            budgetCategory: costLevel || undefined,
            specialProperties: specialRequirements ? [specialRequirements] : undefined,
            additionalNotes: `Color: ${color || 'Not specified'}, Fragrance: ${fragrance || 'Not specified'}`,
            status: 'pending',
            formulationId: savedFormulation.id
          };

          await storage.createUserFormulationRequest(userRequest);
          console.log('✅ User formulation request saved for admin review');
        } catch (requestError) {
          console.error('Failed to save user formulation request:', requestError);
          // Continue - this is not critical to the user experience
        }

        // Track AI generation for analytics
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        await storage.trackAiGeneration({
          productName,
          category: categoryId,
          sessionId: req.sessionID || 'anonymous',
          timestamp: new Date().toISOString(),
          responseTime,
          formData: req.body,
          country: req.headers['x-forwarded-for'] ? 'Unknown' : undefined,
          city: undefined
        });
        console.log('📊 AI generation tracked for analytics');
      } catch (dbError) {
        console.error('Failed to save formulation to database:', dbError);
        // Continue with PDF generation even if database save fails
      }

      // Generate PDF with logo settings
      const pdfBuffer = generateFormulationPDF({
        ...formulation,
        slug: 'custom-formulation',
        metaDescription: undefined,
        keywords: undefined
      }, logoSettings);
      
      // Set headers for PDF download
      const sanitizedName = productName
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
      const filename = `${sanitizedName}_formulation.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error("Failed to generate custom formulation:", error);
      res.status(500).json({ 
        message: error.message || "Failed to generate custom formulation" 
      });
    }
  });

  // PDF Generation for existing formulations
  app.post("/api/formulations/:id/pdf", isAuthenticated, async (req, res) => {
    try {
      const formulationId = req.params.id;
      const formulation = await storage.getFormulation(formulationId);
      
      if (!formulation) {
        return res.status(404).json({ message: "Formulation not found" });
      }

      // Get logo settings from request body
      const logoSettings = req.body.logoSettings || {};

      // Generate PDF with logo settings - convert null values to undefined for type compatibility
      const formulationData = {
        ...formulation,
        metaDescription: formulation.metaDescription ?? undefined,
        keywords: formulation.keywords ?? undefined,
        image: formulation.image ?? undefined,
      };
      const pdfBuffer = generateFormulationPDF(formulationData, logoSettings);
      
      // Set headers for PDF download
      const sanitizedName = formulation.name
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
      const filename = `${sanitizedName}_formulation.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error("Failed to generate formulation PDF:", error);
      res.status(500).json({ 
        message: error.message || "Failed to generate PDF" 
      });
    }
  });

  // Old endpoint removed - replaced with AI-powered dynamic properties endpoint

  // User Notes API - Save additional notes for future recommendations
  app.post("/api/user-notes", async (req, res) => {
    try {
      const validatedData = insertUserNoteSchema.parse(req.body);
      const userNote = await storage.saveUserNote(validatedData);
      res.status(201).json(userNote);
    } catch (error: any) {
      console.error("Failed to save user note:", error);
      res.status(400).json({ message: error.message || "Invalid user note data" });
    }
  });

  // Recommendations API - Get personalized recommendations based on previous user notes
  app.get("/api/recommendations/:productType", async (req, res) => {
    try {
      const productType = req.params.productType.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const recommendations = await storage.getRecommendations(productType);
      res.json(recommendations);
    } catch (error: any) {
      console.error("Failed to fetch recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Pages Content Management API
  // Get all pages
  app.get("/api/pages", async (req, res) => {
    try {
      const pages = await storage.getPages();
      res.json(pages);
    } catch (error: any) {
      console.error("Failed to fetch pages:", error);
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });

  // Get single page by slug
  app.get("/api/pages/:slug", async (req, res) => {
    try {
      const page = await storage.getPageBySlug(req.params.slug);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (error: any) {
      console.error("Failed to fetch page:", error);
      res.status(500).json({ message: "Failed to fetch page" });
    }
  });

  // Create new page
  app.post("/api/pages", isAdmin, async (req, res) => {
    try {
      const validatedData = insertPageSchema.parse(req.body);
      const page = await storage.createPage(validatedData);
      res.status(201).json(page);
    } catch (error: any) {
      console.error("Failed to create page:", error);
      res.status(400).json({ message: error.message || "Invalid page data" });
    }
  });

  // Update page
  app.put("/api/pages/:id", isAdmin, async (req, res) => {
    try {
      const validatedData = insertPageSchema.parse(req.body);
      const page = await storage.updatePage(req.params.id, validatedData);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (error: any) {
      console.error("Failed to update page:", error);
      res.status(400).json({ message: error.message || "Invalid page data" });
    }
  });

  // Delete page
  app.delete("/api/pages/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deletePage(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Failed to delete page:", error);
      res.status(500).json({ message: "Failed to delete page" });
    }
  });

  // Public demo endpoint for the improved formulation system
  app.post('/api/demo-formulation', async (req, res) => {
    try {
      const { category, description } = req.body;
      
      if (!category || !description) {
        return res.status(400).json({ 
          message: "Category and description are required" 
        });
      }

      console.log(`🧪 Demo generating formulation for ${category}: ${description}`);
      
      // For demo purposes, use a working fallback formulation
      const demoFormulation = {
        name: `Professional ${description}`,
        description: `High-quality ${description.toLowerCase()} for professional use`,
        ingredients: JSON.stringify([
          { name: "Water", inci: "Aqua", percentage: "70.0%", function: "Base solvent" },
          { name: "Active Ingredient", inci: "Active Complex", percentage: "15.0%", function: "Primary active" },
          { name: "Emulsifier", inci: "Emulsifying Agent", percentage: "8.0%", function: "Stabilizer" },
          { name: "Preservative", inci: "Phenoxyethanol", percentage: "5.0%", function: "Preservation" },
          { name: "Fragrance", inci: "Parfum", percentage: "2.0%", function: "Scent" }
        ]),
        instructions: JSON.stringify([
          { phase: "Main Phase", steps: ["Combine all ingredients", "Mix thoroughly for 10 minutes", "Check pH and adjust if needed", "Package in appropriate containers"] }
        ]),
        usageInstructions: "Apply as directed according to product specifications",
        phLevel: "6.5-7.5",
        shelfLife: "24 months",
        viscosity: "Medium",
        storageConditions: "Store in cool, dry place away from direct sunlight",
        batchSize: "100-500 kg",
        processingTime: "2-3 hours",
        temperature: "Room temperature (20-25°C)",
        equipment: "Standard mixing tank with agitation",
        certification: "Meets industry standards",
        isActive: true
      };
      
      // Import validation function
      const { validateFormulation } = await import('./ai-category-specific');
      const validation = validateFormulation(demoFormulation, category);
      
      res.json({
        formulation: demoFormulation,
        validation,
        category,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Demo formulation failed:", error);
      res.status(500).json({ 
        message: "Failed to generate demo formulation",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Blog Posts API
  // Get all blog posts
  app.get("/api/blog", async (req, res) => {
    try {
      const blogPosts = await storage.getBlogPosts();
      res.json(blogPosts);
    } catch (error: any) {
      console.error("Failed to fetch blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Get published blog posts for public view
  app.get("/api/blog/published", async (req, res) => {
    try {
      const blogPosts = await storage.getPublishedBlogPosts();
      res.json(blogPosts);
    } catch (error: any) {
      console.error("Failed to fetch published blog posts:", error);
      res.status(500).json({ message: "Failed to fetch published blog posts" });
    }
  });

  // Get single blog post by slug
  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const blogPost = await storage.getBlogPostBySlug(req.params.slug);
      if (!blogPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(blogPost);
    } catch (error: any) {
      console.error("Failed to fetch blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Create new blog post
  app.post("/api/blog", isAdmin, async (req, res) => {
    try {
      const validatedData = insertBlogPostSchema.parse(req.body);
      const blogPost = await storage.createBlogPost(validatedData);
      res.status(201).json(blogPost);
    } catch (error: any) {
      console.error("Failed to create blog post:", error);
      if (error.issues) {
        res.status(400).json({ 
          message: "Validation failed", 
          issues: error.issues.map((issue: any) => ({
            path: issue.path,
            message: issue.message
          }))
        });
      } else {
        res.status(400).json({ message: error.message || "Invalid blog post data" });
      }
    }
  });

  // Update blog post
  app.put("/api/blog/:id", isAdmin, async (req, res) => {
    try {
      const validatedData = insertBlogPostSchema.parse(req.body);
      const blogPost = await storage.updateBlogPost(req.params.id, validatedData);
      if (!blogPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(blogPost);
    } catch (error: any) {
      console.error("Failed to update blog post:", error);
      res.status(400).json({ message: error.message || "Invalid blog post data" });
    }
  });

  // Delete blog post
  app.delete("/api/blog/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteBlogPost(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Failed to delete blog post:", error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // AI Blog Generation API - DISABLED to prevent continuous processing
  // Analyze content gaps and suggest topics
  app.get("/api/ai-blog/content-gaps", async (req, res) => {
    console.log("Content gaps analysis disabled to prevent continuous processing");
    res.json([]);
  });

  // Get trending topics
  app.get("/api/ai-blog/trending-topics", async (req, res) => {
    console.log("Trending topics generation disabled to prevent continuous processing");
    res.json([]);
  });

  // Generate single blog post
  app.post("/api/ai-blog/generate", isAdmin, async (req, res) => {
    try {
      const { topic, targetKeywords = [], shouldPublish = false } = req.body;
      
      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }

      const blogPost = await aiBlogGenerator.createPublishableBlogPost(topic, targetKeywords, shouldPublish);
      
      if (shouldPublish) {
        // Save to database if should publish
        const savedPost = await storage.createBlogPost(blogPost);
        res.json(savedPost);
      } else {
        // Return generated content without saving
        res.json(blogPost);
      }
    } catch (error: any) {
      console.error("Failed to generate blog post:", error);
      res.status(500).json({ message: error.message || "Failed to generate blog post" });
    }
  });

  // Batch generate multiple blog posts
  app.post("/api/ai-blog/generate-batch", isAdmin, async (req, res) => {
    try {
      const { topics, targetKeywords = [], shouldPublish = false } = req.body;
      
      if (!topics || !Array.isArray(topics) || topics.length === 0) {
        return res.status(400).json({ message: "Topics array is required" });
      }

      const blogPosts = await aiBlogGenerator.generateBatchBlogPosts(topics, targetKeywords, false);
      
      if (shouldPublish) {
        // Save all to database
        const savedPosts = [];
        for (const post of blogPosts) {
          try {
            const savedPost = await storage.createBlogPost(post);
            savedPosts.push(savedPost);
          } catch (error) {
            console.error("Failed to save generated post:", error);
          }
        }
        res.json(savedPosts);
      } else {
        res.json(blogPosts);
      }
    } catch (error: any) {
      console.error("Failed to generate batch blog posts:", error);
      res.status(500).json({ message: error.message || "Failed to generate blog posts" });
    }
  });

  // Generate content calendar
  app.get("/api/ai-blog/content-calendar", async (req, res) => {
    try {
      const weeksAhead = parseInt(req.query.weeks as string) || 4;
      const calendar = await aiBlogGenerator.generateContentCalendar(weeksAhead);
      res.json(calendar);
    } catch (error: any) {
      console.error("Failed to generate content calendar:", error);
      res.status(500).json({ message: "Failed to generate content calendar" });
    }
  });

  // Simple AI trending suggestions endpoint - manual trigger only
  app.post("/api/ai/trending-suggestions", isAdmin, async (req, res) => {
    try {
      const suggestions = await aiBlogGenerator.generateGlobalTrendingSuggestions();
      res.json({ suggestions });
    } catch (error: any) {
      console.error("Error generating trending suggestions:", error);
      res.status(500).json({ error: "Failed to generate suggestions" });
    }
  });

  // Get trending formulations by region
  app.get("/api/ai-blog/trending-formulations", async (req, res) => {
    try {
      const formulations = await aiBlogGenerator.generateRegionalTrendingFormulations();
      res.json(formulations);
    } catch (error: any) {
      console.error("Failed to get trending formulations:", error);
      res.status(500).json({ message: "Failed to get trending formulations" });
    }
  });

  // Chat API endpoints
  app.get("/api/chat/messages/:sessionId", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const messageData: InsertChatMessage = req.body;
      const message = await storage.createChatMessage(messageData);
      
      // Broadcast to all connected clients in the same session via WebSocket
      if (typeof wss !== 'undefined') {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            const clientData = (client as any).sessionId;
            if (clientData === message.sessionId) {
              client.send(JSON.stringify({
                type: 'new_message',
                data: message
              }));
            }
          }
        });
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error in POST /api/chat/messages:', error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Serve generated images statically
  app.use('/images/generated', express.static(path.join(process.cwd(), 'client/public/images/generated')));

  const httpServer = createServer(app);
  
  // Dynamic product properties endpoint
  app.get("/api/product-properties/:productName", async (req, res) => {
    try {
      const { productName } = req.params;
      const productDescription = req.query.description as string || '';
      
      console.log(`🔍 Generating properties for: ${productName}`);
      
      // Import the flexible custom formulation generator
      const { generateProductProperties } = await import('./ai');
      
      const properties = await generateProductProperties({
        productName: productName,
        productDescription: productDescription
      });
      
      console.log(`✅ Generated ${properties.length} properties:`, properties);
      
      res.json(properties);
    } catch (error) {
      console.error('Error generating properties:', error);
      
      // Fallback to generic properties
      const fallbackProperties = [
        'Professional grade',
        'Enhanced formula', 
        'High quality',
        'Reliable performance',
        'Industry standard'
      ];
      
      res.json(fallbackProperties);
    }
  });

  // WebSocket server for real-time chat
  // Admin Management - Grant Admin Rights
  app.post("/api/admin/grant-rights", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const success = await storage.grantAdminRights(email);
      
      if (success) {
        res.json({ 
          message: `Admin rights granted successfully to ${email}`,
          success: true 
        });
      } else {
        res.status(404).json({ 
          message: `User with email ${email} not found. User must log in first to create their account.`,
          success: false 
        });
      }
    } catch (error) {
      console.error("Failed to grant admin rights:", error);
      res.status(500).json({ message: "Failed to grant admin rights" });
    }
  });

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join_session') {
          (ws as any).sessionId = message.sessionId;
          console.log(`Client joined session: ${message.sessionId}`);
        }
        
        if (message.type === 'chat_message') {
          // Store message in database and broadcast
          storage.createChatMessage({
            sessionId: message.sessionId,
            message: message.content,
            senderType: message.senderType,
            senderName: message.senderName
          }).then((newMessage) => {
            // Broadcast to all clients in the same session
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                const clientSessionId = (client as any).sessionId;
                if (clientSessionId === message.sessionId) {
                  client.send(JSON.stringify({
                    type: 'new_message',
                    data: newMessage
                  }));
                }
              }
            });
          }).catch((error) => {
            console.error('Error creating chat message:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to send message'
            }));
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
