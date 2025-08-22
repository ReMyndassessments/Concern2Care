import { db } from "../db";
import { users, concerns, interventions, dailyStats } from "@shared/schema";
import { count, sql, desc, asc, eq, gte, lte, and } from "drizzle-orm";

export async function getDashboardAnalytics() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Total users count
    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'teacher'));

    // Active users (logged in within 30 days)
    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.role, 'teacher'),
          gte(users.lastLoginAt, thirtyDaysAgo)
        )
      );

    // Total concerns created
    const [totalConcernsResult] = await db
      .select({ count: count() })
      .from(concerns);

    // Recent concerns (last 7 days)
    const [recentConcernsResult] = await db
      .select({ count: count() })
      .from(concerns)
      .where(gte(concerns.createdAt, sevenDaysAgo));

    // Total interventions generated
    const [totalInterventionsResult] = await db
      .select({ count: count() })
      .from(interventions);

    // Average requests per teacher
    const [avgRequestsResult] = await db.execute(sql`
      SELECT AVG(support_requests_used::numeric) as avg_requests
      FROM users 
      WHERE role = 'teacher'
    `);

    // Top schools by usage
    const topSchools = await db.execute(sql`
      SELECT 
        school,
        COUNT(*) as teacher_count,
        SUM(support_requests_used) as total_requests
      FROM users 
      WHERE role = 'teacher' AND school IS NOT NULL
      GROUP BY school
      ORDER BY total_requests DESC
      LIMIT 10
    `);

    // Daily usage trends (last 30 days)
    const dailyTrends = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as concerns_created
      FROM concerns
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Usage statistics
    const usageStats = await db.execute(sql`
      SELECT 
        support_requests_limit,
        COUNT(*) as teacher_count,
        AVG(support_requests_used::numeric) as avg_used
      FROM users 
      WHERE role = 'teacher'
      GROUP BY support_requests_limit
      ORDER BY support_requests_limit
    `);

    return {
      overview: {
        totalTeachers: totalUsersResult.count,
        activeTeachers: activeUsersResult.count,
        totalConcerns: totalConcernsResult.count,
        recentConcerns: recentConcernsResult.count,
        totalInterventions: totalInterventionsResult.count,
        averageRequestsPerTeacher: Number(avgRequestsResult.rows[0]?.avg_requests || 0).toFixed(1),
      },
      topSchools: topSchools.rows,
      dailyTrends: dailyTrends.rows,
      usageStatsByLimit: usageStats.rows,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error generating dashboard analytics:', error);
    throw error;
  }
}

export async function getUsageStatistics() {
  try {
    // Get usage by teacher
    const teacherUsage = await db.execute(sql`
      SELECT 
        id,
        first_name || ' ' || last_name as name,
        email,
        school,
        support_requests_used,
        support_requests_limit,
        additional_requests,
        (support_requests_limit + additional_requests) as total_limit,
        ROUND(
          (support_requests_used::numeric / (support_requests_limit + additional_requests)::numeric * 100), 
          1
        ) as usage_percentage
      FROM users 
      WHERE role = 'teacher'
      ORDER BY usage_percentage DESC
      LIMIT 50
    `);

    // Usage summary stats
    const usageSummary = await db.execute(sql`
      SELECT 
        COUNT(*) as total_teachers,
        SUM(support_requests_used) as total_requests_used,
        SUM(support_requests_limit + additional_requests) as total_requests_available,
        AVG(support_requests_used::numeric) as avg_requests_per_teacher,
        COUNT(CASE WHEN support_requests_used >= (support_requests_limit + additional_requests) THEN 1 END) as teachers_at_limit
      FROM users 
      WHERE role = 'teacher'
    `);

    // Monthly trends
    const monthlyTrends = await db.execute(sql`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as concerns_created,
        COUNT(DISTINCT teacher_id) as active_teachers
      FROM concerns
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);

    return {
      teacherUsage: teacherUsage.rows,
      summary: usageSummary.rows[0],
      monthlyTrends: monthlyTrends.rows,
    };
  } catch (error) {
    console.error('Error getting usage statistics:', error);
    throw error;
  }
}

export async function updateDailyStats() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get today's statistics
    const [concernsToday] = await db
      .select({ count: count() })
      .from(concerns)
      .where(
        sql`DATE(created_at) = ${today}`
      );

    const [activeUsersToday] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.role, 'teacher'),
          sql`DATE(last_login_at) = ${today}`
        )
      );

    // Insert or update daily stats
    await db
      .insert(dailyStats)
      .values({
        date: today,
        totalConcernsCreated: concernsToday.count,
        totalUsersActive: activeUsersToday.count,
        totalAiRequests: concernsToday.count, // Assuming each concern generates AI request
        averageResponseTime: 2500, // Mock response time in milliseconds
      })
      .onConflictDoUpdate({
        target: dailyStats.date,
        set: {
          totalConcernsCreated: concernsToday.count,
          totalUsersActive: activeUsersToday.count,
          totalAiRequests: concernsToday.count,
        }
      });

    return {
      success: true,
      date: today,
      stats: {
        concerns: concernsToday.count,
        activeUsers: activeUsersToday.count,
      }
    };
  } catch (error) {
    console.error('Error updating daily stats:', error);
    throw error;
  }
}