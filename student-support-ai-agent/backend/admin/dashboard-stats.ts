import { api } from "encore.dev/api";
import { userDB } from "../users/db";
import { referralDB } from "../referrals/db";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";

export interface DashboardStats {
  totalTeachers: number;
  activeTeachers: number;
  totalSupportRequests: number;
  supportRequestsThisMonth: number;
  averageRequestsPerTeacher: number;
  topConcernTypes: Array<{ type: string; count: number }>;
  recentActivity: Array<{
    type: 'teacher_added' | 'support_request' | 'teacher_updated';
    description: string;
    timestamp: Date;
  }>;
}

// Gets comprehensive dashboard statistics for admin overview.
export const getDashboardStats = api<void, DashboardStats>(
  { expose: true, method: "GET", path: "/admin/dashboard/stats", auth: true },
  async () => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    // Get total teachers
    const totalTeachersResult = await userDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM users
    `;
    const totalTeachers = totalTeachersResult?.count || 0;

    // Get active teachers (with valid subscriptions)
    const activeTeachersResult = await userDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM users 
      WHERE subscription_end_date IS NOT NULL 
      AND subscription_end_date > NOW()
    `;
    const activeTeachers = activeTeachersResult?.count || 0;

    // Get total support requests
    const totalRequestsResult = await referralDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM referrals
    `;
    const totalSupportRequests = totalRequestsResult?.count || 0;

    // Get support requests this month
    const thisMonthRequestsResult = await referralDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM referrals 
      WHERE created_at >= DATE_TRUNC('month', NOW())
    `;
    const supportRequestsThisMonth = thisMonthRequestsResult?.count || 0;

    // Calculate average requests per teacher
    const averageRequestsPerTeacher = totalTeachers > 0 ? Math.round((totalSupportRequests / totalTeachers) * 100) / 100 : 0;

    // Get top concern types
    const concernTypesResult = await referralDB.queryAll<{ concern_type: string; count: number }>`
      SELECT 
        TRIM(BOTH '"' FROM jsonb_array_elements_text(concern_types::jsonb)) as concern_type,
        COUNT(*) as count
      FROM referrals 
      WHERE concern_types != '[]'
      GROUP BY concern_type
      ORDER BY count DESC
      LIMIT 5
    `;

    const topConcernTypes = concernTypesResult.map(row => ({
      type: row.concern_type,
      count: row.count
    }));

    // Get recent activity (simplified for demo)
    const recentSupportRequests = await referralDB.queryAll<{
      student_first_name: string;
      student_last_initial: string;
      teacher: string;
      created_at: Date;
    }>`
      SELECT student_first_name, student_last_initial, teacher, created_at
      FROM referrals 
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    const recentTeachers = await userDB.queryAll<{
      name: string;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT name, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 3
    `;

    const recentActivity = [
      ...recentSupportRequests.map(req => ({
        type: 'support_request' as const,
        description: `Support request created for ${req.student_first_name} ${req.student_last_initial}. by ${req.teacher}`,
        timestamp: req.created_at
      })),
      ...recentTeachers.map(teacher => ({
        type: 'teacher_added' as const,
        description: `Teacher ${teacher.name || 'Unknown'} added to system`,
        timestamp: teacher.created_at
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

    return {
      totalTeachers,
      activeTeachers,
      totalSupportRequests,
      supportRequestsThisMonth,
      averageRequestsPerTeacher,
      topConcernTypes,
      recentActivity
    };
  }
);
