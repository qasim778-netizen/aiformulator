import OpenAI from "openai";
import type { InsertCategory, InsertFormulation } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateCategory(description: string, existingCategoryNames: string[] = []): Promise<InsertCategory> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a chemical industry expert. Generate a professional product category for small business manufacturers based on the description. 
          
          IMPORTANT: Avoid these existing category names: ${existingCategoryNames.join(', ')}
          
          Return JSON in this exact format:
          {
            "name": "Category Name",
            "description": "Professional description for manufacturers",
            "icon": "fas fa-icon-name",
            "image": "https://images.unsplash.com/photo-...",
            "isActive": true
          }
          
          Use relevant FontAwesome icons and appropriate Unsplash images for chemical/industrial products.`
        },
        {
          role: "user",
          content: `Generate a chemical product category for: ${description}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      name: result.name,
      description: result.description,
      icon: result.icon || "fas fa-flask",
      image: result.image || "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      isActive: result.isActive ?? true
    };
  } catch (error) {
    throw new Error("Failed to generate category: " + (error as Error).message);
  }
}

export async function generateProductTypes(categoryName: string, categoryDescription: string, count: number): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a chemical industry expert. Generate a list of diverse product types for the given category. Return JSON array of specific product descriptions that would be suitable for small business manufacturers. Each product should be unique and practical for commercial production. Return JSON in this exact format:
          {
            "products": ["Product description 1", "Product description 2", ...]
          }`
        },
        {
          role: "user",
          content: `Generate ${count} diverse product types for the category "${categoryName}": ${categoryDescription}. Each product should be specific with intended use and key characteristics.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"products": []}');
    return result.products || [];
  } catch (error) {
    console.error("Failed to generate product types:", error);
    // Fallback to generic types based on category name
    const fallbackTypes = Array.from({ length: count }, (_, i) => 
      `Professional ${categoryName.toLowerCase()} formulation ${i + 1}`
    );
    return fallbackTypes;
  }
}

export async function generateBulkFormulations(categoryName: string, count: number, productTypes: string[]): Promise<Omit<InsertFormulation, 'categoryId'>[]> {
  const formulations: Omit<InsertFormulation, 'categoryId'>[] = [];
  
  for (let i = 0; i < count; i++) {
    const productType = productTypes[i % productTypes.length];
    try {
      const formulation = await generateFormulation(categoryName, productType);
      formulations.push(formulation);
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to generate formulation ${i + 1}:`, error);
      // Continue with the next formulation
    }
  }
  
  return formulations;
}

export async function generateFormulationWithKeywords(categoryName: string, productDescription: string, includeImage: boolean = false): Promise<Omit<InsertFormulation, 'categoryId'>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional chemical formulation expert. Generate a complete, professional chemical formulation for small business manufacturers. 
          
          IMPORTANT: The product name MUST include either "Formula" or "Formulation" in the title. Examples:
          - "Advanced Moisturizing Formula"
          - "Professional Cleansing Formulation" 
          - "Anti-Aging Serum Formula"
          - "Organic Skincare Formulation"
          
          Return JSON in this exact format:
          {
            "name": "Product Name with Formula/Formulation",
            "description": "Professional product description",
            "ingredients": [
              {
                "name": "Ingredient Name",
                "inci": "INCI Name",
                "percentage": "X.X%",
                "function": "Function in formulation"
              }
            ],
            "instructions": [
              {
                "phase": "Phase Name",
                "steps": ["Step 1", "Step 2", "Step 3"]
              }
            ],
            "usageInstructions": "Detailed usage instructions",
            "phLevel": "pH range",
            "shelfLife": "Shelf life period",
            "viscosity": "Viscosity range",
            "storageConditions": "Storage requirements",
            "batchSize": "Batch size range",
            "processingTime": "Processing time",
            "temperature": "Processing temperature",
            "equipment": "Required equipment",
            "certification": "Relevant certifications",
            "isActive": true
          }
          
          Make the formulation realistic, professional, and suitable for commercial manufacturing. Include 6-12 ingredients with proper INCI names and realistic percentages that add up to 100%. Include detailed manufacturing phases and steps. 
          
          REMEMBER: The name must contain "Formula" or "Formulation" keyword.`
        },
        {
          role: "user",
          content: `Generate a ${categoryName} formulation for: ${productDescription}. Ensure the product name includes "Formula" or "Formulation" in the title.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Ensure name contains formula/formulation keyword
    let name = result.name || "Professional Formulation";
    if (!name.toLowerCase().includes('formula') && !name.toLowerCase().includes('formulation')) {
      name = `${name} Formula`;
    }
    
    // Generate image if requested
    let imageUrl = "";
    if (includeImage) {
      try {
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: `Professional product photography of ${name} - ${result.description}. Clean, commercial laboratory setting with professional cosmetic/chemical product packaging. High quality, bright lighting, product focus.`,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        });
        imageUrl = imageResponse.data[0].url || "";
      } catch (error) {
        console.error("Failed to generate image:", error);
      }
    }
    
    return {
      name: name,
      description: result.description,
      image: imageUrl,
      ingredients: JSON.stringify(result.ingredients || []),
      instructions: JSON.stringify(result.instructions || []),
      usageInstructions: result.usageInstructions || "",
      phLevel: result.phLevel || "6.0-7.0",
      shelfLife: result.shelfLife || "24 months",
      viscosity: result.viscosity || "",
      storageConditions: result.storageConditions || "Cool, dry place",
      batchSize: result.batchSize || "100-500 kg",
      processingTime: result.processingTime || "2-4 hours",
      temperature: result.temperature || "Room temperature",
      equipment: result.equipment || "Standard mixer",
      certification: result.certification || "",
      isActive: result.isActive ?? true
    };
  } catch (error) {
    throw new Error("Failed to generate formulation: " + (error as Error).message);
  }
}

export async function generateFormulation(categoryName: string, productDescription: string): Promise<Omit<InsertFormulation, 'categoryId'>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional chemical formulation expert. Generate a complete, professional chemical formulation for small business manufacturers. Return JSON in this exact format:
          {
            "name": "Product Name",
            "description": "Professional product description",
            "ingredients": [
              {
                "name": "Ingredient Name",
                "inci": "INCI Name",
                "percentage": "X.X%",
                "function": "Function in formulation"
              }
            ],
            "instructions": [
              {
                "phase": "Phase Name",
                "steps": ["Step 1", "Step 2", "Step 3"]
              }
            ],
            "usageInstructions": "Detailed usage instructions",
            "phLevel": "pH range",
            "shelfLife": "Shelf life period",
            "viscosity": "Viscosity range",
            "storageConditions": "Storage requirements",
            "batchSize": "Batch size range",
            "processingTime": "Processing time",
            "temperature": "Processing temperature",
            "equipment": "Required equipment",
            "certification": "Relevant certifications",
            "isActive": true
          }
          
          Make the formulation realistic, professional, and suitable for commercial manufacturing. Include 6-12 ingredients with proper INCI names and realistic percentages that add up to 100%. Include detailed manufacturing phases and steps.`
        },
        {
          role: "user",
          content: `Generate a ${categoryName} formulation for: ${productDescription}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      name: result.name,
      description: result.description,
      ingredients: JSON.stringify(result.ingredients || []),
      instructions: JSON.stringify(result.instructions || []),
      usageInstructions: result.usageInstructions || "",
      phLevel: result.phLevel || "6.0-7.0",
      shelfLife: result.shelfLife || "24 months",
      viscosity: result.viscosity || "",
      storageConditions: result.storageConditions || "Cool, dry place",
      batchSize: result.batchSize || "100-500 kg",
      processingTime: result.processingTime || "2-4 hours",
      temperature: result.temperature || "Room temperature",
      equipment: result.equipment || "Standard mixer",
      certification: result.certification || "",
      isActive: result.isActive ?? true
    };
  } catch (error) {
    throw new Error("Failed to generate formulation: " + (error as Error).message);
  }
}

interface CustomFormulationRequest {
  productName: string;
  productDescription: string;
  productType: string;
  phLevel: string;
  costLevel: string;
  viscosity?: string;
  color?: string;
  fragrance?: string;
  specialRequirements?: string;
}

export async function generateCustomFormulation(request: CustomFormulationRequest): Promise<Omit<InsertFormulation, 'categoryId'>> {
  try {
    const costLevelMap = {
      'cost_effective': 'cost-effective with affordable ingredients',
      'medium': 'medium-range with balanced cost and quality',
      'expensive': 'premium with high-quality expensive ingredients'
    };

    const costDescription = costLevelMap[request.costLevel as keyof typeof costLevelMap] || 'cost-effective';
    
    const specialRequirementsText = request.specialRequirements 
      ? `\n\nSpecial Requirements: ${request.specialRequirements}`
      : '';

    const optionalSpecs = [
      request.viscosity && `Viscosity: ${request.viscosity}`,
      request.color && `Color: ${request.color}`,
      request.fragrance && `Fragrance: ${request.fragrance}`
    ].filter(Boolean).join(', ');

    const optionalSpecsText = optionalSpecs ? `\n\nAdditional Specifications: ${optionalSpecs}` : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a professional chemical formulation expert. Generate a complete, professional chemical formulation for small business manufacturers based on the specific requirements provided. Return JSON in this exact format:
          {
            "name": "Product Name",
            "description": "Professional product description",
            "ingredients": [
              {
                "name": "Ingredient Name",
                "inci": "INCI Name",
                "percentage": "X.X%",
                "function": "Function in formulation"
              }
            ],
            "instructions": [
              {
                "phase": "Phase Name",
                "steps": ["Step 1", "Step 2", "Step 3"]
              }
            ],
            "usageInstructions": "Detailed usage instructions",
            "phLevel": "pH range",
            "shelfLife": "Shelf life period",
            "viscosity": "Viscosity range",
            "storageConditions": "Storage requirements",
            "batchSize": "Batch size range",
            "processingTime": "Processing time",
            "temperature": "Processing temperature",
            "equipment": "Required equipment",
            "certification": "Relevant certifications",
            "isActive": true
          }
          
          IMPORTANT: 
          - Make the formulation realistic, professional, and suitable for commercial manufacturing
          - Include 6-12 ingredients with proper INCI names and realistic percentages that add up to 100%
          - Include detailed manufacturing phases and steps
          - Ensure the pH level matches the requested range exactly
          - Consider the cost level when selecting ingredients (${costDescription})
          - Make sure the product type (${request.productType}) is reflected in the formulation structure and ingredients`
        },
        {
          role: "user",
          content: `Generate a custom ${request.productType} formulation for:

Product Name: ${request.productName}
Description: ${request.productDescription}
pH Level Required: ${request.phLevel}
Cost Level: ${costDescription}${optionalSpecsText}${specialRequirementsText}

Please create a professional formulation that meets all these requirements exactly.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      name: result.name || request.productName,
      description: result.description || request.productDescription,
      ingredients: JSON.stringify(result.ingredients || []),
      instructions: JSON.stringify(result.instructions || []),
      usageInstructions: result.usageInstructions || "",
      phLevel: result.phLevel || request.phLevel,
      shelfLife: result.shelfLife || "24 months",
      viscosity: result.viscosity || request.viscosity || "",
      storageConditions: result.storageConditions || "Cool, dry place",
      batchSize: result.batchSize || "100-500 kg",
      processingTime: result.processingTime || "2-4 hours",
      temperature: result.temperature || "Room temperature",
      equipment: result.equipment || "Standard mixer",
      certification: result.certification || "",
      isActive: result.isActive ?? true
    };
  } catch (error) {
    throw new Error("Failed to generate custom formulation: " + (error as Error).message);
  }
}