import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/app-header";
import ConcernForm from "@/components/concern-form";
import RecentConcerns from "@/components/recent-concerns";
import InterventionResults from "@/components/intervention-results";
import { useState } from "react";
import { Concern, Intervention } from "@shared/schema";
import { Sparkles, FileText, History } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentConcern, setCurrentConcern] = useState<Concern | null>(null);
  const [currentInterventions, setCurrentInterventions] = useState<Intervention[]>([]);
  const [showInterventions, setShowInterventions] = useState(false);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Preparing your AI-powered tools</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const handleConcernSubmitted = (concern: Concern, interventions: Intervention[]) => {
    setCurrentConcern(concern);
    setCurrentInterventions(interventions);
    setShowInterventions(true);
  };

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
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Student Support Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Create concerns and get AI-powered intervention strategies
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Concern Form */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Document New Concern</h2>
              </div>
              <ConcernForm onConcernSubmitted={handleConcernSubmitted} />
            </div>
          </div>
          
          {/* Right Column - Recent Concerns */}
          <div className="xl:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl flex items-center justify-center">
                  <History className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
              </div>
              <RecentConcerns />
            </div>
          </div>
        </div>
        
        {/* Intervention Results */}
        {showInterventions && currentConcern && (
          <div className="mt-12">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
              <InterventionResults 
                concern={currentConcern}
                interventions={currentInterventions}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
