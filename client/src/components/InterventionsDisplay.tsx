import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, Edit2, Trash2, MessageSquare } from "lucide-react";
import { InterventionWithProgressNotes } from "@shared/schema";
import ProgressNotesSection from "@/components/ProgressNotesSection";

interface InterventionsDisplayProps {
  concernId: string;
}

export default function InterventionsDisplay({ concernId }: InterventionsDisplayProps) {
  const { data: concern, isLoading } = useQuery<any>({
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

  if (!concern?.interventions || concern.interventions.length === 0) {
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
          AI-Generated Interventions
        </h4>
        
        <div className="space-y-4">
          {concern.interventions.map((intervention: InterventionWithProgressNotes, index: number) => (
            <Card key={intervention.id} className="border-l-4 border-l-blue-500 bg-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      Strategy {index + 1}
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
                
                <h5 className="font-semibold text-gray-900 mb-2">{intervention.title}</h5>
                
                <div className="text-sm text-gray-700 mb-3">
                  <div className="line-clamp-3">{intervention.description}</div>
                </div>

                {intervention.timeline && (
                  <div className="mb-3">
                    <Badge variant="outline" className="text-xs">
                      Timeline: {intervention.timeline}
                    </Badge>
                  </div>
                )}

                {/* Progress Notes Section */}
                <ProgressNotesSection 
                  intervention={intervention} 
                  isCompact={true} 
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}