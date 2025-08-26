import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Shield, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Handle query parameters for payment activation messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('activated') === 'true') {
      toast({
        title: "Account Activated! 🎉",
        description: "Your payment was successful. You can now sign in to your account.",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/login');
    }
    
    if (urlParams.get('error')) {
      const error = urlParams.get('error');
      let message = "An error occurred during activation.";
      
      switch (error) {
        case 'payment-failed':
          message = "Payment was not completed. Please try registering again.";
          break;
        case 'invalid-activation':
          message = "Invalid activation link. Please contact support.";
          break;
        case 'user-not-found':
          message = "User account not found. Please register again.";
          break;
        case 'email-mismatch':
          message = "Email mismatch during activation. Please contact support.";
          break;
        case 'activation-failed':
          message = "Account activation failed. Please contact support.";
          break;
      }
      
      toast({
        title: "Activation Error",
        description: message,
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/login');
    }
  }, [toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Welcome back!",
          description: "You've been successfully signed in.",
        });
        
        // Invalidate auth queries to refetch user data, then navigate
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Navigate directly - the useAuth hook will handle the state update
        setLocation('/');
      } else {
        // Handle account activation error specifically
        if (data.accountInactive) {
          toast({
            title: "Account Not Activated",
            description: data.message || "Please complete your payment to activate your account.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign In Failed",
            description: data.message || "Invalid email or password",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
              Teacher Sign In
            </p>
          </CardHeader>
          
          <CardContent>
            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    🔐 Secure Access
                  </p>
                  <p className="text-xs text-blue-700">
                    Sign in with your school-provided credentials. All student data is encrypted and FERPA compliant.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="noel.roberts@school.edu"
                  required
                  disabled={isLoading}
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="teacher123"
                    required
                    disabled={isLoading}
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-3 text-lg shadow-lg"
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Sign In Securely
                  </>
                )}
              </Button>
            </form>
            
            {/* Registration Link */}
            <div className="text-center mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                New to Concern2Care?
              </p>
              <Button
                variant="outline"
                onClick={() => setLocation('/register')}
                className="text-purple-600 border-purple-200 hover:bg-purple-50 text-sm"
                data-testid="button-register"
              >
                Register as Individual Teacher
              </Button>
            </div>
            
            {/* Footer */}
            <div className="text-center mt-6 space-y-2">
              <p className="text-xs text-gray-500">
                🔒 All student data is kept confidential and secure
              </p>
              <p className="text-xs text-gray-500">
                FERPA compliant • Simple and secure login
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Back to Landing */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-gray-600 hover:text-purple-600 text-sm bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}