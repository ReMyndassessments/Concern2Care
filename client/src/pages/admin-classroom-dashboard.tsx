import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { 
  BookOpen, 
  Users, 
  FileText, 
  Shield, 
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Send,
  Mail,
  Settings,
  Save,
  Loader2
} from "lucide-react";
import ClassroomTeacherEnrollment from "@/components/classroom-teacher-enrollment";
import ClassroomSubmissionsManagement from "@/components/classroom-submissions-management";
import AppHeader from "@/components/app-header";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminClassroomDashboard() {
  const { isFeatureEnabled } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState("overview");
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const { toast } = useToast();

  // Email configuration state
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
    toEmail: "ne_roberts@yahoo.com"
  });

  // Fetch existing email configuration
  const { data: existingEmailConfig } = useQuery({
    queryKey: ['/api/admin/email-config'],
    select: (data) => data || {}
  });

  // Update state when data is loaded
  useEffect(() => {
    if (existingEmailConfig) {
      setEmailConfig(prev => ({
        ...prev,
        ...existingEmailConfig
      }));
    }
  }, [existingEmailConfig]);

  // Save email configuration mutation
  const saveEmailConfigMutation = useMutation({
    mutationFn: (config) => apiRequest('/api/admin/email-config', {
      method: 'POST',
      body: config
    }),
    onSuccess: () => {
      toast({
        title: "Email configuration saved",
        description: "Contact form email settings have been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-config'] });
      setShowEmailConfig(false);
    },
    onError: (error) => {
      toast({
        title: "Error saving configuration",
        description: error.message || "Failed to save email configuration",
        variant: "destructive"
      });
    }
  });

  if (!isFeatureEnabled('classroom_solutions_enabled')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Feature Not Available</h2>
            <p className="text-gray-600 mb-4">
              Classroom Solutions is not currently enabled for your system.
            </p>
            <Link href="/admin">
              <Button variant="outline">Return to Admin Portal</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline" size="sm" data-testid="button-back-to-selector">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Program Selector
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <BookOpen className="h-8 w-8 text-orange-600 mr-3" />
                  Classroom Solutions Dashboard
                </h1>
                <p className="text-gray-600">Manage your QR-code classroom support system</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <Shield className="h-4 w-4 mr-2" />
              Administrator
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="border-b border-gray-200">
            <TabsList className="flex flex-wrap w-full justify-start bg-transparent h-auto p-0 gap-1">
              <TabsTrigger 
                value="overview" 
                className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="submissions" 
                className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Submissions
              </TabsTrigger>
              <TabsTrigger 
                value="teachers" 
                className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Teacher Enrollment
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="submissions" className="space-y-6">
            <ClassroomSubmissionsManagement />
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            <ClassroomTeacherEnrollment />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Classroom Solutions Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Advanced analytics for Classroom Solutions are coming soon. 
                    Track submission patterns, teacher usage, and AI generation success rates.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrolled Teachers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-green-600">
                    +3 this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4</div>
                  <p className="text-xs text-yellow-600">
                    Awaiting admin action
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Urgent Flagged</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1</div>
                  <p className="text-xs text-red-600">
                    Requires immediate attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
                  <Send className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-green-600">
                    Successfully delivered
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>System Status & Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Delayed Delivery System</p>
                        <p className="text-sm text-gray-600">30-minute review window active</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Urgent Keyword Detection</p>
                        <p className="text-sm text-gray-600">Real-time safety monitoring</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Auto-Send Processor</p>
                        <p className="text-sm text-gray-600">Background processing every 5 minutes</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Universal Disclaimers</p>
                        <p className="text-sm text-gray-600">Professional review requirements</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Admin Review Workflow</p>
                        <p className="text-sm text-gray-600">Approve, hold, cancel, escalate options</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">QR Code Access</p>
                        <p className="text-sm text-gray-600">Easy teacher enrollment system</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Form Email Configuration */}
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
                        placeholder="noreply@concern2care.com"
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setActiveTab("submissions")}
                    className="w-full justify-start"
                    variant="outline"
                    data-testid="button-quick-submissions"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Review Submissions
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab("teachers")}
                    className="w-full justify-start"
                    variant="outline"
                    data-testid="button-quick-teachers"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Teachers
                  </Button>
                  
                  <Button 
                    className="w-full justify-start"
                    variant="outline"
                    data-testid="button-quick-analytics"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Safety Notice */}
            <Alert className="border-amber-200 bg-amber-50">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Production-Ready Safety Features:</strong> This system includes urgent keyword detection, 
                delayed delivery with admin review, universal disclaimers, and comprehensive audit trails 
                to ensure safe and professional AI-generated classroom solutions.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}