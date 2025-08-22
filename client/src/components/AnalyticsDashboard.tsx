import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Sparkles,
  Calendar,
  Activity,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DashboardAnalytics {
  overview: {
    totalTeachers: number;
    activeTeachers: number;
    totalConcerns: number;
    recentConcerns: number;
    totalInterventions: number;
    averageRequestsPerTeacher: string;
  };
  topSchools: Array<{
    school: string;
    teacher_count: number;
    total_requests: number;
  }>;
  dailyTrends: Array<{
    date: string;
    concerns_created: number;
  }>;
  usageStatsByLimit: Array<{
    support_requests_limit: number;
    teacher_count: number;
    avg_used: string;
  }>;
  lastUpdated: string;
}

interface UsageStatistics {
  teacherUsage: Array<{
    id: string;
    name: string;
    email: string;
    school: string;
    support_requests_used: number;
    support_requests_limit: number;
    additional_requests: number;
    total_limit: number;
    usage_percentage: number;
  }>;
  summary: {
    total_teachers: number;
    total_requests_used: number;
    total_requests_available: number;
    avg_requests_per_teacher: string;
    teachers_at_limit: number;
  };
  monthlyTrends: Array<{
    month: string;
    concerns_created: number;
    active_teachers: number;
  }>;
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setRefreshing(true);
      const [analyticsData, usageData] = await Promise.all([
        apiRequest('/api/analytics/dashboard'),
        apiRequest('/api/analytics/usage-stats')
      ]);
      
      setAnalytics(analyticsData);
      setUsageStats(usageData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadAnalytics();
  };

  const handleExportData = async (type: 'overview' | 'usage') => {
    try {
      let data: any;
      let filename: string;
      
      if (type === 'overview') {
        data = analytics;
        filename = 'analytics-overview';
      } else {
        data = usageStats;
        filename = 'usage-statistics';
      }
      
      if (!data) return;
      
      const csvContent = JSON.stringify(data, null, 2);
      const blob = new Blob([csvContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Analytics data has been exported.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data.",
        variant: "destructive",
      });
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${Math.round(num)}%`;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsageBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-analytics">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">System performance and usage insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32" data-testid="select-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            data-testid="button-refresh"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      {analytics?.lastUpdated && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="usage" data-testid="tab-usage">Usage Statistics</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6" data-testid="overview-tab">
          {analytics && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                        <p className="text-2xl font-bold" data-testid="metric-total-teachers">
                          {formatNumber(analytics.overview.totalTeachers)}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {analytics.overview.activeTeachers} active in last 30 days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Concerns</p>
                        <p className="text-2xl font-bold" data-testid="metric-total-concerns">
                          {formatNumber(analytics.overview.totalConcerns)}
                        </p>
                      </div>
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {analytics.overview.recentConcerns} in last 7 days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">AI Interventions</p>
                        <p className="text-2xl font-bold" data-testid="metric-total-interventions">
                          {formatNumber(analytics.overview.totalInterventions)}
                        </p>
                      </div>
                      <Sparkles className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Requests</p>
                        <p className="text-2xl font-bold" data-testid="metric-avg-requests">
                          {analytics.overview.averageRequestsPerTeacher}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Per teacher</p>
                  </CardContent>
                </Card>
              </div>

              {/* Top Schools */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Top Schools by Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3" data-testid="top-schools-list">
                      {analytics.topSchools.slice(0, 5).map((school, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{school.school || 'Unknown School'}</div>
                            <div className="text-sm text-gray-500">
                              {school.teacher_count} teachers
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {school.total_requests} requests
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Usage Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Usage by Limit Tier
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3" data-testid="usage-distribution">
                      {analytics.usageStatsByLimit.map((stat, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {stat.support_requests_limit} requests/month
                            </span>
                            <Badge variant="outline">
                              {stat.teacher_count} teachers
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            Average used: {parseFloat(stat.avg_used).toFixed(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => handleExportData('overview')}
                  data-testid="button-export-overview"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Overview
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Usage Statistics Tab */}
        <TabsContent value="usage" className="space-y-6" data-testid="usage-tab">
          {usageStats && (
            <>
              {/* Usage Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(usageStats.summary.total_teachers)}
                    </div>
                    <div className="text-sm text-gray-600">Total Teachers</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(usageStats.summary.total_requests_used)}
                    </div>
                    <div className="text-sm text-gray-600">Requests Used</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {parseFloat(usageStats.summary.avg_requests_per_teacher).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Avg per Teacher</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {usageStats.summary.teachers_at_limit}
                    </div>
                    <div className="text-sm text-gray-600">At Limit</div>
                  </CardContent>
                </Card>
              </div>

              {/* Teacher Usage Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Usage Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="teacher-usage-list">
                    {usageStats.teacherUsage.map((teacher, index) => (
                      <div key={teacher.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{teacher.name}</div>
                            <div className="text-sm text-gray-500">{teacher.email}</div>
                            <div className="text-sm text-gray-500">{teacher.school || 'No school specified'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {teacher.support_requests_used} / {teacher.total_limit}
                            </div>
                            <div className={`text-sm ${getUsageColor(teacher.usage_percentage)}`}>
                              {formatPercentage(teacher.usage_percentage)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Progress 
                            value={Math.min(teacher.usage_percentage, 100)} 
                            className="h-2"
                            data-testid={`usage-progress-${teacher.id}`}
                          />
                        </div>
                        {teacher.additional_requests > 0 && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              +{teacher.additional_requests} bonus requests
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => handleExportData('usage')}
                  data-testid="button-export-usage"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Usage Data
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6" data-testid="trends-tab">
          {analytics && usageStats && (
            <>
              {/* Daily Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Daily Activity Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2" data-testid="daily-trends">
                    {analytics.dailyTrends.slice(-7).map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="text-sm">
                          {new Date(day.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min((day.concerns_created / Math.max(...analytics.dailyTrends.map(d => d.concerns_created))) * 100, 100)}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">
                            {day.concerns_created}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Monthly Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="monthly-trends">
                    {usageStats.monthlyTrends.map((month, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {new Date(month.month).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long' 
                            })}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">
                                {month.concerns_created}
                              </div>
                              <div className="text-xs text-gray-500">Concerns</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {month.active_teachers}
                              </div>
                              <div className="text-xs text-gray-500">Active Teachers</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}