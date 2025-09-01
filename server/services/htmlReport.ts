import fs from "fs";
import path from "path";
import { ConcernWithDetails, Intervention } from "@shared/schema";

interface HTMLReportOptions {
  includeLetterhead?: boolean;
  theme?: 'default' | 'professional' | 'minimal';
}

interface MeetingData {
  title: string;
  type: string;
  date: string;
  time: string;
  attendees?: string[];
  agenda?: string;
  selectedConcerns?: any[];
  notes?: string;
  includeRecommendations?: boolean;
  includeProgressNotes?: boolean;
}

export async function generateMeetingHTMLReport(
  meetingData: MeetingData,
  outputPath: string,
  generatedBy: { firstName: string; lastName: string },
  options: HTMLReportOptions = {}
): Promise<void> {
  const { theme = 'professional', includeLetterhead = true } = options;
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Format concerns for display
  const formattedConcerns = meetingData.selectedConcerns?.map((concern, index) => {
    const concernTypes = Array.isArray(concern.concernTypes) ? concern.concernTypes : [];
    const concernTypeText = concernTypes.length > 0 ? concernTypes.join(', ') : 'Not specified';
    
    const interventionsHTML = concern.interventions?.map((intervention: any) => 
      formatMarkdownToHTML(intervention.description)
    ).join('<div class="intervention-separator"></div>') || '';

    const profileItems = [];
    if (concern.hasIep) profileItems.push('Has IEP/504 Plan');
    if (concern.hasDisability) profileItems.push(`Diagnosed with: ${concern.disabilityType || 'Not specified'}`);
    if (concern.isEalLearner) profileItems.push(`EAL Learner (${concern.ealProficiency || 'Unspecified'} English proficiency)`);
    if (concern.isGifted) profileItems.push('Gifted/Talented');
    if (concern.isStruggling) profileItems.push('Currently struggling academically');
    if (concern.otherNeeds) profileItems.push(`Other needs: ${concern.otherNeeds}`);

    return `
      <div class="concern-card">
        <div class="concern-header">
          <h4 class="concern-student-name">${concern.studentFirstName} ${concern.studentLastInitial} (Grade ${concern.grade || 'Not specified'})</h4>
          <div class="concern-counter">${index + 1}. ${concernTypeText}</div>
        </div>
        <div class="concern-details">
          <div class="concern-meta">
            <span class="concern-meta-item"><strong>Severity:</strong> ${concern.severity || 'Not specified'}</span>
            <span class="concern-meta-item"><strong>Location:</strong> ${concern.location || 'Not specified'}</span>
            <span class="concern-meta-item"><strong>Date:</strong> ${concern.createdAt?.toLocaleDateString('en-US') || 'Unknown'}</span>
          </div>
          
          <div class="concern-description">
            <h5>Description:</h5>
            <p>${concern.description || 'No description provided'}</p>
          </div>

          ${concern.actionsTaken && concern.actionsTaken.length > 0 ? `
            <div class="actions-taken">
              <h5>Actions Already Taken:</h5>
              <ul>
                ${concern.actionsTaken.map((action: string) => `<li>${action}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${interventionsHTML ? `
            <div class="ai-interventions">
              <h5>AI-Generated Interventions</h5>
              <div class="interventions-content">
                ${interventionsHTML}
              </div>
            </div>
          ` : ''}

          ${profileItems.length > 0 ? `
            <div class="student-profile">
              <h5>Student Learning Profile</h5>
              <ul>
                ${profileItems.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('') || '';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meeting Preparation Document - ${meetingData.title}</title>
    <style>
        ${getMeetingReportCSS(theme)}
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header -->
        <header class="report-header">
            <div class="header-content">
                <h1 class="app-title">Concern2Care</h1>
                <h2 class="report-title">Meeting Preparation Document</h2>
                <p class="report-date">Generated on ${currentDate}</p>
            </div>
            ${includeLetterhead ? '<div class="letterhead-space"></div>' : ''}
        </header>


        <!-- Meeting Information Section -->
        <section class="info-section">
            <h3 class="section-title">Meeting Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Title:</span>
                    <span class="info-value">${meetingData.title}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Type:</span>
                    <span class="info-value">${meetingData.type}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Date:</span>
                    <span class="info-value">${meetingData.date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Time:</span>
                    <span class="info-value">${meetingData.time}</span>
                </div>
            </div>
        </section>

        ${meetingData.agenda ? `
        <!-- Meeting Agenda Section -->
        <section class="agenda-section">
            <h3 class="section-title">Meeting Agenda</h3>
            <div class="agenda-content">
                ${meetingData.agenda}
            </div>
        </section>
        ` : ''}

        <!-- Student Concerns Section -->
        <section class="concerns-section">
            <h3 class="section-title">Student Concerns to Discuss</h3>
            <div class="concerns-summary">
                <p class="total-concerns">Total concerns selected: ${meetingData.selectedConcerns?.length || 0}</p>
            </div>
            <div class="concerns-list">
                ${formattedConcerns}
            </div>
        </section>

        ${meetingData.notes ? `
        <!-- Additional Notes Section -->
        <section class="notes-section">
            <h3 class="section-title">Additional Notes</h3>
            <div class="notes-content">
                ${meetingData.notes}
            </div>
        </section>
        ` : ''}

        ${(meetingData.includeRecommendations || meetingData.includeProgressNotes) ? `
        <!-- Document Includes Section -->
        <section class="includes-section">
            <h3 class="section-title">Document Includes</h3>
            <div class="includes-content">
                ${meetingData.includeRecommendations ? '<div class="include-item">• AI-generated intervention recommendations</div>' : ''}
                ${meetingData.includeProgressNotes ? '<div class="include-item">• Progress tracking section</div>' : ''}
            </div>
        </section>
        ` : ''}

        <!-- Footer -->
        <footer class="report-footer">
            <div class="footer-content">
                <div class="footer-left">
                    <p>Generated: ${currentDate} at ${currentTime}</p>
                    <p>Prepared by: ${generatedBy.firstName} ${generatedBy.lastName}</p>
                </div>
                <div class="footer-right">
                    <p><strong>Concern2Care</strong></p>
                    <p>AI-Powered Educational Support Platform</p>
                </div>
            </div>
        </footer>
    </div>

    <!-- Print styles -->
    <style media="print">
        ${getPrintCSS()}
    </style>
</body>
</html>`;

  // Write the HTML file
  await fs.promises.writeFile(outputPath, htmlContent, 'utf8');
}

export async function generateConcernHTMLReport(
  concern: ConcernWithDetails,
  interventions: Intervention[],
  outputPath: string,
  options: HTMLReportOptions = {}
): Promise<void> {
  const { theme = 'professional', includeLetterhead = true } = options;
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const concernTypes = Array.isArray(concern.concernTypes) ? concern.concernTypes : [];
  const concernTypeText = concernTypes.length > 0 ? concernTypes.join(', ') : 
    (concern.taskType === 'differentiation' ? 'Learning Support' : 'General Concern');

  // Determine report title based on task type
  const reportTitle = concern.taskType === 'differentiation' 
    ? 'Differentiation Report' 
    : 'Tier 2 Intervention Report';

  // Format interventions content
  const formattedInterventions = interventions.map(intervention => 
    formatMarkdownToHTML(intervention.description)
  ).join('<div class="section-break"></div>');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportTitle} - ${concern.studentFirstName} ${concern.studentLastInitial}</title>
    <style>
        ${getReportCSS(theme)}
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header -->
        <header class="report-header">
            <div class="header-content">
                <h1 class="app-title">Concern2Care</h1>
                <h2 class="report-title">${reportTitle}</h2>
                <h3 class="student-name">Student: ${concern.studentFirstName} ${concern.studentLastInitial}.</h3>
                <p class="report-date">Generated on ${currentDate}</p>
            </div>
            ${includeLetterhead ? '<div class="letterhead-space"></div>' : ''}
        </header>


        <!-- Student Information Section -->
        <section class="info-section">
            <h3 class="section-title">Student Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${concern.studentFirstName} ${concern.studentLastInitial}.</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Teacher:</span>
                    <span class="info-value">${concern.teacher.firstName} ${concern.teacher.lastName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">School:</span>
                    <span class="info-value">${concern.teacher.school || 'Not specified'}</span>
                </div>
            </div>
        </section>

        <!-- Concern Details Section -->
        <section class="concern-section">
            <h3 class="section-title">Concern Details</h3>
            <div class="concern-grid">
                <div class="concern-item">
                    <span class="concern-label">Type:</span>
                    <span class="concern-value">${concernTypeText}</span>
                </div>
                <div class="concern-item">
                    <span class="concern-label">Date Documented:</span>
                    <span class="concern-value">${concern.createdAt?.toLocaleDateString('en-US') || 'Unknown'}</span>
                </div>
            </div>
            
            <div class="description-section">
                <h4 class="description-title">Description:</h4>
                <div class="description-content">
                    ${concern.description || (concern.taskType === 'differentiation' ? 
                      'Differentiation strategies requested based on student learning needs and characteristics.' : 
                      'General student concern requiring intervention support.')}
                </div>
            </div>
        </section>

        <!-- AI-Generated Interventions Section -->
        <section class="interventions-section">
            <h3 class="section-title">AI-Generated Intervention Strategies</h3>
            <div class="interventions-content">
                ${formattedInterventions}
            </div>
        </section>

        <!-- Footer -->
        <footer class="report-footer">
            <div class="footer-content">
                <p class="footer-text">
                    This report was generated by Concern2Care. All intervention strategies are evidence-based 
                    and appropriate for Tier 2 implementation.
                </p>
            </div>
        </footer>
    </div>

    <!-- Print styles -->
    <style media="print">
        ${getPrintCSS()}
    </style>
</body>
</html>`;

  // Write the HTML file
  await fs.promises.writeFile(outputPath, htmlContent, 'utf8');
}

function formatMarkdownToHTML(markdown: string): string {
  if (!markdown) return '';

  let html = markdown
    // Headers
    .replace(/^### \*\*(.*?)\*\*/gm, '<h3 class="intervention-title">$1</h3>')
    .replace(/^## \*\*(.*?)\*\*/gm, '<h2 class="major-heading">$1</h2>')
    .replace(/^# \*\*(.*?)\*\*/gm, '<h1 class="main-heading">$1</h1>')
    
    // Sub-headers
    .replace(/^\*\*([^:*]+):\*\*/gm, '<h4 class="sub-heading">$1:</h4>')
    .replace(/^\*\*([^*]+)\*\*/gm, '<h4 class="bold-heading">$1</h4>')
    
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Bullet points (nested)
    .replace(/^    [-*] (.*)/gm, '<li class="nested-bullet">$1</li>')
    .replace(/^  [-*] (.*)/gm, '<li class="sub-bullet">$1</li>')
    .replace(/^[-*] (.*)/gm, '<li class="main-bullet">$1</li>')
    
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap in paragraphs
  html = '<p>' + html + '</p>';
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '').replace(/<p><br><\/p>/g, '');
  
  // Convert bullet lists
  html = html.replace(/(<li class="[^"]*">.*?<\/li>)/g, (match) => {
    return '<ul class="intervention-list">' + match + '</ul>';
  });

  return html;
}

function getMeetingReportCSS(theme: string): string {
  const baseStyles = `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: 'Times New Roman', Times, serif;
        line-height: 1.7;
        color: #1a1a1a;
        background: #ffffff;
        font-size: 12pt;
    }

    .report-container {
        max-width: 210mm;
        margin: 0 auto;
        background: white;
        min-height: 297mm;
        padding: 0;
    }

    .report-header {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
        padding: 3rem 2rem;
        text-align: center;
        position: relative;
        margin-bottom: 2rem;
    }

    .report-header::after {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 60%;
        height: 2px;
        background: linear-gradient(90deg, transparent 0%, #2563eb 50%, transparent 100%);
    }

    .app-title {
        font-size: 2.8rem;
        font-weight: 700;
        margin-bottom: 0.75rem;
        text-shadow: 0 2px 8px rgba(0,0,0,0.2);
        letter-spacing: 1px;
    }

    .report-title {
        font-size: 1.8rem;
        font-weight: 300;
        margin-bottom: 0.5rem;
        opacity: 0.95;
        letter-spacing: 0.5px;
    }

    .student-name {
        font-size: 1.3rem;
        font-weight: 400;
        margin-bottom: 1rem;
        opacity: 0.9;
        letter-spacing: 0.3px;
    }

    .report-date {
        font-size: 1rem;
        opacity: 0.9;
        font-weight: 300;
    }

    .section-title {
        color: #2563eb;
        font-size: 1.4rem;
        font-weight: 600;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e2e8f0;
    }

    .info-section, .agenda-section, .concerns-section, .notes-section, .includes-section {
        padding: 2rem;
        border-bottom: 1px solid #e2e8f0;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .info-item {
        background: #f8fafc;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;
    }

    .info-label {
        font-weight: 600;
        color: #374151;
        display: block;
        margin-bottom: 0.25rem;
    }

    .info-value {
        color: #1f2937;
        font-size: 1.1rem;
    }

    .agenda-content, .notes-content {
        background: #f9fafb;
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        line-height: 1.7;
        white-space: pre-wrap;
    }

    .concerns-summary {
        background: #eff6ff;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 2rem;
        border-left: 4px solid #3b82f6;
    }

    .total-concerns {
        font-weight: 600;
        color: #1e40af;
        margin: 0;
    }

    .concern-card {
        background: #fefefe;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        margin-bottom: 2rem;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .concern-header {
        background: linear-gradient(90deg, #f8fafc 0%, #e2e8f0 100%);
        padding: 1.5rem;
        border-bottom: 1px solid #d1d5db;
    }

    .concern-student-name {
        font-size: 1.2rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }

    .concern-counter {
        font-weight: 500;
        color: #6b7280;
        font-size: 1rem;
    }

    .concern-details {
        padding: 1.5rem;
    }

    .concern-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
    }

    .concern-meta-item {
        font-size: 0.9rem;
        color: #374151;
    }

    .concern-description, .actions-taken, .ai-interventions, .student-profile {
        margin-bottom: 1.5rem;
    }

    .concern-description h5, .actions-taken h5, .ai-interventions h5, .student-profile h5 {
        color: #374151;
        font-weight: 600;
        margin-bottom: 0.75rem;
        font-size: 1rem;
    }

    .concern-description p {
        background: #f9fafb;
        padding: 1rem;
        border-radius: 6px;
        border-left: 3px solid #10b981;
        margin: 0;
    }

    .actions-taken ul, .student-profile ul {
        list-style: none;
        padding: 0;
        background: #fef7f2;
        border-radius: 6px;
        padding: 1rem;
    }

    .actions-taken li, .student-profile li {
        position: relative;
        padding-left: 1.5rem;
        margin-bottom: 0.5rem;
        color: #374151;
    }

    .actions-taken li::before {
        content: "•";
        color: #f59e0b;
        font-weight: bold;
        position: absolute;
        left: 0;
    }

    .student-profile li::before {
        content: "•";
        color: #10b981;
        font-weight: bold;
        position: absolute;
        left: 0;
    }

    .ai-interventions .interventions-content {
        background: #fefefe;
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }

    .intervention-separator {
        height: 1rem;
        border-bottom: 1px solid #f3f4f6;
        margin: 1.5rem 0;
    }

    .intervention-title {
        color: #1e40af;
        font-size: 1.2rem;
        font-weight: 600;
        margin: 1.5rem 0 1rem 0;
        padding: 0.5rem 0;
        border-bottom: 1px solid #e2e8f0;
    }

    .major-heading {
        color: #1e40af;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 1.25rem 0 0.75rem 0;
    }

    .sub-heading {
        color: #7c3aed;
        font-size: 1rem;
        font-weight: 500;
        margin: 1rem 0 0.5rem 0;
    }

    .bold-heading {
        color: #374151;
        font-size: 0.95rem;
        font-weight: 600;
        margin: 0.75rem 0 0.5rem 0;
    }

    .intervention-list {
        margin: 0.75rem 0 1rem 1.5rem;
        padding-left: 0;
    }

    .main-bullet {
        list-style: none;
        position: relative;
        margin: 0.5rem 0;
        padding-left: 1.5rem;
        color: #374151;
    }

    .main-bullet::before {
        content: "•";
        color: #3b82f6;
        font-weight: bold;
        position: absolute;
        left: 0;
    }

    .sub-bullet {
        list-style: none;
        position: relative;
        margin: 0.25rem 0 0.25rem 1rem;
        padding-left: 1.5rem;
        color: #6b7280;
        font-size: 0.95rem;
    }

    .sub-bullet::before {
        content: "◦";
        color: #6b7280;
        position: absolute;
        left: 0;
    }

    .nested-bullet {
        list-style: none;
        position: relative;
        margin: 0.25rem 0 0.25rem 2rem;
        padding-left: 1.5rem;
        color: #9ca3af;
        font-size: 0.9rem;
    }

    .nested-bullet::before {
        content: "▪";
        color: #9ca3af;
        position: absolute;
        left: 0;
    }

    .includes-content {
        background: #f0fdf4;
        padding: 1.5rem;
        border-radius: 8px;
        border-left: 4px solid #10b981;
    }

    .include-item {
        color: #047857;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }

    .print-controls {
        position: sticky;
        top: 0;
        background: white;
        border-bottom: 1px solid #e2e8f0;
        padding: 1rem 2rem;
        text-align: right;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .print-button {
        display: inline-flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
        background: #3b82f6 !important;
        color: white !important;
        border: none !important;
        padding: 0.75rem 1.5rem !important;
        border-radius: 8px !important;
        font-size: 0.9rem !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        text-align: center !important;
        text-decoration: none !important;
        outline: none !important;
    }

    .print-button:hover {
        background: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    .print-button:active {
        transform: translateY(0);
    }

    .print-fallback-instructions {
        margin-top: 1rem;
        padding: 1rem;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 6px;
        font-size: 0.85rem;
        color: #0369a1;
        line-height: 1.5;
    }

    .print-fallback-instructions p {
        margin: 0.3rem 0;
    }

    .print-fallback-instructions kbd {
        background: #1e293b;
        color: white;
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        font-family: monospace;
        font-size: 0.8rem;
    }

    .report-footer {
        background: #f8fafc;
        padding: 2rem;
        border-top: 1px solid #e2e8f0;
    }

    .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 2rem;
        padding: 2rem 0;
        border-top: 2px solid #e2e8f0;
        margin-top: 3rem;
    }

    .footer-left, .footer-right {
        color: #4b5563;
        font-size: 0.95rem;
        line-height: 1.6;
        font-weight: 400;
    }

    .footer-right {
        text-align: right;
    }

    .footer-right strong {
        color: #1f2937;
        font-weight: 700;
    }
  `;

  return baseStyles;
}

function getReportCSS(theme: string): string {
  const baseStyles = `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: 'Times New Roman', Times, serif;
        line-height: 1.7;
        color: #1a1a1a;
        background: #ffffff;
        font-size: 12pt;
    }

    .report-container {
        max-width: 210mm;
        margin: 0 auto;
        background: white;
        min-height: 297mm;
        padding: 0;
    }

    .report-header {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
        padding: 3rem 2rem;
        text-align: center;
        position: relative;
        margin-bottom: 2rem;
    }

    .report-header::after {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 60%;
        height: 2px;
        background: linear-gradient(90deg, transparent 0%, #2563eb 50%, transparent 100%);
    }

    .app-title {
        font-size: 2.8rem;
        font-weight: 700;
        margin-bottom: 0.75rem;
        text-shadow: 0 2px 8px rgba(0,0,0,0.2);
        letter-spacing: 1px;
    }

    .report-title {
        font-size: 1.8rem;
        font-weight: 300;
        margin-bottom: 0.5rem;
        opacity: 0.95;
        letter-spacing: 0.5px;
    }

    .student-name {
        font-size: 1.3rem;
        font-weight: 400;
        margin-bottom: 1rem;
        opacity: 0.9;
        letter-spacing: 0.3px;
    }

    .report-date {
        font-size: 1rem;
        opacity: 0.9;
        font-weight: 300;
    }

    .section-title {
        color: #1e3a8a;
        font-size: 1.6rem;
        font-weight: 600;
        margin: 2rem 0 1.5rem 0;
        padding: 0.75rem 0;
        border-bottom: 3px solid #e2e8f0;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-family: 'Arial', sans-serif;
    }

    .info-section, .concern-section, .interventions-section {
        padding: 2.5rem 3rem;
        margin-bottom: 1rem;
    }

    .info-grid, .concern-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .info-item, .concern-item {
        background: #ffffff;
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .info-label, .concern-label {
        font-weight: 700;
        color: #374151;
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.95rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: 'Arial', sans-serif;
    }

    .info-value, .concern-value {
        color: #111827;
        font-size: 1.1rem;
        font-weight: 400;
        line-height: 1.6;
    }

    .description-section {
        margin-top: 2rem;
    }

    .description-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: #374151;
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: 'Arial', sans-serif;
    }

    .description-content {
        background: #fafafa;
        padding: 2rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        line-height: 1.8;
        font-size: 1.05rem;
        text-align: justify;
        margin-bottom: 2rem;
    }

    .interventions-content {
        background: #ffffff;
        padding: 2.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        margin-top: 1rem;
    }

    .intervention-title {
        color: #1e3a8a;
        font-size: 1.4rem;
        font-weight: 700;
        margin: 2rem 0 1.5rem 0;
        padding: 0.75rem 0;
        border-bottom: 2px solid #e2e8f0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: 'Arial', sans-serif;
    }

    .major-heading {
        color: #1e40af;
        font-size: 1.2rem;
        font-weight: 600;
        margin: 1.25rem 0 0.75rem 0;
    }

    .sub-heading {
        color: #7c3aed;
        font-size: 1.1rem;
        font-weight: 500;
        margin: 1rem 0 0.5rem 0;
    }

    .bold-heading {
        color: #374151;
        font-size: 1rem;
        font-weight: 600;
        margin: 0.75rem 0 0.5rem 0;
    }

    .intervention-list {
        margin: 0.75rem 0 1rem 1.5rem;
        padding-left: 0;
    }

    .main-bullet {
        list-style: none;
        position: relative;
        margin: 0.5rem 0;
        padding-left: 1.5rem;
        color: #374151;
    }

    .main-bullet::before {
        content: "•";
        color: #3b82f6;
        font-weight: bold;
        position: absolute;
        left: 0;
    }

    .sub-bullet {
        list-style: none;
        position: relative;
        margin: 0.25rem 0 0.25rem 1rem;
        padding-left: 1.5rem;
        color: #6b7280;
        font-size: 0.95rem;
    }

    .sub-bullet::before {
        content: "◦";
        color: #6b7280;
        position: absolute;
        left: 0;
    }

    .nested-bullet {
        list-style: none;
        position: relative;
        margin: 0.25rem 0 0.25rem 2rem;
        padding-left: 1.5rem;
        color: #9ca3af;
        font-size: 0.9rem;
    }

    .nested-bullet::before {
        content: "▪";
        color: #9ca3af;
        position: absolute;
        left: 0;
    }

    .section-break {
        height: 2rem;
        border-bottom: 1px solid #f3f4f6;
        margin: 2rem 0;
    }

    .print-controls {
        position: sticky;
        top: 0;
        background: white;
        border-bottom: 1px solid #e2e8f0;
        padding: 1rem 2rem;
        text-align: right;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .print-button {
        display: inline-flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
        background: #3b82f6 !important;
        color: white !important;
        border: none !important;
        padding: 0.75rem 1.5rem !important;
        border-radius: 8px !important;
        font-size: 0.9rem !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        text-align: center !important;
        text-decoration: none !important;
        outline: none !important;
    }

    .print-button:hover {
        background: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    .print-button:active {
        transform: translateY(0);
    }

    .print-fallback-instructions {
        margin-top: 1rem;
        padding: 1rem;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 6px;
        font-size: 0.85rem;
        color: #0369a1;
        line-height: 1.5;
    }

    .print-fallback-instructions p {
        margin: 0.3rem 0;
    }

    .print-fallback-instructions kbd {
        background: #1e293b;
        color: white;
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        font-family: monospace;
        font-size: 0.8rem;
    }

    .report-footer {
        background: #f8fafc;
        padding: 2rem;
        text-align: center;
        border-top: 1px solid #e2e8f0;
    }

    .footer-text {
        color: #6b7280;
        font-size: 0.9rem;
        font-style: italic;
        line-height: 1.5;
    }
  `;

  return baseStyles;
}

function getPrintCSS(): string {
  return `
    body {
        background: white !important;
        font-size: 11pt !important;
        line-height: 1.4 !important;
    }

    .report-container {
        box-shadow: none !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
    }

    .report-header {
        background: #2563eb !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        padding: 2rem 1rem !important;
        margin-bottom: 1.5rem !important;
    }

    .report-header::after {
        display: none !important;
    }

    .app-title {
        font-size: 2rem !important;
        margin-bottom: 0.5rem !important;
    }

    .report-title {
        font-size: 1.4rem !important;
        margin-bottom: 0.3rem !important;
    }

    .student-name {
        font-size: 1.1rem !important;
        margin-bottom: 0.8rem !important;
    }

    .report-date {
        font-size: 0.9rem !important;
    }

    .section-title {
        font-size: 1.2rem !important;
        margin: 1.5rem 0 1rem 0 !important;
        padding: 0.5rem 0 !important;
        page-break-after: avoid !important;
    }

    .info-section, .concern-section, .interventions-section {
        padding: 1.5rem 1rem !important;
        margin-bottom: 0.5rem !important;
        page-break-inside: avoid !important;
    }

    .info-grid, .concern-grid {
        grid-template-columns: 1fr 1fr !important;
        gap: 1rem !important;
        margin-bottom: 1rem !important;
    }

    .info-item, .concern-item {
        padding: 1rem !important;
        margin-bottom: 0.5rem !important;
        page-break-inside: avoid !important;
    }

    .description-content {
        padding: 1rem !important;
        margin-bottom: 1rem !important;
        page-break-inside: avoid !important;
    }

    .interventions-content {
        padding: 1.5rem !important;
        margin-top: 0.5rem !important;
    }

    .intervention-title {
        font-size: 1.1rem !important;
        margin: 1rem 0 0.8rem 0 !important;
        padding: 0.4rem 0 !important;
        page-break-after: avoid !important;
    }

    .major-heading {
        font-size: 1rem !important;
        margin: 0.8rem 0 0.5rem 0 !important;
        page-break-after: avoid !important;
    }

    .sub-heading {
        font-size: 0.95rem !important;
        margin: 0.6rem 0 0.4rem 0 !important;
        page-break-after: avoid !important;
    }

    .bold-heading {
        font-size: 0.9rem !important;
        margin: 0.5rem 0 0.3rem 0 !important;
        page-break-after: avoid !important;
    }

    .intervention-list {
        margin: 0.5rem 0 0.8rem 1rem !important;
        page-break-inside: avoid !important;
    }

    .main-bullet, .sub-bullet, .nested-bullet {
        margin: 0.3rem 0 !important;
        page-break-inside: avoid !important;
    }

    .section-break {
        height: 1rem !important;
        margin: 1rem 0 !important;
        page-break-before: avoid !important;
        break-inside: avoid !important;
    }

    .report-footer {
        padding: 1rem !important;
        margin-top: 1rem !important;
        page-break-inside: avoid !important;
    }

    .print-controls,
    .no-print,
    .print-fallback-instructions {
        display: none !important;
    }

    @page {
        margin: 2cm 1.5cm;
        size: A4;
    }

    /* Prevent orphaned content */
    h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid !important;
    }

    p, li {
        page-break-inside: avoid !important;
    }

    /* Keep related content together */
    .info-item, .concern-item {
        page-break-inside: avoid !important;
    }
  `;
}