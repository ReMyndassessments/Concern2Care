import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
// import Login from "@/pages/login";
import TestLogin from "./test-login";
import Home from "@/pages/home";
import MySupportRequests from "@/pages/my-support-requests";
import ConcernDetail from "@/pages/concern-detail";
import TeacherMeetingPrep from "@/pages/teacher-meeting-prep";
import Settings from "@/pages/settings";
import AdminPage from "@/pages/admin-page";
import NotFound from "@/pages/not-found";
// import Register from "@/pages/register";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Simplified routing - always show pages, auth determines content
  if (isLoading) {
    // Show immediate loading state
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

  return (
    <Switch>
      <Route path="/" component={!isAuthenticated ? Landing : Home} />
      <Route path="/login" component={TestLogin} />
      {isAuthenticated ? (
        <>
          <Route path="/admin" component={AdminPage} />
          <Route path="/admin/*" component={AdminPage} />
          <Route path="/new-request" component={Home} />
          <Route path="/my-support-requests" component={MySupportRequests} />
          <Route path="/meeting-prep" component={TeacherMeetingPrep} />
          <Route path="/settings" component={Settings} />
          <Route path="/concerns/:id" component={ConcernDetail} />
        </>
      ) : (
        <>
          {/* Redirect authenticated routes to login when not authenticated */}
          <Route path="/admin" component={() => { window.location.href = '/login'; return null; }} />
          <Route path="/admin/*" component={() => { window.location.href = '/login'; return null; }} />
          <Route path="/new-request" component={() => { window.location.href = '/login'; return null; }} />
          <Route path="/my-support-requests" component={() => { window.location.href = '/login'; return null; }} />
          <Route path="/meeting-prep" component={() => { window.location.href = '/login'; return null; }} />
          <Route path="/settings" component={() => { window.location.href = '/login'; return null; }} />
          <Route path="/concerns/:id" component={() => { window.location.href = '/login'; return null; }} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
