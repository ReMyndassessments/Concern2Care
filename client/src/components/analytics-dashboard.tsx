import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  FileText, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  School,
  Activity,
  Calendar
} from 'lucide-react';

interface DashboardAnalytics {
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
  recentActivity: any[];
  dailyStats: any[];
}

export default function AnalyticsDashboard() {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['/api/analytics/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/dashboard');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <p className="text-red-800">Failed to load analytics data. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const isGrowthPositive = analytics.usageStats.percentChange > 0;
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="metric-total-users">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold">{analytics.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-total-schools">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <School className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Schools</p>
                <p className="text-2xl font-bold">{analytics.totalSchools}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-total-concerns">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Student Concerns</p>
                <p className="text-2xl font-bold">{analytics.totalConcerns}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-total-interventions">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">AI Interventions</p>
                <p className="text-2xl font-bold">{analytics.totalInterventions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="usage-trends">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Usage Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">This Month</span>
                <Badge variant="outline" className="text-lg font-bold">
                  {analytics.usageStats.thisMonth}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Month</span>
                <Badge variant="secondary">
                  {analytics.usageStats.lastMonth}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Change</span>
                <Badge 
                  variant={isGrowthPositive ? "default" : "destructive"}
                  className="flex items-center gap-1"
                  data-testid="usage-change"
                >
                  {isGrowthPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatPercentage(analytics.usageStats.percentChange)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="active-users">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Active Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active This Month</span>
                <Badge variant="default" className="text-lg font-bold">
                  {analytics.activeUsersThisMonth}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Engagement Rate</span>
                <Badge variant="secondary">
                  {analytics.totalUsers > 0 
                    ? Math.round((analytics.activeUsersThisMonth / analytics.totalUsers) * 100)
                    : 0}%
                </Badge>
              </div>
              <div className="text-xs text-gray-500">
                Teachers who created concerns this month
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card data-testid="recent-activity">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Admin Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity && analytics.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentActivity.slice(0, 5).map((activity: any, index) => (
                <div 
                  key={activity.id || index} 
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                  data-testid={`activity-item-${index}`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.action?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.details?.email || activity.details?.schoolName || 'System action'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity to display</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}