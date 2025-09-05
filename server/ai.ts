import OpenAI from "openai";
import type { InsertCategory, InsertFormulation } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to generate SEO-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .substring(0, 100); // Limit length
}

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
  console.log(`🧪 Generating ${count} bulk formulations for ${categoryName}...`);
  
  const formulations: Omit<InsertFormulation, 'categoryId'>[] = [];
  
  // Generate formulations in batches to avoid overwhelming the API
  const batchSize = 2;
  for (let i = 0; i < count; i += batchSize) {
    const currentBatch = productTypes.slice(i, i + batchSize);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional chemical formulator. Generate detailed commercial formulations for the given product types. 

IMPORTANT: Return a JSON object with this exact structure:
{
  "formulations": [
    {
      "name": "Product Name",
      "description": "Brief product description",
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
  ]
}

Guidelines:
- Use real chemical ingredients with INCI names when possible
- Include specific percentages that add up to 100%
- Provide detailed manufacturing steps
- Ensure formulations are safe and commercially viable
- Make each formulation unique and practical`
          },
          {
            role: "user",
            content: `Generate ${currentBatch.length} commercial formulations for these ${categoryName} products:\n${currentBatch.map((type, idx) => `${idx + 1}. ${type}`).join('\n')}\n\nEach formulation should be complete, professional, and ready for manufacturing.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8
      });

      const result = JSON.parse(response.choices[0].message.content || '{"formulations": []}');
      if (result.formulations && Array.isArray(result.formulations)) {
        // Process each formulation to match our schema
        for (const formulation of result.formulations) {
          formulations.push({
            name: formulation.name,
            slug: generateSlug(formulation.name || "formulation"),
            description: formulation.description,
            ingredients: JSON.stringify(formulation.ingredients || []),
            instructions: JSON.stringify(formulation.instructions || []),
            usageInstructions: formulation.usageInstructions || "",
            phLevel: formulation.phLevel || "6.0-7.0",
            shelfLife: formulation.shelfLife || "24 months",
            viscosity: formulation.viscosity || "",
            storageConditions: formulation.storageConditions || "Cool, dry place",
            batchSize: formulation.batchSize || "100-500 kg",
            processingTime: formulation.processingTime || "2-4 hours",
            temperature: formulation.temperature || "Room temperature",
            equipment: formulation.equipment || "Standard mixer",
            certification: formulation.certification || "",
            isActive: formulation.isActive ?? true
          });
        }
      }
      
      console.log(`✅ Generated ${result.formulations?.length || 0} formulations in batch ${Math.floor(i / batchSize) + 1}`);
      
      // Add a small delay between batches to respect rate limits
      if (i + batchSize < count) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`❌ Failed to generate batch starting at ${i}:`, error);
      
      // Create fallback formulations for failed batch
      for (let j = 0; j < currentBatch.length && formulations.length < count; j++) {
        const productType = currentBatch[j];
        const fallbackName = `Professional ${productType}`;
        formulations.push({
          name: fallbackName,
          slug: generateSlug(fallbackName),
          description: `High-quality ${productType.toLowerCase()} formulated for commercial use`,
          ingredients: JSON.stringify([
            {
              name: "Water",
              inci: "Aqua",
              percentage: "70.0%",
              function: "Solvent"
            },
            {
              name: "Active ingredient",
              inci: "Active Complex",
              percentage: "15.0%",
              function: "Active component"
            },
            {
              name: "Emulsifier",
              inci: "Emulsifier",
              percentage: "8.0%",
              function: "Stabilizer"
            },
            {
              name: "Preservative",
              inci: "Preservative System",
              percentage: "2.0%",
              function: "Preservation"
            },
            {
              name: "Fragrance",
              inci: "Parfum",
              percentage: "5.0%",
              function: "Fragrance"
            }
          ]),
          instructions: JSON.stringify([
            {
              phase: "Preparation",
              steps: [
                "Heat water to 75°C in main vessel",
                "Add active ingredient and mix until dissolved",
                "Add emulsifier and blend thoroughly"
              ]
            },
            {
              phase: "Cooling",
              steps: [
                "Cool to 40°C and add preservative",
                "Add fragrance and mix well",
                "Cool to room temperature before packaging"
              ]
            }
          ]),
          usageInstructions: "Apply as directed for professional results",
          phLevel: "6.0-7.0",
          shelfLife: "24 months",
          viscosity: "Medium",
          storageConditions: "Cool, dry place",
          batchSize: "100-500 kg",
          processingTime: "2-4 hours",
          temperature: "Room temperature",
          equipment: "Standard mixer",
          certification: "",
          isActive: true
        });
      }
    }
  }
  
  console.log(`🎉 Bulk generation completed! Generated ${formulations.length} formulations`);
  return formulations.slice(0, count); // Ensure we don't exceed requested count
}

export async function generateBulkFormulationsWithKeywords(categoryName: string, count: number, productTypes: string[], includeImages: boolean = false): Promise<Omit<InsertFormulation, 'categoryId'>[]> {
  console.log("Bulk formulations with keywords generation disabled to prevent continuous processing");
  return [];
}

export async function generateFormulationWithKeywords(categoryName: string, productDescription: string, includeImage: boolean = false): Promise<Omit<InsertFormulation, 'categoryId'>> {
  console.log(`=== generateFormulationWithKeywords ===`);
  console.log(`Category: ${categoryName}`);
  console.log(`Product: ${productDescription}`);
  console.log(`Include Image: ${includeImage}`);
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
        console.log(`Generating image for: ${name}`);
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: `Professional cosmetic product bottle labeled "${name}". Clean white background, modern packaging design, high quality product photography, commercial style.`,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        });
        imageUrl = imageResponse.data?.[0]?.url || "";
        console.log(`Image generated successfully: ${imageUrl ? 'Yes' : 'No'}`);
      } catch (error) {
        console.error("Failed to generate image for", name, ":", error);
        // Still continue with formulation creation even if image fails
      }
    }
    
    return {
      name: name,
      slug: generateSlug(name),
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
      slug: generateSlug(result.name || "formulation"),
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
    
    const finalName = result.name || request.productName;
    return {
      name: finalName,
      slug: generateSlug(finalName),
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