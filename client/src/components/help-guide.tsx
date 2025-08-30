import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
// Using manual separator and scrolling instead of missing components
import { 
  HelpCircle, 
  FileText, 
  Lightbulb, 
  Mail, 
  User, 
  Share, 
  Upload, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Info,
  BookOpen,
  MessageSquare,
  BarChart3,
  Shield,
  Globe,
  Smartphone,
  Copy,
  Download,
  Languages
} from "lucide-react";

export default function HelpGuide() {
  const { isFeatureEnabled } = useFeatureFlags();
  const Section = ({ icon: Icon, title, children, className = "" }: {
    icon: any;
    title: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <Card className={`mb-6 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Icon className="h-5 w-5 text-blue-600" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );

  const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-900 flex items-center">
        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
        {title}
      </h4>
      <div className="ml-4 text-gray-700 text-sm space-y-2">
        {children}
      </div>
    </div>
  );

  const StepList = ({ steps }: { steps: string[] }) => (
    <ol className="list-decimal list-inside space-y-1 text-sm">
      {steps.map((step, index) => (
        <li key={index} className="text-gray-700">{step}</li>
      ))}
    </ol>
  );

  const FeatureList = ({ features }: { features: string[] }) => (
    <ul className="space-y-1">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start space-x-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
          <span className="text-gray-700">{feature}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="max-h-[600px] overflow-y-auto pr-4">
      <div className="space-y-6">
        {/* Welcome Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-xl">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span>Welcome to Concern2Care</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Concern2Care is your AI-powered teaching assistant designed to help K-12 educators document student concerns 
              and receive evidence-based intervention strategies. This comprehensive guide will help you make the most of all features.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-sm">Document Concerns</p>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <Lightbulb className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="font-medium text-sm">Get AI Interventions</p>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <Share className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-sm">Share Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Section icon={User} title="Getting Started">
          <SubSection title="First-Time Setup">
            <StepList steps={[
              "Complete your profile information in Settings → Profile",
              "Set up your email configuration for report sharing (Settings → Email)",
              "Familiarize yourself with the main dashboard and usage limits",
              "Review the types of concerns and interventions available"
            ]} />
          </SubSection>
          
          <SubSection title="Understanding Usage Limits">
            <p>Each teacher has a monthly limit of support requests (typically 20). Your usage is tracked and displayed on the main dashboard.</p>
            <Alert className="mt-2">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Tip:</strong> Use the "Save Intervention" feature to keep strategies you find particularly useful without using additional requests.
              </AlertDescription>
            </Alert>
          </SubSection>
        </Section>

        {/* Documenting Concerns */}
        <Section icon={FileText} title="Documenting Student Concerns">
          <SubSection title="Basic Information Required">
            <FeatureList features={[
              "Student first name and last initial (privacy protection)",
              "Grade level and your teaching position",
              "Incident date and location",
              "Concern type(s): Academic, Behavioral, Social/Emotional, Attendance, etc.",
              "Detailed description of the concern",
              "Severity level: Mild, Moderate, or Urgent",
              "Actions already taken"
            ]} />
          </SubSection>

          <SubSection title="Enhanced Student Information (Optional but Recommended)">
            <p>Providing additional student context helps generate more personalized interventions:</p>
            <FeatureList features={[
              "IEP status and disability information",
              "English as Additional Language (EAL) proficiency level", 
              "Gifted program participation",
              "Academic struggling indicators",
              "Other specific learning needs"
            ]} />
          </SubSection>

          <SubSection title="File Uploads for Better Recommendations">
            <p>Upload relevant documents to enhance AI analysis:</p>
            <FeatureList features={[
              "Student assessment reports (PDF, images)",
              "Lesson plans related to the concern",
              "Files are securely stored and only used for generating better interventions"
            ]} />
          </SubSection>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy Note:</strong> Never include full names, student IDs, or other personally identifiable information in your descriptions.
            </AlertDescription>
          </Alert>
        </Section>

        {/* AI Interventions */}
        <Section icon={Lightbulb} title="AI-Generated Support Strategies">
          <SubSection title="Two Types of AI Support">
            <p>Concern2Care provides two distinct types of AI-generated support strategies:</p>
            <div className="space-y-3 mt-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-2">📚 Differentiation Strategies</h5>
                <p className="text-sm text-blue-700">
                  Teaching adjustments and personalized learning approaches to meet individual student needs within the classroom setting.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h5 className="font-medium text-purple-800 mb-2">🎯 Tier 2 Intervention Strategies</h5>
                <p className="text-sm text-purple-700">
                  Evidence-based intervention approaches for students requiring additional support beyond regular classroom instruction.
                </p>
              </div>
            </div>
          </SubSection>

          <SubSection title="Strategy Features">
            <FeatureList features={[
              "Multiple strategies per concern with focused approaches",
              "Step-by-step implementation guidance", 
              "Timeline recommendations and progress monitoring",
              "Evidence-based approaches aligned with educational best practices",
              "Personalized based on student needs, context, and chosen strategy type"
            ]} />
          </SubSection>

          <SubSection title="Saving and Managing Interventions">
            <StepList steps={[
              "Review the generated intervention strategies",
              "Click 'Save Intervention' to bookmark useful strategies",
              "Saved interventions appear in your support requests list",
              "Use the search function to find specific interventions later"
            ]} />
          </SubSection>

          <SubSection title="New: Action Buttons for AI Outputs">
            <p>Each AI-generated intervention now includes convenient action buttons at the bottom:</p>
            <div className="space-y-3 mt-3">
              <div className="bg-gray-50 p-3 rounded-lg flex items-center space-x-3">
                <Copy className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm text-gray-800">Copy to Clipboard</p>
                  <p className="text-xs text-gray-600">Instantly copy the intervention text for use in other documents</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex items-center space-x-3">
                <Download className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm text-gray-800">Download as Text File</p>
                  <p className="text-xs text-gray-600">Save individual interventions as .txt files to your device</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex items-center space-x-3">
                <Upload className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm text-gray-800">Share Individual Intervention</p>
                  <p className="text-xs text-gray-600">Share specific interventions via email without creating full reports</p>
                </div>
              </div>
            </div>
          </SubSection>
        </Section>

        {/* Follow-up Questions */}
        <Section icon={MessageSquare} title="Follow-up Questions and Support">
          <SubSection title="Getting Additional Guidance">
            <p>After receiving interventions, you can ask follow-up questions for clarification or additional strategies:</p>
            <StepList steps={[
              "Click 'Ask Follow-up Question' on any intervention",
              "Type your specific question or request for clarification",
              "Receive AI-powered responses with additional guidance",
              "Ask multiple questions as needed"
            ]} />
          </SubSection>

          <SubSection title="Common Follow-up Questions">
            <FeatureList features={[
              "How to adapt strategies for different learning styles",
              "Timeline adjustments for specific situations",
              "Modifications for students with special needs",
              "Progress monitoring techniques",
              "Parent communication strategies"
            ]} />
          </SubSection>
        </Section>

        {/* Report Generation and Sharing */}
        <Section icon={Share} title="Report Generation and Sharing">
          <SubSection title="Creating PDF Reports">
            <p>Generate professional reports that include your concern documentation and recommended interventions:</p>
            <StepList steps={[
              "Navigate to 'My Support Requests' from the main menu",
              "Use the 'Differentiation Requests' and 'Intervention Requests' tabs to find your concerns",
              "Find the concern you want to share",
              "Click the 'Share' button next to the concern", 
              "The system generates a comprehensive PDF report"
            ]} />
          </SubSection>

          <SubSection title="Email Sharing">
            <p>Share reports directly with student support staff or when necessary:</p>
            <StepList steps={[
              "Ensure your email configuration is set up (Settings → Email)",
              "Add recipient names and email addresses",
              "Include a personalized message",
              "Click 'Send Report' to share via email"
            ]} />
          </SubSection>

          <SubSection title="Organized Request Management">
            <p>Your support requests are now organized into clear categories:</p>
            <div className="space-y-2 mt-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h6 className="font-medium text-blue-800 text-sm mb-1">📚 Differentiation Requests</h6>
                <p className="text-xs text-blue-700">Teaching strategies and classroom adjustments</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <h6 className="font-medium text-purple-800 text-sm mb-1">🎯 Intervention Requests</h6>
                <p className="text-xs text-purple-700">Tier 2 intervention strategies and support plans</p>
              </div>
            </div>
          </SubSection>

          <SubSection title="Report Contents">
            <FeatureList features={[
              "Original concern documentation",
              "AI-generated support strategies (differentiation or intervention)",
              "Implementation timelines and steps", 
              "Professional formatting suitable for school records",
              "Date stamps and teacher information",
              "Proper Chinese character support for bilingual reports",
              "Clean, professional table formatting for structured content"
            ]} />
          </SubSection>

          <SubSection title="Enhanced PDF Quality">
            <p>Recent improvements to PDF report generation:</p>
            <FeatureList features={[
              "Fixed character encoding issues - no more garbled text (Ø=ÜÝ)",
              "Native Chinese character display without placeholder messages",
              "Professional table formatting with proper borders and spacing",
              "Optimized spacing for cleaner, more compact documents",
              "Better formatting for structured AI responses and lesson plans"
            ]} />
          </SubSection>
        </Section>

        {/* Email Configuration */}
        <Section icon={Mail} title="Email Configuration">
          <SubSection title="Personal Email Setup">
            <p>Configure your personal email account for sending reports:</p>
            <StepList steps={[
              "Go to Settings → Email Configuration",
              "Click 'Edit Personal Email Settings'",
              "Enter your email provider's SMTP settings",
              "For Gmail: Use smtp.gmail.com, port 587, and an App Password",
              "Test your configuration before saving"
            ]} />
          </SubSection>

          <SubSection title="Gmail Setup (Most Common)">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Gmail Configuration:</p>
              <ul className="text-sm space-y-1">
                <li><strong>SMTP Host:</strong> smtp.gmail.com</li>
                <li><strong>Port:</strong> 587</li>
                <li><strong>Security:</strong> TLS/STARTTLS</li>
                <li><strong>Username:</strong> Your Gmail address</li>
                <li><strong>Password:</strong> Gmail App Password (not your regular password)</li>
              </ul>
            </div>
          </SubSection>

          <SubSection title="Creating Gmail App Passwords">
            <StepList steps={[
              "Go to your Google Account Security settings",
              "Enable 2-Step Verification if not already enabled",
              "Look for 'App passwords' section",
              "Generate a new app password for 'Mail'",
              "Copy the 16-character password and use it in Concern2Care"
            ]} />
          </SubSection>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Troubleshooting:</strong> If you can't find App Passwords, ensure 2-Step Verification is enabled first. Some workplace accounts may have different requirements.
            </AlertDescription>
          </Alert>

          <SubSection title="School Email Configuration (Admin Only)">
            <p>Administrators can configure school-wide email settings that all teachers can use as an alternative to personal email accounts.</p>
          </SubSection>
        </Section>

        {/* Profile Management */}
        <Section icon={Settings} title="Profile and Account Management">
          <SubSection title="Updating Your Profile">
            <StepList steps={[
              "Go to Settings → Profile",
              "Click 'Edit' to modify your information",
              "Update your first name, last name, and email address",
              "Click 'Save' to confirm changes"
            ]} />
          </SubSection>

          <SubSection title="Account Information">
            <FeatureList features={[
              "View your account type (Teacher or Administrator)",
              "Monitor your monthly usage statistics",
              "Track requests used vs. remaining",
              "View your support request limit"
            ]} />
          </SubSection>

          <SubSection title="Notification Preferences">
            <p>Configure how you receive updates:</p>
            <FeatureList features={[
              "Email notifications for important events",
              "Report generation alerts",
              "System update notifications"
            ]} />
          </SubSection>
        </Section>

        {/* Individual Teacher Registration - Feature Flag Conditional */}
        {isFeatureEnabled('individual_teacher_registration') && (
          <Section icon={User} title="Individual Teacher Registration">
            <p className="text-sm text-gray-600 mb-4">
              <Badge variant="outline" className="mr-2 bg-orange-50 text-orange-700 border-orange-200">Individual Teachers</Badge>
              For individual teachers who want to use Concern2Care without school administration setup.
            </p>

            <SubSection title="Getting Started as Individual Teacher">
              <FeatureList features={[
                "Register independently for $10/month through Buy Me a Coffee",
                "Complete your professional profile with school and teaching details", 
                "Get the same powerful AI-generated differentiation and intervention strategies",
                "Access all features including PDF reports and email sharing",
                "Cancel anytime with no long-term commitment"
              ]} />
            </SubSection>

            <SubSection title="Registration Information Required">
              <FeatureList features={[
                "First Name and Last Name *",
                "Email Address * (for account access)",
                "Password * (minimum 6 characters)",
                "School Name *",
                "School District (optional for private/standalone schools)",
                "Primary Grade * (e.g., '3rd Grade', 'K-5')",
                "Primary Subject * (e.g., 'Mathematics', 'ELA')",
                "Teacher Type * (Classroom Teacher, Special Education, etc.)"
              ]} />
            </SubSection>

            <SubSection title="Individual vs. School-Managed Accounts">
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h6 className="font-medium text-green-800 mb-2">Individual Account Benefits</h6>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Complete autonomy over your account</li>
                    <li>• No need for school administrator setup</li>
                    <li>• Direct payment and subscription management</li>
                    <li>• Immediate access after registration</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h6 className="font-medium text-blue-800 mb-2">School-Managed Account Benefits</h6>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Paid for by your school or district</li>
                    <li>• Integrated with school email systems</li>
                    <li>• Coordinated professional development</li>
                    <li>• No personal payment required</li>
                  </ul>
                </div>
              </div>
            </SubSection>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> Individual teacher accounts function identically to school-managed accounts - you get full access to all differentiation and intervention features, with the same privacy protection for student data.
              </AlertDescription>
            </Alert>
          </Section>
        )}

        {/* Admin Features */}
        <Section icon={Shield} title="School Administrator Features">
          <p className="text-sm text-gray-600 mb-4">
            <Badge variant="outline" className="mr-2">School Admin Only</Badge>
            These features are available to designated school administrators for managing their institution's Concern2Care usage.
          </p>

          <SubSection title="Teacher Account Management">
            <FeatureList features={[
              "Add new teacher accounts for your school",
              "Edit teacher contact information and profiles",
              "Grant additional monthly requests when needed",
              "Deactivate teacher accounts (e.g., staff changes)",
              "View teacher usage statistics and activity"
            ]} />
          </SubSection>

          <SubSection title="School-Wide Email Configuration">
            <FeatureList features={[
              "Set up school district email settings for all teachers",
              "Configure institutional SMTP server details", 
              "Allow teachers to use school email for report sharing",
              "Test and validate school email configuration"
            ]} />
          </SubSection>

          <SubSection title="School Analytics and Reporting">
            <FeatureList features={[
              "View school-wide usage dashboard and trends",
              "Generate reports on intervention effectiveness",
              "Monitor teacher engagement and adoption rates",
              "Export school data for institutional analysis",
              "Track most common concern types and patterns"
            ]} />
          </SubSection>

          <SubSection title="User Support and Training">
            <FeatureList features={[
              "Send password reset emails to teachers",
              "Access teacher training resources and guides",
              "Monitor help desk issues and common problems",
              "Coordinate staff training sessions"
            ]} />
          </SubSection>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> School administrators cannot access individual teacher's concern details or reports for privacy protection, but can view aggregated usage statistics.
            </AlertDescription>
          </Alert>
        </Section>

        {/* Language and International Support */}
        <Section icon={Languages} title="Language and International Support">
          <SubSection title="Multi-Language Capabilities">
            <FeatureList features={[
              "AI can understand and respond to questions in multiple languages",
              "Chinese language support for parent communication materials",
              "Proper character encoding for international text in PDF reports",
              "Cross-cultural educational strategies when appropriate"
            ]} />
          </SubSection>

          {isFeatureEnabled('chinese_localization') && (
            <SubSection title="Chinese Interface (Beta)">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">New Feature</Badge>
                  <p className="font-medium text-blue-800">完整中文界面支持</p>
                </div>
                <FeatureList features={[
                  "Complete Chinese translation of the user interface",
                  "Language switching between English and Chinese",
                  "Localized form labels, buttons, and navigation",
                  "Chinese educational terminology and context",
                  "Seamless language preference storage"
                ]} />
                <p className="text-sm text-blue-700 mt-3">
                  Use the language selector in the header to switch between English and Chinese. 
                  Your preference will be saved automatically.
                </p>
              </div>
            </SubSection>
          )}
        </Section>

        {/* Mobile Usage */}
        <Section icon={Smartphone} title="Mobile and Accessibility">
          <SubSection title="Mobile Device Usage">
            <FeatureList features={[
              "Fully responsive design works on phones and tablets",
              "Touch-friendly interface for mobile interactions",
              "All features available on mobile devices",
              "Optimized forms for mobile data entry",
              "Action buttons work seamlessly on touch devices"
            ]} />
          </SubSection>

          <SubSection title="Accessibility Features">
            <FeatureList features={[
              "Keyboard navigation support",
              "Screen reader compatibility",
              "High contrast color schemes",
              "Scalable text and interface elements",
              "Proper ARIA labels on all interactive elements"
            ]} />
          </SubSection>
        </Section>

        {/* Troubleshooting */}
        <Section icon={AlertTriangle} title="Troubleshooting Common Issues">
          <SubSection title="Email Sharing Problems">
            <div className="space-y-3">
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">Problem: "Failed to Share Report" error</p>
                <p className="text-red-700 text-sm mt-1">
                  <strong>Solution:</strong> Check your email configuration. For Gmail, ensure you're using an App Password, not your regular password.
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">Problem: Email test fails</p>
                <p className="text-red-700 text-sm mt-1">
                  <strong>Solution:</strong> Verify SMTP settings, check internet connection, and ensure your email provider allows third-party app access.
                </p>
              </div>
            </div>
          </SubSection>

          <SubSection title="PDF and Report Issues">
            <div className="space-y-3">
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">Problem: PDF shows garbled characters or symbols</p>
                <p className="text-red-700 text-sm mt-1">
                  <strong>Solution:</strong> This has been fixed in recent updates. If you still see issues, try refreshing the page and generating a new report.
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">Problem: Chinese text not displaying properly</p>
                <p className="text-red-700 text-sm mt-1">
                  <strong>Solution:</strong> Chinese characters now display natively in PDFs. Clear your browser cache and try again.
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">Problem: Copy button not working</p>
                <p className="text-red-700 text-sm mt-1">
                  <strong>Solution:</strong> Ensure your browser allows clipboard access. Most modern browsers support this feature automatically.
                </p>
              </div>
            </div>
          </SubSection>

          <SubSection title="Usage and Performance Issues">
            <div className="space-y-3">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="font-medium text-yellow-800 text-sm">Problem: Reached monthly limit</p>
                <p className="text-yellow-700 text-sm mt-1">
                  <strong>Solution:</strong> Contact your administrator for additional requests, or wait for the monthly reset.
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">Problem: Login issues or session timeouts</p>
                <p className="text-red-700 text-sm mt-1">
                  <strong>Solution:</strong> Clear browser cookies and cache, then log in again. Contact your administrator if problems persist.
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">Problem: Action buttons not responding</p>
                <p className="text-red-700 text-sm mt-1">
                  <strong>Solution:</strong> Refresh the page. If using mobile, ensure you're tapping directly on the button area.
                </p>
              </div>
            </div>
          </SubSection>

          <SubSection title="File Upload Problems">
            <div className="space-y-3">
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="font-medium text-orange-800 text-sm">Problem: File upload fails</p>
                <p className="text-orange-700 text-sm mt-1">
                  <strong>Solution:</strong> Check file size (max 10MB), ensure supported format (PDF, images), and verify internet connection.
                </p>
              </div>
            </div>
          </SubSection>

          <SubSection title="Getting Additional Help">
            <FeatureList features={[
              "Contact your school administrator for account issues",
              "Use the test email function to verify configuration",
              "Check browser console for technical error messages",
              "Ensure you're using a modern, supported web browser"
            ]} />
          </SubSection>
        </Section>

        {/* Best Practices */}
        <Section icon={CheckCircle} title="Best Practices and Tips">
          <SubSection title="Writing Effective Concern Descriptions">
            <FeatureList features={[
              "Be specific and objective in your descriptions",
              "Include relevant context about the learning environment",
              "Focus on observable behaviors and academic performance",
              "Mention previous strategies attempted",
              "Include timing and frequency of concerns"
            ]} />
          </SubSection>

          <SubSection title="Maximizing AI Effectiveness">
            <FeatureList features={[
              "Provide complete student context (IEP, EAL status, etc.)",
              "Upload relevant assessment documents when available",
              "Use follow-up questions to clarify specific aspects",
              "Save successful interventions for future reference",
              "Combine multiple concern types when applicable"
            ]} />
          </SubSection>

          <SubSection title="Report Sharing Etiquette">
            <FeatureList features={[
              "Only share with authorized school personnel",
              "Include context in your email message",
              "Follow up with recipients if needed",
              "Keep reports secure and confidential",
              "Document when and with whom reports were shared"
            ]} />
          </SubSection>
        </Section>

        {/* Data Privacy and Security */}
        <Section icon={Shield} title="Data Privacy and Security">
          <SubSection title="Student Privacy Protection">
            <FeatureList features={[
              "Never include full student names or IDs",
              "Use only first name and last initial",
              "Avoid including sensitive personal information",
              "All data is encrypted and securely stored",
              "Access is limited to authorized school personnel"
            ]} />
          </SubSection>

          <SubSection title="File Security">
            <FeatureList features={[
              "Uploaded files are stored securely in cloud storage",
              "Files are only accessible to the uploading teacher",
              "Automatic deletion policies protect long-term privacy",
              "Files are used only for generating better interventions"
            ]} />
          </SubSection>

          <SubSection title="Email Security">
            <FeatureList features={[
              "Email credentials are encrypted and secure",
              "Only you can access your email configuration",
              "School administrators cannot view personal email settings",
              "All email transmissions use secure protocols"
            ]} />
          </SubSection>
        </Section>

        {/* Contact and Support */}
        <Section icon={HelpCircle} title="Getting Support">
          <SubSection title="Who to Contact">
            <FeatureList features={[
              "Technical issues: Contact your school's IT administrator",
              "Account problems: Reach out to your designated school administrator",
              "Usage questions: Refer to this help guide or ask colleagues",
              "Feature requests: Submit through your school's feedback channels"
            ]} />
          </SubSection>

          <SubSection title="Recent Updates and Improvements">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-medium text-green-800 mb-2">Latest Enhancements:</p>
              <FeatureList features={[
                "Action buttons added to all AI-generated content",
                "Fixed PDF character encoding and formatting issues",
                "Improved Chinese language support throughout the system",
                "Enhanced mobile responsiveness for action buttons",
                "Better table formatting in PDF reports",
                "Streamlined copy, download, and share workflows"
              ]} />
            </div>
          </SubSection>

          <SubSection title="Before Contacting Support">
            <StepList steps={[
              "Check this help guide for solutions",
              "Try refreshing your browser or logging out/in",
              "Test your email configuration if having sharing issues",
              "Note any error messages exactly as they appear",
              "Be ready to describe what you were trying to do when the issue occurred"
            ]} />
          </SubSection>
        </Section>

        <div className="border-t border-gray-200 my-8"></div>
        
        <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-lg font-medium text-gray-900 mb-2">Thank you for using Concern2Care!</p>
          <p className="text-gray-600 text-sm">
            Your dedication to student success makes a difference. This platform is designed to support you in providing 
            the best possible interventions for your students.
          </p>
        </div>
      </div>
    </div>
  );
}