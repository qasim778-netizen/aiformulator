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

  // Batch generate multiple blog posts
  async generateBatchBlogPosts(topics: string[], targetKeywords: string[][] = [], shouldPublish: boolean = false): Promise<InsertBlogPost[]> {
    const blogPosts: InsertBlogPost[] = [];
    
    for (let i = 0; i < topics.length; i++) {
      try {
        const keywords = targetKeywords[i] || [];
        const blogPost = await this.createPublishableBlogPost(topics[i], keywords, shouldPublish);
        blogPosts.push(blogPost);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error generating blog post for topic "${topics[i]}":`, error);
      }
    }
    
    return blogPosts;
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