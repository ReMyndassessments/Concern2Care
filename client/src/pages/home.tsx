import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText } from "lucide-react";
import { User, Concern, Intervention } from "@shared/schema";
import AppHeader from "@/components/app-header";
import ConcernForm from "@/components/concern-form";
import InterventionResults from "@/components/intervention-results";

export default function Home() {
  const { user } = useAuth() as { user: User | undefined };
  const usagePercentage = ((user?.supportRequestsUsed || 0) / (user?.supportRequestsLimit || 20)) * 100;
  const [currentConcern, setCurrentConcern] = useState<Concern | null>(null);
  const [currentInterventions, setCurrentInterventions] = useState<Intervention[]>([]);
  const [showInterventions, setShowInterventions] = useState(false);

  const handleConcernSubmitted = (concern: Concern, interventions: Intervention[]) => {
    setCurrentConcern(concern);
    setCurrentInterventions(interventions);
    setShowInterventions(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <AppHeader />
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 left-1/4 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-64 right-1/3 w-24 h-24 bg-blue-200 rounded-full opacity-30 blur-lg"></div>
        <div className="absolute bottom-32 left-1/5 w-28 h-28 bg-indigo-200 rounded-full opacity-25 blur-xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 md:p-6 mb-8">
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Welcome back, {user?.firstName || 'Teacher'}!
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {user?.supportRequestsUsed || 0}
              </div>
              <p className="text-gray-600 text-sm">Requests Used This Month</p>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {(user?.supportRequestsLimit || 20) - (user?.supportRequestsUsed || 0)}
              </div>
              <p className="text-gray-600 text-sm">Requests Remaining</p>
            </div>
            <div className="text-center">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-gray-600 text-sm">{Math.round(usagePercentage)}% Used</p>
            </div>
          </div>
        </div>

        {/* Main Content - Concern Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-xl border border-white/20 p-4 md:p-6">
            <div className="flex items-center space-x-3 mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Document New Concern</h2>
            </div>
            <ConcernForm onConcernSubmitted={handleConcernSubmitted} />
          </div>
        </div>

        
        {/* Intervention Results */}
        {showInterventions && currentConcern && (
          <div className="mt-8 md:mt-12">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-2xl border border-white/20 p-4 md:p-8">
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