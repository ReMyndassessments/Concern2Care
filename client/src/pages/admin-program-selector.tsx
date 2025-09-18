import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  FileText, 
  Users, 
  Sparkles,
  ArrowRight,
  Shield,
  BookOpen,
  BarChart3,
  Settings
} from "lucide-react";
import AppHeader from "@/components/app-header";

export default function AdminProgramSelector() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Administrator Portal</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">
            Welcome back, {user?.firstName} {user?.lastName}
          </p>
          <p className="text-gray-500">
            Choose which program dashboard you'd like to access
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* C2C App Dashboard */}
          <Card className="relative group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                C2C App Dashboard
              </CardTitle>
              <p className="text-gray-600">
                Main Concern2Care application management
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-700">
                  <Users className="h-4 w-4 mr-2 text-blue-500" />
                  Teacher & School Management
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Sparkles className="h-4 w-4 mr-2 text-green-500" />
                  AI-Generated Interventions
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <BarChart3 className="h-4 w-4 mr-2 text-purple-500" />
                  Usage Analytics & Reports
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Settings className="h-4 w-4 mr-2 text-gray-500" />
                  System Configuration
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Program Status</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                
                <Link href="/admin/c2c-dashboard">
                  <Button className="w-full group-hover:bg-blue-700 transition-colors" data-testid="button-c2c-dashboard">
                    Access C2C Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Classroom Solutions Dashboard */}
          <Card className="relative group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-500">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <BookOpen className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Classroom Solutions Dashboard
              </CardTitle>
              <p className="text-gray-600">
                QR-code based classroom support system
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-700">
                  <Users className="h-4 w-4 mr-2 text-orange-500" />
                  Teacher Enrollment Management
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  Submission Review & Approval
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Sparkles className="h-4 w-4 mr-2 text-green-500" />
                  Delayed Delivery System
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Shield className="h-4 w-4 mr-2 text-red-500" />
                  Urgent Keyword Detection
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Program Status</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                
                <Link href="/admin/classroom-dashboard">
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700 group-hover:bg-orange-700 transition-colors"
                    data-testid="button-classroom-dashboard"
                  >
                    Access Classroom Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact system administrator or view the{" "}
            <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
              admin documentation
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}