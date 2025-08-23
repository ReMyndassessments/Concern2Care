import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/app-header";
import EmailSettings from "@/components/email-settings";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@shared/schema";
import { Settings as SettingsIcon, Mail, User as UserIcon, Bell } from "lucide-react";

export default function Settings() {
  const { user } = useAuth() as { user: User | undefined };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <AppHeader />
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 left-1/4 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-64 right-1/3 w-24 h-24 bg-blue-200 rounded-full opacity-30 blur-lg"></div>
        <div className="absolute bottom-32 left-1/5 w-28 h-28 bg-indigo-200 rounded-full opacity-25 blur-xl"></div>
      </div>
      
      <div className="relative max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                <SettingsIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-gray-600">Manage your account preferences and configurations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 gap-1">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Configuration
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserIcon className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {user?.firstName || 'Not Set'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {user?.lastName || 'Not Set'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {user?.email || 'Not Set'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Account Type</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                      <span>{user?.isAdmin ? 'Administrator' : 'Teacher'}</span>
                      {user?.isAdmin && (
                        <Badge variant="default" className="bg-purple-100 text-purple-800">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {user?.supportRequestsUsed || 0}
                      </div>
                      <p className="text-sm text-gray-600">Requests Used</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {(user?.supportRequestsLimit || 20) - (user?.supportRequestsUsed || 0)}
                      </div>
                      <p className="text-sm text-gray-600">Requests Remaining</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {user?.supportRequestsLimit || 20}
                      </div>
                      <p className="text-sm text-gray-600">Monthly Limit</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <EmailSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive email updates for important events</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300"
                      data-testid="checkbox-email-notifications"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Report Generation Alerts</h4>
                      <p className="text-sm text-gray-600">Get notified when PDF reports are ready</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300"
                      data-testid="checkbox-report-alerts"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">System Updates</h4>
                      <p className="text-sm text-gray-600">Receive notifications about system maintenance and updates</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300"
                      data-testid="checkbox-system-updates"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}