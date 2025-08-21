import { useAuth } from "@/hooks/useAuth";
import { Sparkles, LogOut, BarChart3, Home, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { Link } from "wouter";

export default function AppHeader() {
  const { user } = useAuth() as { user: User | undefined };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = "/";
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const usagePercentage = ((user?.supportRequestsUsed || 0) / (user?.supportRequestsLimit || 20)) * 100;

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-purple-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-3">
          <div className="flex items-center space-x-6">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Concern2Care
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1">Smart Support Tools</p>
                </div>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl px-4 py-2"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl px-4 py-2"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/my-support-requests">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl px-4 py-2"
                >
                  <History className="h-4 w-4 mr-2" />
                  My Requests
                </Button>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Enhanced Usage indicator */}
            {user && (
              <div className="hidden lg:flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full px-4 py-2 border border-purple-100">
                <div className="w-8 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user.supportRequestsUsed || 0}/{user.supportRequestsLimit || 20}
                </span>
              </div>
            )}
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              {user && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  {user.school && (
                    <p className="text-xs text-gray-500">{user.school}</p>
                  )}
                </div>
              )}
              
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">
                  {getInitials(user?.firstName || undefined, user?.lastName || undefined)}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 hover:border-red-300 border-gray-300 ml-3"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
