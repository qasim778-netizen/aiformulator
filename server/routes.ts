import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertFormulationSchema } from "@shared/schema";
import { generateCategory, generateFormulation as aiGenerateFormulation, generateBulkFormulations, generateProductTypes } from "./ai";
import { optimizeFormulationsForSEO } from "./seo-optimizer";
import { generateFormulationImages, addImageFieldToFormulations } from "./image-generator";
import { generateFormulation, type FormulationRequest } from "./openai-service";
import { db } from "./db";
import { aiFormulations } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

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

  // AI Formulation Generation API
  const formulationRequestSchema = z.object({
    name: z.string().min(1),
    productCategory: z.string().min(1),
    consistency: z.string().min(1),
    targetViscosity: z.string().min(1),
    specialProperties: z.array(z.string()),
    phLevel: z.string().min(1),
    shelfLife: z.string().min(1),
    storageTemperature: z.string().min(1),
    budgetCategory: z.string().min(1),
    productionVolume: z.string().min(1),
    regulatoryRequirements: z.string().optional(),
    additionalNotes: z.string().optional(),
  });

  app.post("/api/ai-formulations/generate", async (req, res) => {
    try {
      const validatedData = formulationRequestSchema.parse(req.body);
      
      // Generate formulation using OpenAI
      const generatedFormulation = await generateFormulation(validatedData);
      
      // Save to database
      const savedFormulation = await db.insert(aiFormulations).values({
        ...validatedData,
        specialProperties: JSON.stringify(validatedData.specialProperties),
        generatedFormulation: JSON.stringify(generatedFormulation),
        costAnalysis: JSON.stringify(generatedFormulation.costAnalysis || {}),
        status: "generated"
      }).returning();

      res.status(201).json({
        formulation: savedFormulation[0],
        generatedData: generatedFormulation
      });
    } catch (error: any) {
      console.error("AI formulation generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate formulation" });
    }
  });

  app.get("/api/ai-formulations", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const formulations = await db
        .select()
        .from(aiFormulations)
        .orderBy(desc(aiFormulations.createdAt))
        .limit(limit)
        .offset(offset);

      res.json(formulations);
    } catch (error) {
      console.error("Failed to fetch AI formulations:", error);
      res.status(500).json({ message: "Failed to fetch formulations" });
    }
  });

  app.get("/api/ai-formulations/:id", async (req, res) => {
    try {
      const formulation = await db
        .select()
        .from(aiFormulations)
        .where(eq(aiFormulations.id, req.params.id))
        .limit(1);

      if (formulation.length === 0) {
        return res.status(404).json({ message: "Formulation not found" });
      }

      res.json(formulation[0]);
    } catch (error) {
      console.error("Failed to fetch AI formulation:", error);
      res.status(500).json({ message: "Failed to fetch formulation" });
    }
  });

  app.put("/api/ai-formulations/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!["generated", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedFormulation = await db
        .update(aiFormulations)
        .set({ status, updatedAt: new Date() })
        .where(eq(aiFormulations.id, req.params.id))
        .returning();

      if (updatedFormulation.length === 0) {
        return res.status(404).json({ message: "Formulation not found" });
      }

      res.json(updatedFormulation[0]);
    } catch (error) {
      console.error("Failed to update formulation status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.delete("/api/ai-formulations/:id", async (req, res) => {
    try {
      const deletedFormulation = await db
        .delete(aiFormulations)
        .where(eq(aiFormulations.id, req.params.id))
        .returning();

      if (deletedFormulation.length === 0) {
        return res.status(404).json({ message: "Formulation not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete AI formulation:", error);
      res.status(500).json({ message: "Failed to delete formulation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
