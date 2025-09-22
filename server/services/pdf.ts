import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { ConcernWithDetails, Intervention } from "@shared/schema";

export async function generateConcernReport(
  concern: ConcernWithDetails,
  interventions: Intervention[],
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        bufferPages: true
      });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).fillColor('#2563eb').text('Concern2Care', 50, 50);
      doc.fontSize(16).fillColor('#000000').text('Your Personalized Teaching Support Guide', 50, 80);
      
      // Date
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.fontSize(10).fillColor('#666666').text(`Generated on ${currentDate}`, 50, 110);

      // Line separator
      doc.moveTo(50, 130).lineTo(545, 130).stroke('#e2e8f0');

      let yPosition = 150;

      // Concern Details
      doc.fontSize(14).fillColor('#000000').text('Concern Details', 50, yPosition);
      yPosition += 25;
      const concernTypes = Array.isArray(concern.concernTypes) ? concern.concernTypes : [];
      const concernTypeText = concernTypes.length > 0 ? concernTypes.join(', ') : 'Not specified';
      doc.fontSize(12).text(`Type: ${concernTypeText}`, 50, yPosition);
      yPosition += 20;
      doc.text(`Date Documented: ${concern.createdAt?.toLocaleDateString('en-US') || 'Unknown'}`, 50, yPosition);
      yPosition += 25;
      
      doc.text('Description:', 50, yPosition);
      yPosition += 15;
      const descriptionLines = doc.heightOfString(concern.description, { width: 495 });
      doc.text(concern.description, 50, yPosition, { width: 495, align: 'justify' });
      yPosition += descriptionLines + 30;

      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      // AI-Generated Interventions
      doc.fontSize(14).fillColor('#000000').text('Your Learning-Focused Strategy Toolkit', 50, yPosition);
      yPosition += 25;

      interventions.forEach((intervention, index) => {
        // Ensure space for intervention header
        if (yPosition > 680) {
          doc.addPage();
          yPosition = 50;
        }

        // Intervention title with proper spacing
        doc.fontSize(13).fillColor('#2563eb');
        const titleText = `${index + 1}. ${intervention.title}`;
        const titleHeight = doc.heightOfString(titleText, { width: 495 });
        doc.text(titleText, 50, yPosition, { width: 495 });
        yPosition += titleHeight + 12;
        
        // Parse and format the description markdown with improved spacing
        yPosition = parseMarkdownToPDF(doc, intervention.description, yPosition);
        yPosition += 10;

        // Implementation steps with proper formatting
        if (intervention.steps && Array.isArray(intervention.steps)) {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(11).fillColor('#059669').text('Implementation Steps:', 50, yPosition);
          yPosition += 15;
          
          intervention.steps.forEach((step, stepIndex) => {
            if (yPosition > 720) {
              doc.addPage();
              yPosition = 50;
            }
            
            const stepText = `${stepIndex + 1}. ${step}`;
            const stepHeight = doc.heightOfString(stepText, { width: 475 });
            doc.fontSize(9).fillColor('#374151').text(stepText, 70, yPosition, { width: 475 });
            yPosition += stepHeight + 6;
          });
          yPosition += 8;
        }

        // Timeline with proper spacing
        if (intervention.timeline) {
          if (yPosition > 730) {
            doc.addPage();
            yPosition = 50;
          }
          
          const timelineText = `Timeline: ${intervention.timeline}`;
          const timelineHeight = doc.heightOfString(timelineText, { width: 495 });
          doc.fontSize(10).fillColor('#666666').text(timelineText, 50, yPosition, { width: 495 });
          yPosition += timelineHeight + 10;
        }

        // Add proper spacing between interventions
        yPosition += 20;
      });

      // Follow-up questions if any
      if (concern.followUpQuestions && concern.followUpQuestions.length > 0) {
        if (yPosition > 600) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(14).fillColor('#000000').text('Follow-up Questions & Responses', 50, yPosition);
        yPosition += 25;
        
        // No special handling needed - Chinese characters will be rendered directly

        concern.followUpQuestions.forEach((qa, index) => {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }

            // Render question text directly
          const questionText = `Q${index + 1}: ${qa.question}`;
          doc.fontSize(11).fillColor('#2563eb').text(questionText, 50, yPosition);
          yPosition += 20;
          
          doc.fontSize(10).fillColor('#000000').text('A: ', 50, yPosition);
          yPosition += 15;
          
          // Apply markdown parsing to the response
          yPosition = parseMarkdownToPDF(doc, qa.response, yPosition);
          yPosition += 15;
        });
      }

      // Footer
      doc.fontSize(8).fillColor('#666666').text(
        'This guide was created by Concern2Care to support your teaching journey. Every strategy is a starting point—feel free to adapt and make them your own. You know your students best, and these ideas are here to help you build on your excellent work.',
        50,
        doc.page.height - 80,
        { width: 495, align: 'center' }
      );

      doc.end();
      
      stream.on('finish', () => {
        resolve();
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Improved PDF formatting with proper text height calculation
export function parseMarkdownToPDF(doc: any, text: string, startY: number): number {
  const lines = text.split('\n');
  let yPosition = startY;
  let inBulletList = false;
  const pageWidth = 545;
  const leftMargin = 50;
  const pageHeight = 750; // More conservative page height
  
  // Helper function to ensure proper spacing and page breaks
  const ensureSpace = (requiredHeight: number): void => {
    if (yPosition + requiredHeight > pageHeight) {
      doc.addPage();
      yPosition = 50;
      inBulletList = false; // Reset bullet list state on new page
    }
  };
  
  // Helper function to add text with proper height calculation and non-Latin character detection
  const addText = (content: string, x: number, fontSize: number, color: string, options: any = {}): number => {
    const width = options.width || (pageWidth - x);
    ensureSpace(Math.max(fontSize * 1.5, 20)); // Reduce minimum space requirement
    
    doc.fontSize(fontSize).fillColor(color);
    
    // Clean and sanitize the content to prevent encoding issues
    const cleanContent = content
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\uFFFD/g, '') // Remove replacement characters
      .trim();
    
    try {
      // Try to render the text directly (including Chinese characters)
      const height = doc.heightOfString(cleanContent, { width, ...options });
      doc.text(cleanContent, x, yPosition, { width, ...options });
      return Math.max(height, fontSize * 1.2);
    } catch (error) {
      console.warn('PDF text rendering error:', error);
      // Fallback to safe ASCII characters only if there's an error
      const safeContent = cleanContent.replace(/[^\x20-\x7E]/g, '?');
      const height = doc.heightOfString(safeContent, { width, ...options });
      doc.text(safeContent, x, yPosition, { width, ...options });
      return Math.max(height, fontSize * 1.2);
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    if (!trimmedLine || trimmedLine === '***' || trimmedLine === '---') {
      // Skip empty lines and formatting artifacts
      continue;
    }
    
    // Handle # headers (single #) - including those without spaces  
    if (trimmedLine.match(/^#\s*(.+)/) || trimmedLine.startsWith('#')) {
      const title = trimmedLine.replace(/^#\s*/, '');
      yPosition += 5;
      const height = addText(title, leftMargin, 16, '#1e40af', { align: 'left' });
      yPosition += height + 8;
      continue;
    }
    
    // Handle ## headers (double ##) - including those without spaces
    if (trimmedLine.match(/^##\s*(.+)/) || trimmedLine.startsWith('##')) {
      const title = trimmedLine.replace(/^##\s*/, '');
      yPosition += 3;
      const height = addText(title, leftMargin, 14, '#1e40af', { align: 'left' });
      yPosition += height + 6;
      continue;
    }
    
    // Main headings (### **Title**) - Large, prominent headings
    if (trimmedLine.match(/^###\s*\*\*(.*?)\*\*/)) {
      const title = trimmedLine.replace(/^###\s*\*\*(.*?)\*\*/, '$1');
      yPosition += 3; // Minimal space before heading
      
      // Draw separator line
      ensureSpace(20);
      doc.moveTo(leftMargin, yPosition).lineTo(pageWidth, yPosition).stroke('#e2e8f0');
      yPosition += 4;
      
      const height = addText(title, leftMargin, 14, '#2563eb', { align: 'left' });
      yPosition += height + 3;
      inBulletList = false;
      continue;
    }
    
    // Strategy headings with proper spacing
    if (trimmedLine.match(/^\*\s*\*\*Strategy:\s*(.*?)\*\*/)) {
      const title = trimmedLine.replace(/^\*\s*\*\*Strategy:\s*(.*?)\*\*/, '$1');
      yPosition += 3;
      const height = addText(`Strategy: ${title}`, leftMargin + 10, 11, '#1e40af', { align: 'left' });
      yPosition += height + 2;
      inBulletList = false;
      continue;
    }
    
    // Implementation headings
    if (trimmedLine.match(/^\*\s*\*\*Implementation:\*\*/)) {
      yPosition += 8;
      const height = addText('Implementation Steps:', leftMargin + 20, 10, '#059669', { align: 'left' });
      yPosition += height + 6;
      inBulletList = true;
      continue;
    }
    
    // Step headings with proper numbering
    if (trimmedLine.match(/^Step\s*\d+:|^-\s*\*\*Step\s*\d+:\*\*/)) {
      let cleanText = trimmedLine.replace(/\*\*/g, '').replace(/^-\s*/, '');
      yPosition += 4;
      const height = addText(cleanText, leftMargin + 20, 10, '#059669', { align: 'left' });
      yPosition += height + 3;
      inBulletList = true;
      continue;
    }

    // Numbered headings (1. **Title** or 1. Title:)
    if (trimmedLine.match(/^\d+\./)) {
      const cleanText = trimmedLine.replace(/\*\*/g, '');
      yPosition += 6;
      const height = addText(cleanText, leftMargin + 10, 11, '#1e40af', { align: 'left' });
      yPosition += height + 5;
      inBulletList = false;
      continue;
    }

    // Other bold headings (* **Title:**)
    if (trimmedLine.match(/^\*\s*\*\*(.*?):\*\*/)) {
      const title = trimmedLine.replace(/^\*\s*\*\*(.*?):\*\*/, '$1');
      yPosition += 4;
      const height = addText(`${title}:`, leftMargin + 10, 10, '#7c3aed', { align: 'left' });
      yPosition += height + 3;
      inBulletList = true;
      continue;
    }
    
    // Bold headings without colons
    if (trimmedLine.match(/^\*\s*\*\*(.*?)\*\*/) && !trimmedLine.includes(':')) {
      const title = trimmedLine.replace(/^\*\s*\*\*(.*?)\*\*/, '$1');
      yPosition += 6;
      const height = addText(title, leftMargin + 10, 10, '#374151', { align: 'left' });
      yPosition += height + 5;
      inBulletList = false;
      continue;
    }

    // Generic bold headings (**Title**) 
    if (trimmedLine.match(/^\*\*(.*?)\*\*/) && !trimmedLine.includes(':')) {
      const title = trimmedLine.replace(/^\*\*(.*?)\*\*/, '$1');
      yPosition += 8;
      const height = addText(title, leftMargin + 5, 11, '#374151', { align: 'left' });
      yPosition += height + 6;
      inBulletList = false;
      continue;
    }
    
    // Nested bullet points with proper indentation
    if (trimmedLine.match(/^\s{2,}\*\s/) || trimmedLine.match(/^\s{2,}-\s/)) {
      const content = trimmedLine.replace(/^\s*[\*-]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1');
      const height = addText(`- ${content}`, leftMargin + 40, 9, '#6b7280', { width: 455 });
      yPosition += height + 2;
      inBulletList = true;
      continue;
    }
    
    // Regular bullet points - handle •, *, and - characters
    if (trimmedLine.match(/^[-\*•]\s/) || trimmedLine.startsWith('•')) {
      const content = trimmedLine.replace(/^[-\*•]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1');
      const height = addText(`• ${content}`, leftMargin + 20, 9, '#374151', { width: 475 });
      yPosition += height + 2;
      inBulletList = true;
      continue;
    }
    
    // Timeline and resource information
    if (trimmedLine.match(/^\*\*Timeline:\*\*|^\*\*Resources.*:\*\*/)) {
      const content = trimmedLine.replace(/\*\*/g, '');
      const height = addText(content, leftMargin + 25, 9, '#059669', { width: 460 });
      yPosition += height + 3;
      continue;
    }
    
    // Enhanced table handling - detect table rows (including markdown table format)
    if ((trimmedLine.includes('|') && trimmedLine.split('|').length > 2) || 
        trimmedLine.match(/^\*\*.*\*\*\s*\|\s*\*\*.*\*\*\s*\|\s*\*\*.*\*\*$/)) {
      // Look ahead to collect all table rows
      const tableRows = [];
      let j = i;
      
      while (j < lines.length) {
        const line = lines[j].trim();
        if (line.includes('|') && line.split('|').length > 2) {
          // Clean up the row data and remove markdown formatting
          const cells = line.split('|')
            .map(cell => cell.trim().replace(/\*\*/g, '')) // Remove markdown bold
            .filter(cell => cell.length > 0);
          if (cells.length > 0) {
            tableRows.push(cells);
          }
          j++;
        } else if (line.match(/^[\-:|\s]+$/)) {
          // Skip separator rows (like :--- | :--- |)
          j++;
        } else {
          break;
        }
      }
      
      if (tableRows.length > 0) {
        console.log('Rendering table with rows:', tableRows.length);
        yPosition += 5; // Reduce space before table
        yPosition = drawTable(doc, tableRows, leftMargin, yPosition, pageWidth - leftMargin);
        yPosition += 8; // Reduce space after table
        i = j - 1; // Skip processed lines
        inBulletList = false;
        continue;
      }
    }
    
    // Skip separator lines that cause formatting issues
    if (trimmedLine === '---' || trimmedLine.match(/^-{3,}$/)) {
      continue;
    }
    
    // Regular paragraphs with proper wrapping
    if (trimmedLine.length > 0) {
      const indent = inBulletList ? leftMargin + 25 : leftMargin + 10;
      const width = inBulletList ? 460 : 485;
      const cleanText = trimmedLine
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Add extra spacing for paragraphs to improve readability
      const height = addText(cleanText, indent, 9, '#374151', { width, align: 'left', lineGap: 2 });
      yPosition += height + 6; // Increased spacing between paragraphs
    }
  }
  
  return yPosition + 8;
}

// Helper function to draw professional tables in PDF
function drawTable(doc: any, rows: string[][], x: number, y: number, maxWidth: number): number {
  if (rows.length === 0) return y;
  
  const cellPadding = 6; // Reduced padding for more compact layout
  const headerRowHeight = 22; // Smaller header row
  const regularRowHeight = 18; // Smaller regular rows
  const numCols = Math.max(...rows.map(row => row.length));
  const colWidth = (maxWidth - 2) / numCols; // Distribute width evenly
  
  let currentY = y;
  
  // Ensure space for table (estimate with max row height)
  const estimatedTableHeight = (headerRowHeight + (rows.length - 1) * regularRowHeight) + 10;
  if (currentY + estimatedTableHeight > 750) {
    doc.addPage();
    currentY = 50;
  }
  
  rows.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0;
    const bgColor = isHeader ? '#f1f5f9' : '#ffffff'; // Better contrast for header
    const textColor = isHeader ? '#0f172a' : '#475569'; // Darker text for better readability
    const fontSize = isHeader ? 10 : 9; // Larger font sizes
    const rowHeight = isHeader ? headerRowHeight : regularRowHeight;
    
    // Draw row background for all rows
    doc.rect(x, currentY, maxWidth, rowHeight).fill(bgColor).stroke('#cbd5e1');
    
    // Draw cell borders and content
    row.forEach((cell, colIndex) => {
      const cellX = x + colIndex * colWidth;
      const cellY = currentY;
      
      // Draw cell border with professional styling
      doc.lineWidth(0.5)
         .rect(cellX, cellY, colWidth, rowHeight)
         .stroke(isHeader ? '#94a3b8' : '#e2e8f0');
      
      // Add cell text
      const textX = cellX + cellPadding;
      const textY = cellY + (rowHeight - fontSize) / 2 + 2;
      const textWidth = colWidth - 2 * cellPadding;
      
      doc.fontSize(fontSize)
         .fillColor(textColor)
         .text(cell, textX, textY, {
           width: textWidth,
           height: rowHeight - 2 * cellPadding,
           align: isHeader ? 'center' : 'left', // Center headers, left-align content
           ellipsis: true
         });
    });
    
    currentY += rowHeight;
  });
  
  return currentY;
}

export function ensureReportsDirectory(): string {
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  return reportsDir;
}
