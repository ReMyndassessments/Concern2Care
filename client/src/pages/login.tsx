import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Shield, Lock, Users, BookOpen } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-blue-200 rounded-full opacity-30 blur-lg"></div>
        <div className="absolute bottom-1/3 left-1/5 w-28 h-28 bg-indigo-200 rounded-full opacity-25 blur-xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardHeader className="text-center pb-8">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-4 mx-auto">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Concern2Care
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Secure Teacher Portal
            </p>
          </CardHeader>
          
          <CardContent>
            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    🔐 Student Data Protection
                  </p>
                  <p className="text-xs text-blue-700">
                    All student information is kept confidential and secure. Only authorized teachers can access their assigned student data.
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                </div>
                <span>AI-powered Tier 2 intervention strategies</span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <span>Collaborate with student support departments</span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Lock className="h-4 w-4 text-emerald-600" />
                </div>
                <span>FERPA compliant & secure</span>
              </div>
            </div>

            {/* Login Button */}
            <Button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-3 text-lg shadow-lg"
            >
              <Shield className="h-5 w-5 mr-2" />
              Sign In with School Account
            </Button>
            
            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-xs text-gray-500">
                Administered by your school's IT department
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Need help? Contact your school administrator
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional Security Notice */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-600 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
            🛡️ Your session is encrypted and secure. Student data is never shared with unauthorized users.
          </p>
        </div>
      </div>
    </div>
  );
}