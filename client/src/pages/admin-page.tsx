import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import AdminDashboard from "@/components/admin-dashboard";

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();

  // Check if user is admin - for now we'll use a simple check
  // In production, this would be verified server-side
  const isAdmin = user?.isAdmin || user?.role === 'admin' || user?.role === 'super_admin';

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h1>
          <p className="text-gray-600">Please log in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Access Denied:</strong> You don't have administrator privileges. 
              This area is restricted to system administrators only.
            </AlertDescription>
          </Alert>
          
          <div className="mt-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Need Admin Access?
            </h2>
            <p className="text-gray-600 mb-4">
              Contact your system administrator to request admin privileges for your account.
            </p>
            <p className="text-sm text-gray-500">
              Current user: {user?.email} | Role: {user?.role || 'teacher'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}