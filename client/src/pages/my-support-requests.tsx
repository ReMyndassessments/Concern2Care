import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import AppHeader from "@/components/app-header";
import InterventionResults from "@/components/intervention-results";
import { 
  History, 
  Search, 
  Filter, 
  Share2, 
  Eye, 
  Calendar,
  User,
  MapPin,
  AlertCircle,
  Sparkles,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Concern, Intervention } from "@shared/schema";
import { Link } from "wouter";
import BulkSharingModal from "@/components/bulk-sharing-modal";

export default function MySupportRequests() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkSharingModal, setShowBulkSharingModal] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <AppHeader />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <History className="h-8 w-8 text-white" />
            </div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your support requests...</p>
            <p className="text-gray-500 text-sm mt-2">Gathering your intervention history</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(new Set(filteredConcerns.map(c => c.id)));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const handleSelectRequest = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRequests);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRequests(newSelected);
  };

  const handleBulkShare = () => {
    if (selectedRequests.size === 0) {
      toast({
        title: "No Requests Selected",
        description: "Please select at least one request to share",
        variant: "destructive",
      });
      return;
    }
    
    setShowBulkSharingModal(true);
  };

  const getSelectedConcerns = () => {
    return filteredConcerns.filter(concern => selectedRequests.has(concern.id));
  };

  const toggleExpanded = (id: string) => {
    setExpandedRequest(expandedRequest === id ? null : id);
  };

  // Filter and search concerns
  const filteredConcerns = concerns?.filter(concern => {
    const matchesSearch = searchTerm === "" || 
      concern.studentFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      concern.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const concernTypes = concern.concernTypes as string[] | undefined;
    const matchesFilter = filterType === "" || 
      (concernTypes && concernTypes.some(type => type.toLowerCase() === filterType.toLowerCase()));
    
    return matchesSearch && matchesFilter;
  }) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <AppHeader />
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 left-1/4 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-64 right-1/3 w-24 h-24 bg-blue-200 rounded-full opacity-30 blur-lg"></div>
        <div className="absolute bottom-32 left-1/5 w-28 h-28 bg-indigo-200 rounded-full opacity-25 blur-xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <History className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            My Support Requests
          </h1>
          <p className="text-lg text-gray-600">
            View all your student concerns and AI-generated intervention strategies
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by student name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm"
              />
            </div>
            
            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Concern Types</option>
              <option value="academic">Academic</option>
              <option value="behavior">Behavior</option>
              <option value="social-emotional">Social/Emotional</option>
              <option value="attendance">Attendance</option>
            </select>
            
            {/* Bulk Actions Toggle */}
            <Button
              variant={showBulkActions ? "default" : "outline"}
              onClick={() => {
                setShowBulkActions(!showBulkActions);
                if (showBulkActions) {
                  setSelectedRequests(new Set());
                }
              }}
              className="justify-center bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {showBulkActions ? 'Cancel Bulk Actions' : 'Bulk Share'}
            </Button>
          </div>
          
          {/* Bulk Actions Bar */}
          {showBulkActions && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={filteredConcerns.length > 0 && selectedRequests.size === filteredConcerns.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-gray-700">
                    {selectedRequests.size} of {filteredConcerns.length} requests selected
                  </span>
                </div>
                <Button 
                  onClick={handleBulkShare}
                  disabled={selectedRequests.size === 0}
                  className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Selected ({selectedRequests.size})
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Found <strong>{filteredConcerns.length}</strong> support request{filteredConcerns.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
          <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200">
            Total: {concerns?.length || 0} requests
          </Badge>
        </div>

        {/* Support Requests List */}
        {filteredConcerns.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterType ? 'No matching requests found' : 'No support requests yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType 
                ? 'Try adjusting your search or filter criteria' 
                : 'Create your first student support request to get started with AI-powered interventions'}
            </p>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white">
                <Sparkles className="h-4 w-4 mr-2" />
                Create Support Request
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredConcerns.map((concern) => (
              <Card key={concern.id} className="bg-white/90 backdrop-blur-sm shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {showBulkActions && (
                        <Checkbox
                          checked={selectedRequests.has(concern.id)}
                          onCheckedChange={(checked) => handleSelectRequest(concern.id, checked as boolean)}
                          className="mt-1"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                            <User className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {concern.studentFirstName} {concern.studentLastInitial}.
                            </h3>
                            <p className="text-sm text-gray-600">Grade {concern.grade}</p>
                          </div>
                        </div>
                        
                        {/* Concern Types */}
                        <div className="flex flex-wrap gap-2 mb-4">
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
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
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
                    </div>
                  </div>
                </CardHeader>
                
                {expandedRequest === concern.id && (
                  <CardContent className="pt-0">
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-gray-900 mb-2">Concern Description:</h4>
                      <p className="text-gray-700 leading-relaxed">{concern.description}</p>
                    </div>
                    
                    {/* Show AI Interventions if available */}
                    <InterventionResults 
                      concern={concern}
                      interventions={[]} // We'd need to fetch these
                      showFollowUpQuestions={true}
                    />
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Bulk Sharing Modal */}
        <BulkSharingModal
          open={showBulkSharingModal}
          onOpenChange={setShowBulkSharingModal}
          selectedConcerns={getSelectedConcerns()}
          onSuccess={() => {
            setSelectedRequests(new Set());
            setShowBulkActions(false);
          }}
        />
      </div>
    </div>
  );
}