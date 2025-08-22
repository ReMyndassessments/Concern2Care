import { useAuth } from "@/hooks/useAuth";
import { Sparkles, LogOut, BarChart3, Home, History, Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { Link } from "wouter";
import { useState } from "react";

export default function AppHeader() {
  const { user } = useAuth() as { user: User | undefined };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* Logo - Mobile Responsive */}
          <div className="flex items-center space-x-2 flex-shrink-0 min-w-0">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer hover:scale-105 transition-transform">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate">
                    Concern2Care
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1 hidden sm:block">Smart Support Tools</p>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {!user?.isAdmin && (
              <>
                <Link href="/">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl px-3 py-2">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </Link>
                <Link href="/my-support-requests">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl px-3 py-2">
                    <History className="h-4 w-4 mr-2" />
                    My Requests
                  </Button>
                </Link>
              </>
            )}
            {user?.isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl px-3 py-2">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Button>
              </Link>
            )}
          </nav>
          
          {/* Right Side - Mobile Responsive */}
          <div className="flex items-center space-x-2">
            {/* Usage indicator - Hidden on mobile */}
            {user && (
              <div className="hidden xl:flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full px-3 py-2 border border-purple-100">
                <div className="w-6 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      usagePercentage >= 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      usagePercentage >= 75 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
                <span className={`text-xs font-medium ${
                  usagePercentage >= 90 ? 'text-red-600' :
                  usagePercentage >= 75 ? 'text-orange-600' :
                  'text-gray-700'
                }`}>
                  {user.supportRequestsUsed || 0}/{user.supportRequestsLimit || 20}
                </span>
              </div>
            )}
            
            {/* User Profile - Responsive */}
            {user && (
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-32">
                  {user.firstName} {user.lastName}
                </p>
                {user.school && (
                  <p className="text-xs text-gray-500 truncate max-w-32">{user.school}</p>
                )}
              </div>
            )}
            
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white text-xs sm:text-sm font-bold">
                {getInitials(user?.firstName || undefined, user?.lastName || undefined)}
              </span>
            </div>
            
            {/* Desktop Sign Out */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:flex text-gray-600 hover:text-red-600 hover:border-red-300 border-gray-300 text-xs px-2 py-1"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Sign Out
            </Button>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-gray-600 hover:text-purple-600 p-2"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 bg-white/95 backdrop-blur-md">
            <nav className="flex flex-col space-y-2">
              {!user?.isAdmin && (
                <>
                  <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl px-4 py-3">
                      <BarChart3 className="h-4 w-4 mr-3" />
                      New Request
                    </Button>
                  </Link>
                  <Link href="/my-support-requests" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl px-4 py-3">
                      <History className="h-4 w-4 mr-3" />
                      My Requests
                    </Button>
                  </Link>
                </>
              )}
              {user?.isAdmin && (
                <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl px-4 py-3">
                    <Shield className="h-4 w-4 mr-3" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              
              {/* Mobile Usage Stats */}
              {user && (
                <div className="px-4 py-2 mt-4 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">Usage This Month</div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user.supportRequestsUsed || 0}/{user.supportRequestsLimit || 20}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Mobile Sign Out */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="mx-4 mt-4 text-gray-600 hover:text-red-600 hover:border-red-300 border-gray-300 justify-start"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
