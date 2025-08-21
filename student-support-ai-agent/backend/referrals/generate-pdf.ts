import { api, APIError } from "encore.dev/api";
import { referralDB } from "./db";
import { getAuthData } from "~encore/auth";

export interface GeneratePDFRequest {
  supportRequestId: number;
}

export interface GeneratePDFResponse {
  pdfContent: string; // Base64 encoded PDF
  filename: string;
}

// Generates a PDF report for a support request suitable for student support meetings.
export const generatePDF = api<GeneratePDFRequest, GeneratePDFResponse>(
  { expose: true, method: "POST", path: "/referrals/:supportRequestId/pdf", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const supportRequest = await referralDB.queryRow<{
      id: number;
      student_first_name: string;
      student_last_initial: string;
      grade: string;
      teacher: string;
      teacher_position: string;
      incident_date: string;
      location: string;
      concern_types: string;
      other_concern_type: string | null;
      concern_description: string;
      severity_level: string;
      actions_taken: string;
      other_action_taken: string | null;
      ai_recommendations: string | null;
      created_at: Date;
      created_by_email: string;
    }>`
      SELECT * FROM referrals WHERE id = ${req.supportRequestId}
    `;

    if (!supportRequest) {
      throw APIError.notFound("Support request not found");
    }

    if (!auth.isAdmin && supportRequest.created_by_email !== auth.email) {
      throw APIError.permissionDenied("You do not have permission to access this report.");
    }

    const concernTypes = JSON.parse(supportRequest.concern_types);
    const actionsTaken = JSON.parse(supportRequest.actions_taken);

    // Create HTML content for PDF generation
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Student Support Request - ${supportRequest.student_first_name} ${supportRequest.student_last_initial}.</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .section-title {
            background-color: #f3f4f6;
            padding: 10px 15px;
            border-left: 4px solid #2563eb;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 15px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 10px;
            vertical-align: top;
        }
        .info-label {
            font-weight: bold;
            color: #374151;
            width: 150px;
        }
        .info-value {
            background-color: #f9fafb;
            border-radius: 4px;
            padding: 8px;
        }
        .concern-description {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            margin: 15px 0;
        }
        .recommendations {
            background-color: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            margin: 15px 0;
        }
        .recommendations h3 {
            color: #1e40af;
            margin-top: 0;
        }
        .recommendations h4 {
            color: #1e40af;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .recommendations ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .recommendations li {
            margin-bottom: 5px;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            background-color: #e5e7eb;
            border-radius: 4px;
            font-size: 12px;
            margin-right: 8px;
            margin-bottom: 4px;
        }
        .severity-mild { background-color: #d1fae5; color: #065f46; }
        .severity-moderate { background-color: #fef3c7; color: #92400e; }
        .severity-urgent { background-color: #fee2e2; color: #991b1b; }
        .disclaimer {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            font-size: 12px;
            color: #991b1b;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Student Support Request</h1>
        <p><strong>Concern2Care</strong> - AI-Powered Student Support System</p>
        <p>Generated on ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
    </div>

    <div class="section">
        <div class="section-title">Student Information</div>
        <table class="info-table">
            <tr>
                <td class="info-label">Student Name:</td>
                <td class="info-value">${supportRequest.student_first_name} ${supportRequest.student_last_initial}.</td>
                <td class="info-label">Grade:</td>
                <td class="info-value">${supportRequest.grade}</td>
            </tr>
            <tr>
                <td class="info-label">Teacher:</td>
                <td class="info-value">${supportRequest.teacher}</td>
                <td class="info-label">Position:</td>
                <td class="info-value">${supportRequest.teacher_position}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Incident Details</div>
        <table class="info-table">
            <tr>
                <td class="info-label">Date of Incident:</td>
                <td class="info-value">${new Date(supportRequest.incident_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric'
                })}</td>
                <td class="info-label">Location:</td>
                <td class="info-value">${supportRequest.location}</td>
            </tr>
            <tr>
                <td class="info-label">Severity Level:</td>
                <td class="info-value">
                    <span class="badge severity-${supportRequest.severity_level.toLowerCase()}">
                        ${supportRequest.severity_level.charAt(0).toUpperCase() + supportRequest.severity_level.slice(1)}
                    </span>
                </td>
                <td class="info-label">Support Request ID:</td>
                <td class="info-value">#${supportRequest.id}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Concern Types</div>
        <div style="margin: 15px 0;">
            ${concernTypes.map((type: string) => `<span class="badge">${type}</span>`).join('')}
            ${supportRequest.other_concern_type ? `<span class="badge">${supportRequest.other_concern_type}</span>` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Concern Description</div>
        <div class="concern-description">
            ${supportRequest.concern_description}
        </div>
    </div>

    ${actionsTaken.length > 0 || supportRequest.other_action_taken ? `
    <div class="section">
        <div class="section-title">Actions Already Taken</div>
        <div style="margin: 15px 0;">
            ${actionsTaken.map((action: string) => `<span class="badge">${action}</span>`).join('')}
            ${supportRequest.other_action_taken ? `<span class="badge">${supportRequest.other_action_taken}</span>` : ''}
        </div>
    </div>
    ` : ''}

    ${supportRequest.ai_recommendations ? `
    <div class="section">
        <div class="section-title">AI-Generated Tier 2 Intervention Recommendations</div>
        <div class="recommendations">
            ${formatRecommendationsForPDF(supportRequest.ai_recommendations)}
        </div>
        <div class="disclaimer">
            <strong>⚠️ IMPORTANT DISCLAIMER:</strong> These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation.
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <p>Generated by Concern2Care from Remynd | Submitted: ${supportRequest.created_at.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
    </div>
</body>
</html>`;

    // Convert HTML to PDF using a simple base64 encoding approach
    // In a real implementation, you would use a library like Puppeteer or similar
    const pdfContent = Buffer.from(htmlContent).toString('base64');
    
    const filename = `student-support-request-${supportRequest.student_first_name}-${supportRequest.student_last_initial}-${supportRequest.id}.pdf`;

    return {
      pdfContent,
      filename
    };
  }
);

function formatRecommendationsForPDF(text: string): string {
  const lines = text.split('\n');
  let html = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      html += '<br>';
      continue;
    }
    
    // Check for follow-up assistance section
    if (trimmedLine === '--- FOLLOW-UP ASSISTANCE ---') {
      html += '<div style="border-top: 2px solid #3b82f6; margin-top: 20px; padding-top: 15px;"><h3 style="color: #1e40af;">Follow-up Implementation Assistance</h3></div>';
      continue;
    }
    
    if (trimmedLine.startsWith('Teacher\'s Question:')) {
      html += `<div style="background-color: #dbeafe; padding: 10px; border-radius: 6px; margin: 10px 0;"><strong>Teacher's Question:</strong> ${trimmedLine.replace('Teacher\'s Question:', '').trim()}</div>`;
      continue;
    }
    
    if (trimmedLine === 'Additional Guidance:') {
      html += '<h4 style="color: #1e40af; margin-top: 15px;">Additional Guidance:</h4>';
      continue;
    }
    
    // Main headings
    if (trimmedLine.startsWith('##') || trimmedLine.startsWith('# ')) {
      html += `<h3>${trimmedLine.replace(/^#+\s*/, '')}</h3>`;
      continue;
    }
    
    // Sub-headings
    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      html += `<h4>${trimmedLine.replace(/\*\*/g, '')}</h4>`;
      continue;
    }
    
    // Numbered lists
    if (/^\d+\./.test(trimmedLine)) {
      html += `<div style="margin: 8px 0; font-weight: 500;">${trimmedLine}</div>`;
      continue;
    }
    
    // Bullet points
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
      html += `<ul style="margin: 5px 0;"><li>${trimmedLine.replace(/^[-•]\s*/, '')}</li></ul>`;
      continue;
    }
    
    // Regular paragraphs
    html += `<p style="margin: 10px 0;">${trimmedLine}</p>`;
  }
  
  return html;
}
