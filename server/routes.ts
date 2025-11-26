import type { Express } from "express";
import express from "express";
import path from "path";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";
import { storage } from "./storage";
import { insertCategorySchema, insertFormulationSchema, insertFormulationContentSchema, insertUserNoteSchema, insertPageSchema, insertBlogPostSchema, insertSampleProductSchema } from "@shared/schema";
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
import { optimizeFormulationName } from "./name-optimizer";
import { savePDFFile, saveTextFile, generateTextContent } from "./file-storage";
import bcrypt from "bcrypt";
import { signupSchema, loginSchema } from "@shared/schema";

// SendGrid email helper function
async function getSendGridClient() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  console.log('[SendGrid] Getting client, hostname:', hostname, 'token exists:', !!xReplitToken);

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const url = 'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid';
  console.log('[SendGrid] Fetching connection from:', url);

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });
  
  const responseData = await response.json();
  console.log('[SendGrid] Response status:', response.status, 'data:', JSON.stringify(responseData).substring(0, 200));
  
  const connectionSettings = responseData.items?.[0];

  if (!connectionSettings) {
    console.error('[SendGrid] No connection settings found');
    throw new Error('SendGrid not connected - no connection settings');
  }

  const apiKey = connectionSettings.settings?.api_key;
  const fromEmail = connectionSettings.settings?.from_email;
  
  console.log('[SendGrid] API Key present:', !!apiKey, 'From Email:', fromEmail);

  if (!apiKey || !fromEmail) {
    throw new Error('SendGrid not connected - missing api_key or from_email');
  }

  const sgMail = (await import('@sendgrid/mail')).default;
  sgMail.setApiKey(apiKey);
  console.log('[SendGrid] Client initialized successfully');
  
  return {
    client: sgMail,
    fromEmail: fromEmail
  };
}

// Session-based authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized - Please log in" });
  }
  next();
};

// Admin-only authentication middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  // Support both session auth (custom login) and OAuth auth (Replit)
  const userId = req.session?.userId || req.user?.id;
  console.log("Admin middleware check - userId:", userId, "req.user:", req.user?.id, "req.session.userId:", req.session?.userId);
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized - Please log in" });
  }
  
  try {
    const user = await storage.getUserById(userId);
    console.log("Admin middleware - user found:", !!user, "isAdmin:", user?.isAdmin);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Custom Signup endpoint
  app.post('/api/signup', async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create user
      const newUser = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        country: validatedData.country,
      });
      
      // Create session and save it
      (req as any).session.userId = newUser.id;
      
      (req as any).session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        
        res.json({ 
          success: true, 
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            country: newUser.country,
          }
        });
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Custom Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Create session and save it
      (req as any).session.userId = user.id;
      
      (req as any).session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        
        res.json({ 
          success: true, 
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            country: user.country,
          }
        });
      });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  // Password reset endpoints disabled - requires implementation in storage layer
  // TODO: Implement setPasswordResetToken, getUserByResetToken, updateUserPasswordReset in storage

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User downloads tracking
  app.post('/api/user/downloads', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { formulationId, formulationName, categoryName } = req.body;
      
      if (!formulationId || !formulationName || !categoryName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      await storage.trackDownload(userId, formulationId, formulationName, categoryName);
      res.json({ message: "Download tracked successfully" });
    } catch (error) {
      console.error("Error tracking download:", error);
      res.status(500).json({ message: "Failed to track download" });
    }
  });

  app.get('/api/user/downloads', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const downloads = await storage.getUserDownloads(userId);
      res.json(downloads);
    } catch (error) {
      console.error("Error fetching downloads:", error);
      res.status(500).json({ message: "Failed to fetch downloads" });
    }
  });

  // User favorites management
  app.post('/api/user/favorites', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { formulationId } = req.body;
      
      if (!formulationId) {
        return res.status(400).json({ message: "Missing formulationId" });
      }

      await storage.addFavorite(userId, formulationId);
      res.json({ message: "Favorite added successfully" });
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete('/api/user/favorites/:formulationId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { formulationId } = req.params;
      
      await storage.removeFavorite(userId, formulationId);
      res.json({ message: "Favorite removed successfully" });
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get('/api/user/favorites', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.get('/api/user/generated', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const generated = await storage.getUserGeneratedFormulations(userId);
      res.json(generated);
    } catch (error) {
      console.error("Error fetching generated formulations:", error);
      res.status(500).json({ message: "Failed to fetch generated formulations" });
    }
  });

  // Admin routes - protected by requireAdmin middleware
  app.get('/api/admin/users', requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/downloads', requireAdmin, async (req: any, res) => {
    try {
      const downloads = await storage.getAllDownloadsAdmin();
      res.json(downloads);
    } catch (error) {
      console.error("Error fetching all downloads:", error);
      res.status(500).json({ message: "Failed to fetch downloads" });
    }
  });

  app.get('/api/admin/favorites', requireAdmin, async (req: any, res) => {
    try {
      const favorites = await storage.getAllFavoritesAdmin();
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching all favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // Get all customer-generated formulation requests
  app.get('/api/admin/user-formulations', requireAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getUserFormulationRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching user formulation requests:", error);
      res.status(500).json({ message: "Failed to fetch user formulation requests" });
    }
  });

  // Get a single user formulation request
  app.get('/api/admin/user-formulations/:id', requireAdmin, async (req: any, res) => {
    try {
      const request = await storage.getUserFormulationRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "User formulation request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching user formulation request:", error);
      res.status(500).json({ message: "Failed to fetch user formulation request" });
    }
  });

  // Update user formulation request status
  app.patch('/api/admin/user-formulations/:id', requireAdmin, async (req: any, res) => {
    try {
      const { status, adminNotes } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const updatedRequest = await storage.updateUserFormulationRequestStatus(
        req.params.id,
        status,
        adminNotes,
        req.session?.userId || 'admin'
      );

      if (!updatedRequest) {
        return res.status(404).json({ message: "User formulation request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating user formulation request:", error);
      res.status(500).json({ message: "Failed to update user formulation request" });
    }
  });

  // Delete user formulation request
  app.delete('/api/admin/user-formulations/:id', requireAdmin, async (req: any, res) => {
    try {
      const success = await storage.deleteUserFormulationRequest(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User formulation request not found" });
      }
      res.json({ success: true, message: "User formulation request deleted" });
    } catch (error) {
      console.error("Error deleting user formulation request:", error);
      res.status(500).json({ message: "Failed to delete user formulation request" });
    }
  });

  // Get generated formulas for a specific user request
  app.get('/api/admin/user-formulations/:id/generated', requireAdmin, async (req: any, res) => {
    try {
      const request = await storage.getUserFormulationRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "User formulation request not found" });
      }

      // If there's a direct formulationId, fetch just that one
      if (request.formulationId) {
        const formulation = await storage.getFormulation(request.formulationId);
        console.log(`Found formulation ${request.formulationId}: ${formulation ? 'exists' : 'not found'}`);
        if (formulation) {
          return res.json([formulation]);
        }
      }

      // Fallback: Get all formulations and match by the formulation ID from the request
      const allFormulations = await storage.getAllFormulations();
      
      if (request.formulationId) {
        const matchingFormulas = allFormulations.filter(f => f.id === request.formulationId);
        console.log(`Found ${matchingFormulas.length} formulas matching request ID ${request.formulationId}`);
        return res.json(matchingFormulas || []);
      }

      console.log(`No formulations found for request ${req.params.id}`);
      res.json([]);
    } catch (error) {
      console.error("Error fetching generated formulas:", error);
      res.status(500).json({ message: "Failed to fetch generated formulas" });
    }
  });

  // Object Storage routes for image uploads
  app.post("/api/objects/upload", async (req, res) => {
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
  app.put("/api/formulation-images", async (req, res) => {
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
      
      // Check if user is authenticated admin
      const isAdmin = req.user && (req.user as any).claims?.email === 'qasim778@gmail.com';
      
      let allFormulations;
      
      if (categoryId) {
        allFormulations = await storage.getFormulationsByCategory(categoryId as string);
      } else {
        allFormulations = await storage.getFormulations();
      }
      
      // Filter to only active formulations for non-admin users
      if (!isAdmin) {
        allFormulations = allFormulations.filter(f => f.isActive);
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
      
      // Get admin-generated page content if it exists (for public display)
      const pageContent = await storage.getPageByFormulationId(formulation.id);
      
      // Return formulation with optional page content (formula details remain hidden)
      const response = {
        ...formulation,
        customPageContent: pageContent?.content || null
      };
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch formulation" });
    }
  });

  app.post("/api/formulations", requireAdmin, async (req, res) => {
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

  app.delete("/api/formulations/:id", requireAdmin, async (req, res) => {
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

  // Activity endpoint for live notifications
  app.get("/api/activity", async (req, res) => {
    try {
      const allFormulations = await storage.getFormulations();
      
      // Only show active formulations in activity notifications
      const formulations = allFormulations.filter(f => f.isActive);
      
      if (formulations.length === 0) {
        return res.json(null);
      }
      
      // Random user names from different cultures
      const userNames = [
        "arjun", "sarah", "mohammed", "yuki", "maria", "chen", "priya", "james",
        "fatima", "diego", "amara", "lucas", "zara", "akira", "sofia", "rashid",
        "emma", "hassan", "mia", "kai", "leila", "mateo", "nia", "ravi"
      ];
      
      // Countries
      const countries = [
        "India", "USA", "Brazil", "Japan", "Mexico", "Egypt", "Nigeria", "China",
        "UK", "Germany", "France", "Canada", "Australia", "South Korea", "Italy",
        "Spain", "Turkey", "Indonesia", "Thailand", "UAE", "South Africa"
      ];
      
      // Time ago options
      const timeOptions = [
        "1 hour ago", "2 hours ago", "3 hours ago", "4 hours ago", "5 hours ago",
        "30 minutes ago", "45 minutes ago", "1 minute ago", "just now"
      ];
      
      // Pick random formulation
      const randomFormulation = formulations[Math.floor(Math.random() * formulations.length)];
      
      // Pick random user, country, and time
      const randomUser = userNames[Math.floor(Math.random() * userNames.length)];
      const randomCountry = countries[Math.floor(Math.random() * countries.length)];
      const randomTime = timeOptions[Math.floor(Math.random() * timeOptions.length)];
      
      // Create activity message
      const activity = {
        message: `${randomUser} from ${randomCountry} crafted a ${randomFormulation.name} — ${randomTime}`,
        userName: randomUser,
        country: randomCountry,
        formulationName: randomFormulation.name,
        timeAgo: randomTime
      };
      
      res.json(activity);
    } catch (error: any) {
      console.error("Failed to generate activity:", error);
      res.status(500).json({ message: "Failed to generate activity" });
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
  app.post('/api/admin/generate-image', async (req, res) => {
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

  // Admin formulation management endpoints
  app.get("/api/admin/formulations", async (req, res) => {
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

  app.patch("/api/admin/formulations/:id/status", async (req, res) => {
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

      // Get the original request to check if we need to create a formulation
      const originalRequest = await storage.getUserFormulationRequest(req.params.id);
      if (!originalRequest) {
        return res.status(404).json({ message: "User formulation request not found" });
      }

      let formulationId = originalRequest.formulationId;

      // If status is being changed to "approved" and there's no formulation yet, create one
      if (status === "approved" && !formulationId) {
        try {
          // Find the category by name
          const categories = await storage.getCategories();
          const category = categories.find(c => c.name.toLowerCase().includes(originalRequest.productCategory.toLowerCase()));
          
          if (category) {
            // Create a new formulation from the request data
            const formData = (originalRequest.formData || {}) as any;
            const newFormulation = await storage.createFormulation({
              categoryId: category.id,
              name: originalRequest.productName,
              slug: originalRequest.productName,
              description: originalRequest.additionalNotes || `Custom formulation: ${originalRequest.productName}`,
              phLevel: originalRequest.phLevel || "6.5",
              shelfLife: originalRequest.shelfLife || "12",
              batchSize: "1000ml",
              processingTime: "30 minutes",
              temperature: "Room temperature",
              equipment: "Standard lab equipment",
              storageConditions: "Cool and dry place",
              ingredients: JSON.stringify(formData.ingredients || []),
              instructions: JSON.stringify(formData.instructions || []),
              usageInstructions: formData.usageInstructions || "Follow standard application procedures",
              isActive: true,
            });
            
            formulationId = newFormulation.id;
            console.log(`Created formulation ${formulationId} for approved request ${req.params.id}`);
          }
        } catch (error) {
          console.error("Failed to create formulation for approved request:", error);
          // Continue anyway - update the request status even if formulation creation fails
        }
      }

      const updatedRequest = await storage.updateUserFormulationRequestStatus(
        req.params.id,
        status,
        adminNotes,
        reviewedBy
      );

      if (!updatedRequest) {
        return res.status(404).json({ message: "User formulation request not found" });
      }

      // If we created a formulation, update the request with the formulation ID
      if (formulationId && formulationId !== originalRequest.formulationId) {
        // Update the request to link it to the new formulation
        const { db } = await import("./db");
        const { userFormulationRequestsTable } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        await db.update(userFormulationRequestsTable)
          .set({ formulationId })
          .where(eq(userFormulationRequestsTable.id, req.params.id));
      }

      res.json({
        message: `User formulation request status updated to ${status}`,
        request: updatedRequest,
        formulationId: formulationId
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

  app.post("/api/ai/generate-formulation", async (req, res) => {
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
        categoryId: finalCategoryId,
        userId: (req as any).session?.userId
      });
      
      res.status(201).json(formulation);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate formulation" });
    }
  });

  // Generate formulation with formula keywords and image
  app.post("/api/ai/generate-formulation-with-keywords", async (req, res) => {
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
        categoryId,
        userId: (req as any).session?.userId
      });
      
      res.status(201).json(formulation);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate formulation with keywords" });
    }
  });

  // Bulk AI Generation endpoint (protected admin route)
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
          // Add SEO fields to formulation data
          const formulationWithSEO = addSEOFields({
            ...formulationData,
            categoryId,
            userId: (req.session as any)?.passport?.user?.id || (req as any).user?.id
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
  app.post("/api/ai/generate-bulk-formulations-with-keywords", async (req, res) => {
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
            categoryId: finalCategoryId,
            userId: (req.session as any)?.passport?.user?.id || (req as any).user?.id
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
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    const startTime = Date.now();
    
    // Capture user ID if authenticated
    let authenticatedUserId = (req as any).session?.userId || null;
    console.log(`🔐 Authenticated User ID: ${authenticatedUserId || 'Not logged in'}`);
    
    try {
      const {
        customerName,
        email,
        country,
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
        shelfLife,
        productionVolume,
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
      
      // Optimize the product name for SEO
      const categoryForOptimization = productCategory || productType || 'formulation';
      const nameOptimizationResult = await optimizeFormulationName(
        productName,
        categoryForOptimization,
        false // Use rule-based for consistency
      );
      const optimizedName = nameOptimizationResult.optimizedName;
      console.log(`📝 Name optimized: "${productName}" → "${optimizedName}"`);
      
      let formulation;
      try {
        // Import the flexible custom formulation generator
        const { generateCustomFormulation } = await import('./ai');
        
        // Create comprehensive request for AI
        const customRequest = {
          productName: optimizedName,
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
          name: optimizedName,
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
          name: optimizedName,
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

      // Always use "Custom Innovations" category for customer-generated formulations
      const categories = await storage.getCategories();
      const customInnovationsCategory = categories.find(cat => cat.name === 'Custom Innovations');
      const categoryId = customInnovationsCategory?.id || categories[0]?.id;
      console.log(`📂 Using "Custom Innovations" category for customer-generated formula`);

      // Save formulation to database with isActive: false (pending approval)
      // Add SEO fields to custom formulation  
      const categoryResult = await storage.getCategory(categoryId!);
      const categoryName = categoryResult ? categoryResult.name : 'Custom Formulation';
      
      const formulationWithSEO = addSEOFields({
        ...formulation,
        categoryId,
        isActive: false // This will make it appear in pending approval
      }, categoryName);
      
      // Create slug for the formulation
      const slug = formulation.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60);

      // Generate PDF with logo settings
      const pdfBuffer = generateFormulationPDF({
        ...formulation,
        slug,
        metaDescription: undefined,
        keywords: undefined
      }, logoSettings);
      
      // Generate text content
      const textContent = generateTextContent(formulation);
      
      // Save PDF and text files
      const pdfFile = savePDFFile(pdfBuffer, formulation.name);
      const textFile = saveTextFile(textContent, formulation.name);
      
      // Save formulation to database with file paths and slug
      let savedFormulation;
      try {
        savedFormulation = await storage.createFormulation({
          ...formulation,
          slug,
          pdfPath: pdfFile.filename,
          textPath: textFile.filename,
          userId: (req as any).session?.userId || null,
          categoryId: categoryId, // Always use "Custom Innovations" category for customer-generated formulas
          isActive: false // Pending approval
        });
        console.log(`✅ Formulation saved to database: ${savedFormulation.id}`);
      } catch (saveError) {
        console.error('Failed to save formulation to database:', saveError);
        // Return error if we can't save
        return res.status(500).json({ 
          message: `Failed to save formulation to database: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`
        });
      }

      // Save user formulation request for admin review
      try {
        const debugName = req.body.customerName?.trim() || '';
        const debugEmail = req.body.email?.trim() || '';
        const debugCountry = req.body.country?.trim() || '';
        console.log('📝 Customer Info Received:', { name: debugName, email: debugEmail, country: debugCountry });
        
        const userRequest: any = {
          userId: authenticatedUserId, // Store authenticated user ID (captured at line start)
          sessionId: req.sessionID || 'anonymous',
          customerName: debugName.length > 0 ? debugName : null,
          email: debugEmail.length > 0 ? debugEmail : null,
          country: debugCountry.length > 0 ? debugCountry : null,
          productName,
          productCategory: categoryName,
          consistencyType: viscosity || undefined,
          phLevel: phLevel?.toString() || undefined,
          viscosity: viscosity || undefined,
          shelfLife: shelfLife || undefined,
          budgetCategory: costLevel || undefined,
          productionVolume: productionVolume || undefined,
          specialProperties: specialRequirements ? [specialRequirements] : undefined,
          additionalNotes: `Color: ${color || 'Not specified'}, Fragrance: ${fragrance || 'Not specified'}`,
          status: 'pending',
          formData: req.body, // REQUIRED: Include complete form data
          formulationId: savedFormulation.id
        };

        await storage.createUserFormulationRequest(userRequest);
        console.log(`✅ User formulation request saved for admin review (userId: ${userRequest.userId})`);
      } catch (requestError) {
        console.error('Failed to save user formulation request:', requestError);
        // Continue - this is not critical to the user experience
      }

      // Track AI generation for analytics
      try {
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
      } catch (analyticsError) {
        console.error('Failed to track AI generation:', analyticsError);
        // Continue - this is not critical
      }
      
      // Return JSON metadata with download URLs
      res.json({
        success: true,
        formulation: {
          id: savedFormulation.id,
          name: savedFormulation.name,
          pdfUrl: `/api/formulations/${savedFormulation.id}/download/pdf`,
          textUrl: `/api/formulations/${savedFormulation.id}/download/text`
        }
      });
      
    } catch (error: any) {
      console.error("Failed to generate custom formulation:", error);
      res.status(500).json({ 
        message: error.message || "Failed to generate custom formulation" 
      });
    }
  });

  // Download PDF file for a formulation - requires authentication
  app.get("/api/formulations/:id/download/pdf", requireAuth, async (req, res) => {
    try {
      const formulationId = req.params.id;
      const formulation = await storage.getFormulation(formulationId);
      
      if (!formulation) {
        return res.status(404).json({ message: "Formulation not found" });
      }
      
      if (!formulation.pdfPath) {
        return res.status(404).json({ message: "PDF file not found" });
      }
      
      // Read PDF file from disk
      const { readFile } = await import('./file-storage');
      const pdfBuffer = readFile(formulation.pdfPath);
      
      // Set headers for PDF download
      const sanitizedName = formulation.name
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      const filename = `${sanitizedName}_formulation.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Failed to download PDF:", error);
      res.status(500).json({ 
        message: error.message || "Failed to download PDF" 
      });
    }
  });

  // Download text file for a formulation - requires authentication
  app.get("/api/formulations/:id/download/text", requireAuth, async (req, res) => {
    try {
      const formulationId = req.params.id;
      const formulation = await storage.getFormulation(formulationId);
      
      if (!formulation) {
        return res.status(404).json({ message: "Formulation not found" });
      }
      
      if (!formulation.textPath) {
        return res.status(404).json({ message: "Text file not found" });
      }
      
      // Read text file from disk
      const { readFile } = await import('./file-storage');
      const textBuffer = readFile(formulation.textPath);
      
      // Set headers for text download
      const sanitizedName = formulation.name
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      const filename = `${sanitizedName}_formulation.txt`;
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', textBuffer.length);
      
      res.send(textBuffer);
    } catch (error: any) {
      console.error("Failed to download text file:", error);
      res.status(500).json({ 
        message: error.message || "Failed to download text file" 
      });
    }
  });

  // Get formulation details by ID - Public endpoint for confirmation page

  // PDF Generation for existing formulations
  app.post("/api/formulations/:id/pdf", requireAuth, async (req: any, res) => {
    try {
      const formulationId = req.params.id;
      const formulation = await storage.getFormulation(formulationId);
      
      if (!formulation) {
        return res.status(404).json({ message: "Formulation not found" });
      }

      // Get userId from session
      const userId = req.session.userId;

      // Get category name for tracking
      const category = formulation.categoryId ? await storage.getCategory(formulation.categoryId) : null;

      // Track download BEFORE generating PDF
      try {
        await storage.trackDownload(
          userId,
          formulation.id,
          formulation.name,
          category?.name || 'Unknown'
        );
        console.log(`✅ Download tracked for user ${userId}: ${formulation.name}`);
      } catch (trackError) {
        console.error("Error tracking download:", trackError);
        // Continue with PDF generation even if tracking fails
      }

      // Get logo settings from request body
      const logoSettings = req.body.logoSettings || {};

      // Generate PDF with logo settings - convert null values to undefined for type compatibility
      const formulationData = {
        ...formulation,
        seoTitle: formulation.seoTitle ?? undefined,
        metaDescription: formulation.metaDescription ?? undefined,
        keywords: formulation.keywords ?? undefined,
        image: formulation.image ?? undefined,
        imageAlt: formulation.imageAlt ?? undefined,
        imageFilename: formulation.imageFilename ?? undefined,
        viscosity: formulation.viscosity ?? undefined,
        certification: formulation.certification ?? undefined,
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

  // Sample Products API
  // Get all active sample products
  app.get("/api/sample-products", async (req, res) => {
    try {
      const products = await storage.getSampleProducts();
      res.json(products);
    } catch (error: any) {
      console.error("Failed to fetch sample products:", error);
      res.status(500).json({ message: "Failed to fetch sample products" });
    }
  });

  // Get single sample product
  app.get("/api/sample-products/:id", async (req, res) => {
    try {
      const product = await storage.getSampleProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      console.error("Failed to fetch product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Create new sample product (admin only)
  app.post("/api/sample-products", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertSampleProductSchema.parse(req.body);
      const product = await storage.createSampleProduct(validatedData);
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Failed to create product:", error);
      if (error.issues) {
        res.status(400).json({ message: "Validation failed", issues: error.issues });
      } else {
        res.status(400).json({ message: error.message || "Invalid product data" });
      }
    }
  });

  // Update sample product (admin only)
  app.patch("/api/sample-products/:id", requireAdmin, async (req, res) => {
    try {
      const product = await storage.updateSampleProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      console.error("Failed to update product:", error);
      res.status(400).json({ message: error.message || "Invalid update data" });
    }
  });

  // Delete sample product (admin only)
  app.delete("/api/sample-products/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteSampleProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      res.status(500).json({ message: "Failed to delete product" });
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

  // Formulation Content Management API
  // Get formulation content for a specific formulation
  app.get("/api/formulation-content/:formulationId", async (req, res) => {
    try {
      const content = await storage.getFormulationContent(req.params.formulationId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error: any) {
      console.error("Failed to fetch formulation content:", error);
      res.status(500).json({ message: "Failed to fetch formulation content" });
    }
  });

  // Create or update formulation content
  app.post("/api/formulation-content", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertFormulationContentSchema.parse(req.body);
      const existingContent = await storage.getFormulationContent(validatedData.formulationId);
      
      let content;
      if (existingContent) {
        content = await storage.updateFormulationContent(validatedData.formulationId, validatedData);
      } else {
        content = await storage.createFormulationContent(validatedData);
      }
      
      res.status(201).json(content);
    } catch (error: any) {
      console.error("Failed to create/update formulation content:", error);
      if (error.issues) {
        res.status(400).json({ 
          message: "Validation failed", 
          issues: error.issues.map((issue: any) => ({
            path: issue.path,
            message: issue.message
          }))
        });
      } else {
        res.status(400).json({ message: error.message || "Invalid content data" });
      }
    }
  });

  // Update formulation content
  app.put("/api/formulation-content/:formulationId", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertFormulationContentSchema.partial().parse(req.body);
      const content = await storage.updateFormulationContent(req.params.formulationId, validatedData);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error: any) {
      console.error("Failed to update formulation content:", error);
      res.status(400).json({ message: error.message || "Invalid content data" });
    }
  });

  // Delete formulation content
  app.delete("/api/formulation-content/:formulationId", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteFormulationContent(req.params.formulationId);
      if (!success) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Failed to delete formulation content:", error);
      res.status(500).json({ message: "Failed to delete formulation content" });
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
      
      // Fallback to generic properties with compulsory flags
      const fallbackProperties = [
        { name: 'Professional grade', compulsory: true },
        { name: 'Enhanced formula', compulsory: false },
        { name: 'High quality', compulsory: true },
        { name: 'Reliable performance', compulsory: false },
        { name: 'Industry standard', compulsory: false }
      ];
      
      res.json(fallbackProperties);
    }
  });

  // AI Page Content Generator
  app.post("/api/admin/generate-full-page", async (req, res) => {
    // Support both session auth (email/password) and OAuth auth
    const userId = (req.session as any)?.userId || (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - Please log in" });
    }
    
    try {
      const user = await storage.getUserById(userId) || await storage.getUserByEmail((req.user as any)?.claims?.email);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }
    } catch (error) {
      console.error("Admin check error:", error);
    }
    try {
      let { productName, category } = req.body;
      if (!productName || !category) {
        return res.status(400).json({ message: "Product name and category are required" });
      }

      // If category is a UUID, resolve it to the category name and slug
      let categoryName = category;
      let categorySlug = "";
      if (category.includes('-') && category.length === 36) {
        const categoryObj = await storage.getCategory(category);
        if (categoryObj) {
          categoryName = categoryObj.name;
          categorySlug = categoryObj.slug;
        }
      }

      const systemPrompt = `MASTER SYSTEM FILE — AIFormulator HTML Generator
=========================================================================

GOAL: Generate a COMPLETE formulation page as ONE SINGLE CLEAN HTML BLOCK.

MANDATORY GLOBAL HTML RULES:
1. ALWAYS output HTML only.
2. Allowed tags ONLY: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <ol>, <strong>, <br>
3. NEVER use Markdown (** ## etc.)
4. NEVER output JSON.
5. NEVER split output into multiple blocks. Output ONE final HTML block only.
6. ALL sections must be inside the SAME HTML output.
7. NO explanations outside HTML tags.

TOP-OF-PAGE REQUIRED ORDER (STRICT):
<h1>${productName}</h1>

<h2>Keyword Strategy</h2>
<p><strong>Primary Keyword:</strong> ${productName}</p>
<p><strong>Secondary Keywords:</strong> 3–5 category-related phrases specific to ${categoryName}</p>
<p><strong>Semantic Keywords:</strong> chemistry, technical, and function terms relevant to this formulation</p>
<p><strong>Intent-Based Keywords:</strong> how to use, benefits, applications, best practices</p>
<p><strong>Context-Based Keywords:</strong> user scenarios, environment, application contexts</p>
<p><strong>Long-Tail Keywords:</strong> 2–3 natural question-like searches users would make</p>

<h2>CTA Strategy</h2>
<p>
Based on category "${categoryName}":
If category contains: baby, infant, kids, child, skin, hair, beauty, salon, grooming, shampoo, lotion, cream, wash
→ Use gentle, safe, confidence-focused CTA tone.
If category contains: cleaning, detergent, toilet, bathroom, disinfectant, laundry, fabric, floor
→ Use performance-driven CTA (shine, cleaning power, efficiency).
If category contains: adhesive, sealant, epoxy, grout, tile, stone, construction, cement
→ Use technical, reliability-focused CTA (strength, stability).
If category contains: agriculture, agro, water treatment, pest, mosquito
→ Use safety, compliance, controlled-usage CTA.
Otherwise: Use neutral, clarity-focused CTA.
Write 2-3 sentences matching the tone above.
</p>

<h2>Page Strategy</h2>
<p>
Provide 5-7 sentences explaining:
• why this template structure fits the ${categoryName} category
• why this semantic approach suits the product intent
• the SEO purpose and Google AI-Overview alignment
• the tone and style chosen
• how variation maintains uniqueness
</p>

=====================================================================
PAGE TEMPLATE SELECTION (ONE OF T1-T10) BASED ON CATEGORY MAPPING
=====================================================================

Category Mapping:
- GROUP A (baby, infant, kids, child) → T2, T4, T10
- GROUP B (skin, hair, beauty, grooming, shampoo, lotion, cream, wash) → T1, T4, T7, T10
- GROUP C (cleaning, detergent, toilet, laundry, disinfectant, fabric, floor) → T2, T6, T7
- GROUP D (car, auto, vehicle, tire, polish, shoe, leather) → T1, T3, T6
- GROUP E (adhesive, sealant, epoxy, grout, tile, stone, construction, cement) → T3, T5, T8
- GROUP F (industrial, 3d printing, filament, resin, coating, polymer, paint) → T3, T5, T9
- GROUP G (agriculture, agro, water treatment, pest, mosquito, mite) → T2, T8, T9
- GROUP H (pet, veterinary, dog, cat, animal) → T2, T4, T7
- GROUP I (herbal, organic, essential oil, aromatherapy, natural) → T2, T4, T9, T10
- GROUP J (default/other) → Any T1-T10

Pick ONE randomly from the category group above, then INSERT it below:

T1 — CLASSIC TECHNICAL OVERVIEW:
<h2>Product Snapshot</h2>
<p>Provide a clear and concise explanation of what ${productName} is, its primary purpose, and core functionality it delivers.</p>
<h2>Entity Details</h2>
<p><strong>Category:</strong> ${categoryName}<br><strong>Type:</strong> Specific product type<br><strong>Application:</strong> Usage context<br><strong>Industry:</strong> Industry segment</p>
<h2>What This Formulation Does</h2>
<p>Explain the functional objective and results it aims to deliver in practical use.</p>
<h2>Key Performance Features</h2>
<ul>
<li>Feature 1 describing performance.</li>
<li>Feature 2 adding functional value.</li>
<li>Feature 3 reinforcing advantage.</li>
</ul>
<h2>Recommended Use Areas</h2>
<p>Describe surfaces, materials, environments where the product performs best.</p>
<h2>How It Works</h2>
<p>Explain the scientific reasoning or functional mechanism behind the formulation.</p>
<h2>Conceptual Ingredient Layout</h2>
<p>Provide conceptual breakdown of ingredient groups (no percentages).</p>
<h2>Basic Processing Route</h2>
<ol>
<li>Processing step 1.</li>
<li>Processing step 2.</li>
<li>Processing step 3.</li>
</ol>
<h2>Quality Considerations</h2>
<ul>
<li>QC checkpoint 1.</li>
<li>QC checkpoint 2.</li>
</ul>
<h2>Safety & Handling</h2>
<p>Summarize safety handling appropriate for the product's category.</p>
<h2>Storage & Shelf Life</h2>
<p>State suitable storage conditions and shelf stability.</p>
<h2>Common Issues & Fixes</h2>
<ul>
<li><strong>Issue:</strong> Describe a common issue.<br><strong>Fix:</strong> Provide the corrective measure.</li>
</ul>

T2 — PROBLEM–SOLUTION MODEL (CONSUMER + CLEANING FRIENDLY):
<h2>The Problem</h2>
<p>Explain the real-world problem ${productName} is designed to solve.</p>
<h2>Why This Problem Happens</h2>
<p>Describe the technical or everyday reason behind the issue.</p>
<h2>The Solution</h2>
<p>Explain clearly how the formulation fixes the issue and why it works well.</p>
<h2>Who Should Use This Product</h2>
<p>Describe target users, skill level, and environment of usage.</p>
<h2>Benefits at a Glance</h2>
<ul>
<li>Benefit 1.</li>
<li>Benefit 2.</li>
<li>Benefit 3.</li>
</ul>
<h2>Underlying Science</h2>
<p>Explain the mechanism through accessible, non-technical language.</p>
<h2>Functional Ingredient Groups</h2>
<p>Describe functional ingredient families (no percentages).</p>
<h2>How to Use</h2>
<ol>
<li>Usage step 1.</li>
<li>Usage step 2.</li>
<li>Usage step 3.</li>
</ol>
<h2>Compatibility</h2>
<p>Surfaces, materials, or fabrics where ${productName} performs well.</p>
<h2>Maintenance / Re-Application</h2>
<p>Describe how often the product should be reapplied or maintained.</p>
<h2>Safety Focus</h2>
<p>Provide category-appropriate safety tips.</p>
<h2>Storage & Disposal</h2>
<p>Describe safe storage and disposal guidelines.</p>
<h2>FAQs</h2>
<p><strong>Q:</strong> Question 1?<br><strong>A:</strong> Answer.</p>
<p><strong>Q:</strong> Question 2?<br><strong>A:</strong> Answer.</p>

T3 — TECHNICAL DATA SHEET (TDS-STYLE, INDUSTRIAL):
<h2>Technical Identity</h2>
<p><strong>Category:</strong> ${categoryName}<br><strong>Product Type:</strong> Specific type<br><strong>Industry:</strong> Industry segment<br><strong>Application:</strong> Use case</p>
<h2>Product Description</h2>
<p>Deliver a sharp technical summary outlining purpose and performance scope.</p>
<h2>Key Technical Highlights</h2>
<ul>
<li>Highlight 1.</li>
<li>Highlight 2.</li>
<li>Highlight 3.</li>
</ul>
<h2>Recommended Substrates / Materials</h2>
<p>List compatible materials or surfaces.</p>
<h2>Conceptual Composition</h2>
<p>Explain ingredient roles (solvents, binders, polymers, surfactants, etc.).</p>
<h2>Processing & Application Method</h2>
<ol>
<li>Prepare materials and equipment.</li>
<li>Apply according to standard technical guidance.</li>
<li>Complete curing or finishing.</li>
</ol>
<h2>Relevant QC Parameters</h2>
<ul>
<li>QC parameter 1.</li>
<li>QC parameter 2.</li>
</ul>
<h2>Performance Notes</h2>
<p>Describe how ${productName} performs under typical industrial conditions.</p>
<h2>Health & Safety Information</h2>
<p>Provide general safety precautions suitable for industrial environments.</p>
<h2>Storage & Stability</h2>
<p>Describe storage conditions and stability expectations.</p>
<h2>Troubleshooting Guide</h2>
<ul>
<li><strong>Issue:</strong> Example problem.<br><strong>Fix:</strong> Recommended correction.</li>
</ul>

T4 — BENEFIT-LED COSMETIC + PERSONAL CARE STYLE:
<h2>Why This Formulation Matters</h2>
<p>Explain the core value ${productName} brings to personal, cosmetic, or gentle-care users.</p>
<h2>Who It Is Designed For</h2>
<p>Describe user type and their needs (skin type, hair type, baby requirements, pet sensitivity, etc.).</p>
<h2>Core Benefits</h2>
<ul>
<li>Benefit 1 related to sensory feel or visible results.</li>
<li>Benefit 2 related to comfort or soothing effect.</li>
<li>Benefit 3 related to prolonged protection or conditioning.</li>
</ul>
<h2>How the Formula Works</h2>
<p>Explain the mechanism of action in gentle, user-friendly language.</p>
<h2>Key Functional Components</h2>
<p>Describe main ingredient groups such as surfactants, emollients, oils, conditioners.</p>
<h2>How to Use</h2>
<ol>
<li>Step 1.</li>
<li>Step 2.</li>
</ol>
<h2>Routine Integration</h2>
<p>Describe how ${productName} fits into a daily or weekly personal care routine.</p>
<h2>Dermatological / Safety Considerations</h2>
<p>Provide mild safety recommendations and patch-test suggestions.</p>
<h2>Storage & Product Care</h2>
<p>Explain how to maintain quality and shelf stability after opening.</p>
<h2>Common Questions</h2>
<p><strong>Q:</strong> Question?<br><strong>A:</strong> Answer.</p>

T5 — PROCESS-FIRST MANUFACTURING TEMPLATE:
<h2>Process-Oriented Summary</h2>
<p>Explain the production-focused nature of ${productName}, emphasizing simplicity, stability, and scaling.</p>
<h2>Intended Area of Use</h2>
<p>Describe where the product fits in an industrial or production environment.</p>
<h2>Functional Performance Targets</h2>
<ul>
<li>Performance target 1.</li>
<li>Performance target 2.</li>
<li>Performance target 3.</li>
</ul>
<h2>Conceptual Formulation Architecture</h2>
<p>Break down formulation blocks and why they are used.</p>
<h2>Manufacturing Procedure</h2>
<ol>
<li>Mixing sequence including charging and premixing.</li>
<li>Heating/cooling/shear steps if required.</li>
<li>Final adjustments and finishing.</li>
</ol>
<h2>Critical Process Controls</h2>
<ul>
<li>Process control 1.</li>
<li>Process control 2.</li>
</ul>
<h2>Quality Control & Release Criteria</h2>
<p>Describe conceptual QC checks like appearance, viscosity, stability, solids (NO numbers).</p>
<h2>Safety During Production</h2>
<p>Provide safety handling and PPE suggestions appropriate for plant environments.</p>
<h2>Storage, Transport & Handling</h2>
<p>Describe handling guidance for bulk storage or shipping.</p>
<h2>Typical Issues in Production</h2>
<ul>
<li><strong>Issue:</strong> Common manufacturing problem.<br><strong>Fix:</strong> Provide practical correction.</li>
</ul>

T6 — APPLICATION SCENARIO / USE-CASE FLOW:
<h2>Quick Overview</h2>
<p>Provide a short, direct explanation describing user type, application setting, and product purpose.</p>
<h2>Typical Use Scenarios</h2>
<ul>
<li>Use scenario 1 related to real environment.</li>
<li>Use scenario 2 describing a common situation.</li>
<li>Use scenario 3 demonstrating broader usage.</li>
</ul>
<h2>Performance in Real Conditions</h2>
<p>Explain how ${productName} performs under different temperatures, surfaces, or workload conditions.</p>
<h2>How to Apply Step-by-Step</h2>
<ol>
<li>Step 1: preparation.</li>
<li>Step 2: application method.</li>
<li>Step 3: after-application guidance.</li>
</ol>
<h2>What Makes This Formulation Different</h2>
<ul>
<li>Unique feature or outcome 1.</li>
<li>Unique feature or outcome 2.</li>
</ul>
<h2>Underlying Composition Logic</h2>
<p>Describe conceptual ingredient structure contributing to key results.</p>
<h2>Care, Cleaning or Maintenance After Use</h2>
<p>Provide steps or guidelines for post-application maintenance.</p>
<h2>Precautions & Safety Advice</h2>
<p>List safety measures suitable for application context.</p>
<h2>Storage & Product Longevity</h2>
<p>Explain long-term stability and proper storage conditions.</p>

T7 — QUESTION-BASED / FAQ-HEAVY STRUCTURE:
<h2>What Is This Product?</h2>
<p>Explain ${productName}'s identity clearly in 3–5 lines.</p>
<h2>Who Should Use It?</h2>
<p>Describe ideal users and common usage domains.</p>
<h2>What Problems Does It Solve?</h2>
<ul>
<li>Problem 1 + explanation.</li>
<li>Problem 2 + explanation.</li>
</ul>
<h2>How Do I Use It Correctly?</h2>
<ol>
<li>Step-by-step use instruction 1.</li>
<li>Step-by-step use instruction 2.</li>
</ol>
<h2>What's Inside (Conceptually)?</h2>
<p>Describe major ingredient groups and functional roles (no percentages).</p>
<h2>Is It Safe?</h2>
<p>Provide simple but effective safety and handling guidelines.</p>
<h2>FAQs</h2>
<p><strong>Q:</strong> Question 1?<br><strong>A:</strong> Answer.</p>
<p><strong>Q:</strong> Question 2?<br><strong>A:</strong> Answer.</p>
<p><strong>Q:</strong> Question 3?<br><strong>A:</strong> Answer.</p>
<h2>Tips for Best Results</h2>
<ul>
<li>Tip 1.</li>
<li>Tip 2.</li>
<li>Tip 3.</li>
</ul>

T8 — SAFETY, COMPLIANCE & RISK-FOCUSED:
<h2>Purpose of This Product</h2>
<p>Explain the functional role of ${productName} within regulated, agricultural, pest-control, or water-treatment settings.</p>
<h2>Functional Description</h2>
<p>Describe clearly what the formulation does and why it is important.</p>
<h2>Key Benefits</h2>
<ul>
<li>Benefit 1.</li>
<li>Benefit 2.</li>
<li>Benefit 3.</li>
</ul>
<h2>Mode of Action</h2>
<p>Explain the chemical, biological, or mechanical mechanism behind performance.</p>
<h2>Application Guidelines</h2>
<ol>
<li>Application instruction 1.</li>
<li>Application instruction 2.</li>
<li>Application instruction 3.</li>
</ol>
<h2>Environmental & Safety Considerations</h2>
<p>Provide high-level environmental and user safety guidelines without regulatory claims.</p>
<h2>Handling & PPE Advice</h2>
<ul>
<li>PPE recommendation 1.</li>
<li>PPE recommendation 2.</li>
</ul>
<h2>Storage & Stability</h2>
<p>Describe storage conditions and stability parameters (no percentages).</p>
<h2>Emergency / Misuse Notes</h2>
<p>Provide general, non-medical, non-regulatory emergency information.</p>

T9 — INNOVATION / R&D STYLE (ADVANCED MATERIALS):
<h2>Innovation Summary</h2>
<p>Describe the innovative insight or technology behind ${productName}.</p>
<h2>Technology Background</h2>
<p>Explain relevant material science or technological principles.</p>
<h2>Key Innovation Highlights</h2>
<ul>
<li>Highlight 1.</li>
<li>Highlight 2.</li>
<li>Highlight 3.</li>
</ul>
<h2>Target Applications</h2>
<p>Explain where this advanced formulation is most suitable.</p>
<h2>Core Architecture</h2>
<p>Describe conceptual ingredient systems or matrix structure.</p>
<h2>Recommended Processing & Use</h2>
<ol>
<li>Processing step 1.</li>
<li>Processing step 2.</li>
<li>Processing step 3.</li>
</ol>
<h2>Performance Envelope</h2>
<p>Describe zones where the formulation performs best.</p>
<h2>Reliability & QC Themes</h2>
<ul>
<li>QC emphasis 1.</li>
<li>QC emphasis 2.</li>
</ul>
<h2>Safety & Handling</h2>
<p>Describe technical safety expectations.</p>

T10 — MINIMAL STRUCTURED TEMPLATE (SHORT & CLEAN):
<h2>Overview</h2>
<p>Provide a brief high-level overview in 3–5 lines.</p>
<h2>Main Benefits</h2>
<ul>
<li>Benefit 1.</li>
<li>Benefit 2.</li>
</ul>
<h2>How It Works</h2>
<p>Provide a short explanation describing functional mechanism.</p>
<h2>How to Use</h2>
<ol>
<li>Usage step 1.</li>
<li>Usage step 2.</li>
</ol>
<h2>Key Ingredient Roles</h2>
<p>Describe ingredient group roles concisely.</p>
<h2>Safety & Storage</h2>
<p>Provide brief safety & storage guidance.</p>
<h2>Common Questions</h2>
<p><strong>Q:</strong> Question?<br><strong>A:</strong> Answer.</p>

=====================================================================
FINAL CTA & OUTPUT RULES (MANDATORY)
=====================================================================

After completing ALL sections above, ALWAYS append:

<h2>Call to Action</h2>
<p>Download the complete formulation file for full ingredient percentages, detailed processing steps, QC parameters, and manufacturing specifications.</p>

<h2>Internal Link</h2>
<p>For more formulations in the ${categoryName} category, visit https://aiformulator.com/collection/${categorySlug}</p>

=====================================================================
FINAL OUTPUT RULES (CRITICAL - ENFORCE STRICTLY)
=====================================================================

COMBINE IN EXACT ORDER:
1. <h1>[Product Name]</h1>  
2. Keyword Strategy block  
3. CTA Strategy block  
4. Page Strategy block  
5. ONE Template (T1–T10) selected from category mapping
6. ONE AI Overview Structure (S1–S6) selected from category mapping
7. Final CTA block  
8. Internal Link block

OUTPUT REQUIREMENTS:
• EVERYTHING as ONE SINGLE HTML BLOCK
• Never reveal internal logic, mapping, template numbers, or structure numbers
• Never explain choices; only deliver final HTML content
• Do NOT output placeholders - fill ALL with real, specific content about ${productName}
• NO text outside HTML tags
• NO Markdown symbols
• NO explanations or metadata
• Temperature at 0 - follow instructions EXACTLY

=====================================================================
AI OVERVIEW STRUCTURE SELECTION (ONE OF S1-S6)
=====================================================================

Based on category "${categoryName}", SELECT ONE of these structures:

Determine category group from name:
- GROUP A (baby, infant, kids, child) → Pick S1 or S3
- GROUP B (skin, hair, beauty, grooming, shampoo, lotion) → Pick S1, S3, or S5
- GROUP C (cleaning, detergent, laundry) → Pick S2 or S5
- GROUP D (car, auto, polish, shoe, leather) → Pick S2 or S4
- GROUP E (adhesive, sealant, epoxy, grout, construction) → Pick S2, S4, or S6
- GROUP F (industrial, 3d printing, resin, coating) → Pick S4 or S6
- GROUP G (agriculture, agro, water treatment, pest) → Pick S2 or S6
- GROUP H (pet, veterinary, dog, cat) → Pick S1 or S5
- GROUP I (herbal, organic, essential oil, aromatherapy) → Pick S1, S3, or S5
- GROUP J (default) → Pick any S1-S6

Now INSERT ONE of these structures (pick the most appropriate based on category):

S1 STRUCTURE:
<h2>What It Is</h2>
<p>Explain clearly what this product is, its functional role, and context of use.</p>
<h2>Why It Matters</h2>
<p>Describe the need or problem this formulation addresses.</p>
<h2>How It Works</h2>
<p>Explain the scientific or functional mechanism in simple language.</p>
<h2>Risks or Limitations</h2>
<p>Discuss realistic limitations, precautions, and performance variation scenarios.</p>
<h2>Tips for Best Results</h2>
<ul>
<li>Practical tip 1.</li>
<li>Practical tip 2.</li>
<li>Practical tip 3.</li>
</ul>
<h2>Key Questions</h2>
<p><strong>Q:</strong> Common question 1?<br><strong>A:</strong> Short answer.</p>
<p><strong>Q:</strong> Common question 2?<br><strong>A:</strong> Short answer.</p>

S2 STRUCTURE:
<h2>The Real-World Problem</h2>
<p>Describe the actual issue users face that this formulation solves.</p>
<h2>Why This Problem Occurs</h2>
<p>Explain the technical or scientific reason behind the problem.</p>
<h2>The Formulation Solution</h2>
<p>Describe how this formulation solves the problem and its benefits.</p>
<h2>The Science Behind the Formula</h2>
<p>Explain the scientific reasoning behind the formulation's performance.</p>
<h2>How to Use It</h2>
<ol>
<li>Usage step 1.</li>
<li>Usage step 2.</li>
<li>Usage step 3.</li>
</ol>
<h2>Safety Considerations</h2>
<p>Explain precautions, safe handling, and basic protection guidelines.</p>

S3 STRUCTURE:
<h2>Summary</h2>
<p>Provide high-level summary of purpose, application, and key performance ideas.</p>
<h2>Main Benefits</h2>
<ul>
<li>Benefit 1.</li>
<li>Benefit 2.</li>
<li>Benefit 3.</li>
</ul>
<h2>Key Components</h2>
<p>Explain functional ingredient groups and their roles.</p>
<h2>Mechanism of Action</h2>
<p>Describe how the formulation delivers results through chemistry or physical interaction.</p>
<h2>Recommended Usage Routine</h2>
<ol>
<li>Routine step 1.</li>
<li>Routine step 2.</li>
</ol>
<h2>Warnings</h2>
<p>Provide category-appropriate cautions and operational notes.</p>

S4 STRUCTURE:
<h2>Definition</h2>
<p>Define the product precisely, including its functional identity and application category.</p>
<h2>Material / Ingredient Logic</h2>
<p>Describe the major ingredient groups and why they are included.</p>
<h2>Process Overview</h2>
<ol>
<li>Process step 1.</li>
<li>Process step 2.</li>
<li>Process step 3.</li>
</ol>
<h2>Expected Performance</h2>
<p>Explain how the product behaves in typical environments or conditions.</p>
<h2>QC Considerations</h2>
<ul>
<li>QC parameter 1.</li>
<li>QC parameter 2.</li>
</ul>
<h2>Troubleshooting Guide</h2>
<ul>
<li><strong>Issue:</strong> Example problem.<br><strong>Fix:</strong> Matching correction.</li>
</ul>

S5 STRUCTURE:
<h2>Overview</h2>
<p>Provide a simple description of the product and its main purpose.</p>
<h2>Use Cases</h2>
<ul>
<li>Use case 1.</li>
<li>Use case 2.</li>
<li>Use case 3.</li>
</ul>
<h2>Instructions</h2>
<ol>
<li>Instruction step 1.</li>
<li>Instruction step 2.</li>
<li>Instruction step 3.</li>
</ol>
<h2>Compatibility</h2>
<p>List relevant surfaces, materials, or environments where the product is compatible.</p>
<h2>Storage</h2>
<p>Explain suitable storage conditions for maintaining quality.</p>
<h2>FAQs</h2>
<p><strong>Q:</strong> Question 1?<br><strong>A:</strong> Answer.</p>
<p><strong>Q:</strong> Question 2?<br><strong>A:</strong> Answer.</p>

S6 STRUCTURE:
<h2>Key Insight</h2>
<p>Provide high-level insight into what makes this formulation useful or technically important.</p>
<h2>Breakdown of Components</h2>
<p>Explain conceptual ingredient blocks and what each contributes.</p>
<h2>Steps to Use or Manufacture</h2>
<ol>
<li>Step 1.</li>
<li>Step 2.</li>
<li>Step 3.</li>
</ol>
<h2>Critical Metrics</h2>
<ul>
<li>Metric 1.</li>
<li>Metric 2.</li>
</ul>
<h2>Expected Outcomes</h2>
<p>Describe the performance or result a user should expect.</p>
<h2>Next Steps</h2>
<p>Suggest follow-up actions or complementary processes.</p>

=====================================================================

<h2>Call to Action</h2>
<p>Download the complete formulation file for full ingredient percentages, detailed process steps, QC parameters, and manufacturing specifications.</p>

<h2>Internal Link</h2>
<p>For more formulations in the ${categoryName} category, visit https://aiformulator.com/collection/${categorySlug}</p>

FINAL MANDATORY RULES:
• Output ONLY HTML. Nothing else.
• Every element MUST be inside HTML tags.
• NO plain text outside tags.
• NO Markdown. NO ** or # symbols.
• The ENTIRE output is ONE continuous HTML block.
• NO explanations, NO metadata, NO JSON.
• Temperature is 0 - follow these instructions EXACTLY.`;

      const userPrompt = `Generate a complete HTML formulation page for: ${productName}
Category: ${categoryName}

Output ONLY the HTML block. Nothing else. No text outside tags.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0,
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";

      res.json({ content });
    } catch (error) {
      console.error("Failed to generate full page:", error);
      res.status(500).json({ message: "Failed to generate page content", error: String(error) });
    }
  });

  // Save Formulation Page Content (Admin only)
  app.post("/api/formulation-page-content", requireAdmin, async (req: any, res) => {
    try {
      const { formulationId, content } = req.body;
      if (!formulationId || !content) {
        return res.status(400).json({ message: "Formulation ID and content are required" });
      }

      // Save formulation page content with slug generated from formulationId
      const slug = `formulation-${formulationId.substring(0, 8)}`;
      
      // Check if page already exists
      const existingPage = await storage.getPageBySlug(slug);
      
      let page;
      if (existingPage) {
        // Update existing page
        page = await storage.updatePage(existingPage.id, {
          content,
          metaDescription: "Custom formulation page content",
          isActive: true
        });
      } else {
        // Create new page
        page = await storage.createPage({
          slug,
          title: "Formulation Page Content",
          content,
          metaDescription: "Custom formulation page content",
          isActive: true
        });
      }

      res.json({ message: "Page content saved successfully", page });
    } catch (error) {
      console.error("Failed to save page content:", error);
      res.status(500).json({ message: "Failed to save page content", error: String(error) });
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
