import OpenAI from 'openai';

interface OptimizationResult {
  originalName: string;
  optimizedName: string;
  needsOptimization: boolean;
  method: 'none' | 'rule-based' | 'ai-enhanced';
}

const LOW_VALUE_PATTERNS = [
  /\bformula?\b/i,
  /\brecipe\b/i,
  /\bhow to make\b/i,
  /\bsimple\b/i,
  /\bbasic\b/i,
  /\beasy\b/i,
  /\bdiy\b/i,
];

const QUALITY_DESCRIPTORS_BY_CATEGORY: Record<string, string[]> = {
  'cleaning': ['Professional', 'Ultra-Clean', 'Heavy-Duty', 'Commercial-Grade', 'Industrial-Strength'],
  'skincare': ['Advanced', 'Professional', 'Dermatologist-Grade', 'Clinical', 'Premium'],
  'beauty': ['Salon-Quality', 'Professional', 'Luxury', 'Premium', 'Pro-Grade'],
  'oral-care': ['Professional', 'Advanced', 'Clinical-Grade', 'Dental-Professional'],
  'construction': ['Industrial-Grade', 'Professional', 'Heavy-Duty', 'Commercial', 'Contractor-Grade'],
  'detergent': ['Commercial-Grade', 'Professional', 'Heavy-Duty', 'Industrial-Strength', 'Concentrated'],
  'automotive': ['Professional-Grade', 'Premium', 'Heavy-Duty', 'Industrial'],
  'pet-care': ['Professional', 'Veterinary-Grade', 'Premium', 'Advanced'],
  'hair': ['Salon-Professional', 'Premium', 'Professional-Grade', 'Luxury'],
  'default': ['Professional', 'Premium', 'Advanced', 'High-Performance', 'Industrial-Grade']
};

export function needsOptimization(name: string): boolean {
  if (name.length < 40) return true;
  
  const lowercaseName = name.toLowerCase();
  if (LOW_VALUE_PATTERNS.some(pattern => pattern.test(lowercaseName))) return true;
  
  const hasQualityDescriptor = Object.values(QUALITY_DESCRIPTORS_BY_CATEGORY)
    .flat()
    .some(descriptor => lowercaseName.includes(descriptor.toLowerCase()));
  
  if (!hasQualityDescriptor) return true;
  
  return false;
}

function getCategoryKey(categoryName: string): string {
  const lowercaseName = categoryName.toLowerCase();
  
  if (lowercaseName.includes('cleaning')) return 'cleaning';
  if (lowercaseName.includes('skin')) return 'skincare';
  if (lowercaseName.includes('beauty')) return 'beauty';
  if (lowercaseName.includes('oral')) return 'oral-care';
  if (lowercaseName.includes('construction')) return 'construction';
  if (lowercaseName.includes('detergent')) return 'detergent';
  if (lowercaseName.includes('automotive')) return 'automotive';
  if (lowercaseName.includes('pet')) return 'pet-care';
  if (lowercaseName.includes('hair')) return 'hair';
  
  return 'default';
}

function applyRuleBasedOptimization(name: string, categoryName: string): string {
  let optimized = name.trim();
  
  // Remove low-value patterns
  optimized = optimized.replace(/\bformulas?\b/gi, '');
  optimized = optimized.replace(/\bformulations?\b/gi, '');
  optimized = optimized.replace(/\brecipes?\b/gi, '');
  optimized = optimized.replace(/\bhow to make\b/gi, '');
  optimized = optimized.replace(/\s+/g, ' ').trim();
  
  const categoryKey = getCategoryKey(categoryName);
  const descriptors = QUALITY_DESCRIPTORS_BY_CATEGORY[categoryKey] || QUALITY_DESCRIPTORS_BY_CATEGORY.default;
  
  const hasDescriptor = descriptors.some(desc => 
    optimized.toLowerCase().includes(desc.toLowerCase())
  );
  
  if (!hasDescriptor) {
    const randomDescriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
    optimized = `${randomDescriptor} ${optimized}`;
  }
  
  // Capitalize properly
  const words = optimized.split(' ');
  optimized = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Always ensure name ends with "Formula" or "Formulation"
  const hasFormulaKeyword = /\b(formula|formulation)$/i.test(optimized);
  if (!hasFormulaKeyword) {
    // Use "Formula" as default keyword
    optimized = `${optimized} Formula`;
  }
  
  // Ensure it stays under 60 characters
  if (optimized.length > 60) {
    // Try to fit by using shorter "Formula" instead of "Formulation"
    optimized = optimized.replace(/\bFormulation$/i, 'Formula');
    if (optimized.length > 60) {
      // Truncate the middle part but keep descriptor and Formula
      const words = optimized.split(' ');
      if (words.length >= 3) {
        // Keep first word (descriptor), truncate middle, keep "Formula"
        const descriptor = words[0];
        const remaining = 60 - descriptor.length - 8; // 8 for " Formula"
        optimized = `${descriptor} ${optimized.substring(descriptor.length + 1, descriptor.length + 1 + remaining).trim()} Formula`;
      } else {
        optimized = optimized.substring(0, 57) + '...';
      }
    }
  }
  
  return optimized;
}

export async function optimizeFormulationName(
  originalName: string,
  categoryName: string,
  useAI: boolean = false
): Promise<OptimizationResult> {
  if (!needsOptimization(originalName)) {
    return {
      originalName,
      optimizedName: originalName,
      needsOptimization: false,
      method: 'none'
    };
  }
  
  const ruleBasedName = applyRuleBasedOptimization(originalName, categoryName);
  
  if (!useAI || ruleBasedName.length <= 60) {
    return {
      originalName,
      optimizedName: ruleBasedName,
      needsOptimization: true,
      method: 'rule-based'
    };
  }
  
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.warn('OpenAI API key not found, using rule-based optimization only');
      return {
        originalName,
        optimizedName: ruleBasedName,
        needsOptimization: true,
        method: 'rule-based'
      };
    }
    
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    const prompt = `You are a professional chemical formulation naming expert. Transform this low-quality formulation name into a professional, SEO-friendly name.

Original name: "${originalName}"
Category: ${categoryName}

Requirements:
1. Must be under 60 characters
2. Must be professional and industry-standard
3. Preserve the core product/use case from the original name
4. Add quality descriptors (e.g., Professional, Industrial-Grade, Premium)
5. Use proper capitalization
6. Do NOT use banned terms like "FDA-approved" or trademark names
7. For hazardous materials, include use-case qualifiers
8. MUST end with "Formula" or "Formulation" keyword

Return ONLY the optimized name, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 50,
    });

    let aiOptimizedName = completion.choices[0]?.message?.content?.trim() || ruleBasedName;
    
    // Ensure AI result also has Formula/Formulation keyword
    const hasFormulaKeyword = /\b(formula|formulation)$/i.test(aiOptimizedName);
    if (!hasFormulaKeyword) {
      aiOptimizedName = `${aiOptimizedName} Formula`;
    }
    
    if (aiOptimizedName.length > 60) {
      // Fallback to rule-based if AI result is too long
      return {
        originalName,
        optimizedName: ruleBasedName,
        needsOptimization: true,
        method: 'rule-based'
      };
    }
    
    return {
      originalName,
      optimizedName: aiOptimizedName,
      needsOptimization: true,
      method: 'ai-enhanced'
    };
  } catch (error) {
    console.error('AI optimization failed, falling back to rule-based:', error);
    return {
      originalName,
      optimizedName: ruleBasedName,
      needsOptimization: true,
      method: 'rule-based'
    };
  }
}
