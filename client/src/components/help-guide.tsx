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

          <SubSection title={t('help.infoRequired', 'Information Required for Classroom Management Requests')}>
            <p>{t('help.infoRequiredDesc', 'When requesting classroom management strategies, you\'ll provide:')}</p>
            <FeatureList features={[
              t('help.infoRequired1', 'Total number of students in your class'),
              t('help.infoRequired2', 'Information about mixed abilities and learning levels'),
              t('help.infoRequired3', 'Number of English as Additional Language (EAL) learners'),
              t('help.infoRequired4', 'Number of students with IEPs or special needs'),
              t('help.infoRequired5', 'Description of pervasive issues affecting the class'),
              t('help.infoRequired6', 'Additional context about your classroom environment')
            ]} />
          </SubSection>

          <SubSection title={t('help.typesYouReceive', 'Types of Classroom Management Strategies You\'ll Receive')}>
            <div className="space-y-3 mt-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h6 className="font-medium text-gray-800 mb-2">{t('help.environmentalStrategies', '🏛️ Environmental Strategies')}</h6>
                <p className="text-sm text-gray-700">{t('help.environmentalDesc', 'Physical classroom setup, seating arrangements, and learning zones')}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h6 className="font-medium text-gray-800 mb-2">{t('help.routineProcedure', '⏰ Routine & Procedure Strategies')}</h6>
                <p className="text-sm text-gray-700">{t('help.routineProcedureDesc', 'Daily routines, transitions, and classroom management systems')}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h6 className="font-medium text-gray-800 mb-2">{t('help.engagementMotivation', '🎯 Engagement & Motivation Strategies')}</h6>
                <p className="text-sm text-gray-700">{t('help.engagementMotivationDesc', 'Whole-class motivation techniques and engagement methods')}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h6 className="font-medium text-gray-800 mb-2">{t('help.groupManagement', '🤝 Group Management Strategies')}</h6>
                <p className="text-sm text-gray-700">{t('help.groupManagementDesc', 'Managing collaborative work, group dynamics, and peer interactions')}</p>
              </div>
            </div>
          </SubSection>

          <SubSection title={t('help.guidedPractice', 'Guided-Practice Implementation Format')}>
            <p>{t('help.guidedPracticeDesc', 'Classroom management strategies are provided in a structured, guided-practice format with implementation phases:')}</p>
            <div className="space-y-2 mt-3">
              <div className="bg-green-50 p-3 rounded-lg">
                <h6 className="font-medium text-green-800 text-sm mb-1">{t('help.week12', '📋 Week 1-2: Foundation Setting')}</h6>
                <p className="text-xs text-green-700">{t('help.week12Desc', 'Initial setup, introducing new systems, and establishing routines')}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <h6 className="font-medium text-blue-800 text-sm mb-1">{t('help.week36', '🔄 Week 3-6: Strategy Integration')}</h6>
                <p className="text-xs text-blue-700">{t('help.week36Desc', 'Refining approaches, addressing challenges, and building consistency')}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <h6 className="font-medium text-purple-800 text-sm mb-1">{t('help.ongoing', '✅ Ongoing: Sustainable Practices')}</h6>
                <p className="text-xs text-purple-700">{t('help.ongoingDesc', 'Long-term maintenance, monitoring, and continuous improvement')}</p>
              </div>
            </div>
          </SubSection>

          <SubSection title={t('help.integrationWithIndividual', 'How Classroom Management Integrates with Individual Student Support')}>
            <p>{t('help.integrationDesc', 'Classroom management strategies work alongside individual student interventions:')}</p>
            <FeatureList features={[
              t('help.integration1', 'AI analyzes your previous individual student concerns to inform classroom strategies'),
              t('help.integration2', 'Addresses systemic issues that may be affecting multiple students'),
              t('help.integration3', 'Provides environmental supports that benefit all students, including those with individual needs'),
              t('help.integration4', 'Creates a foundation for successful implementation of individual interventions')
            ]} />
          </SubSection>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('help.proTip', 'Pro Tip')}:</strong> {t('help.proTipDesc', 'Classroom management strategies can often prevent many individual student issues from arising by creating a more structured, supportive learning environment for all students.')}
            </AlertDescription>
          </Alert>
        </Section>

        {/* Follow-up Questions */}
        <Section icon={MessageSquare} title={t('help.followUpQuestions', 'Follow-up Questions and Support')}>
          <SubSection title={t('help.gettingAdditional', 'Getting Additional Guidance')}>
            <p>{t('help.additionalGuidanceDesc', 'After receiving interventions, you can ask follow-up questions for clarification or additional strategies:')}</p>
            <StepList steps={[
              t('help.followUpStep1', 'Click \'Ask Follow-up Question\' on any intervention'),
              t('help.followUpStep2', 'Type your specific question or request for clarification'),
              t('help.followUpStep3', 'Receive AI-powered responses with additional guidance'),
              t('help.followUpStep4', 'Ask multiple questions as needed')
            ]} />
          </SubSection>

          <SubSection title={t('help.commonFollowUp', 'Common Follow-up Questions')}>
            <FeatureList features={[
              t('help.commonFollowUp1', 'How to adapt strategies for different learning styles'),
              t('help.commonFollowUp2', 'Timeline adjustments for specific situations'),
              t('help.commonFollowUp3', 'Modifications for students with special needs'),
              t('help.commonFollowUp4', 'Progress monitoring techniques'),
              t('help.commonFollowUp5', 'Parent communication strategies')
            ]} />
          </SubSection>
        </Section>

        {/* Report Generation and Sharing */}
        <Section icon={Share} title={t('help.reportGeneration', 'Report Generation and Sharing')}>
          <SubSection title={t('help.creatingPDFReports', 'Creating PDF Reports')}>
            <p>{t('help.pdfReportsDesc', 'Generate professional reports that include your concern documentation and recommended interventions:')}</p>
            <StepList steps={[
              t('help.reportStep1', "Navigate to 'My Support Requests' from the main menu"),
              t('help.reportStep2', "Use the 'Differentiation Requests', 'Intervention Requests', and 'Classroom Management' tabs to find your concerns"),
              t('help.reportStep3', "Find the concern you want to share"),
              t('help.reportStep4', "Click the 'Share' button next to the concern"), 
              t('help.reportStep5', "The system generates a comprehensive PDF report with appropriate headers for the request type")
            ]} />
          </SubSection>

          <SubSection title={t('help.emailSharing', 'Email Sharing')}>
            <p>{t('help.emailSharingDesc', 'Share reports directly with student support staff or when necessary:')}</p>
            <StepList steps={[
              t('help.emailStep1', "Ensure your email configuration is set up (Settings → Email)"),
              t('help.emailStep2', "Add recipient names and email addresses"),
              t('help.emailStep3', "Include a personalized message"),
              t('help.emailStep4', "Click 'Send Report' to share via email")
            ]} />
          </SubSection>

          <SubSection title={t('help.organizedRequestManagement', 'Organized Request Management')}>
            <p>{t('help.organizedRequestDesc', 'Your support requests are now organized into clear categories:')}</p>
            <div className="space-y-2 mt-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h6 className="font-medium text-blue-800 text-sm mb-1">{t('help.differentiationRequestsTitle', '📚 Differentiation Requests')}</h6>
                <p className="text-xs text-blue-700">{t('help.differentiationRequestsDesc', 'Teaching strategies and classroom adjustments for individual students')}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <h6 className="font-medium text-purple-800 text-sm mb-1">{t('help.interventionRequestsTitle', '🎯 Intervention Requests')}</h6>
                <p className="text-xs text-purple-700">{t('help.interventionRequestsDesc', 'Behavior support strategies and learning plans for individual students')}</p>
              </div>
              <div className="bg-violet-50 p-3 rounded-lg">
                <h6 className="font-medium text-violet-800 text-sm mb-1">{t('help.classroomRequestsTitle', '👥 Classroom Management Requests')}</h6>
                <p className="text-xs text-violet-700">{t('help.classroomRequestsDesc', 'Whole-class strategies and environmental management approaches')}</p>
              </div>
            </div>
          </SubSection>

          <SubSection title={t('help.reportContents', 'Report Contents')}>
            <FeatureList features={[
              t('help.reportContent1', "Original concern documentation with appropriate context (student or classroom)"),
              t('help.reportContent2', "AI-generated support strategies (differentiation, intervention, or classroom management)"),
              t('help.reportContent3', "Implementation timelines and structured guidance with phases"), 
              t('help.reportContent4', "Professional formatting suitable for school records"),
              t('help.reportContent5', "Appropriate headers: Individual student reports vs. classroom management strategy reports"),
              t('help.reportContent6', "Date stamps and teacher information"),
              t('help.reportContent7', "Proper Chinese character support for bilingual reports"),
              t('help.reportContent8', "Clean, professional table formatting for structured content")
            ]} />
          </SubSection>

          <SubSection title={t('help.enhancedPDFQuality', 'Enhanced PDF Quality')}>
            <p>{t('help.enhancedPDFQualityDesc', 'Recent improvements to PDF report generation:')}</p>
            <FeatureList features={[
              t('help.pdfQuality1', "Fixed character encoding issues - no more garbled text (Ø=ÜÝ)"),
              t('help.pdfQuality2', "Native Chinese character display without placeholder messages"),
              t('help.pdfQuality3', "Professional table formatting with proper borders and spacing"),
              t('help.pdfQuality4', "Optimized spacing for cleaner, more compact documents"),
              t('help.pdfQuality5', "Better formatting for structured AI responses and lesson plans")
            ]} />
          </SubSection>
        </Section>

        {/* Email Configuration */}
        <Section icon={Mail} title={t('help.emailConfiguration', 'Email Configuration')}>
          <SubSection title={t('help.personalEmailSetup', 'Personal Email Setup')}>
            <p>{t('help.personalEmailSetupDesc', 'Configure your personal email account for sending reports:')}</p>
            <StepList steps={[
              t('help.emailSetupStep1', "Go to Settings → Email Configuration"),
              t('help.emailSetupStep2', "Click 'Edit Personal Email Settings'"),
              t('help.emailSetupStep3', "Enter your email provider's SMTP settings"),
              t('help.emailSetupStep4', "For Gmail: Use smtp.gmail.com, port 587, and an App Password"),
              t('help.emailSetupStep5', "Test your configuration before saving")
            ]} />
          </SubSection>

          <SubSection title={t('help.gmailSetup', 'Gmail Setup (Most Common)')}>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium mb-2">{t('help.gmailConfiguration', 'Gmail Configuration:')}</p>
              <ul className="text-sm space-y-1">
                <li><strong>{t('help.gmailConfigHost', 'SMTP Host:')}</strong> smtp.gmail.com</li>
                <li><strong>{t('help.gmailConfigPort', 'Port:')}</strong> 587</li>
                <li><strong>{t('help.gmailConfigSecurity', 'Security:')}</strong> TLS/STARTTLS</li>
                <li><strong>{t('help.gmailConfigUsername', 'Username:')}</strong> {t('help.gmailConfigUsernameDesc', 'Your Gmail address')}</li>
                <li><strong>{t('help.gmailConfigPassword', 'Password:')}</strong> {t('help.gmailConfigPasswordDesc', 'Gmail App Password (not your regular password)')}</li>
              </ul>
            </div>
          </SubSection>

          <SubSection title={t('help.creatingGmailPasswords', 'Creating Gmail App Passwords')}>
            <StepList steps={[
              t('help.gmailStep1', "Go to your Google Account Security settings"),
              t('help.gmailStep2', "Enable 2-Step Verification if not already enabled"),
              t('help.gmailStep3', "Look for 'App passwords' section"),
              t('help.gmailStep4', "Generate a new app password for 'Mail'"),
              t('help.gmailStep5', "Copy the 16-character password and use it in Concern2Care")
            ]} />
          </SubSection>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('help.troubleshootingGmail', "Troubleshooting: If you can't find App Passwords, ensure 2-Step Verification is enabled first. Some workplace accounts may have different requirements.")}
            </AlertDescription>
          </Alert>

          <SubSection title={t('help.schoolEmailConfig', 'School Email Configuration (Admin Only)')}>
            <p>{t('help.schoolEmailConfigDesc', 'Administrators can configure school-wide email settings that all teachers can use as an alternative to personal email accounts.')}</p>
          </SubSection>
        </Section>

        {/* Profile Management */}
        <Section icon={Settings} title={t('help.profileManagement', 'Profile and Account Management')}>
          <SubSection title={t('help.updatingProfile', 'Updating Your Profile')}>
            <StepList steps={[
              t('help.profileStep1', "Go to Settings → Profile"),
              t('help.profileStep2', "Click 'Edit' to modify your information"),
              t('help.profileStep3', "Update your first name, last name, and email address"),
              t('help.profileStep4', "Click 'Save' to confirm changes")
            ]} />
          </SubSection>

          <SubSection title={t('help.accountInformation', 'Account Information')}>
            <FeatureList features={[
              t('help.accountInfo1', "View your account type (Teacher or Administrator)"),
              t('help.accountInfo2', "Monitor your monthly usage statistics"),
              t('help.accountInfo3', "Track requests used vs. remaining"),
              t('help.accountInfo4', "View your support request limit")
            ]} />
          </SubSection>

          <SubSection title={t('help.notificationPreferences', 'Notification Preferences')}>
            <p>{t('help.notificationPreferencesDesc', 'Configure how you receive updates:')}</p>
            <FeatureList features={[
              t('help.notification1', "Email notifications for important events"),
              t('help.notification2', "Report generation alerts"),
              t('help.notification3', "System update notifications")
            ]} />
          </SubSection>
        </Section>

        {/* Individual Teacher Registration - Feature Flag Conditional */}
        {isFeatureEnabled('individual_teacher_registration') && (
          <Section icon={User} title={t('help.individualTeacherRegistration', 'Individual Teacher Registration')}>
            <p className="text-sm text-gray-600 mb-4">
              <Badge variant="outline" className="mr-2 bg-orange-50 text-orange-700 border-orange-200">Individual Teachers</Badge>
              For individual teachers who want to use Concern2Care without school administration setup.
            </p>

            <SubSection title={t('help.gettingStartedIndividual', 'Getting Started as Individual Teacher')}>
              <FeatureList features={[
                t('help.individual1', "Register independently for $10/month through Buy Me a Coffee"),
                t('help.individual2', "Complete your professional profile with school and teaching details"), 
                t('help.individual3', "Get the same powerful AI-generated differentiation and intervention strategies"),
                t('help.individual4', "Access all features including PDF reports and email sharing"),
                t('help.individual5', "Cancel anytime with no long-term commitment")
              ]} />
            </SubSection>

            <SubSection title={t('help.registrationInfoRequired', 'Registration Information Required')}>
              <FeatureList features={[
                t('help.regInfo1', "First Name and Last Name *"),
                t('help.regInfo2', "Email Address * (for account access)"),
                t('help.regInfo3', "Password * (minimum 6 characters)"),
                t('help.regInfo4', "School Name *"),
                t('help.regInfo5', "School District (optional for private/standalone schools)"),
                t('help.regInfo6', "Primary Grade * (e.g., '3rd Grade', 'K-5')"),
                t('help.regInfo7', "Primary Subject * (e.g., 'Mathematics', 'ELA')"),
                t('help.regInfo8', "Teacher Type * (Classroom Teacher, Special Education, etc.)")
              ]} />
            </SubSection>

            <SubSection title={t('help.individualVsSchool', 'Individual vs. School-Managed Accounts')}>
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h6 className="font-medium text-green-800 mb-2">{t('help.individualBenefits', 'Individual Account Benefits')}</h6>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>{t('help.individualBenefit1', '• Complete autonomy over your account')}</li>
                    <li>{t('help.individualBenefit2', '• No need for school administrator setup')}</li>
                    <li>{t('help.individualBenefit3', '• Direct payment and subscription management')}</li>
                    <li>{t('help.individualBenefit4', '• Immediate access after registration')}</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h6 className="font-medium text-blue-800 mb-2">{t('help.schoolBenefits', 'School-Managed Account Benefits')}</h6>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>{t('help.schoolBenefit1', '• Paid for by your school or district')}</li>
                    <li>{t('help.schoolBenefit2', '• Integrated with school email systems')}</li>
                    <li>{t('help.schoolBenefit3', '• Coordinated professional development')}</li>
                    <li>{t('help.schoolBenefit4', '• No personal payment required')}</li>
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
        <Section icon={Shield} title={t('help.adminFeatures', 'School Administrator Features')}>
          <p className="text-sm text-gray-600 mb-4">
            <Badge variant="outline" className="mr-2">{t('help.schoolAdminOnly', 'School Admin Only')}</Badge>
            {t('help.adminFeaturesDesc', 'These features are available to designated school administrators for managing their institution\'s Concern2Care usage.')}
          </p>

          <SubSection title={t('help.teacherAccountManagement', 'Teacher Account Management')}>
            <FeatureList features={[
              t('help.teacherMgmt1', "Add new teacher accounts for your school"),
              t('help.teacherMgmt2', "Edit teacher contact information and profiles"),
              t('help.teacherMgmt3', "Grant additional monthly requests when needed"),
              t('help.teacherMgmt4', "Deactivate teacher accounts (e.g., staff changes)"),
              t('help.teacherMgmt5', "View teacher usage statistics and activity")
            ]} />
          </SubSection>

          <SubSection title={t('help.schoolWideEmail', 'School-Wide Email Configuration')}>
            <FeatureList features={[
              t('help.schoolEmail1', "Set up school district email settings for all teachers"),
              t('help.schoolEmail2', "Configure institutional SMTP server details"), 
              t('help.schoolEmail3', "Allow teachers to use school email for report sharing"),
              t('help.schoolEmail4', "Test and validate school email configuration")
            ]} />
          </SubSection>

          <SubSection title={t('help.schoolAnalytics', 'School Analytics and Reporting')}>
            <FeatureList features={[
              t('help.analytics1', "View school-wide usage dashboard and trends"),
              t('help.analytics2', "Generate reports on intervention effectiveness"),
              t('help.analytics3', "Monitor teacher engagement and adoption rates"),
              t('help.analytics4', "Export school data for institutional analysis"),
              t('help.analytics5', "Track most common concern types and patterns")
            ]} />
          </SubSection>

          <SubSection title={t('help.userSupportTraining', 'User Support and Training')}>
            <FeatureList features={[
              t('help.support1', "Send password reset emails to teachers"),
              t('help.support2', "Access teacher training resources and guides"),
              t('help.support3', "Monitor help desk issues and common problems"),
              t('help.support4', "Coordinate staff training sessions")
            ]} />
          </SubSection>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
{t('help.adminPrivacyNote', 'Note: School administrators cannot access individual teacher\'s concern details or reports for privacy protection, but can view aggregated usage statistics.')}
            </AlertDescription>
          </Alert>
        </Section>

        {/* Language and International Support */}
        <Section icon={Languages} title={t('help.languageSupport', 'Language and International Support')}>
          <SubSection title={t('help.multiLanguage', 'Multi-Language Capabilities')}>
            <FeatureList features={[
              t('help.multiLang1', "AI can understand and respond to questions in multiple languages"),
              t('help.multiLang2', "Chinese language support for parent communication materials"),
              t('help.multiLang3', "Proper character encoding for international text in PDF reports"),
              t('help.multiLang4', "Cross-cultural educational strategies when appropriate")
            ]} />
          </SubSection>

          {isFeatureEnabled('chinese_localization') && (
            <SubSection title={t('help.chineseInterface', 'Chinese Interface (Beta)')}>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">New Feature</Badge>
                  <p className="font-medium text-blue-800">完整中文界面支持</p>
                </div>
                <FeatureList features={[
                  t('help.chineseFeature1', "Complete Chinese translation of the user interface"),
                  t('help.chineseFeature2', "Language switching between English and Chinese"),
                  t('help.chineseFeature3', "Localized form labels, buttons, and navigation"),
                  t('help.chineseFeature4', "Chinese educational terminology and context"),
                  t('help.chineseFeature5', "Seamless language preference storage")
                ]} />
                <p className="text-sm text-blue-700 mt-3">
                  {t('help.languageSwitcher', 'Use the language selector in the header to switch between English and Chinese. Your preference will be saved automatically.')}
                </p>
              </div>
            </SubSection>
          )}
        </Section>

        {/* Mobile Usage */}
        <Section icon={Smartphone} title={t('help.mobileAccessibility', 'Mobile and Accessibility')}>
          <SubSection title={t('help.mobileDeviceUsage', 'Mobile Device Usage')}>
            <FeatureList features={[
              t('help.mobileFeature1', "Fully responsive design works perfectly on phones and tablets"),
              t('help.mobileFeature2', "Touch-friendly interface with large buttons (56px minimum height)"),
              t('help.mobileFeature3', "All features available on mobile devices with optimized layouts"),
              t('help.mobileFeature4', "Mobile-first forms with proper keyboard optimization"),
              t('help.mobileFeature5', "Collapsible navigation menus for easy mobile navigation"),
              t('help.mobileFeature6', "Full-width buttons on mobile for easy tapping"),
              t('help.mobileFeature7', "Optimized text sizes and spacing for mobile reading")
            ]} />
          </SubSection>

          <SubSection title={t('help.mobileUsageTips', 'Mobile Usage Tips')}>
            <StepList steps={[
              t('help.mobileTip1', "Use landscape mode for easier table viewing and data entry"),
              t('help.mobileTip2', "Tap and hold buttons if they don't respond immediately"),
              t('help.mobileTip3', "The hamburger menu (☰) provides quick access to all features"),
              t('help.mobileTip4', "Scroll horizontally on data tables to view all columns"),
              t('help.mobileTip5', "Use pinch-to-zoom for detailed report viewing"),
              t('help.mobileTip6', "Voice-to-text works well in concern description fields")
            ]} />
          </SubSection>

          <SubSection title={t('help.mobileOptimized', 'Mobile-Optimized Features')}>
            <FeatureList features={[
              t('help.mobileOptFeature1', "Mobile-friendly landing page with shorter text on small screens"),
              t('help.mobileOptFeature2', "Touch-optimized CTA buttons with enhanced visual feedback"),
              t('help.mobileOptFeature3', "Responsive admin dashboard with scrollable content"),
              t('help.mobileOptFeature4', "Mobile-friendly login page with proper keyboard handling"),
              t('help.mobileOptFeature5', "Swipe gestures supported for navigation where applicable")
            ]} />
          </SubSection>

          <SubSection title={t('help.accessibilityFeatures', 'Accessibility Features')}>
            <FeatureList features={[
              t('help.accessFeature1', "Keyboard navigation support"),
              t('help.accessFeature2', "Screen reader compatibility"),
              t('help.accessFeature3', "High contrast color schemes"),
              t('help.accessFeature4', "Scalable text and interface elements"),
              t('help.accessFeature5', "Proper ARIA labels on all interactive elements")
            ]} />
          </SubSection>
        </Section>

        {/* Troubleshooting */}
        <Section icon={AlertTriangle} title={t('help.troubleshooting', 'Troubleshooting Common Issues')}>
          <SubSection title={t('help.emailProblems', 'Email Sharing Problems')}>
            <div className="space-y-3">
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">{t('help.emailProblem1Title', 'Problem: "Failed to Share Report" error')}</p>
                <p className="text-red-700 text-sm mt-1">
                  {t('help.emailProblem1Solution', 'Solution: Check your email configuration. For Gmail, ensure you\'re using an App Password, not your regular password.')}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">{t('help.emailProblem2Title', 'Problem: Email test fails')}</p>
                <p className="text-red-700 text-sm mt-1">
                  {t('help.emailProblem2Solution', 'Solution: Verify SMTP settings, check internet connection, and ensure your email provider allows third-party app access.')}
                </p>
              </div>
            </div>
          </SubSection>

          <SubSection title={t('help.pdfReportIssues', 'PDF and Report Issues')}>
            <div className="space-y-3">
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">{t('help.pdfProblem1Title', 'Problem: PDF shows garbled characters or symbols')}</p>
                <p className="text-red-700 text-sm mt-1">
                  <strong>{t('help.solution', 'Solution')}:</strong> {t('help.pdfProblem1Solution', 'This has been fixed in recent updates. If you still see issues, try refreshing the page and generating a new report.')}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">{t('help.pdfProblem2Title', 'Problem: Chinese text not displaying properly')}</p>
                <p className="text-red-700 text-sm mt-1">
                  <strong>{t('help.solution', 'Solution')}:</strong> {t('help.pdfProblem2Solution', 'Chinese characters now display natively in PDFs. Clear your browser cache and try again.')}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">{t('help.pdfProblem3Title', 'Problem: Copy button not working')}</p>
                <p className="text-red-700 text-sm mt-1">
                  <strong>{t('help.solution', 'Solution')}:</strong> {t('help.pdfProblem3Solution', 'Ensure your browser allows clipboard access. Most modern browsers support this feature automatically.')}
                </p>
              </div>
            </div>
          </SubSection>

          <SubSection title={t('help.usagePerformanceIssues', 'Usage and Performance Issues')}>
            <div className="space-y-3">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="font-medium text-yellow-800 text-sm">{t('help.usageProblem1Title', 'Problem: Reached monthly limit')}</p>
                <p className="text-yellow-700 text-sm mt-1">
                  <strong>{t('help.solution', 'Solution')}:</strong> {t('help.usageProblem1Solution', 'Contact your administrator for additional requests, or wait for the monthly reset.')}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">{t('help.usageProblem2Title', 'Problem: Login issues or session timeouts')}</p>
                <p className="text-red-700 text-sm mt-1">
                  <strong>{t('help.solution', 'Solution')}:</strong> {t('help.usageProblem2Solution', 'Clear browser cookies and cache, then log in again. Contact your administrator if problems persist.')}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-800 text-sm">{t('help.usageProblem3Title', 'Problem: Action buttons not responding')}</p>
                <p className="text-red-700 text-sm mt-1">
                  <strong>{t('help.solution', 'Solution')}:</strong> {t('help.usageProblem3Solution', 'Refresh the page. If using mobile, ensure you\'re tapping directly on the button area.')}
                </p>
              </div>
            </div>
          </SubSection>

          <SubSection title={t('help.fileUploadProblems', 'File Upload Problems')}>
            <div className="space-y-3">
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="font-medium text-orange-800 text-sm">{t('help.fileUploadProblemTitle', 'Problem: File upload fails')}</p>
                <p className="text-orange-700 text-sm mt-1">
                  <strong>{t('help.solution', 'Solution')}:</strong> {t('help.fileUploadProblemSolution', 'Check file size (max 10MB), ensure supported format (PDF, images), and verify internet connection.')}
                </p>
              </div>
            </div>
          </SubSection>

          <SubSection title={t('help.gettingAdditionalHelp', 'Getting Additional Help')}>
            <FeatureList features={[
              t('help.additionalHelp1', "Contact your school administrator for account issues"),
              t('help.additionalHelp2', "Use the test email function to verify configuration"),
              t('help.additionalHelp3', "Check browser console for technical error messages"),
              t('help.additionalHelp4', "Ensure you're using a modern, supported web browser")
            ]} />
          </SubSection>
        </Section>

        {/* Best Practices */}
        <Section icon={CheckCircle} title={t('help.bestPractices', 'Best Practices and Tips')}>
          <SubSection title={t('help.writingEffective', 'Writing Effective Concern Descriptions')}>
            <FeatureList features={[
              t('help.writingTip1', "Be specific and objective in your descriptions"),
              t('help.writingTip2', "Include relevant context about the learning environment"),
              t('help.writingTip3', "Focus on observable behaviors and academic performance"),
              t('help.writingTip4', "Mention previous strategies attempted"),
              t('help.writingTip5', "Include timing and frequency of concerns")
            ]} />
          </SubSection>

          <SubSection title={t('help.maximizingAI', 'Maximizing AI Effectiveness')}>
            <FeatureList features={[
              t('help.aiTip1', "Provide complete student context (IEP, EAL status, etc.)"),
              t('help.aiTip2', "Upload relevant assessment documents when available"),
              t('help.aiTip3', "Use follow-up questions to clarify specific aspects"),
              t('help.aiTip4', "Save successful interventions for future reference"),
              t('help.aiTip5', "Combine multiple concern types when applicable")
            ]} />
          </SubSection>

          <SubSection title={t('help.reportSharingEtiquette', 'Report Sharing Etiquette')}>
            <FeatureList features={[
              t('help.sharingTip1', "Only share with authorized school personnel"),
              t('help.sharingTip2', "Include context in your email message"),
              t('help.sharingTip3', "Follow up with recipients if needed"),
              t('help.sharingTip4', "Keep reports secure and confidential"),
              t('help.sharingTip5', "Document when and with whom reports were shared")
            ]} />
          </SubSection>
        </Section>

        {/* Data Privacy and Security */}
        <Section icon={Shield} title={t('help.dataPrivacySecurity', 'Data Privacy and Security')}>
          <SubSection title={t('help.studentPrivacyProtection', 'Student Privacy Protection')}>
            <FeatureList features={[
              t('help.privacy1', "Never include full student names or IDs"),
              t('help.privacy2', "Use only first name and last initial"),
              t('help.privacy3', "Avoid including sensitive personal information"),
              t('help.privacy4', "All data is encrypted and securely stored"),
              t('help.privacy5', "Access is limited to authorized school personnel")
            ]} />
          </SubSection>

          <SubSection title={t('help.fileSecurity', 'File Security')}>
            <FeatureList features={[
              t('help.fileSec1', "Uploaded files are stored securely in cloud storage"),
              t('help.fileSec2', "Files are only accessible to the uploading teacher"),
              t('help.fileSec3', "Automatic deletion policies protect long-term privacy"),
              t('help.fileSec4', "Files are used only for generating better interventions")
            ]} />
          </SubSection>

          <SubSection title={t('help.emailSecurity', 'Email Security')}>
            <FeatureList features={[
              t('help.emailSec1', "Email credentials are encrypted and secure"),
              t('help.emailSec2', "Only you can access your email configuration"),
              t('help.emailSec3', "School administrators cannot view personal email settings"),
              t('help.emailSec4', "All email transmissions use secure protocols")
            ]} />
          </SubSection>
        </Section>

        {/* Contact and Support */}
        <Section icon={HelpCircle} title={t('help.gettingSupport', 'Getting Support')}>
          <SubSection title={t('help.whoToContact', 'Who to Contact')}>
            <FeatureList features={[
              t('help.contact1', "Technical issues: Contact your school's IT administrator"),
              t('help.contact2', "Account problems: Reach out to your designated school administrator"),
              t('help.contact3', "Usage questions: Refer to this help guide or ask colleagues"),
              t('help.contact4', "Feature requests: Submit through your school's feedback channels")
            ]} />
          </SubSection>

          <SubSection title={t('help.recentUpdates', 'Recent Updates and Improvements')}>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-medium text-green-800 mb-2">{t('help.latestEnhancements', 'Latest Enhancements')}:</p>
              <FeatureList features={[
                t('help.enhancement1', "Comprehensive mobile responsiveness improvements across all pages"),
                t('help.enhancement2', "Mobile-optimized CTA section with touch-friendly 56px buttons"),
                t('help.enhancement3', "Enhanced mobile navigation with collapsible menus"),
                t('help.enhancement4', "Mobile-first responsive breakpoints (sm, md, lg, xl)"),
                t('help.enhancement5', "Improved mobile text sizing and readability"),
                t('help.enhancement6', "Touch-friendly button designs with proper spacing"),
                t('help.enhancement7', "Mobile-specific content optimization for better user experience"),
                t('help.enhancement8', "Enhanced mobile landing page with shortened text for small screens")
              ]} />
            </div>
          </SubSection>

          <SubSection title={t('help.beforeContacting', 'Before Contacting Support')}>
            <StepList steps={[
              t('help.beforeStep1', "Check this help guide for solutions"),
              t('help.beforeStep2', "Try refreshing your browser or logging out/in"),
              t('help.beforeStep3', "Test your email configuration if having sharing issues"),
              t('help.beforeStep4', "Note any error messages exactly as they appear"),
              t('help.beforeStep5', "Be ready to describe what you were trying to do when the issue occurred")
            ]} />
          </SubSection>
        </Section>

        <div className="border-t border-gray-200 my-8"></div>
        
        <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-lg font-medium text-gray-900 mb-2">{t('help.thankYou', 'Thank you for using Concern2Care!')}</p>
          <p className="text-gray-600 text-sm">
            {t('help.dedication', 'Your dedication to student success makes a difference. This platform is designed to support you in providing the best possible interventions for your students.')}
          </p>
        </div>
      </div>
    </div>
  );
}