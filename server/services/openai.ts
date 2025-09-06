import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface CategorySuggestion {
  name: string;
  description: string;
  icon: string;
  reasoning: string;
}

export async function generateCategorySuggestions(existingCategories: string[]): Promise<CategorySuggestion[]> {
  try {
    const prompt = `Given these existing chemical formulation categories: ${existingCategories.join(', ')}

Please suggest 5 NEW categories that would be valuable for a chemical formulation database but are NOT already covered by the existing categories. 

Focus on:
- Manufacturing industries that need chemical formulations
- Product types that require specialized chemistry
- Market segments with unique formulation needs
- Emerging or specialized application areas

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "name": "Category Name",
      "description": "Brief description of what this category covers",
      "icon": "lucide-react icon name (like Beaker, Droplet, Zap, etc.)",
      "reasoning": "Why this category would be valuable to add"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4o as the latest available model
      messages: [
        {
          role: "system",
          content: "You are an expert in chemical formulations and manufacturing industries. Provide practical, market-relevant category suggestions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
    return result.suggestions || [];
  } catch (error) {
    console.error('Error generating category suggestions:', error);
    throw new Error('Failed to generate category suggestions');
  }
}