import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./lib/i18n";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Home from "@/pages/home";
import MySupportRequests from "@/pages/my-support-requests";
import ConcernDetail from "@/pages/concern-detail";
import TeacherMeetingPrep from "@/pages/teacher-meeting-prep";
import Settings from "@/pages/settings";
import AdminPage from "@/pages/admin-page";
import AdminProgramSelector from "@/pages/admin-program-selector";
import AdminC2CDashboard from "@/pages/admin-c2c-dashboard";
import AdminClassroomDashboard from "@/pages/admin-classroom-dashboard";
import ClassroomSubmit from "@/pages/classroom-submit";
import NotFound from "@/pages/not-found";

// Component that handles authenticated routes
function AuthenticatedRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-lg animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login for protected routes
    window.location.href = '/login';
    return null;
  }

  return (
    <Switch>
      {/* Redirect root to appropriate dashboard */}
      <Route path="/" component={() => { 
        const redirectPath = user?.isAdmin ? '/admin' : '/home';
        window.location.replace(redirectPath);
        return null;
      }} />
      
      {/* Admin routes */}
      {user?.isAdmin ? (
        <>
          <Route path="/admin" component={AdminProgramSelector} />
          <Route path="/admin/c2c-dashboard" component={AdminC2CDashboard} />
          <Route path="/admin/classroom-dashboard" component={AdminClassroomDashboard} />
          {/* Legacy admin route for backward compatibility */}
          <Route path="/admin/dashboard" component={AdminPage} />
          {/* Block teacher-only routes for admins */}
          <Route path="/new-request" component={() => { window.location.href = '/'; return null; }} />
          <Route path="/my-support-requests" component={() => { window.location.href = '/'; return null; }} />
          <Route path="/meeting-prep" component={() => { window.location.href = '/'; return null; }} />
          <Route path="/settings" component={() => { window.location.href = '/'; return null; }} />
          <Route path="/concerns/:id" component={() => { window.location.href = '/'; return null; }} />
        </>
      ) : (
        <>
          {/* Teacher routes */}
          <Route path="/home" component={Home} />
          <Route path="/new-request" component={Home} />
          <Route path="/my-support-requests" component={MySupportRequests} />
          <Route path="/meeting-prep" component={TeacherMeetingPrep} />
          <Route path="/settings" component={Settings} />
          <Route path="/concerns/:id" component={ConcernDetail} />
          {/* Block admin routes for teachers */}
          <Route path="/admin" component={() => { window.location.href = '/'; return null; }} />
          <Route path="/admin/*" component={() => { window.location.href = '/'; return null; }} />
        </>
      )}
      {/* Redirect login and register to appropriate home when authenticated */}
      <Route path="/login" component={() => { window.location.href = user?.isAdmin ? '/admin' : '/'; return null; }} />
      <Route path="/register" component={() => { window.location.href = user?.isAdmin ? '/admin' : '/'; return null; }} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      {/* Landing page - FIRST PRIORITY */}
      <Route path="/" component={Landing} />
      
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Classroom submission routes */}
      <Route path="/classroom-submit" component={ClassroomSubmit} />
      <Route path="/classroom/submit" component={ClassroomSubmit} />
      <Route path="/classroom" component={ClassroomSubmit} />
      
      {/* Authenticated routes */}
      <Route path="/admin" component={AuthenticatedRouter} />
      <Route path="/admin/*" component={AuthenticatedRouter} />
      <Route path="/home" component={AuthenticatedRouter} />
      <Route path="/new-request" component={AuthenticatedRouter} />
      <Route path="/my-support-requests" component={AuthenticatedRouter} />
      <Route path="/meeting-prep" component={AuthenticatedRouter} />
      <Route path="/settings" component={AuthenticatedRouter} />
      <Route path="/concerns/:id" component={AuthenticatedRouter} />
      
      {/* 404 fallback - explicit wildcard */}
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
