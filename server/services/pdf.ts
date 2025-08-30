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
      doc.fontSize(16).fillColor('#000000').text('Student Concern Report', 50, 80);
      
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

      // Student Information
      doc.fontSize(14).fillColor('#000000').text('Student Information', 50, yPosition);
      yPosition += 25;
      doc.fontSize(12).text(`Name: ${concern.studentFirstName} ${concern.studentLastInitial}.`, 50, yPosition);
      yPosition += 20;
      doc.text(`Teacher: ${concern.teacher.firstName} ${concern.teacher.lastName}`, 50, yPosition);
      yPosition += 20;
      doc.text(`School: ${concern.teacher.school || 'Not specified'}`, 50, yPosition);
      yPosition += 30;

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
      doc.fontSize(14).fillColor('#000000').text('AI-Generated Intervention Strategies', 50, yPosition);
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

        concern.followUpQuestions.forEach((qa, index) => {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }

          // Handle question text with non-Latin character detection
          const questionText = `Q${index + 1}: ${qa.question}`;
          const hasNonLatinChars = /[^\u0000-\u024F\u1E00-\u1EFF]/.test(questionText);
          
          if (hasNonLatinChars) {
            const fallbackText = `Q${index + 1}: [Question contains non-Latin characters - please view online]`;
            doc.fontSize(11).fillColor('#dc2626').text(fallbackText, 50, yPosition);
          } else {
            doc.fontSize(11).fillColor('#2563eb').text(questionText, 50, yPosition);
          }
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
        'This report was generated by Concern2Care. All intervention strategies are evidence-based and appropriate for Tier 2 implementation.',
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
    ensureSpace(Math.max(fontSize * 2, 25)); // Ensure minimum space
    
    // Check if content contains non-Latin characters (like Chinese, Arabic, etc.)
    const hasNonLatinChars = /[^\u0000-\u024F\u1E00-\u1EFF]/.test(content);
    
    doc.fontSize(fontSize).fillColor(color);
    
    if (hasNonLatinChars) {
      // For content with non-Latin characters, provide a clear message
      const fallbackText = '[Content contains non-Latin characters - please view online for full text]';
      const height = doc.heightOfString(fallbackText, { width, ...options });
      doc.fillColor('#dc2626'); // Red color to make it noticeable
      doc.text(fallbackText, x, yPosition, { width, ...options });
      doc.fillColor(color); // Reset color
      return Math.max(height, fontSize * 1.2);
    } else {
      // Regular Latin text - process normally
      const height = doc.heightOfString(content, { width, ...options });
      doc.text(content, x, yPosition, { width, ...options });
      return Math.max(height, fontSize * 1.2);
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    if (!trimmedLine) {
      // Add minimal spacing for empty lines
      yPosition += 8;
      continue;
    }
    
    // Main headings (### **Title**) - Large, prominent headings
    if (trimmedLine.match(/^###\s*\*\*(.*?)\*\*/)) {
      const title = trimmedLine.replace(/^###\s*\*\*(.*?)\*\*/, '$1');
      yPosition += 15; // Space before heading
      
      // Draw separator line
      ensureSpace(30);
      doc.moveTo(leftMargin, yPosition).lineTo(pageWidth, yPosition).stroke('#e2e8f0');
      yPosition += 8;
      
      const height = addText(title, leftMargin, 14, '#2563eb', { align: 'left' });
      yPosition += height + 12;
      inBulletList = false;
      continue;
    }
    
    // Strategy headings with proper spacing
    if (trimmedLine.match(/^\*\s*\*\*Strategy:\s*(.*?)\*\*/)) {
      const title = trimmedLine.replace(/^\*\s*\*\*Strategy:\s*(.*?)\*\*/, '$1');
      yPosition += 10;
      const height = addText(`Strategy: ${title}`, leftMargin + 10, 11, '#1e40af', { align: 'left' });
      yPosition += height + 8;
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
      yPosition += 6;
      const height = addText(cleanText, leftMargin + 20, 10, '#059669', { align: 'left' });
      yPosition += height + 5;
      inBulletList = true;
      continue;
    }

    // Numbered headings (1. **Title** or 1. Title:)
    if (trimmedLine.match(/^\d+\./)) {
      const cleanText = trimmedLine.replace(/\*\*/g, '');
      yPosition += 10;
      const height = addText(cleanText, leftMargin + 10, 11, '#1e40af', { align: 'left' });
      yPosition += height + 8;
      inBulletList = false;
      continue;
    }

    // Other bold headings (* **Title:**)
    if (trimmedLine.match(/^\*\s*\*\*(.*?):\*\*/)) {
      const title = trimmedLine.replace(/^\*\s*\*\*(.*?):\*\*/, '$1');
      yPosition += 6;
      const height = addText(`${title}:`, leftMargin + 10, 10, '#7c3aed', { align: 'left' });
      yPosition += height + 5;
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
      yPosition += height + 3;
      inBulletList = true;
      continue;
    }
    
    // Regular bullet points
    if (trimmedLine.match(/^[-\*]\s/)) {
      const content = trimmedLine.replace(/^[-\*]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1');
      const height = addText(`- ${content}`, leftMargin + 20, 9, '#374151', { width: 475 });
      yPosition += height + 4;
      inBulletList = true;
      continue;
    }
    
    // Timeline and resource information
    if (trimmedLine.match(/^\*\*Timeline:\*\*|^\*\*Resources.*:\*\*/)) {
      const content = trimmedLine.replace(/\*\*/g, '');
      const height = addText(content, leftMargin + 25, 9, '#059669', { width: 460 });
      yPosition += height + 5;
      continue;
    }
    
    // Table handling - detect table rows
    if (trimmedLine.includes('|') && trimmedLine.split('|').length > 2) {
      // Look ahead to collect all table rows
      const tableRows = [];
      let j = i;
      
      while (j < lines.length) {
        const line = lines[j].trim();
        if (line.includes('|') && line.split('|').length > 2) {
          // Clean up the row data
          const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
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
        yPosition += 10;
        yPosition = drawTable(doc, tableRows, leftMargin, yPosition, pageWidth - leftMargin);
        yPosition += 15;
        i = j - 1; // Skip processed lines
        inBulletList = false;
        continue;
      }
    }
    
    // Separators
    if (trimmedLine === '---') {
      yPosition += 12;
      ensureSpace(20);
      doc.moveTo(leftMargin, yPosition).lineTo(pageWidth, yPosition).stroke('#d1d5db');
      yPosition += 12;
      inBulletList = false;
      continue;
    }
    
    // Regular paragraphs with proper wrapping
    if (trimmedLine.length > 0) {
      const indent = inBulletList ? leftMargin + 25 : leftMargin + 10;
      const width = inBulletList ? 460 : 485;
      const cleanText = trimmedLine.replace(/\*\*(.*?)\*\*/g, '$1');
      
      const height = addText(cleanText, indent, 9, '#374151', { width, align: 'justify' });
      yPosition += height + 5;
    }
  }
  
  return yPosition + 15;
}

// Helper function to draw tables in PDF
function drawTable(doc: any, rows: string[][], x: number, y: number, maxWidth: number): number {
  if (rows.length === 0) return y;
  
  const cellPadding = 4;
  const rowHeight = 20;
  const numCols = Math.max(...rows.map(row => row.length));
  const colWidth = (maxWidth - (numCols + 1) * 2) / numCols; // Account for border width
  
  let currentY = y;
  
  // Ensure space for table
  const tableHeight = rows.length * rowHeight + 10;
  if (currentY + tableHeight > 750) {
    doc.addPage();
    currentY = 50;
  }
  
  rows.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0;
    const bgColor = isHeader ? '#f8fafc' : '#ffffff';
    const textColor = isHeader ? '#1e293b' : '#374151';
    const fontSize = isHeader ? 9 : 8;
    
    // Draw row background
    if (isHeader) {
      doc.rect(x, currentY, maxWidth, rowHeight).fill(bgColor);
    }
    
    // Draw cell borders and content
    row.forEach((cell, colIndex) => {
      const cellX = x + colIndex * colWidth;
      const cellY = currentY;
      
      // Draw cell border
      doc.rect(cellX, cellY, colWidth, rowHeight).stroke('#e2e8f0');
      
      // Add cell text
      const textX = cellX + cellPadding;
      const textY = cellY + (rowHeight - fontSize) / 2 + 2;
      const textWidth = colWidth - 2 * cellPadding;
      
      doc.fontSize(fontSize)
         .fillColor(textColor)
         .text(cell, textX, textY, {
           width: textWidth,
           height: rowHeight - 2 * cellPadding,
           align: 'left',
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
