import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpCircle, BookOpen, Sparkles, FileText, Users, Download, Mail, Play, ChevronRight, CheckCircle, AlertTriangle, Lightbulb, Target, Clock, Shield } from 'lucide-react';

export function TeacherHelpGuide() {
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const quickStartSteps = [
    {
      step: 1,
      title: "Create Your First Support Request",
      description: "Click 'New Support Request' to document a student concern",
      icon: FileText,
      color: "blue"
    },
    {
      step: 2,
      title: "Fill Out Student Information",
      description: "Enter the student's name, grade, and incident details",
      icon: Users,
      color: "purple"
    },
    {
      step: 3,
      title: "Generate AI Recommendations",
      description: "Get research-based intervention strategies instantly",
      icon: Sparkles,
      color: "pink"
    },
    {
      step: 4,
      title: "Save and Share",
      description: "Save your request and share with your support team",
      icon: Download,
      color: "green"
    }
  ];

  const helpTopics = [
    {
      id: "getting-started",
      title: "Getting Started",
      description: "Learn the basics of using Concern2Care",
      icon: Play,
      color: "blue",
      content: {
        overview: "Concern2Care helps you document student concerns and get AI-powered intervention recommendations. This guide will walk you through creating your first support request.",
        sections: [
          {
            title: "Creating Your First Support Request",
            content: [
              "Click the 'New Support Request' button from your dashboard",
              "Fill in the student information (first name, last initial, grade)",
              "Provide incident details including date, location, and concern types",
              "Write a detailed description of the concern or behavior",
              "Select the severity level (mild, moderate, or urgent)",
              "Note any actions you've already taken"
            ]
          },
          {
            title: "Understanding Concern Types",
            content: [
              "Academic: Learning difficulties, falling behind, comprehension issues",
              "Behavior: Disruptive behavior, non-compliance, aggression",
              "Social/Emotional: Anxiety, depression, withdrawal, mood changes",
              "Attendance: Frequent absences, tardiness, school avoidance",
              "Peer Relationships: Bullying, social isolation, conflict with peers",
              "Family/Home: Issues affecting school performance from home environment"
            ]
          }
        ]
      }
    },
    {
      id: "ai-recommendations",
      title: "AI Recommendations",
      description: "How to generate and use AI-powered interventions",
      icon: Sparkles,
      color: "purple",
      content: {
        overview: "Our AI system analyzes your student concern and generates research-based Tier 2 intervention recommendations tailored to the specific needs you've described.",
        sections: [
          {
            title: "Generating Recommendations",
            content: [
              "Complete all required fields in the support request form",
              "Click 'Generate AI Recommendations' to get instant suggestions",
              "Review the comprehensive intervention strategies provided",
              "Use the follow-up assistance feature for implementation help"
            ]
          },
          {
            title: "Understanding Recommendations",
            content: [
              "Assessment Summary: Analysis of the student's needs",
              "Immediate Interventions: Quick strategies for 1-2 weeks",
              "Short-term Strategies: Comprehensive interventions for 2-6 weeks",
              "Long-term Support: Sustained support strategies for 6+ weeks",
              "Progress Monitoring: How to track effectiveness",
              "When to Escalate: Clear indicators for referring to support team"
            ]
          },
          {
            title: "Follow-up Assistance",
            content: [
              "Ask specific questions about implementing interventions",
              "Get detailed step-by-step implementation guidance",
              "Receive troubleshooting tips for common challenges",
              "Learn about required materials and resources",
              "Understand realistic timelines for implementation"
            ]
          }
        ]
      }
    },
    {
      id: "meeting-preparation",
      title: "Meeting Preparation",
      description: "Prepare professional documents for support meetings",
      icon: Users,
      color: "green",
      content: {
        overview: "Concern2Care helps you create professional documentation for student support meetings, including PDF reports and email sharing capabilities.",
        sections: [
          {
            title: "Generating PDF Reports",
            content: [
              "Navigate to your support requests list",
              "Click the 'PDF' button for any saved support request",
              "The system generates a comprehensive meeting preparation document",
              "The PDF includes all student information, concerns, and AI recommendations",
              "Professional formatting suitable for sharing with administrators and support teams"
            ]
          },
          {
            title: "Sharing with Your Team",
            content: [
              "Use the 'Email' button to share support requests with colleagues",
              "Enter the recipient's email address and your name",
              "Add an optional message with additional context",
              "The system sends a formatted email with all relevant information",
              "Recipients receive a complete summary ready for meeting discussion"
            ]
          },
          {
            title: "Print-Friendly Options",
            content: [
              "Use the 'Print' button for immediate hard copy needs",
              "Optimized formatting for standard 8.5x11 paper",
              "Includes all essential information in a clean, readable format",
              "Perfect for bringing physical copies to meetings"
            ]
          }
        ]
      }
    },
    {
      id: "best-practices",
      title: "Best Practices",
      description: "Tips for effective student support documentation",
      icon: Target,
      color: "orange",
      content: {
        overview: "Follow these best practices to create effective support requests and get the most value from AI recommendations.",
        sections: [
          {
            title: "Writing Effective Concern Descriptions",
            content: [
              "Be specific and objective in your descriptions",
              "Include frequency and duration of behaviors",
              "Note environmental factors that may influence the behavior",
              "Describe the impact on learning and classroom environment",
              "Avoid subjective language; focus on observable behaviors",
              "Include any patterns you've noticed over time"
            ]
          },
          {
            title: "Choosing Appropriate Severity Levels",
            content: [
              "Mild: Classroom-level concerns that can be addressed with basic interventions",
              "Moderate: Concerns requiring Tier 2 interventions and possible team consultation",
              "Urgent: Immediate safety concerns or behaviors significantly impacting learning",
              "Consider the frequency, intensity, and duration of the concern",
              "Think about the impact on the student and other students"
            ]
          },
          {
            title: "Implementing AI Recommendations",
            content: [
              "Start with immediate interventions before moving to long-term strategies",
              "Implement one or two strategies at a time to avoid overwhelming the student",
              "Document your implementation efforts and student responses",
              "Use the follow-up assistance feature when you need implementation help",
              "Always consult with your support team before implementing complex interventions",
              "Monitor progress regularly and adjust strategies as needed"
            ]
          }
        ]
      }
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      description: "Common issues and solutions",
      icon: AlertTriangle,
      color: "red",
      content: {
        overview: "Find solutions to common issues you might encounter while using Concern2Care.",
        sections: [
          {
            title: "AI Recommendations Not Generating",
            content: [
              "Ensure all required fields are completed (marked with *)",
              "Check that you've selected at least one concern type",
              "Verify your internet connection is stable",
              "Try refreshing the page and filling out the form again",
              "If the issue persists, contact your administrator"
            ]
          },
          {
            title: "PDF Generation Issues",
            content: [
              "Make sure you have a saved support request with AI recommendations",
              "Check that your browser allows downloads from this site",
              "Try using a different browser if downloads aren't working",
              "Ensure you have sufficient storage space on your device",
              "Contact IT support if you continue having download issues"
            ]
          },
          {
            title: "Email Sharing Problems",
            content: [
              "Verify the recipient's email address is correct",
              "Check your internet connection",
              "Ensure all required fields (recipient email and your name) are filled",
              "Ask recipients to check their spam/junk folders",
              "Try sending to a different email address to test functionality"
            ]
          },
          {
            title: "Login and Access Issues",
            content: [
              "Verify you're using the correct email address and password",
              "Check if your subscription is still active",
              "Use the 'Forgot Password' link if you can't remember your password",
              "Contact your school administrator if you need account assistance",
              "Clear your browser cache and cookies if experiencing persistent issues"
            ]
          }
        ]
      }
    },
    {
      id: "privacy-security",
      title: "Privacy & Security",
      description: "How we protect student information",
      icon: Shield,
      color: "emerald",
      content: {
        overview: "Concern2Care takes student privacy and data security seriously. Learn about our protections and your responsibilities.",
        sections: [
          {
            title: "Data Protection",
            content: [
              "All student data is encrypted in transit and at rest",
              "We follow FERPA guidelines for educational records",
              "Access is limited to authorized school personnel only",
              "Regular security audits ensure system integrity",
              "Data is stored on secure, compliant servers"
            ]
          },
          {
            title: "Your Responsibilities",
            content: [
              "Only use first names and last initials for students",
              "Don't share login credentials with others",
              "Log out when finished using the system",
              "Only share support requests with authorized team members",
              "Report any suspected security issues immediately"
            ]
          },
          {
            title: "AI and Privacy",
            content: [
              "AI recommendations are generated without storing personal identifiers",
              "Student names are not included in AI processing",
              "All AI interactions are logged for quality assurance",
              "No student data is shared with third-party AI providers",
              "Recommendations are based on anonymized concern patterns"
            ]
          }
        ]
      }
    }
  ];

  const faqs = [
    {
      question: "How accurate are the AI recommendations?",
      answer: "Our AI recommendations are based on research-backed intervention strategies and educational best practices. However, they should always be reviewed by your school's support team and adapted to your specific student's needs."
    },
    {
      question: "Can I edit a support request after saving it?",
      answer: "Currently, support requests cannot be edited after saving. If you need to make changes, create a new support request with the updated information."
    },
    {
      question: "How many support requests can I create per month?",
      answer: "Your monthly limit depends on your school's subscription plan. You can see your current usage and limit in your dashboard. Contact your administrator if you need additional requests."
    },
    {
      question: "What if the AI recommendations don't seem appropriate?",
      answer: "AI recommendations are suggestions to discuss with your support team. Always use your professional judgment and consult with specialists before implementing any interventions."
    },
    {
      question: "Can I access my support requests from home?",
      answer: "Yes, Concern2Care is accessible from any internet-connected device. Your login credentials work from any location."
    },
    {
      question: "How long are support requests stored?",
      answer: "Support requests are stored according to your school's data retention policy. Contact your administrator for specific information about data retention periods."
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: { gradient: "from-blue-500 to-cyan-500", bg: "from-blue-50 to-cyan-50", text: "text-blue-700" },
      purple: { gradient: "from-purple-500 to-pink-500", bg: "from-purple-50 to-pink-50", text: "text-purple-700" },
      pink: { gradient: "from-pink-500 to-rose-500", bg: "from-pink-50 to-rose-50", text: "text-pink-700" },
      green: { gradient: "from-green-500 to-emerald-500", bg: "from-green-50 to-emerald-50", text: "text-green-700" },
      orange: { gradient: "from-orange-500 to-red-500", bg: "from-orange-50 to-red-50", text: "text-orange-700" },
      red: { gradient: "from-red-500 to-pink-500", bg: "from-red-50 to-pink-50", text: "text-red-700" },
      emerald: { gradient: "from-emerald-500 to-teal-500", bg: "from-emerald-50 to-teal-50", text: "text-emerald-700" }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const selectedTopic = helpTopics.find(topic => topic.id === selectedGuide);

  return (
    <div className="space-y-6">
      {/* Quick Start Guide */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-t-3xl">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <Play className="h-6 w-6" />
            </div>
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStartSteps.map((step) => {
              const Icon = step.icon;
              const colors = getColorClasses(step.color);
              return (
                <div key={step.step} className={`bg-gradient-to-br ${colors.bg} p-4 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${colors.gradient} rounded-xl flex items-center justify-center text-white font-bold text-sm`}>
                      {step.step}
                    </div>
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">{step.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Help Topics */}
      <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-t-3xl">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
            Help Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {helpTopics.map((topic) => {
              const Icon = topic.icon;
              const colors = getColorClasses(topic.color);
              return (
                <Dialog key={topic.id} open={selectedGuide === topic.id} onOpenChange={(open) => setSelectedGuide(open ? topic.id : null)}>
                  <DialogTrigger asChild>
                    <Card className={`border-0 bg-gradient-to-br ${colors.bg} shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${colors.gradient} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{topic.title}</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{topic.description}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-4xl rounded-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className={`w-10 h-10 bg-gradient-to-r ${colors.gradient} rounded-xl flex items-center justify-center`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        {topic.title}
                      </DialogTitle>
                      <DialogDescription className="text-base leading-relaxed">
                        {topic.content.overview}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 mt-6">
                      {topic.content.sections.map((section, index) => (
                        <div key={index} className={`bg-gradient-to-r ${colors.bg} p-4 rounded-2xl border border-gray-200`}>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CheckCircle className={`h-4 w-4 ${colors.text}`} />
                            {section.title}
                          </h4>
                          <ul className="space-y-2">
                            {section.content.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start gap-2 text-sm text-gray-700">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-t-3xl">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <HelpCircle className="h-6 w-6" />
            </div>
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-2xl border border-orange-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  {faq.question}
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed ml-6">{faq.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Reminders */}
      <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl">
        <Lightbulb className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Important Reminders:</strong>
          <br />
          • Always consult with your school's support team before implementing interventions
          • AI recommendations are suggestions to guide your professional judgment
          • Maintain student privacy by using only first names and last initials
          • Document your intervention attempts and student responses for future reference
        </AlertDescription>
      </Alert>

      {/* Contact Support */}
      <Card className="border-0 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-50 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-600 via-slate-600 to-gray-700 text-white rounded-t-3xl">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <Mail className="h-6 w-6" />
            </div>
            Need More Help?
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 mb-4">
            Can't find what you're looking for? Contact your school administrator or reach out to our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl">
              <Mail className="mr-2 h-4 w-4" />
              Contact Administrator
            </Button>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl">
              <HelpCircle className="mr-2 h-4 w-4" />
              Submit Feedback
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
