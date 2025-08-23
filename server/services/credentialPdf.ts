import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

export interface TeacherCredential {
  name: string;
  email: string;
  password: string;
  school: string;
}

export interface CredentialPDFOptions {
  schoolName: string;
  schoolDistrict?: string;
  contactEmail: string;
  credentials: TeacherCredential[];
  pdfPassword?: string;
}

export async function generateCredentialPDF(options: CredentialPDFOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Teacher Login Credentials - ${options.schoolName}`,
          Author: 'Concern2Care',
          Subject: 'Teacher Account Credentials',
          Keywords: 'teacher credentials login password',
          Creator: 'Concern2Care System',
          CreationDate: new Date(),
        }
      });

      // Note: Password protection would be implemented here in a production environment
      // For now, we'll rely on secure email transmission and clear instructions

      const chunks: Buffer[] = [];
      
      // Collect the PDF chunks
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header with logo area and title
      doc.fontSize(24)
         .fillColor('#2563eb')
         .text('Concern2Care', 50, 50, { align: 'left' });

      doc.fontSize(20)
         .fillColor('#1f2937')
         .text('Teacher Login Credentials', 50, 90, { align: 'left' });

      // School information
      let yPosition = 140;
      doc.fontSize(14)
         .fillColor('#374151')
         .text(`School: ${options.schoolName}`, 50, yPosition);
      
      yPosition += 20;
      if (options.schoolDistrict) {
        doc.text(`District: ${options.schoolDistrict}`, 50, yPosition);
        yPosition += 20;
      }

      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 50, yPosition);
      yPosition += 20;
      doc.text(`Contact: ${options.contactEmail}`, 50, yPosition);
      yPosition += 40;

      // Security notice
      doc.fontSize(10)
         .fillColor('#dc2626')
         .text('⚠️ CONFIDENTIAL: This document contains sensitive login credentials. Please distribute securely and ensure teachers change their passwords upon first login.', 50, yPosition, { 
           width: 500, 
           align: 'justify' 
         });
      yPosition += 60;

      // Instructions
      doc.fontSize(12)
         .fillColor('#1f2937')
         .text('Instructions for Teachers:', 50, yPosition);
      yPosition += 20;

      const instructions = [
        '1. Go to the Concern2Care login page',
        '2. Enter your email address and temporary password below',
        '3. You will be prompted to change your password on first login',
        '4. Choose a strong password that you will remember',
        '5. Begin documenting student concerns and receiving AI-powered interventions'
      ];

      doc.fontSize(10);
      instructions.forEach(instruction => {
        doc.text(instruction, 70, yPosition);
        yPosition += 15;
      });

      yPosition += 30;

      // Table header
      doc.fontSize(12)
         .fillColor('#1f2937')
         .text('Teacher Login Credentials', 50, yPosition, { underline: true });
      yPosition += 25;

      // Table headers
      doc.fontSize(10)
         .fillColor('#374151');
      
      const tableHeaders = ['Name', 'Email Address', 'Temporary Password'];
      const columnWidths = [150, 200, 150];
      const columnPositions = [50, 200, 400];

      // Draw header row background
      doc.rect(50, yPosition - 5, 500, 20)
         .fillColor('#f3f4f6')
         .fill();

      // Header text
      doc.fillColor('#1f2937')
         .font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, columnPositions[i], yPosition, { width: columnWidths[i] });
      });

      yPosition += 25;

      // Table rows
      doc.font('Helvetica')
         .fontSize(9);

      options.credentials.forEach((credential, index) => {
        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(50, yPosition - 3, 500, 18)
             .fillColor('#f9fafb')
             .fill();
        }

        doc.fillColor('#374151');
        
        // Name
        doc.text(credential.name, columnPositions[0], yPosition, { 
          width: columnWidths[0], 
          ellipsis: true 
        });
        
        // Email
        doc.text(credential.email, columnPositions[1], yPosition, { 
          width: columnWidths[1], 
          ellipsis: true 
        });
        
        // Password
        doc.font('Helvetica-Bold')
           .text(credential.password, columnPositions[2], yPosition, { 
             width: columnWidths[2] 
           })
           .font('Helvetica');

        yPosition += 18;

        // Check if we need a new page
        if (yPosition > 700 && index < options.credentials.length - 1) {
          doc.addPage();
          yPosition = 50;
          
          // Repeat headers on new page
          doc.fontSize(10)
             .fillColor('#374151');
          
          doc.rect(50, yPosition - 5, 500, 20)
             .fillColor('#f3f4f6')
             .fill();

          doc.fillColor('#1f2937')
             .font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, columnPositions[i], yPosition, { width: columnWidths[i] });
          });

          yPosition += 25;
          doc.font('Helvetica')
             .fontSize(9);
        }
      });

      // Footer
      yPosition += 40;
      doc.fontSize(8)
         .fillColor('#6b7280')
         .text('This document was automatically generated by Concern2Care. Keep this information secure and confidential.', 50, yPosition, { 
           width: 500, 
           align: 'center' 
         });

      yPosition += 20;
      doc.text('For technical support, contact your system administrator.', 50, yPosition, { 
        width: 500, 
        align: 'center' 
      });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}