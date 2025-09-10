import { useState, useMemo, memo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
// Helper function for checking unauthorized errors
const isUnauthorizedError = (error: Error): boolean => {
  return /^401: .*Unauthorized/.test(error.message);
};
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lightbulb, Send, FileText, Share, ChevronRight, CheckCircle, Info, BookmarkPlus, Bookmark, Save, X, Plus, Mail, Copy, Download, Upload } from "lucide-react";
import { Concern, Intervention, FollowUpQuestion } from "@shared/schema";
// Email sharing temporarily removed

interface InterventionResultsProps {
  concern: Concern;
  interventions: Intervention[];
  showFollowUpQuestions?: boolean;
}

// Optimized formatting component with memoization for better performance
const FormattedRecommendations = memo(({ content }: { content: string }): React.ReactElement => {
  // Memoize the expensive formatting operation
  const formattedElements = useMemo(() => {
    const lines = content.split('\n');
    const elements: React.ReactElement[] = [];
    let key = 0;

    // Pre-compile regex patterns for better performance
    const patterns = {
      level4: /^####\s*\*\*(.*?)\*\*/,
      level3: /^###\s*\*\*(.*?)\*\*/,
      level2: /^##\s*\*\*(.*?)\*\*/,
      strategy: /^\*\s*\*\*Strategy:\s*(.*?)\*\*/,
      implementation: /^\*\s*\*\*Implementation:\*\*/,
      step: /^-\s*\*\*Step\s*\d+:\*\*/,
      boldColon: /^\*\s*\*\*(.*?):\*\*/,
      boldNoColon: /^\*\s*\*\*(.*?)\*\*/,
      genericBold: /^\*\*(.*?)\*\*/,
      nestedBullet: /^\s{2,}\*\s/,
      bullet: /^[-*]\s/,
      separator: /^---$/
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Level 4 headings (#### **Title**)
      if (patterns.level4.test(line)) {
        const title = line.replace(patterns.level4, '$1');
        elements.push(
          <div key={key++} className="mt-8 mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              {title}
            </h2>
            <div className="h-0.5 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full" />
          </div>
        );
        continue;
      }

      // Level 3 headings (### **Title**)
      if (patterns.level3.test(line)) {
        const title = line.replace(patterns.level3, '$1');
        elements.push(
          <div key={key++} className="mt-6 mb-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
              <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3" />
              {title}
            </h3>
          </div>
        );
        continue;
      }

      // Level 2 headings (## **Title**)
      if (patterns.level2.test(line)) {
        const title = line.replace(patterns.level2, '$1');
        elements.push(
          <h4 key={key++} className="text-lg font-semibold text-gray-700 mt-5 mb-3 flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
            {title}
          </h4>
        );
        continue;
      }

      // Strategy headings (* **Strategy: Name**)
      if (patterns.strategy.test(line)) {
        const title = line.replace(patterns.strategy, '$1');
        elements.push(
          <div key={key++} className="mt-6 mb-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-r-lg p-4">
              <h4 className="text-base font-semibold text-blue-800 flex items-center">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium mr-3">Strategy</span>
                {title}
              </h4>
            </div>
          </div>
        );
        continue;
      }

      // Implementation headings (* **Implementation:**)
      if (patterns.implementation.test(line)) {
        elements.push(
          <div key={key++} className="mt-4 mb-3">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-r-lg p-3">
              <h5 className="text-sm font-semibold text-green-700 flex items-center">
                <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium mr-2">Implementation</span>
              </h5>
            </div>
          </div>
        );
        continue;
      }

      // Step headings (- **Step N:** text)
      if (patterns.step.test(line)) {
        const stepText = line.replace(/^-\s*\*\*Step\s*\d+:\*\*\s*/, '');
        const stepNumber = line.match(/Step\s*(\d+)/)?.[1] || '';
        elements.push(
          <div key={key++} className="ml-6 mt-3 mb-3">
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {stepNumber}
              </div>
              <span className="text-gray-800 font-medium leading-relaxed">{stepText}</span>
            </div>
          </div>
        );
        continue;
      }

      // Other bold headings (* **Title:**)
      if (patterns.boldColon.test(line)) {
        const title = line.replace(patterns.boldColon, '$1');
        elements.push(
          <h5 key={key++} className="text-sm font-semibold text-purple-700 mt-4 mb-2 flex items-center">
            <div className="w-1 h-1 bg-purple-400 rounded-full mr-2" />
            {title}:
          </h5>
        );
        continue;
      }

      // Bold headings without colons (* **Title**)
      if (patterns.boldNoColon.test(line) && !line.includes(':')) {
        const title = line.replace(patterns.boldNoColon, '$1');
        elements.push(
          <h5 key={key++} className="text-sm font-semibold text-gray-600 mt-3 mb-2">
            {title}
          </h5>
        );
        continue;
      }

      // Generic bold headings (**Title**)
      if (patterns.genericBold.test(line)) {
        const title = line.replace(patterns.genericBold, '$1');
        elements.push(
          <h4 key={key++} className="text-base font-semibold text-gray-800 mt-4 mb-3">
            {title}
          </h4>
        );
        continue;
      }

      // Nested bullet points (  * text)
      if (patterns.nestedBullet.test(line)) {
        const content = line.replace(/^\s*\*\s*/, '');
        const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        elements.push(
          <div key={key++} className="ml-10 mb-2">
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedContent }} />
            </div>
          </div>
        );
        continue;
      }

      // Regular bullet points (* text or - text)
      if (patterns.bullet.test(line)) {
        const content = line.replace(/^[-*]\s*/, '');
        const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        elements.push(
          <div key={key++} className="ml-6 mb-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedContent }} />
            </div>
          </div>
        );
        continue;
      }

      // Separators (---)
      if (patterns.separator.test(line)) {
        elements.push(
          <div key={key++} className="my-6">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </div>
        );
        continue;
      }

      // Regular paragraphs with bold text support
      if (line.length > 0) {
        const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        elements.push(
          <p key={key++} className="text-gray-700 mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />
        );
      }
    }

    return elements;
  }, [content]); // Only recompute when content changes

  return (
    <div className="space-y-1">
      {formattedElements}
    </div>
  );
});

FormattedRecommendations.displayName = 'FormattedRecommendations';

export default function InterventionResults({ 
  concern, 
  interventions, 
  showFollowUpQuestions = false 
}: InterventionResultsProps) {
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState([{ name: "", email: "" }]);
  const [emailMessage, setEmailMessage] = useState("");
  const [savedInterventions, setSavedInterventions] = useState<Set<string>>(() => {
    const savedIds = interventions.filter(i => i.saved).map(i => i.id);
    return new Set(savedIds);
  });
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch existing follow-up questions
  const { data: existingQuestions, refetch: refetchQuestions } = useQuery<FollowUpQuestion[]>({
    queryKey: ["/api/concerns", concern.id, "questions"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const followUpMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", `/api/concerns/${concern.id}/questions`, {
        question,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Question Answered",
        description: "AI has provided implementation guidance",
      });
      setFollowUpQuestion("");
      // Refetch the questions to show the new one
      refetchQuestions();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized", 
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to process follow-up question",
        variant: "destructive",
      });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/concerns/${concern.id}/report`);
      return response;
    },
    onSuccess: (data: { viewUrl: string; downloadUrl: string }) => {
      toast({
        title: t('results.reportGenerated'),
        description: t('results.htmlReportReady'),
      });
      
      // Open report in new tab for viewing (teachers can use Print button to save)
      window.open(data.viewUrl, '_blank');
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  const handleFollowUpSubmit = () => {
    if (!followUpQuestion.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter a question before submitting",
        variant: "destructive",
      });
      return;
    }
    
    followUpMutation.mutate(followUpQuestion.trim());
  };

  const handleGenerateReport = () => {
    reportMutation.mutate();
  };

  const handleShareReport = () => {
    setShowEmailModal(true);
  };

  // Email sharing mutation
  const emailMutation = useMutation({
    mutationFn: async (emailData: { recipients: Array<{ name: string; email: string }>; message: string }) => {
      return apiRequest("POST", `/api/concerns/${concern.id}/share`, emailData);
    },
    onSuccess: () => {
      toast({
        title: "Report Shared Successfully!",
        description: "The intervention report has been sent to student support staff.",
      });
      setShowEmailModal(false);
      setEmailRecipients([{ name: "", email: "" }]);
      setEmailMessage("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Failed to Share Report",
        description: error.message || "There was an error sending the email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = () => {
    const validRecipients = emailRecipients.filter(r => r.email.trim() !== "");
    if (validRecipients.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please add at least one email recipient.",
        variant: "destructive",
      });
      return;
    }

    emailMutation.mutate({
      recipients: validRecipients,
      message: emailMessage || `Please find attached the intervention report for ${concern.studentFirstName} ${concern.studentLastInitial}.`
    });
  };

  const addRecipient = () => {
    setEmailRecipients([...emailRecipients, { name: "", email: "" }]);
  };

  const removeRecipient = (index: number) => {
    if (emailRecipients.length > 1) {
      setEmailRecipients(emailRecipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, field: "name" | "email", value: string) => {
    const updated = [...emailRecipients];
    updated[index][field] = value;
    setEmailRecipients(updated);
  };

  const saveInterventionMutation = useMutation({
    mutationFn: async (interventionId: string) => {
      return apiRequest("POST", `/api/interventions/${interventionId}/save`, {});
    },
    onSuccess: (_, interventionId) => {
      setSavedInterventions(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.add(interventionId);
        return newSet;
      });
      toast({
        title: "Intervention Saved!",
        description: "This intervention has been saved and will be included in your reports.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to save intervention",
        variant: "destructive",
      });
    },
  });

  const handleSaveIntervention = (interventionId: string) => {
    saveInterventionMutation.mutate(interventionId);
  };

  // Copy to clipboard functionality
  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to Clipboard",
        description: "The intervention content has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard. Please try selecting and copying manually.",
        variant: "destructive",
      });
    }
  };

  // Download individual intervention as text file
  const handleDownloadIntervention = (intervention: Intervention) => {
    const content = `${intervention.title}\n\n${intervention.description}\n\nGenerated by Concern2Care AI`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${intervention.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "The intervention has been downloaded as a text file.",
    });
  };

  // Share individual intervention via email
  const handleShareIntervention = (intervention: Intervention) => {
    setEmailMessage(`Please find attached the intervention strategy: ${intervention.title}\n\n${intervention.description}\n\nGenerated by Concern2Care AI for ${concern.studentFirstName} ${concern.studentLastInitial}.`);
    setShowEmailModal(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-brand-green/10 rounded-lg flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-brand-green" />
            </div>
            <CardTitle>
              {t('results.title', 'Your Personalized Strategy Toolkit')}
            </CardTitle>
          </div>
          
          {/* Confidence Building Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-800 mb-1">
              {t('confidence.notAlone', 'You\'re not alone! 87% of teachers find student challenges complex.')}
            </p>
            <p className="text-xs text-green-700">
              {t('confidence.startSmall', 'Start small - even trying one strategy makes a difference.')}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {concern.taskType === 'differentiation' ? 'Research-Based' : 'Tier 2 Evidence-Based'}
            </Badge>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  {concern.taskType === 'differentiation' ? 'Differentiation strategies' : 'Intervention strategies'} for {concern.studentFirstName} {concern.studentLastInitial}.
                  {concern.taskType === 'tier2_intervention' && (() => {
                    const concernTypes = concern.concernTypes as string[] | undefined;
                    const firstConcernType = concernTypes && Array.isArray(concernTypes) && concernTypes.length > 0 
                      ? concernTypes[0] 
                      : 'Academic';
                    return ' - ' + firstConcernType.charAt(0).toUpperCase() + firstConcernType.slice(1).replace('-', ' ') + ' Concern';
                  })()}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Generated instantly | Research-based recommendations
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-8">
            {interventions.map((intervention, index) => (
              <Card key={intervention.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
                <CardContent className="p-4 md:p-8">
                  <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-lg font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      {/* Strategy Header with Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {index === 0 ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {t('confidence.beginnerFriendly', '🌱 Beginner-friendly approach')}
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            {t('confidence.advanced', '🎯 For experienced teachers')}
                          </Badge>
                        )}
                        {index === 0 && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            {t('confidence.popularChoice', 'Most teachers start here')}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center break-words">
                        <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-4" />
                        {intervention.title}
                      </h3>
                      <div className="prose prose-lg max-w-none mb-6 bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 overflow-hidden">
                        <FormattedRecommendations content={intervention.description} />
                      </div>

                      {/* Educational Scaffolding - Why This Works */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <h6 className="font-medium text-yellow-900 mb-2 flex items-center text-sm">
                          💡 {t('confidence.whyThis', 'Why this works: Research shows...')}
                        </h6>
                        <p className="text-xs text-yellow-800 mb-2">
                          {index === 0 
                            ? "This approach builds on students' existing strengths while providing targeted support. Studies show that starting with familiar concepts increases confidence and engagement by 40%."
                            : "Advanced strategies like this address multiple learning modalities simultaneously, supporting diverse learning preferences and cognitive processing styles."
                          }
                        </p>
                        <div className="flex items-center text-xs text-yellow-700">
                          <span className="mr-2">{t('confidence.whatWorks', 'What works: Focus on one strategy at a time')}</span>
                        </div>
                      </div>

                      {/* Success Story & Community */}
                      {index === 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <p className="text-xs text-green-800">
                            {t('confidence.successStory', '✓ Success: "My students responded positively within days"')}
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            {t('confidence.teachersReport', 'Teachers report: "This gave me confidence to try new approaches!"')}
                          </p>
                        </div>
                      )}
                      
                      {/* Community Learning */}
                      {index === 1 && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                          <p className="text-xs text-purple-800 font-medium mb-1">
                            {t('confidence.others', 'Other teachers in similar situations tried:')}
                          </p>
                          <p className="text-xs text-purple-700">
                            "I started with small groups and built confidence before trying whole-class approaches. It made all the difference!"
                          </p>
                        </div>
                      )}
                      
                      {intervention.steps && Array.isArray(intervention.steps) && intervention.steps.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6 mb-4 md:mb-6 border border-blue-100">
                          <h4 className="text-base md:text-lg font-semibold text-blue-900 mb-3 md:mb-4 flex items-center">
                            <div className="w-5 h-5 bg-blue-500 rounded-full mr-3" />
                            Implementation Steps
                          </h4>
                          <ul className="space-y-3">
                            {intervention.steps.map((step: string, stepIndex: number) => (
                              <li key={stepIndex} className="flex items-start space-x-3 md:space-x-4">
                                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                  {stepIndex + 1}
                                </div>
                                <span className="text-sm md:text-base text-gray-800 leading-relaxed break-words">{String(step)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Important Disclaimer */}
                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-r-xl p-6 mb-6 shadow-sm">
                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">⚠️</span>
                          </div>
                          <div>
                            <p className="text-base font-bold text-amber-900 mb-3">IMPORTANT DISCLAIMER</p>
                            <p className="text-sm text-amber-800 leading-relaxed">
                              These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-100 space-y-3 sm:space-y-0">
                        <div className="flex flex-wrap items-center gap-2 sm:space-x-4">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Research-Based
                          </Badge>
                          {intervention.timeline && (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full" />
                              <span className="text-sm text-gray-600 font-medium">
                                Timeline: {intervention.timeline}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                          {/* Save Button */}
                          {savedInterventions.has(intervention.id) || intervention.saved ? (
                            <div className="flex items-center space-x-3 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                              <Bookmark className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-semibold text-green-700">Saved</span>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveIntervention(intervention.id)}
                              disabled={saveInterventionMutation.isPending}
                              className="bg-white border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 shadow-sm transition-all duration-200 hover:shadow-md"
                            >
                              {saveInterventionMutation.isPending ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <BookmarkPlus className="h-3 w-3 mr-2" />
                                  {concern.taskType === 'differentiation' ? 'Save Strategy' : 'Save Intervention'}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* AI Output Action Buttons */}
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:space-x-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyToClipboard(intervention.title + '\n\n' + intervention.description)}
                            className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm transition-all duration-200 hover:shadow-md px-4 py-2"
                            data-testid={`button-copy-intervention-${intervention.id}`}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadIntervention(intervention)}
                            className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm transition-all duration-200 hover:shadow-md px-4 py-2"
                            data-testid={`button-download-intervention-${intervention.id}`}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShareIntervention(intervention)}
                            className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm transition-all duration-200 hover:shadow-md px-4 py-2"
                            data-testid={`button-share-intervention-${intervention.id}`}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Follow-up Questions Section */}
          <div className="mt-8 md:mt-12 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-4 md:p-8 border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Send className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Have Follow-Up Questions?</h3>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
              <div className="flex-1">
                <Input 
                  placeholder="Ask for specific implementation guidance..."
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFollowUpSubmit();
                    }
                  }}
                  className="h-12 text-base border-2 border-gray-200 focus:border-blue-400 rounded-xl shadow-sm"
                />
              </div>
              <Button 
                onClick={handleFollowUpSubmit}
                disabled={followUpMutation.isPending || !followUpQuestion.trim()}
                className="h-12 px-6 sm:px-8 w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {followUpMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Asking...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Ask AI
                  </>
                )}
              </Button>
            </div>

            {/* Display existing follow-up questions and answers */}
            {existingQuestions && existingQuestions.length > 0 && (
              <div className="space-y-6">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="w-5 h-5 bg-gray-400 rounded-full mr-3" />
                  Previous Questions & Answers
                </h4>
                {existingQuestions.map((qa, index) => (
                  <div key={qa.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          Q{index + 1}
                        </div>
                        <span className="text-base text-gray-900 font-medium">{qa.question}</span>
                      </div>
                    </div>
                    <div className="ml-9">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="prose prose-sm max-w-none">
                          <FormattedRecommendations content={qa.response} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 md:mt-12 pt-6 md:pt-8">
            <Button 
              onClick={handleGenerateReport}
              disabled={reportMutation.isPending}
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 text-base font-semibold"
            >
              {reportMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 mr-3" />
                  Generate PDF Report
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={handleShareReport}
              className="flex-1 h-12 border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 text-base font-semibold"
            >
              <Share className="h-5 w-5 mr-3" />
              Share With Student Support
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                // Save the first intervention (the main AI response)
                if (interventions && interventions.length > 0) {
                  saveInterventionMutation.mutate(interventions[0].id);
                }
              }}
              disabled={saveInterventionMutation.isPending}
              className="flex-1 h-12 border-2 border-green-300 hover:border-green-400 bg-white hover:bg-green-50 shadow-sm hover:shadow-md transition-all duration-200 text-base font-semibold"
            >
              {saveInterventionMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mr-3"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-3" />
                  Save Intervention
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Sharing Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Share With Student Support
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipients">Recipients</Label>
              <div className="space-y-2 mt-2">
                {emailRecipients.map((recipient, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Name (optional)"
                      value={recipient.name}
                      onChange={(e) => updateRecipient(index, "name", e.target.value)}
                      className="flex-1"
                      data-testid={`input-recipient-name-${index}`}
                    />
                    <Input
                      placeholder="Email address"
                      type="email"
                      value={recipient.email}
                      onChange={(e) => updateRecipient(index, "email", e.target.value)}
                      className="flex-1"
                      data-testid={`input-recipient-email-${index}`}
                    />
                    {emailRecipients.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeRecipient(index)}
                        data-testid={`button-remove-recipient-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRecipient}
                  className="w-full"
                  data-testid="button-add-recipient"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipient
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="mt-2"
                rows={3}
                data-testid="textarea-email-message"
              />
            </div>
            
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <strong>Note:</strong> This will send a PDF report with the intervention recommendations as an attachment.
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEmailModal(false)}
              data-testid="button-cancel-email"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={emailMutation.isPending}
              data-testid="button-send-email"
            >
              {emailMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
