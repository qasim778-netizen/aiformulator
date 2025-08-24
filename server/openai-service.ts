import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface FormulationRequest {
  name: string;
  productCategory: string;
  consistency: string;
  targetViscosity: string;
  specialProperties: string[];
  phLevel: string;
  shelfLife: string;
  storageTemperature: string;
  budgetCategory: string;
  productionVolume: string;
  regulatoryRequirements?: string;
  additionalNotes?: string;
}

export interface FormulationResponse {
  name: string;
  description: string;
  ingredients: Array<{
    name: string;
    percentage: number;
    function: string;
    supplier?: string;
    cost?: number;
  }>;
  manufacturingProcess: Array<{
    step: number;
    instruction: string;
    temperature?: string;
    duration?: string;
    equipment?: string;
  }>;
  qualityControl: Array<{
    parameter: string;
    specification: string;
    testMethod: string;
  }>;
  safetyConsiderations: Array<{
    hazard: string;
    precaution: string;
    ppe: string;
  }>;
  properties: {
    viscosity: string;
    phLevel: string;
    appearance: string;
    shelfLife: string;
    storageConditions: string;
  };
  costAnalysis: {
    totalCostPerKg: number;
    ingredientCosts: Array<{
      ingredient: string;
      costPerKg: number;
      percentage: number;
    }>;
    budgetCategory: string;
    profitability: string;
  };
  regulatoryNotes: string;
  variations?: Array<{
    name: string;
    modification: string;
    impact: string;
  }>;
}

export async function generateFormulation(
  request: FormulationRequest
): Promise<FormulationResponse> {
  const prompt = `
You are an expert chemical formulation scientist with 20+ years of experience in ${request.productCategory} product development. Create a comprehensive, professional formulation based on these specifications:

Product Details:
- Name: ${request.name}
- Category: ${request.productCategory}
- Consistency: ${request.consistency}
- Target Viscosity: ${request.targetViscosity}
- Special Properties: ${request.specialProperties.join(", ")}
- pH Level: ${request.phLevel}
- Shelf Life: ${request.shelfLife}
- Storage Temperature: ${request.storageTemperature}
- Budget Category: ${request.budgetCategory}
- Production Volume: ${request.productionVolume}
${request.regulatoryRequirements ? `- Regulatory Requirements: ${request.regulatoryRequirements}` : ''}
${request.additionalNotes ? `- Additional Notes: ${request.additionalNotes}` : ''}

Please provide a comprehensive formulation that includes:

1. **Complete ingredient list** with percentages (totaling 100%), functions, and supplier suggestions
2. **Step-by-step manufacturing process** with temperatures, durations, and equipment
3. **Quality control specifications** with test methods
4. **Safety considerations** with PPE requirements
5. **Physical/chemical properties** of the final product
6. **Detailed cost analysis** appropriate for ${request.budgetCategory} budget
7. **Regulatory compliance notes** for ${request.productCategory} products
8. **Possible variations** for customization

Ensure the formulation is:
- Technically sound and commercially viable
- Cost-optimized for ${request.budgetCategory} budget category
- Compliant with industry standards
- Scalable for ${request.productionVolume} production
- Safe for manufacturing and end-use

Respond ONLY with valid JSON in the exact format specified below, with no additional text or explanations.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional chemical formulation expert. Respond only with valid JSON containing comprehensive formulation data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 4000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response received from OpenAI");
    }

    const formulation = JSON.parse(response) as FormulationResponse;
    
    // Validate the response has required fields
    if (!formulation.name || !formulation.ingredients || !formulation.manufacturingProcess) {
      throw new Error("Invalid formulation response format");
    }

    return formulation;

  } catch (error) {
    console.error("OpenAI formulation generation error:", error);
    throw new Error(`Failed to generate formulation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateCostAnalysis(
  ingredients: Array<{ name: string; percentage: number }>,
  budgetCategory: string,
  productionVolume: string
): Promise<any> {
  const prompt = `
As a cost analysis expert for chemical manufacturing, provide a detailed cost breakdown for this formulation:

Ingredients: ${ingredients.map(ing => `${ing.name} (${ing.percentage}%)`).join(', ')}
Budget Category: ${budgetCategory}
Production Volume: ${productionVolume}

Provide realistic cost estimates including:
1. Individual ingredient costs per kg
2. Total formulation cost per kg
3. Manufacturing overhead estimates
4. Packaging and logistics costs
5. Profit margin recommendations
6. Break-even analysis
7. Competitive pricing analysis

Respond with valid JSON containing detailed cost data.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a chemical manufacturing cost analysis expert. Provide realistic cost estimates in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 1500,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No cost analysis response received");
    }

    return JSON.parse(response);

  } catch (error) {
    console.error("Cost analysis generation error:", error);
    throw new Error(`Failed to generate cost analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}