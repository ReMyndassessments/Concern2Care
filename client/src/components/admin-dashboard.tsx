import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { 
  Shield, 
  Users, 
  FileText, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  Database,
  Settings,
  BarChart3,
  LogOut,
  Mail,
  Save,
  Loader2
} from "lucide-react";
import TeacherManagement from "@/components/teacher-management";
import ClassroomTeacherEnrollment from "@/components/classroom-teacher-enrollment";
import ClassroomSubmissionsManagement from "@/components/classroom-submissions-management";
import ApiKeyManagement from "@/components/api-key-management";
import SchoolExport from "@/components/school-export";
import SchoolEmailSettings from "@/components/school-email-settings";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import FeatureFlagManagement from "@/components/feature-flag-management";
import DemoProgramManagement from "@/components/demo-program-management";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface DashboardStats {
  totalUsers: number;
  totalSchools: number;
  totalConcerns: number;
  totalInterventions: number;
  activeUsersThisMonth: number;
  usageStats: {
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
}


export default function AdminDashboard() {
  const { toast } = useToast();
  const { isFeatureEnabled } = useFeatureFlags();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Email configuration state
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    toEmail: 'ne_roberts@yahoo.com'
  });

  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    
    // Always clear cache and redirect, regardless of fetch success
    queryClient.clear(); // Clear all cache
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    
    // Force immediate redirect to landing page
    window.location.href = "/";
  };

  // Fetch email configuration
  const { data: fetchedEmailConfig } = useQuery({
    queryKey: ['/api/admin/email-config'],
    queryFn: async () => {
      return apiRequest('GET', '/api/admin/email-config');
    },
    onSuccess: (data) => {
      setEmailConfig(data);
    }
  });

  // Email configuration mutation
  const saveEmailConfigMutation = useMutation({
    mutationFn: async (config: typeof emailConfig) => {
      return apiRequest('POST', '/api/admin/email-config', config);
    },
    onSuccess: () => {
      toast({
        title: "Email Configuration Saved",
        description: "Contact form email notifications are now configured.",
      });
      setShowEmailConfig(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save email configuration.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      // Fetch real statistics from the admin API
      const response = await apiRequest('/api/admin/dashboard-stats');
      
      setStats(response);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Alert className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load dashboard statistics. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600">Manage your Concern2Care system</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 md:h-5 md:w-5 text-brand-blue" />
            <Badge variant="secondary" className="text-xs md:text-sm">Administrator</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-600 hover:border-red-300 border-gray-300 text-xs md:text-sm w-full sm:w-auto"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Teachers</p>
                <p className="text-xl md:text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
            <p className="text-xs md:text-sm text-green-600 mt-2">
              +{stats.activeUsersThisMonth} active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Student Concerns</p>
                <p className="text-xl md:text-3xl font-bold text-gray-900">{stats.totalConcerns}</p>
              </div>
              <FileText className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
            </div>
            <p className="text-xs md:text-sm text-green-600 mt-2">
              +{stats.usageStats.percentChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">AI Interventions</p>
                <p className="text-xl md:text-3xl font-bold text-gray-900">{stats.totalInterventions}</p>
              </div>
              <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
            <p className="text-xs md:text-sm text-gray-600 mt-2">
              Generated this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">System Usage</p>
                <p className="text-xl md:text-3xl font-bold text-gray-900">{stats.usageStats.thisMonth}</p>
              </div>
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
            </div>
            <p className="text-xs md:text-sm text-green-600 mt-2">
              Requests this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email Configuration Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Contact Form Email Configuration</CardTitle>
                <p className="text-sm text-gray-600">Configure email settings for contact form notifications</p>
              </div>
            </div>
            <Button
              onClick={() => setShowEmailConfig(!showEmailConfig)}
              variant="outline"
              data-testid="button-email-config-toggle"
            >
              <Settings className="h-4 w-4 mr-2" />
              {showEmailConfig ? 'Hide Config' : 'Configure Email'}
            </Button>
          </div>
        </CardHeader>
        
        {showEmailConfig && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">SMTP Host</label>
                <Input
                  value={emailConfig.smtpHost}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                  placeholder="smtp.gmail.com"
                  data-testid="input-smtp-host"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">SMTP Port</label>
                <Input
                  value={emailConfig.smtpPort}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpPort: e.target.value }))}
                  placeholder="587"
                  data-testid="input-smtp-port"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">SMTP Username</label>
                <Input
                  value={emailConfig.smtpUser}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpUser: e.target.value }))}
                  placeholder="your-email@gmail.com"
                  data-testid="input-smtp-user"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">SMTP Password</label>
                <Input
                  type="password"
                  value={emailConfig.smtpPassword}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpPassword: e.target.value }))}
                  placeholder="Your app password"
                  data-testid="input-smtp-password"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">From Email</label>
                <Input
                  value={emailConfig.fromEmail}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                  placeholder="noreply@app.com"
                  data-testid="input-from-email"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Notification Email</label>
                <Input
                  value={emailConfig.toEmail}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, toEmail: e.target.value }))}
                  placeholder="ne_roberts@yahoo.com"
                  data-testid="input-to-email"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEmailConfig(false)}
                data-testid="button-cancel-email-config"
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveEmailConfigMutation.mutate(emailConfig)}
                disabled={saveEmailConfigMutation.isPending || !emailConfig.smtpHost || !emailConfig.smtpUser}
                data-testid="button-save-email-config"
              >
                {saveEmailConfigMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Mobile: Scrollable horizontal tabs */}
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex min-w-full w-max h-auto p-1 bg-muted rounded-md">
            <TabsTrigger 
              value="overview" 
              className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="teachers" 
              className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              Teachers
            </TabsTrigger>
            {isFeatureEnabled('classroom_solutions_enabled') && (
              <TabsTrigger 
                value="classroom-solutions" 
                className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Classroom Solutions
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="email" 
              className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              Email
            </TabsTrigger>
            <TabsTrigger 
              value="data-export" 
              className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              Data Export
            </TabsTrigger>
            <TabsTrigger 
              value="api-keys" 
              className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              API Keys
            </TabsTrigger>
            <TabsTrigger 
              value="feature-flags" 
              className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              Feature Flags
            </TabsTrigger>
            {isFeatureEnabled('demo_program') && (
              <TabsTrigger 
                value="demo-program" 
                className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Demo Program
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="analytics" 
              className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="teachers" className="space-y-6">
          <TeacherManagement />
        </TabsContent>

        {isFeatureEnabled('classroom_solutions_enabled') && (
          <TabsContent value="classroom-solutions" className="space-y-6">
            <ClassroomTeacherEnrollment />
            <ClassroomSubmissionsManagement />
          </TabsContent>
        )}

        <TabsContent value="email" className="space-y-6">
          <SchoolEmailSettings />
        </TabsContent>

        <TabsContent value="data-export" className="space-y-6">
          <SchoolExport />
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <ApiKeyManagement />
        </TabsContent>

        <TabsContent value="feature-flags" className="space-y-6">
          <FeatureFlagManagement />
        </TabsContent>

        {isFeatureEnabled('demo_program') && (
          <TabsContent value="demo-program" className="space-y-6">
            <DemoProgramManagement />
          </TabsContent>
        )}

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          {/* Usage Chart Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Monthly Usage Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.usageStats.thisMonth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Month</p>
                    <p className="text-2xl font-bold text-gray-400">{stats.usageStats.lastMonth}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600 font-medium">
                      +{stats.usageStats.percentChange.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Growth</p>
                  </div>
                </div>
                
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Usage is trending upward. Teachers are actively using the AI intervention system.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* System Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">AI Service</span>
                  <Badge className="bg-green-100 text-green-800">Operational</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Database</span>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Email Service</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Limited</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Authentication</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>System Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">AI Model</p>
                  <p className="text-sm text-gray-600">DeepSeek Chat Model</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Request Limits</p>
                  <p className="text-sm text-gray-600">20 requests per teacher per month</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Data Backup</p>
                  <p className="text-sm text-gray-600">Automatic daily backups enabled</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All student data is encrypted and FERPA compliant. Access logs are maintained for security.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}