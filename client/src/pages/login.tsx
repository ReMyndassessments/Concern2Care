import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Eye, EyeOff } from "lucide-react";
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

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Welcome back! 👋",
          description: "You've successfully signed in.",
        });
        
        // Invalidate auth cache and redirect
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/");
      } else {
        const error = await response.json();
        toast({
          title: "Sign In Failed",
          description: error.message || "Invalid email or password.",
          variant: "destructive",
        });
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
      <div className="w-full max-w-md">
        <div className="card shadow-2xl border-0">
          <div className="card-header text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="card-title text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent">
                Welcome Back
              </h2>
              <p className="text-gray-600 mt-2">Sign in to your teacher account</p>
            </div>
          </div>
          <div className="card-content space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  data-testid="input-email"
                  className="input"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    data-testid="input-password"
                    className="input"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">New to Concern2Care?</span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Need an account? Create one to start documenting student concerns.
                </p>
                <button
                  type="button"
                  className="btn btn-outline w-full"
                  onClick={() => setLocation('/')}
                  data-testid="button-create-account"
                >
                  Create Teacher Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}