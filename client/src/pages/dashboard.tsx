import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/app-header";
import ConcernForm from "@/components/concern-form";
import RecentConcerns from "@/components/recent-concerns";
import InterventionResults from "@/components/intervention-results";
import { useState } from "react";
import { Concern, Intervention } from "@shared/schema";

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ConcernForm onConcernSubmitted={handleConcernSubmitted} />
          </div>
          
          <div className="lg:col-span-1">
            <RecentConcerns />
          </div>
        </div>
        
        {showInterventions && currentConcern && (
          <div className="mt-8">
            <InterventionResults 
              concern={currentConcern}
              interventions={currentInterventions}
            />
          </div>
        )}
      </div>
    </div>
  );
}
