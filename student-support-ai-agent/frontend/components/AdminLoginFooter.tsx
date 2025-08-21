import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, Eye, EyeOff, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../hooks/useAuth';

export function AdminLoginFooter() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter the admin demo password.",
        variant: "destructive"
      });
      return;
    }

    setIsLoggingIn(true);
    try {
      await login({ email: 'admin@concern2care.demo', password });
      toast({
        title: "Login Successful",
        description: "Welcome to the Concern2Care demo!"
      });
      setIsOpen(false);
      setPassword('');
      window.location.href = '/admin';
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : "Invalid admin password.";
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <footer className="bg-white/60 backdrop-blur-sm border-t border-white/20 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-gray-600 text-sm">
              © 2024 Concern2Care from Remynd. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Empowering educators with AI-powered student support tools.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-gray-500 text-xs">
                For demonstrations and support:
              </p>
              <a 
                href="mailto:c2c_demo@remynd.online" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                c2c_demo@remynd.online
              </a>
            </div>
            
            <div className="w-px h-8 bg-gray-300"></div>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 p-2 h-auto"
                >
                  <Shield className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-3xl mx-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Admin Demo Access
                  </DialogTitle>
                  <DialogDescription>
                    Enter the demo password to access the full Concern2Care demonstration environment.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="demo-password" className="text-sm font-medium text-gray-700">
                      Demo Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="demo-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter demo password"
                        className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 pr-10"
                        disabled={isLoggingIn}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        disabled={isLoggingIn}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={isLoggingIn || !password.trim()}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging In...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Access Demo
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    This provides access to the full demonstration environment with all AI features enabled.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </footer>
  );
}
