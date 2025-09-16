import { type Category, type InsertCategory, type Formulation, type InsertFormulation, type ProductProperties, type UserNote, type InsertUserNote, type User, type UpsertUser, type Page, type InsertPage, type BlogPost, type InsertBlogPost, type ChatMessage, type InsertChatMessage, type UserFormulationRequest, type InsertUserFormulationRequest } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IAiGeneration {
  id: string;
  productName: string;
  category: string;
  sessionId: string;
  timestamp: string;
  responseTime?: number;
  formData: any;
  country?: string;
  city?: string;
}

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Formulations
  getFormulations(): Promise<Formulation[]>;
  getFormulationsByCategory(categoryId: string): Promise<Formulation[]>;
  getFormulation(id: string): Promise<Formulation | undefined>;
  getFormulationBySlug(slug: string): Promise<Formulation | undefined>;
  createFormulation(formulation: InsertFormulation): Promise<Formulation>;
  updateFormulation(id: string, formulation: Partial<InsertFormulation>): Promise<Formulation | undefined>;
  deleteFormulation(id: string): Promise<boolean>;
  
  // Admin formulation methods
  getAllFormulations(): Promise<Formulation[]>; // Includes inactive formulations for admin
  updateFormulationStatus(id: string, isActive: boolean): Promise<Formulation | undefined>;

  // AI Generations
  getAiGenerations(): Promise<IAiGeneration[]>;
  trackAiGeneration(generation: Omit<IAiGeneration, 'id'>): Promise<IAiGeneration>;
  clearAiGenerations(): Promise<boolean>;

  // Product Properties
  getProductProperties(productType: string): Promise<string[] | undefined>;
  
  // User Notes
  saveUserNote(userNote: InsertUserNote): Promise<UserNote>;
  getRecommendations(productType: string): Promise<string[]>;

  // User Authentication (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Pages Content Management
  getPages(): Promise<Page[]>;
  getPageBySlug(slug: string): Promise<Page | undefined>;
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: string, page: Partial<InsertPage>): Promise<Page | undefined>;
  deletePage(id: string): Promise<boolean>;

  // Blog Posts Management
  getBlogPosts(): Promise<BlogPost[]>;
  getPublishedBlogPosts(): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, blogPost: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;

  // Chat methods
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // User Formulation Requests
  getUserFormulationRequests(): Promise<UserFormulationRequest[]>;
  getUserFormulationRequest(id: string): Promise<UserFormulationRequest | undefined>;
  createUserFormulationRequest(request: InsertUserFormulationRequest): Promise<UserFormulationRequest>;
  updateUserFormulationRequestStatus(id: string, status: string, adminNotes?: string, reviewedBy?: string): Promise<UserFormulationRequest | undefined>;
  deleteUserFormulationRequest(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category>;
  private formulations: Map<string, Formulation>;
  private aiGenerations: Map<string, IAiGeneration>;
  private productProperties: Map<string, string[]>;
  private userNotes: Map<string, UserNote>;
  private users: Map<string, User>;
  private pages: Map<string, Page>;
  private blogPosts: Map<string, BlogPost>;
  private chatMessages: Map<string, ChatMessage[]>;
  private userFormulationRequests: Map<string, UserFormulationRequest>;

  constructor() {
    this.categories = new Map();
    this.formulations = new Map();
    this.aiGenerations = new Map();
    this.productProperties = new Map();
    this.userNotes = new Map();
    this.users = new Map();
    this.pages = new Map();
    this.blogPosts = new Map();
    this.chatMessages = new Map();
    this.userFormulationRequests = new Map();
    // Only seed data if no data exists (first run)
    this.seedInitialData();
    this.seedPages();
    this.seedBlogPosts();
  }

  private seedInitialData() {
    // Skip seeding if categories already exist
    if (this.categories.size > 0) {
      return;
    }
    this.seedData();
    this.seedProductProperties();
  }

  private seedProductProperties() {
    // Seed product properties for dynamic special properties
    this.productProperties.set('skincare', [
      "Anti-aging", "Moisturizing", "Whitening", "Anti-acne", "Antioxidant", 
      "UV Protection", "Exfoliating", "Firming", "Soothing", "Regenerating"
    ]);
    this.productProperties.set('hair_care', [
      "Anti-dandruff", "Moisturizing", "Strengthening", "Volume-enhancing", "Color-protecting", 
      "Heat protection", "Curl-defining", "Smoothing", "Growth-stimulating", "Oil-controlling"
    ]);
    this.productProperties.set('oral_care', [
      "Whitening", "Anti-bacterial", "Fluoride-free", "Sensitivity relief", "Fresh breath", 
      "Plaque control", "Enamel strengthening", "Natural ingredients", "Foam-enhancing", "Cavity prevention"
    ]);
    this.productProperties.set('body_care', [
      "Moisturizing", "Firming", "Cellulite reduction", "Sun protection", "Soothing", 
      "Exfoliating", "Anti-aging", "Stretch mark prevention", "Antibacterial", "Aromatherapy"
    ]);
    this.productProperties.set('cosmetics', [
      "Long-lasting", "Water-resistant", "Matte finish", "Hydrating", "SPF protection", 
      "Non-comedogenic", "Buildable coverage", "Anti-aging", "Color-correcting", "Natural finish"
    ]);
    this.productProperties.set('cleaning', [
      "Antibacterial", "Eco-friendly", "Concentrated formula", "Multi-surface", "Streak-free", 
      "Quick-drying", "Pleasant scent", "Non-toxic", "Grease-cutting", "Stain removal"
    ]);
    this.productProperties.set('detergent', [
      "Stain removal", "Color protection", "Fabric softening", "Concentrated", "Eco-friendly", 
      "Hypoallergenic", "Fresh scent", "Cold-water effective", "Enzyme-based", "Brightening"
    ]);
    this.productProperties.set('disinfectant', [
      "Broad spectrum", "Quick-acting", "Non-corrosive", "Residue-free", "Pleasant odor", 
      "Skin-safe", "Food-safe", "Hospital-grade", "Alcohol-free", "Long-lasting protection"
    ]);
    this.productProperties.set('specialty', [
      "Custom viscosity", "Temperature stable", "pH buffered", "Extended shelf life", "Preservative-free", 
      "Organic certified", "Vegan-friendly", "Cruelty-free", "Biodegradable", "Concentrated formula"
    ]);
    this.productProperties.set('other', [
      "Multi-purpose", "Cost-effective", "Easy application", "Quick-acting", "Environmentally friendly", 
      "Safe for sensitive skin", "Professional grade", "Ready-to-use", "Stable formulation", "Quality assured"
    ]);
  }

  private seedData() {
    // Seed categories
    const categoryData = [
      {
        name: "Skin Care",
        description: "Facial and body care products",
        icon: "fas fa-spa",
        image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      },
      {
        name: "Beauty Products",
        description: "Cosmetics and makeup items",
        icon: "fas fa-palette",
        image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      },
      {
        name: "Oral Care",
        description: "Dental hygiene products",
        icon: "fas fa-tooth",
        image: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      },
      {
        name: "Baby Care",
        description: "Gentle formulations for babies",
        icon: "fas fa-baby",
        image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      },
      {
        name: "Men Care",
        description: "Grooming formulations for men",
        icon: "fas fa-male",
        image: "https://images.unsplash.com/photo-1503602642458-232111445657?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      },
      {
        name: "Organic Care",
        description: "Natural and organic formulations",
        icon: "fas fa-leaf",
        image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      },
      {
        name: "Shoe Care",
        description: "Shoe maintenance formulations",
        icon: "fas fa-shoe-prints",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      },
      {
        name: "Detergent",
        description: "Laundry and fabric care formulations",
        icon: "fas fa-tshirt",
        image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      },
      {
        name: "Cleaning Products",
        description: "Household cleaning formulations",
        icon: "fas fa-spray-can",
        image: "https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      },
      {
        name: "Leather Products",
        description: "Leather care and maintenance formulations",
        icon: "fas fa-couch",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      },
      {
        name: "Professional Formulas",
        description: "Advanced professional-grade formulas for commercial use",
        icon: "fas fa-flask",
        image: "https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      },
      {
        name: "Skin Formulations",
        description: "Specialized skin care formulations for various skin concerns",
        icon: "fas fa-user-md",
        image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      },
      {
        name: "Hair Care Formulations",
        description: "Professional hair treatment and styling formulations",
        icon: "fas fa-cut",
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      }
    ];

    categoryData.forEach(cat => {
      const category: Category = {
        id: randomUUID(),
        ...cat,
        isActive: true,
        createdAt: new Date(),
      };
      this.categories.set(category.id, category);
    });

    // Seed formulations for each category
    const categories = Array.from(this.categories.values());
    categories.forEach(category => {
      this.seedFormulationsForCategory(category);
    });
  }

  private seedFormulationsForCategory(category: Category) {
    const baseFormulations = this.getFormulationData(category.name);
    
    baseFormulations.forEach(formData => {
      const formulation: Formulation = {
        id: randomUUID(),
        categoryId: category.id,
        ...formData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.formulations.set(formulation.id, formulation);
    });
  }

  private getFormulationData(categoryName: string) {
    const formulationsByCategory: Record<string, any[]> = {
      "Skin Care": [
        {
          name: "Anti-Aging Face Cream",
          description: "Advanced formulation with retinol and hyaluronic acid for reducing fine lines and wrinkles.",
          phLevel: "5.5 - 6.0",
          shelfLife: "24 months",
          viscosity: "2500-3000 cP",
          storageConditions: "Cool, dry place",
          batchSize: "100-500 kg",
          processingTime: "2-3 hours",
          temperature: "60-70°C",
          equipment: "High-shear mixer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Distilled Water", inci: "Aqua", percentage: "65.0%", function: "Solvent" },
            { name: "Glycerin", inci: "Glycerin", percentage: "8.0%", function: "Humectant" },
            { name: "Cetyl Alcohol", inci: "Cetyl Alcohol", percentage: "4.0%", function: "Emulsifier" },
            { name: "Shea Butter", inci: "Butyrospermum Parkii Butter", percentage: "5.0%", function: "Emollient" },
            { name: "Retinol", inci: "Retinol", percentage: "0.5%", function: "Active Ingredient" },
            { name: "Hyaluronic Acid", inci: "Sodium Hyaluronate", percentage: "1.0%", function: "Humectant" },
            { name: "Vitamin E", inci: "Tocopheryl Acetate", percentage: "0.5%", function: "Antioxidant" },
            { name: "Preservative System", inci: "Phenoxyethanol, Ethylhexylglycerin", percentage: "1.0%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Phase A (Water Phase)",
              steps: ["Heat distilled water to 70°C", "Add glycerin and mix until dissolved", "Add hyaluronic acid slowly while mixing"]
            },
            {
              phase: "Phase B (Oil Phase)",
              steps: ["Melt shea butter and cetyl alcohol at 70°C", "Mix until homogeneous", "Maintain temperature"]
            },
            {
              phase: "Emulsification",
              steps: ["Slowly add Phase A to Phase B while mixing", "Use high-shear mixer for 10 minutes", "Cool to 40°C while continuing to mix", "Add retinol, vitamin E, and preservatives", "Mix for additional 5 minutes", "Cool to room temperature"]
            }
          ]),
          usageInstructions: "Apply a small amount to clean, dry skin in the evening. Use 2-3 times per week initially, gradually increase as tolerated. Use sunscreen during the day when using this product. Store in a cool, dry place away from direct sunlight. Patch test recommended before first use."
        },
        {
          name: "Gentle Cleansing Foam",
          description: "Mild surfactant-based formula suitable for all skin types including sensitive skin.",
          phLevel: "6.0 - 6.5",
          shelfLife: "18 months",
          viscosity: "1000-1500 cP",
          storageConditions: "Room temperature",
          batchSize: "200-1000 kg",
          processingTime: "1-2 hours",
          temperature: "40-50°C",
          equipment: "Standard mixer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Distilled Water", inci: "Aqua", percentage: "70.0%", function: "Solvent" },
            { name: "Cocamidopropyl Betaine", inci: "Cocamidopropyl Betaine", percentage: "12.0%", function: "Mild Surfactant" },
            { name: "Sodium Lauroyl Sarcosinate", inci: "Sodium Lauroyl Sarcosinate", percentage: "8.0%", function: "Cleansing Agent" },
            { name: "Glycerin", inci: "Glycerin", percentage: "5.0%", function: "Humectant" },
            { name: "Panthenol", inci: "Panthenol", percentage: "1.0%", function: "Conditioning Agent" },
            { name: "Allantoin", inci: "Allantoin", percentage: "0.5%", function: "Soothing Agent" },
            { name: "Preservative System", inci: "Phenoxyethanol, Caprylyl Glycol", percentage: "1.0%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Water Phase",
              steps: ["Heat water to 45°C", "Add glycerin and mix", "Add panthenol and allantoin"]
            },
            {
              phase: "Surfactant Addition",
              steps: ["Slowly add cocamidopropyl betaine while mixing", "Add sodium lauroyl sarcosinate", "Mix gently to avoid excessive foaming"]
            },
            {
              phase: "Final Steps",
              steps: ["Cool to 35°C", "Add preservatives", "Adjust pH if necessary", "Mix until homogeneous"]
            }
          ]),
          usageInstructions: "Apply to wet skin, gently massage to create foam, rinse thoroughly with water. Use morning and evening. Suitable for daily use. Avoid contact with eyes."
        },
        {
          name: "Vitamin C Brightening Serum",
          description: "High-potency vitamin C formulation with stabilizers for skin brightening and protection.",
          phLevel: "3.5 - 4.0",
          shelfLife: "12 months",
          viscosity: "500-800 cP",
          storageConditions: "Refrigerated storage",
          batchSize: "50-200 kg",
          processingTime: "1 hour",
          temperature: "Room temperature",
          equipment: "Magnetic stirrer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Distilled Water", inci: "Aqua", percentage: "75.0%", function: "Solvent" },
            { name: "L-Ascorbic Acid", inci: "Ascorbic Acid", percentage: "15.0%", function: "Active Ingredient" },
            { name: "Sodium Hyaluronate", inci: "Sodium Hyaluronate", percentage: "2.0%", function: "Humectant" },
            { name: "Ferulic Acid", inci: "Ferulic Acid", percentage: "0.5%", function: "Stabilizer" },
            { name: "Vitamin E", inci: "Tocopherol", percentage: "1.0%", function: "Antioxidant" },
            { name: "Sodium Bisulfite", inci: "Sodium Bisulfite", percentage: "0.1%", function: "Antioxidant" },
            { name: "Preservative System", inci: "Sodium Benzoate, Potassium Sorbate", percentage: "0.5%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Preparation",
              steps: ["Use distilled water at room temperature", "Ensure all equipment is sterilized", "Work in low-light conditions"]
            },
            {
              phase: "Active Phase",
              steps: ["Dissolve L-ascorbic acid in water", "Add sodium hyaluronate slowly", "Add ferulic acid and mix"]
            },
            {
              phase: "Stabilization",
              steps: ["Add vitamin E and sodium bisulfite", "Add preservatives", "Adjust pH to 3.5-4.0", "Filter if necessary"]
            }
          ]),
          usageInstructions: "Apply 2-3 drops to clean skin in the morning. Follow with moisturizer and sunscreen. Store in refrigerator. Use within 3 months of opening. May cause initial tingling sensation."
        },
        {
          name: "Hydrating Toner",
          description: "Alcohol-free toner with humectants and botanical extracts for optimal skin hydration.",
          phLevel: "5.0 - 5.5",
          shelfLife: "24 months",
          viscosity: "100-300 cP",
          storageConditions: "Cool, dry place",
          batchSize: "300-1000 kg",
          processingTime: "30 minutes",
          temperature: "Room temperature",
          equipment: "Standard mixer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Distilled Water", inci: "Aqua", percentage: "85.0%", function: "Solvent" },
            { name: "Glycerin", inci: "Glycerin", percentage: "5.0%", function: "Humectant" },
            { name: "Sodium Hyaluronate", inci: "Sodium Hyaluronate", percentage: "1.0%", function: "Humectant" },
            { name: "Rose Water", inci: "Rosa Damascena Flower Water", percentage: "5.0%", function: "Toning Agent" },
            { name: "Niacinamide", inci: "Niacinamide", percentage: "2.0%", function: "Active Ingredient" },
            { name: "Preservative System", inci: "Phenoxyethanol, Ethylhexylglycerin", percentage: "1.0%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Base Preparation",
              steps: ["Combine distilled water and rose water", "Add glycerin and mix", "Add niacinamide and dissolve completely"]
            },
            {
              phase: "Hydrating Agents",
              steps: ["Add sodium hyaluronate slowly while stirring", "Mix until completely dissolved", "Check clarity"]
            },
            {
              phase: "Final Steps",
              steps: ["Add preservatives", "Adjust pH if necessary", "Filter through 0.22μm filter", "Fill into sterile containers"]
            }
          ]),
          usageInstructions: "Apply to cotton pad or spray directly onto clean skin. Use morning and evening after cleansing. Follow with serum and moisturizer. Suitable for all skin types."
        },
        {
          name: "Gentle Exfoliating Scrub",
          description: "Physical exfoliant with natural microbeads and moisturizing agents for smooth skin texture.",
          phLevel: "6.5 - 7.0",
          shelfLife: "18 months",
          viscosity: "3000-5000 cP",
          storageConditions: "Cool, dry place",
          batchSize: "100-300 kg",
          processingTime: "2 hours",
          temperature: "50-60°C",
          equipment: "High-shear mixer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Distilled Water", inci: "Aqua", percentage: "55.0%", function: "Solvent" },
            { name: "Jojoba Beads", inci: "Jojoba Esters", percentage: "15.0%", function: "Exfoliating Agent" },
            { name: "Glycerin", inci: "Glycerin", percentage: "10.0%", function: "Humectant" },
            { name: "Cetyl Alcohol", inci: "Cetyl Alcohol", percentage: "5.0%", function: "Emulsifier" },
            { name: "Sweet Almond Oil", inci: "Prunus Amygdalus Dulcis Oil", percentage: "8.0%", function: "Emollient" },
            { name: "Vitamin E", inci: "Tocopheryl Acetate", percentage: "1.0%", function: "Antioxidant" },
            { name: "Preservative System", inci: "Phenoxyethanol, Caprylyl Glycol", percentage: "1.0%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Oil Phase",
              steps: ["Melt cetyl alcohol at 60°C", "Add sweet almond oil", "Add vitamin E and mix"]
            },
            {
              phase: "Water Phase",
              steps: ["Heat water to 60°C", "Add glycerin and mix", "Maintain temperature"]
            },
            {
              phase: "Emulsification",
              steps: ["Add water phase to oil phase slowly", "Mix with high-shear mixer", "Cool to 40°C", "Add jojoba beads slowly", "Add preservatives", "Mix gently to distribute beads evenly"]
            }
          ]),
          usageInstructions: "Apply to damp skin in circular motions. Massage gently for 1-2 minutes. Rinse thoroughly with warm water. Use 2-3 times per week. Avoid eye area. Follow with moisturizer."
        }
      ],
      "Professional Formulas": [
        {
          name: "Advanced Anti-Aging Formula",
          description: "Professional grade anti-aging formulation with peptides and botanical extracts for advanced skincare.",
          phLevel: "5.5 - 6.0",
          shelfLife: "24 months",
          viscosity: "2500-3000 cP",
          storageConditions: "Cool, dry place",
          batchSize: "100-500 kg",
          processingTime: "2-3 hours",
          temperature: "60-70°C",
          equipment: "High-shear mixer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Distilled Water", inci: "Aqua", percentage: "60.0%", function: "Solvent" },
            { name: "Glycerin", inci: "Glycerin", percentage: "8.0%", function: "Humectant" },
            { name: "Peptide Complex", inci: "Palmitoyl Tripeptide-1", percentage: "3.0%", function: "Anti-Aging Active" },
            { name: "Hyaluronic Acid", inci: "Sodium Hyaluronate", percentage: "2.0%", function: "Hydrating Agent" },
            { name: "Botanical Extract Blend", inci: "Plant Extract Complex", percentage: "5.0%", function: "Antioxidant" },
            { name: "Preservative System", inci: "Phenoxyethanol, Ethylhexylglycerin", percentage: "1.0%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            { phase: "Water Phase", steps: ["Heat water to 70°C", "Dissolve glycerin", "Add hyaluronic acid"] },
            { phase: "Active Phase", steps: ["Add peptide complex at 40°C", "Add botanical extracts", "Mix thoroughly"] },
            { phase: "Final Phase", steps: ["Cool to room temperature", "Add preservatives", "Homogenize"] }
          ]),
          usageInstructions: "Apply to clean skin twice daily. Professional formulation for advanced skincare routines."
        },
        {
          name: "Hydrating Facial Formulation",
          description: "Professional hydrating formulation with multiple moisturizing agents for all skin types.",
          phLevel: "6.0 - 6.5",
          shelfLife: "18 months",
          viscosity: "1500-2000 cP",
          storageConditions: "Room temperature",
          batchSize: "200-800 kg",
          processingTime: "1-2 hours",
          temperature: "50-60°C",
          equipment: "Standard mixer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Distilled Water", inci: "Aqua", percentage: "70.0%", function: "Solvent" },
            { name: "Glycerin", inci: "Glycerin", percentage: "10.0%", function: "Humectant" },
            { name: "Sodium Hyaluronate", inci: "Sodium Hyaluronate", percentage: "2.0%", function: "Hydrating Agent" },
            { name: "Aloe Vera Extract", inci: "Aloe Barbadensis Leaf Extract", percentage: "8.0%", function: "Soothing Agent" },
            { name: "Vitamin B5", inci: "Panthenol", percentage: "2.0%", function: "Conditioning Agent" },
            { name: "Preservative System", inci: "Phenoxyethanol, Caprylyl Glycol", percentage: "1.0%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            { phase: "Base Phase", steps: ["Heat water to 55°C", "Add glycerin and mix", "Add aloe vera extract"] },
            { phase: "Active Phase", steps: ["Add sodium hyaluronate slowly", "Add vitamin B5", "Mix until dissolved"] },
            { phase: "Final Phase", steps: ["Cool to 35°C", "Add preservatives", "Mix thoroughly"] }
          ]),
          usageInstructions: "Apply morning and evening to clean skin. Professional hydrating formulation suitable for daily use."
        },
        {
          name: "Brightening Serum Formula",
          description: "Professional brightening formula with vitamin C and alpha arbutin for even skin tone.",
          phLevel: "4.0 - 4.5",
          shelfLife: "12 months",
          viscosity: "500-800 cP",
          storageConditions: "Cool, dark place",
          batchSize: "50-200 kg",
          processingTime: "1 hour",
          temperature: "Room temperature",
          equipment: "Magnetic stirrer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Distilled Water", inci: "Aqua", percentage: "75.0%", function: "Solvent" },
            { name: "Magnesium Ascorbyl Phosphate", inci: "Magnesium Ascorbyl Phosphate", percentage: "10.0%", function: "Brightening Active" },
            { name: "Alpha Arbutin", inci: "Alpha Arbutin", percentage: "2.0%", function: "Skin Lightening" },
            { name: "Niacinamide", inci: "Niacinamide", percentage: "5.0%", function: "Pore Refining" },
            { name: "Hyaluronic Acid", inci: "Sodium Hyaluronate", percentage: "1.0%", function: "Hydrating Agent" },
            { name: "Preservative System", inci: "Sodium Benzoate, Potassium Sorbate", percentage: "0.5%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            { phase: "Base Phase", steps: ["Use room temperature water", "Add magnesium ascorbyl phosphate", "Mix until dissolved"] },
            { phase: "Active Phase", steps: ["Add alpha arbutin", "Add niacinamide", "Add hyaluronic acid slowly"] },
            { phase: "Final Phase", steps: ["Add preservatives", "Adjust pH to 4.0-4.5", "Filter if needed"] }
          ]),
          usageInstructions: "Apply 2-3 drops to clean skin in morning. Follow with moisturizer and SPF. Professional brightening formula."
        }
      ],
      "Skin Formulations": [
        {
          name: "Acne Treatment Formulation",
          description: "Professional acne treatment formulation with salicylic acid and niacinamide for clear skin.",
          phLevel: "4.0 - 5.0",
          shelfLife: "18 months",
          viscosity: "800-1200 cP",
          storageConditions: "Cool, dry place",
          batchSize: "100-400 kg",
          processingTime: "1-2 hours",
          temperature: "40-50°C",
          equipment: "Standard mixer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Distilled Water", inci: "Aqua", percentage: "75.0%", function: "Solvent" },
            { name: "Salicylic Acid", inci: "Salicylic Acid", percentage: "2.0%", function: "Exfoliating Active" },
            { name: "Niacinamide", inci: "Niacinamide", percentage: "5.0%", function: "Sebum Control" },
            { name: "Zinc Oxide", inci: "Zinc Oxide", percentage: "3.0%", function: "Antimicrobial" },
            { name: "Tea Tree Oil", inci: "Melaleuca Alternifolia Leaf Oil", percentage: "1.0%", function: "Antibacterial" },
            { name: "Preservative System", inci: "Phenoxyethanol, Ethylhexylglycerin", percentage: "1.0%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            { phase: "Water Phase", steps: ["Heat water to 45°C", "Dissolve salicylic acid", "Add niacinamide"] },
            { phase: "Active Phase", steps: ["Add zinc oxide while mixing", "Add tea tree oil slowly", "Mix thoroughly"] },
            { phase: "Final Phase", steps: ["Cool to room temperature", "Add preservatives", "Adjust pH"] }
          ]),
          usageInstructions: "Apply to affected areas once daily. Professional acne formulation - patch test recommended."
        },
        {
          name: "Sensitive Skin Formula",
          description: "Gentle formulation designed for sensitive skin with calming botanical ingredients.",
          phLevel: "6.0 - 6.5",
          shelfLife: "24 months",
          viscosity: "1000-1500 cP",
          storageConditions: "Cool, dry place",
          batchSize: "200-600 kg",
          processingTime: "1 hour",
          temperature: "Room temperature",
          equipment: "Gentle mixer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Distilled Water", inci: "Aqua", percentage: "80.0%", function: "Solvent" },
            { name: "Glycerin", inci: "Glycerin", percentage: "8.0%", function: "Humectant" },
            { name: "Chamomile Extract", inci: "Matricaria Recutita Flower Extract", percentage: "5.0%", function: "Soothing Agent" },
            { name: "Calendula Extract", inci: "Calendula Officinalis Flower Extract", percentage: "3.0%", function: "Anti-inflammatory" },
            { name: "Allantoin", inci: "Allantoin", percentage: "1.0%", function: "Healing Agent" },
            { name: "Preservative System", inci: "Phenoxyethanol, Caprylyl Glycol", percentage: "0.8%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            { phase: "Base Phase", steps: ["Combine water and glycerin", "Add botanical extracts", "Mix gently"] },
            { phase: "Active Phase", steps: ["Add allantoin slowly", "Mix until dissolved", "Check clarity"] },
            { phase: "Final Phase", steps: ["Add preservatives", "Mix gently", "Filter if needed"] }
          ]),
          usageInstructions: "Apply to clean skin as needed. Gentle formula suitable for daily use on sensitive skin."
        }
      ],
      "Hair Care Formulations": [
        {
          name: "Strengthening Hair Formula",
          description: "Professional hair strengthening formulation with keratin proteins and botanical extracts.",
          phLevel: "5.5 - 6.0",
          shelfLife: "18 months",
          viscosity: "2000-3000 cP",
          storageConditions: "Room temperature",
          batchSize: "300-800 kg",
          processingTime: "2 hours",
          temperature: "60-70°C",
          equipment: "High-shear mixer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Distilled Water", inci: "Aqua", percentage: "65.0%", function: "Solvent" },
            { name: "Cetyl Alcohol", inci: "Cetyl Alcohol", percentage: "5.0%", function: "Conditioning Agent" },
            { name: "Hydrolyzed Keratin", inci: "Hydrolyzed Keratin", percentage: "8.0%", function: "Protein" },
            { name: "Argan Oil", inci: "Argania Spinosa Kernel Oil", percentage: "10.0%", function: "Nourishing Oil" },
            { name: "Panthenol", inci: "Panthenol", percentage: "3.0%", function: "Conditioning Agent" },
            { name: "Preservative System", inci: "Phenoxyethanol, Ethylhexylglycerin", percentage: "1.0%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            { phase: "Oil Phase", steps: ["Melt cetyl alcohol at 65°C", "Add argan oil", "Mix until homogeneous"] },
            { phase: "Water Phase", steps: ["Heat water to 65°C", "Add hydrolyzed keratin", "Add panthenol"] },
            { phase: "Emulsification", steps: ["Add water phase to oil phase", "Mix with high-shear mixer", "Cool while mixing", "Add preservatives at 40°C"] }
          ]),
          usageInstructions: "Apply to damp hair, leave for 5-10 minutes, rinse thoroughly. Professional strengthening formula for damaged hair."
        },
        {
          name: "Volume Boosting Formulation",
          description: "Lightweight formulation designed to add volume and body to fine hair without weighing it down.",
          phLevel: "6.0 - 6.5",
          shelfLife: "24 months",
          viscosity: "500-800 cP",
          storageConditions: "Room temperature",
          batchSize: "400-1000 kg",
          processingTime: "1 hour",
          temperature: "45-55°C",
          equipment: "Standard mixer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Distilled Water", inci: "Aqua", percentage: "85.0%", function: "Solvent" },
            { name: "Rice Protein", inci: "Hydrolyzed Rice Protein", percentage: "5.0%", function: "Volumizing Agent" },
            { name: "Panthenol", inci: "Panthenol", percentage: "3.0%", function: "Thickening Agent" },
            { name: "Glycerin", inci: "Glycerin", percentage: "4.0%", function: "Humectant" },
            { name: "Biotin", inci: "Biotin", percentage: "0.5%", function: "Hair Health" },
            { name: "Preservative System", inci: "Phenoxyethanol, Caprylyl Glycol", percentage: "1.0%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            { phase: "Base Phase", steps: ["Heat water to 50°C", "Add glycerin and mix", "Add rice protein slowly"] },
            { phase: "Active Phase", steps: ["Add panthenol", "Add biotin", "Mix until dissolved"] },
            { phase: "Final Phase", steps: ["Cool to 35°C", "Add preservatives", "Mix thoroughly"] }
          ]),
          usageInstructions: "Apply to clean, damp hair focusing on roots. Style as usual. Professional volume formulation for fine hair."
        }
      ],
      "Beauty Products": [
        {
          name: "Long-Lasting Foundation",
          description: "Full coverage liquid foundation with 12-hour wear and SPF protection.",
          phLevel: "6.0 - 7.0",
          shelfLife: "24 months",
          viscosity: "2000-3000 cP",
          storageConditions: "Room temperature",
          batchSize: "200-500 kg",
          processingTime: "3-4 hours",
          temperature: "70-80°C",
          equipment: "High-speed disperser",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Cyclopentasiloxane", inci: "Cyclopentasiloxane", percentage: "35.0%", function: "Carrier" },
            { name: "Dimethicone", inci: "Dimethicone", percentage: "15.0%", function: "Film Former" },
            { name: "Titanium Dioxide", inci: "Titanium Dioxide", percentage: "12.0%", function: "Pigment/SPF" },
            { name: "Iron Oxides", inci: "Iron Oxides", percentage: "8.0%", function: "Color Pigments" },
            { name: "Isododecane", inci: "Isododecane", percentage: "20.0%", function: "Solvent" },
            { name: "Disteardimonium Hectorite", inci: "Disteardimonium Hectorite", percentage: "2.0%", function: "Thickener" },
            { name: "Phenoxyethanol", inci: "Phenoxyethanol", percentage: "1.0%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Pigment Dispersion",
              steps: ["Pre-disperse titanium dioxide and iron oxides", "Use high-speed disperser", "Ensure particle size <500nm"]
            },
            {
              phase: "Oil Phase",
              steps: ["Combine silicones and isododecane", "Add hectorite and mix", "Heat to 75°C"]
            },
            {
              phase: "Final Mixing",
              steps: ["Add pigment dispersion slowly", "Mix at high speed", "Cool while mixing", "Add preservative at 40°C", "Homogenize final product"]
            }
          ]),
          usageInstructions: "Apply with foundation brush or beauty sponge. Blend outward from center of face. Build coverage as needed. Set with powder for extended wear."
        },
        {
          name: "Waterproof Mascara",
          description: "Smudge-proof mascara formula with lengthening and volumizing properties.",
          phLevel: "7.0 - 8.0",
          shelfLife: "18 months",
          viscosity: "8000-12000 cP",
          storageConditions: "Room temperature",
          batchSize: "50-200 kg",
          processingTime: "4-5 hours",
          temperature: "80-90°C",
          equipment: "Triple-roll mill",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Beeswax", inci: "Cera Alba", percentage: "25.0%", function: "Structure Agent" },
            { name: "Carnauba Wax", inci: "Copernicia Cerifera Wax", percentage: "15.0%", function: "Film Former" },
            { name: "Iron Oxide Black", inci: "Iron Oxide (CI 77499)", percentage: "12.0%", function: "Pigment" },
            { name: "Isododecane", inci: "Isododecane", percentage: "30.0%", function: "Solvent" },
            { name: "Trimethylsiloxysilicate", inci: "Trimethylsiloxysilicate", percentage: "10.0%", function: "Waterproofing Agent" },
            { name: "Nylon Fibers", inci: "Nylon-6", percentage: "5.0%", function: "Lengthening Agent" },
            { name: "Vitamin E", inci: "Tocopheryl Acetate", percentage: "1.0%", function: "Antioxidant" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Wax Phase",
              steps: ["Melt beeswax and carnauba wax", "Heat to 85°C", "Mix until homogeneous"]
            },
            {
              phase: "Pigment Dispersion",
              steps: ["Disperse iron oxide in portion of isododecane", "Use triple-roll mill for fine dispersion", "Check particle size"]
            },
            {
              phase: "Final Assembly",
              steps: ["Add pigment dispersion to wax phase", "Add remaining isododecane", "Add trimethylsiloxysilicate", "Add nylon fibers", "Cool while mixing", "Add vitamin E at 50°C"]
            }
          ]),
          usageInstructions: "Apply from base to tips of lashes. Use zigzag motion for volume. Allow to dry between coats. Remove with waterproof makeup remover."
        },
        {
          name: "Professional Makeup Base Formula",
          description: "Advanced makeup base formulation with primer and SPF protection for all-day wear.",
          phLevel: "6.0 - 7.0",
          shelfLife: "24 months",
          viscosity: "1800-2500 cP",
          storageConditions: "Room temperature",
          batchSize: "150-400 kg",
          processingTime: "2-3 hours",
          temperature: "65-75°C",
          equipment: "High-speed mixer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Cyclopentasiloxane", inci: "Cyclopentasiloxane", percentage: "30.0%", function: "Base Carrier" },
            { name: "Dimethicone", inci: "Dimethicone", percentage: "18.0%", function: "Smoothing Agent" },
            { name: "Zinc Oxide", inci: "Zinc Oxide", percentage: "10.0%", function: "SPF Protection" },
            { name: "Titanium Dioxide", inci: "Titanium Dioxide", percentage: "8.0%", function: "Coverage Pigment" },
            { name: "Hyaluronic Acid", inci: "Sodium Hyaluronate", percentage: "2.0%", function: "Hydrating Agent" },
            { name: "Vitamin E", inci: "Tocopheryl Acetate", percentage: "1.0%", function: "Antioxidant" }
          ]),
          instructions: JSON.stringify([
            { phase: "Silicone Phase", steps: ["Combine silicones at 70°C", "Mix until homogeneous", "Maintain temperature"] },
            { phase: "Pigment Phase", steps: ["Disperse zinc oxide and titanium dioxide", "Add to silicone phase slowly", "Mix thoroughly"] },
            { phase: "Final Phase", steps: ["Cool to 40°C", "Add hyaluronic acid", "Add vitamin E", "Final homogenization"] }
          ]),
          usageInstructions: "Apply before makeup as primer and base. Professional makeup formulation with SPF protection."
        },
        {
          name: "Matte Liquid Lipstick",
          description: "Long-wearing matte liquid lipstick with comfortable, non-drying formula.",
          phLevel: "6.5 - 7.5",
          shelfLife: "24 months",
          viscosity: "3000-5000 cP",
          storageConditions: "Cool, dry place",
          batchSize: "100-300 kg",
          processingTime: "2-3 hours",
          temperature: "60-70°C",
          equipment: "Homogenizer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Isododecane", inci: "Isododecane", percentage: "40.0%", function: "Solvent" },
            { name: "Dimethicone", inci: "Dimethicone", percentage: "20.0%", function: "Film Former" },
            { name: "Cyclopentasiloxane", inci: "Cyclopentasiloxane", percentage: "15.0%", function: "Carrier" },
            { name: "Kaolin", inci: "Kaolin", percentage: "8.0%", function: "Mattifying Agent" },
            { name: "Color Pigments", inci: "Various CI Colors", percentage: "10.0%", function: "Color" },
            { name: "Vitamin E", inci: "Tocopheryl Acetate", percentage: "1.0%", function: "Antioxidant" },
            { name: "Flavor Oil", inci: "Aroma", percentage: "0.5%", function: "Flavoring" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Pigment Preparation",
              steps: ["Pre-disperse color pigments in portion of isododecane", "Mill to achieve smooth consistency", "Check color match"]
            },
            {
              phase: "Base Formation",
              steps: ["Combine silicones", "Add kaolin gradually while mixing", "Ensure smooth texture"]
            },
            {
              phase: "Final Mixing",
              steps: ["Add pigment dispersion", "Add remaining isododecane", "Homogenize mixture", "Add vitamin E and flavor", "Final mixing at low speed"]
            }
          ]),
          usageInstructions: "Apply to clean, dry lips. Allow to dry completely for matte finish. Apply lip balm before use if lips are very dry. Remove with makeup remover."
        },
        {
          name: "Color-Correcting Formula",
          description: "Multi-tone color correcting formulation for even skin tone and complexion perfection.",
          phLevel: "6.5 - 7.0",
          shelfLife: "24 months",
          viscosity: "2200-2800 cP",
          storageConditions: "Cool, dry place",
          batchSize: "100-350 kg",
          processingTime: "3 hours",
          temperature: "70-75°C",
          equipment: "Planetary mixer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Isododecane", inci: "Isododecane", percentage: "35.0%", function: "Carrier Solvent" },
            { name: "Dimethicone", inci: "Dimethicone", percentage: "20.0%", function: "Smoothing Agent" },
            { name: "Green Color Corrector", inci: "Chromium Oxide Green", percentage: "4.0%", function: "Redness Correction" },
            { name: "Peach Color Corrector", inci: "Iron Oxides Mix", percentage: "6.0%", function: "Dark Circle Correction" },
            { name: "Purple Color Corrector", inci: "Ultramarines", percentage: "3.0%", function: "Yellow Tone Correction" },
            { name: "Hyaluronic Acid", inci: "Sodium Hyaluronate", percentage: "1.5%", function: "Hydration" },
            { name: "Vitamin C", inci: "Magnesium Ascorbyl Phosphate", percentage: "2.0%", function: "Brightening" }
          ]),
          instructions: JSON.stringify([
            { phase: "Base Phase", steps: ["Combine isododecane and dimethicone", "Heat to 72°C", "Mix until smooth"] },
            { phase: "Color Phase", steps: ["Prepare each color corrector separately", "Add to base in specific order", "Mix thoroughly between additions"] },
            { phase: "Active Phase", steps: ["Cool to 45°C", "Add hyaluronic acid", "Add vitamin C", "Final homogenization"] }
          ]),
          usageInstructions: "Apply targeted colors to specific areas: green for redness, peach for dark circles, purple for yellow tones. Professional color correction formulation."
        },
        {
          name: "Long-Wear Concealer Formulation",
          description: "High-coverage concealer formulation with 16-hour wear and skin-perfecting properties.",
          phLevel: "6.0 - 6.8",
          shelfLife: "24 months",
          viscosity: "3500-4500 cP",
          storageConditions: "Room temperature",
          batchSize: "80-250 kg",
          processingTime: "4 hours",
          temperature: "75-80°C",
          equipment: "High-shear homogenizer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Cyclopentasiloxane", inci: "Cyclopentasiloxane", percentage: "25.0%", function: "Volatile Carrier" },
            { name: "Dimethicone Crosspolymer", inci: "Dimethicone Crosspolymer", percentage: "15.0%", function: "Long-Wear Agent" },
            { name: "Titanium Dioxide", inci: "Titanium Dioxide", percentage: "15.0%", function: "Coverage Pigment" },
            { name: "Iron Oxide Blend", inci: "Iron Oxides", percentage: "12.0%", function: "Color Matching" },
            { name: "Trimethylsiloxysilicate", inci: "Trimethylsiloxysilicate", percentage: "8.0%", function: "Film Former" },
            { name: "Niacinamide", inci: "Niacinamide", percentage: "3.0%", function: "Skin Perfecting" },
            { name: "Caffeine", inci: "Caffeine", percentage: "1.0%", function: "De-puffing Agent" }
          ]),
          instructions: JSON.stringify([
            { phase: "Silicone Base", steps: ["Combine silicones at 78°C", "Add crosspolymer slowly", "Mix until smooth gel forms"] },
            { phase: "Pigment Dispersion", steps: ["Pre-disperse pigments separately", "Add to base gradually", "Use high-shear mixing"] },
            { phase: "Active Integration", steps: ["Cool to 50°C", "Add niacinamide", "Add caffeine", "Final homogenization"] }
          ]),
          usageInstructions: "Apply with brush or fingers, blend outward. Build coverage as needed. Professional long-wear concealer formulation."
        },
        {
          name: "Illuminating Highlighter",
          description: "Pressed powder highlighter with light-reflecting particles for natural glow.",
          phLevel: "7.0 - 8.0",
          shelfLife: "36 months",
          viscosity: "N/A (Powder)",
          storageConditions: "Dry environment",
          batchSize: "200-500 kg",
          processingTime: "6-8 hours",
          temperature: "Room temperature",
          equipment: "Ribbon blender",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Talc", inci: "Talc", percentage: "45.0%", function: "Base Powder" },
            { name: "Mica", inci: "Mica", percentage: "25.0%", function: "Shine/Shimmer" },
            { name: "Titanium Dioxide", inci: "Titanium Dioxide", percentage: "15.0%", function: "Opacity/Coverage" },
            { name: "Magnesium Stearate", inci: "Magnesium Stearate", percentage: "8.0%", function: "Binder" },
            { name: "Synthetic Fluorphlogopite", inci: "Synthetic Fluorphlogopite", percentage: "5.0%", function: "Light Reflection" },
            { name: "Dimethicone", inci: "Dimethicone", percentage: "1.5%", function: "Slip Agent" },
            { name: "Phenoxyethanol", inci: "Phenoxyethanol", percentage: "0.5%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Dry Blending",
              steps: ["Sift all powder ingredients", "Blend talc and mica in ribbon blender", "Add titanium dioxide gradually"]
            },
            {
              phase: "Binder Addition",
              steps: ["Add magnesium stearate", "Add synthetic fluorphlogopite", "Blend until uniform color"]
            },
            {
              phase: "Final Processing",
              steps: ["Add dimethicone dropwise while blending", "Add preservative", "Press into compacts", "Quality check for consistency"]
            }
          ]),
          usageInstructions: "Apply with fluffy brush to high points of face: cheekbones, nose bridge, cupid's bow. Build intensity as desired. Can be used on body for all-over glow."
        },
        {
          name: "Setting Spray",
          description: "Makeup setting spray with humidity resistance and skin-refreshing properties.",
          phLevel: "5.5 - 6.5",
          shelfLife: "24 months",
          viscosity: "5-15 cP",
          storageConditions: "Room temperature",
          batchSize: "500-1000 kg",
          processingTime: "1 hour",
          temperature: "Room temperature",
          equipment: "Standard mixer",
          certification: "ISO 22716",
          ingredients: JSON.stringify([
            { name: "Distilled Water", inci: "Aqua", percentage: "85.0%", function: "Solvent" },
            { name: "Alcohol Denat.", inci: "Alcohol Denat.", percentage: "8.0%", function: "Quick Dry Agent" },
            { name: "PVP", inci: "PVP", percentage: "2.0%", function: "Film Former" },
            { name: "Glycerin", inci: "Glycerin", percentage: "2.0%", function: "Humectant" },
            { name: "Aloe Vera Extract", inci: "Aloe Barbadensis Leaf Extract", percentage: "2.0%", function: "Soothing Agent" },
            { name: "Fragrance", inci: "Parfum", percentage: "0.5%", function: "Fragrance" },
            { name: "Preservative", inci: "Phenoxyethanol", percentage: "0.5%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Base Preparation",
              steps: ["Combine distilled water and alcohol", "Add glycerin and mix", "Ensure complete dissolution"]
            },
            {
              phase: "Active Addition",
              steps: ["Add PVP slowly while stirring", "Add aloe vera extract", "Mix until clear solution"]
            },
            {
              phase: "Final Steps",
              steps: ["Add fragrance", "Add preservative", "Mix thoroughly", "Filter if necessary", "Fill into spray bottles"]
            }
          ]),
          usageInstructions: "Hold 6-8 inches from face. Spray in X and T pattern. Allow to dry naturally. Use after makeup application. Can be reapplied throughout day for refreshing effect."
        }
      ],
      "Oral Care": [
        {
          name: "Whitening Toothpaste",
          description: "Gentle whitening toothpaste with fluoride protection and stain removal.",
          phLevel: "7.0 - 8.0",
          shelfLife: "36 months",
          viscosity: "50000-80000 cP",
          storageConditions: "Room temperature",
          batchSize: "1000-2000 kg",
          processingTime: "4-6 hours",
          temperature: "Room temperature",
          equipment: "Sigma blade mixer",
          certification: "FDA approved",
          ingredients: JSON.stringify([
            { name: "Hydrated Silica", inci: "Hydrated Silica", percentage: "25.0%", function: "Abrasive" },
            { name: "Sorbitol", inci: "Sorbitol", percentage: "30.0%", function: "Humectant" },
            { name: "Water", inci: "Aqua", percentage: "25.0%", function: "Solvent" },
            { name: "Sodium Fluoride", inci: "Sodium Fluoride", percentage: "0.24%", function: "Active Ingredient" },
            { name: "Sodium Lauryl Sulfate", inci: "Sodium Lauryl Sulfate", percentage: "1.5%", function: "Foaming Agent" },
            { name: "Carrageenan", inci: "Carrageenan", percentage: "1.0%", function: "Thickener" },
            { name: "Flavor", inci: "Aroma", percentage: "1.0%", function: "Flavoring" },
            { name: "Sodium Saccharin", inci: "Sodium Saccharin", percentage: "0.2%", function: "Sweetener" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Base Preparation",
              steps: ["Mix water and sorbitol", "Add carrageenan slowly while mixing", "Mix until fully hydrated"]
            },
            {
              phase: "Active Addition",
              steps: ["Add hydrated silica gradually", "Mix to smooth paste", "Add sodium fluoride"]
            },
            {
              phase: "Final Formulation",
              steps: ["Add SLS slowly", "Add flavor and sweetener", "Mix until homogeneous", "Deaerate under vacuum"]
            }
          ]),
          usageInstructions: "Brush teeth thoroughly twice daily. Use pea-sized amount. Do not swallow. Children under 6 should use under adult supervision."
        },
        {
          name: "Antibacterial Mouthwash",
          description: "Alcohol-free mouthwash with antimicrobial action and fresh breath protection.",
          phLevel: "6.0 - 7.0",
          shelfLife: "24 months",
          viscosity: "10-20 cP",
          storageConditions: "Room temperature",
          batchSize: "2000-5000 kg",
          processingTime: "2 hours",
          temperature: "Room temperature",
          equipment: "Standard mixer",
          certification: "FDA approved",
          ingredients: JSON.stringify([
            { name: "Water", inci: "Aqua", percentage: "85.0%", function: "Solvent" },
            { name: "Cetylpyridinium Chloride", inci: "Cetylpyridinium Chloride", percentage: "0.05%", function: "Antimicrobial" },
            { name: "Glycerin", inci: "Glycerin", percentage: "10.0%", function: "Humectant" },
            { name: "Poloxamer 407", inci: "Poloxamer 407", percentage: "2.0%", function: "Solubilizer" },
            { name: "Sodium Fluoride", inci: "Sodium Fluoride", percentage: "0.02%", function: "Anticaries Agent" },
            { name: "Menthol", inci: "Menthol", percentage: "0.1%", function: "Cooling Agent" },
            { name: "Flavor", inci: "Aroma", percentage: "0.5%", function: "Flavoring" },
            { name: "Sodium Benzoate", inci: "Sodium Benzoate", percentage: "0.1%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Base Solution",
              steps: ["Mix water and glycerin", "Add poloxamer 407", "Mix until clear solution"]
            },
            {
              phase: "Active Ingredients",
              steps: ["Add cetylpyridinium chloride", "Add sodium fluoride", "Ensure complete dissolution"]
            },
            {
              phase: "Flavor System",
              steps: ["Dissolve menthol in flavor", "Add to main solution", "Add preservative", "Mix and filter"]
            }
          ]),
          usageInstructions: "Rinse with 20ml for 30 seconds twice daily after brushing. Do not swallow. Do not eat or drink for 30 minutes after use."
        },
        {
          name: "Sensitive Teeth Gel",
          description: "Desensitizing gel with potassium nitrate for relief of tooth sensitivity.",
          phLevel: "6.5 - 7.5",
          shelfLife: "24 months",
          viscosity: "30000-50000 cP",
          storageConditions: "Room temperature",
          batchSize: "200-500 kg",
          processingTime: "3 hours",
          temperature: "Room temperature",
          equipment: "Planetary mixer",
          certification: "FDA approved",
          ingredients: JSON.stringify([
            { name: "Water", inci: "Aqua", percentage: "50.0%", function: "Solvent" },
            { name: "Potassium Nitrate", inci: "Potassium Nitrate", percentage: "5.0%", function: "Desensitizing Agent" },
            { name: "Hydroxyethylcellulose", inci: "Hydroxyethylcellulose", percentage: "2.0%", function: "Thickener" },
            { name: "Glycerin", inci: "Glycerin", percentage: "35.0%", function: "Humectant" },
            { name: "PEG-8", inci: "PEG-8", percentage: "5.0%", function: "Solvent" },
            { name: "Flavor", inci: "Aroma", percentage: "1.0%", function: "Flavoring" },
            { name: "Sodium Saccharin", inci: "Sodium Saccharin", percentage: "0.2%", function: "Sweetener" },
            { name: "Methylparaben", inci: "Methylparaben", percentage: "0.1%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Gel Base",
              steps: ["Hydrate hydroxyethylcellulose in water", "Mix until fully swollen", "Add glycerin and PEG-8"]
            },
            {
              phase: "Active Addition",
              steps: ["Dissolve potassium nitrate in portion of water", "Add to gel base slowly", "Mix until uniform"]
            },
            {
              phase: "Final Steps",
              steps: ["Add flavor and sweetener", "Add preservative", "Mix thoroughly", "Deaerate if needed"]
            }
          ]),
          usageInstructions: "Apply small amount to affected teeth with fingertip or soft brush. Leave for 1-2 minutes then rinse. Use twice daily or as directed by dentist."
        },
        {
          name: "Breath Freshening Strips",
          description: "Dissolvable oral strips with instant breath freshening action.",
          phLevel: "6.0 - 7.0",
          shelfLife: "24 months",
          viscosity: "N/A (Film)",
          storageConditions: "Low humidity",
          batchSize: "100-300 kg",
          processingTime: "8-12 hours",
          temperature: "60-80°C",
          equipment: "Film casting line",
          certification: "FDA approved",
          ingredients: JSON.stringify([
            { name: "Pullulan", inci: "Pullulan", percentage: "40.0%", function: "Film Former" },
            { name: "Water", inci: "Aqua", percentage: "45.0%", function: "Solvent" },
            { name: "Glycerin", inci: "Glycerin", percentage: "8.0%", function: "Plasticizer" },
            { name: "Menthol", inci: "Menthol", percentage: "2.0%", function: "Cooling Agent" },
            { name: "Flavor", inci: "Aroma", percentage: "3.0%", function: "Flavoring" },
            { name: "Sucralose", inci: "Sucralose", percentage: "1.5%", function: "Sweetener" },
            { name: "Potassium Acesulfame", inci: "Potassium Acesulfame", percentage: "0.5%", function: "Sweetener" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Film Solution",
              steps: ["Dissolve pullulan in warm water", "Add glycerin slowly", "Mix until clear solution"]
            },
            {
              phase: "Flavor System",
              steps: ["Dissolve menthol in flavor", "Add sweeteners", "Mix thoroughly"]
            },
            {
              phase: "Film Casting",
              steps: ["Combine all ingredients", "Cast on release liner", "Dry at 70°C", "Cut to desired size"]
            }
          ]),
          usageInstructions: "Place one strip on tongue and allow to dissolve completely. Do not chew or swallow whole. Use as needed for fresh breath."
        },
        {
          name: "Dental Floss Coating",
          description: "Wax coating for dental floss with antibacterial and flavoring properties.",
          phLevel: "7.0 - 8.0",
          shelfLife: "36 months",
          viscosity: "N/A (Solid)",
          storageConditions: "Room temperature",
          batchSize: "500-1000 kg",
          processingTime: "4 hours",
          temperature: "80-90°C",
          equipment: "Melting tank",
          certification: "FDA approved",
          ingredients: JSON.stringify([
            { name: "Microcrystalline Wax", inci: "Microcrystalline Wax", percentage: "60.0%", function: "Base Wax" },
            { name: "Paraffin Wax", inci: "Paraffin", percentage: "25.0%", function: "Hardening Agent" },
            { name: "Candelilla Wax", inci: "Candelilla Cera", percentage: "10.0%", function: "Flexibility Agent" },
            { name: "Flavor", inci: "Aroma", percentage: "3.0%", function: "Flavoring" },
            { name: "Triclosan", inci: "Triclosan", percentage: "1.0%", function: "Antimicrobial" },
            { name: "Vitamin E", inci: "Tocopheryl Acetate", percentage: "1.0%", function: "Antioxidant" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Wax Melting",
              steps: ["Melt microcrystalline and paraffin wax", "Heat to 85°C", "Add candelilla wax"]
            },
            {
              phase: "Active Addition",
              steps: ["Cool to 70°C", "Add triclosan and mix", "Add vitamin E"]
            },
            {
              phase: "Flavor and Coating",
              steps: ["Add flavor at 60°C", "Mix thoroughly", "Apply to floss while warm", "Cool to solidify"]
            }
          ]),
          usageInstructions: "Use approximately 18 inches of floss. Gently guide between teeth using rubbing motion. Curve around each tooth and slide gently under gum line."
        }
      ],
      "Baby Care": [
        {
          name: "Gentle Baby Shampoo",
          description: "No-tears formula with mild cleansing agents suitable for delicate baby hair and scalp.",
          phLevel: "5.5 - 6.5",
          shelfLife: "24 months",
          viscosity: "2000-4000 cP",
          storageConditions: "Room temperature",
          batchSize: "500-1000 kg",
          processingTime: "2 hours",
          temperature: "40-50°C",
          equipment: "Standard mixer",
          certification: "Pediatric tested",
          ingredients: JSON.stringify([
            { name: "Water", inci: "Aqua", percentage: "75.0%", function: "Solvent" },
            { name: "Cocamidopropyl Betaine", inci: "Cocamidopropyl Betaine", percentage: "12.0%", function: "Mild Surfactant" },
            { name: "Coco-Glucoside", inci: "Coco-Glucoside", percentage: "8.0%", function: "Gentle Cleanser" },
            { name: "Glycerin", inci: "Glycerin", percentage: "3.0%", function: "Humectant" },
            { name: "Chamomile Extract", inci: "Chamomilla Recutita Extract", percentage: "1.0%", function: "Soothing Agent" },
            { name: "Panthenol", inci: "Panthenol", percentage: "0.5%", function: "Conditioning Agent" },
            { name: "Citric Acid", inci: "Citric Acid", percentage: "0.3%", function: "pH Adjuster" },
            { name: "Preservative", inci: "Phenoxyethanol, Caprylyl Glycol", percentage: "0.2%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Water Phase",
              steps: ["Heat water to 45°C", "Add glycerin and chamomile extract", "Mix until dissolved"]
            },
            {
              phase: "Surfactant Addition",
              steps: ["Add cocamidopropyl betaine slowly", "Add coco-glucoside", "Mix gently to avoid excessive foam"]
            },
            {
              phase: "Final Adjustments",
              steps: ["Add panthenol", "Adjust pH with citric acid", "Add preservative", "Cool and package"]
            }
          ]),
          usageInstructions: "Apply small amount to wet hair. Gently massage into scalp with fingertips. Rinse thoroughly with warm water. Suitable for daily use."
        },
        {
          name: "Baby Moisturizing Lotion",
          description: "Hypoallergenic moisturizing lotion with natural ingredients for baby's delicate skin.",
          phLevel: "5.0 - 6.0",
          shelfLife: "24 months",
          viscosity: "3000-5000 cP",
          storageConditions: "Cool, dry place",
          batchSize: "300-800 kg",
          processingTime: "3 hours",
          temperature: "70-75°C",
          equipment: "Homogenizer",
          certification: "Dermatologist tested",
          ingredients: JSON.stringify([
            { name: "Water", inci: "Aqua", percentage: "70.0%", function: "Solvent" },
            { name: "Sweet Almond Oil", inci: "Prunus Amygdalus Dulcis Oil", percentage: "8.0%", function: "Emollient" },
            { name: "Shea Butter", inci: "Butyrospermum Parkii Butter", percentage: "5.0%", function: "Moisturizer" },
            { name: "Glycerin", inci: "Glycerin", percentage: "5.0%", function: "Humectant" },
            { name: "Cetyl Alcohol", inci: "Cetyl Alcohol", percentage: "3.0%", function: "Emulsifier" },
            { name: "Calendula Extract", inci: "Calendula Officinalis Extract", percentage: "2.0%", function: "Soothing Agent" },
            { name: "Vitamin E", inci: "Tocopheryl Acetate", percentage: "0.5%", function: "Antioxidant" },
            { name: "Preservative", inci: "Benzyl Alcohol, Dehydroacetic Acid", percentage: "0.5%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Oil Phase",
              steps: ["Melt shea butter and cetyl alcohol", "Add sweet almond oil", "Heat to 72°C"]
            },
            {
              phase: "Water Phase",
              steps: ["Heat water to 72°C", "Add glycerin and calendula extract", "Mix thoroughly"]
            },
            {
              phase: "Emulsification",
              steps: ["Add water phase to oil phase", "Homogenize for 5 minutes", "Cool while mixing", "Add vitamin E and preservative at 40°C"]
            }
          ]),
          usageInstructions: "Apply gently to clean, dry skin. Massage until absorbed. Use daily or as needed. Suitable for face and body."
        },
        {
          name: "Diaper Rash Cream",
          description: "Protective barrier cream with zinc oxide for prevention and treatment of diaper rash.",
          phLevel: "6.0 - 7.0",
          shelfLife: "36 months",
          viscosity: "20000-30000 cP",
          storageConditions: "Room temperature",
          batchSize: "200-500 kg",
          processingTime: "4 hours",
          temperature: "75-80°C",
          equipment: "High-shear mixer",
          certification: "Pediatric approved",
          ingredients: JSON.stringify([
            { name: "Zinc Oxide", inci: "Zinc Oxide", percentage: "20.0%", function: "Active Ingredient" },
            { name: "Petrolatum", inci: "Petrolatum", percentage: "30.0%", function: "Occlusive Agent" },
            { name: "Lanolin", inci: "Lanolin", percentage: "15.0%", function: "Emollient" },
            { name: "Beeswax", inci: "Cera Alba", percentage: "8.0%", function: "Thickener" },
            { name: "Mineral Oil", inci: "Paraffinum Liquidum", percentage: "20.0%", function: "Emollient" },
            { name: "Vitamin A", inci: "Retinyl Palmitate", percentage: "0.5%", function: "Skin Conditioner" },
            { name: "Vitamin D", inci: "Cholecalciferol", percentage: "0.5%", function: "Skin Conditioner" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Oil Base",
              steps: ["Melt petrolatum, lanolin, and beeswax", "Add mineral oil", "Heat to 78°C"]
            },
            {
              phase: "Zinc Oxide Dispersion",
              steps: ["Pre-disperse zinc oxide in portion of oil", "Use high-shear mixing", "Ensure smooth dispersion"]
            },
            {
              phase: "Final Mixing",
              steps: ["Add zinc oxide dispersion to base", "Mix until uniform", "Add vitamins at 60°C", "Continue mixing while cooling"]
            }
          ]),
          usageInstructions: "Apply thick layer to clean, dry diaper area. Do not rub in completely. Use at each diaper change or as directed by pediatrician."
        },
        {
          name: "Baby Powder",
          description: "Talc-free powder with cornstarch for absorbing moisture and preventing chafing.",
          phLevel: "6.5 - 7.5",
          shelfLife: "36 months",
          viscosity: "N/A (Powder)",
          storageConditions: "Dry environment",
          batchSize: "500-1000 kg",
          processingTime: "2 hours",
          temperature: "Room temperature",
          equipment: "Ribbon blender",
          certification: "Pediatric tested",
          ingredients: JSON.stringify([
            { name: "Corn Starch", inci: "Zea Mays Starch", percentage: "85.0%", function: "Absorbent" },
            { name: "Kaolin", inci: "Kaolin", percentage: "10.0%", function: "Oil Absorber" },
            { name: "Zinc Stearate", inci: "Zinc Stearate", percentage: "3.0%", function: "Slip Agent" },
            { name: "Allantoin", inci: "Allantoin", percentage: "1.0%", function: "Soothing Agent" },
            { name: "Chamomile Extract", inci: "Chamomilla Recutita Extract", percentage: "0.5%", function: "Anti-inflammatory" },
            { name: "Fragrance", inci: "Parfum", percentage: "0.5%", function: "Mild Fragrance" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Dry Blending",
              steps: ["Sift all powder ingredients", "Blend corn starch and kaolin", "Add zinc stearate gradually"]
            },
            {
              phase: "Active Addition",
              steps: ["Add allantoin and chamomile extract", "Blend until uniform distribution", "Screen to remove lumps"]
            },
            {
              phase: "Final Processing",
              steps: ["Add fragrance last", "Final blending for 10 minutes", "Package in moisture-proof containers"]
            }
          ]),
          usageInstructions: "Sprinkle small amount into palm, then apply to baby's skin. Avoid shaking directly over baby's face. Keep away from baby's face during application."
        },
        {
          name: "Baby Bubble Bath",
          description: "Gentle, tear-free bubble bath with mild surfactants and soothing botanicals.",
          phLevel: "5.5 - 6.5",
          shelfLife: "24 months",
          viscosity: "500-1000 cP",
          storageConditions: "Room temperature",
          batchSize: "800-1500 kg",
          processingTime: "1.5 hours",
          temperature: "40°C",
          equipment: "Standard mixer",
          certification: "Ophthalmologist tested",
          ingredients: JSON.stringify([
            { name: "Water", inci: "Aqua", percentage: "80.0%", function: "Solvent" },
            { name: "Cocamidopropyl Betaine", inci: "Cocamidopropyl Betaine", percentage: "10.0%", function: "Mild Surfactant" },
            { name: "Sodium Lauroyl Sarcosinate", inci: "Sodium Lauroyl Sarcosinate", percentage: "5.0%", function: "Foam Booster" },
            { name: "Glycerin", inci: "Glycerin", percentage: "3.0%", function: "Moisturizer" },
            { name: "Lavender Extract", inci: "Lavandula Angustifolia Extract", percentage: "1.0%", function: "Calming Agent" },
            { name: "Citric Acid", inci: "Citric Acid", percentage: "0.2%", function: "pH Adjuster" },
            { name: "Preservative", inci: "Sodium Benzoate, Potassium Sorbate", percentage: "0.3%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Base Preparation",
              steps: ["Heat water to 40°C", "Add glycerin and lavender extract", "Mix until dissolved"]
            },
            {
              phase: "Surfactant Addition",
              steps: ["Add cocamidopropyl betaine slowly", "Add sodium lauroyl sarcosinate", "Mix gently to create smooth solution"]
            },
            {
              phase: "Final Steps",
              steps: ["Adjust pH with citric acid", "Add preservatives", "Cool to room temperature", "Package"]
            }
          ]),
          usageInstructions: "Add 1-2 capfuls under running water. Supervise children during bath time. Rinse child thoroughly after bathing. For external use only."
        }
      ],
      "Men Care": [
        {
          name: "Daily Face Moisturizer for Men",
          description: "Lightweight, non-greasy moisturizer with SPF protection for daily use.",
          phLevel: "6.0 - 7.0",
          shelfLife: "24 months",
          viscosity: "2000-3000 cP",
          storageConditions: "Room temperature",
          batchSize: "300-700 kg",
          processingTime: "3 hours",
          temperature: "70°C",
          equipment: "Homogenizer",
          certification: "Dermatologist tested",
          ingredients: JSON.stringify([
            { name: "Water", inci: "Aqua", percentage: "60.0%", function: "Solvent" },
            { name: "Zinc Oxide", inci: "Zinc Oxide", percentage: "8.0%", function: "SPF Protection" },
            { name: "Dimethicone", inci: "Dimethicone", percentage: "6.0%", function: "Silicone Emollient" },
            { name: "Glycerin", inci: "Glycerin", percentage: "8.0%", function: "Humectant" },
            { name: "Isopropyl Myristate", inci: "Isopropyl Myristate", percentage: "5.0%", function: "Emollient" },
            { name: "Cetyl Alcohol", inci: "Cetyl Alcohol", percentage: "4.0%", function: "Emulsifier" },
            { name: "Niacinamide", inci: "Niacinamide", percentage: "2.0%", function: "Skin Conditioner" },
            { name: "Caffeine", inci: "Caffeine", percentage: "0.5%", function: "Energizing Agent" },
            { name: "Menthol", inci: "Menthol", percentage: "0.1%", function: "Cooling Agent" },
            { name: "Preservative", inci: "Phenoxyethanol, Ethylhexylglycerin", percentage: "1.0%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Oil Phase",
              steps: ["Melt cetyl alcohol at 70°C", "Add dimethicone and isopropyl myristate", "Disperse zinc oxide thoroughly"]
            },
            {
              phase: "Water Phase",
              steps: ["Heat water to 70°C", "Add glycerin and niacinamide", "Dissolve completely"]
            },
            {
              phase: "Emulsification",
              steps: ["Add water phase to oil phase", "Homogenize for 5 minutes", "Cool to 40°C", "Add caffeine, menthol, and preservatives"]
            }
          ]),
          usageInstructions: "Apply to clean face and neck every morning. Massage until absorbed. Reapply throughout day if needed. Suitable for daily use."
        },
        {
          name: "Shaving Cream",
          description: "Rich, protective shaving cream with moisturizing agents for smooth, comfortable shave.",
          phLevel: "7.0 - 8.0",
          shelfLife: "24 months",
          viscosity: "15000-25000 cP",
          storageConditions: "Room temperature",
          batchSize: "500-1000 kg",
          processingTime: "4 hours",
          temperature: "75°C",
          equipment: "High-speed mixer",
          certification: "Dermatologist tested",
          ingredients: JSON.stringify([
            { name: "Water", inci: "Aqua", percentage: "55.0%", function: "Solvent" },
            { name: "Stearic Acid", inci: "Stearic Acid", percentage: "15.0%", function: "Thickener/Lather" },
            { name: "Glycerin", inci: "Glycerin", percentage: "8.0%", function: "Moisturizer" },
            { name: "Potassium Hydroxide", inci: "Potassium Hydroxide", percentage: "3.0%", function: "Saponifying Agent" },
            { name: "Coconut Oil", inci: "Cocos Nucifera Oil", percentage: "6.0%", function: "Conditioning Agent" },
            { name: "Lanolin", inci: "Lanolin", percentage: "4.0%", function: "Emollient" },
            { name: "Allantoin", inci: "Allantoin", percentage: "0.5%", function: "Soothing Agent" },
            { name: "Menthol", inci: "Menthol", percentage: "0.3%", function: "Cooling Agent" },
            { name: "Fragrance", inci: "Parfum", percentage: "1.0%", function: "Masculine Scent" },
            { name: "Preservative", inci: "Methylparaben, Propylparaben", percentage: "0.2%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Soap Base",
              steps: ["Heat water to 75°C", "Add potassium hydroxide carefully", "Add stearic acid gradually"]
            },
            {
              phase: "Oil Addition",
              steps: ["Add coconut oil and lanolin", "Mix until saponification occurs", "Add glycerin"]
            },
            {
              phase: "Final Mixing",
              steps: ["Cool to 50°C", "Add allantoin and menthol", "Add fragrance and preservatives", "Mix until smooth cream forms"]
            }
          ]),
          usageInstructions: "Apply to wet face and work into rich lather. Shave with grain of hair growth. Rinse thoroughly with cool water. Follow with aftershave balm."
        },
        {
          name: "Aftershave Balm",
          description: "Alcohol-free soothing balm with anti-inflammatory ingredients for post-shave care.",
          phLevel: "5.5 - 6.5",
          shelfLife: "24 months",
          viscosity: "3000-5000 cP",
          storageConditions: "Cool place",
          batchSize: "300-600 kg",
          processingTime: "3 hours",
          temperature: "65°C",
          equipment: "Homogenizer",
          certification: "Dermatologist tested",
          ingredients: JSON.stringify([
            { name: "Water", inci: "Aqua", percentage: "65.0%", function: "Solvent" },
            { name: "Aloe Vera Gel", inci: "Aloe Barbadensis Leaf Juice", percentage: "10.0%", function: "Soothing Agent" },
            { name: "Jojoba Oil", inci: "Simmondsia Chinensis Oil", percentage: "5.0%", function: "Emollient" },
            { name: "Shea Butter", inci: "Butyrospermum Parkii Butter", percentage: "4.0%", function: "Moisturizer" },
            { name: "Glycerin", inci: "Glycerin", percentage: "5.0%", function: "Humectant" },
            { name: "Cetyl Alcohol", inci: "Cetyl Alcohol", percentage: "3.0%", function: "Emulsifier" },
            { name: "Witch Hazel Extract", inci: "Hamamelis Virginiana Extract", percentage: "3.0%", function: "Astringent" },
            { name: "Bisabolol", inci: "Bisabolol", percentage: "0.5%", function: "Anti-inflammatory" },
            { name: "Vitamin E", inci: "Tocopheryl Acetate", percentage: "0.5%", function: "Antioxidant" },
            { name: "Menthol", inci: "Menthol", percentage: "0.2%", function: "Cooling" },
            { name: "Fragrance", inci: "Parfum", percentage: "0.8%", function: "Scent" },
            { name: "Preservative", inci: "Phenoxyethanol, Caprylyl Glycol", percentage: "1.0%", function: "Preservative" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Oil Phase",
              steps: ["Melt shea butter and cetyl alcohol", "Add jojoba oil", "Heat to 65°C"]
            },
            {
              phase: "Water Phase",
              steps: ["Heat water to 65°C", "Add aloe vera gel and glycerin", "Add witch hazel extract"]
            },
            {
              phase: "Emulsification",
              steps: ["Combine phases and homogenize", "Cool to 45°C", "Add bisabolol, vitamin E, menthol", "Add fragrance and preservatives"]
            }
          ]),
          usageInstructions: "Apply to clean, shaved skin. Massage gently until absorbed. Use immediately after shaving. Suitable for sensitive skin."
        },
        {
          name: "Men's Deodorant Stick",
          description: "Long-lasting antiperspirant deodorant with masculine fragrance and wetness protection.",
          phLevel: "4.0 - 5.0",
          shelfLife: "36 months",
          viscosity: "N/A (Solid)",
          storageConditions: "Room temperature",
          batchSize: "400-800 kg",
          processingTime: "6 hours",
          temperature: "85°C",
          equipment: "Melting tank with agitator",
          certification: "Efficacy tested",
          ingredients: JSON.stringify([
            { name: "Aluminum Chlorohydrate", inci: "Aluminum Chlorohydrate", percentage: "20.0%", function: "Antiperspirant" },
            { name: "Cyclopentasiloxane", inci: "Cyclopentasiloxane", percentage: "30.0%", function: "Carrier" },
            { name: "Stearyl Alcohol", inci: "Stearyl Alcohol", percentage: "15.0%", function: "Hardening Agent" },
            { name: "C12-15 Alkyl Benzoate", inci: "C12-15 Alkyl Benzoate", percentage: "15.0%", function: "Emollient" },
            { name: "PPG-14 Butyl Ether", inci: "PPG-14 Butyl Ether", percentage: "8.0%", function: "Solvent" },
            { name: "Hydrogenated Castor Oil", inci: "Hydrogenated Castor Oil", percentage: "5.0%", function: "Structuring Agent" },
            { name: "Fragrance", inci: "Parfum", percentage: "2.0%", function: "Masculine Scent" },
            { name: "Triclosan", inci: "Triclosan", percentage: "0.3%", function: "Antimicrobial" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Wax Phase",
              steps: ["Melt stearyl alcohol and hydrogenated castor oil", "Heat to 85°C", "Mix until homogeneous"]
            },
            {
              phase: "Active Addition",
              steps: ["Cool to 70°C", "Add aluminum chlorohydrate slowly", "Mix thoroughly to disperse"]
            },
            {
              phase: "Final Processing",
              steps: ["Add cyclopentasiloxane and alkyl benzoate", "Add PPG-14 butyl ether", "Add fragrance and triclosan", "Pour into molds at 60°C"]
            }
          ]),
          usageInstructions: "Apply to clean, dry underarms. Use daily for best protection. Allow to dry before dressing. Do not apply to broken or irritated skin."
        },
        {
          name: "Beard Oil",
          description: "Nourishing oil blend for beard conditioning and skin moisturizing underneath.",
          phLevel: "N/A",
          shelfLife: "18 months",
          viscosity: "20-50 cP",
          storageConditions: "Cool, dark place",
          batchSize: "100-300 kg",
          processingTime: "1 hour",
          temperature: "Room temperature",
          equipment: "Standard mixer",
          certification: "Natural certified",
          ingredients: JSON.stringify([
            { name: "Jojoba Oil", inci: "Simmondsia Chinensis Oil", percentage: "40.0%", function: "Base Oil" },
            { name: "Argan Oil", inci: "Argania Spinosa Kernel Oil", percentage: "25.0%", function: "Conditioning" },
            { name: "Sweet Almond Oil", inci: "Prunus Amygdalus Dulcis Oil", percentage: "20.0%", function: "Emollient" },
            { name: "Grapeseed Oil", inci: "Vitis Vinifera Seed Oil", percentage: "10.0%", function: "Light Conditioning" },
            { name: "Vitamin E Oil", inci: "Tocopherol", percentage: "2.0%", function: "Antioxidant" },
            { name: "Cedarwood Essential Oil", inci: "Cedrus Atlantica Oil", percentage: "1.5%", function: "Fragrance" },
            { name: "Sandalwood Essential Oil", inci: "Santalum Album Oil", percentage: "1.0%", function: "Fragrance" },
            { name: "Bergamot Essential Oil", inci: "Citrus Bergamia Oil", percentage: "0.5%", function: "Top Note" }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Base Oil Blending",
              steps: ["Combine jojoba, argan, and sweet almond oils", "Add grapeseed oil", "Mix thoroughly"]
            },
            {
              phase: "Antioxidant Addition",
              steps: ["Add vitamin E oil", "Mix until uniformly distributed"]
            },
            {
              phase: "Fragrance Blending",
              steps: ["Combine essential oils separately first", "Add fragrance blend to base oils", "Mix gently", "Allow to mature for 24 hours"]
            }
          ]),
          usageInstructions: "Apply 3-5 drops to palm, rub hands together, massage into beard and skin underneath. Use daily or as needed. Start with less and add more as required."
        }
      ]
    };

    // Add similar data for remaining categories
    const defaultFormulations = [
      {
        name: "Standard Formulation 1",
        description: "Professional grade formulation for commercial use.",
        phLevel: "6.0 - 7.0",
        shelfLife: "24 months",
        viscosity: "2000-3000 cP",
        storageConditions: "Room temperature",
        batchSize: "100-500 kg",
        processingTime: "2-3 hours",
        temperature: "60-70°C",
        equipment: "Standard mixer",
        certification: "ISO certified",
        ingredients: JSON.stringify([
          { name: "Water", inci: "Aqua", percentage: "70.0%", function: "Solvent" },
          { name: "Active Ingredient", inci: "Active Component", percentage: "5.0%", function: "Primary Active" },
          { name: "Emulsifier", inci: "Emulsifying Agent", percentage: "3.0%", function: "Emulsification" },
          { name: "Preservative", inci: "Preservative System", percentage: "1.0%", function: "Preservation" }
        ]),
        instructions: JSON.stringify([
          {
            phase: "Preparation",
            steps: ["Prepare equipment", "Measure ingredients", "Check temperatures"]
          },
          {
            phase: "Mixing",
            steps: ["Combine base ingredients", "Add active components", "Mix thoroughly"]
          },
          {
            phase: "Finishing",
            steps: ["Cool mixture", "Add preservatives", "Package product"]
          }
        ]),
        usageInstructions: "Follow manufacturer guidelines for application and use."
      }
    ];

    return formulationsByCategory[categoryName] || Array(5).fill(0).map((_, i) => ({
      ...defaultFormulations[0],
      name: `${categoryName} Formulation ${i + 1}`,
      description: `Professional ${categoryName.toLowerCase()} formulation for commercial manufacturing.`
    }));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(cat => cat.isActive);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = {
      ...category,
      id,
      isActive: category.isActive ?? true,
      createdAt: new Date(),
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;

    const updated: Category = { ...existing, ...category };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Formulations
  async getFormulations(): Promise<Formulation[]> {
    return Array.from(this.formulations.values()).filter(form => form.isActive);
  }

  async getFormulationsByCategory(categoryId: string): Promise<Formulation[]> {
    return Array.from(this.formulations.values()).filter(
      form => form.categoryId === categoryId && form.isActive
    );
  }

  async getFormulation(id: string): Promise<Formulation | undefined> {
    return this.formulations.get(id);
  }

  async getFormulationBySlug(slug: string): Promise<Formulation | undefined> {
    const formulation = Array.from(this.formulations.values()).find(f => f.slug === slug);
    return formulation ? formulation : undefined;
  }

  async createFormulation(formulation: InsertFormulation): Promise<Formulation> {
    const id = randomUUID();
    const newFormulation: Formulation = {
      ...formulation,
      id,
      isActive: formulation.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.formulations.set(id, newFormulation);
    return newFormulation;
  }

  async updateFormulation(id: string, formulation: Partial<InsertFormulation>): Promise<Formulation | undefined> {
    const existing = this.formulations.get(id);
    if (!existing) return undefined;

    const updated: Formulation = {
      ...existing,
      ...formulation,
      updatedAt: new Date(),
    };
    this.formulations.set(id, updated);
    return updated;
  }

  async deleteFormulation(id: string): Promise<boolean> {
    return this.formulations.delete(id);
  }

  // Admin formulation methods
  async getAllFormulations(): Promise<Formulation[]> {
    return Array.from(this.formulations.values()); // Return all formulations including inactive
  }

  async updateFormulationStatus(id: string, isActive: boolean): Promise<Formulation | undefined> {
    const existing = this.formulations.get(id);
    if (!existing) return undefined;

    const updated: Formulation = {
      ...existing,
      isActive,
      updatedAt: new Date(),
    };
    this.formulations.set(id, updated);
    return updated;
  }

  // AI Generation methods
  async getAiGenerations(): Promise<IAiGeneration[]> {
    return Array.from(this.aiGenerations.values());
  }

  async trackAiGeneration(generation: Omit<IAiGeneration, 'id'>): Promise<IAiGeneration> {
    const id = randomUUID();
    const newGeneration: IAiGeneration = {
      id,
      ...generation,
    };
    this.aiGenerations.set(id, newGeneration);
    return newGeneration;
  }

  async clearAiGenerations(): Promise<boolean> {
    this.aiGenerations.clear();
    return true;
  }

  // Product Properties methods
  async getProductProperties(productType: string): Promise<string[] | undefined> {
    const normalizedType = productType.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return this.productProperties.get(normalizedType);
  }

  // User Notes methods
  async saveUserNote(userNote: InsertUserNote): Promise<UserNote> {
    const id = randomUUID();
    const newUserNote: UserNote = {
      ...userNote,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userNotes.set(id, newUserNote);
    return newUserNote;
  }

  async getRecommendations(productType: string): Promise<string[]> {
    const notes = Array.from(this.userNotes.values())
      .filter(note => note.productType === productType)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
    
    return notes
      .map(note => note.additionalNote)
      .filter(note => note && note.trim().length > 0);
  }

  // User Authentication methods (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const user: User = {
      id: userData.id!,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Pages Content Management methods
  async getPages(): Promise<Page[]> {
    return Array.from(this.pages.values()).sort((a, b) => a.title.localeCompare(b.title));
  }

  async getPageBySlug(slug: string): Promise<Page | undefined> {
    return Array.from(this.pages.values()).find(page => page.slug === slug);
  }

  async createPage(pageData: InsertPage): Promise<Page> {
    const id = randomUUID();
    const page: Page = {
      id,
      slug: pageData.slug,
      title: pageData.title,
      content: pageData.content,
      metaDescription: pageData.metaDescription || null,
      isActive: pageData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pages.set(id, page);
    return page;
  }

  async updatePage(id: string, pageData: Partial<InsertPage>): Promise<Page | undefined> {
    const existingPage = this.pages.get(id);
    if (!existingPage) {
      return undefined;
    }

    const updatedPage: Page = {
      ...existingPage,
      ...pageData,
      updatedAt: new Date(),
    };
    
    this.pages.set(id, updatedPage);
    return updatedPage;
  }

  async deletePage(id: string): Promise<boolean> {
    return this.pages.delete(id);
  }

  private seedPages() {
    // Skip seeding if pages already exist
    if (this.pages.size > 0) {
      return;
    }

    const commonPages: Page[] = [
      {
        id: randomUUID(),
        slug: "about",
        title: "About Us",
        content: `
          <div class="prose max-w-none">
            <h1>About AIFormulator</h1>
            <p>AIFormulator is a cutting-edge AI-powered platform that revolutionizes chemical formulation for small business manufacturers worldwide. Our mission is to democratize access to professional-grade chemical formulations that were previously only available to large corporations.</p>
            
            <h2>Our Mission</h2>
            <p>We believe that every entrepreneur and small manufacturer should have access to professional chemical formulations. Our AI technology levels the playing field by providing instant access to thousands of tested formulations across multiple product categories.</p>
            
            <h2>What We Offer</h2>
            <ul>
              <li><strong>AI-Powered Formulations:</strong> Generate custom formulations based on your specific requirements</li>
              <li><strong>Professional Quality:</strong> All formulations are researched and meet industry standards</li>
              <li><strong>Comprehensive Database:</strong> Access to formulations for skincare, cosmetics, cleaning products, and more</li>
              <li><strong>PDF Documentation:</strong> Detailed formulation sheets with ingredients, instructions, and safety guidelines</li>
              <li><strong>Expert Support:</strong> Get assistance from our team of chemical formulation experts</li>
            </ul>
            
            <h2>Our Technology</h2>
            <p>Our platform leverages advanced AI algorithms trained on thousands of professional chemical formulations. Each generated formulation includes detailed ingredient lists, mixing instructions, safety guidelines, and quality control specifications.</p>
            
            <h2>Contact Information</h2>
            <p>For questions about our platform or technical support, please visit our <a href="/contact">Contact page</a> or check our <a href="/faq">FAQ section</a>.</p>
          </div>
        `,
        metaDescription: "Learn about AIFormulator - the AI-powered platform revolutionizing chemical formulation for small business manufacturers worldwide.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        slug: "faq",
        title: "Frequently Asked Questions",
        content: `
          <div class="prose max-w-none">
            <h1>Frequently Asked Questions</h1>
            
            <h3>What is AIFormulator?</h3>
            <p>AIFormulator is an AI-powered platform that generates professional chemical formulations for small business manufacturers. Our system provides instant access to tested formulations across multiple product categories including skincare, cosmetics, cleaning products, and more.</p>
            
            <h3>How does the AI formulation generator work?</h3>
            <p>Our AI system analyzes your specific requirements (product type, pH level, cost constraints, etc.) and generates custom formulations based on our extensive database of professional recipes. Each formulation includes detailed ingredients, mixing instructions, and safety guidelines.</p>
            
            <h3>Are the formulations safe to use?</h3>
            <p>All formulations in our database are based on established industry standards and safe ingredient combinations. However, we recommend conducting proper testing and following all safety guidelines before commercial production. Always consult with a qualified chemist for commercial applications.</p>
            
            <h3>What formats do you provide?</h3>
            <p>All formulations are provided as downloadable PDF documents that include ingredient lists, step-by-step mixing instructions, safety information, quality control guidelines, and storage recommendations.</p>
            
            <h3>Can I modify the formulations?</h3>
            <p>Yes, our formulations serve as professional starting points that you can modify to meet your specific needs. We provide detailed ingredient information and substitution guidelines to help you customize formulations.</p>
            
            <h3>Do you provide ingredient sourcing information?</h3>
            <p>Our formulations include detailed ingredient specifications including INCI names, CAS numbers, and typical supplier grades. While we don't directly sell ingredients, we provide the information needed to source them from chemical suppliers.</p>
            
            <h3>What product categories do you support?</h3>
            <p>We currently support formulations for skincare products, cosmetics, hair care, body care, oral care, cleaning products, detergents, and disinfectants. We're constantly expanding our database with new categories.</p>
            
            <h3>Is there customer support available?</h3>
            <p>Yes, we provide technical support for using our platform. For formulation-specific questions, we recommend consulting with a qualified chemist, as regulatory requirements vary by region and intended use.</p>
            
            <h3>How much does it cost?</h3>
            <p>Our platform offers various pricing tiers to suit different business needs. Please contact our sales team for current pricing information and to discuss the best plan for your business requirements.</p>
            
            <h3>Can I use these formulations commercially?</h3>
            <p>Our formulations can be used as the basis for commercial products, but you are responsible for ensuring compliance with local regulations, conducting appropriate testing, and meeting quality standards. We recommend working with regulatory experts in your region.</p>
          </div>
        `,
        metaDescription: "Find answers to common questions about AIFormulator, our AI-powered chemical formulation platform, safety guidelines, and commercial usage.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        slug: "terms-of-service",
        title: "Terms of Service",
        content: `
          <div class="prose max-w-none">
            <h1>Terms of Service</h1>
            <p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>
            
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using AIFormulator, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
            
            <h2>2. Description of Service</h2>
            <p>AIFormulator is an AI-powered platform that provides chemical formulations for educational and commercial purposes. Our service includes access to formulation databases, AI-generated custom formulations, and related documentation.</p>
            
            <h2>3. User Responsibilities</h2>
            <ul>
              <li>You are responsible for ensuring the safety and legality of any products you create using our formulations</li>
              <li>You must comply with all applicable laws and regulations in your jurisdiction</li>
              <li>You agree to conduct appropriate testing before any commercial use</li>
              <li>You will not use our service for any illegal or prohibited activities</li>
            </ul>
            
            <h2>4. Intellectual Property</h2>
            <p>The formulations and content provided by AIFormulator are based on publicly available information and industry standards. While you may use these formulations commercially, you cannot claim exclusive ownership of the basic formulation concepts.</p>
            
            <h2>5. Disclaimers and Limitations</h2>
            <p><strong>IMPORTANT:</strong> AIFormulator provides formulations for informational purposes. We make no warranties about the safety, efficacy, or regulatory compliance of any formulations. Users are solely responsible for:</p>
            <ul>
              <li>Testing formulations for safety and performance</li>
              <li>Ensuring regulatory compliance</li>
              <li>Quality control and product liability</li>
              <li>Proper handling and use of chemical ingredients</li>
            </ul>
            
            <h2>6. Limitation of Liability</h2>
            <p>AIFormulator shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from the use of our formulations or platform. This includes but is not limited to product failures, injuries, regulatory violations, or business losses.</p>
            
            <h2>7. Professional Consultation</h2>
            <p>We strongly recommend consulting with qualified chemists, regulatory experts, and legal professionals before using our formulations for commercial purposes. AIFormulator does not provide professional chemical, regulatory, or legal advice.</p>
            
            <h2>8. Account Terms</h2>
            <p>You are responsible for maintaining the security of your account and password. AIFormulator cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</p>
            
            <h2>9. Modifications to Service</h2>
            <p>AIFormulator reserves the right to modify or discontinue, temporarily or permanently, the service with or without notice. We shall not be liable to you or to any third party for any modification, price change, suspension, or discontinuance of the service.</p>
            
            <h2>10. Privacy Policy</h2>
            <p>Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.</p>
            
            <h2>11. Termination</h2>
            <p>AIFormulator may terminate your access to the service for violations of these terms. Upon termination, your right to use the service will cease immediately.</p>
            
            <h2>12. Contact Information</h2>
            <p>If you have any questions about these Terms of Service, please contact us through our support channels.</p>
          </div>
        `,
        metaDescription: "Terms of Service for AIFormulator - understand your rights and responsibilities when using our AI-powered chemical formulation platform.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        slug: "privacy-policy",
        title: "Privacy Policy",
        content: `
          <div class="prose max-w-none">
            <h1>Privacy Policy</h1>
            <p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>
            
            <h2>1. Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>When you create an account or use our services, we may collect:</p>
            <ul>
              <li>Name and contact information</li>
              <li>Email address</li>
              <li>Company information</li>
              <li>Payment information (processed securely by third parties)</li>
            </ul>
            
            <h3>Usage Information</h3>
            <p>We automatically collect information about how you use our platform:</p>
            <ul>
              <li>Formulations generated and downloaded</li>
              <li>Platform usage patterns and preferences</li>
              <li>Device information and browser type</li>
              <li>IP address and location data</li>
            </ul>
            
            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and improve our formulation services</li>
              <li>Generate personalized recommendations</li>
              <li>Process payments and manage accounts</li>
              <li>Communicate with you about services and updates</li>
              <li>Analyze usage patterns to improve our platform</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>
            
            <h2>3. AI and Data Processing</h2>
            <p>Our AI system processes your formulation requests to generate custom solutions. This includes:</p>
            <ul>
              <li>Analyzing your product specifications and requirements</li>
              <li>Using anonymized usage data to improve AI recommendations</li>
              <li>Storing formulation history to provide better service</li>
            </ul>
            
            <h2>4. Information Sharing</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share information only in these limited circumstances:</p>
            <ul>
              <li><strong>Service Providers:</strong> With trusted partners who help us operate our platform</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or sale of our company</li>
            </ul>
            
            <h2>5. Data Security</h2>
            <p>We implement appropriate security measures to protect your information:</p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication requirements</li>
              <li>Secure payment processing through certified providers</li>
            </ul>
            
            <h2>6. Data Retention</h2>
            <p>We retain your information for as long as necessary to provide services and comply with legal obligations. You may request deletion of your account and associated data at any time.</p>
            
            <h2>7. Your Rights</h2>
            <p>Depending on your location, you may have rights regarding your personal information:</p>
            <ul>
              <li>Access and review your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Object to certain processing activities</li>
              <li>Data portability rights</li>
            </ul>
            
            <h2>8. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to:</p>
            <ul>
              <li>Remember your preferences and login status</li>
              <li>Analyze platform usage and performance</li>
              <li>Provide personalized content and recommendations</li>
            </ul>
            <p>You can control cookie settings through your browser preferences.</p>
            
            <h2>9. Third-Party Services</h2>
            <p>Our platform may integrate with third-party services (payment processors, analytics providers, etc.). These services have their own privacy policies, and we encourage you to review them.</p>
            
            <h2>10. International Transfers</h2>
            <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international data transfers.</p>
            
            <h2>11. Children's Privacy</h2>
            <p>Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.</p>
            
            <h2>12. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "last updated" date.</p>
            
            <h2>13. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us through our support channels or privacy contact information.</p>
          </div>
        `,
        metaDescription: "Privacy Policy for AIFormulator - learn how we collect, use, and protect your personal information on our AI formulation platform.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        slug: "disclaimer",
        title: "Disclaimer",
        content: `
          <div class="prose max-w-none">
            <h1>Disclaimer</h1>
            <p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>
            
            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p class="font-bold text-red-800">IMPORTANT SAFETY NOTICE</p>
              <p class="text-red-700">Chemical formulation and manufacturing involve inherent risks. This platform provides information for educational and professional purposes only. Users assume all responsibility for safety, testing, and regulatory compliance.</p>
            </div>
            
            <h2>1. General Disclaimer</h2>
            <p>The information provided by AIFormulator is for general informational and educational purposes only. All formulations, advice, and recommendations are provided "as is" without warranties of any kind, either express or implied.</p>
            
            <h2>2. Professional Consultation Required</h2>
            <p><strong>WARNING:</strong> Chemical formulation requires professional expertise. Before using any formulation for commercial purposes, you must:</p>
            <ul>
              <li>Consult with qualified chemists and regulatory experts</li>
              <li>Conduct thorough safety and compatibility testing</li>
              <li>Ensure compliance with local and international regulations</li>
              <li>Obtain necessary permits and certifications</li>
              <li>Implement proper quality control procedures</li>
            </ul>
            
            <h2>3. Safety and Testing</h2>
            <p>Users are solely responsible for:</p>
            <ul>
              <li><strong>Safety Testing:</strong> Conducting appropriate safety, stability, and compatibility tests</li>
              <li><strong>Risk Assessment:</strong> Evaluating potential hazards and implementing safety measures</li>
              <li><strong>Personal Protection:</strong> Using proper protective equipment and safety protocols</li>
              <li><strong>Environmental Impact:</strong> Assessing and minimizing environmental effects</li>
            </ul>
            
            <h2>4. Regulatory Compliance</h2>
            <p>Chemical products are subject to various regulations that vary by:</p>
            <ul>
              <li>Geographic location and jurisdiction</li>
              <li>Intended use and target market</li>
              <li>Product category and ingredients</li>
              <li>Manufacturing and distribution methods</li>
            </ul>
            <p><strong>You are responsible for ensuring full compliance with all applicable regulations.</strong></p>
            
            <h2>5. AI-Generated Content</h2>
            <p>Our platform uses artificial intelligence to generate formulations. Please note:</p>
            <ul>
              <li>AI systems may produce unexpected or incorrect results</li>
              <li>Always verify AI-generated formulations with human expertise</li>
              <li>Conduct independent testing before any commercial use</li>
              <li>AI recommendations are not a substitute for professional judgment</li>
            </ul>
            
            <h2>6. Ingredient Information</h2>
            <p>While we strive to provide accurate ingredient information, users must:</p>
            <ul>
              <li>Verify ingredient specifications with suppliers</li>
              <li>Confirm regulatory status in your jurisdiction</li>
              <li>Assess potential allergenic or sensitizing properties</li>
              <li>Evaluate ingredient interactions and stability</li>
            </ul>
            
            <h2>7. Limitations of Liability</h2>
            <p>AIFormulator, its affiliates, and team members shall not be liable for:</p>
            <ul>
              <li>Product failures or defects</li>
              <li>Regulatory violations or legal issues</li>
              <li>Personal injury or property damage</li>
              <li>Business losses or commercial damages</li>
              <li>Environmental harm or contamination</li>
              <li>Intellectual property disputes</li>
            </ul>
            
            <h2>8. Quality Control</h2>
            <p>Users must establish and maintain appropriate quality control systems including:</p>
            <ul>
              <li>Raw material testing and verification</li>
              <li>In-process monitoring and controls</li>
              <li>Finished product testing and certification</li>
              <li>Documentation and record-keeping</li>
              <li>Batch tracking and traceability</li>
            </ul>
            
            <h2>9. Intellectual Property</h2>
            <p>While basic formulation concepts may be in the public domain, users are responsible for:</p>
            <ul>
              <li>Conducting freedom-to-operate analysis</li>
              <li>Avoiding infringement of existing patents</li>
              <li>Protecting their own intellectual property</li>
              <li>Respecting trademark and copyright laws</li>
            </ul>
            
            <h2>10. International Considerations</h2>
            <p>Chemical regulations vary significantly by country. International users must:</p>
            <ul>
              <li>Research local regulatory requirements</li>
              <li>Consider import/export restrictions</li>
              <li>Evaluate regional safety standards</li>
              <li>Adapt formulations for local markets</li>
            </ul>
            
            <h2>11. Emergency Procedures</h2>
            <p>Users must establish emergency procedures including:</p>
            <ul>
              <li>Accident response and first aid protocols</li>
              <li>Spill containment and cleanup procedures</li>
              <li>Emergency contact information</li>
              <li>Safety data sheets and hazard information</li>
            </ul>
            
            <h2>12. Updates and Changes</h2>
            <p>This disclaimer may be updated periodically. Continued use of our platform constitutes acceptance of any changes. Users are responsible for reviewing updates regularly.</p>
            
            <h2>13. Contact and Support</h2>
            <p>For questions about this disclaimer or our platform, contact our support team. However, remember that our support is limited to platform usage and does not constitute professional chemical or regulatory advice.</p>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-6">
              <p class="font-bold text-yellow-800">Remember:</p>
              <p class="text-yellow-700">When in doubt, consult with qualified professionals. Safety should always be your top priority in chemical formulation and manufacturing.</p>
            </div>
          </div>
        `,
        metaDescription: "Important disclaimer for AIFormulator users - understand the risks, responsibilities, and safety requirements for chemical formulation.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    commonPages.forEach(page => {
      this.pages.set(page.id, page);
    });
  }

  // Blog posts methods implementation
  private seedBlogPosts() {
    // Skip seeding if blog posts already exist
    if (this.blogPosts.size > 0) {
      return;
    }

    const sampleBlogPost: BlogPost = {
      id: randomUUID(),
      title: "The Future of Chemical Formulation: AI-Powered Innovation",
      slug: "future-of-chemical-formulation-ai-powered-innovation",
      excerpt: "Discover how artificial intelligence is revolutionizing chemical formulation, making it faster, more precise, and accessible to small businesses.",
      content: `
        <p>The chemical formulation industry is experiencing a transformative shift with the integration of artificial intelligence. This revolution is not just changing how we develop new products, but also making advanced formulation capabilities accessible to small and medium-sized businesses.</p>
        
        <h2>AI-Driven Precision</h2>
        <p>Traditional formulation required years of experience and countless trials. With AI, we can now predict ingredient interactions, optimize formulations for specific properties, and reduce development time from months to hours.</p>
        
        <h2>Democratizing Innovation</h2>
        <p>Small businesses no longer need extensive R&D departments. AI-powered platforms provide instant access to professional-grade formulations across multiple categories including skincare, cosmetics, cleaning products, and more.</p>
        
        <h2>The Benefits Include:</h2>
        <ul>
          <li>Reduced development costs</li>
          <li>Faster time to market</li>
          <li>Improved product consistency</li>
          <li>Access to cutting-edge ingredients</li>
        </ul>
        
        <h2>Looking Forward</h2>
        <p>As AI technology continues to evolve, we can expect even more sophisticated formulation capabilities, including real-time optimization, sustainability scoring, and regulatory compliance checking.</p>
      `,
      featuredImage: null,
      metaDescription: "Learn how AI is transforming chemical formulation for small businesses. Discover the benefits of AI-powered innovation in product development.",
      keywords: "AI formulation, chemical innovation, small business, product development, artificial intelligence",
      authorName: "AI Formulator Team",
      isPublished: true,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.blogPosts.set(sampleBlogPost.id, sampleBlogPost);
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .filter(post => post.isPublished)
      .sort((a, b) => 
        new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
      );
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(post => post.slug === slug);
  }

  async createBlogPost(blogPostData: InsertBlogPost): Promise<BlogPost> {
    const blogPost: BlogPost = {
      id: randomUUID(),
      ...blogPostData,
      publishedAt: blogPostData.isPublished ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.blogPosts.set(blogPost.id, blogPost);
    return blogPost;
  }

  async updateBlogPost(id: string, blogPostData: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const existingPost = this.blogPosts.get(id);
    if (!existingPost) {
      return undefined;
    }

    const updatedPost: BlogPost = {
      ...existingPost,
      ...blogPostData,
      publishedAt: blogPostData.isPublished !== undefined 
        ? (blogPostData.isPublished ? (existingPost.publishedAt || new Date()) : null)
        : existingPost.publishedAt,
      updatedAt: new Date(),
    };

    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    return this.blogPosts.delete(id);
  }

  // Chat methods implementation
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.chatMessages.get(sessionId) || [];
  }

  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: randomUUID(),
      sessionId: messageData.sessionId,
      message: messageData.message,
      senderType: messageData.senderType,
      senderName: messageData.senderName || null,
      timestamp: new Date(),
    };

    if (!this.chatMessages.has(messageData.sessionId)) {
      this.chatMessages.set(messageData.sessionId, []);
    }

    this.chatMessages.get(messageData.sessionId)!.push(message);
    return message;
  }

  // User Formulation Requests methods implementation (stub for MemStorage)
  async getUserFormulationRequests(): Promise<UserFormulationRequest[]> {
    return Array.from(this.userFormulationRequests.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getUserFormulationRequest(id: string): Promise<UserFormulationRequest | undefined> {
    return this.userFormulationRequests.get(id);
  }

  async createUserFormulationRequest(requestData: InsertUserFormulationRequest): Promise<UserFormulationRequest> {
    const request: UserFormulationRequest = {
      id: randomUUID(),
      ...requestData,
      createdAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
    };

    this.userFormulationRequests.set(request.id, request);
    return request;
  }

  async updateUserFormulationRequestStatus(id: string, status: string, adminNotes?: string, reviewedBy?: string): Promise<UserFormulationRequest | undefined> {
    const existing = this.userFormulationRequests.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: UserFormulationRequest = {
      ...existing,
      status,
      adminNotes,
      reviewedBy,
      reviewedAt: new Date(),
    };

    this.userFormulationRequests.set(id, updated);
    return updated;
  }

  async deleteUserFormulationRequest(id: string): Promise<boolean> {
    return this.userFormulationRequests.delete(id);
  }
}

import { DatabaseStorage } from "./database-storage";

// Use database storage for persistent data
export const storage = new MemStorage();
