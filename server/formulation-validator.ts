/**
 * Formulation Validation Module
 * Validates chemical formulations against industrial standards
 */

export interface ValidationResult {
  isValid: boolean;
  overallScore: number;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  suggestions: string[];
  summary: string;
}

export interface ValidationIssue {
  type: 'critical' | 'major' | 'minor';
  category: string;
  message: string;
  ingredient?: string;
  actualValue?: number;
  expectedRange?: string;
}

export interface ValidationWarning {
  category: string;
  message: string;
  suggestion?: string;
}

export interface ParsedIngredient {
  name: string;
  inci: string;
  percentage: number;
  function: string;
  type: IngredientType;
}

export type IngredientType = 
  | 'base'
  | 'surfactant'
  | 'emulsifier'
  | 'thickener'
  | 'humectant'
  | 'active'
  | 'preservative'
  | 'ph_adjuster'
  | 'fragrance'
  | 'chelating'
  | 'colorant'
  | 'other';

const INGREDIENT_LIMITS: Record<IngredientType, { min: number; max: number; label: string }> = {
  base: { min: 50, max: 85, label: 'Base Ingredients (Water/Solvents)' },
  surfactant: { min: 5, max: 30, label: 'Surfactants' },
  emulsifier: { min: 1, max: 8, label: 'Emulsifiers' },
  thickener: { min: 0.1, max: 5, label: 'Thickeners' },
  humectant: { min: 1, max: 15, label: 'Humectants/Moisturizers' },
  active: { min: 0.1, max: 15, label: 'Active Ingredients' },
  preservative: { min: 0.1, max: 1.5, label: 'Preservatives' },
  ph_adjuster: { min: 0.01, max: 1, label: 'pH Adjusters' },
  fragrance: { min: 0.1, max: 3, label: 'Fragrances' },
  chelating: { min: 0.01, max: 0.5, label: 'Chelating Agents' },
  colorant: { min: 0.001, max: 0.5, label: 'Colorants' },
  other: { min: 0.1, max: 10, label: 'Other Ingredients' }
};

const BASE_INGREDIENTS = [
  'aqua', 'water', 'purified water', 'deionized water', 'distilled water',
  'alcohol', 'ethanol', 'isopropyl alcohol', 'alcohol denat',
  'propylene glycol', 'butylene glycol'
];

const SURFACTANTS = [
  'sodium lauryl sulfate', 'sodium laureth sulfate', 'sles', 'sls',
  'cocamidopropyl betaine', 'decyl glucoside', 'coco glucoside',
  'lauryl glucoside', 'sodium cocoyl isethionate', 'sodium lauroyl sarcosinate',
  'cocamide mea', 'cocamide dea', 'lauramide dea', 'sodium cocoamphoacetate',
  'disodium cocoamphodiacetate', 'polysorbate 20', 'polysorbate 80',
  'cetrimonium chloride', 'behentrimonium chloride', 'stearamidopropyl dimethylamine'
];

const EMULSIFIERS = [
  'cetearyl alcohol', 'cetyl alcohol', 'stearyl alcohol',
  'glyceryl stearate', 'glyceryl monostearate', 'peg-100 stearate',
  'ceteareth-20', 'polysorbate 60', 'sorbitan stearate',
  'emulsifying wax', 'lecithin', 'stearic acid',
  'glyceryl stearate se', 'olivem 1000', 'montanov 68'
];

const THICKENERS = [
  'carbomer', 'carbopol', 'xanthan gum', 'guar gum', 'hydroxyethylcellulose',
  'hydroxypropyl methylcellulose', 'sodium carboxymethyl cellulose',
  'acrylates/c10-30 alkyl acrylate crosspolymer', 'cellulose gum',
  'sodium alginate', 'carrageenan', 'gelatin', 'pectin'
];

const HUMECTANTS = [
  'glycerin', 'glycerine', 'propylene glycol', 'butylene glycol',
  'sodium hyaluronate', 'hyaluronic acid', 'sorbitol', 'panthenol',
  'sodium pca', 'urea', 'honey', 'aloe vera', 'betaine',
  'trehalose', 'glycine'
];

const PRESERVATIVES = [
  'phenoxyethanol', 'methylparaben', 'propylparaben', 'ethylparaben',
  'butylparaben', 'benzisothiazolinone', 'methylisothiazolinone',
  'dmdm hydantoin', 'imidazolidinyl urea', 'diazolidinyl urea',
  'sodium benzoate', 'potassium sorbate', 'benzyl alcohol',
  'dehydroacetic acid', 'chlorphenesin', 'caprylyl glycol',
  'ethylhexylglycerin', 'optiphen', 'germaben', 'germall'
];

const PH_ADJUSTERS = [
  'citric acid', 'sodium hydroxide', 'potassium hydroxide',
  'triethanolamine', 'tromethamine', 'lactic acid', 'phosphoric acid',
  'sodium citrate', 'aminomethyl propanol', 'amp'
];

const FRAGRANCES = [
  'parfum', 'fragrance', 'essential oil', 'lavender oil',
  'peppermint oil', 'tea tree oil', 'eucalyptus oil', 'lemon oil',
  'orange oil', 'rose oil', 'jasmine', 'sandalwood', 'vanilla'
];

const CHELATING_AGENTS = [
  'disodium edta', 'tetrasodium edta', 'edta', 'phytic acid',
  'sodium phytate', 'citric acid', 'gluconic acid', 'sodium gluconate'
];

const COLORANTS = [
  'ci ', 'fd&c', 'd&c', 'titanium dioxide', 'iron oxide',
  'mica', 'ultramarine', 'carmine', 'annatto', 'beta-carotene',
  'chlorophyll', 'caramel'
];

function detectIngredientType(name: string, inci: string, functionText: string): IngredientType {
  const searchText = `${name} ${inci} ${functionText}`.toLowerCase();
  
  if (BASE_INGREDIENTS.some(base => searchText.includes(base.toLowerCase()))) return 'base';
  if (SURFACTANTS.some(s => searchText.includes(s.toLowerCase()))) return 'surfactant';
  if (EMULSIFIERS.some(e => searchText.includes(e.toLowerCase()))) return 'emulsifier';
  if (THICKENERS.some(t => searchText.includes(t.toLowerCase()))) return 'thickener';
  if (HUMECTANTS.some(h => searchText.includes(h.toLowerCase()))) return 'humectant';
  if (PRESERVATIVES.some(p => searchText.includes(p.toLowerCase()))) return 'preservative';
  if (PH_ADJUSTERS.some(ph => searchText.includes(ph.toLowerCase()))) return 'ph_adjuster';
  if (FRAGRANCES.some(f => searchText.includes(f.toLowerCase()))) return 'fragrance';
  if (CHELATING_AGENTS.some(c => searchText.includes(c.toLowerCase()))) return 'chelating';
  if (COLORANTS.some(c => searchText.includes(c.toLowerCase()))) return 'colorant';
  
  if (functionText.toLowerCase().includes('surfactant') || 
      functionText.toLowerCase().includes('cleansing') ||
      functionText.toLowerCase().includes('foaming')) return 'surfactant';
  if (functionText.toLowerCase().includes('emulsif')) return 'emulsifier';
  if (functionText.toLowerCase().includes('thicken') || 
      functionText.toLowerCase().includes('viscosity')) return 'thickener';
  if (functionText.toLowerCase().includes('moistur') || 
      functionText.toLowerCase().includes('humectant') ||
      functionText.toLowerCase().includes('hydrat')) return 'humectant';
  if (functionText.toLowerCase().includes('preserv') || 
      functionText.toLowerCase().includes('antimicrob')) return 'preservative';
  if (functionText.toLowerCase().includes('ph ') || 
      functionText.toLowerCase().includes('buffer') ||
      functionText.toLowerCase().includes('neutraliz')) return 'ph_adjuster';
  if (functionText.toLowerCase().includes('fragrance') || 
      functionText.toLowerCase().includes('scent') ||
      functionText.toLowerCase().includes('aroma')) return 'fragrance';
  if (functionText.toLowerCase().includes('chelat') || 
      functionText.toLowerCase().includes('sequester')) return 'chelating';
  if (functionText.toLowerCase().includes('color') || 
      functionText.toLowerCase().includes('pigment') ||
      functionText.toLowerCase().includes('dye')) return 'colorant';
  if (functionText.toLowerCase().includes('active') || 
      functionText.toLowerCase().includes('anti-') ||
      functionText.toLowerCase().includes('vitamin') ||
      functionText.toLowerCase().includes('enzyme') ||
      functionText.toLowerCase().includes('extract')) return 'active';
  
  return 'other';
}

function parsePercentage(percentage: string): number {
  if (!percentage) return 0;
  const cleaned = percentage.replace('%', '').replace(',', '.').trim();
  const match = cleaned.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

export function parseIngredients(ingredientsJson: string): ParsedIngredient[] {
  try {
    const ingredients = JSON.parse(ingredientsJson);
    if (!Array.isArray(ingredients)) return [];
    
    return ingredients.map(ing => ({
      name: ing.name || '',
      inci: ing.inci || '',
      percentage: parsePercentage(ing.percentage),
      function: ing.function || '',
      type: detectIngredientType(ing.name || '', ing.inci || '', ing.function || '')
    }));
  } catch (error) {
    console.error('Failed to parse ingredients:', error);
    return [];
  }
}

export function validateFormulation(
  ingredientsJson: string,
  productType?: string,
  phLevel?: string
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];
  
  const ingredients = parseIngredients(ingredientsJson);
  
  if (ingredients.length === 0) {
    return {
      isValid: false,
      overallScore: 0,
      issues: [{
        type: 'critical',
        category: 'Structure',
        message: 'No ingredients found in the formulation'
      }],
      warnings: [],
      suggestions: ['Ensure the formulation includes at least 6-12 ingredients'],
      summary: 'Invalid formulation: No ingredients found'
    };
  }
  
  const totalPercentage = ingredients.reduce((sum, ing) => sum + ing.percentage, 0);
  const roundedTotal = Math.round(totalPercentage * 10) / 10;
  
  if (roundedTotal < 99.5 || roundedTotal > 100.5) {
    issues.push({
      type: 'critical',
      category: 'Percentage Sum',
      message: `Total percentage is ${roundedTotal}% instead of 100%`,
      actualValue: roundedTotal,
      expectedRange: '100%'
    });
  } else if (roundedTotal < 99.9 || roundedTotal > 100.1) {
    warnings.push({
      category: 'Percentage Sum',
      message: `Total percentage is ${roundedTotal}% - close to 100% but could be more precise`
    });
  }
  
  const typeGroups: Record<IngredientType, ParsedIngredient[]> = {
    base: [], surfactant: [], emulsifier: [], thickener: [],
    humectant: [], active: [], preservative: [], ph_adjuster: [],
    fragrance: [], chelating: [], colorant: [], other: []
  };
  
  ingredients.forEach(ing => {
    typeGroups[ing.type].push(ing);
  });
  
  const baseTotal = typeGroups.base.reduce((sum, ing) => sum + ing.percentage, 0);
  const limits = INGREDIENT_LIMITS.base;
  
  if (baseTotal < limits.min) {
    issues.push({
      type: 'major',
      category: 'Base Ingredients',
      message: `Base ingredients (water/solvents) total is ${baseTotal.toFixed(1)}% - should be at least ${limits.min}%`,
      actualValue: baseTotal,
      expectedRange: `${limits.min}-${limits.max}%`
    });
    suggestions.push('Increase water/aqua content to at least 50-60% for most formulations');
  }
  
  (Object.keys(typeGroups) as IngredientType[]).forEach(type => {
    if (type === 'other') return;
    
    const group = typeGroups[type];
    const groupTotal = group.reduce((sum, ing) => sum + ing.percentage, 0);
    const typeLimits = INGREDIENT_LIMITS[type];
    
    if (groupTotal > 0 && groupTotal > typeLimits.max) {
      const severity = groupTotal > typeLimits.max * 1.5 ? 'major' : 'minor';
      issues.push({
        type: severity,
        category: typeLimits.label,
        message: `${typeLimits.label} total is ${groupTotal.toFixed(2)}% - exceeds maximum of ${typeLimits.max}%`,
        actualValue: groupTotal,
        expectedRange: `${typeLimits.min}-${typeLimits.max}%`
      });
    }
    
    group.forEach(ing => {
      if (ing.percentage > typeLimits.max) {
        issues.push({
          type: 'major',
          category: typeLimits.label,
          message: `${ing.name} at ${ing.percentage}% exceeds the ${typeLimits.max}% limit for ${type}`,
          ingredient: ing.name,
          actualValue: ing.percentage,
          expectedRange: `${typeLimits.min}-${typeLimits.max}%`
        });
      }
    });
  });
  
  const preservativeTotal = typeGroups.preservative.reduce((sum, ing) => sum + ing.percentage, 0);
  if (preservativeTotal > 1.5) {
    issues.push({
      type: 'critical',
      category: 'Preservatives',
      message: `Preservative total is ${preservativeTotal.toFixed(2)}% - exceeds regulatory maximum of 1.5%`,
      actualValue: preservativeTotal,
      expectedRange: '0.1-1.5%'
    });
  } else if (preservativeTotal === 0 && ingredients.length > 3) {
    warnings.push({
      category: 'Preservatives',
      message: 'No preservative detected - formulation may have stability issues',
      suggestion: 'Consider adding a preservative system (0.5-1% phenoxyethanol or natural alternatives)'
    });
  }
  
  typeGroups.preservative.forEach(ing => {
    const name = ing.name.toLowerCase();
    if (name.includes('phenoxyethanol') && ing.percentage > 1) {
      issues.push({
        type: 'critical',
        category: 'Regulatory Compliance',
        message: `Phenoxyethanol at ${ing.percentage}% exceeds regulatory limit of 1%`,
        ingredient: ing.name,
        actualValue: ing.percentage,
        expectedRange: '0.5-1%'
      });
    }
    if (name.includes('methylisothiazolinone') && ing.percentage > 0.0015) {
      issues.push({
        type: 'critical',
        category: 'Regulatory Compliance',
        message: 'Methylisothiazolinone is banned in leave-on products in EU/US',
        ingredient: ing.name
      });
    }
  });
  
  if (ingredients.length < 5) {
    warnings.push({
      category: 'Formulation Completeness',
      message: `Only ${ingredients.length} ingredients - professional formulations typically have 6-12 ingredients`
    });
  }
  
  ingredients.forEach(ing => {
    if (ing.percentage > 0 && ing.percentage < 0.001) {
      warnings.push({
        category: 'Practical Dosing',
        message: `${ing.name} at ${ing.percentage}% may be too small to measure accurately in production`
      });
    }
  });
  
  let score = 100;
  issues.forEach(issue => {
    if (issue.type === 'critical') score -= 30;
    else if (issue.type === 'major') score -= 15;
    else score -= 5;
  });
  warnings.forEach(() => score -= 2);
  score = Math.max(0, Math.min(100, score));
  
  const isValid = issues.filter(i => i.type === 'critical').length === 0 && score >= 60;
  
  let summary: string;
  if (score >= 90) {
    summary = 'Excellent formulation - meets industrial standards';
  } else if (score >= 75) {
    summary = 'Good formulation with minor improvements recommended';
  } else if (score >= 60) {
    summary = 'Acceptable formulation - some adjustments needed';
  } else if (score >= 40) {
    summary = 'Formulation needs significant improvements';
  } else {
    summary = 'Formulation does not meet industrial standards';
  }
  
  return {
    isValid,
    overallScore: score,
    issues,
    warnings,
    suggestions,
    summary
  };
}

export function getValidationReport(result: ValidationResult): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('         FORMULATION VALIDATION REPORT');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
  lines.push(`Score: ${result.overallScore}/100`);
  lines.push(`Summary: ${result.summary}`);
  lines.push('');
  
  if (result.issues.length > 0) {
    lines.push('─────────────────────────────────────────────────────────────────');
    lines.push('ISSUES FOUND:');
    lines.push('─────────────────────────────────────────────────────────────────');
    result.issues.forEach((issue, idx) => {
      const icon = issue.type === 'critical' ? '🔴' : issue.type === 'major' ? '🟠' : '🟡';
      lines.push(`${idx + 1}. ${icon} [${issue.type.toUpperCase()}] ${issue.category}`);
      lines.push(`   ${issue.message}`);
      if (issue.expectedRange) {
        lines.push(`   Expected: ${issue.expectedRange}`);
      }
    });
    lines.push('');
  }
  
  if (result.warnings.length > 0) {
    lines.push('─────────────────────────────────────────────────────────────────');
    lines.push('WARNINGS:');
    lines.push('─────────────────────────────────────────────────────────────────');
    result.warnings.forEach((warning, idx) => {
      lines.push(`${idx + 1}. ⚠️ ${warning.category}: ${warning.message}`);
      if (warning.suggestion) {
        lines.push(`   Suggestion: ${warning.suggestion}`);
      }
    });
    lines.push('');
  }
  
  if (result.suggestions.length > 0) {
    lines.push('─────────────────────────────────────────────────────────────────');
    lines.push('SUGGESTIONS:');
    lines.push('─────────────────────────────────────────────────────────────────');
    result.suggestions.forEach((suggestion, idx) => {
      lines.push(`${idx + 1}. 💡 ${suggestion}`);
    });
  }
  
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

export function getIngredientBreakdown(ingredientsJson: string): Record<string, { count: number; total: number; ingredients: string[] }> {
  const ingredients = parseIngredients(ingredientsJson);
  const breakdown: Record<string, { count: number; total: number; ingredients: string[] }> = {};
  
  const typeLabels: Record<IngredientType, string> = {
    base: 'Base Ingredients (Water/Solvents)',
    surfactant: 'Surfactants',
    emulsifier: 'Emulsifiers',
    thickener: 'Thickeners',
    humectant: 'Humectants/Moisturizers',
    active: 'Active Ingredients',
    preservative: 'Preservatives',
    ph_adjuster: 'pH Adjusters',
    fragrance: 'Fragrances',
    chelating: 'Chelating Agents',
    colorant: 'Colorants',
    other: 'Other Ingredients'
  };
  
  ingredients.forEach(ing => {
    const label = typeLabels[ing.type];
    if (!breakdown[label]) {
      breakdown[label] = { count: 0, total: 0, ingredients: [] };
    }
    breakdown[label].count++;
    breakdown[label].total += ing.percentage;
    breakdown[label].ingredients.push(`${ing.name} (${ing.percentage}%)`);
  });
  
  return breakdown;
}
