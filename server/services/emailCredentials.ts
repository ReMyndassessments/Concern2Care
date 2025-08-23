import { generateCredentialPDF, CredentialPDFOptions, TeacherCredential } from './credentialPdf';
import { EmailConfigurationService } from './emailConfig';
import nodemailer from 'nodemailer';

export interface SendCredentialPDFOptions {
  schoolName: string;
  schoolDistrict?: string;
  contactEmail: string;
  credentials: TeacherCredential[];
  adminEmail?: string; // Email address of the admin sending the credentials
  adminName?: string; // Name of the admin sending the credentials
}

export async function sendCredentialPDF(options: SendCredentialPDFOptions): Promise<boolean> {
  try {
    // We'll use a system admin user to send emails - in production this should be configurable
    const emailConfigService = new EmailConfigurationService();
    
    // For now, we'll need to create a simple email configuration
    // In production, this should use the admin's email configuration
    if (!process.env.SMTP_HOST) {
      console.error('System email configuration not available');
      throw new Error('System email configuration not available. Please configure SMTP settings.');
    }

    // Generate the PDF with credentials
    const pdfOptions: CredentialPDFOptions = {
      schoolName: options.schoolName,
      schoolDistrict: options.schoolDistrict,
      contactEmail: options.contactEmail,
      credentials: options.credentials,
      pdfPassword: options.schoolName.toLowerCase().replace(/\s+/g, '') // Use school name as password
    };

    const pdfBuffer = await generateCredentialPDF(pdfOptions);

    // Create email content
    const subject = `Teacher Login Credentials - ${options.schoolName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Concern2Care Teacher Credentials</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">New teacher accounts have been created for your school</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0;">Dear ${options.schoolName} Administrator,</h2>
          
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
            We've successfully created <strong>${options.credentials.length} new teacher account${options.credentials.length !== 1 ? 's' : ''}</strong> 
            for your institution. The attached PDF document contains all the login credentials your teachers will need to access Concern2Care.
          </p>

          <div style="background: #fff; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">📄 Credential Summary</h3>
            <ul style="color: #374151; margin: 0; padding-left: 20px;">
              <li><strong>Total Teachers:</strong> ${options.credentials.length}</li>
              <li><strong>School:</strong> ${options.schoolName}</li>
              ${options.schoolDistrict ? `<li><strong>District:</strong> ${options.schoolDistrict}</li>` : ''}
              <li><strong>Generated:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">🔒 Security Instructions</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.5;">
              <li><strong>PDF Password:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 3px;">${options.schoolName.toLowerCase().replace(/\s+/g, '')}</code></li>
              <li>Distribute credentials securely to individual teachers</li>
              <li>Teachers must change their passwords on first login</li>
              <li>Delete this email after distributing credentials</li>
            </ul>
          </div>

          <h3 style="color: #1f2937; margin: 30px 0 15px 0;">Next Steps:</h3>
          <ol style="color: #374151; line-height: 1.6; padding-left: 20px;">
            <li>Download and open the attached PDF using the password above</li>
            <li>Securely share individual credentials with each teacher</li>
            <li>Direct teachers to the Concern2Care login page</li>
            <li>Ensure teachers change their temporary passwords immediately</li>
            <li>Contact support if any teachers experience login issues</li>
          </ol>

          <div style="margin: 30px 0 20px 0; padding: 20px; background: #eff6ff; border-radius: 4px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">📚 Teacher Resources</h3>
            <p style="color: #1e40af; margin: 0; line-height: 1.5;">
              Teachers can access the built-in Help Guide within the application for comprehensive training on documenting concerns, 
              receiving AI-powered interventions, and sharing reports with school staff.
            </p>
          </div>

          <p style="color: #374151; line-height: 1.6; margin: 20px 0;">
            If you have any questions or need assistance with teacher onboarding, please don't hesitate to reach out to our support team.
          </p>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Best regards,<br>
              ${options.adminName || 'Administrator'}<br>
              Concern2Care Support Team
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
Teacher Login Credentials - ${options.schoolName}

Dear ${options.schoolName} Administrator,

We've successfully created ${options.credentials.length} new teacher account${options.credentials.length !== 1 ? 's' : ''} for your institution. 

CREDENTIAL SUMMARY:
- Total Teachers: ${options.credentials.length}
- School: ${options.schoolName}
${options.schoolDistrict ? `- District: ${options.schoolDistrict}` : ''}
- Generated: ${new Date().toLocaleDateString()}

SECURITY INSTRUCTIONS:
- PDF Password: ${options.schoolName.toLowerCase().replace(/\s+/g, '')}
- Distribute credentials securely to individual teachers
- Teachers must change their passwords on first login
- Delete this email after distributing credentials

NEXT STEPS:
1. Download and open the attached PDF using the password above
2. Securely share individual credentials with each teacher
3. Direct teachers to the Concern2Care login page
4. Ensure teachers change their temporary passwords immediately
5. Contact support if any teachers experience login issues

The attached PDF document contains all the login credentials your teachers will need to access Concern2Care.

If you have any questions or need assistance with teacher onboarding, please contact our support team.

Best regards,
${options.adminName || 'Administrator'}
Concern2Care Support Team
    `;

    // Create email transporter using system configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      } : undefined,
    });

    // Send the email with PDF attachment
    await transporter.sendMail({
      from: options.adminEmail || process.env.SMTP_FROM || 'noreply@concern2care.com',
      to: options.contactEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
      attachments: [
        {
          filename: `${options.schoolName.replace(/[^a-zA-Z0-9]/g, '_')}_Teacher_Credentials.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    console.log(`Credential PDF sent successfully to ${options.contactEmail}`);
    return true;

  } catch (error) {
    console.error('Error sending credential PDF:', error);
    return false;
  }
}