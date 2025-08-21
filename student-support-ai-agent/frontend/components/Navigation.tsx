import { Link, useLocation } from 'react-router-dom';
import { Home, Menu, X, GraduationCap, FileText, Users, LogOut, CreditCard, User, Wifi, WifiOff, Shield, Settings, Database, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '../hooks/useAuth';

export function Navigation() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsMobileMenuOpen(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const adminNavItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/admin', icon: Shield, label: 'Dashboard' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/teachers', icon: Users, label: 'Teachers' },
    { to: '/admin/system-settings', icon: Settings, label: 'Settings' },
    { to: '/admin/demo-data', icon: Database, label: 'Demo Data' },
    { to: '/new-referral', icon: FileText, label: 'New Request' },
    { to: '/referrals', icon: FileText, label: 'All Requests' }
  ];

  const teacherNavItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/new-referral', icon: FileText, label: 'New Support Request' },
    { to: '/referrals', icon: Users, label: 'My Support Requests' }
  ];

  const guestNavItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/teacher-login', icon: User, label: 'Teacher Login' },
    { to: '/subscription/plans', icon: CreditCard, label: 'Subscribe' }
  ];

  const navItems = isAdmin ? adminNavItems : (user ? teacherNavItems : guestNavItems);

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity touch-manipulation">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Concern2Care
                </div>
                {isAdmin && (
                  <div className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 text-xs font-medium rounded-md sm:rounded-lg">
                    ADMIN
                  </div>
                )}
                {user && !isAdmin && (
                  <div className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 text-xs font-medium rounded-md sm:rounded-lg">
                    TEACHER
                  </div>
                )}
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 hover:shadow-md'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Authentication and Notifications */}
              <div className="ml-4 flex items-center space-x-2">
                {user && <NotificationCenter />}
                {user && (
                  <Button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl touch-manipulation"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden xl:inline">{isLoggingOut ? 'Logging Out...' : 'Logout'}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              <div className="flex items-center">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
              </div>
              
              {user && <NotificationCenter />}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl hover:bg-white/60 touch-manipulation active:scale-95 transition-transform"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">
                    {isAdmin ? 'Admin Menu' : (user ? 'Teacher Menu' : 'Menu')}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 touch-manipulation active:scale-95 transition-transform"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="px-4 py-2 border-b border-gray-100">
                <div className={`flex items-center text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? (
                    <>
                      <Wifi className="h-4 w-4 mr-2" />
                      Connected
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 mr-2" />
                      Offline Mode
                    </>
                  )}
                </div>
              </div>
              
              {user && (
                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="text-sm text-blue-800">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-blue-600">{user.email}</div>
                  </div>
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto py-4">
                <div className="space-y-2 px-4">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-base font-medium transition-all duration-200 touch-manipulation active:scale-95 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200">
                {user && (
                  <Button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    variant="outline"
                    className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl touch-manipulation active:scale-95 transition-transform"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isLoggingOut ? 'Logging Out...' : 'Logout'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
