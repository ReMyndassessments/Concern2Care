import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppHeader from "@/components/app-header";
import { 
  History, 
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { Concern } from "@shared/schema";
import { Link } from "wouter";

export default function MySupportRequests() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [teacherFilter, setTeacherFilter] = useState("");

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

  // Filter concerns by teacher name if specified
  const filteredConcerns = concerns?.filter(concern => {
    if (!teacherFilter) return true;
    // This would need to be updated based on how teacher info is stored in concerns
    // For now, we'll filter by the authenticated user
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Home Link */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Student Support Requests
          </h1>
          <p className="text-lg text-gray-600">
            View and manage submitted student support requests
          </p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Support Requests</h2>
          
          <div className="max-w-md">
            <label htmlFor="teacher-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Teacher
            </label>
            <Input
              id="teacher-filter"
              placeholder="Enter teacher name to filter..."
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="w-full"
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
              No support requests yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first student support request to get started with AI-powered interventions
            </p>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-3 text-lg">
                <Sparkles className="h-5 w-5 mr-2" />
                Create Support Request
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-gray-600">
              No support requests have been submitted yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}