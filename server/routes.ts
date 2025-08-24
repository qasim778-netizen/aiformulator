import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { insertCategorySchema, insertFormulationSchema } from "@shared/schema";
import { generateCategory, generateFormulation, generateBulkFormulations, generateProductTypes, generateCustomFormulation } from "./ai";
import { generateFormulationPDF } from "./pdf-generator";
import { optimizeFormulationsForSEO } from "./seo-optimizer";
import { generateFormulationImages, addImageFieldToFormulations } from "./image-generator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
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
      let formulations;
      
      if (categoryId) {
        formulations = await storage.getFormulationsByCategory(categoryId as string);
      } else {
        formulations = await storage.getFormulations();
      }
      
      res.json(formulations);
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

  // Dashboard stats
  app.get("/api/stats", async (req, res) => {
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

  // AI Analytics endpoint
  app.get("/api/ai-analytics", async (req, res) => {
    try {
      const type = req.query.type as string || 'generation';
      
      // For now, we only have AI generation data, but prepare for browse analytics
      let aiGenerations;
      if (type === 'browse') {
        // Mock browse analytics data for now
        aiGenerations = [];
      } else {
        aiGenerations = await storage.getAiGenerations();
      }
      
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

      // Recent generations (last 10)
      const recentGenerations = aiGenerations
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map(gen => ({
          id: gen.id,
          productName: gen.productName,
          category: gen.category,
          timestamp: gen.timestamp,
          sessionId: gen.sessionId,
          country: gen.country,
          city: gen.city,
        }));

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
      };

      res.json(analytics);
    } catch (error) {
      console.error("Failed to fetch AI analytics:", error);
      res.status(500).json({ message: "Failed to fetch AI analytics" });
    }
  });

  // SEO Optimization endpoint
  app.post("/api/admin/optimize-seo", async (req, res) => {
    try {
      const result = await optimizeFormulationsForSEO();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to optimize formulations for SEO" });
    }
  });

  // Image Generation endpoints
  app.post("/api/admin/setup-images", async (req, res) => {
    try {
      await addImageFieldToFormulations();
      res.status(200).json({ message: "Image fields added to database successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to setup image fields" });
    }
  });

  app.post("/api/admin/generate-images", async (req, res) => {
    try {
      const result = await generateFormulationImages();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate formulation images" });
    }
  });

  // AI Generation endpoints
  app.post("/api/ai/generate-category", async (req, res) => {
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

  app.post("/api/ai/generate-formulation", async (req, res) => {
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

  // Bulk AI Generation endpoint
  app.post("/api/ai/generate-bulk-formulations", async (req, res) => {
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
          const formulation = await storage.createFormulation({
            ...formulationData,
            categoryId
          });
          createdFormulations.push(formulation);
        } catch (error) {
          console.error('Failed to save formulation:', error);
        }
      }
      
      res.status(201).json({ 
        message: `Successfully generated ${createdFormulations.length} formulations`,
        count: createdFormulations.length,
        formulations: createdFormulations
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate bulk formulations" });
    }
  });

  // Custom AI Formulation with PDF Generation
  app.post("/api/ai/custom-formulation", async (req, res) => {
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
        specialRequirements
      } = req.body;

      // Validate required fields
      if (!productName || !productDescription || !productType || !phLevel || !costLevel) {
        return res.status(400).json({ 
          message: "Missing required fields: productName, productDescription, productType, phLevel, costLevel" 
        });
      }

      // Generate formulation using AI
      const formulation = await generateCustomFormulation({
        productName,
        productDescription,
        productType,
        phLevel,
        costLevel,
        viscosity,
        color,
        fragrance,
        specialRequirements
      });

      // Track AI generation for analytics
      const responseTime = (Date.now() - startTime) / 1000; // Convert to seconds
      const sessionId = req.headers['x-session-id'] as string || crypto.randomUUID();
      
      // Simple geo detection based on common request headers or default to US
      const country = req.headers['cf-ipcountry'] as string || 
                     req.headers['x-country'] as string || 
                     'United States';
      const city = req.headers['cf-ipcity'] as string || 
                  req.headers['x-city'] as string || 
                  'Unknown';

      await storage.trackAiGeneration({
        productName,
        category: productType,
        sessionId,
        timestamp: new Date().toISOString(),
        responseTime,
        formData: req.body,
        country,
        city,
      });

      // Generate PDF
      const pdfBuffer = generateFormulationPDF(formulation);
      
      // Set headers for PDF download
      const filename = `${productName.replace(/\s+/g, '_')}_formulation.pdf`;
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

  const httpServer = createServer(app);
  return httpServer;
}
