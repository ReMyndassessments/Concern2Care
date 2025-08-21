import { api } from "encore.dev/api";
import { userDB } from "../users/db";
import { referralDB } from "../referrals/db";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";

export interface AnalyticsDashboard {
  overview: {
    totalSupportRequests: number;
    totalTeachers: number;
    averageRequestsPerTeacher: number;
    mostCommonConcernType: string;
    urgentRequestsCount: number;
  };
  trends: {
    requestsByMonth: Array<{ month: string; count: number }>;
    concernTypeDistribution: Array<{ type: string; count: number; percentage: number }>;
    severityDistribution: Array<{ level: string; count: number; percentage: number }>;
    locationDistribution: Array<{ location: string; count: number }>;
  };
  teacherInsights: {
    mostActiveTeachers: Array<{ name: string; requestCount: number; school: string }>;
    schoolDistribution: Array<{ school: string; teacherCount: number; requestCount: number }>;
    averageResponseTime: number; // in hours
  };
  studentOutcomes: {
    followUpRate: number; // percentage of requests with follow-up assistance
    interventionSuccessRate: number; // mock data for now
    averageInterventionDuration: number; // in days
  };
}

// Gets comprehensive analytics dashboard data for administrators.
export const getDashboardAnalytics = api<void, AnalyticsDashboard>(
  { expose: true, method: "GET", path: "/analytics/dashboard", auth: true },
  async () => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    // Overview metrics
    const totalRequestsResult = await referralDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM referrals
    `;
    const totalRequests = totalRequestsResult?.count || 0;

    const totalTeachersResult = await userDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM users
    `;
    const totalTeachers = totalTeachersResult?.count || 0;

    const urgentRequestsResult = await referralDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM referrals WHERE severity_level = 'urgent'
    `;
    const urgentRequests = urgentRequestsResult?.count || 0;

    // Most common concern type
    const topConcernResult = await referralDB.queryRow<{ concern_type: string; count: number }>`
      SELECT 
        TRIM(BOTH '"' FROM jsonb_array_elements_text(concern_types::jsonb)) as concern_type,
        COUNT(*) as count
      FROM referrals 
      WHERE concern_types != '[]'
      GROUP BY concern_type
      ORDER BY count DESC
      LIMIT 1
    `;

    // Requests by month (last 6 months)
    const requestsByMonth = await referralDB.queryAll<{ month: string; count: number }>`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as count
      FROM referrals 
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
    `;

    // Concern type distribution
    const concernDistribution = await referralDB.queryAll<{ concern_type: string; count: number }>`
      SELECT 
        TRIM(BOTH '"' FROM jsonb_array_elements_text(concern_types::jsonb)) as concern_type,
        COUNT(*) as count
      FROM referrals 
      WHERE concern_types != '[]'
      GROUP BY concern_type
      ORDER BY count DESC
    `;

    // Severity distribution
    const severityDistribution = await referralDB.queryAll<{ severity_level: string; count: number }>`
      SELECT severity_level, COUNT(*) as count
      FROM referrals
      GROUP BY severity_level
      ORDER BY count DESC
    `;

    // Location distribution
    const locationDistribution = await referralDB.queryAll<{ location: string; count: number }>`
      SELECT location, COUNT(*) as count
      FROM referrals
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    `;

    // Most active teachers
    const activeTeachers = await referralDB.queryAll<{ teacher: string; count: number }>`
      SELECT teacher, COUNT(*) as count
      FROM referrals
      GROUP BY teacher
      ORDER BY count DESC
      LIMIT 10
    `;

    // School distribution
    const schoolDistribution = await userDB.queryAll<{ school_name: string; teacher_count: number }>`
      SELECT 
        COALESCE(school_name, 'Unknown') as school_name,
        COUNT(*) as teacher_count
      FROM users
      WHERE school_name IS NOT NULL
      GROUP BY school_name
      ORDER BY teacher_count DESC
    `;

    // Follow-up rate (requests with AI recommendations that have follow-up assistance)
    const followUpResult = await referralDB.queryRow<{ total: number; with_followup: number }>`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN ai_recommendations LIKE '%FOLLOW-UP ASSISTANCE%' THEN 1 END) as with_followup
      FROM referrals
      WHERE ai_recommendations IS NOT NULL
    `;

    const followUpRate = followUpResult && followUpResult.total > 0 
      ? Math.round((followUpResult.with_followup / followUpResult.total) * 100)
      : 0;

    // Calculate percentages for distributions
    const concernDistributionWithPercentage = concernDistribution.map(item => ({
      type: item.concern_type,
      count: item.count,
      percentage: totalRequests > 0 ? Math.round((item.count / totalRequests) * 100) : 0
    }));

    const severityDistributionWithPercentage = severityDistribution.map(item => ({
      level: item.severity_level,
      count: item.count,
      percentage: totalRequests > 0 ? Math.round((item.count / totalRequests) * 100) : 0
    }));

    return {
      overview: {
        totalSupportRequests: totalRequests,
        totalTeachers: totalTeachers,
        averageRequestsPerTeacher: totalTeachers > 0 ? Math.round((totalRequests / totalTeachers) * 100) / 100 : 0,
        mostCommonConcernType: topConcernResult?.concern_type || 'N/A',
        urgentRequestsCount: urgentRequests
      },
      trends: {
        requestsByMonth: requestsByMonth.map(item => ({
          month: item.month,
          count: item.count
        })),
        concernTypeDistribution: concernDistributionWithPercentage,
        severityDistribution: severityDistributionWithPercentage,
        locationDistribution: locationDistribution.map(item => ({
          location: item.location,
          count: item.count
        }))
      },
      teacherInsights: {
        mostActiveTeachers: activeTeachers.map(item => ({
          name: item.teacher,
          requestCount: item.count,
          school: 'Demo School' // Would be joined from users table in real implementation
        })),
        schoolDistribution: schoolDistribution.map(item => ({
          school: item.school_name,
          teacherCount: item.teacher_count,
          requestCount: 0 // Would be calculated with proper joins
        })),
        averageResponseTime: 2.5 // Mock data - would calculate from actual response times
      },
      studentOutcomes: {
        followUpRate: followUpRate,
        interventionSuccessRate: 78, // Mock data - would track actual outcomes
        averageInterventionDuration: 14 // Mock data - would track intervention timelines
      }
    };
  }
);
