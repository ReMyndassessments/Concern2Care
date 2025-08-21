import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { ReferralForm } from './components/ReferralForm';
import { ReferralList } from './components/ReferralList';
import { MeetingPreparation } from './components/MeetingPreparation';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { TeacherLogin } from './components/TeacherLogin';
import { PasswordResetRequest } from './components/PasswordResetRequest';
import { PasswordResetConfirm } from './components/PasswordResetConfirm';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherManagement } from './components/TeacherManagement';
import { AdminSystemSettings } from './components/AdminSystemSettings';
import { AdminDemoData } from './components/AdminDemoData';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AuthProvider, useAuth } from './hooks/useAuth';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center animate-pulse mx-auto mb-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ isAllowed, redirectPath = '/teacher-login' }: { isAllowed: boolean, redirectPath?: string }) {
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }
  return <Outlet />;
}

function AppInner() {
  const { isLoading, user, isAdmin } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navigation />
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/teacher-login" element={<TeacherLogin />} />
          <Route path="/forgot-password" element={<PasswordResetRequest />} />
          <Route path="/reset-password" element={<PasswordResetConfirm />} />
          <Route path="/subscription/plans" element={<SubscriptionPlans />} />

          {/* Authenticated Routes (Teacher & Admin) */}
          <Route element={<ProtectedRoute isAllowed={!!user} />}>
            <Route path="/new-referral" element={<ReferralForm />} />
            <Route path="/referrals" element={<ReferralList />} />
            <Route path="/meeting/:referralId" element={<MeetingPreparation />} />
          </Route>

          {/* Admin Only Routes */}
          <Route element={<ProtectedRoute isAllowed={isAdmin} redirectPath="/" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
            <Route path="/admin/teachers" element={<TeacherManagement />} />
            <Route path="/admin/system-settings" element={<AdminSystemSettings />} />
            <Route path="/admin/demo-data" element={<AdminDemoData />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </Router>
  );
}
