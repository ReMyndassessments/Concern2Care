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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  Trash2
} from "lucide-react";
import { Concern } from "@shared/schema";
import { Link } from "wouter";
import InterventionsDisplay from "@/components/InterventionsDisplay";

export default function MySupportRequests() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [studentFilter, setStudentFilter] = useState("");
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

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

  // Filter concerns by student name if specified
  const filteredConcerns = concerns?.filter(concern => {
    if (!studentFilter) return true;
    const fullName = `${concern.studentFirstName} ${concern.studentLastInitial}`.toLowerCase();
    return fullName.includes(studentFilter.toLowerCase());
  }) || [];

  const concernTypeColors = {
    academic: "bg-blue-100 text-blue-800 border-blue-200",
    behavior: "bg-amber-100 text-amber-800 border-amber-200", 
    "social-emotional": "bg-purple-100 text-purple-800 border-purple-200",
    attendance: "bg-red-100 text-red-800 border-red-200",
  };

  const formatTimeAgo = (date: string | Date | null | undefined) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const concernDate = new Date(date);
    const diffInMs = now.getTime() - concernDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) return 'Less than 1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return concernDate.toLocaleDateString();
  };

  const toggleExpanded = (id: string) => {
    setExpandedRequest(expandedRequest === id ? null : id);
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
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Student Support Requests
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            View and manage submitted student support requests
          </p>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-green-50 rounded-xl sm:rounded-2xl border border-green-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3">
              <History className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Activity</h2>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-md sm:rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Concerns</h3>
              </div>
              <Badge variant="secondary" className="text-gray-600">
                {concerns?.length || 0}
              </Badge>
            </div>
            
            {concerns && concerns.length > 0 ? (
              <p className="text-gray-600 text-sm">
                You have {concerns.length} concern{concerns.length !== 1 ? 's' : ''} documented. View details below.
              </p>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No concerns documented yet</h4>
                <p className="text-gray-500 text-sm">
                  Your recent concerns will appear here after you submit your first concern.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Filter Support Requests</h2>
          
          <div className="max-w-full sm:max-w-md">
            <label htmlFor="student-filter" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Filter by Student Name
            </label>
            <Input
              id="student-filter"
              placeholder="Enter student name to filter..."
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="w-full text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Support Requests Content */}
        {filteredConcerns.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {studentFilter ? 'No matching support requests' : 'No support requests yet'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {studentFilter 
                ? 'Try adjusting your search criteria or clear the filter to see all requests'
                : 'Create your first student support request to get started with AI-powered interventions'
              }
            </p>
            {!studentFilter && (
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-3 text-lg">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Support Request
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results summary */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Found <strong>{filteredConcerns.length}</strong> support request{filteredConcerns.length !== 1 ? 's' : ''}
                {studentFilter && ` matching "${studentFilter}"`}
              </p>
              <Badge variant="secondary">
                Total: {concerns?.length || 0} requests
              </Badge>
            </div>

            {/* Support Request Cards */}
            {filteredConcerns.map((concern) => (
              <Card key={concern.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                        <User className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {concern.studentFirstName} {concern.studentLastInitial}.
                          </h3>
                          <span className="text-sm text-gray-500">Grade {concern.grade}</span>
                        </div>
                        
                        {/* Concern Types */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(concern.concernTypes as string[] || []).map((type) => (
                            <Badge 
                              key={type}
                              className={concernTypeColors[type.toLowerCase() as keyof typeof concernTypeColors] || concernTypeColors.academic}
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Meta Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            <span>{new Date(concern.incidentDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-purple-500" />
                            <span>{concern.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-purple-500" />
                            <span className="capitalize">{concern.severityLevel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end space-y-2">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(concern.createdAt)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(concern.id)}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          {expandedRequest === concern.id ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              View Details
                            </>
                          )}
                        </Button>
                        <AlertDialog open={deleteDialogOpen === concern.id} onOpenChange={(open) => setDeleteDialogOpen(open ? concern.id : null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-delete-concern-${concern.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Concern</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this concern for {concern.studentFirstName} {concern.studentLastInitial}.? 
                                This action cannot be undone and will permanently delete all related interventions and follow-up questions.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(concern.id)}
                                disabled={deleteMutation.isPending}
                                className="bg-red-600 hover:bg-red-700"
                                data-testid="button-confirm-delete"
                              >
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
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
                          Concern Description
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
      </div>
    </div>
  );
}