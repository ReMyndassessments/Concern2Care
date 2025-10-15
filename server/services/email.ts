import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { emailConfigService } from './emailConfig';

if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn("Email service not configured. Email functionality will be limited.");
}

export interface EmailRecipient {
  email: string;
  name: string;
  role: string;
}

export interface EmailOptions {
  recipients: EmailRecipient[];
  subject: string;
  message?: string;
  attachmentPath?: string;
  reportLink?: string;
}

// Export function to get email transporter for password reset and other services
export async function getEmailTransporter(userId?: string) {
  let transporter;
  let fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
  let fromName = 'Concern2Care';

  // Try to get user-specific or school-specific email configuration
  if (userId) {
    const emailConfig = await emailConfigService.getEmailConfiguration(userId);
    if (emailConfig) {
      transporter = nodemailer.createTransport({
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort,
        secure: emailConfig.smtpSecure,
        auth: {
          user: emailConfig.smtpUser,
          pass: emailConfig.smtpPassword,
        },
      });
      return { transporter, fromAddress: emailConfig.fromAddress, fromName: emailConfig.fromName };
    }
  }

  // Fallback to environment variables
  if (!process.env.SMTP_HOST) {
    return null; // No email configuration available
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return { transporter, fromAddress, fromName };
}

export async function sendReportEmail(options: EmailOptions & { userId?: string }): Promise<boolean> {
  try {
    let transporter;
    let fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
    let fromName = 'Concern2Care';

    // Try to get user-specific or school-specific email configuration
    if (options.userId) {
      console.log(`🔧 Attempting to get email config for user: ${options.userId}`);
      const emailConfig = await emailConfigService.getEmailConfiguration(options.userId);
      console.log(`📧 Email config retrieved:`, emailConfig ? 'Found' : 'Not found');
      
      if (emailConfig) {
        console.log(`📨 Creating transporter with host: ${emailConfig.smtpHost}`);
        transporter = nodemailer.createTransport({
          host: emailConfig.smtpHost,
          port: emailConfig.smtpPort,
          secure: emailConfig.smtpSecure,
          auth: {
            user: emailConfig.smtpUser,
            pass: emailConfig.smtpPassword,
          },
        });
        fromAddress = emailConfig.fromAddress;
        fromName = emailConfig.fromName;
        console.log(`✅ Transporter created successfully`);
      } else {
        console.log(`❌ No email config found for user ${options.userId}`);
      }
    } else {
      console.log(`⚠️ No userId provided to sendReportEmail`);
    }

    // Fallback to environment variables or dev mode
    if (!transporter) {
      if (!process.env.SMTP_HOST) {
        console.log("Email would be sent to:", options.recipients.map(r => r.email).join(', '));
        console.log("Subject:", options.subject);
        console.log("Message:", options.message);
        return true; // Return success for development
      }

      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    const recipientEmails = options.recipients.map(r => r.email).join(', ');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .button { 
              display: inline-block; 
              background-color: #2563eb; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Concern2Care Report</h1>
          </div>
          <div class="content">
            <p>A new student concern report has been shared with you.</p>
            ${options.message ? `<p><strong>Additional Message:</strong></p><p>${options.message}</p>` : ''}
            ${options.reportLink ? `<p><a href="${options.reportLink}" class="button">View Report</a></p>` : ''}
            <p>This report contains confidential student information and should be handled according to FERPA guidelines.</p>
          </div>
          <div class="footer">
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <h3 style="color: #1e40af; margin-bottom: 12px;">🔓 Take Your Practice Further with the Full Concern2Care App</h3>
            <p style="margin-bottom: 12px;">You're currently using Free Student Support for Schools — designed to give every teacher access to high-quality, research-based support up to 3 times per month.</p>
            <p style="margin-bottom: 12px;"><strong>Upgrade anytime to unlock the complete Guided Student Support Experience:</strong></p>
            <ul style="margin-left: 20px; margin-bottom: 12px;">
              <li>✨ More Requests & Continuous Guided Practice</li>
              <li>🧩 Differentiation & Tier 2 Intervention Planning</li>
              <li>🗂️ Classroom & Case Management Tools</li>
              <li>📊 Professional Dashboard</li>
              <li>💬 Ongoing Guided Practice Integration</li>
              <li>🚀 Continuous Feature Development</li>
            </ul>
            <p style="margin-bottom: 12px;"><strong>💚 Ready to unlock the full experience?</strong><br>Visit Concern2Care.com or log into your main C2C account to upgrade today.</p>
            <p style="margin-bottom: 12px;"><em>Let's capture what matters — and see what changes.</em></p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p>This message was sent by Concern2Care. Do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `${fromName} <${fromAddress}>`,
      to: recipientEmails,
      subject: options.subject,
      html: htmlContent,
      attachments: options.attachmentPath ? (() => {
        const fileExt = path.extname(options.attachmentPath).toLowerCase();
        const isHtml = fileExt === '.html' || fileExt === '.htm';
        const isPdf = fileExt === '.pdf';
        
        return [{
          filename: `concern-report${fileExt}`,
          path: options.attachmentPath,
          contentType: isHtml ? 'text/html' : isPdf ? 'application/pdf' : 'application/octet-stream',
        }];
      })() : undefined,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    console.error('   Error details:', error);
    if (options.attachmentPath) {
      console.error('   Attachment path:', options.attachmentPath);
      console.error('   Attachment exists:', fs.existsSync(options.attachmentPath));
    }
    return false;
  }
}

export function generateSecureReportLink(concernId: string, baseUrl: string): string {
  return `${baseUrl}/concerns/${concernId}`;
}
