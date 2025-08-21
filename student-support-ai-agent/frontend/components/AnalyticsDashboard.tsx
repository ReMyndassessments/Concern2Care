import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, Users, FileText, AlertTriangle, School, Clock, Target, BarChart3, PieChart, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import backend from '~backend/client';
import type { AnalyticsDashboard as AnalyticsData } from '~backend/analytics/dashboard-analytics';

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await backend.analytics.getDashboardAnalytics();
      setAnalytics(response);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center animate-pulse mx-auto mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl">
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No analytics data available.</p>
            <Link to="/admin" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
              Return to Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights into student support activities</p>
          </div>
          <Link to="/admin">
            <button className="bg-white/60 hover:bg-white/80 px-4 py-2 rounded-xl text-gray-700 font-medium transition-colors">
              ← Back to Admin
            </button>
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Requests</h3>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalSupportRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Active Teachers</h3>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalTeachers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Avg per Teacher</h3>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.averageRequestsPerTeacher}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Urgent Cases</h3>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.urgentRequestsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Top Concern</h3>
                  <p className="text-lg font-bold text-gray-900">{analytics.overview.mostCommonConcernType}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trends Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Requests by Month */}
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-3xl">
              <CardTitle className="flex items-center gap-3">
                <Calendar className="h-6 w-6" />
                Requests by Month
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analytics.trends.requestsByMonth.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.month}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                          style={{ width: `${Math.min((item.count / Math.max(...analytics.trends.requestsByMonth.map(r => r.count))) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Concern Type Distribution */}
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-3xl">
              <CardTitle className="flex items-center gap-3">
                <PieChart className="h-6 w-6" />
                Concern Types
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analytics.trends.concernTypeDistribution.slice(0, 6).map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{item.type}</span>
                      <span className="text-sm font-bold text-gray-900">{item.percentage}%</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Severity and Location Distribution */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Severity Distribution */}
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-3xl">
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6" />
                Severity Levels
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analytics.trends.severityDistribution.map((item, index) => {
                  const colors = {
                    mild: 'from-green-500 to-emerald-500',
                    moderate: 'from-yellow-500 to-orange-500',
                    urgent: 'from-red-500 to-pink-500'
                  };
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Badge className={`bg-gradient-to-r ${colors[item.level as keyof typeof colors] || 'from-gray-500 to-gray-600'} text-white`}>
                          {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
                        </Badge>
                        <span className="text-sm font-medium text-gray-700">{item.count} requests</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{item.percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Location Distribution */}
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-3xl">
              <CardTitle className="flex items-center gap-3">
                <School className="h-6 w-6" />
                Common Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {analytics.trends.locationDistribution.slice(0, 8).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{item.location}</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher Insights and Student Outcomes */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Most Active Teachers */}
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-3xl">
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6" />
                Most Active Teachers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analytics.teacherInsights.mostActiveTeachers.slice(0, 8).map((teacher, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">{teacher.name}</p>
                      <p className="text-xs text-gray-600">{teacher.school}</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                      {teacher.requestCount} requests
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Student Outcomes */}
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-3xl">
              <CardTitle className="flex items-center gap-3">
                <Target className="h-6 w-6" />
                Student Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Follow-up Rate</span>
                  <span className="text-sm font-bold text-gray-900">{analytics.studentOutcomes.followUpRate}%</span>
                </div>
                <Progress value={analytics.studentOutcomes.followUpRate} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Intervention Success</span>
                  <span className="text-sm font-bold text-gray-900">{analytics.studentOutcomes.interventionSuccessRate}%</span>
                </div>
                <Progress value={analytics.studentOutcomes.interventionSuccessRate} className="h-2" />
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Avg. Response Time</span>
                </div>
                <span className="text-sm font-bold text-green-900">{analytics.teacherInsights.averageResponseTime}h</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">Avg. Duration</span>
                </div>
                <span className="text-sm font-bold text-emerald-900">{analytics.studentOutcomes.averageInterventionDuration} days</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
