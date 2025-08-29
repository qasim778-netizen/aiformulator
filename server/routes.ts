import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";
import { storage } from "./storage";
import { insertCategorySchema, insertFormulationSchema, insertUserNoteSchema, insertPageSchema } from "@shared/schema";
import type { ChatMessage, InsertChatMessage } from "@shared/schema";
import { generateCategory, generateFormulation, generateFormulationWithKeywords, generateBulkFormulations, generateBulkFormulationsWithKeywords, generateProductTypes, generateCustomFormulation } from "./ai";
import { generateFormulationPDF } from "./pdf-generator";
import { optimizeFormulationsForSEO } from "./seo-optimizer";
import { generateFormulationImages, addImageFieldToFormulations } from "./image-generator";
import { addSEOFields, generateStructuredData } from "./seo-utils";
import { setupAuth, isAuthenticated } from "./replitAuth";

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
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
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

  app.delete("/api/categories/:id", async (req, res) => {
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

  app.get("/api/formulations/:id", async (req, res) => {
    try {
      const formulation = await storage.getFormulation(req.params.id);
      if (!formulation) {
        return res.status(404).json({ message: "Formulation not found" });
      }
      res.json(formulation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch formulation" });
    }
  });

  app.post("/api/formulations", async (req, res) => {
    try {
      const validatedData = insertFormulationSchema.parse(req.body);
      const formulation = await storage.createFormulation(validatedData);
      res.status(201).json(formulation);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid formulation data" });
    }
  });

  app.put("/api/formulations/:id", async (req, res) => {
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

  app.delete("/api/formulations/:id", async (req, res) => {
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
  app.get("/api/stats", isAuthenticated, async (req, res) => {
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
  app.get("/api/ai-analytics", isAuthenticated, async (req, res) => {
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
        hourCounts[hour].count++;
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

  // Clear AI analytics data (admin only)
  app.delete("/api/ai-analytics", isAuthenticated, async (req, res) => {
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
  app.post("/api/admin/optimize-seo", isAuthenticated, async (req, res) => {
    try {
      const result = await optimizeFormulationsForSEO();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to optimize formulations for SEO" });
    }
  });

  // Image Generation endpoints (protected admin route)
  app.post("/api/admin/setup-images", isAuthenticated, async (req, res) => {
    try {
      await addImageFieldToFormulations();
      res.status(200).json({ message: "Image fields added to database successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to setup image fields" });
    }
  });

  app.post("/api/admin/generate-images", isAuthenticated, async (req, res) => {
    try {
      const result = await generateFormulationImages();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate formulation images" });
    }
  });

  // Admin formulation management endpoints
  app.get("/api/admin/formulations", isAuthenticated, async (req, res) => {
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

  app.patch("/api/admin/formulations/:id/status", isAuthenticated, async (req, res) => {
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

  // AI Generation endpoints (protected admin routes)
  app.post("/api/ai/generate-category", isAuthenticated, async (req, res) => {
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

  app.post("/api/ai/generate-formulation", isAuthenticated, async (req, res) => {
    try {
      const { categoryId, productDescription } = req.body;
      if (!categoryId || !productDescription) {
        return res.status(400).json({ message: "Category ID and product description are required" });
      }

      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const formulationData = await generateFormulation(category.name, productDescription);
      const formulation = await storage.createFormulation({
        ...formulationData,
        categoryId
      });
      
      res.status(201).json(formulation);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate formulation" });
    }
  });

  // Generate formulation with formula keywords and image
  app.post("/api/ai/generate-formulation-with-keywords", isAuthenticated, async (req, res) => {
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
  app.post("/api/ai/generate-bulk-formulations", isAuthenticated, async (req, res) => {
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
  app.post("/api/ai/generate-bulk-formulations-with-keywords", isAuthenticated, async (req, res) => {
    try {
      const { categoryId, count, includeImages = false } = req.body;
      console.log(`=== BULK API ENDPOINT ===`);
      console.log(`Request body:`, req.body);
      console.log(`includeImages value:`, includeImages);
      console.log(`includeImages type:`, typeof includeImages);
      
      if (!categoryId || !count) {
        return res.status(400).json({ message: "Category ID and count are required" });
      }

      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Generate product types based on the category
      const productTypes = await generateProductTypes(category.name, category.description, count);
      const formulations = await generateBulkFormulationsWithKeywords(category.name, count, productTypes, includeImages);
      
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
            formData: { categoryId, count, includeImages, bulkGeneration: true },
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
        sitemap += `
  <url>
    <loc>${baseUrl}/category/${category.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;
      });

      // Add formulation pages (only active ones)
      formulations.filter(f => f.isActive).forEach(formulation => {
        sitemap += `
  <url>
    <loc>${baseUrl}/formulation/${formulation.id}</loc>
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

  // Custom AI Formulation with PDF Generation
  app.post("/api/ai/custom-formulation", async (req, res) => {
    console.log('🔥 Custom formulation endpoint hit!');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    const startTime = Date.now();
    try {
      const {
        productName,
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

      // Create a simple formulation without AI for now to test the functionality
      const formulation = {
        name: productName,
        description: `Professional ${productType} formulation for ${productDescription}`,
        ingredients: JSON.stringify([
          {
            "name": "Deionized Water",
            "inci": "Aqua",
            "percentage": "60.0%",
            "function": "Solvent"
          },
          {
            "name": "Glycerin",
            "inci": "Glycerin",
            "percentage": "15.0%",
            "function": "Humectant and viscosity modifier"
          },
          {
            "name": "Carbomer",
            "inci": "Carbomer",
            "percentage": "2.0%",
            "function": "Thickening agent"
          },
          {
            "name": "Sodium Hydroxide",
            "inci": "Sodium Hydroxide",
            "percentage": "0.5%",
            "function": "pH adjuster"
          },
          {
            "name": "Preservative System",
            "inci": "Phenoxyethanol, Ethylhexylglycerin",
            "percentage": "1.0%",
            "function": "Preservative"
          },
          {
            "name": "Active Ingredients",
            "inci": "Various",
            "percentage": "20.0%",
            "function": "Primary active components"
          },
          {
            "name": "Fragrance",
            "inci": "Parfum",
            "percentage": "1.0%",
            "function": "Scenting agent"
          },
          {
            "name": "Colorant",
            "inci": "CI 19140",
            "percentage": "0.5%",
            "function": "Coloring agent"
          }
        ]),
        instructions: JSON.stringify([
          {
            "phase": "Phase A",
            "steps": [
              "Combine Deionized Water and Glycerin in main vessel",
              "Heat mixture to 70°C while stirring",
              "Maintain temperature until uniform"
            ]
          },
          {
            "phase": "Phase B",
            "steps": [
              "Slowly add Carbomer to Phase A under continuous mixing",
              "Mix until fully dispersed and hydrated",
              "Avoid creating excessive foam"
            ]
          },
          {
            "phase": "Phase C",
            "steps": [
              `Adjust pH to ${phLevel} using diluted Sodium Hydroxide solution`,
              "Add dropwise while monitoring pH continuously",
              "Mix thoroughly after each addition"
            ]
          },
          {
            "phase": "Phase D",
            "steps": [
              "Cool mixture to below 40°C",
              "Add preservative system and mix well",
              "Add active ingredients gradually while mixing"
            ]
          },
          {
            "phase": "Phase E",
            "steps": [
              "Add fragrance and colorant if specified",
              "Mix until evenly distributed",
              "Perform final quality checks and package"
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
        certification: "Meets industry standards"
      };

      // Get category ID for the product type
      const categoryId = await getProductTypeCategory(productType);
      
      if (!categoryId) {
        return res.status(400).json({ 
          message: "Unable to determine category for the product type" 
        });
      }

      // Save formulation to database with isActive: false (pending approval)
      // Add SEO fields to custom formulation  
      const categoryResult = await storage.getCategory(categoryId);
      const categoryName = categoryResult ? categoryResult.name : 'Custom';
      
      const formulationWithSEO = addSEOFields({
        ...formulation,
        categoryId,
        isActive: false // This will make it appear in pending approval
      }, categoryName);
      
      const formulationToSave = formulationWithSEO;

      try {
        const savedFormulation = await storage.createFormulation(formulationToSave);
        console.log('✅ Formulation saved to database for approval:', savedFormulation.id);

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

      // Generate PDF with logo settings
      const pdfBuffer = generateFormulationPDF(formulation, logoSettings);
      
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

  // Product Properties API - Dynamic special properties based on product type
  app.get("/api/product-properties/:productType", async (req, res) => {
    try {
      // Add CORS headers for deployment
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
      res.header('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
      
      const rawType = decodeURIComponent(req.params.productType);
      const inputType = rawType.toLowerCase().trim();
      
      if (!inputType) {
        return res.status(400).json({ message: "Product type parameter is required" });
      }
      
      // Map frontend categories to database product types
      const categoryMap: Record<string, string> = {
        'skincare & cosmetics': 'skincare',
        'skincare': 'skincare',
        'skin care': 'skincare',
        'beauty products': 'cosmetics',
        'cosmetics': 'cosmetics',
        'hair care products': 'hair_care',
        'hair care': 'hair_care',
        'oral care products': 'oral_care',
        'oral care': 'oral_care',
        'baby & child care': 'body_care',
        'baby care': 'body_care',
        'child care': 'body_care',
        'men care': 'body_care',
        "men's care": 'body_care',
        'organic care': 'specialty',
        'organic': 'specialty',
        'body care & personal hygiene': 'body_care',
        'body care': 'body_care',
        'personal hygiene': 'body_care',
        'cleaning & household': 'cleaning',
        'cleaning products': 'cleaning',
        'cleaning': 'cleaning',
        'household': 'cleaning',
        'detergent': 'detergent',
        'laundry': 'detergent',
        'disinfectant': 'disinfectant',
        'sanitizer': 'disinfectant',
        'shoe care': 'specialty',
        'leather products': 'specialty',
        'leather care': 'specialty',
        'construction material': 'specialty',
        'construction': 'specialty',
        'pet care': 'specialty',
        'pets': 'specialty',
        'specialty chemicals': 'specialty',
        'specialty': 'specialty',
        'other': 'other'
      };
      
      const mappedType = categoryMap[inputType] || 'other';
      console.log(`Product properties mapping: "${rawType}" -> "${inputType}" -> "${mappedType}"`);
      
      const properties = await storage.getProductProperties(mappedType);
      
      if (!properties || !Array.isArray(properties)) {
        console.log(`No valid properties array found for product type: ${mappedType}`);
        return res.json([]);
      }
      
      if (properties.length === 0) {
        console.log(`Empty properties array for product type: ${mappedType}`);
        return res.json([]);
      }
      
      console.log(`Found ${properties.length} properties for ${mappedType}:`, properties);
      res.json(properties);
    } catch (error: any) {
      console.error("Failed to fetch product properties:", error.stack || error);
      res.status(500).json({ 
        message: "Failed to fetch product properties", 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

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
  app.post("/api/pages", async (req, res) => {
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
  app.put("/api/pages/:id", async (req, res) => {
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
  app.delete("/api/pages/:id", async (req, res) => {
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

  const httpServer = createServer(app);
  
  // WebSocket server for real-time chat
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
