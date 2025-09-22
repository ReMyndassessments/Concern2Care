import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useTranslation } from "react-i18next";
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
  Languages,
  Users
} from "lucide-react";

export default function HelpGuide() {
  const { t } = useTranslation();
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
              <span>{t('help.welcome', 'Welcome to Concern2Care')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              {t('help.welcomeDesc', 'Concern2Care is your AI-powered teaching assistant designed to help K-12 educators document student concerns and receive evidence-based intervention strategies. This comprehensive guide will help you make the most of all features.')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-sm">{t('help.documentConcerns', 'Document Concerns')}</p>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <Lightbulb className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="font-medium text-sm">{t('help.getAiInterventions', 'Get AI Interventions')}</p>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <Users className="h-8 w-8 text-violet-600 mx-auto mb-2" />
                <p className="font-medium text-sm">{t('help.classroomManagement', 'Classroom Management')}</p>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <Share className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-sm">{t('help.shareReports', 'Share Reports')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Section icon={User} title={t('help.gettingStarted', 'Getting Started')}>
          <SubSection title={t('help.firstTimeSetup', 'First-Time Setup')}>
            <StepList steps={[
              t('help.firstTimeSetupStep1', 'Complete your profile information in Settings → Profile'),
              t('help.firstTimeSetupStep2', 'Set up your email configuration for report sharing (Settings → Email)'),
              t('help.firstTimeSetupStep3', 'Familiarize yourself with the main dashboard and usage limits'),
              t('help.firstTimeSetupStep4', 'Review the types of concerns and interventions available')
            ]} />
          </SubSection>
          
          <SubSection title={t('help.understandingUsageLimits', 'Understanding Usage Limits')}>
            <p>{t('help.usageLimitsDesc', 'Each teacher has a monthly limit of support requests (typically 20). Your usage is tracked and displayed on the main dashboard.')}</p>
            <Alert className="mt-2">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>{t('help.proTip', 'Tip')}:</strong> {t('help.usageLimitsTip', 'Use the "Save Intervention" feature to keep strategies you find particularly useful without using additional requests.')}
              </AlertDescription>
            </Alert>
          </SubSection>
        </Section>

        {/* Documenting Concerns */}
        <Section icon={FileText} title={t('help.documentingConcerns', 'Documenting Student Concerns')}>
          <SubSection title={t('help.basicInfoRequired', 'Basic Information Required')}>
            <FeatureList features={[
              t('help.basicInfo1', 'Student first name and last initial (privacy protection)'),
              t('help.basicInfo2', 'Grade level and your teaching position'),
              t('help.basicInfo3', 'Incident date and location'),
              t('help.basicInfo4', 'Concern type(s): Academic, Behavioral, Social/Emotional, Attendance, etc.'),
              t('help.basicInfo5', 'Detailed description of the concern'),
              t('help.basicInfo6', 'Severity level: Mild, Moderate, or Urgent'),
              t('help.basicInfo7', 'Actions already taken')
            ]} />
          </SubSection>

          <SubSection title={t('help.enhancedStudentInfo', 'Enhanced Student Information (Optional but Recommended)')}>
            <p>{t('help.enhancedStudentInfoDesc', 'Providing additional student context helps generate more personalized interventions:')}</p>
            <FeatureList features={[
              t('help.enhancedInfo1', 'IEP status and disability information'),
              t('help.enhancedInfo2', 'English as Additional Language (EAL) proficiency level'),
              t('help.enhancedInfo3', 'Gifted program participation'),
              t('help.enhancedInfo4', 'Academic struggling indicators'),
              t('help.enhancedInfo5', 'Other specific learning needs')
            ]} />
          </SubSection>

          <SubSection title={t('help.fileUploads', 'File Uploads for Better Recommendations')}>
            <p>{t('help.fileUploadsDesc', 'Upload relevant documents to enhance AI analysis:')}</p>
            <FeatureList features={[
              t('help.fileUpload1', 'Student assessment reports (PDF, images)'),
              t('help.fileUpload2', 'Lesson plans related to the concern'),
              t('help.fileUpload3', 'Files are securely stored and only used for generating better interventions')
            ]} />
          </SubSection>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('help.proTip', 'Privacy Note')}:</strong> {t('help.privacyNote', 'Never include full names, student IDs, or other personally identifiable information in your descriptions.')}
            </AlertDescription>
          </Alert>
        </Section>

        {/* AI Interventions */}
        <Section icon={Lightbulb} title={t('help.aiInterventions', 'AI-Generated Support Strategies')}>
          <SubSection title={t('help.threeTypesSupport', 'Three Types of AI Support')}>
            <p>{t('help.aiSupportDesc', 'Concern2Care provides three distinct types of AI-generated support strategies:')}</p>
            <div className="space-y-3 mt-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-2">{t('help.differentiationStrategies', '📚 Differentiation Strategies')}</h5>
                <p className="text-sm text-blue-700">
                  {t('help.differentiationDesc', 'Teaching adjustments and personalized learning approaches to meet individual student needs within the classroom setting.')}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h5 className="font-medium text-purple-800 mb-2">{t('help.behaviorSupport', '🎯 Behavior Support Strategies')}</h5>
                <p className="text-sm text-purple-700">
                  {t('help.behaviorSupportDesc', 'Evidence-based intervention approaches for students requiring additional support beyond regular classroom instruction.')}
                </p>
              </div>
              <div className="bg-violet-50 p-4 rounded-lg">
                <h5 className="font-medium text-violet-800 mb-2">{t('help.classroomManagementStrategies', '👥 Classroom Management Strategies')}</h5>
                <p className="text-sm text-violet-700">
                  {t('help.classroomManagementDesc', 'Whole-class management approaches and environmental strategies to improve overall classroom dynamics and learning environment.')}
                </p>
              </div>
            </div>
          </SubSection>

          <SubSection title={t('help.strategyFeatures', 'Strategy Features')}>
            <FeatureList features={[
              t('help.strategyFeature1', 'Multiple strategies per concern with focused approaches'),
              t('help.strategyFeature2', 'Step-by-step implementation guidance'),
              t('help.strategyFeature3', 'Timeline recommendations and progress monitoring'),
              t('help.strategyFeature4', 'Evidence-based approaches aligned with educational best practices'),
              t('help.strategyFeature5', 'Personalized based on student needs, context, and chosen strategy type')
            ]} />
          </SubSection>

          <SubSection title={t('help.savingManaging', 'Saving and Managing Interventions')}>
            <StepList steps={[
              t('help.savingStep1', 'Review the generated intervention strategies'),
              t('help.savingStep2', 'Click \'Save Intervention\' to bookmark useful strategies'),
              t('help.savingStep3', 'Saved interventions appear in your support requests list'),
              t('help.savingStep4', 'Use the search function to find specific interventions later')
            ]} />
          </SubSection>

          <SubSection title={t('help.newActionButtons', 'New: Action Buttons for AI Outputs')}>
            <p>{t('help.actionButtonsDesc', 'Each AI-generated intervention now includes convenient action buttons at the bottom:')}</p>
            <div className="space-y-3 mt-3">
              <div className="bg-gray-50 p-3 rounded-lg flex items-center space-x-3">
                <Copy className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm text-gray-800">{t('help.copyClipboard', 'Copy to Clipboard')}</p>
                  <p className="text-xs text-gray-600">{t('help.copyClipboardDesc', 'Instantly copy the intervention text for use in other documents')}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex items-center space-x-3">
                <Download className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm text-gray-800">{t('help.downloadTextFile', 'Download as Text File')}</p>
                  <p className="text-xs text-gray-600">{t('help.downloadTextFileDesc', 'Save individual interventions as .txt files to your device')}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex items-center space-x-3">
                <Upload className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm text-gray-800">{t('help.shareIndividual', 'Share Individual Intervention')}</p>
                  <p className="text-xs text-gray-600">{t('help.shareIndividualDesc', 'Share specific interventions via email without creating full reports')}</p>
                </div>
              </div>
            </div>
          </SubSection>
        </Section>

        {/* Classroom Management Strategies */}
        <Section icon={Users} title={t('help.classroomManagementTitle', 'Classroom Management Strategies')}>
          <SubSection title={t('help.whatAreClassroomStrategies', 'What Are Classroom Management Strategies?')}>
            <p>{t('help.classroomStrategiesDesc', 'Classroom management strategies focus on whole-class approaches to improve the overall learning environment, classroom dynamics, and group behavior management.')}</p>
            <div className="bg-violet-50 p-4 rounded-lg mt-3">
              <h6 className="font-medium text-violet-800 mb-2">{t('help.keyDifferences', 'Key Differences from Individual Student Support:')}</h6>
              <ul className="text-sm text-violet-700 space-y-1">
                <li>{t('help.keyDiff1', '• Addresses classroom-wide issues rather than individual student concerns')}</li>
                <li>{t('help.keyDiff2', '• Focuses on environmental factors, routines, and systems')}</li>
                <li>{t('help.keyDiff3', '• Provides strategies for managing groups and classroom dynamics')}</li>
                <li>{t('help.keyDiff4', '• Includes proactive approaches to prevent issues before they occur')}</li>
              </ul>
            </div>
          </SubSection>

          <SubSection title={t('help.whenToUse', 'When to Use Classroom Management Strategies')}>
            <p>{t('help.whenToUseDesc', 'Consider using classroom management support when you\'re experiencing:')}</p>
            <FeatureList features={[
              t('help.whenToUse1', 'Overall classroom disruption or lack of focus'),
              t('help.whenToUse2', 'Difficulty managing transitions between activities'),
              t('help.whenToUse3', 'Challenges with group work or collaborative learning'),
              t('help.whenToUse4', 'Problems with classroom routines or procedures'),
              t('help.whenToUse5', 'Need for better engagement strategies for the whole class'),
              t('help.whenToUse6', 'Issues with classroom environment or physical space management')
            ]} />
          </SubSection>

          <SubSection title="Information Required for Classroom Management Requests">
            <p>When requesting classroom management strategies, you'll provide:</p>
            <FeatureList features={[
              "Total number of students in your class",
              "Information about mixed abilities and learning levels",
              "Number of English as Additional Language (EAL) learners",
              "Number of students with IEPs or special needs",
              "Description of pervasive issues affecting the class",
              "Additional context about your classroom environment"
            ]} />
          </SubSection>

          <SubSection title="Types of Classroom Management Strategies You'll Receive">
            <div className="space-y-3 mt-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h6 className="font-medium text-gray-800 mb-2">🏛️ Environmental Strategies</h6>
                <p className="text-sm text-gray-700">Physical classroom setup, seating arrangements, and learning zones</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h6 className="font-medium text-gray-800 mb-2">⏰ Routine & Procedure Strategies</h6>
                <p className="text-sm text-gray-700">Daily routines, transitions, and classroom management systems</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h6 className="font-medium text-gray-800 mb-2">🎯 Engagement & Motivation Strategies</h6>
                <p className="text-sm text-gray-700">Whole-class motivation techniques and engagement methods</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h6 className="font-medium text-gray-800 mb-2">🤝 Group Management Strategies</h6>
                <p className="text-sm text-gray-700">Managing collaborative work, group dynamics, and peer interactions</p>
              </div>
            </div>
          </SubSection>

          <SubSection title="Guided-Practice Implementation Format">
            <p>Classroom management strategies are provided in a structured, guided-practice format with implementation phases:</p>
            <div className="space-y-2 mt-3">
              <div className="bg-green-50 p-3 rounded-lg">
                <h6 className="font-medium text-green-800 text-sm mb-1">📋 Week 1-2: Foundation Setting</h6>
                <p className="text-xs text-green-700">Initial setup, introducing new systems, and establishing routines</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <h6 className="font-medium text-blue-800 text-sm mb-1">🔄 Week 3-6: Strategy Integration</h6>
                <p className="text-xs text-blue-700">Refining approaches, addressing challenges, and building consistency</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <h6 className="font-medium text-purple-800 text-sm mb-1">✅ Ongoing: Sustainable Practices</h6>
                <p className="text-xs text-purple-700">Long-term maintenance, monitoring, and continuous improvement</p>
              </div>
            </div>
          </SubSection>

          <SubSection title="How Classroom Management Integrates with Individual Student Support">
            <p>Classroom management strategies work alongside individual student interventions:</p>
            <FeatureList features={[
              "AI analyzes your previous individual student concerns to inform classroom strategies",
              "Addresses systemic issues that may be affecting multiple students",
              "Provides environmental supports that benefit all students, including those with individual needs",
              "Creates a foundation for successful implementation of individual interventions"
            ]} />
          </SubSection>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Pro Tip:</strong> Classroom management strategies can often prevent many individual student issues from arising by creating a more structured, supportive learning environment for all students.
            </AlertDescription>
          </Alert>
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
              "Use the 'Differentiation Requests', 'Intervention Requests', and 'Classroom Management' tabs to find your concerns",
              "Find the concern you want to share",
              "Click the 'Share' button next to the concern", 
              "The system generates a comprehensive PDF report with appropriate headers for the request type"
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
                <p className="text-xs text-blue-700">Teaching strategies and classroom adjustments for individual students</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <h6 className="font-medium text-purple-800 text-sm mb-1">🎯 Intervention Requests</h6>
                <p className="text-xs text-purple-700">Behavior support strategies and learning plans for individual students</p>
              </div>
              <div className="bg-violet-50 p-3 rounded-lg">
                <h6 className="font-medium text-violet-800 text-sm mb-1">👥 Classroom Management Requests</h6>
                <p className="text-xs text-violet-700">Whole-class strategies and environmental management approaches</p>
              </div>
            </div>
          </SubSection>

          <SubSection title="Report Contents">
            <FeatureList features={[
              "Original concern documentation with appropriate context (student or classroom)",
              "AI-generated support strategies (differentiation, intervention, or classroom management)",
              "Implementation timelines and structured guidance with phases", 
              "Professional formatting suitable for school records",
              "Appropriate headers: Individual student reports vs. classroom management strategy reports",
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
              "Fully responsive design works perfectly on phones and tablets",
              "Touch-friendly interface with large buttons (56px minimum height)",
              "All features available on mobile devices with optimized layouts",
              "Mobile-first forms with proper keyboard optimization",
              "Collapsible navigation menus for easy mobile navigation",
              "Full-width buttons on mobile for easy tapping",
              "Optimized text sizes and spacing for mobile reading"
            ]} />
          </SubSection>

          <SubSection title="Mobile Usage Tips">
            <StepList steps={[
              "Use landscape mode for easier table viewing and data entry",
              "Tap and hold buttons if they don't respond immediately",
              "The hamburger menu (☰) provides quick access to all features",
              "Scroll horizontally on data tables to view all columns",
              "Use pinch-to-zoom for detailed report viewing",
              "Voice-to-text works well in concern description fields"
            ]} />
          </SubSection>

          <SubSection title="Mobile-Optimized Features">
            <FeatureList features={[
              "Mobile-friendly landing page with shorter text on small screens",
              "Touch-optimized CTA buttons with enhanced visual feedback",
              "Responsive admin dashboard with scrollable content",
              "Mobile-friendly login page with proper keyboard handling",
              "Swipe gestures supported for navigation where applicable"
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
                "Comprehensive mobile responsiveness improvements across all pages",
                "Mobile-optimized CTA section with touch-friendly 56px buttons",
                "Enhanced mobile navigation with collapsible menus",
                "Mobile-first responsive breakpoints (sm, md, lg, xl)",
                "Improved mobile text sizing and readability",
                "Touch-friendly button designs with proper spacing",
                "Mobile-specific content optimization for better user experience",
                "Enhanced mobile landing page with shortened text for small screens"
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