import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

// Function to format markdown-like text to HTML
function formatMarkdownText(text: string): string {
  if (!text) return '';
  
  return text
    // Convert **bold** and ***bold italic*** to HTML
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Convert ## Headers ## to HTML headers
    .replace(/###\s*(.*?)\s*###/g, '<h3 class="font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
    .replace(/##\s*(.*?)\s*##/g, '<h2 class="font-bold text-gray-900 mt-4 mb-2 text-lg">$1</h2>')
    .replace(/#\s*(.*?)\s*#/g, '<h1 class="font-bold text-gray-900 mt-4 mb-2 text-xl">$1</h1>')
    
    // Convert numbered lists
    .replace(/^\d+\.\s(.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
    
    // Convert bullet points
    .replace(/^[-*]\s(.+)$/gm, '<li class="ml-4 mb-1 list-disc">$1</li>')
    
    // Convert line breaks to proper HTML
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>')
    
    // Wrap in paragraph tags
    .replace(/^(.+)/, '<p class="mb-2">$1')
    .replace(/(.+)$/, '$1</p>');
}

interface InterventionsDisplayProps {
  concernId: string;
}

export default function InterventionsDisplay({ concernId }: InterventionsDisplayProps) {
  const { t } = useTranslation();
  const [showAllStrategies, setShowAllStrategies] = useState(false);
  const { data: concern, isLoading, error } = useQuery<any>({
    queryKey: ['/api/concerns', concernId],
  });

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
          {t('interventions.title', 'AI-Generated Interventions')}
        </h4>
        <p className="text-blue-700 text-sm">{t('interventions.loading', 'Loading interventions...')}</p>
      </div>
    );
  }

  if (error || !concern) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
          {t('interventions.title', 'AI-Generated Interventions')}
        </h4>
        <p className="text-blue-700 text-sm">
          {t('interventions.error', 'Unable to load interventions. Please try again.')}
        </p>
      </div>
    );
  }

  if (!concern.interventions || concern.interventions.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
          {t('interventions.title', 'AI-Generated Interventions')}
        </h4>
        <p className="text-blue-700 text-sm">
          {t('interventions.none', 'No interventions have been generated for this concern yet.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
          {t('results.title', 'Your Personalized Strategy Toolkit')}
        </h4>
        
        {/* Confidence Building Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-800 mb-1">
            {t('confidence.notAlone', 'You\'re not alone! 87% of teachers find student challenges complex.')}
          </p>
          <p className="text-xs text-green-700">
            {t('confidence.startSmall', 'Start small - even trying one strategy makes a difference.')}
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Progressive Disclosure: Show first 2 strategies, then option to expand */}
          {concern.interventions
            .slice(0, showAllStrategies ? concern.interventions.length : 2)
            .map((intervention: any, index: number) => (
            <Card key={intervention.id} className="border-l-4 border-l-blue-500 bg-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {concern.taskType === 'differentiation' ? `Strategy ${index + 1}` : `Strategy ${index + 1}`}
                    </Badge>
                    
                    {/* Difficulty Level Badge */}
                    {index === 0 ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {t('confidence.beginnerFriendly', '🌱 Beginner-friendly approach')}
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {t('confidence.advanced', '🎯 For experienced teachers')}
                      </Badge>
                    )}
                    
                    {/* Popular Choice */}
                    {index === 0 && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                        {t('confidence.popularChoice', 'Most teachers start here')}
                      </Badge>
                    )}
                    
                    {intervention.saved && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Saved
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {intervention.progressNotes && intervention.progressNotes.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {intervention.progressNotes.length} Note{intervention.progressNotes.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <h5 className="font-semibold text-gray-900 mb-2">{intervention.title || 'Learning Strategy'}</h5>
                
                {/* Full intervention description with professional formatting */}
                <div className="mb-4">
                  <div 
                    className="prose max-w-none text-sm text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: formatMarkdownText(intervention.description || 'No description available')
                    }}
                  />
                </div>

                {/* Educational Scaffolding - Why This Works */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <h6 className="font-medium text-yellow-900 mb-2 flex items-center text-sm">
                    💡 {t('confidence.whyThis', 'Why this works: Research shows...')}
                  </h6>
                  <p className="text-xs text-yellow-800 mb-2">
                    {index === 0 
                      ? "This approach builds on students' existing strengths while providing targeted support. Studies show that starting with familiar concepts increases confidence and engagement by 40%."
                      : "Advanced differentiation techniques like this address multiple learning modalities simultaneously, supporting diverse learning preferences and cognitive processing styles."
                    }
                  </p>
                  <div className="flex items-center text-xs text-yellow-700">
                    <span className="mr-2">{t('confidence.whatWorks', 'What works: Focus on one strategy at a time')}</span>
                  </div>
                </div>

                {/* Success Story */}
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

                {/* Display intervention steps if available */}
                {intervention.steps && Array.isArray(intervention.steps) && intervention.steps.length > 0 && (
                  <div className="mb-4">
                    <h6 className="font-medium text-gray-900 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Implementation Steps:
                    </h6>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <ol className="list-decimal list-inside space-y-1">
                        {intervention.steps.map((step: any, stepIndex: number) => (
                          <li key={stepIndex} className="text-sm text-gray-700">
                            {typeof step === 'string' ? step : JSON.stringify(step)}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {/* Timeline display */}
                {intervention.timeline && (
                  <div className="mb-3">
                    <Badge variant="outline" className="text-xs">
                      Timeline: {intervention.timeline}
                    </Badge>
                  </div>
                )}

                {/* Progress Notes Section */}
                {/* Progress notes temporarily disabled */}
              </CardContent>
            </Card>
          ))}
          
          {/* Progressive Disclosure Button */}
          {concern.interventions.length > 2 && (
            <div className="text-center pt-4">
              {!showAllStrategies ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 mb-2">
                      {t('confidence.learnAtPace', 'Learn at your own pace. Every step forward counts.')}
                    </p>
                    <p className="text-xs text-blue-700">
                      Ready to explore {concern.interventions.length - 2} more advanced strategies?
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllStrategies(true)}
                    className="w-full"
                  >
                    <ChevronDown className="h-4 w-4 mr-2" />
                    {t('confidence.deepDive', 'Deep Dive (15 min)')} - Show {concern.interventions.length - 2} More Strategies
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={() => setShowAllStrategies(false)}
                  className="text-blue-600"
                >
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Key Strategies Only
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}