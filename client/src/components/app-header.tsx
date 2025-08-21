import { useAuth } from "@/hooks/useAuth";
import { Heart, LogOut, BarChart3, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { Link } from "wouter";

export default function AppHeader() {
  const { user } = useAuth() as { user: User | undefined };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-brand-blue rounded-lg flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Concern2Care</h1>
              </div>
            </Link>
            
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 ml-4"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Usage indicator */}
            {user && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <BarChart3 className="h-4 w-4 text-brand-blue" />
                <span>
                  {user.supportRequestsUsed || 0}/{user.supportRequestsLimit || 20} requests used
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              {user && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  {user.school && (
                    <p className="text-xs text-gray-600">{user.school}</p>
                  )}
                </div>
              )}
              
              <div className="w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {getInitials(user?.firstName || undefined, user?.lastName || undefined)}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
