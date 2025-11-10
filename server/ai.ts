import OpenAI from "openai";
import type { InsertCategory, InsertFormulation } from "@shared/schema";
import { generateCategorySpecificFormulation } from "./ai-category-specific";
import { capitalizeFormulationName } from "./seo-utils";
import { optimizeFormulationName } from "./name-optimizer";

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

export async function generateAltText(formulationName: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an SEO expert specializing in chemical formulations and product descriptions. Generate professional, SEO-optimized alt text for formulation images. The alt text should be:
          
          - Descriptive and specific
          - Include the formulation name
          - Mention it's a chemical formulation
          - Professional and industry-appropriate
          - Between 10-20 words
          - Suitable for search engines
          
          Return only the alt text string, no additional formatting or quotes.`
        },
        {
          role: "user",
          content: `Generate SEO-optimized alt text for a chemical formulation image of: ${formulationName}`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    const altText = response.choices[0].message.content?.trim() || "";
    
    if (!altText) {
      throw new Error("No alt text generated");
    }
    
    return altText;
  } catch (error) {
    throw new Error("Failed to generate alt text: " + (error as Error).message);
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
            content: `You are a professional chemical formulator with expertise in industrial manufacturing. Generate detailed commercial formulations for the given product types with professional-grade specifications.

IMPORTANT: Return a JSON object with this exact structure:
{
  "formulations": [
    {
      "name": "Product Name",
      "description": "3-4 line professional description that introduces the product's purpose, mentions main function (e.g., soothing, cleansing, protecting), highlights key benefits for end users (e.g., reduces irritation, hydrates skin, improves shine), using simple non-technical language",
      "ingredients": [
        {
          "name": "Specific Ingredient Name",
          "inci": "Official INCI Name",
          "percentage": "X.X%",
          "function": "Detailed function in formulation"
        }
      ],
      "instructions": [
        {
          "phase": "Specific Phase Name (e.g., Water Phase, Oil Phase, Final Processing)",
          "steps": [
            "Detailed step with specific temperatures and timing",
            "Precise mixing instructions with equipment specifications", 
            "Quality control checkpoints and parameters"
          ]
        }
      ],
      "usageInstructions": "Detailed professional usage instructions with application methods and dosage",
      "phLevel": "Specific pH value or tight range (e.g., 6.5, 10.2)",
      "shelfLife": "Specific shelf life with storage conditions",
      "viscosity": "Specific viscosity measurement or description",
      "storageConditions": "Detailed storage requirements with temperature and humidity",
      "batchSize": "Professional batch size (e.g., 500 kg, 1000 L)",
      "processingTime": "Specific processing time with phases",
      "temperature": "Exact temperature requirements for each phase",
      "equipment": "Professional equipment list with specifications",
      "certification": "Industry certifications and compliance standards",
      "isActive": true
    }
  ]
}

ENHANCED GUIDELINES:
- Use authentic chemical ingredients with proper INCI nomenclature
- Percentages must add up to exactly 100% with realistic proportions
- Include category-specific ingredients (surfactants for cleaning, enzymes for detergents, emulsifiers for cosmetics)
- Provide detailed multi-phase manufacturing processes
- Ensure formulations meet industry safety and efficacy standards
- Include specific technical parameters (pH, viscosity, temperature, time)
- Make each formulation unique, practical, and production-ready`
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
          // Optimize the formulation name for SEO
          const optimizationResult = await optimizeFormulationName(
            formulation.name,
            categoryName,
            false // Use rule-based optimization for speed in bulk generation
          );
          
          formulations.push({
            name: capitalizeFormulationName(optimizationResult.optimizedName),
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
      
      // Create fallback formulations for failed batch using category-specific logic
      for (let j = 0; j < currentBatch.length && formulations.length < count; j++) {
        const productType = currentBatch[j];
        
        // Import and use the category-aware fallback from ai-category-specific
        const { getFallbackFormulation } = await import('./ai-category-specific');
        const fallbackFormulation = getFallbackFormulation(categoryName, productType);
        
        // Optimize the fallback formulation name for SEO
        const optimizationResult = await optimizeFormulationName(
          fallbackFormulation.name,
          categoryName,
          false
        );
        
        formulations.push({
          name: capitalizeFormulationName(optimizationResult.optimizedName),
          description: fallbackFormulation.description,
          ingredients: JSON.stringify(fallbackFormulation.ingredients),
          instructions: JSON.stringify(fallbackFormulation.instructions),
          usageInstructions: fallbackFormulation.usageInstructions,
          phLevel: fallbackFormulation.phLevel,
          shelfLife: fallbackFormulation.shelfLife,
          viscosity: fallbackFormulation.viscosity,
          storageConditions: fallbackFormulation.storageConditions,
          batchSize: fallbackFormulation.batchSize,
          processingTime: fallbackFormulation.processingTime,
          temperature: fallbackFormulation.temperature,
          equipment: fallbackFormulation.equipment,
          certification: fallbackFormulation.certification,
          isActive: true
        });
      }
    }
  }
  
  console.log(`🎉 Bulk generation completed! Generated ${formulations.length} formulations`);
  return formulations.slice(0, count); // Ensure we don't exceed requested count
}

export async function generateBulkFormulationsWithKeywords(categoryName: string, count: number, productTypes: string[], includeImages: boolean = false): Promise<Omit<InsertFormulation, 'categoryId'>[]> {
  console.log(`🧪 Generating ${count} bulk formulations with keywords for ${categoryName}...`);
  console.log(`Include images: ${includeImages}`);
  
  const formulations: Omit<InsertFormulation, 'categoryId'>[] = [];
  
  // Generate formulations one by one to handle image generation properly
  for (let i = 0; i < count; i++) {
    const productType = productTypes[i] || `Professional ${categoryName.toLowerCase()} formulation ${i + 1}`;
    
    try {
      console.log(`🔬 Generating formulation ${i + 1}/${count}: ${productType}`);
      
      // Use the existing single formulation generator with keywords support
      const formulation = await generateFormulationWithKeywords(categoryName, productType, includeImages);
      
      // Optimize the formulation name for SEO
      const optimizationResult = await optimizeFormulationName(
        formulation.name,
        categoryName,
        false // Use rule-based for speed in bulk generation
      );
      
      formulation.name = capitalizeFormulationName(optimizationResult.optimizedName);
      formulations.push(formulation);
      
      console.log(`✅ Generated formulation ${i + 1}/${count}: ${formulation.name}`);
      
      // Add a small delay between generations to respect rate limits (reduced from 1500ms to 300ms)
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
    } catch (error) {
      console.error(`❌ Failed to generate formulation ${i + 1}/${count}:`, error);
      
      // Create fallback formulation using category-specific logic
      const { getFallbackFormulation } = await import('./ai-category-specific');
      const fallbackFormulation = getFallbackFormulation(categoryName, productType);
      
      // Optimize the fallback formulation name for SEO
      const optimizationResult = await optimizeFormulationName(
        fallbackFormulation.name,
        categoryName,
        false
      );
      
      formulations.push({
        name: capitalizeFormulationName(optimizationResult.optimizedName),
        description: fallbackFormulation.description,
        image: includeImages ? "" : undefined,
        ingredients: JSON.stringify(fallbackFormulation.ingredients),
        instructions: JSON.stringify(fallbackFormulation.instructions),
        usageInstructions: fallbackFormulation.usageInstructions,
        phLevel: fallbackFormulation.phLevel,
        shelfLife: fallbackFormulation.shelfLife,
        viscosity: fallbackFormulation.viscosity,
        storageConditions: fallbackFormulation.storageConditions,
        batchSize: fallbackFormulation.batchSize,
        processingTime: fallbackFormulation.processingTime,
        temperature: fallbackFormulation.temperature,
        equipment: fallbackFormulation.equipment,
        certification: fallbackFormulation.certification,
        isActive: true
      });
    }
  }
  
  console.log(`🎉 Bulk generation with keywords completed! Generated ${formulations.length} formulations`);
  return formulations;
}

export async function generateFormulationImageWithReference(formulationName: string, brandName: string = "AIFormulator", referenceImageBase64?: string) {
  try {
    console.log(`🎨 Generating standalone image for: ${formulationName}${referenceImageBase64 ? ' with reference image' : ''}`);
    
    let imageResponse;
    
    if (referenceImageBase64) {
      // Generate with reference image using vision API
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this reference image carefully and create a DALL-E 3 prompt that incorporates specific visual elements from it. 

REQUIREMENTS for the generated image:
- Must have bold black text "${formulationName} Formulation" at the top
- Must have small text "${brandName}" at the bottom center
- Must have product-related icons in the center
- Must be flat 2D illustration style

REFERENCE IMAGE ANALYSIS NEEDED:
1. What specific colors, patterns, or design elements can be incorporated?
2. What is the composition style (geometric, organic, minimal, detailed)?
3. What visual elements (shapes, layouts, decorative elements) should be adapted?
4. What overall aesthetic mood should be maintained?

Create a detailed DALL-E prompt that specifically incorporates these visual elements from the reference image while maintaining the required text layout. Be very specific about colors, shapes, patterns, and design elements you see in the reference. Return only the DALL-E prompt.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${referenceImageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      });

      const customPrompt = visionResponse.choices[0]?.message?.content || 
        `Flat 2D digital illustration on a neutral beige background. Bold black text '${formulationName} Formulation' at the top, simple black product-related icons in the center, and small centered text '${brandName}' at the bottom. Clean, minimal, modern style inspired by uploaded reference image.`;
      
      console.log(`Generated custom prompt: ${customPrompt}`);
      
      imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: customPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard"
      });
    } else {
      // Generate with default specifications
      imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Flat 2D digital illustration on a neutral beige background. Bold black text '${formulationName} Formulation' at the top, simple black product-related icons in the center, and small centered text '${brandName}' at the bottom. Clean, minimal, modern style. No product bottles or packaging, just text and icons.`,
        n: 1,
        size: "1024x1024",
        quality: "standard"
      });
    }

    const tempImageUrl = imageResponse.data?.[0]?.url;
    if (!tempImageUrl) {
      throw new Error("No image URL received from OpenAI");
    }

    // Download and save the image permanently
    console.log(`📥 Downloading and saving image for: ${formulationName}`);
    try {
      const fetchResponse = await fetch(tempImageUrl);
      const imageBuffer = await fetchResponse.arrayBuffer();
      const fileName = `formulation-${generateSlug(formulationName)}-${Date.now()}.png`;
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Create images directory if it doesn't exist
      const imagesDir = path.join(process.cwd(), 'client', 'public', 'images', 'generated');
      await fs.mkdir(imagesDir, { recursive: true });
      
      // Save the image
      const filePath = path.join(imagesDir, fileName);
      await fs.writeFile(filePath, Buffer.from(imageBuffer));
      
      // Set the permanent URL
      const imageUrl = `/images/generated/${fileName}`;
      console.log(`💾 Image saved successfully: ${imageUrl}`);

      // Generate SEO metadata
      const seoData = {
        altText: `${formulationName} Formulation - Professional Chemical Formula by ${brandName}${referenceImageBase64 ? ' (Reference Style)' : ''}`,
        title: `${formulationName} Formulation | Professional Chemical Manufacturing`,
        description: `Professional ${formulationName.toLowerCase()} formulation design featuring clean, minimal flat illustration${referenceImageBase64 ? ' inspired by custom reference style' : ''}. Perfect for chemical manufacturing, product development, and professional documentation by ${brandName}.`,
        keywords: `${formulationName.toLowerCase()}, formulation, chemical formula, professional manufacturing, ${brandName.toLowerCase()}, product development, industrial chemistry`
      };

      return {
        imageUrl,
        fileName,
        seoData
      };
    } catch (saveError) {
      console.error("Failed to save image:", saveError);
      // Fall back to temporary URL with SEO data
      const seoData = {
        altText: `${formulationName} Formulation - Professional Chemical Formula by ${brandName}${referenceImageBase64 ? ' (Reference Style)' : ''}`,
        title: `${formulationName} Formulation | Professional Chemical Manufacturing`,
        description: `Professional ${formulationName.toLowerCase()} formulation design featuring clean, minimal flat illustration${referenceImageBase64 ? ' inspired by custom reference style' : ''}. Perfect for chemical manufacturing, product development, and professional documentation by ${brandName}.`,
        keywords: `${formulationName.toLowerCase()}, formulation, chemical formula, professional manufacturing, ${brandName.toLowerCase()}, product development, industrial chemistry`
      };

      return {
        imageUrl: tempImageUrl,
        fileName: `temp-${generateSlug(formulationName)}.png`,
        seoData
      };
    }
  } catch (error) {
    throw new Error(`Failed to generate formulation image with reference: ${(error as Error).message}`);
  }
}

export async function generateFormulationImage(formulationName: string, brandName: string = "AIFormulator") {
  try {
    console.log(`🎨 Generating standalone image for: ${formulationName}`);
    
    // Generate the image with exact specifications
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Flat 2D digital illustration on a neutral beige background. Bold black text '${formulationName} Formulation' at the top, simple black product-related icons in the center, and small centered text '${brandName}' at the bottom. Clean, minimal, modern style. No product bottles or packaging, just text and icons.`,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });

    const tempImageUrl = imageResponse.data?.[0]?.url;
    if (!tempImageUrl) {
      throw new Error("No image URL received from OpenAI");
    }

    // Download and save the image permanently
    console.log(`📥 Downloading and saving image for: ${formulationName}`);
    try {
      const imageResponse = await fetch(tempImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const fileName = `formulation-${generateSlug(formulationName)}-${Date.now()}.png`;
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Create images directory if it doesn't exist
      const imagesDir = path.join(process.cwd(), 'client', 'public', 'images', 'generated');
      await fs.mkdir(imagesDir, { recursive: true });
      
      // Save the image
      const filePath = path.join(imagesDir, fileName);
      await fs.writeFile(filePath, Buffer.from(imageBuffer));
      
      // Set the permanent URL
      const imageUrl = `/images/generated/${fileName}`;
      console.log(`💾 Image saved successfully: ${imageUrl}`);

      // Generate SEO metadata
      const seoData = {
        altText: `${formulationName} Formulation - Professional Chemical Formula by ${brandName}`,
        title: `${formulationName} Formulation | Professional Chemical Manufacturing`,
        description: `Professional ${formulationName.toLowerCase()} formulation design featuring clean, minimal flat illustration. Perfect for chemical manufacturing, product development, and professional documentation by ${brandName}.`,
        keywords: `${formulationName.toLowerCase()}, formulation, chemical formula, professional manufacturing, ${brandName.toLowerCase()}, product development, industrial chemistry`
      };

      return {
        imageUrl,
        fileName,
        seoData
      };
    } catch (saveError) {
      console.error("Failed to save image:", saveError);
      // Fall back to temporary URL with SEO data
      const seoData = {
        altText: `${formulationName} Formulation - Professional Chemical Formula by ${brandName}`,
        title: `${formulationName} Formulation | Professional Chemical Manufacturing`,
        description: `Professional ${formulationName.toLowerCase()} formulation design featuring clean, minimal flat illustration. Perfect for chemical manufacturing, product development, and professional documentation by ${brandName}.`,
        keywords: `${formulationName.toLowerCase()}, formulation, chemical formula, professional manufacturing, ${brandName.toLowerCase()}, product development, industrial chemistry`
      };

      return {
        imageUrl: tempImageUrl,
        fileName: `temp-${generateSlug(formulationName)}.png`,
        seoData
      };
    }
  } catch (error) {
    throw new Error(`Failed to generate formulation image: ${(error as Error).message}`);
  }
}

export async function generateFormulationWithKeywords(categoryName: string, productDescription: string, includeImage: boolean = false): Promise<Omit<InsertFormulation, 'categoryId'>> {
  // Use category-specific generation for better results
  if (categoryName.toLowerCase().includes('glass') || 
      categoryName.toLowerCase().includes('clean') ||
      categoryName.toLowerCase().includes('cosmetic') ||
      categoryName.toLowerCase().includes('skincare')) {
    try {
      const formulation = await generateCategorySpecificFormulation(categoryName, productDescription);
      
      // Optimize the formulation name for SEO
      const optimizationResult = await optimizeFormulationName(
        formulation.name,
        categoryName,
        false
      );
      formulation.name = optimizationResult.optimizedName;
      
      // Add image generation if requested
      if (includeImage) {
        try {
          console.log(`Generating image for: ${formulation.name}`);
          const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Flat 2D digital illustration on a neutral beige background. Bold black text '${formulation.name}' at the top, simple black product-related icons in the center, and small centered text 'AIFormulator' at the bottom. Clean, minimal, modern style. No product bottles or packaging, just text and icons.`,
            n: 1,
            size: "1024x1024",
            quality: "standard"
          });
          
          const tempImageUrl = imageResponse.data?.[0]?.url;
          if (tempImageUrl) {
            // Download and save the image permanently
            try {
              const imageResponse = await fetch(tempImageUrl);
              const imageBuffer = await imageResponse.arrayBuffer();
              const fileName = `formulation-${generateSlug(formulation.name)}-${Date.now()}.png`;
              const fs = await import('fs/promises');
              const path = await import('path');
              
              // Create images directory if it doesn't exist
              const imagesDir = path.join(process.cwd(), 'client', 'public', 'images', 'generated');
              await fs.mkdir(imagesDir, { recursive: true });
              
              // Save the image
              const filePath = path.join(imagesDir, fileName);
              await fs.writeFile(filePath, Buffer.from(imageBuffer));
              
              // Set the permanent URL
              formulation.image = `/images/generated/${fileName}`;
              console.log(`Image saved successfully: ${formulation.image}`);
            } catch (saveError) {
              console.error("Failed to save image:", saveError);
              formulation.image = tempImageUrl;
            }
          }
        } catch (error) {
          console.error("Failed to generate image:", error);
        }
      }
      
      return formulation;
    } catch (error) {
      console.error("Category-specific generation failed, falling back to generic:", error);
      // Fall back to original system if category-specific fails
    }
  }
  
  // Original generic generation code below
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
          content: `You are a professional chemical formulation expert with expertise in industrial manufacturing. Generate detailed commercial formulations with professional-grade specifications.
          
          IMPORTANT: The product name MUST include either "Formula" or "Formulation" in the title. Examples:
          - "Advanced Moisturizing Formula"
          - "Professional Cleansing Formulation" 
          - "Anti-Aging Serum Formula"
          - "Organic Skincare Formulation"
          
          Return JSON in this exact format:
          {
            "name": "Product Name with Formula/Formulation",
            "description": "3-4 line professional description that introduces the product's purpose, mentions main function (e.g., soothing, cleansing, protecting), highlights key benefits for end users (e.g., reduces irritation, hydrates skin, improves shine), using simple non-technical language",
            "ingredients": [
              {
                "name": "Specific Ingredient Name",
                "inci": "Official INCI Name",
                "percentage": "X.X%",
                "function": "Detailed function in formulation"
              }
            ],
            "instructions": [
              {
                "phase": "Specific Phase Name (e.g., Water Phase, Oil Phase, Final Processing)",
                "steps": [
                  "Detailed step with specific temperatures and timing",
                  "Precise mixing instructions with equipment specifications", 
                  "Quality control checkpoints and parameters"
                ]
              }
            ],
            "usageInstructions": "Detailed professional usage instructions with application methods and dosage",
            "phLevel": "Specific pH value or tight range (e.g., 6.5, 10.2)",
            "shelfLife": "Specific shelf life with storage conditions",
            "viscosity": "Specific viscosity measurement or description",
            "storageConditions": "Detailed storage requirements with temperature and humidity",
            "batchSize": "Professional batch size (e.g., 500 kg, 1000 L)",
            "processingTime": "Specific processing time with phases",
            "temperature": "Exact temperature requirements for each phase",
            "equipment": "Professional equipment list with specifications",
            "certification": "Industry certifications and compliance standards",
            "isActive": true
          }
          
          ENHANCED GUIDELINES:
          - Use authentic chemical ingredients with proper INCI nomenclature
          - Percentages must add up to exactly 100% with realistic proportions
          - Include category-specific ingredients (surfactants for cleaning, enzymes for detergents, emulsifiers for cosmetics)
          - Provide detailed multi-phase manufacturing processes
          - Ensure formulations meet industry safety and efficacy standards
          - Include specific technical parameters (pH, viscosity, temperature, time)
          - Make each formulation unique, practical, and production-ready
          
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
    
    // Optimize the formulation name for SEO
    const optimizationResult = await optimizeFormulationName(
      name,
      categoryName,
      false // Use rule-based for consistency
    );
    name = optimizationResult.optimizedName;
    
    // Generate image if requested
    let imageUrl = "";
    if (includeImage) {
      try {
        console.log(`Generating image for: ${name}`);
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: `Flat 2D digital illustration on a neutral beige background. Bold black text '${name}' at the top, simple black product-related icons in the center, and small centered text 'AIFormulator' at the bottom. Clean, minimal, modern style. No product bottles or packaging, just text and icons.`,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        });
        const tempImageUrl = imageResponse.data?.[0]?.url;
        if (tempImageUrl) {
          // Download and save the image permanently
          console.log(`Downloading and saving image for: ${name}`);
          try {
            const imageResponse = await fetch(tempImageUrl);
            const imageBuffer = await imageResponse.arrayBuffer();
            const fileName = `formulation-${generateSlug(name)}-${Date.now()}.png`;
            const fs = await import('fs/promises');
            const path = await import('path');
            
            // Create images directory if it doesn't exist
            const imagesDir = path.join(process.cwd(), 'client', 'public', 'images', 'generated');
            await fs.mkdir(imagesDir, { recursive: true });
            
            // Save the image
            const filePath = path.join(imagesDir, fileName);
            await fs.writeFile(filePath, Buffer.from(imageBuffer));
            
            // Set the permanent URL
            imageUrl = `/images/generated/${fileName}`;
            console.log(`Image saved successfully: ${imageUrl}`);
          } catch (saveError) {
            console.error("Failed to save image:", saveError);
            // Fall back to temporary URL
            imageUrl = tempImageUrl;
          }
        }
        console.log(`Image generated successfully: ${imageUrl ? 'Yes' : 'No'}`);
      } catch (error) {
        console.error("Failed to generate image for", name, ":", error);
        // Still continue with formulation creation even if image fails
      }
    }
    
    return {
      name: capitalizeFormulationName(name),
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
      name: capitalizeFormulationName(result.name),
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

// Generate product-specific properties dynamically based on product name and description
export async function generateProductProperties(request: { productName: string; productDescription?: string }): Promise<Array<{name: string, compulsory: boolean}>> {
  try {
    const { productName, productDescription = '' } = request;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a chemical industry expert specializing in product formulations. Generate 5-8 relevant special properties for the given product that would be important for manufacturers and end users.
          
          For each property, determine if it's COMPULSORY (essential/required for this product type) or OPTIONAL (nice-to-have enhancement).
          
          COMPULSORY properties are those that:
          - Are fundamental to the product's primary function
          - Are expected/required by industry standards
          - Are critical for safety or performance
          - Define the core characteristics of the product
          
          Focus on properties that are:
          - Specific to the product type and its intended use
          - Technically relevant for formulation development
          - Important for product performance and quality
          - Valuable for end users and manufacturers
          - Industry-standard terminology
          
          Examples:
          - Waterproof adhesive: "Waterproof" (COMPULSORY), "Heat resistant" (COMPULSORY), "Quick-setting" (OPTIONAL), "Flexible" (OPTIONAL)
          - Sunscreen: "UV protection" (COMPULSORY), "Water-resistant" (COMPULSORY), "Non-greasy" (OPTIONAL), "Fragrance-free" (OPTIONAL)
          - Shampoo: "Cleansing" (COMPULSORY), "pH balanced" (COMPULSORY), "Sulfate-free" (OPTIONAL), "Volumizing" (OPTIONAL)
          
          Return a JSON object with a 'properties' array where each item has 'name' and 'compulsory' fields:
          {
            "properties": [
              {"name": "Property 1", "compulsory": true},
              {"name": "Property 2", "compulsory": false},
              ...
            ]
          }`
        },
        {
          role: "user",
          content: `Product: ${productName}${productDescription ? `\nDescription: ${productDescription}` : ''}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const rawContent = response.choices[0].message.content || '{"properties":[]}';
    console.log(`🤖 AI Raw Response:`, rawContent);
    
    const result = JSON.parse(rawContent);
    
    // Handle new format with compulsory flag
    if (result.properties && Array.isArray(result.properties)) {
      const properties = result.properties.map((prop: any) => {
        if (typeof prop === 'string') {
          return { name: prop, compulsory: false };
        }
        return {
          name: prop.name || prop.property || String(prop),
          compulsory: prop.compulsory === true || prop.required === true || prop.essential === true
        };
      });
      return properties;
    }
    
    // Fallback: try to extract array from any property
    for (const key of Object.keys(result)) {
      if (Array.isArray(result[key])) {
        return result[key].map((prop: any) => {
          if (typeof prop === 'string') {
            return { name: prop, compulsory: false };
          }
          return {
            name: prop.name || prop.property || String(prop),
            compulsory: prop.compulsory === true || prop.required === true
          };
        });
      }
    }
    
    // Final fallback
    return [
      { name: 'Professional grade', compulsory: true },
      { name: 'High quality', compulsory: true },
      { name: 'Reliable performance', compulsory: false },
      { name: 'Industry standard', compulsory: false },
      { name: 'Optimized formula', compulsory: false }
    ];
    
  } catch (error) {
    console.error('Error generating product properties:', error);
    
    // Fallback properties
    return [
      { name: 'Professional grade', compulsory: true },
      { name: 'Enhanced formula', compulsory: false },
      { name: 'High quality', compulsory: true },
      { name: 'Reliable performance', compulsory: false },
      { name: 'Industry standard', compulsory: false }
    ];
  }
}