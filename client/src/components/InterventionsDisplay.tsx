import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle } from "lucide-react";

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
  const { data: concern, isLoading, error } = useQuery<any>({
    queryKey: ['/api/concerns', concernId],
  });

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
          AI-Generated Interventions
        </h4>
        <p className="text-blue-700 text-sm">Loading interventions...</p>
      </div>
    );
  }

  if (error || !concern) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
          AI-Generated Interventions
        </h4>
        <p className="text-blue-700 text-sm">
          Unable to load interventions. Please try again.
        </p>
      </div>
    );
  }

  if (!concern.interventions || concern.interventions.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
          AI-Generated Interventions
        </h4>
        <p className="text-blue-700 text-sm">
          No interventions have been generated for this concern yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
          {concern.taskType === 'differentiation' ? 'AI-Generated Differentiation Strategies' : 'AI-Generated Interventions'}
        </h4>
        
        <div className="space-y-4">
          {concern.interventions.map((intervention: any, index: number) => (
            <Card key={intervention.id} className="border-l-4 border-l-blue-500 bg-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {concern.taskType === 'differentiation' ? `Differentiation ${index + 1}` : `Intervention ${index + 1}`}
                    </Badge>
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
                
                <h5 className="font-semibold text-gray-900 mb-2">{intervention.title || 'Intervention Strategy'}</h5>
                
                {/* Full intervention description with professional formatting */}
                <div className="mb-4">
                  <div 
                    className="prose max-w-none text-sm text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: formatMarkdownText(intervention.description || 'No description available')
                    }}
                  />
                </div>

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
        </div>
      </div>
    </div>
  );
}