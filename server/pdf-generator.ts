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
  
  // Parse JSON strings with error handling
  let ingredients: any[] = [];
  let instructions: any[] = [];
  
  try {
    ingredients = JSON.parse(formulation.ingredients || '[]');
    if (!Array.isArray(ingredients)) {
      console.warn('⚠️ PDF Generator: Ingredients is not an array, using empty array');
      ingredients = [];
    }
  } catch (error) {
    console.error('❌ PDF Generator: Failed to parse ingredients JSON:', error);
    ingredients = [];
  }
  
  try {
    instructions = JSON.parse(formulation.instructions || '[]');
    if (!Array.isArray(instructions)) {
      console.warn('⚠️ PDF Generator: Instructions is not an array, using empty array');
      instructions = [];
    }
  } catch (error) {
    console.error('❌ PDF Generator: Failed to parse instructions JSON:', error);
    instructions = [];
  }
  
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
  
  // Product Name Title (Blue like other sections)
  doc.setFontSize(18);
  doc.setTextColor(52, 73, 94); // Blue color like other sections
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUCT NAME', margin, yPosition);
  yPosition += 8;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  yPosition = addWrappedText(formulation.name || 'Professional Formulation Document', margin, yPosition, contentWidth, 16);
  yPosition += 15;
  
  // Creation Date/Time
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102); // Gray color
  doc.setFont('helvetica', 'normal');
  const creationDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  doc.text(`Created: ${creationDate}`, margin, yPosition);
  yPosition += 15;
  
  // Short Description Section
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Short Description', margin, yPosition);
  yPosition += 8;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Simple user-focused description
  const shortDescription = formulation.description || `This professional formulation is designed to provide effective results for your specific needs.
It offers gentle yet powerful performance that delivers noticeable benefits.
Perfect for regular use, this formula helps maintain optimal results safely and reliably.
Trusted by professionals for consistent, high-quality outcomes.`;
  
  yPosition = addWrappedText(shortDescription, margin, yPosition, contentWidth);
  yPosition += 10;
  
  // Technical Specifications Section
  yPosition = checkNewPage(100);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Technical Specifications', margin, yPosition);
  yPosition += 8;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Technical specifications in structured format
  const specifications = [
    { label: 'pH Level:', value: formulation.phLevel || '6.0-7.0' },
    { label: 'Viscosity:', value: formulation.viscosity || '2,000-3,000 cps' },
    { label: 'Shelf Life:', value: formulation.shelfLife || '24 months' },
    { label: 'Batch Size:', value: formulation.batchSize || '10-100 liters' },
    { label: 'Processing Time:', value: formulation.processingTime || '2-3 hours' },
    { label: 'Temperature:', value: formulation.temperature || 'Room temperature (20-25°C)' },
    { label: 'Storage Conditions:', value: formulation.storageConditions || 'Store in a cool, dry place away from direct sunlight' },
    { label: 'Equipment:', value: formulation.equipment || 'Mixing vessel, stirrer, heating source, pH meter' },
    { label: 'Certification:', value: formulation.certification || 'Meets industry standards' }
  ];
  
  specifications.forEach((spec) => {
    yPosition = checkNewPage(15);
    doc.setFont('helvetica', 'bold');
    doc.text(spec.label, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition = addWrappedText(spec.value, margin + 80, yPosition, contentWidth - 80, 12);
    yPosition += 5;
  });
  
  yPosition += 5;
  
  // Formulation Table Section
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Formulation Table', margin, yPosition);
  yPosition += 8;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  // Table headers with borders
  const colWidths = [15, 55, 55, 20, 50]; // Sr.No, Ingredient, INCI, %, Function
  const tableStartX = margin;
  const tableWidth = contentWidth;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Draw header row background
  doc.setFillColor(245, 245, 245);
  doc.rect(tableStartX, yPosition - 5, tableWidth, 8, 'F');
  
  // Draw header borders
  doc.setLineWidth(0.2);
  doc.setDrawColor(200, 200, 200);
  let xPos = tableStartX;
  
  // Header text and vertical lines
  doc.text('Sr.No', xPos + 2, yPosition);
  doc.line(xPos, yPosition - 5, xPos, yPosition + 3); // Left border
  xPos += colWidths[0];
  
  doc.text('Ingredient', xPos + 2, yPosition);
  doc.line(xPos, yPosition - 5, xPos, yPosition + 3);
  xPos += colWidths[1];
  
  doc.text('INCI Name', xPos + 2, yPosition);
  doc.line(xPos, yPosition - 5, xPos, yPosition + 3);
  xPos += colWidths[2];
  
  doc.text('%', xPos + 2, yPosition);
  doc.line(xPos, yPosition - 5, xPos, yPosition + 3);
  xPos += colWidths[3];
  
  doc.text('Function', xPos + 2, yPosition);
  doc.line(xPos, yPosition - 5, xPos, yPosition + 3);
  doc.line(tableStartX + tableWidth, yPosition - 5, tableStartX + tableWidth, yPosition + 3); // Right border
  
  // Horizontal lines for header
  doc.line(tableStartX, yPosition - 5, tableStartX + tableWidth, yPosition - 5); // Top
  doc.line(tableStartX, yPosition + 3, tableStartX + tableWidth, yPosition + 3); // Bottom
  
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
  
  ingredients.forEach((ingredient: any, index: number) => {
    yPosition = checkNewPage(20);
    
    doc.setFontSize(9);
    const nameLines = doc.splitTextToSize(ingredient.name || '', 50);
    const inciLines = doc.splitTextToSize(ingredient.inci || '', 50);
    const functionLines = doc.splitTextToSize(ingredient.function || '', 45);
    
    const maxLines = Math.max(nameLines.length, inciLines.length, functionLines.length);
    const rowHeight = maxLines * 4 + 3;
    
    // Draw row borders
    xPos = tableStartX;
    
    // Sr.No
    doc.text((index + 1).toString(), xPos + 5, yPosition);
    doc.line(xPos, yPosition - 3, xPos, yPosition + rowHeight - 3); // Left border
    xPos += colWidths[0];
    
    // Ingredient (bold)
    doc.setFont('helvetica', 'bold');
    doc.text(nameLines, xPos + 2, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.line(xPos, yPosition - 3, xPos, yPosition + rowHeight - 3);
    xPos += colWidths[1];
    
    // INCI Name
    doc.text(inciLines, xPos + 2, yPosition);
    doc.line(xPos, yPosition - 3, xPos, yPosition + rowHeight - 3);
    xPos += colWidths[2];
    
    // Percentage
    doc.text(ingredient.percentage || '', xPos + 2, yPosition);
    doc.line(xPos, yPosition - 3, xPos, yPosition + rowHeight - 3);
    xPos += colWidths[3];
    
    // Function
    doc.text(functionLines, xPos + 2, yPosition);
    doc.line(xPos, yPosition - 3, xPos, yPosition + rowHeight - 3);
    doc.line(tableStartX + tableWidth, yPosition - 3, tableStartX + tableWidth, yPosition + rowHeight - 3); // Right border
    
    // Bottom horizontal line
    doc.line(tableStartX, yPosition + rowHeight - 3, tableStartX + tableWidth, yPosition + rowHeight - 3);
    
    yPosition += rowHeight;
  });
  
  // Total row
  yPosition = checkNewPage(15);
  
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(tableStartX, yPosition - 3, tableWidth, 10, 'F');
  
  xPos = tableStartX;
  
  // "Total" spanning first 3 columns
  doc.text('Total', xPos + 2, yPosition + 3);
  doc.line(xPos, yPosition - 3, xPos, yPosition + 7); // Left border
  xPos += colWidths[0] + colWidths[1] + colWidths[2];
  
  // Draw vertical lines for merged cells
  doc.line(xPos, yPosition - 3, xPos, yPosition + 7);
  xPos += colWidths[3];
  
  // 100% in percentage column
  doc.text('100%', xPos - colWidths[3] + 2, yPosition + 3);
  
  // Empty function column
  doc.line(xPos, yPosition - 3, xPos, yPosition + 7);
  doc.line(tableStartX + tableWidth, yPosition - 3, tableStartX + tableWidth, yPosition + 7); // Right border
  
  // Horizontal lines for total row
  doc.line(tableStartX, yPosition + 7, tableStartX + tableWidth, yPosition + 7); // Bottom
  
  yPosition += 12;
  
  yPosition += 10;
  
  // Manufacturing Process Section
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Manufacturing Process', margin, yPosition);
  yPosition += 8;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  if (instructions && instructions.length > 0) {
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
          yPosition = addWrappedText(`${stepIndex + 1}. ${step}`, margin + 5, yPosition, contentWidth - 5, 11);
          yPosition += 4;
        });
      }
      yPosition += 10;
    });
  } else {
    // Fallback if no instructions provided
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const defaultProcess = [
      'Phase 1: Preparation',
      '• Weigh all ingredients according to the formulation table',
      '• Ensure all equipment is clean and sanitized',
      '• Set up mixing equipment at appropriate temperature',
      '',
      'Phase 2: Main Processing',
      '• Add water phase ingredients to mixing vessel',
      '• Begin stirring at medium speed',
      '• Gradually add active ingredients while maintaining constant mixing',
      '• Monitor temperature and pH throughout the process',
      '',
      'Phase 3: Final Processing',
      '• Add preservatives and adjust pH if necessary',
      '• Continue mixing until homogeneous',
      '• Perform quality control checks',
      '• Package in appropriate containers'
    ];
    
    defaultProcess.forEach((line) => {
      yPosition = checkNewPage(15);
      if (line.startsWith('Phase')) {
        doc.setFont('helvetica', 'bold');
        yPosition = addWrappedText(line, margin, yPosition, contentWidth, 11);
      } else if (line === '') {
        yPosition += 5;
      } else {
        doc.setFont('helvetica', 'normal');
        yPosition = addWrappedText(line, margin + 5, yPosition, contentWidth - 5, 11);
      }
      yPosition += 4;
    });
  }
  
  // Required Equipment Section
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Required Equipment', margin, yPosition);
  yPosition += 8;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const equipmentText = formulation.equipment || 'Standard mixing equipment, measuring instruments, pH meter, thermometer, safety equipment';
  yPosition = addWrappedText(equipmentText, margin, yPosition, contentWidth);
  yPosition += 15;
  
  // Safety Precautions Section
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Safety Precautions', margin, yPosition);
  yPosition += 8;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const safetyText = `Handling: Wear appropriate PPE including gloves, safety glasses, and lab coat.
PPE Requirements: Chemical-resistant gloves, safety goggles, protective clothing.
Storage: Store in cool, dry place away from direct sunlight. Keep containers tightly closed.
Storage Conditions: ${formulation.storageConditions || 'Store at room temperature (15-25°C)'}`;
  yPosition = addWrappedText(safetyText, margin, yPosition, contentWidth);
  yPosition += 15;
  
  // Packaging Notes Section
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Packaging Notes', margin, yPosition);
  yPosition += 8;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const packagingText = `Packaging: Use chemically compatible containers (HDPE, glass, or PET).
Labeling: Include product name, ingredients, usage instructions, and safety warnings.
Certification: ${formulation.certification || 'Follow applicable industry standards and regulations'}`;
  yPosition = addWrappedText(packagingText, margin, yPosition, contentWidth);
  yPosition += 10;
  
  // Scaling Note Section
  yPosition = checkNewPage(30);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Scaling Note', margin, yPosition);
  yPosition += 8;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
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