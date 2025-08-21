import nodemailer from 'nodemailer';

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

export async function sendReportEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_HOST) {
      console.log("Email would be sent to:", options.recipients.map(r => r.email).join(', '));
      console.log("Subject:", options.subject);
      console.log("Message:", options.message);
      return true; // Return success for development
    }

    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

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
            <p>This message was sent by Concern2Care. Do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipientEmails,
      subject: options.subject,
      html: htmlContent,
      attachments: options.attachmentPath ? [{
        filename: 'concern-report.pdf',
        path: options.attachmentPath,
      }] : undefined,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export function generateSecureReportLink(reportId: string, baseUrl: string): string {
  return `${baseUrl}/reports/${reportId}`;
}
