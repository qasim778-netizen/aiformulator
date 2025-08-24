import { type Category, type InsertCategory, type Formulation, type InsertFormulation, type ProductProperties, type UserNote, type InsertUserNote } from "@shared/schema";
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
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Formulations
  getFormulations(): Promise<Formulation[]>;
  getFormulationsByCategory(categoryId: string): Promise<Formulation[]>;
  getFormulation(id: string): Promise<Formulation | undefined>;
  createFormulation(formulation: InsertFormulation): Promise<Formulation>;
  updateFormulation(id: string, formulation: Partial<InsertFormulation>): Promise<Formulation | undefined>;
  deleteFormulation(id: string): Promise<boolean>;

  // AI Generations
  getAiGenerations(): Promise<IAiGeneration[]>;
  trackAiGeneration(generation: Omit<IAiGeneration, 'id'>): Promise<IAiGeneration>;

  // Product Properties
  getProductProperties(productType: string): Promise<string[] | undefined>;
  
  // User Notes
  saveUserNote(userNote: InsertUserNote): Promise<UserNote>;
  getRecommendations(productType: string): Promise<string[]>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category>;
  private formulations: Map<string, Formulation>;
  private aiGenerations: Map<string, IAiGeneration>;
  private productProperties: Map<string, string[]>;
  private userNotes: Map<string, UserNote>;

  constructor() {
    this.categories = new Map();
    this.formulations = new Map();
    this.aiGenerations = new Map();
    this.productProperties = new Map();
    this.userNotes = new Map();
    // Only seed data if no data exists (first run)
    this.seedInitialData();
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
}

import { DatabaseStorage } from "./database-storage";

// Use database storage for persistent data
export const storage = new DatabaseStorage();
