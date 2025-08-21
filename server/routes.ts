import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertFormulationSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
