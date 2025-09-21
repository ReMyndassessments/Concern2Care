// SendGrid email service - From javascript_sendgrid integration
import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set. SendGrid email functionality will be limited.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('SendGrid not configured. Email would be sent:', {
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: params.text
      });
      return true; // Return success for development mode
    }

    console.log(`📧 Sending email via SendGrid to: ${params.to}`);
    console.log(`📧 Subject: ${params.subject}`);
    
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log('✅ Email sent successfully via SendGrid');
    return true;
  } catch (error) {
    console.error('❌ SendGrid email error:', error);
    return false;
  }
}

export async function sendContactFormEmail(contactData: {
  name: string;
  email: string;
  inquiryType: string;
  message: string;
}): Promise<boolean> {
  const subject = `Concern2Care Contact Request - ${contactData.inquiryType}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #2563eb; }
          .footer { background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Contact Request</h1>
        </div>
        <div class="content">
          <div class="info-row">
            <span class="label">Name:</span> ${contactData.name}
          </div>
          <div class="info-row">
            <span class="label">Email:</span> ${contactData.email}
          </div>
          <div class="info-row">
            <span class="label">Inquiry Type:</span> ${contactData.inquiryType}
          </div>
          <div class="info-row">
            <span class="label">Message:</span><br>
            ${contactData.message.replace(/\n/g, '<br>')}
          </div>
          <div class="info-row">
            <span class="label">Submitted:</span> ${new Date().toLocaleString()}
          </div>
        </div>
        <div class="footer">
          <p>This message was sent from the Concern2Care contact form.</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `
New Contact Request

Name: ${contactData.name}
Email: ${contactData.email}
Inquiry Type: ${contactData.inquiryType}
Message: ${contactData.message}

Submitted: ${new Date().toLocaleString()}
  `.trim();

  return await sendEmail({
    to: 'ne_roberts@yahoo.com',
    from: 'noreply@concern2care.com', // Use your verified SendGrid sender
    subject: subject,
    text: textContent,
    html: htmlContent
  });
}