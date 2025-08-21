import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Plus, History, FileText, Users, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { User } from "@shared/schema";
import AppHeader from "@/components/app-header";

export default function Home() {
  const { user } = useAuth() as { user: User | undefined };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-blue rounded-2xl mb-4">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName || 'Teacher'}!
            </h1>
            <p className="text-lg text-gray-600">
              Ready to support your students with AI-powered intervention strategies?
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/dashboard">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-brand-blue/30">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6 text-brand-blue" />
                </div>
                <CardTitle className="text-xl">Create New Concern</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Document a new student concern and get instant AI-powered intervention recommendations.
                </p>
                <Button className="w-full bg-brand-blue hover:bg-brand-dark-blue">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-brand-green/10 rounded-lg flex items-center justify-center mb-3">
                  <History className="h-6 w-6 text-brand-green" />
                </div>
                <CardTitle className="text-xl">Recent Concerns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  View and manage your previously documented student concerns and interventions.
                </p>
                <Button variant="outline" className="w-full">
                  View History
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-brand-amber/10 rounded-lg flex items-center justify-center mb-3">
                <TrendingUp className="h-6 w-6 text-brand-amber" />
              </div>
              <CardTitle className="text-xl">Usage Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You've used <strong>{user?.supportRequestsUsed || 0}</strong> of <strong>{user?.supportRequestsLimit || 20}</strong> monthly support requests.
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-brand-blue h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${((user?.supportRequestsUsed || 0) / (user?.supportRequestsLimit || 20)) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Highlight */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What You Can Do with Concern2Care
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-brand-blue" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Quick Documentation
              </h3>
              <p className="text-gray-600">
                Document student concerns with structured forms in under 2 minutes.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-brand-green" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Recommendations
              </h3>
              <p className="text-gray-600">
                Get 3-5 evidence-based Tier 2 intervention strategies in seconds.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-amber/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-brand-amber" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Professional Reports
              </h3>
              <p className="text-gray-600">
                Generate and share PDF reports with counselors and support staff.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Link href="/dashboard">
              <Button size="lg" className="bg-brand-blue hover:bg-brand-dark-blue">
                Start Documenting Concerns
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}