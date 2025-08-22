import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Concern {
  id: string;
  studentFirstName: string;
  studentLastInitial: string;
  grade: string;
  severityLevel: string;
  concernTypes: string[];
  description: string;
  createdAt: string;
}

interface MeetingPreparationData {
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  attendees: string[];
  selectedConcerns: string[];
  agenda: string;
  notes: string;
  includeRecommendations: boolean;
  includeProgressNotes: boolean;
  meetingType: 'IEP' | '504' | 'SST' | 'Parent Conference' | 'Other';
}

export function MeetingPreparation() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [meetingData, setMeetingData] = useState<MeetingPreparationData>({
    meetingTitle: '',
    meetingDate: '',
    meetingTime: '',
    attendees: [],
    selectedConcerns: [],
    agenda: '',
    notes: '',
    includeRecommendations: true,
    includeProgressNotes: false,
    meetingType: 'SST'
  });
  const [newAttendee, setNewAttendee] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadConcerns();
  }, []);

  const loadConcerns = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/concerns');
      setConcerns(response || []);
    } catch (error) {
      console.error('Error loading concerns:', error);
      toast({
        title: "Error",
        description: "Failed to load concerns for meeting preparation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttendee = () => {
    if (newAttendee.trim() && !meetingData.attendees.includes(newAttendee.trim())) {
      setMeetingData({
        ...meetingData,
        attendees: [...meetingData.attendees, newAttendee.trim()]
      });
      setNewAttendee('');
    }
  };

  const handleRemoveAttendee = (attendeeToRemove: string) => {
    setMeetingData({
      ...meetingData,
      attendees: meetingData.attendees.filter(attendee => attendee !== attendeeToRemove)
    });
  };

  const handleConcernSelection = (concernId: string, checked: boolean) => {
    if (checked) {
      setMeetingData({
        ...meetingData,
        selectedConcerns: [...meetingData.selectedConcerns, concernId]
      });
    } else {
      setMeetingData({
        ...meetingData,
        selectedConcerns: meetingData.selectedConcerns.filter(id => id !== concernId)
      });
    }
  };

  const generatePreview = () => {
    const selectedConcernsData = concerns.filter(c => meetingData.selectedConcerns.includes(c.id));
    
    const content = `
# ${meetingData.meetingTitle || 'Meeting Preparation Document'}

**Meeting Type:** ${meetingData.meetingType}
**Date:** ${meetingData.meetingDate ? new Date(meetingData.meetingDate).toLocaleDateString() : 'TBD'}
**Time:** ${meetingData.meetingTime || 'TBD'}

## Attendees
${meetingData.attendees.length > 0 ? meetingData.attendees.map(attendee => `- ${attendee}`).join('\\n') : '- No attendees added'}

## Agenda
${meetingData.agenda || 'No agenda specified'}

## Student Concerns to Discuss

${selectedConcernsData.length > 0 ? 
  selectedConcernsData.map(concern => `
### ${concern.studentFirstName} ${concern.studentLastInitial}. (Grade ${concern.grade})
- **Concern Types:** ${concern.concernTypes.join(', ')}
- **Severity:** ${concern.severityLevel}
- **Description:** ${concern.description}
- **Documented:** ${new Date(concern.createdAt).toLocaleDateString()}
`).join('\\n') : 
'No concerns selected for this meeting.'
}

## Meeting Notes
${meetingData.notes || 'No additional notes provided'}

---
*Document generated on ${new Date().toLocaleString()}*
    `;
    
    setPreviewContent(content);
    setIsPreviewOpen(true);
  };

  const generatePDF = async () => {
    try {
      setGeneratingPDF(true);
      
      // Validate required fields
      if (!meetingData.meetingTitle) {
        toast({
          title: "Missing Information",
          description: "Please provide a meeting title.",
          variant: "destructive",
        });
        return;
      }

      if (meetingData.selectedConcerns.length === 0) {
        toast({
          title: "No Concerns Selected",
          description: "Please select at least one concern to include in the meeting document.",
          variant: "destructive",
        });
        return;
      }

      // For now, we'll generate a simple text document
      // In a full implementation, this would call a PDF generation service
      const selectedConcernsData = concerns.filter(c => meetingData.selectedConcerns.includes(c.id));
      
      const documentContent = {
        title: meetingData.meetingTitle,
        meetingType: meetingData.meetingType,
        date: meetingData.meetingDate,
        time: meetingData.meetingTime,
        attendees: meetingData.attendees,
        agenda: meetingData.agenda,
        concerns: selectedConcernsData.map(concern => ({
          student: `${concern.studentFirstName} ${concern.studentLastInitial}.`,
          grade: concern.grade,
          concernTypes: concern.concernTypes,
          severity: concern.severityLevel,
          description: concern.description,
          dateCreated: concern.createdAt
        })),
        notes: meetingData.notes,
        includeRecommendations: meetingData.includeRecommendations,
        includeProgressNotes: meetingData.includeProgressNotes,
        generatedAt: new Date().toISOString()
      };

      // Create downloadable file
      const jsonContent = JSON.stringify(documentContent, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meeting-preparation-${meetingData.meetingTitle.replace(/\\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Meeting Document Generated",
        description: "Your meeting preparation document has been created and downloaded.",
      });
      
    } catch (error) {
      console.error('Error generating meeting document:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate meeting document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
      case 'severe':
        return 'bg-red-100 text-red-800';
      case 'medium':
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
      case 'mild':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-meeting-prep">
        <div className="text-center space-y-2">
          <Clock className="h-8 w-8 animate-pulse mx-auto" />
          <p>Loading concerns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="meeting-preparation">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meeting Preparation</h2>
          <p className="text-gray-600">Prepare comprehensive meeting documents with student concerns.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={generatePreview}
            disabled={meetingData.selectedConcerns.length === 0}
            data-testid="button-preview"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button 
            onClick={generatePDF}
            disabled={generatingPDF || meetingData.selectedConcerns.length === 0}
            data-testid="button-generate-pdf"
          >
            {generatingPDF ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate Document
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meeting Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card data-testid="meeting-details-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Meeting Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meetingTitle">Meeting Title*</Label>
                  <Input
                    id="meetingTitle"
                    value={meetingData.meetingTitle}
                    onChange={(e) => setMeetingData({...meetingData, meetingTitle: e.target.value})}
                    placeholder="e.g., IEP Team Meeting"
                    data-testid="input-meeting-title"
                  />
                </div>
                <div>
                  <Label htmlFor="meetingType">Meeting Type</Label>
                  <Select 
                    value={meetingData.meetingType} 
                    onValueChange={(value: typeof meetingData.meetingType) => 
                      setMeetingData({...meetingData, meetingType: value})
                    }
                  >
                    <SelectTrigger data-testid="select-meeting-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IEP">IEP Meeting</SelectItem>
                      <SelectItem value="504">504 Plan Meeting</SelectItem>
                      <SelectItem value="SST">Student Study Team</SelectItem>
                      <SelectItem value="Parent Conference">Parent Conference</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meetingDate">Date</Label>
                  <Input
                    id="meetingDate"
                    type="date"
                    value={meetingData.meetingDate}
                    onChange={(e) => setMeetingData({...meetingData, meetingDate: e.target.value})}
                    data-testid="input-meeting-date"
                  />
                </div>
                <div>
                  <Label htmlFor="meetingTime">Time</Label>
                  <Input
                    id="meetingTime"
                    type="time"
                    value={meetingData.meetingTime}
                    onChange={(e) => setMeetingData({...meetingData, meetingTime: e.target.value})}
                    data-testid="input-meeting-time"
                  />
                </div>
              </div>

              <div>
                <Label>Attendees</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newAttendee}
                    onChange={(e) => setNewAttendee(e.target.value)}
                    placeholder="Add attendee name"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddAttendee()}
                    data-testid="input-new-attendee"
                  />
                  <Button 
                    onClick={handleAddAttendee}
                    variant="outline"
                    disabled={!newAttendee.trim()}
                    data-testid="button-add-attendee"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {meetingData.attendees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2" data-testid="attendees-list">
                    {meetingData.attendees.map((attendee, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {attendee}
                        <button
                          onClick={() => handleRemoveAttendee(attendee)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-1"
                          data-testid={`button-remove-attendee-${index}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="agenda">Agenda</Label>
                <Textarea
                  id="agenda"
                  value={meetingData.agenda}
                  onChange={(e) => setMeetingData({...meetingData, agenda: e.target.value})}
                  placeholder="Meeting agenda and discussion topics..."
                  rows={3}
                  data-testid="textarea-agenda"
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={meetingData.notes}
                  onChange={(e) => setMeetingData({...meetingData, notes: e.target.value})}
                  placeholder="Any additional notes or preparation items..."
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeRecommendations"
                    checked={meetingData.includeRecommendations}
                    onCheckedChange={(checked) => 
                      setMeetingData({...meetingData, includeRecommendations: Boolean(checked)})
                    }
                    data-testid="checkbox-include-recommendations"
                  />
                  <Label htmlFor="includeRecommendations">Include AI Recommendations</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeProgressNotes"
                    checked={meetingData.includeProgressNotes}
                    onCheckedChange={(checked) => 
                      setMeetingData({...meetingData, includeProgressNotes: Boolean(checked)})
                    }
                    data-testid="checkbox-include-progress"
                  />
                  <Label htmlFor="includeProgressNotes">Include Progress Notes</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Concerns Selection */}
        <div className="space-y-6">
          <Card data-testid="concerns-selection-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Select Concerns
                <Badge variant="secondary">
                  {meetingData.selectedConcerns.length} selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {concerns.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No concerns available. Create some concerns first to prepare meeting documents.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3" data-testid="concerns-list">
                  {concerns.map((concern) => (
                    <div key={concern.id} className="border rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={meetingData.selectedConcerns.includes(concern.id)}
                          onCheckedChange={(checked) => 
                            handleConcernSelection(concern.id, Boolean(checked))
                          }
                          data-testid={`checkbox-concern-${concern.id}`}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">
                              {concern.studentFirstName} {concern.studentLastInitial}.
                            </div>
                            <Badge 
                              className={getSeverityColor(concern.severityLevel)}
                              data-testid={`badge-severity-${concern.id}`}
                            >
                              {concern.severityLevel}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Grade {concern.grade} • {concern.concernTypes.join(', ')}
                          </div>
                          <div className="text-sm text-gray-700 line-clamp-2">
                            {concern.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(concern.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {meetingData.selectedConcerns.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                  <div className="font-medium">Ready to Generate</div>
                  <div className="text-sm text-gray-600">
                    {meetingData.selectedConcerns.length} concern{meetingData.selectedConcerns.length !== 1 ? 's' : ''} selected for meeting
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="preview-dialog">
          <DialogHeader>
            <DialogTitle>Meeting Document Preview</DialogTitle>
            <DialogDescription>
              Review your meeting preparation document before generating the final version.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono" data-testid="preview-content">
              {previewContent}
            </pre>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsPreviewOpen(false)}
              data-testid="button-close-preview"
            >
              Close Preview
            </Button>
            <Button 
              onClick={() => {
                setIsPreviewOpen(false);
                generatePDF();
              }}
              data-testid="button-generate-from-preview"
            >
              <Download className="mr-2 h-4 w-4" />
              Generate Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}