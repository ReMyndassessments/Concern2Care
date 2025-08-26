import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, UserPlus, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    school: "",
    country: "",
    referralCode: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Registration Initiated",
          description: "Redirecting to payment to complete your registration...",
        });
        
        // Redirect to BuyMeACoffee with user data
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: "Registration Failed",
          description: data.message || "Please check your information and try again.",
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
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-blue-200 rounded-full opacity-30 blur-lg"></div>
        <div className="absolute bottom-1/3 left-1/5 w-28 h-28 bg-indigo-200 rounded-full opacity-25 blur-xl"></div>
      </div>

      <div className="relative w-full max-w-2xl">
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardHeader className="text-center pb-6">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-4 mx-auto">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              <UserPlus className="h-8 w-8 inline mr-2 text-purple-600" />
              Your Information
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Tell us about yourself and your school
            </p>
          </CardHeader>
          
          <CardContent>
            {/* Subscription Plan Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Individual Teacher Annual Subscription</h3>
              <p className="text-sm text-blue-700 mb-1">Start Date: {new Date().toLocaleDateString()}</p>
              <p className="text-sm text-blue-700 mb-1">End Date: {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              <p className="text-sm font-medium text-blue-800">12 months of unlimited access • $99/month (paid annually)</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="Your full name"
                    required
                    disabled={isLoading}
                    data-testid="input-fullname"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="your@email.com"
                    required
                    disabled={isLoading}
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder="Choose a username"
                    required
                    disabled={isLoading}
                    data-testid="input-username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Create a password"
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school">School/Institution *</Label>
                  <Input
                    id="school"
                    type="text"
                    value={formData.school}
                    onChange={(e) => handleChange('school', e.target.value)}
                    placeholder="School name"
                    required
                    disabled={isLoading}
                    data-testid="input-school"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="Country"
                    required
                    disabled={isLoading}
                    data-testid="input-country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                <Input
                  id="referralCode"
                  type="text"
                  value={formData.referralCode}
                  onChange={(e) => handleChange('referralCode', e.target.value)}
                  placeholder="Enter referral code if you have one"
                  disabled={isLoading}
                  data-testid="input-referral"
                />
              </div>

              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-3 text-lg shadow-lg mt-6"
                data-testid="button-continue-payment"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Payment →
                  </>
                )}
              </Button>
            </form>
            
            {/* Navigation Links */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setLocation('/')}
                className="text-gray-600 hover:text-purple-600 text-sm"
                data-testid="button-back-plans"
              >
                Back to Plans
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setLocation('/login')}
                className="text-purple-600 hover:text-purple-700 text-sm"
                data-testid="button-login"
              >
                Already have an account? Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}