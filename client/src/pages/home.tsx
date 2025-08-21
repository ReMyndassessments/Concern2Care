import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, History, FileText, Users, TrendingUp, ArrowRight, Zap, Target, Share2 } from "lucide-react";
import { Link } from "wouter";
import { User } from "@shared/schema";
import AppHeader from "@/components/app-header";

export default function Home() {
  const { user } = useAuth() as { user: User | undefined };
  const usagePercentage = ((user?.supportRequestsUsed || 0) / (user?.supportRequestsLimit || 20)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <AppHeader />
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 left-1/4 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-64 right-1/3 w-24 h-24 bg-blue-200 rounded-full opacity-30 blur-lg"></div>
        <div className="absolute bottom-32 left-1/5 w-28 h-28 bg-indigo-200 rounded-full opacity-25 blur-xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Welcome Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl mb-6 shadow-xl">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Welcome back, {user?.firstName || 'Teacher'}!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Ready to transform student support with AI-powered intervention strategies? 
            Let's make a difference together.
          </p>
        </div>

        {/* Quick Stats Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {user?.supportRequestsUsed || 0}
              </div>
              <p className="text-gray-600 text-sm">Requests Used This Month</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
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

        {/* Enhanced Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <Link href="/dashboard">
            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-500 to-blue-600 text-white border-0 shadow-xl">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                  <Plus className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">Create New Concern</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 mb-6 leading-relaxed">
                  Document a new student concern and get instant AI-powered intervention recommendations in seconds.
                </p>
                <div className="flex items-center text-white font-medium">
                  Start Now <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/my-support-requests">
            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-sm shadow-xl border border-white/20">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                  <History className="h-7 w-7 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">My Support Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  View all your documented concerns, AI recommendations, and continue conversations for implementation guidance.
                </p>
                <div className="flex items-center text-emerald-600 font-medium">
                  View All Requests <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="group hover:scale-105 transition-all duration-300 bg-white/90 backdrop-blur-sm shadow-xl border border-white/20">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp className="h-7 w-7 text-amber-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Usage Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">This Month</span>
                  <span className="font-bold text-2xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {user?.supportRequestsUsed || 0}/{user?.supportRequestsLimit || 20}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">
                  {(user?.supportRequestsLimit || 20) - (user?.supportRequestsUsed || 0)} requests remaining
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Features Showcase */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              Powerful Tools for Student Success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to document concerns, generate interventions, and support your students effectively
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Zap className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Lightning Fast</h3>
              <p className="text-gray-600 leading-relaxed">
                Document student concerns with intelligent forms that auto-populate and validate in real-time.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Target className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                Get personalized, evidence-based Tier 2 intervention strategies tailored to each student's unique needs.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Share2 className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Seamless Collaboration</h3>
              <p className="text-gray-600 leading-relaxed">
                Create professional reports and share insights securely with counselors, administrators, and support teams.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/dashboard">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-12 py-4 text-lg rounded-2xl shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Sparkles className="h-5 w-5 mr-3" />
                Start Creating Concerns
                <ArrowRight className="h-5 w-5 ml-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}