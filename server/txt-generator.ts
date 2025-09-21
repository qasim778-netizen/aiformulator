import type { InsertFormulation } from '@shared/schema';

interface FormulationTXTData extends Omit<InsertFormulation, 'categoryId'> {
  ingredients: string;
  instructions: string;
}

export function generateFormulationTXT(formulation: FormulationTXTData): Buffer {
  // Parse JSON strings with error handling
  let ingredients: any[] = [];
  let instructions: any[] = [];
  
  try {
    ingredients = JSON.parse(formulation.ingredients || '[]');
    if (!Array.isArray(ingredients)) {
      console.warn('⚠️ Text Generator: Ingredients is not an array, using empty array');
      ingredients = [];
    }
  } catch (error) {
    console.error('❌ Text Generator: Failed to parse ingredients JSON:', error);
    ingredients = [];
  }
  
  try {
    instructions = JSON.parse(formulation.instructions || '[]');
    if (!Array.isArray(instructions)) {
      console.warn('⚠️ Text Generator: Instructions is not an array, using empty array');
      instructions = [];
    }
  } catch (error) {
    console.error('❌ Text Generator: Failed to parse instructions JSON:', error);
    instructions = [];
  }
  
  const content = `PROFESSIONAL FORMULATION DOCUMENT
==================================

PRODUCT NAME
============
${formulation.name || 'Professional Formulation Document'}

Created: ${new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })}

SHORT DESCRIPTION
=================
${formulation.description || `This professional formulation is designed to provide effective results for your specific needs.
It offers gentle yet powerful performance that delivers noticeable benefits.
Perfect for regular use, this formula helps maintain optimal results safely and reliably.
Trusted by professionals for consistent, high-quality outcomes.`}

TECHNICAL SPECIFICATIONS
========================
pH Level: ${formulation.phLevel || '6.0-7.0'}
Viscosity: ${formulation.viscosity || '2,000-3,000 cps'}
Shelf Life: ${formulation.shelfLife || '24 months'}
Batch Size: ${formulation.batchSize || '10-100 liters'}
Processing Time: ${formulation.processingTime || '2-3 hours'}
Temperature: ${formulation.temperature || 'Room temperature (20-25°C)'}
Storage Conditions: ${formulation.storageConditions || 'Store in a cool, dry place away from direct sunlight'}
Equipment: ${formulation.equipment || 'Mixing vessel, stirrer, heating source, pH meter'}
Certification: ${formulation.certification || 'Meets industry standards'}

FORMULATION TABLE
=================
Ingredients with INCI name, percentage, and function:
${ingredients.map((ingredient: any, index: number) => 
  `${index + 1}. ${ingredient.name || 'N/A'} (${ingredient.inci || 'N/A'}) - ${ingredient.percentage || 'N/A'}% - ${ingredient.function || 'N/A'}`
).join('\n')}

MANUFACTURING PROCESS
====================
Step-by-step preparation guidelines:
${instructions && instructions.length > 0 ? 
  instructions.map((phase: any, phaseIndex: number) => 
    `Phase ${phaseIndex + 1}: ${phase.phase || 'Manufacturing Phase'}\n${(phase.steps && Array.isArray(phase.steps)) ? phase.steps.map((step: string, stepIndex: number) => 
      `   ${stepIndex + 1}. ${step}`
    ).join('\n') : ''}`
  ).join('\n\n') :
  `Phase 1: Preparation
   1. Weigh all ingredients according to the formulation table
   2. Ensure all equipment is clean and sanitized
   3. Set up mixing equipment at appropriate temperature

Phase 2: Main Processing
   1. Add water phase ingredients to mixing vessel
   2. Begin stirring at medium speed
   3. Gradually add active ingredients while maintaining constant mixing
   4. Monitor temperature and pH throughout the process

Phase 3: Final Processing
   1. Add preservatives and adjust pH if necessary
   2. Continue mixing until homogeneous
   3. Perform quality control checks
   4. Package in appropriate containers`
}

REQUIRED EQUIPMENT
==================
Basic instruments and tools needed:
${formulation.equipment || 'Standard mixing equipment, measuring instruments, pH meter, thermometer, safety equipment'}

SAFETY PRECAUTIONS
==================
Handling: Wear appropriate PPE including gloves, safety glasses, and lab coat.
PPE Requirements: Chemical-resistant gloves, safety goggles, protective clothing.
Storage: Store in cool, dry place away from direct sunlight. Keep containers tightly closed.
Storage Conditions: ${formulation.storageConditions || 'Store at room temperature (15-25°C)'}

8. PACKAGING NOTES
==================
Packaging: Use chemically compatible containers (HDPE, glass, or PET).
Labeling: Include product name, ingredients, usage instructions, and safety warnings.
Certification: ${formulation.certification || 'Follow applicable industry standards and regulations'}

9. SCALING NOTE
===============
Lab Scale: This formulation is designed for laboratory testing and development.
Pilot Scale: For pilot production, scale proportionally and verify all parameters.
Production Scale: Consider equipment limitations, mixing efficiency, and process validation.
Batch Size: Current formulation is optimized for ${formulation.batchSize || 'laboratory scale'}.
Scaling Factor: Maintain ingredient ratios while adjusting processing parameters as needed.

Generated by AIFormulator
Generated on: ${new Date().toLocaleDateString()}
`;
  
  return Buffer.from(content, 'utf-8');
}