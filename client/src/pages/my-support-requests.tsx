import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
// Helper function for checking unauthorized errors
const isUnauthorizedError = (error: Error): boolean => {
  return /^401: .*Unauthorized/.test(error.message);
};
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import AppHeader from "@/components/app-header";
import { 
  History, 
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  MapPin,
  AlertCircle,
  FileText,
  Clock,
  Trash2,
  Share2,
  Plus,
  X,
  BookOpen,
  Target,
  Users
} from "lucide-react";
import { Concern } from "@shared/schema";
import { Link } from "wouter";
import InterventionsDisplay from "@/components/InterventionsDisplay";
import { useTranslation } from "react-i18next";
import { EmailSetupGuide } from "@/components/email-setup-guide";

export default function MySupportRequests() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [studentFilter, setStudentFilter] = useState("");
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "differentiation" | "intervention" | "classroom_management">("all");
  
  // Email sharing state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEmailSetupGuide, setShowEmailSetupGuide] = useState(false);
  const [shareTargetConcern, setShareTargetConcern] = useState<Concern | null>(null);
  const [emailRecipients, setEmailRecipients] = useState([{ name: "", email: "" }]);
  const [emailMessage, setEmailMessage] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: concerns, isLoading: concernsLoading, error } = useQuery<Concern[]>({
    queryKey: ["/api/concerns"],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Email sharing mutation
  const emailMutation = useMutation({
    mutationFn: async (emailData: { recipients: Array<{ name: string; email: string }>; message: string }) => {
      if (!shareTargetConcern) throw new Error("No concern selected for sharing");
      return apiRequest("POST", `/api/concerns/${shareTargetConcern.id}/share`, emailData);
    },
    onSuccess: () => {
      toast({
        title: t('supportRequests.shareSuccess', 'Report Shared Successfully!'),
        description: "The intervention report has been sent to student support staff.",
      });
      setShowEmailModal(false);
      setShareTargetConcern(null);
      setEmailRecipients([{ name: "", email: "" }]);
      setEmailMessage("");
    },
    onError: (error: any) => {
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
      
      // Check if error indicates email setup is needed
      const errorMessage = error?.message || '';
      const needsSetup = errorMessage.includes('needsSetup') || errorMessage.includes('email configuration');
      
      if (needsSetup) {
        setShowEmailModal(false);
        setShowEmailSetupGuide(true);
        return;
      }
      
      toast({
        title: t('supportRequests.shareError', 'Failed to Share Report'),
        description: error.message || t('supportRequests.shareErrorMessage', 'There was an issue sending the report. Please check the email address and try again.'),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (concernId: string) => {
      const response = await apiRequest(`/api/concerns/${concernId}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Concern deleted successfully",
      });
      // Invalidate and refresh the concerns list
      queryClient.invalidateQueries({ queryKey: ["/api/concerns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete concern",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (concernId: string) => {
    deleteMutation.mutate(concernId);
    setDeleteDialogOpen(null);
  };

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading || concernsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading support requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Filter concerns by student name and task type
  const filteredConcerns = concerns?.filter(concern => {
    // First filter by student name if specified
    if (studentFilter) {
      const fullName = `${concern.studentFirstName} ${concern.studentLastInitial}`.toLowerCase();
      if (!fullName.includes(studentFilter.toLowerCase())) {
        return false;
      }
    }
    
    // Then filter by task type based on active tab
    if (activeTab === "differentiation") {
      return concern.taskType === "differentiation";
    } else if (activeTab === "intervention") {
      return concern.taskType === "tier2_intervention";
    } else if (activeTab === "classroom_management") {
      return concern.taskType === "classroom_management";
    }
    
    // "all" tab shows everything
    return true;
  }) || [];

  // Get counts for each category
  const differentiationCount = concerns?.filter(c => c.taskType === "differentiation").length || 0;
  const interventionCount = concerns?.filter(c => c.taskType === "tier2_intervention").length || 0;
  const classroomManagementCount = concerns?.filter(c => c.taskType === "classroom_management").length || 0;

  const concernTypeColors = {
    academic: "bg-blue-100 text-blue-800 border-blue-200",
    behavior: "bg-amber-100 text-amber-800 border-amber-200", 
    "social-emotional": "bg-purple-100 text-purple-800 border-purple-200",
    attendance: "bg-red-100 text-red-800 border-red-200",
  };

  const formatTimeAgo = (date: string | Date | null | undefined) => {
    if (!date) return t('supportRequests.unknown', 'Unknown');
    
    const now = new Date();
    const concernDate = new Date(date);
    const diffInMs = now.getTime() - concernDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 60) {
      return t('supportRequests.minutesAgo', '{{count}} minute{{plural}} ago', {
        count: diffInMinutes || 1,
        plural: (diffInMinutes === 1) ? '' : 's'
      });
    }
    
    if (diffInHours < 24) {
      return t('supportRequests.hoursAgo', '{{count}} hour{{plural}} ago', {
        count: diffInHours,
        plural: (diffInHours === 1) ? '' : 's'
      });
    }
    
    if (diffInDays < 7) {
      return t('supportRequests.daysAgo', '{{count}} day{{plural}} ago', {
        count: diffInDays,
        plural: (diffInDays === 1) ? '' : 's'
      });
    }
    
    return concernDate.toLocaleDateString();
  };

  const toggleExpanded = (id: string) => {
    setExpandedRequest(expandedRequest === id ? null : id);
  };

  // Sharing functions
  const handleShareReport = (concern: Concern) => {
    setShareTargetConcern(concern);
    setEmailMessage(`Please find attached the intervention report for ${concern.studentFirstName} ${concern.studentLastInitial}.`);
    setShowEmailModal(true);
  };

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
      message: emailMessage || `Please find attached the intervention report for ${shareTargetConcern?.studentFirstName} ${shareTargetConcern?.studentLastInitial}.`
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Home Link */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('supportRequests.backToHome', 'Back to Home')}
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            {t('supportRequests.title', 'Student Support Requests')}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            {t('supportRequests.subtitle', 'View and manage submitted student support requests')}
          </p>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-green-50 rounded-xl sm:rounded-2xl border border-green-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3">
              <History className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('supportRequests.recentActivity', 'Recent Activity')}</h2>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-md sm:rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('supportRequests.recentConcerns', 'Recent Concerns')}</h3>
              </div>
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-bold text-lg">
                {concerns?.length || 0}
              </div>
            </div>
            
            {concerns && concerns.length > 0 ? (
              <p className="text-gray-600 text-sm">
                {t('supportRequests.concernsDocumented', 'You have {{count}} concern{{plural}} documented. View details below.', {
                  count: concerns.length,
                  plural: concerns.length !== 1 ? 's' : ''
                })}
              </p>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">{t('supportRequests.noConcernsYet', 'No concerns documented yet')}</h4>
                <p className="text-gray-500 text-sm">
                  {t('supportRequests.noConcernsDescription', 'Your recent concerns will appear here after you submit your first concern.')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Support Requests Tabs */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "differentiation" | "intervention" | "classroom_management")}>
            <div className="flex flex-col space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  {t('supportRequests.allRequests', 'All Requests')} ({concerns?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="differentiation" className="text-xs sm:text-sm">
                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {t('supportRequests.differentiation', 'Differentiation')} ({differentiationCount})
                </TabsTrigger>
                <TabsTrigger value="intervention" className="text-xs sm:text-sm">
                  <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {t('supportRequests.interventions', 'Interventions')} ({interventionCount})
                </TabsTrigger>
                <TabsTrigger value="classroom_management" className="text-xs sm:text-sm">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {t('supportRequests.wholeClassManagement', 'Classroom Management')} ({classroomManagementCount})
                </TabsTrigger>
              </TabsList>

              {/* Filter Section */}
              <div className="max-w-full sm:max-w-md">
                <label htmlFor="student-filter" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('supportRequests.filter', 'Filter by Student Name')}
                </label>
                <Input
                  id="student-filter"
                  placeholder={t('supportRequests.searchPlaceholder', 'Enter student name to filter...')}
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="w-full text-sm sm:text-base"
                />
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-6">
              {/* Support Requests Content */}
              {filteredConcerns.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {studentFilter ? t('supportRequests.noMatchingRequests', 'No matching support requests') : t('supportRequests.noRequestsYet', 'No support requests yet')}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {studentFilter 
                ? t('supportRequests.tryAdjusting', 'Try adjusting your search criteria or clear the filter to see all requests')
                : t('supportRequests.createFirst', 'Create your first student support request to get started with AI-powered interventions')
              }
            </p>
            {!studentFilter && (
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-3 text-lg">
                  <Sparkles className="h-5 w-5 mr-2" />
                  {t('supportRequests.createSupportRequest', 'Create Support Request')}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results summary */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {t('supportRequests.foundRequests', 'Found <strong>{{count}}</strong> support request{{plural}}', { 
                  count: filteredConcerns.length,
                  plural: filteredConcerns.length !== 1 ? 's' : ''
                })}
                {studentFilter && ` ${t('supportRequests.matchingFilter', 'matching "{{filter}}"', { filter: studentFilter })}`}
              </p>
              <Badge variant="secondary">
                {t('supportRequests.totalRequests', 'Total: {{count}} requests', { count: concerns?.length || 0 })}
              </Badge>
            </div>

            {/* Support Request Cards */}
            {filteredConcerns.map((concern) => (
              <Card key={concern.id} className="hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 mb-2">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                            {concern.taskType === 'classroom_management' 
                              ? t('supportRequests.wholeClassManagementStrategies', 'Classroom Management Strategies')
                              : `${concern.studentFirstName} ${concern.studentLastInitial}.`
                            }
                          </h3>
                          {concern.taskType !== 'classroom_management' && (
                            <span className="text-xs sm:text-sm text-gray-500">{t('supportRequests.grade', 'Grade {{grade}}', { grade: concern.grade })}</span>
                          )}
                        </div>
                        
                        {/* Task Type and Concern Types */}
                        <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                          {/* Task Type Badge */}
                          <Badge 
                            className={concern.taskType === "differentiation" 
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                              : concern.taskType === "classroom_management"
                              ? "bg-violet-100 text-violet-800 border-violet-200"
                              : "bg-indigo-100 text-indigo-800 border-indigo-200"
                            }
                          >
                            {concern.taskType === "differentiation" ? (
                              <>
                                <BookOpen className="h-3 w-3 mr-1" />
                                {t('supportRequests.differentiation', 'Differentiation')}
                              </>
                            ) : concern.taskType === "classroom_management" ? (
                              <>
                                <Users className="h-3 w-3 mr-1" />
                                {t('supportRequests.wholeClassManagement', 'Classroom Management')}
                              </>
                            ) : (
                              <>
                                <Target className="h-3 w-3 mr-1" />
                                {t('supportRequests.intervention', 'Intervention')}
                              </>
                            )}
                          </Badge>
                          
                          {/* Concern Types */}
                          {(concern.concernTypes as string[] || []).map((type) => (
                            <Badge 
                              key={type}
                              className={concernTypeColors[type.toLowerCase() as keyof typeof concernTypeColors] || concernTypeColors.academic}
                            >
                              {t(`category.${type}`, type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '))}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Meta Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                            <span>{new Date(concern.incidentDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                            <span>{concern.location === 'All Classrooms' ? t('location.allClassrooms', 'All Classrooms') : concern.location === 'Classroom' ? t('location.classroom', 'Classroom') : concern.location}</span>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                            <span className="capitalize">{concern.severityLevel === 'mild' ? t('form.mildClassroom', 'Mild').replace(' – Needs classroom support', '') : concern.severityLevel === 'moderate' ? t('form.moderateTier2', 'Moderate').replace(' – Needs behavior support strategies', '') : concern.severityLevel === 'urgent' ? t('form.urgentImmediate', 'Urgent').replace(' – Immediate follow-up needed', '') : concern.severityLevel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col justify-between sm:justify-start sm:items-end sm:space-y-2 sm:text-right pt-2 sm:pt-0 order-2 sm:order-none">
                      <span className="text-xs text-gray-500 order-1 sm:order-none">
                        {formatTimeAgo(concern.createdAt)}
                      </span>
                      <div className="flex items-center space-x-2 order-2 sm:order-none">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(concern.id)}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs sm:text-sm"
                        >
                          {expandedRequest === concern.id ? (
                            <>
                              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden sm:inline">{t('supportRequests.hideDetails', 'Hide Details')}</span>
                              <span className="sm:hidden">{t('supportRequests.hideDetailsShort', 'Hide')}</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden sm:inline">{t('supportRequests.viewDetails', 'View Details')}</span>
                              <span className="sm:hidden">{t('supportRequests.viewDetailsShort', 'View')}</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShareReport(concern)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
                          data-testid={`button-share-concern-${concern.id}`}
                        >
                          <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">{t('supportRequests.share', 'Share')}</span>
                          <span className="sm:hidden">{t('supportRequests.share', 'Share')}</span>
                        </Button>
                        <AlertDialog open={deleteDialogOpen === concern.id} onOpenChange={(open) => setDeleteDialogOpen(open ? concern.id : null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm"
                              data-testid={`button-delete-concern-${concern.id}`}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden sm:inline">{t('supportRequests.delete', 'Delete')}</span>
                              <span className="sm:hidden">Del</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('supportRequests.deleteConfirm', 'Delete Concern')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('supportRequests.deleteMessageDetailed', 'Are you sure you want to delete this concern for {{studentName}}? This action cannot be undone and will permanently delete all related interventions and follow-up questions.', {
                                  studentName: `${concern.studentFirstName} ${concern.studentLastInitial}.`
                                })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-delete">{t('supportRequests.cancel', 'Cancel')}</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(concern.id)}
                                disabled={deleteMutation.isPending}
                                className="bg-red-600 hover:bg-red-700"
                                data-testid="button-confirm-delete"
                              >
                                {deleteMutation.isPending ? t('supportRequests.deleting', 'Deleting...') : t('supportRequests.delete', 'Delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {expandedRequest === concern.id && (
                  <CardContent className="pt-0 border-t border-gray-100">
                    <div className="space-y-4 mt-4">
                      {/* Concern Description */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-purple-500" />
                          {t('supportRequests.concernDescription', 'Concern Description')}
                        </h4>
                        <p className="text-gray-700 leading-relaxed">{concern.description}</p>
                      </div>
                      
                      {/* AI Interventions - Fetch and display actual interventions */}
                      <InterventionsDisplay concernId={concern.id} />
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

      {/* Email Sharing Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('supportRequests.shareReport', 'Share Report with Student Support')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {t('supportRequests.sharingFor', 'Sharing report for:')} <strong>{shareTargetConcern?.studentFirstName} {shareTargetConcern?.studentLastInitial}.</strong>
            </div>
            
            {/* Email Recipients */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Email Recipients</label>
              {emailRecipients.map((recipient, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder={t('supportRequests.namePlaceholder', 'Name (optional)')}
                      value={recipient.name}
                      onChange={(e) => updateRecipient(index, "name", e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder={t('supportRequests.emailPlaceholder', 'Email address')}
                      type="email"
                      value={recipient.email}
                      onChange={(e) => updateRecipient(index, "email", e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>
                  {emailRecipients.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipient(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('supportRequests.addRecipient', 'Add Another Recipient')}
              </Button>
            </div>

            {/* Email Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t('supportRequests.messageLabel', 'Message (optional)')}</label>
              <Textarea
                placeholder={t('supportRequests.messagePlaceholder', 'Add a personal message to include with the report...')}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
              >
                {t('supportRequests.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={emailMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {emailMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('supportRequests.sending', 'Sending...')}
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('supportRequests.sendReport', 'Send Report')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Setup Guide Dialog */}
      <EmailSetupGuide
        open={showEmailSetupGuide}
        onOpenChange={setShowEmailSetupGuide}
      />
      </div>
    </div>
  );
}