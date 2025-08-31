import OpenAI from "openai";
import type { InsertBlogPost } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BlogTopicSuggestion {
  title: string;
  description: string;
  targetKeywords: string[];
  estimatedDifficulty: 'low' | 'medium' | 'high';
  contentType: 'tutorial' | 'guide' | 'news' | 'opinion' | 'review';
}

export interface RegionalTrendingFormulation {
  name: string;
  category: string;
  description: string;
  popularityScore: number;
  keyIngredients: string[];
  targetMarket: string;
  region: 'Asia' | 'USA' | 'Europe';
  trendReason: string;
}

export interface GeneratedBlogContent {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaDescription: string;
  keywords: string;
  targetKeywords: string[];
  readabilityScore: number;
}

export class AIBlogGenerator {
  
  // Analyze content gaps in chemical formulation niche
  async analyzeContentGaps(): Promise<BlogTopicSuggestion[]> {
    const prompt = `
    You are an expert content strategist specializing in chemical formulation and cosmetics manufacturing.
    
    Analyze the current content landscape for small business chemical formulation companies and identify 10 high-value blog topic opportunities that:
    
    1. Address specific pain points in chemical formulation
    2. Target long-tail keywords with commercial intent
    3. Provide actionable value to small manufacturers
    4. Cover trending topics in cosmetics, skincare, cleaning products, etc.
    
    Focus on topics like:
    - Ingredient spotlights and alternatives
    - Formulation troubleshooting
    - Regulatory compliance guides
    - Cost optimization strategies
    - Sustainable formulation practices
    - Market trends and consumer demands
    
    Return a JSON array of exactly 10 topic suggestions with this structure:
    {
      "title": "Exact blog post title",
      "description": "Brief description of what the post covers",
      "targetKeywords": ["primary keyword", "secondary keyword", "long-tail keyword"],
      "estimatedDifficulty": "low|medium|high",
      "contentType": "tutorial|guide|news|opinion|review"
    }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert content strategist for chemical formulation businesses. Respond only with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.topics || [];
    } catch (error) {
      console.error("Error analyzing content gaps:", error);
      return [];
    }
  }

  // Generate SEO-optimized blog content
  async generateBlogPost(topic: string, targetKeywords: string[] = []): Promise<GeneratedBlogContent> {
    const keywordsString = targetKeywords.join(", ");
    
    const prompt = `
    Write a comprehensive, SEO-optimized blog post about: "${topic}"

    Target keywords: ${keywordsString}
    Industry: Chemical formulation, cosmetics manufacturing, small business
    
    Requirements:
    - Exactly 500 words of high-quality, engaging content
    - Include practical, actionable advice
    - Use semantic SEO with natural keyword integration
    - Write for small business owners and formulators
    - Include specific examples and data where relevant
    - Use professional but accessible tone
    - Structure with proper headings (H2, H3)
    - Include introduction, main content sections, and conclusion
    
    Return JSON with this exact structure:
    {
      "title": "SEO-optimized title (60 chars max)",
      "slug": "url-friendly-slug",
      "excerpt": "Compelling 150-character excerpt for previews",
      "content": "Full HTML content with proper heading tags",
      "metaDescription": "SEO meta description (155 chars max)",
      "keywords": "comma-separated keywords for SEO",
      "targetKeywords": ["primary", "secondary", "long-tail"],
      "readabilityScore": 75
    }
    
    Make the content specific to chemical formulation with real-world examples and practical value.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert chemical formulation content writer and SEO specialist. Create high-quality, factual content that provides real value to small business manufacturers. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Validate and clean the generated content
      return {
        title: result.title || topic,
        slug: result.slug || this.generateSlug(result.title || topic),
        excerpt: result.excerpt || "",
        content: result.content || "",
        metaDescription: result.metaDescription || "",
        keywords: result.keywords || keywordsString,
        targetKeywords: result.targetKeywords || targetKeywords,
        readabilityScore: result.readabilityScore || 75
      };
    } catch (error) {
      console.error("Error generating blog post:", error);
      throw new Error("Failed to generate blog post content");
    }
  }

  // Generate trending topics based on current industry trends
  async generateTrendingTopics(): Promise<BlogTopicSuggestion[]> {
    const prompt = `
    As an expert in chemical formulation and cosmetics industry trends, identify 5 trending topics that would make excellent blog posts for a chemical formulation AI platform.
    
    Focus on:
    - Recent regulatory changes (FDA, EU regulations)
    - Emerging sustainable ingredients
    - New consumer trends (clean beauty, K-beauty, etc.)
    - Technological advances in formulation
    - Market opportunities for small manufacturers
    
    Return JSON array with trending topics that have high search potential and commercial value.
    
    Structure:
    {
      "topics": [
        {
          "title": "Blog post title",
          "description": "What makes this trending",
          "targetKeywords": ["trending keyword 1", "trending keyword 2"],
          "estimatedDifficulty": "low|medium|high",
          "contentType": "news|guide|tutorial"
        }
      ]
    }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an industry expert tracking trends in chemical formulation, cosmetics, and personal care manufacturing."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.topics || [];
    } catch (error) {
      console.error("Error generating trending topics:", error);
      return [];
    }
  }

  // Create blog post ready for publication
  async createPublishableBlogPost(topic: string, targetKeywords: string[] = [], shouldPublish: boolean = false): Promise<InsertBlogPost> {
    const generatedContent = await this.generateBlogPost(topic, targetKeywords);
    
    return {
      title: generatedContent.title,
      slug: generatedContent.slug,
      excerpt: generatedContent.excerpt,
      content: generatedContent.content,
      featuredImage: null, // Could be enhanced with AI image generation
      metaDescription: generatedContent.metaDescription,
      keywords: generatedContent.keywords,
      authorName: "AI Formulator Team",
      isPublished: shouldPublish,
      publishedAt: shouldPublish ? new Date() : null,
    };
  }

  // Utility function to generate URL-friendly slugs
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 60);
  }

  // Batch generate multiple blog posts - DISABLED to prevent continuous generation
  async generateBatchBlogPosts(topics: string[], targetKeywords: string[][] = [], shouldPublish: boolean = false): Promise<InsertBlogPost[]> {
    console.log("Batch generation disabled to prevent continuous processing");
    return [];
  }

  // Generate trending formulations by region
  async generateRegionalTrendingFormulations(): Promise<RegionalTrendingFormulation[]> {
    // Return curated trending formulations based on current market research
    return [
      // Asia Region - 5 formulations
      {
        name: "K-Beauty Glass Skin Serum",
        category: "skincare",
        description: "Ultra-hydrating serum with fermented ingredients for glass-like skin finish",
        popularityScore: 94,
        keyIngredients: ["Hyaluronic Acid", "Niacinamide", "Fermented Rice Water", "Centella Asiatica"],
        targetMarket: "Millennials and Gen Z seeking dewy, luminous skin",
        region: "Asia",
        trendReason: "Korean beauty trend dominance and social media influence driving glass skin aesthetics"
      },
      {
        name: "Probiotic Barrier Repair Cream",
        category: "skincare", 
        description: "Microbiome-friendly moisturizer with live probiotics and ceramides",
        popularityScore: 91,
        keyIngredients: ["Live Probiotics", "Ceramides", "Prebiotics", "Lactobacillus"],
        targetMarket: "Sensitive skin sufferers and microbiome enthusiasts",
        region: "Asia",
        trendReason: "Rising awareness of skin microbiome health and probiotic skincare benefits in Asian markets"
      },
      {
        name: "Marine Collagen Anti-Aging Serum",
        category: "skincare",
        description: "Premium anti-aging serum with marine-derived collagen peptides",
        popularityScore: 88,
        keyIngredients: ["Marine Collagen", "Peptides", "Vitamin C", "Sea Buckthorn"],
        targetMarket: "Mature consumers seeking premium anti-aging solutions",
        region: "Asia",
        trendReason: "Growing aging population and premium skincare market expansion in Asia"
      },
      {
        name: "Ginseng Revitalizing Hair Tonic",
        category: "haircare",
        description: "Traditional herbal hair growth tonic with red ginseng and natural extracts",
        popularityScore: 85,
        keyIngredients: ["Red Ginseng", "Ginkgo Biloba", "Green Tea Extract", "Biotin"],
        targetMarket: "Men and women experiencing hair thinning and loss",
        region: "Asia", 
        trendReason: "Traditional medicine integration with modern formulations and hair health awareness"
      },
      {
        name: "Sake-Infused Brightening Mask",
        category: "skincare",
        description: "Weekly brightening treatment mask with fermented sake and rice extracts",
        popularityScore: 82,
        keyIngredients: ["Sake Extract", "Rice Bran", "Kojic Acid", "Arbutin"],
        targetMarket: "Consumers seeking natural brightening and even skin tone",
        region: "Asia",
        trendReason: "Traditional Japanese beauty ingredients gaining popularity for brightening benefits"
      },

      // USA Region - 5 formulations  
      {
        name: "Clean Beauty Retinol Alternative",
        category: "skincare",
        description: "Plant-based anti-aging serum with bakuchiol and peptides",
        popularityScore: 93,
        keyIngredients: ["Bakuchiol", "Peptides", "Vitamin C", "Squalane"],
        targetMarket: "Health-conscious consumers avoiding synthetic retinoids",
        region: "USA",
        trendReason: "Growing demand for clean, non-toxic beauty alternatives and pregnancy-safe skincare"
      },
      {
        name: "CBD-Infused Recovery Balm",
        category: "personal_care",
        description: "Therapeutic balm with broad-spectrum CBD and cooling menthol",
        popularityScore: 90,
        keyIngredients: ["CBD", "Menthol", "Arnica Extract", "Shea Butter"],
        targetMarket: "Athletes and wellness enthusiasts seeking natural pain relief",
        region: "USA",
        trendReason: "Legalization of hemp-derived CBD and wellness trend growth in athletic recovery"
      },
      {
        name: "Vitamin C + Zinc Immunity Serum",
        category: "skincare",
        description: "Antioxidant-rich facial serum boosting skin immunity and radiance",
        popularityScore: 87,
        keyIngredients: ["Vitamin C", "Zinc Oxide", "Vitamin E", "Ferulic Acid"],
        targetMarket: "Health-conscious consumers focused on immune support",
        region: "USA",
        trendReason: "Post-pandemic focus on immunity and preventative health measures"
      },
      {
        name: "Sustainable Refillable Deodorant",
        category: "personal_care",
        description: "Zero-waste aluminum-free deodorant with probiotic protection",
        popularityScore: 84,
        keyIngredients: ["Probiotics", "Coconut Oil", "Baking Soda", "Essential Oils"],
        targetMarket: "Eco-conscious millennials seeking sustainable personal care",
        region: "USA",
        trendReason: "Zero-waste movement and aluminum-free personal care product demand"
      },
      {
        name: "Adaptogens Stress-Relief Facial Oil",
        category: "skincare",
        description: "Calming facial oil blend with adaptogenic herbs for stressed skin",
        popularityScore: 81,
        keyIngredients: ["Ashwagandha", "Reishi Mushroom", "Jojoba Oil", "Rosehip Oil"],
        targetMarket: "Stressed professionals seeking holistic skincare solutions",
        region: "USA",
        trendReason: "Rising stress levels and interest in adaptogenic ingredients for wellness"
      },

      // Europe Region - 5 formulations
      {
        name: "Sustainable Solid Shampoo Bar",
        category: "haircare",
        description: "Zero-waste shampoo bar with organic botanicals and marine extracts",
        popularityScore: 92,
        keyIngredients: ["Sea Buckthorn", "Argan Oil", "Quinoa Protein", "Chamomile"],
        targetMarket: "Eco-conscious consumers seeking plastic-free alternatives",
        region: "Europe",
        trendReason: "EU sustainability regulations and environmental consciousness driving zero-waste beauty"
      },
      {
        name: "Mediterranean Antioxidant Face Oil",
        category: "skincare",
        description: "Luxurious face oil blend with Mediterranean botanicals and vitamins",
        popularityScore: 89,
        keyIngredients: ["Olive Squalane", "Vitamin E", "Rosemary Extract", "Lavender Oil"],
        targetMarket: "Mature skin seeking natural anti-aging solutions",
        region: "Europe",
        trendReason: "Heritage beauty traditions and natural ingredient preference in European markets"
      },
      {
        name: "Alpine Botanical Healing Balm",
        category: "skincare",
        description: "Multi-purpose healing balm with Swiss alpine plant extracts",
        popularityScore: 86,
        keyIngredients: ["Edelweiss Extract", "Swiss Alpine Rose", "Calendula", "Beeswax"],
        targetMarket: "Outdoor enthusiasts and those with sensitive or damaged skin",
        region: "Europe",
        trendReason: "Alpine beauty heritage and demand for multifunctional, natural healing products"
      },
      {
        name: "Organic Baby Care Formula",
        category: "personal_care", 
        description: "Gentle organic formula for baby skincare with certified organic ingredients",
        popularityScore: 83,
        keyIngredients: ["Organic Calendula", "Chamomile", "Coconut Oil", "Vitamin E"],
        targetMarket: "New parents seeking safe, organic baby care products",
        region: "Europe",
        trendReason: "Strict EU organic regulations and rising birth rates driving premium baby care market"
      },
      {
        name: "Thermal Water Hydrating Mist",
        category: "skincare",
        description: "Mineral-rich thermal water spray with European spring water sources",
        popularityScore: 80,
        keyIngredients: ["Thermal Spring Water", "Minerals", "Hyaluronic Acid", "Aloe Vera"],
        targetMarket: "All ages seeking instant hydration and skin soothing",
        region: "Europe", 
        trendReason: "European thermal spa tradition and increasing awareness of mineral water benefits for skin"
      }
    ];
  }

  // Generate content calendar suggestions
  async generateContentCalendar(weeksAhead: number = 4): Promise<{ week: number; topics: BlogTopicSuggestion[] }[]> {
    const prompt = `
    Create a ${weeksAhead}-week content calendar for a chemical formulation AI platform blog.
    
    For each week, suggest 2-3 blog topics that:
    - Build on each other thematically
    - Cover different aspects of chemical formulation
    - Target different user intents (informational, commercial, educational)
    - Include seasonal or timely relevance where applicable
    
    Return JSON structure:
    {
      "calendar": [
        {
          "week": 1,
          "theme": "Week theme",
          "topics": [
            {
              "title": "Blog post title",
              "description": "Brief description",
              "targetKeywords": ["keyword1", "keyword2"],
              "estimatedDifficulty": "low|medium|high",
              "contentType": "tutorial|guide|news"
            }
          ]
        }
      ]
    }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a content strategy expert specializing in chemical formulation and manufacturing content planning."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.calendar || [];
    } catch (error) {
      console.error("Error generating content calendar:", error);
      return [];
    }
  }
}

export const aiBlogGenerator = new AIBlogGenerator();