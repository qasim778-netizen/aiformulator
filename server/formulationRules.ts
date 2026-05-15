export const baseRules = [] as const;

export const jsonFormatRules = [] as const;

export const cleaningDetergentRules = [] as const;

export const powderRules = [] as const;

export const leatherShoeCareRules = [] as const;

export const cosmeticPersonalCareRules = [] as const;

export const hairSalonRules = [] as const;

export const adhesiveSealantRules = [] as const;

export const coatingSurfaceRules = [] as const;

export const oralCareRules = [] as const;

export const agroChemicalRules = [] as const;

export const generalFallbackRules = [] as const;

export function detectRuleGroup(productName: string): {
  ruleGroup: string;
  rules: string;
  confidence: "high" | "medium" | "low";
} {
  const name = (productName || "").toLowerCase();

  const matches = (terms: string[]) => terms.some((term) => name.includes(term));

  if (matches(["shoe polish", "shoe cream", "shoe shine", "leather polish", "leather conditioner"])) {
    return { ruleGroup: "leatherShoeCareRules", rules: "leatherShoeCareRules", confidence: "high" };
  }

  if (matches(["powder", "powder detergent", "dry mix"])) {
    return { ruleGroup: "powderRules", rules: "powderRules", confidence: "high" };
  }

  if (matches(["dishwash", "dishwashing liquid", "detergent", "cleaner", "floor cleaner", "glass cleaner", "degreaser"])) {
    return { ruleGroup: "cleaningDetergentRules", rules: "cleaningDetergentRules", confidence: "high" };
  }

  if (matches(["cream", "lotion", "serum", "toner", "moisturizer", "face wash", "sunscreen"])) {
    return { ruleGroup: "cosmeticPersonalCareRules", rules: "cosmeticPersonalCareRules", confidence: "medium" };
  }

  if (matches(["shampoo", "conditioner", "hair mask", "hair serum", "hair oil"])) {
    return { ruleGroup: "hairSalonRules", rules: "hairSalonRules", confidence: "high" };
  }

  if (matches(["glue", "adhesive", "sealant", "bonding"])) {
    return { ruleGroup: "adhesiveSealantRules", rules: "adhesiveSealantRules", confidence: "high" };
  }

  if (matches(["coating", "ceramic coating", "car wax", "dashboard polish", "textile coating"])) {
    return { ruleGroup: "coatingSurfaceRules", rules: "coatingSurfaceRules", confidence: "high" };
  }

  if (matches(["toothpaste", "mouthwash", "oral rinse", "tooth gel"])) {
    return { ruleGroup: "oralCareRules", rules: "oralCareRules", confidence: "high" };
  }

  if (matches(["foliar", "soil conditioner", "plant spray", "agricultural wetting agent"])) {
    return { ruleGroup: "agroChemicalRules", rules: "agroChemicalRules", confidence: "high" };
  }

  return { ruleGroup: "generalFallbackRules", rules: "generalFallbackRules", confidence: "low" };
}
