/**
 * Formulation Validation Module
 * Validates chemical formulations against industrial standards
 * Supports multiple product categories: cosmetics, detergents, cleaners, etc.
 */

import { detectRuleGroup } from "./formulationRules";

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
  | 'builder'
  | 'emulsifier'
  | 'thickener'
  | 'humectant'
  | 'active'
  | 'preservative'
  | 'ph_adjuster'
  | 'fragrance'
  | 'chelating'
  | 'colorant'
  | 'enzyme'
  | 'bleach'
  | 'optical_brightener'
  | 'anti_redeposition'
  | 'filler'
  | 'other';

type ProductCategory = 'cosmetic' | 'detergent' | 'cleaner' | 'haircare' | 'oral' | 'other';

type ValidationProfile = 'oralCareRules' | 'leatherShoeCareRules' | 'powderRules' | 'cosmeticPersonalCareRules' | 'cleaningDetergentRules' | 'generic';
type ValidationSeverity = 'critical' | 'major' | 'minor';

const COSMETIC_LIMITS: Record<IngredientType, { min: number; max: number; label: string }> = {
  base: { min: 50, max: 85, label: 'Base Ingredients (Water/Solvents)' },
  surfactant: { min: 5, max: 30, label: 'Surfactants' },
  builder: { min: 0, max: 5, label: 'Builders' },
  emulsifier: { min: 1, max: 8, label: 'Emulsifiers' },
  thickener: { min: 0.1, max: 5, label: 'Thickeners' },
  humectant: { min: 1, max: 15, label: 'Humectants/Moisturizers' },
  active: { min: 0.1, max: 15, label: 'Active Ingredients' },
  preservative: { min: 0.1, max: 1.5, label: 'Preservatives' },
  ph_adjuster: { min: 0.01, max: 2, label: 'pH Adjusters' },
  fragrance: { min: 0.1, max: 3, label: 'Fragrances' },
  chelating: { min: 0.01, max: 0.5, label: 'Chelating Agents' },
  colorant: { min: 0.001, max: 0.5, label: 'Colorants' },
  enzyme: { min: 0, max: 0, label: 'Enzymes' },
  bleach: { min: 0, max: 0, label: 'Bleaching Agents' },
  optical_brightener: { min: 0, max: 0.5, label: 'Optical Brighteners' },
  anti_redeposition: { min: 0, max: 0, label: 'Anti-redeposition Agents' },
  filler: { min: 0, max: 30, label: 'Fillers' },
  other: { min: 0.1, max: 10, label: 'Other Ingredients' }
};

const DETERGENT_LIMITS: Record<IngredientType, { min: number; max: number; label: string }> = {
  base: { min: 0, max: 60, label: 'Base/Water' },
  surfactant: { min: 5, max: 40, label: 'Surfactants' },
  builder: { min: 10, max: 50, label: 'Builders/Water Softeners' },
  emulsifier: { min: 0, max: 5, label: 'Emulsifiers' },
  thickener: { min: 0, max: 5, label: 'Thickeners' },
  humectant: { min: 0, max: 5, label: 'Humectants' },
  active: { min: 0, max: 20, label: 'Active Ingredients' },
  preservative: { min: 0, max: 1, label: 'Preservatives' },
  ph_adjuster: { min: 0, max: 5, label: 'pH Adjusters' },
  fragrance: { min: 0.1, max: 5, label: 'Fragrances' },
  chelating: { min: 0, max: 5, label: 'Chelating Agents' },
  colorant: { min: 0, max: 0.5, label: 'Colorants' },
  enzyme: { min: 0, max: 5, label: 'Enzymes' },
  bleach: { min: 0, max: 25, label: 'Bleaching Agents' },
  optical_brightener: { min: 0, max: 1, label: 'Optical Brighteners' },
  anti_redeposition: { min: 0, max: 5, label: 'Anti-redeposition Agents' },
  filler: { min: 0, max: 50, label: 'Fillers' },
  other: { min: 0, max: 20, label: 'Other Ingredients' }
};

const CLEANER_LIMITS: Record<IngredientType, { min: number; max: number; label: string }> = {
  base: { min: 50, max: 95, label: 'Base/Water' },
  surfactant: { min: 2, max: 25, label: 'Surfactants' },
  builder: { min: 0, max: 15, label: 'Builders' },
  emulsifier: { min: 0, max: 5, label: 'Emulsifiers' },
  thickener: { min: 0, max: 3, label: 'Thickeners' },
  humectant: { min: 0, max: 5, label: 'Humectants' },
  active: { min: 0, max: 15, label: 'Active Ingredients' },
  preservative: { min: 0, max: 1, label: 'Preservatives' },
  ph_adjuster: { min: 0, max: 5, label: 'pH Adjusters' },
  fragrance: { min: 0, max: 3, label: 'Fragrances' },
  chelating: { min: 0, max: 3, label: 'Chelating Agents' },
  colorant: { min: 0, max: 0.5, label: 'Colorants' },
  enzyme: { min: 0, max: 3, label: 'Enzymes' },
  bleach: { min: 0, max: 10, label: 'Bleaching Agents' },
  optical_brightener: { min: 0, max: 0.5, label: 'Optical Brighteners' },
  anti_redeposition: { min: 0, max: 2, label: 'Anti-redeposition Agents' },
  filler: { min: 0, max: 20, label: 'Fillers' },
  other: { min: 0, max: 15, label: 'Other Ingredients' }
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
  'cetrimonium chloride', 'behentrimonium chloride', 'stearamidopropyl dimethylamine',
  'linear alkylbenzene sulfonate', 'las', 'alpha olefin sulfonate', 'aos',
  'sodium dodecylbenzene sulfonate', 'alkyl polyglucoside', 'apg',
  'sodium lauryl ether sulfate', 'fatty alcohol ethoxylate'
];

const BUILDERS = [
  'sodium carbonate', 'soda ash', 'washing soda',
  'sodium bicarbonate', 'baking soda',
  'sodium tripolyphosphate', 'stpp',
  'zeolite', 'zeolite 4a', 'sodium aluminosilicate',
  'sodium citrate', 'trisodium citrate', 'citric acid',
  'sodium silicate', 'water glass',
  'sodium sulfate', 'glauber salt',
  'borax', 'sodium borate',
  'sodium metasilicate',
  'sodium percarbonate',
  'sodium sesquicarbonate',
  'tetrasodium pyrophosphate',
  'tsp', 'trisodium phosphate'
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
  'hydroxypropyl methylcellulose', 'sodium carboxymethyl cellulose', 'cmc',
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
  'aminomethyl propanol', 'amp', 'acetic acid', 'hydrochloric acid'
];

const FRAGRANCES = [
  'parfum', 'fragrance', 'essential oil', 'lavender oil',
  'peppermint oil', 'tea tree oil', 'eucalyptus oil', 'lemon oil',
  'orange oil', 'rose oil', 'jasmine', 'sandalwood', 'vanilla',
  'linalool', 'limonene', 'citronellol', 'geraniol'
];

const CHELATING_AGENTS = [
  'disodium edta', 'tetrasodium edta', 'edta', 'phytic acid',
  'sodium phytate', 'gluconic acid', 'sodium gluconate',
  'edds', 'glda', 'mgda', 'iminodisuccinate'
];

const COLORANTS = [
  'ci ', 'fd&c', 'd&c', 'titanium dioxide', 'iron oxide',
  'mica', 'ultramarine', 'carmine', 'annatto', 'beta-carotene',
  'chlorophyll', 'caramel', 'blue 1', 'yellow 5', 'red 40'
];

const ENZYMES = [
  'protease', 'amylase', 'lipase', 'cellulase', 'mannanase',
  'pectinase', 'subtilisin', 'savinase', 'termamyl'
];

const BLEACH_AGENTS = [
  'sodium hypochlorite', 'hydrogen peroxide', 'sodium perborate',
  'sodium percarbonate', 'calcium hypochlorite', 'tetraacetylethylenediamine', 'taed'
];

const OPTICAL_BRIGHTENERS = [
  'optical brightener', 'fluorescent whitening agent', 'fwa',
  'stilbene', 'tinopal', 'blankophor'
];

const ANTI_REDEPOSITION = [
  'sodium carboxymethyl cellulose', 'cmc', 'polyvinylpyrrolidone', 'pvp',
  'polyethylene glycol', 'peg'
];

const FILLERS = [
  'sodium sulfate', 'sodium chloride', 'salt', 'talc', 'kaolin',
  'calcium carbonate', 'magnesium carbonate', 'silica'
];

function detectProductCategory(productType?: string, productName?: string): ProductCategory {
  const searchText = `${productType || ''} ${productName || ''}`.toLowerCase();
  
  const detergentKeywords = [
    'detergent', 'laundry', 'washing powder', 'washing liquid',
    'fabric wash', 'clothes wash', 'dish detergent', 'dishwasher'
  ];
  
  const cleanerKeywords = [
    'cleaner', 'cleaning', 'floor cleaner', 'glass cleaner', 'bathroom cleaner',
    'kitchen cleaner', 'all-purpose cleaner', 'multi-surface', 'degreaser',
    'disinfectant', 'sanitizer', 'surface spray'
  ];
  
  const haircareKeywords = [
    'shampoo', 'conditioner', 'hair', 'scalp'
  ];
  
  const oralKeywords = [
    'toothpaste', 'mouthwash', 'oral', 'dental'
  ];
  
  if (detergentKeywords.some(k => searchText.includes(k))) return 'detergent';
  if (cleanerKeywords.some(k => searchText.includes(k))) return 'cleaner';
  if (haircareKeywords.some(k => searchText.includes(k))) return 'haircare';
  if (oralKeywords.some(k => searchText.includes(k))) return 'oral';
  
  return 'cosmetic';
}

function getLimitsForCategory(category: ProductCategory): Record<IngredientType, { min: number; max: number; label: string }> {
  switch (category) {
    case 'detergent':
      return DETERGENT_LIMITS;
    case 'cleaner':
      return CLEANER_LIMITS;
    default:
      return COSMETIC_LIMITS;
  }
}

function detectIngredientType(
  name: string, 
  inci: string, 
  functionText: string,
  productCategory: ProductCategory
): IngredientType {
  const searchText = `${name} ${inci} ${functionText}`.toLowerCase();
  const nameOnly = name.toLowerCase();
  
  if (BASE_INGREDIENTS.some(base => searchText.includes(base.toLowerCase()))) return 'base';
  
  if (productCategory === 'detergent' || productCategory === 'cleaner') {
    if (BUILDERS.some(b => searchText.includes(b.toLowerCase()))) return 'builder';
    if (ENZYMES.some(e => searchText.includes(e.toLowerCase()))) return 'enzyme';
    if (BLEACH_AGENTS.some(b => searchText.includes(b.toLowerCase()))) return 'bleach';
    if (OPTICAL_BRIGHTENERS.some(o => searchText.includes(o.toLowerCase()))) return 'optical_brightener';
    if (ANTI_REDEPOSITION.some(a => nameOnly.includes(a.toLowerCase()))) return 'anti_redeposition';
    if (FILLERS.some(f => searchText.includes(f.toLowerCase()))) return 'filler';
  }
  
  if (SURFACTANTS.some(s => searchText.includes(s.toLowerCase()))) return 'surfactant';
  if (EMULSIFIERS.some(e => searchText.includes(e.toLowerCase()))) return 'emulsifier';
  if (THICKENERS.some(t => searchText.includes(t.toLowerCase()))) return 'thickener';
  if (HUMECTANTS.some(h => searchText.includes(h.toLowerCase()))) return 'humectant';
  if (PRESERVATIVES.some(p => searchText.includes(p.toLowerCase()))) return 'preservative';
  if (PH_ADJUSTERS.some(ph => searchText.includes(ph.toLowerCase()))) return 'ph_adjuster';
  if (FRAGRANCES.some(f => searchText.includes(f.toLowerCase()))) return 'fragrance';
  if (CHELATING_AGENTS.some(c => searchText.includes(c.toLowerCase()))) return 'chelating';
  if (COLORANTS.some(c => searchText.includes(c.toLowerCase()))) return 'colorant';
  
  const funcLower = functionText.toLowerCase();
  if (funcLower.includes('builder') || funcLower.includes('water soften') || funcLower.includes('alkalin')) return 'builder';
  if (funcLower.includes('surfactant') || funcLower.includes('cleansing') || funcLower.includes('foaming')) return 'surfactant';
  if (funcLower.includes('emulsif')) return 'emulsifier';
  if (funcLower.includes('thicken') || funcLower.includes('viscosity')) return 'thickener';
  if (funcLower.includes('moistur') || funcLower.includes('humectant') || funcLower.includes('hydrat')) return 'humectant';
  if (funcLower.includes('preserv') || funcLower.includes('antimicrob')) return 'preservative';
  if (funcLower.includes('ph ') || funcLower.includes('buffer') || funcLower.includes('neutraliz')) return 'ph_adjuster';
  if (funcLower.includes('fragrance') || funcLower.includes('scent') || funcLower.includes('aroma')) return 'fragrance';
  if (funcLower.includes('chelat') || funcLower.includes('sequester')) return 'chelating';
  if (funcLower.includes('color') || funcLower.includes('pigment') || funcLower.includes('dye')) return 'colorant';
  if (funcLower.includes('enzyme') || funcLower.includes('stain remov')) return 'enzyme';
  if (funcLower.includes('bleach') || funcLower.includes('whiten') || funcLower.includes('oxidiz')) return 'bleach';
  if (funcLower.includes('brighten') || funcLower.includes('fluorescent')) return 'optical_brightener';
  if (funcLower.includes('anti-redeposition') || funcLower.includes('soil suspend')) return 'anti_redeposition';
  if (funcLower.includes('filler') || funcLower.includes('bulk') || funcLower.includes('processing aid')) return 'filler';
  if (funcLower.includes('active') || funcLower.includes('anti-') || funcLower.includes('vitamin') || 
      funcLower.includes('extract')) return 'active';
  
  return 'other';
}

function parsePercentage(percentage: string | number): number {
  if (typeof percentage === 'number') return percentage;
  if (!percentage) return 0;
  const cleaned = String(percentage).replace('%', '').replace(',', '.').trim();
  const match = cleaned.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

export type CleaningSubtype =
  | 'dishwashingLiquid'
  | 'glassCleaner'
  | 'floorCleaner'
  | 'degreaser'
  | 'toiletCleaner'
  | 'generalCleaner';

type ValidationLayer = {
  label: string;
  min: number;
  max: number;
  severity: ValidationSeverity;
};

export function detectCleaningSubtype(productName: string): CleaningSubtype {
  const name = (productName || '').toLowerCase();
  if (/\b(dish\s*wash|dishwashing|dish\s*soap|dish\s*liquid|dish\s*detergent)\b/.test(name) || name.includes('dishwash')) {
    return 'dishwashingLiquid';
  }
  if (/\b(glass|window|mirror)\b.*\b(clean|spray|wash)\b/.test(name) || name.includes('glass cleaner') || name.includes('window cleaner')) {
    return 'glassCleaner';
  }
  if (name.includes('floor cleaner') || name.includes('floor wash') || name.includes('mop solution') || /\bfloor\b/.test(name)) {
    return 'floorCleaner';
  }
  if (name.includes('degreaser') || name.includes('grease remover') || name.includes('oven cleaner') || name.includes('engine cleaner')) {
    return 'degreaser';
  }
  if (name.includes('toilet') || name.includes('bowl cleaner') || name.includes('bathroom acid') || name.includes('limescale') || name.includes('descaler')) {
    return 'toiletCleaner';
  }
  return 'generalCleaner';
}

function getValidationScorePenalty(severity: ValidationSeverity) {
  if (severity === 'critical') return 18;
  if (severity === 'major') return 7;
  return 2;
}

function pushRangeIssue(
  issues: ValidationIssue[],
  label: string,
  value: number,
  min: number,
  max: number,
  category: string,
  severity: ValidationSeverity
) {
  if (value < min || value > max) {
    issues.push({
      type: severity,
      category,
      message: `${label} is ${value.toFixed(2)}% - should be ${min}-${max}%`,
      actualValue: value,
      expectedRange: `${min}-${max}%`,
    });
  }
}

function applyLayeredValidation(
  issues: ValidationIssue[],
  layers: ValidationLayer[],
  category: string,
  valueResolver: (layer: ValidationLayer) => number
) {
  layers.forEach(layer => {
    const value = valueResolver(layer);
    pushRangeIssue(issues, layer.label, value, layer.min, layer.max, category, layer.severity);
  });
}

function getValidationProfile(ruleGroup: string, productName?: string): ValidationProfile {
  const name = (productName || "").toLowerCase();
  if (ruleGroup === "oralCareRules") return "oralCareRules";
  if (ruleGroup === "leatherShoeCareRules") return "leatherShoeCareRules";
  if (ruleGroup === "powderRules") return "powderRules";
  if (ruleGroup === "cosmeticPersonalCareRules") return "cosmeticPersonalCareRules";
  if (ruleGroup === "cleaningDetergentRules") return "cleaningDetergentRules";
  if (name.includes("toothpaste") || name.includes("tooth gel") || name.includes("mouthwash")) return "oralCareRules";
  if (name.includes("shoe polish") || name.includes("shoe cream") || name.includes("shoe shine")) return "leatherShoeCareRules";
  if (name.includes("powder")) return "powderRules";
  if (name.includes("cream") || name.includes("lotion") || name.includes("moisturizer") || name.includes("face")) return "cosmeticPersonalCareRules";
  if (name.includes("dish") || name.includes("cleaner") || name.includes("detergent")) return "cleaningDetergentRules";
  return "generic";
}

export function parseIngredients(
  ingredientsJson: string, 
  productCategory: ProductCategory = 'cosmetic'
): ParsedIngredient[] {
  try {
    const ingredients = JSON.parse(ingredientsJson);
    if (!Array.isArray(ingredients)) return [];
    
    return ingredients.map(ing => ({
      name: ing.name || '',
      inci: ing.inci || '',
      percentage: parsePercentage(ing.percentage),
      function: ing.function || '',
      type: detectIngredientType(ing.name || '', ing.inci || '', ing.function || '', productCategory)
    }));
  } catch (error) {
    console.error('Failed to parse ingredients:', error);
    return [];
  }
}

export function validateFormulation(
  ingredientsJson: string,
  productType?: string,
  phLevel?: string,
  productName?: string
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];
  
  const detected = detectRuleGroup(productName || productType || '');
  const ruleGroup = detected.ruleGroup;
  const validationProfile = getValidationProfile(ruleGroup, productName || productType);
  const productCategory = detectProductCategory(productType, productName);
  const limits = getLimitsForCategory(productCategory);
  const ingredients = parseIngredients(ingredientsJson, productCategory);
  const cleaningSubtype = detectCleaningSubtype(productName || productType || '');
  
  console.log(`Validating formulation for category: ${productCategory}`);
  
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
    base: [], surfactant: [], builder: [], emulsifier: [], thickener: [],
    humectant: [], active: [], preservative: [], ph_adjuster: [],
    fragrance: [], chelating: [], colorant: [], enzyme: [], bleach: [],
    optical_brightener: [], anti_redeposition: [], filler: [], other: []
  };
  
  ingredients.forEach(ing => {
    typeGroups[ing.type].push(ing);
  });
  
  if (validationProfile === 'oralCareRules') {
    const humectantTotal = typeGroups.humectant.reduce((sum, ing) => sum + ing.percentage, 0);
    const surfactantTotal = typeGroups.surfactant.reduce((sum, ing) => sum + ing.percentage, 0);
    const preservativeTotal = typeGroups.preservative.reduce((sum, ing) => sum + ing.percentage, 0);
    const waterTotal = typeGroups.base.reduce((sum, ing) => sum + ing.percentage, 0);
    const binderTotal = typeGroups.thickener.reduce((sum, ing) => sum + ing.percentage, 0);
    const flavorTotal = typeGroups.fragrance.reduce((sum, ing) => sum + ing.percentage, 0);
    const sorbitolTotal = ingredients.filter(ing => `${ing.name} ${ing.inci} ${ing.function}`.toLowerCase().includes('sorbitol')).reduce((sum, ing) => sum + ing.percentage, 0);
    const abrasiveTotal = ingredients.filter(ing => {
      const t = `${ing.name} ${ing.inci} ${ing.function}`.toLowerCase();
      return t.includes('silica') || t.includes('calcium carbonate') || t.includes('abrasive');
    }).reduce((sum, ing) => sum + ing.percentage, 0);
    if (humectantTotal < 20 || humectantTotal > 60) issues.push({ type: 'major', category: 'Humectants/Moisturizers', message: `Humectants total is ${humectantTotal.toFixed(1)}% - should be 20-60%`, actualValue: humectantTotal, expectedRange: '20-60%' });
    if (sorbitolTotal < 20 || sorbitolTotal > 45) issues.push({ type: 'major', category: 'Humectants/Moisturizers', message: `Sorbitol total is ${sorbitolTotal.toFixed(1)}% - should be 20-45%`, actualValue: sorbitolTotal, expectedRange: '20-45%' });
    if (abrasiveTotal < 10 || abrasiveTotal > 50) issues.push({ type: 'major', category: 'Abrasives', message: `Abrasives total is ${abrasiveTotal.toFixed(1)}% - should be 10-50%`, actualValue: abrasiveTotal, expectedRange: '10-50%' });
    if (waterTotal < 5 || waterTotal > 35) issues.push({ type: 'major', category: 'Base Ingredients', message: `Water total is ${waterTotal.toFixed(1)}% - should be 5-35%`, actualValue: waterTotal, expectedRange: '5-35%' });
    if (binderTotal < 0.3 || binderTotal > 2) issues.push({ type: 'major', category: 'Binder/Thickener', message: `Binder/thickener total is ${binderTotal.toFixed(1)}% - should be 0.3-2%`, actualValue: binderTotal, expectedRange: '0.3-2%' });
    if (surfactantTotal < 0.5 || surfactantTotal > 2) issues.push({ type: 'major', category: 'Surfactants', message: `Surfactant total is ${surfactantTotal.toFixed(1)}% - should be 0.5-2%`, actualValue: surfactantTotal, expectedRange: '0.5-2%' });
    if (flavorTotal < 0.1 || flavorTotal > 2) issues.push({ type: 'major', category: 'Flavor/Sweetener', message: `Flavor/sweetener total is ${flavorTotal.toFixed(1)}% - should be 0.1-2%`, actualValue: flavorTotal, expectedRange: '0.1-2%' });
    if (waterTotal >= 2 && (preservativeTotal < 0 || preservativeTotal > 0.5)) issues.push({ type: 'major', category: 'Preservatives', message: `Preservative total is ${preservativeTotal.toFixed(2)}% - should be 0-0.5%`, actualValue: preservativeTotal, expectedRange: '0-0.5%' });
  } else if (validationProfile === 'leatherShoeCareRules') {
    const waterTotal = typeGroups.base.reduce((sum, ing) => sum + ing.percentage, 0);
    const waxTotal = ingredients.filter(ing => `${ing.name} ${ing.inci} ${ing.function}`.toLowerCase().includes('wax')).reduce((sum, ing) => sum + ing.percentage, 0);
    const oilSolventTotal = ingredients.filter(ing => {
      const t = `${ing.name} ${ing.inci} ${ing.function}`.toLowerCase();
      return t.includes('oil') || t.includes('solvent') || t.includes('mineral spirits') || t.includes('white spirit');
    }).reduce((sum, ing) => sum + ing.percentage, 0);
    const pigmentTotal = typeGroups.colorant.reduce((sum, ing) => sum + ing.percentage, 0);
    const shineResinTotal = ingredients.filter(ing => {
      const t = `${ing.name} ${ing.inci} ${ing.function}`.toLowerCase();
      return t.includes('resin') || t.includes('silicone') || t.includes('shine') || t.includes('polish');
    }).reduce((sum, ing) => sum + ing.percentage, 0);
    if (waterTotal > 2) issues.push({ type: 'major', category: 'Base Ingredients', message: `Water total is ${waterTotal.toFixed(1)}% - should be 0-2%`, actualValue: waterTotal, expectedRange: '0-2%' });
    if (waxTotal < 25 || waxTotal > 45) issues.push({ type: 'major', category: 'Waxes', message: `Waxes total is ${waxTotal.toFixed(1)}% - should be 25-45%`, actualValue: waxTotal, expectedRange: '25-45%' });
    if (oilSolventTotal < 35 || oilSolventTotal > 65) issues.push({ type: 'major', category: 'Oil/Solvent Carrier', message: `Oil/solvent carrier total is ${oilSolventTotal.toFixed(1)}% - should be 35-65%`, actualValue: oilSolventTotal, expectedRange: '35-65%' });
    if (pigmentTotal < 2 || pigmentTotal > 10) issues.push({ type: 'major', category: 'Pigments/Dyes', message: `Pigment/dye total is ${pigmentTotal.toFixed(1)}% - should be 2-10%`, actualValue: pigmentTotal, expectedRange: '2-10%' });
    if (shineResinTotal < 1 || shineResinTotal > 8) issues.push({ type: 'major', category: 'Shine/Resin/Silicone', message: `Shine/resin/silicone total is ${shineResinTotal.toFixed(1)}% - should be 1-8%`, actualValue: shineResinTotal, expectedRange: '1-8%' });
    if (waterTotal < 2 && typeGroups.preservative.reduce((sum, ing) => sum + ing.percentage, 0) > 0.5) {
      issues.push({ type: 'major', category: 'Preservatives', message: 'Preservative is present despite low water; shoe polish generally does not require it', expectedRange: 'optional' });
    }
  } else if (validationProfile === 'powderRules') {
    const waterTotal = typeGroups.base.reduce((sum, ing) => sum + ing.percentage, 0);
    if (waterTotal > 2) {
      issues.push({ type: 'major', category: 'Base Ingredients', message: `Water total is ${waterTotal.toFixed(1)}% - should be 0-2% for dry powders`, actualValue: waterTotal, expectedRange: '0-2%' });
    }
  } else if (validationProfile === 'cosmeticPersonalCareRules') {
    const baseTotal = typeGroups.base.reduce((sum, ing) => sum + ing.percentage, 0);
    const oilTotal = ingredients.filter(ing => `${ing.name} ${ing.inci} ${ing.function}`.toLowerCase().includes('oil')).reduce((sum, ing) => sum + ing.percentage, 0);
    const emulsifierTotal = typeGroups.emulsifier.reduce((sum, ing) => sum + ing.percentage, 0);
    const humectantTotal = typeGroups.humectant.reduce((sum, ing) => sum + ing.percentage, 0);
    const preservativeTotal = typeGroups.preservative.reduce((sum, ing) => sum + ing.percentage, 0);
    const pH = phLevel ? parsePercentage(phLevel) : 0;
    if (baseTotal < 55 || baseTotal > 75) issues.push({ type: 'major', category: 'Base Ingredients', message: `Water phase total is ${baseTotal.toFixed(1)}% - should be 55-75%`, actualValue: baseTotal, expectedRange: '55-75%' });
    if (oilTotal < 10 || oilTotal > 25) issues.push({ type: 'major', category: 'Oil Phase', message: `Oil phase total is ${oilTotal.toFixed(1)}% - should be 10-25%`, actualValue: oilTotal, expectedRange: '10-25%' });
    if (emulsifierTotal < 3 || emulsifierTotal > 6) issues.push({ type: 'major', category: 'Emulsifiers', message: `Emulsifier total is ${emulsifierTotal.toFixed(1)}% - should be 3-6%`, actualValue: emulsifierTotal, expectedRange: '3-6%' });
    if (humectantTotal < 2 || humectantTotal > 8) issues.push({ type: 'major', category: 'Humectants/Moisturizers', message: `Humectant total is ${humectantTotal.toFixed(1)}% - should be 2-8%`, actualValue: humectantTotal, expectedRange: '2-8%' });
    if (preservativeTotal < 0.5 || preservativeTotal > 1) issues.push({ type: 'major', category: 'Preservatives', message: `Preservative total is ${preservativeTotal.toFixed(2)}% - should be 0.5-1%`, actualValue: preservativeTotal, expectedRange: '0.5-1%' });
    if (pH && (pH < 5.0 || pH > 6.5)) issues.push({ type: 'major', category: 'pH', message: `pH ${pH} is outside 5.0-6.5`, actualValue: pH, expectedRange: '5.0-6.5' });
  } else if (validationProfile === 'cleaningDetergentRules') {
    const baseTotal = typeGroups.base.reduce((sum, ing) => sum + ing.percentage, 0);
    const surfactantTotal = typeGroups.surfactant.reduce((sum, ing) => sum + ing.percentage, 0);
    const builderChelatorTotal = typeGroups.builder.reduce((sum, ing) => sum + ing.percentage, 0) + typeGroups.chelating.reduce((sum, ing) => sum + ing.percentage, 0);
    const preservativeTotal = typeGroups.preservative.reduce((sum, ing) => sum + ing.percentage, 0);
    const fragranceTotal = typeGroups.fragrance.reduce((sum, ing) => sum + ing.percentage, 0);
    const solventTotal = ingredients.filter(ing => {
      const t = `${ing.name} ${ing.inci} ${ing.function}`.toLowerCase();
      return t.includes('alcohol') || t.includes('ethanol') || t.includes('isopropanol') || t.includes('propylene glycol') ||
             t.includes('glycol ether') || t.includes('butyl glycol') || t.includes('butoxyethanol') || t.includes('d-limonene') ||
             t.includes('solvent') || t.includes('mineral spirits');
    }).reduce((sum, ing) => sum + ing.percentage, 0);
    const acidTotal = ingredients.filter(ing => {
      const t = `${ing.name} ${ing.inci} ${ing.function}`.toLowerCase();
      return t.includes('hydrochloric') || t.includes('phosphoric') || t.includes('sulfamic') ||
             t.includes('formic acid') || t.includes('citric acid') || t.includes('lactic acid') ||
             t.includes('glycolic acid') || t.includes('acid descaler');
    }).reduce((sum, ing) => sum + ing.percentage, 0);
    const thickenerTotal = typeGroups.thickener.reduce((sum, ing) => sum + ing.percentage, 0);
    const categoryLayers: ValidationLayer[] = [
      { label: 'Water total', min: 50, max: 95, severity: 'major' },
      { label: 'Surfactant total', min: 2, max: 30, severity: 'major' },
      { label: 'Builders/Chelators total', min: 0, max: 8, severity: 'minor' },
      { label: 'Preservative total', min: 0, max: 1, severity: 'minor' },
      { label: 'Fragrance total', min: 0, max: 1, severity: 'minor' },
    ];

    const subtypeLayers: Record<CleaningSubtype, ValidationLayer[]> = {
      dishwashingLiquid: [
        { label: 'Water total', min: 50, max: 75, severity: 'major' },
        { label: 'Surfactant total', min: 15, max: 30, severity: 'major' },
        { label: 'Builders/chelators total', min: 0.5, max: 3, severity: 'minor' },
        { label: 'Preservative total', min: 0.1, max: 0.5, severity: 'minor' },
        { label: 'Fragrance total', min: 0.1, max: 0.5, severity: 'minor' },
      ],
      glassCleaner: [
        { label: 'Water total', min: 85, max: 97, severity: 'major' },
        { label: 'Surfactant total', min: 0.1, max: 3, severity: 'minor' },
        { label: 'Solvent total (alcohols/glycol ethers)', min: 3, max: 15, severity: 'major' },
        { label: 'Builders/chelators total', min: 0, max: 1, severity: 'minor' },
        { label: 'Preservative total', min: 0.05, max: 0.3, severity: 'minor' },
      ],
      floorCleaner: [
        { label: 'Water total', min: 80, max: 95, severity: 'major' },
        { label: 'Surfactant total', min: 2, max: 8, severity: 'major' },
        { label: 'Builders/chelators total', min: 1, max: 5, severity: 'minor' },
        { label: 'Solvent total', min: 0, max: 5, severity: 'minor' },
        { label: 'Fragrance total', min: 0.1, max: 0.5, severity: 'minor' },
      ],
      degreaser: [
        { label: 'Water total', min: 60, max: 85, severity: 'major' },
        { label: 'Surfactant total', min: 5, max: 20, severity: 'major' },
        { label: 'Solvent total', min: 5, max: 25, severity: 'major' },
        { label: 'Builders/chelators total', min: 1, max: 8, severity: 'minor' },
        { label: 'Fragrance total', min: 0, max: 0.3, severity: 'minor' },
      ],
      toiletCleaner: [
        { label: 'Water total', min: 70, max: 90, severity: 'major' },
        { label: 'Surfactant total', min: 2, max: 10, severity: 'major' },
        { label: 'Acid total (descalers)', min: 5, max: 15, severity: 'major' },
        { label: 'Thickener total', min: 0.5, max: 3, severity: 'minor' },
        { label: 'Fragrance total', min: 0.1, max: 0.5, severity: 'minor' },
      ],
      generalCleaner: [
        { label: 'Water total', min: 70, max: 90, severity: 'major' },
        { label: 'Surfactant total', min: 3, max: 10, severity: 'major' },
        { label: 'Builders/chelators total', min: 0.5, max: 3, severity: 'minor' },
        { label: 'Preservative total', min: 0.1, max: 0.5, severity: 'minor' },
        { label: 'Fragrance total', min: 0.1, max: 0.5, severity: 'minor' },
      ],
    };

    applyLayeredValidation(issues, categoryLayers, 'Cleaning Formula', () => baseTotal);

    if (cleaningSubtype === 'dishwashingLiquid') {
      applyLayeredValidation(issues, subtypeLayers.dishwashingLiquid, 'Dishwashing Liquid', layer => {
        if (layer.label.startsWith('Water')) return baseTotal;
        if (layer.label.startsWith('Surfactant')) return surfactantTotal;
        if (layer.label.startsWith('Builders')) return builderChelatorTotal;
        if (layer.label.startsWith('Preservative')) return preservativeTotal;
        return fragranceTotal;
      });
      suggestions.push('Dishwashing liquid: balance surfactants for foam and grease removal');
    } else if (cleaningSubtype === 'glassCleaner') {
      applyLayeredValidation(issues, subtypeLayers.glassCleaner, 'Glass Cleaner', layer => {
        if (layer.label.startsWith('Water')) return baseTotal;
        if (layer.label.startsWith('Surfactant')) return surfactantTotal;
        if (layer.label.startsWith('Solvent')) return solventTotal;
        if (layer.label.startsWith('Builders')) return builderChelatorTotal;
        return preservativeTotal;
      });
      suggestions.push('Glass cleaner: prioritize fast-drying solvents for streak-free results');
    } else if (cleaningSubtype === 'floorCleaner') {
      applyLayeredValidation(issues, subtypeLayers.floorCleaner, 'Floor Cleaner', layer => {
        if (layer.label.startsWith('Water')) return baseTotal;
        if (layer.label.startsWith('Surfactant')) return surfactantTotal;
        if (layer.label.startsWith('Builders')) return builderChelatorTotal;
        if (layer.label.startsWith('Solvent')) return solventTotal;
        return fragranceTotal;
      });
      suggestions.push('Floor cleaner: keep residue low and avoid overpowering surfactant load');
    } else if (cleaningSubtype === 'degreaser') {
      applyLayeredValidation(issues, subtypeLayers.degreaser, 'Degreaser', layer => {
        if (layer.label.startsWith('Water')) return baseTotal;
        if (layer.label.startsWith('Surfactant')) return surfactantTotal;
        if (layer.label.startsWith('Solvent')) return solventTotal;
        if (layer.label.startsWith('Builders')) return builderChelatorTotal;
        return fragranceTotal;
      });
      suggestions.push('Degreaser: use higher solvent and builder activity for heavy soil');
    } else if (cleaningSubtype === 'toiletCleaner') {
      applyLayeredValidation(issues, subtypeLayers.toiletCleaner, 'Toilet Cleaner', layer => {
        if (layer.label.startsWith('Water')) return baseTotal;
        if (layer.label.startsWith('Surfactant')) return surfactantTotal;
        if (layer.label.startsWith('Acid')) return acidTotal;
        if (layer.label.startsWith('Thickener')) return thickenerTotal;
        return fragranceTotal;
      });
      suggestions.push('Toilet cleaner: use acid and thickener for cling and descaling');
    } else {
      applyLayeredValidation(issues, subtypeLayers.generalCleaner, 'General Cleaner', layer => {
        if (layer.label.startsWith('Water')) return baseTotal;
        if (layer.label.startsWith('Surfactant')) return surfactantTotal;
        if (layer.label.startsWith('Builders')) return builderChelatorTotal;
        if (layer.label.startsWith('Preservative')) return preservativeTotal;
        return fragranceTotal;
      });
      suggestions.push('General-purpose cleaner: balanced surfactant and builder system');
    }
    console.log(`Cleaning subtype detected: ${cleaningSubtype}`);
  } else if (productCategory === 'cosmetic' || productCategory === 'haircare') {
    const baseTotal = typeGroups.base.reduce((sum, ing) => sum + ing.percentage, 0);
    const baseLimits = limits.base;
    
    if (baseTotal < baseLimits.min) {
      issues.push({
        type: 'major',
        category: 'Base Ingredients',
        message: `Base ingredients (water/solvents) total is ${baseTotal.toFixed(1)}% - should be at least ${baseLimits.min}%`,
        actualValue: baseTotal,
        expectedRange: `${baseLimits.min}-${baseLimits.max}%`
      });
      suggestions.push('Increase water/aqua content to at least 50-60% for most formulations');
    }
  }
  
  if (productCategory === 'detergent') {
    const surfactantTotal = typeGroups.surfactant.reduce((sum, ing) => sum + ing.percentage, 0);
    const builderTotal = typeGroups.builder.reduce((sum, ing) => sum + ing.percentage, 0);
    
    if (surfactantTotal < 5) {
      issues.push({
        type: 'major',
        category: 'Surfactants',
        message: `Surfactant total is ${surfactantTotal.toFixed(1)}% - detergents typically need at least 5-10%`,
        actualValue: surfactantTotal,
        expectedRange: '5-40%'
      });
    }
    
    if (builderTotal < 10 && typeGroups.filler.length === 0) {
      warnings.push({
        category: 'Builders',
        message: `Builder total is ${builderTotal.toFixed(1)}% - consider adding more builders for water softening`,
        suggestion: 'Add sodium carbonate, zeolite, or sodium citrate for better cleaning performance'
      });
    }
  }
  
  (Object.keys(typeGroups) as IngredientType[]).forEach(type => {
    if (type === 'other') return;
    
    const group = typeGroups[type];
    const groupTotal = group.reduce((sum, ing) => sum + ing.percentage, 0);
    const typeLimits = limits[type];
    
    if (typeLimits.max === 0 && groupTotal > 0) return;
    
    if (groupTotal > 0 && groupTotal > typeLimits.max) {
      const excessRatio = groupTotal / typeLimits.max;
      const severity = excessRatio > 2 ? 'major' : 'minor';
      issues.push({
        type: severity,
        category: typeLimits.label,
        message: `${typeLimits.label} total is ${groupTotal.toFixed(2)}% - exceeds typical maximum of ${typeLimits.max}%`,
        actualValue: groupTotal,
        expectedRange: `${typeLimits.min}-${typeLimits.max}%`
      });
    }
    
    if (type !== 'builder' && type !== 'filler' && type !== 'base' && type !== 'surfactant') {
      group.forEach(ing => {
        if (ing.percentage > typeLimits.max * 2 && typeLimits.max > 0) {
          issues.push({
            type: 'major',
            category: typeLimits.label,
            message: `${ing.name} at ${ing.percentage}% seems high for ${type}`,
            ingredient: ing.name,
            actualValue: ing.percentage,
            expectedRange: `${typeLimits.min}-${typeLimits.max}%`
          });
        }
      });
    }
  });
  
  if (productCategory === 'cosmetic' || productCategory === 'haircare') {
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
  }
  
  if (ingredients.length < 4) {
    warnings.push({
      category: 'Formulation Completeness',
      message: `Only ${ingredients.length} ingredients - professional formulations typically have 5-12 ingredients`
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
    score -= getValidationScorePenalty(issue.type);
  });
  warnings.forEach(() => score -= 1);
  score = Math.max(0, Math.min(100, score));
  
  const hasCritical = issues.filter(i => i.type === 'critical').length > 0;
  const isValid = !hasCritical && score >= 45;
  
  let summary: string;
  if (score >= 90) {
    summary = 'Excellent formulation - meets industrial standards';
  } else if (score >= 75) {
    summary = 'Good formulation with minor improvements recommended';
  } else if (score >= 60) {
    summary = 'Acceptable formulation - some adjustments suggested';
  } else if (score >= 40) {
    summary = 'Formulation needs improvements';
  } else {
    summary = 'Formulation needs significant review';
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
  lines.push(`Status: ${result.isValid ? '✅ VALID' : '❌ NEEDS REVIEW'}`);
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

export function getIngredientBreakdown(
  ingredientsJson: string,
  productType?: string,
  productName?: string
): Record<string, { count: number; total: number; ingredients: string[] }> {
  const productCategory = detectProductCategory(productType, productName);
  const ingredients = parseIngredients(ingredientsJson, productCategory);
  const breakdown: Record<string, { count: number; total: number; ingredients: string[] }> = {};
  
  const typeLabels: Record<IngredientType, string> = {
    base: 'Base/Water',
    surfactant: 'Surfactants',
    builder: 'Builders/Water Softeners',
    emulsifier: 'Emulsifiers',
    thickener: 'Thickeners',
    humectant: 'Humectants/Moisturizers',
    active: 'Active Ingredients',
    preservative: 'Preservatives',
    ph_adjuster: 'pH Adjusters',
    fragrance: 'Fragrances',
    chelating: 'Chelating Agents',
    colorant: 'Colorants',
    enzyme: 'Enzymes',
    bleach: 'Bleaching Agents',
    optical_brightener: 'Optical Brighteners',
    anti_redeposition: 'Anti-redeposition Agents',
    filler: 'Fillers',
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
