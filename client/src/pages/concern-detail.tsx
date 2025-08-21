import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import AppHeader from "@/components/app-header";
import InterventionResults from "@/components/intervention-results";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, User, BookOpen } from "lucide-react";
import { ConcernWithDetails } from "@shared/schema";

export default function ConcernDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const { data: concern, isLoading, error } = useQuery<ConcernWithDetails>({
    queryKey: ["/api/concerns", id],
    enabled: !!id && isAuthenticated,
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
              <p className="text-gray-600">Loading concern details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (!concern) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">Concern not found or you don't have access to view it.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const concernTypeColors = {
    academic: "bg-blue-100 text-blue-800",
    behavior: "bg-amber-100 text-amber-800", 
    "social-emotional": "bg-purple-100 text-purple-800",
    attendance: "bg-red-100 text-red-800",
  };

  const concernTypeIcons = {
    academic: BookOpen,
    behavior: "⚠️",
    "social-emotional": "👥", 
    attendance: "📅",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Concern Summary Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl text-gray-900">
                  Concern for {concern.studentFirstName} {concern.studentLastInitial}.
                </CardTitle>
                <div className="flex items-center space-x-4 mt-3">
                  <Badge className={concernTypeColors[concern.concernType as keyof typeof concernTypeColors]}>
                    {concern.concernType.charAt(0).toUpperCase() + concern.concernType.slice(1).replace('-', ' ')}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    {concern.createdAt ? new Date(concern.createdAt).toLocaleDateString() : 'Unknown date'}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Teacher Information</h3>
                <div className="flex items-center text-gray-900">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  {concern.teacher.firstName} {concern.teacher.lastName}
                  {concern.teacher.school && (
                    <span className="text-gray-600 ml-2">• {concern.teacher.school}</span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Concern Description</h3>
                <p className="text-gray-900 leading-relaxed">{concern.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interventions */}
        {concern.interventions && concern.interventions.length > 0 && (
          <InterventionResults 
            concern={concern}
            interventions={concern.interventions}
            showFollowUpQuestions={true}
          />
        )}
      </div>
    </div>
  );
}
