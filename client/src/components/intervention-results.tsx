import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, Send, FileText, Share, ChevronRight, CheckCircle, Info } from "lucide-react";
import { Concern, Intervention, FollowUpQuestion } from "@shared/schema";
import EmailSharingModal from "./email-sharing-modal";

interface InterventionResultsProps {
  concern: Concern;
  interventions: Intervention[];
  showFollowUpQuestions?: boolean;
}

// Professional formatting component for AI recommendations
const FormattedRecommendations = ({ content }: { content: string }): React.ReactElement => {
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactElement[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Main headings (### **1. Assessment Summary**)
      if (line.match(/^###\s*\*\*(.*?)\*\*/)) {
        const title = line.replace(/^###\s*\*\*(.*?)\*\*/, '$1');
        elements.push(
          <h3 key={key++} className="text-lg font-bold text-gray-900 mt-6 mb-3 border-b border-gray-200 pb-2">
            {title}
          </h3>
        );
        continue;
      }

      // Sub-headings (* **Strategy: Safe Arrival**)
      if (line.match(/^\*\s*\*\*(.*?)\*\*/)) {
        const title = line.replace(/^\*\s*\*\*(.*?)\*\*/, '$1');
        elements.push(
          <h4 key={key++} className="text-md font-semibold text-blue-800 mt-4 mb-2">
            {title}
          </h4>
        );
        continue;
      }

      // Bold emphasis (** text **)
      if (line.match(/^\*\s*\*\*(.*?)\*\*:/)) {
        const title = line.replace(/^\*\s*\*\*(.*?)\*\*:/, '$1');
        elements.push(
          <p key={key++} className="font-medium text-gray-800 mt-3 mb-1">
            <strong>{title}:</strong>
          </p>
        );
        continue;
      }

      // Bullet points (* Implementation: text)
      if (line.startsWith('* ')) {
        const content = line.replace(/^\*\s*/, '');
        elements.push(
          <li key={key++} className="ml-4 mb-2 text-gray-700 list-disc">
            {content}
          </li>
        );
        continue;
      }

      // Separators (---)
      if (line === '---') {
        elements.push(
          <hr key={key++} className="my-6 border-gray-300" />
        );
        continue;
      }

      // Regular paragraphs
      if (line.length > 0) {
        elements.push(
          <p key={key++} className="text-gray-700 mb-3 leading-relaxed">
            {line}
          </p>
        );
      }
    }

    return elements;
  };

  return (
    <div className="space-y-2">
      {formatContent(content)}
    </div>
  );
};

export default function InterventionResults({ 
  concern, 
  interventions, 
  showFollowUpQuestions = false 
}: InterventionResultsProps) {
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { toast } = useToast();

  // Fetch existing follow-up questions if showing them
  const { data: existingQuestions } = useQuery<FollowUpQuestion[]>({
    queryKey: ["/api/concerns", concern.id, "questions"],
    enabled: showFollowUpQuestions,
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
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Question Answered",
        description: "AI has provided implementation guidance",
      });
      setFollowUpQuestion("");
      // The query will automatically refetch due to the success
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
      return await response.json();
    },
    onSuccess: (data: { downloadUrl: string }) => {
      toast({
        title: "Report Generated",
        description: "Your PDF report is ready for download",
      });
      
      // Trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = `concern-report-${concern.studentFirstName}-${concern.studentLastInitial}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-brand-green/10 rounded-lg flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-brand-green" />
            </div>
            <CardTitle>AI-Generated Intervention Strategies</CardTitle>
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Tier 2 Evidence-Based
            </Badge>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  Intervention strategies for {concern.studentFirstName} {concern.studentLastInitial}. - {(() => {
                    const concernTypes = concern.concernTypes as string[] | undefined;
                    const firstConcernType = concernTypes && Array.isArray(concernTypes) && concernTypes.length > 0 
                      ? concernTypes[0] 
                      : 'Academic';
                    return firstConcernType.charAt(0).toUpperCase() + firstConcernType.slice(1).replace('-', ' ');
                  })()} Concern
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Generated instantly | Research-based recommendations
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-6">
            {interventions.map((intervention, index) => (
              <Card key={intervention.id} className="border border-gray-200 hover:border-brand-blue/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-brand-blue text-white rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {intervention.title}
                      </h3>
                      <div className="prose prose-sm max-w-none mb-4">
                        <FormattedRecommendations content={intervention.description} />
                      </div>
                      
                      {intervention.steps && Array.isArray(intervention.steps) && (intervention.steps as string[]).length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Implementation Steps:</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {(intervention.steps as string[]).map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start space-x-2">
                                <ChevronRight className="h-4 w-4 text-brand-blue mt-0.5 flex-shrink-0" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Important Disclaimer */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-2">
                          <span className="text-yellow-600 font-semibold">⚠️</span>
                          <div>
                            <p className="text-sm font-semibold text-yellow-800 mb-1">IMPORTANT DISCLAIMER:</p>
                            <p className="text-sm text-yellow-700">
                              These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Research-Based
                        </Badge>
                        {intervention.timeline && (
                          <span className="text-xs text-gray-600">
                            Expected timeline: {intervention.timeline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Follow-up Questions Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Have Follow-Up Questions?</h3>
            <div className="flex space-x-4 mb-6">
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
                />
              </div>
              <Button 
                onClick={handleFollowUpSubmit}
                disabled={followUpMutation.isPending || !followUpQuestion.trim()}
                className="bg-brand-blue hover:bg-brand-dark-blue"
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
              <div className="space-y-4">
                <Separator />
                <h4 className="text-md font-medium text-gray-900">Previous Questions & Answers</h4>
                {existingQuestions.map((qa, index) => (
                  <div key={qa.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-3">
                      <span className="text-sm font-medium text-brand-blue">Q{index + 1}: </span>
                      <span className="text-sm text-gray-900">{qa.question}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">A: </span>
                      <p className="text-sm text-gray-700 mt-1">{qa.response}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
            <Button 
              onClick={handleGenerateReport}
              disabled={reportMutation.isPending}
              className="flex-1 bg-brand-blue hover:bg-brand-dark-blue"
            >
              {reportMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate PDF Report
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={handleShareReport}
              className="flex-1"
            >
              <Share className="h-4 w-4 mr-2" />
              Share with Staff
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Sharing Modal */}
      <EmailSharingModal 
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        concernId={concern.id}
        studentName={`${concern.studentFirstName} ${concern.studentLastInitial}.`}
      />
    </>
  );
}
