import { jsPDF } from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';
import type { InsertFormulation } from '@shared/schema';

interface LogoSettings {
  logoUrl?: string;
  logoSize?: number;
  companyName?: string;
}

interface FormulationPDFData extends Omit<InsertFormulation, 'categoryId' | 'slug' | 'metaDescription' | 'keywords'> {
  ingredients: string;
  instructions: string;
  slug?: string;
  metaDescription?: string;
  keywords?: string;
}

export function generateFormulationPDF(formulation: FormulationPDFData, logoSettings?: LogoSettings): Buffer {
  const doc = new jsPDF();
  
  // Parse JSON strings
  const ingredients = JSON.parse(formulation.ingredients || '[]');
  const instructions = JSON.parse(formulation.instructions || '[]');
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  
  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 12): number => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * fontSize * 0.5);
  };
  
  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number): number => {
    if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      return 20;
    }
    return yPosition;
  };
  
  // Header with Logo
  try {
    // Read and convert logo to base64
    const logoPath = path.join(process.cwd(), 'attached_assets/logo_1756133481367-B1IqNIhU_1756679964101.png');
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');
    const logoDataUrl = `data:image/png;base64,${logoBase64}`;
    
    // Add logo image with 40px height (converted to PDF units)
    const logoHeight = 40 * 0.75; // Convert pixels to PDF points (roughly 40px * 0.75)
    doc.addImage(logoDataUrl, 'PNG', margin, yPosition, 0, logoHeight); // Auto-width based on height
    yPosition += logoHeight + 10;
  } catch (error) {
    console.log('Failed to add logo to PDF, falling back to text:', error);
    // Fallback to company name text if logo fails
    doc.setFontSize(24);
    doc.setTextColor(41, 128, 185); // Blue color
    doc.text('AI Formulator', margin, yPosition);
    yPosition += 15;
  }
  
  // 1. Title Section
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText(formulation.name || 'Professional Formulation Document', margin, yPosition, contentWidth, 20);
  yPosition += 15;
  
  // 2. Short Description Section
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Short Description', margin, yPosition);
  yPosition += 10;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(formulation.description || 'Professional chemical formulation designed for optimal performance and safety.', margin, yPosition, contentWidth);
  yPosition += 15;
  
  // 3. Technical Overview Section
  yPosition = checkNewPage(60);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Technical Overview', margin, yPosition);
  yPosition += 10;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  const technicalOverview = `Key Features: High-performance formulation with optimal stability and effectiveness.
Performance Claims: Meets industry standards for pH balance, viscosity, and shelf life.
Benefits: ${formulation.usageInstructions ? 'Enhanced performance with proven results.' : 'Designed for professional applications with consistent quality.'}`;
  
  yPosition = addWrappedText(technicalOverview, margin, yPosition, contentWidth, 11);
  yPosition += 15;
  
  // 4. Formulation Table Section
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Formulation Table', margin, yPosition);
  yPosition += 10;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;
  
  // Table headers
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Ingredient', margin, yPosition);
  doc.text('INCI Name', margin + 60, yPosition);
  doc.text('%', margin + 120, yPosition);
  doc.text('Function', margin + 135, yPosition);
  yPosition += 8;
  
  // Table line
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
  
  ingredients.forEach((ingredient: any) => {
    yPosition = checkNewPage(20);
    
    doc.setFontSize(9);
    const nameLines = doc.splitTextToSize(ingredient.name || '', 55);
    const inciLines = doc.splitTextToSize(ingredient.inci || '', 55);
    const functionLines = doc.splitTextToSize(ingredient.function || '', 50);
    
    const maxLines = Math.max(nameLines.length, inciLines.length, functionLines.length);
    
    doc.text(nameLines, margin, yPosition);
    doc.text(inciLines, margin + 60, yPosition);
    doc.text(ingredient.percentage || '', margin + 120, yPosition);
    doc.text(functionLines, margin + 135, yPosition);
    
    yPosition += maxLines * 4 + 3;
  });
  
  yPosition += 10;
  
  // 5. Manufacturing Process Section
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Manufacturing Process', margin, yPosition);
  yPosition += 10;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  instructions.forEach((phase: any, phaseIndex: number) => {
    yPosition = checkNewPage(30);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Phase ${phaseIndex + 1}: ${phase.phase || 'Manufacturing Phase'}`, margin, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    if (phase.steps && Array.isArray(phase.steps)) {
      phase.steps.forEach((step: string, stepIndex: number) => {
        yPosition = checkNewPage(15);
        doc.text(`${stepIndex + 1}. ${step}`, margin + 5, yPosition);
        yPosition += 6;
      });
    }
    yPosition += 10;
  });
  
  // 6. Required Equipment Section
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Required Equipment', margin, yPosition);
  yPosition += 10;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const equipmentText = formulation.equipment || 'Standard mixing equipment, measuring instruments, pH meter, thermometer, safety equipment';
  yPosition = addWrappedText(equipmentText, margin, yPosition, contentWidth);
  yPosition += 15;
  
  // 7. Safety Precautions Section
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Safety Precautions', margin, yPosition);
  yPosition += 10;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const safetyText = `Handling: Wear appropriate PPE including gloves, safety glasses, and lab coat.
PPE Requirements: Chemical-resistant gloves, safety goggles, protective clothing.
Storage: Store in cool, dry place away from direct sunlight. Keep containers tightly closed.
Storage Conditions: ${formulation.storageConditions || 'Store at room temperature (15-25°C)'}`;
  yPosition = addWrappedText(safetyText, margin, yPosition, contentWidth);
  yPosition += 15;
  
  // 8. Quality Testing & Standards Section
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Quality Testing & Standards', margin, yPosition);
  yPosition += 10;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const qualityTests = `pH Testing: Target pH ${formulation.phLevel || '6.5-7.5'}
Viscosity: ${formulation.viscosity || 'As specified in technical parameters'}
Stability Testing: Accelerated aging and thermal cycling tests
Microbial Testing: Preservative efficacy and contamination screening
Performance Testing: Product-specific functionality verification`;
  yPosition = addWrappedText(qualityTests, margin, yPosition, contentWidth);
  yPosition += 15;
  
  // 9. Packaging & Regulatory Notes Section
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Packaging & Regulatory Notes', margin, yPosition);
  yPosition += 10;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const packagingText = `Packaging: Use chemically compatible containers (HDPE, glass, or PET).
Labeling: Include product name, ingredients, usage instructions, and safety warnings.
Regulatory Compliance: Ensure compliance with local regulations and safety standards.
Certification: ${formulation.certification || 'Follow applicable industry standards and regulations'}
Documentation: Maintain batch records and quality control documentation.`;
  yPosition = addWrappedText(packagingText, margin, yPosition, contentWidth);
  yPosition += 15;
  
  // 10. Scaling Note Section
  yPosition = checkNewPage(30);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Scaling Note', margin, yPosition);
  yPosition += 10;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const scalingText = `Lab Scale: This formulation is designed for laboratory testing and development.
Pilot Scale: For pilot production, scale proportionally and verify all parameters.
Production Scale: Consider equipment limitations, mixing efficiency, and process validation.
Batch Size: Current formulation is optimized for ${formulation.batchSize || 'laboratory scale'}.
Scaling Factor: Maintain ingredient ratios while adjusting processing parameters as needed.`;
  addWrappedText(scalingText, margin, yPosition, contentWidth);
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated by AIFormulator - Page ${i} of ${pageCount}`, margin, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, doc.internal.pageSize.getHeight() - 10);
  }
  
  // Convert to buffer
  const pdfBytes = doc.output('arraybuffer');
  return Buffer.from(pdfBytes);
}