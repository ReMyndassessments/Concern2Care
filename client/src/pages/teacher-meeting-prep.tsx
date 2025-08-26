import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Eye,
  ArrowLeft,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link } from "wouter";
import AppHeader from '@/components/app-header';

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

export default function TeacherMeetingPrep() {
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
    meetingType: 'Parent Conference'
  });
  const [newAttendee, setNewAttendee] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
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
      // Error loading concerns - handled by user feedback
      toast({
        title: "Error",
        description: "Failed to load your concerns for meeting preparation.",
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

  const handleStudentSelection = (studentKey: string, checked: boolean) => {
    const studentConcerns = groupedConcerns[studentKey].map(concern => concern.id);
    
    if (checked) {
      // Add all concerns for this student
      const newSelectedConcerns = Array.from(new Set([...meetingData.selectedConcerns, ...studentConcerns]));
      setMeetingData({
        ...meetingData,
        selectedConcerns: newSelectedConcerns
      });
    } else {
      // Remove all concerns for this student
      setMeetingData({
        ...meetingData,
        selectedConcerns: meetingData.selectedConcerns.filter(id => !studentConcerns.includes(id))
      });
    }
  };

  // Group concerns by student
  const groupedConcerns = concerns.reduce((groups, concern) => {
    const studentKey = `${concern.studentFirstName} ${concern.studentLastInitial}`;
    if (!groups[studentKey]) {
      groups[studentKey] = [];
    }
    groups[studentKey].push(concern);
    return groups;
  }, {} as Record<string, typeof concerns>);

  // Helper function to check if all concerns for a student are selected
  const isStudentFullySelected = (studentKey: string) => {
    const studentConcerns = groupedConcerns[studentKey];
    return studentConcerns.every(concern => meetingData.selectedConcerns.includes(concern.id));
  };

  // Helper function to check if some (but not all) concerns for a student are selected
  const isStudentPartiallySelected = (studentKey: string) => {
    const studentConcerns = groupedConcerns[studentKey];
    const selectedCount = studentConcerns.filter(concern => meetingData.selectedConcerns.includes(concern.id)).length;
    return selectedCount > 0 && selectedCount < studentConcerns.length;
  };

  const toggleStudentExpansion = (studentKey: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentKey)) {
      newExpanded.delete(studentKey);
    } else {
      newExpanded.add(studentKey);
    }
    setExpandedStudents(newExpanded);
  };

  const generatePreview = () => {
    const selectedConcernData = concerns.filter(concern => 
      meetingData.selectedConcerns.includes(concern.id)
    );

    let preview = `MEETING PREPARATION DOCUMENT\n\n`;
    preview += `Meeting Title: ${meetingData.meetingTitle}\n`;
    preview += `Meeting Type: ${meetingData.meetingType}\n`;
    preview += `Date: ${meetingData.meetingDate}\n`;
    preview += `Time: ${meetingData.meetingTime}\n\n`;
    
    if (meetingData.attendees.length > 0) {
      preview += `ATTENDEES:\n`;
      meetingData.attendees.forEach(attendee => {
        preview += `• ${attendee}\n`;
      });
      preview += `\n`;
    }

    if (meetingData.agenda) {
      preview += `AGENDA:\n${meetingData.agenda}\n\n`;
    }

    if (selectedConcernData.length > 0) {
      preview += `STUDENT CONCERNS TO DISCUSS:\n\n`;
      selectedConcernData.forEach((concern, index) => {
        preview += `${index + 1}. Student: ${concern.studentFirstName} ${concern.studentLastInitial}.\n`;
        preview += `   Grade: ${concern.grade}\n`;
        preview += `   Concern Types: ${concern.concernTypes.join(', ')}\n`;
        preview += `   Severity: ${concern.severityLevel}\n`;
        preview += `   Description: ${concern.description}\n`;
        preview += `   Date Documented: ${new Date(concern.createdAt).toLocaleDateString()}\n\n`;
      });
    }

    if (meetingData.notes) {
      preview += `ADDITIONAL NOTES:\n${meetingData.notes}\n\n`;
    }

    preview += `Document generated on: ${new Date().toLocaleDateString()}\n`;

    setPreviewContent(preview);
    setIsPreviewOpen(true);
  };

  const generateMeetingDocument = async () => {
    try {
      setGeneratingPDF(true);
      
      // Make the API request but handle it differently since it returns a PDF directly
      const response = await fetch('/api/meeting-preparation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ meetingData })
      });

      if (response.ok) {
        // Get the PDF blob from the response
        const pdfBlob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `meeting-prep-${meetingData.meetingTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${meetingData.meetingDate}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "Meeting preparation document has been generated and downloaded.",
        });
      } else {
        throw new Error('Failed to generate document');
      }
    } catch (error) {
      // Error generating meeting preparation document
      toast({
        title: "Error",
        description: "Failed to generate meeting preparation document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const isFormValid = () => {
    return meetingData.meetingTitle && 
           meetingData.meetingDate && 
           meetingData.meetingTime && 
           meetingData.meetingType;
  };

  const getMeetingTypeOptions = () => [
    { value: 'Parent Conference', label: 'Parent Conference' },
    { value: 'IEP', label: 'IEP Team Meeting' },
    { value: '504', label: '504 Plan Meeting' },
    { value: 'SST', label: 'Student Study Team' },
    { value: 'Other', label: 'Other Meeting' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <AppHeader />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Meeting Preparation
          </h1>
          <p className="text-lg text-gray-600">
            Prepare comprehensive meeting documents with student concerns
          </p>
        </div>

        {/* Meeting Details Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Meeting Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meetingTitle">Meeting Title *</Label>
                <Input
                  id="meetingTitle"
                  placeholder="e.g., IEP Team Meeting"
                  value={meetingData.meetingTitle}
                  onChange={(e) => setMeetingData({...meetingData, meetingTitle: e.target.value})}
                  data-testid="input-meeting-title"
                />
              </div>
              <div>
                <Label htmlFor="meetingType">Meeting Type *</Label>
                <Select value={meetingData.meetingType} onValueChange={(value: any) => setMeetingData({...meetingData, meetingType: value})}>
                  <SelectTrigger data-testid="select-meeting-type">
                    <SelectValue placeholder="Select meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMeetingTypeOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meetingDate">Date *</Label>
                <Input
                  id="meetingDate"
                  type="date"
                  value={meetingData.meetingDate}
                  onChange={(e) => setMeetingData({...meetingData, meetingDate: e.target.value})}
                  data-testid="input-meeting-date"
                />
              </div>
              <div>
                <Label htmlFor="meetingTime">Time *</Label>
                <Input
                  id="meetingTime"
                  type="time"
                  value={meetingData.meetingTime}
                  onChange={(e) => setMeetingData({...meetingData, meetingTime: e.target.value})}
                  data-testid="input-meeting-time"
                />
              </div>
            </div>

            {/* Attendees Section */}
            <div>
              <Label>Attendees</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add attendee name"
                  value={newAttendee}
                  onChange={(e) => setNewAttendee(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAttendee()}
                  data-testid="input-new-attendee"
                />
                <Button onClick={handleAddAttendee} type="button" data-testid="button-add-attendee">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {meetingData.attendees.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {meetingData.attendees.map((attendee) => (
                    <Badge key={attendee} variant="secondary" className="flex items-center gap-2">
                      {attendee}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttendee(attendee)}
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        data-testid={`button-remove-${attendee}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student Concerns Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Students & Concerns to Discuss
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Choose entire students (all their concerns) or individual concerns to include in your meeting preparation.
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-gray-500">Loading your concerns...</p>
            ) : concerns.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You haven't documented any student concerns yet. 
                  <Link href="/" className="text-blue-600 hover:underline ml-1">
                    Create your first concern
                  </Link> to include in meeting preparation.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedConcerns).map(([studentKey, studentConcerns]) => {
                  const firstConcern = studentConcerns[0];
                  const isFullySelected = isStudentFullySelected(studentKey);
                  const isPartiallySelected = isStudentPartiallySelected(studentKey);
                  
                  return (
                    <div key={studentKey} className="border rounded-lg p-4">
                      {/* Student Header */}
                      <div className="flex items-start space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={isFullySelected}
                            ref={(el) => {
                              if (el && el instanceof HTMLInputElement) {
                                el.indeterminate = isPartiallySelected;
                              }
                            }}
                            onCheckedChange={(checked) => handleStudentSelection(studentKey, Boolean(checked))}
                            data-testid={`checkbox-student-${studentKey.replace(/\s+/g, '-')}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStudentExpansion(studentKey)}
                            className="h-6 w-6 p-0"
                            data-testid={`button-toggle-${studentKey.replace(/\s+/g, '-')}`}
                          >
                            {expandedStudents.has(studentKey) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg text-gray-900">
                              {studentKey}.
                            </span>
                            <Badge variant="outline">Grade {firstConcern.grade}</Badge>
                            <Badge variant="secondary" className="text-xs">
                              {studentConcerns.length} concern{studentConcerns.length !== 1 ? 's' : ''}
                            </Badge>
                            {!expandedStudents.has(studentKey) && (
                              <span className="text-xs text-gray-500">
                                {meetingData.selectedConcerns.filter(id => studentConcerns.map(c => c.id).includes(id)).length} of {studentConcerns.length} selected
                              </span>
                            )}
                          </div>
                          {expandedStudents.has(studentKey) && (
                            <p className="text-sm text-gray-600">
                              Select all concerns for this student to include in meeting
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Individual Concerns for this Student - Collapsible */}
                      {expandedStudents.has(studentKey) && (
                        <div className="ml-8 space-y-3 border-l-2 border-gray-100 pl-4">
                          {studentConcerns.map((concern) => (
                            <div key={concern.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                              <Checkbox
                                checked={meetingData.selectedConcerns.includes(concern.id)}
                                onCheckedChange={(checked) => handleConcernSelection(concern.id, Boolean(checked))}
                                data-testid={`checkbox-concern-${concern.id}`}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={concern.severityLevel === 'High' ? 'destructive' : concern.severityLevel === 'Medium' ? 'default' : 'secondary'}>
                                    {concern.severityLevel}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(concern.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-1 font-medium">
                                  {concern.concernTypes.join(', ')}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {concern.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meeting Agenda and Notes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Meeting Agenda & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="agenda">Meeting Agenda</Label>
              <Textarea
                id="agenda"
                placeholder="Outline the meeting agenda and discussion points..."
                value={meetingData.agenda}
                onChange={(e) => setMeetingData({...meetingData, agenda: e.target.value})}
                rows={4}
                data-testid="textarea-agenda"
              />
            </div>
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes or important information..."
                value={meetingData.notes}
                onChange={(e) => setMeetingData({...meetingData, notes: e.target.value})}
                rows={4}
                data-testid="textarea-notes"
              />
            </div>

            <div className="space-y-3">
              <Label>Document Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={meetingData.includeRecommendations}
                    onCheckedChange={(checked) => setMeetingData({...meetingData, includeRecommendations: Boolean(checked)})}
                    data-testid="checkbox-include-recommendations"
                  />
                  <Label className="text-sm">Include intervention recommendations</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={meetingData.includeProgressNotes}
                    onCheckedChange={(checked) => setMeetingData({...meetingData, includeProgressNotes: Boolean(checked)})}
                    data-testid="checkbox-include-progress"
                  />
                  <Label className="text-sm">Include progress notes section</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={generatePreview}
            variant="outline"
            disabled={!isFormValid()}
            data-testid="button-preview"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Document
          </Button>
          <Button
            onClick={generateMeetingDocument}
            disabled={!isFormValid() || generatingPDF}
            data-testid="button-generate"
          >
            {generatingPDF ? (
              <div className="h-4 w-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Generate Document
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meeting Preparation Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border">
              {previewContent}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}