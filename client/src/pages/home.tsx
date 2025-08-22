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

        {/* Usage Limit Warning - Show when at limit */}
        {user && (user.supportRequestsUsed || 0) >= (user.supportRequestsLimit || 20) && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Monthly Request Limit Reached</h3>
                  <p className="text-red-700 mb-3">
                    You've used all {user.supportRequestsLimit || 20} of your monthly support requests. 
                    The form below has been temporarily disabled.
                  </p>
                  <div className="bg-white/70 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-red-800 mb-2">Need More Requests? Here Are Your Options:</h4>
                    <div className="text-sm text-red-700 space-y-2">
                      <div className="flex items-start space-x-2">
                        <span className="font-semibold">📧 Email:</span>
                        <span>Contact your school administrator or IT support for additional requests</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="font-semibold">🚨 Urgent:</span>
                        <span>For immediate student safety concerns, contact your principal directly</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="font-semibold">📅 Wait:</span>
                        <span>Your requests automatically reset at the beginning of next month</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="font-semibold">💾 Review:</span>
                        <span>You can still view and manage all your existing support requests</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => window.location.href = 'mailto:admin@yourschool.edu?subject=Request for Additional Student Support Requests&body=Hello,%0A%0AI have reached my monthly limit of support requests and need additional requests for urgent student needs.%0A%0ATeacher: ' + encodeURIComponent((user.firstName || '') + ' ' + (user.lastName || '')) + '%0AEmail: ' + encodeURIComponent(user.email || '') + '%0ACurrent Usage: ' + (user.supportRequestsUsed || 0) + '/' + (user.supportRequestsLimit || 20) + '%0A%0APlease approve additional requests for this month.%0A%0AThank you!'}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      📧 Email Administrator
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/my-support-requests'}
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      size="sm"
                    >
                      📋 View My Requests
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Concern Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-xl border border-white/20 p-4 md:p-6">
            <div className="flex items-center space-x-3 mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Document New Concern</h2>
              {user && (user.supportRequestsUsed || 0) >= (user.supportRequestsLimit || 20) && (
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium ml-auto">
                  Form Disabled - Limit Reached
                </div>
              )}
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