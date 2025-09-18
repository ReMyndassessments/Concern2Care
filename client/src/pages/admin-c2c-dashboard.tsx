import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
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
  ArrowLeft
} from "lucide-react";
import TeacherManagement from "@/components/teacher-management";
import ApiKeyManagement from "@/components/api-key-management";
import SchoolExport from "@/components/school-export";
import SchoolEmailSettings from "@/components/school-email-settings";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import FeatureFlagManagement from "@/components/feature-flag-management";
import DemoProgramManagement from "@/components/demo-program-management";
import AppHeader from "@/components/app-header";
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

export default function AdminC2CDashboard() {
  const { toast } = useToast();
  const { isFeatureEnabled } = useFeatureFlags();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('GET', '/api/admin/dashboard-stats');
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [toast]);

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
                  <FileText className="h-8 w-8 text-blue-600 mr-3" />
                  C2C App Dashboard
                </h1>
                <p className="text-gray-600">Manage your Concern2Care system</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
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
                value="teachers" 
                className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Teachers
              </TabsTrigger>
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
            </TabsList>
          </div>

          <TabsContent value="teachers" className="space-y-6">
            <TeacherManagement />
          </TabsContent>

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
            {/* Stats Overview */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-green-600">
                      +{stats.activeUsersThisMonth} active this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Student Concerns</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalConcerns}</div>
                    <p className="text-xs text-green-600">
                      +{stats.usageStats.percentChange.toFixed(1)}% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">AI Interventions</CardTitle>
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalInterventions}</div>
                    <p className="text-xs text-muted-foreground">
                      Generated this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Usage</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.usageStats.thisMonth}</div>
                    <p className="text-xs text-green-600">
                      Requests this month
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}

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
                      <p className="text-2xl font-bold text-blue-600">{stats?.usageStats.thisMonth}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Month</p>
                      <p className="text-2xl font-bold text-gray-400">{stats?.usageStats.lastMonth}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600 font-medium">
                        +{stats?.usageStats.percentChange.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">Growth</p>
                    </div>
                  </div>
                  
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      Your system is experiencing healthy growth with consistent teacher engagement 
                      and strong adoption rates across all registered schools.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Security & Compliance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security & Compliance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
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
    </div>
  );
}