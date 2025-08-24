import jsPDF from 'jspdf';
import type { InsertFormulation } from '@shared/schema';

interface FormulationPDFData extends Omit<InsertFormulation, 'categoryId'> {
  ingredients: string;
  instructions: string;
}

export function generateFormulationPDF(formulation: FormulationPDFData): Buffer {
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
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(41, 128, 185); // Blue color
  doc.text('ChemFormula Pro', margin, yPosition);
  yPosition += 15;
  
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text('Chemical Formulation Report', margin, yPosition);
  yPosition += 20;
  
  // Product Information Section
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.text('Product Information', margin, yPosition);
  yPosition += 10;
  
  // Draw line under section header
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  // Product Name
  doc.setFont('helvetica', 'bold');
  doc.text('Product Name:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(formulation.name || 'Untitled Product', margin + 35, yPosition, contentWidth - 35);
  yPosition += 5;
  
  // Description
  doc.setFont('helvetica', 'bold');
  doc.text('Description:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(formulation.description || 'No description provided', margin + 30, yPosition, contentWidth - 30);
  yPosition += 10;
  
  // Technical Specifications
  yPosition = checkNewPage(60);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.text('Technical Specifications', margin, yPosition);
  yPosition += 10;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  
  const specs = [
    ['pH Level:', formulation.phLevel || 'Not specified'],
    ['Viscosity:', formulation.viscosity || 'Not specified'],
    ['Shelf Life:', formulation.shelfLife || 'Not specified'],
    ['Batch Size:', formulation.batchSize || 'Not specified'],
    ['Processing Time:', formulation.processingTime || 'Not specified'],
    ['Temperature:', formulation.temperature || 'Not specified'],
    ['Storage Conditions:', formulation.storageConditions || 'Not specified'],
    ['Equipment:', formulation.equipment || 'Not specified'],
    ['Certification:', formulation.certification || 'Not specified']
  ];
  
  specs.forEach(([label, value]) => {
    yPosition = checkNewPage(15);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition = addWrappedText(value, margin + 45, yPosition, contentWidth - 45, 11);
    yPosition += 3;
  });
  
  yPosition += 10;
  
  // Ingredients Section
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.text('Ingredients', margin, yPosition);
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
  
  // Instructions Section
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.text('Manufacturing Instructions', margin, yPosition);
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
  
  // Usage Instructions
  yPosition = checkNewPage(40);
  
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.text('Usage Instructions', margin, yPosition);
  yPosition += 10;
  
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  addWrappedText(formulation.usageInstructions || 'No usage instructions provided', margin, yPosition, contentWidth);
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated by ChemFormula Pro - Page ${i} of ${pageCount}`, margin, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, doc.internal.pageSize.getHeight() - 10);
  }
  
  // Convert to buffer
  const pdfBytes = doc.output('arraybuffer');
  return Buffer.from(pdfBytes);
}