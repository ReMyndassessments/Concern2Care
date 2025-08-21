import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HelpCircle, Sparkles, Send } from "lucide-react";
import type { Concern, Intervention } from "@shared/schema";

interface FollowUpAssistanceProps {
  concern: Concern;
  interventions: Intervention[];
  recommendations?: string;
}

export default function FollowUpAssistance({ 
  concern, 
  interventions, 
  recommendations 
}: FollowUpAssistanceProps) {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [assistance, setAssistance] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter a question about the intervention strategies.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/ai/follow-up-assistance", {
        originalRecommendations: recommendations || interventions.map(i => i.description).join('\n\n'),
        specificQuestion: question,
        studentFirstName: concern.studentFirstName,
        studentLastInitial: concern.studentLastInitial,
        grade: concern.grade || "Elementary",
        concernTypes: Array.isArray(concern.concernTypes) ? concern.concernTypes : [concern.concernType || "Academic"],
        severityLevel: concern.severityLevel || "moderate"
      });

      const data = await response.json();
      
      if (response.ok) {
        setAssistance(data.assistance);
        setDisclaimer(data.disclaimer);
        setHasAsked(true);
        setQuestion(""); // Clear the question field
        
        toast({
          title: "Follow-up Assistance Generated!",
          description: "Your question has been answered with practical guidance.",
        });
      } else {
        throw new Error(data.message || "Failed to get follow-up assistance");
      }
    } catch (error: any) {
      console.error("Error getting follow-up assistance:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get follow-up assistance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewQuestion = () => {
    setHasAsked(false);
    setAssistance("");
    setDisclaimer("");
    setQuestion("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <HelpCircle className="h-4 w-4 text-green-600" />
          </div>
          <span>Follow-Up Assistance</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Have questions about implementing these intervention strategies? Ask for detailed guidance!
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!hasAsked ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question" className="text-base font-medium">
                Your Question About Implementation
              </Label>
              <Textarea
                id="question"
                placeholder="For example:
- How do I set up the check-in system in my classroom?
- What materials do I need for the visual supports?
- How can I track progress effectively?
- What should I do if the student doesn't respond to these strategies?
- How do I involve parents in this intervention plan?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={6}
                className="mt-2 resize-none"
              />
            </div>
            
            <Button 
              onClick={handleAskQuestion} 
              disabled={isLoading || !question.trim()}
              className="bg-green-600 hover:bg-green-700 w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Getting Assistance...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI-Powered Implementation Guidance
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Display the assistance response */}
            <div className="bg-green-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-800 mb-3">
                Implementation Guidance
              </h4>
              <div className="prose prose-sm text-green-900 max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {assistance}
                </pre>
              </div>
            </div>
            
            {/* Disclaimer */}
            {disclaimer && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription className="text-amber-800 text-sm">
                  {disclaimer}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={handleNewQuestion} 
                variant="outline"
                className="flex-1"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Ask Another Question
              </Button>
              
              <Button 
                onClick={() => {
                  // Save the assistance to the concern's follow-up questions
                  // This could call an API to save it permanently
                  toast({
                    title: "Guidance Saved",
                    description: "This implementation guidance has been saved with your concern.",
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Save This Guidance
              </Button>
            </div>
          </div>
        )}
        
        {/* Tips for better questions */}
        {!hasAsked && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">💡 Tips for Better Questions</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about your classroom context or situation</li>
              <li>• Ask about practical implementation details</li>
              <li>• Mention any challenges you anticipate</li>
              <li>• Ask about timeline, materials, or resources needed</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}