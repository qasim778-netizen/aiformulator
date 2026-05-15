export const baseRules = [
  "Always structure the response for a production-ready industrial formulation.",
  "Use clear, professional, manufacturer-friendly language.",
  "Keep ingredient choices commercially realistic and commercially available.",
  "Prioritize stability, safety, and practical manufacturability.",
  "Ensure ingredient percentages are explicit and suitable for a real batch process."
] as const;

export const jsonFormatRules = [
  "Return valid JSON only.",
  "Do not wrap the response in markdown or code fences.",
  "Include all required output fields exactly as requested by the master schema.",
  "Use arrays for ingredients and instructions.",
  "Keep strings concise, clear, and production-oriented."
] as const;

export const cleaningDetergentRules = [
  "Favor surfactants, builders, solvents, chelators, and pH adjusters appropriate for cleaning products.",
  "Optimize for cleaning performance, foam balance, and surface safety.",
  "Avoid overly harsh or unnecessary raw materials.",
  "Keep formulas suitable for household and light industrial cleaning applications.",
  "Include realistic fragrance and preservative levels for rinse-off or wipe-on products."
] as const;

export const powderRules = [
  "Design the formula for dry, free-flowing, and stable powder or granule systems.",
  "Avoid excess moisture and liquid-heavy materials unless they are essential binders or processing aids.",
  "Support solubility, flow, anti-caking behavior, and storage stability.",
  "Use powder-compatible builders, fillers, enzymes, or actives where appropriate.",
  "Keep the formula practical for blending, filling, and long-term shelf stability."
] as const;

export const leatherShoeCareRules = [
  "Focus on shine, conditioning, protection, and surface restoration.",
  "Use waxes, oils, solvents, conditioners, and polishing agents suitable for leather and footwear care.",
  "Balance gloss, spreadability, and residue control.",
  "Keep the formula safe for leather, synthetic leather, and shoe surfaces.",
  "Prioritize easy application and visible performance."
] as const;

export const cosmeticPersonalCareRules = [
  "Favor skin- and personal-care-friendly ingredients with a pleasant sensory profile.",
  "Optimize for hydration, texture, emolliency, and consumer appeal.",
  "Keep actives and preservatives within conservative, realistic use levels.",
  "Make the formula suitable for creams, lotions, serums, and other leave-on personal care products.",
  "Use modern cosmetic formulation language and commercially common raw materials."
] as const;

export const hairSalonRules = [
  "Prioritize slip, conditioning, manageability, softness, and scalp/hair feel.",
  "Use ingredients commonly found in salon and hair-care formulations.",
  "Support cleansing, repair, detangling, shine, and frizz control where relevant.",
  "Keep the formula compatible with rinse-off and leave-on hair-care formats.",
  "Aim for professional salon-quality performance and easy application."
] as const;

export const adhesiveSealantRules = [
  "Focus on bonding strength, flexibility, adhesion, and curing behavior.",
  "Use adhesive- and sealant-appropriate polymers, tackifiers, resins, or curatives.",
  "Balance grab, open time, durability, and resistance properties.",
  "Keep the formula practical for manufacturing and application on real substrates.",
  "Avoid ingredients that weaken bond performance without clear benefit."
] as const;

export const coatingSurfaceRules = [
  "Prioritize film formation, coverage, gloss, durability, and surface protection.",
  "Use coatings, waxes, polymers, solvents, or dispersions appropriate for the target surface.",
  "Balance leveling, drying, protection, and finish quality.",
  "Keep the formula suitable for automotive, textile, hard-surface, or protective coating use.",
  "Support strong appearance and real-world resistance performance."
] as const;

export const oralCareRules = [
  "Focus on oral safety, freshness, cleaning performance, and user comfort.",
  "Use ingredients appropriate for toothpaste, mouthwash, oral rinse, or tooth gel products.",
  "Keep abrasives, flavors, actives, and preservatives within realistic oral-care ranges.",
  "Avoid harsh materials that would be unsuitable for mouth-contact products.",
  "Maintain a clean, clinical, consumer-friendly formulation style."
] as const;

export const agroChemicalRules = [
  "Prioritize plant compatibility, field performance, and spray stability.",
  "Use ingredients suitable for foliar sprays, wetting agents, soil conditioners, and agricultural applications.",
  "Keep the formula practical for dilution, storage, and handling.",
  "Favor realistic agricultural actives, adjuvants, and dispersion aids where appropriate.",
  "Avoid consumer-cosmetic assumptions and keep the language agricultural and technical."
] as const;

export const generalFallbackRules = [
  "Use the most practical formulation strategy when product intent is unclear.",
  "Favor safe, stable, and broadly applicable raw materials.",
  "Keep the formula commercially realistic and easy to manufacture.",
  "Avoid over-specializing unless the product name clearly indicates a category.",
  "Prioritize clarity, stability, and sensible ingredient ratios."
] as const;

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
