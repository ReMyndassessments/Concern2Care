import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { 
  FileText, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Send,
  Filter,
  RefreshCw,
  User,
  Calendar,
  ThumbsUp,
  Pause,
  Ban,
  ArrowUp,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ClassroomSubmission {
  id: string;
  studentFirstName: string;
  studentLastInitial: string;
  studentAge: number;
  studentGrade: string;
  concernTypes: string[];
  concernDescription: string;
  severityLevel: 'mild' | 'moderate' | 'urgent';
  taskType: 'differentiation' | 'tier2_intervention';
  learningProfile: string[];
  actionsTaken: string[];
  status: 'pending' | 'approved' | 'hold' | 'cancelled' | 'urgent_flagged' | 'sending' | 'auto_sent';
  urgentSafeguard?: {
    containsUrgentKeywords: boolean;
    flaggedKeywords: string[];
    requiresImmediateReview: boolean;
  };
  aiResponseDraft?: string;
  aiDisclaimer?: string;
  autoSendTime?: string;
  sentAt?: string;
  sentText?: string;
  createdAt: string;
  updatedAt: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    school?: string;
  };
}

interface SubmissionDetailModalProps {
  submission: ClassroomSubmission | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string, reason?: string) => void;
}

function SubmissionDetailModal({ submission, isOpen, onClose, onStatusUpdate }: SubmissionDetailModalProps) {
  const [actionReason, setActionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!submission) return null;

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === 'hold' || newStatus === 'cancelled') {
      if (!actionReason.trim()) {
        alert('Please provide a reason for this action.');
        return;
      }
    }
    
    setIsUpdating(true);
    await onStatusUpdate(submission.id, newStatus, actionReason);
    setIsUpdating(false);
    setActionReason('');
    onClose();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'hold': { color: 'bg-orange-100 text-orange-800', icon: Pause },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: Ban },
      'urgent_flagged': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      'sending': { color: 'bg-blue-100 text-blue-800', icon: Send },
      'auto_sent': { color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const canTakeAction = ['pending', 'urgent_flagged'].includes(submission.status);
  const isUrgent = submission.status === 'urgent_flagged' || submission.urgentSafeguard?.requiresImmediateReview;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submission Details - {submission.studentFirstName} {submission.studentLastInitial}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Urgent Alerts */}
          <div className="flex items-center justify-between">
            {getStatusBadge(submission.status)}
            {isUrgent && (
              <Alert className="border-red-200 bg-red-50 flex-1 ml-4">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>URGENT:</strong> Contains potentially dangerous keywords requiring immediate review
                  {submission.urgentSafeguard?.flaggedKeywords && (
                    <div className="mt-1 text-sm">
                      Flagged: {submission.urgentSafeguard.flaggedKeywords.join(', ')}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Student & Teacher Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Student Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Name:</strong> {submission.studentFirstName} {submission.studentLastInitial}</p>
                <p><strong>Age:</strong> {submission.studentAge}</p>
                <p><strong>Grade:</strong> {submission.studentGrade}</p>
                <p><strong>Task Type:</strong> {submission.taskType === 'differentiation' ? 'Differentiation Strategies' : 'Tier 2 Intervention'}</p>
                <p><strong>Severity:</strong> <Badge variant={submission.severityLevel === 'urgent' ? 'destructive' : 'outline'}>{submission.severityLevel}</Badge></p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Teacher Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Name:</strong> {submission.teacher.firstName} {submission.teacher.lastName}</p>
                <p><strong>Email:</strong> {submission.teacher.email}</p>
                <p><strong>Position:</strong> {submission.teacher.position}</p>
                {submission.teacher.school && <p><strong>School:</strong> {submission.teacher.school}</p>}
                <p><strong>Submitted:</strong> {new Date(submission.createdAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Concern Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Concern Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>Concern Types:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {submission.concernTypes.map((type, index) => (
                    <Badge key={index} variant="outline">{type}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <strong>Learning Profile:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {submission.learningProfile.map((profile, index) => (
                    <Badge key={index} variant="secondary">{profile}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <strong>Actions Already Taken:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {submission.actionsTaken.map((action, index) => (
                    <li key={index} className="text-sm">{action}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong>Description:</strong>
                <p className="mt-1 p-3 bg-gray-50 rounded border text-sm">{submission.concernDescription}</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Generated Content */}
          {submission.aiResponseDraft && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI Generated Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded border">
                    <div className="whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{ __html: submission.aiResponseDraft }} />
                  </div>
                  
                  {submission.aiDisclaimer && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                      <p className="text-sm text-amber-800">
                        <strong>Disclaimer:</strong> {submission.aiDisclaimer}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {submission.autoSendTime && (
                <p><strong>Scheduled Send:</strong> {new Date(submission.autoSendTime).toLocaleString()}</p>
              )}
              {submission.sentAt && (
                <p><strong>Sent At:</strong> {new Date(submission.sentAt).toLocaleString()}</p>
              )}
              <p><strong>Last Updated:</strong> {new Date(submission.updatedAt).toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          {canTakeAction && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Reason for action (required for hold/cancel)..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  data-testid="textarea-admin-action-reason"
                />
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-approve-submission"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Approve & Send Now
                  </Button>
                  
                  <Button 
                    onClick={() => handleStatusUpdate('hold')}
                    disabled={isUpdating}
                    variant="outline"
                    data-testid="button-hold-submission"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Hold for Review
                  </Button>
                  
                  <Button 
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={isUpdating}
                    variant="destructive"
                    data-testid="button-cancel-submission"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancel Submission
                  </Button>
                  
                  {isUrgent && (
                    <Button 
                      onClick={() => handleStatusUpdate('escalated')}
                      disabled={isUpdating}
                      variant="outline"
                      className="border-orange-500 text-orange-600"
                      data-testid="button-escalate-submission"
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Escalate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ClassroomSubmissionsManagement() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<ClassroomSubmission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all submissions
  const { data: submissions = [], isLoading, error } = useQuery<ClassroomSubmission[]>({
    queryKey: ['/api/admin/classroom/submissions', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await apiRequest('GET', `/api/admin/classroom/submissions${params}`);
      return response.submissions || [];
    }
  });

  // Update submission status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const endpoints = {
        'approved': `/api/admin/classroom/submissions/${id}/approve`,
        'hold': `/api/admin/classroom/submissions/${id}/hold`,
        'cancelled': `/api/admin/classroom/submissions/${id}/cancel`
      };
      
      const endpoint = endpoints[status as keyof typeof endpoints];
      if (!endpoint) {
        throw new Error(`Unknown status: ${status}`);
      }
      
      return apiRequest('POST', endpoint, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/classroom/submissions'] });
      toast({
        title: "Status Updated",
        description: "Submission status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update submission status.",
        variant: "destructive",
      });
    },
  });

  // Process immediate send mutation
  const processImmediateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/classroom/process-now');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/classroom/submissions'] });
      toast({
        title: "Processing Complete",
        description: `Processed ${data.processed} submissions successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process submissions.",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = async (id: string, status: string, reason?: string) => {
    updateStatusMutation.mutate({ id, status, reason });
  };

  const handleViewDetails = (submission: ClassroomSubmission) => {
    setSelectedSubmission(submission);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string, urgentSafeguard?: any) => {
    const isUrgent = status === 'urgent_flagged' || urgentSafeguard?.requiresImmediateReview;
    
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'hold': { color: 'bg-orange-100 text-orange-800', icon: Pause },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: Ban },
      'urgent_flagged': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      'sending': { color: 'bg-blue-100 text-blue-800', icon: Send },
      'auto_sent': { color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} ${isUrgent ? 'animate-pulse' : ''}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
        {isUrgent && ' ⚠️'}
      </Badge>
    );
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = !searchTerm || 
      submission.studentFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.studentLastInitial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const urgentCount = submissions.filter(s => s.status === 'urgent_flagged' || s.urgentSafeguard?.requiresImmediateReview).length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading submissions...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8 text-red-600">
          <XCircle className="h-8 w-8 mr-2" />
          Failed to load submissions. Please try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Classroom Solutions Submissions</h2>
          <p className="text-gray-600">Review and manage all classroom solution requests</p>
        </div>
        
        <div className="flex items-center gap-4">
          {urgentCount > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>{urgentCount}</strong> urgent submission{urgentCount !== 1 ? 's' : ''} requiring immediate attention
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={() => processImmediateMutation.mutate()}
            disabled={processImmediateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-process-immediate"
          >
            <Send className="h-4 w-4 mr-2" />
            Process Approved Now
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Urgent Flagged</p>
                <p className="text-2xl font-bold">{urgentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Sent Today</p>
                <p className="text-2xl font-bold">
                  {submissions.filter(s => s.sentAt && new Date(s.sentAt).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold">{submissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by student or teacher name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-submissions"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="urgent_flagged">Urgent Flagged</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="auto_sent">Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-8 text-gray-500">
                    No submissions found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id} data-testid={`row-submission-${submission.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{submission.studentFirstName} {submission.studentLastInitial}</p>
                        <p className="text-sm text-gray-500">Grade {submission.studentGrade}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="font-medium">{submission.teacher.firstName} {submission.teacher.lastName}</p>
                        <p className="text-sm text-gray-500">{submission.teacher.email}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">
                        {submission.taskType === 'differentiation' ? 'Differentiation' : 'Tier 2 Intervention'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={submission.severityLevel === 'urgent' ? 'destructive' : 'outline'}>
                        {submission.severityLevel}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(submission.status, submission.urgentSafeguard)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(submission.createdAt).toLocaleDateString()}</p>
                        <p className="text-gray-500">{new Date(submission.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(submission)}
                        data-testid={`button-view-details-${submission.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <SubmissionDetailModal
        submission={selectedSubmission}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}