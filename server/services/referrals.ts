import { db } from "../db";
import { concerns, interventions, users, followUpQuestions } from "@shared/schema";
import { eq, desc, and, count } from "drizzle-orm";

export interface CreateReferralRequest {
  userId: string;
  studentFirstName: string;
  studentLastInitial: string;
  grade: string;
  teacherPosition: string;
  incidentDate?: Date;
  location: string;
  concernTypes: string[];
  otherConcernType?: string;
  description: string;
  severityLevel: string;
  actionsTaken: string[];
  otherActionTaken?: string;
  aiRecommendations?: string;
}

export interface ReferralWithDetails {
  id: string;
  studentFirstName: string;
  studentLastInitial: string;
  grade: string;
  teacherPosition: string;
  incidentDate: Date;
  location: string;
  concernTypes: string[];
  otherConcernType?: string;
  description: string;
  severityLevel: string;
  actionsTaken: string[];
  otherActionTaken?: string;
  createdAt: Date;
  interventions: any[];
  followUpQuestions: any[];
  teacher: {
    id: string;
    name: string;
    email: string;
  };
}

export async function createReferral(request: CreateReferralRequest) {
  try {
    // Check user's usage limit
    const user = await db.select().from(users).where(eq(users.id, request.userId)).limit(1);
    
    if (!user.length) {
      throw new Error('User not found');
    }

    const userData = user[0];
    const totalLimit = (userData.supportRequestsLimit || 20) + (userData.additionalRequests || 0);
    
    if ((userData.supportRequestsUsed || 0) >= totalLimit) {
      throw new Error(`Monthly usage limit reached. You have used ${userData.supportRequestsUsed} of ${totalLimit} requests this month.`);
    }

    // Create the referral (concern)
    const newReferral = await db.insert(concerns).values({
      teacherId: request.userId,
      studentFirstName: request.studentFirstName,
      studentLastInitial: request.studentLastInitial,
      grade: request.grade,
      teacherPosition: request.teacherPosition,
      incidentDate: request.incidentDate || new Date(),
      location: request.location,
      concernTypes: request.concernTypes,
      otherConcernType: request.otherConcernType,
      description: request.description,
      severityLevel: request.severityLevel,
      actionsTaken: request.actionsTaken,
      otherActionTaken: request.otherActionTaken,
    }).returning();

    // Increment usage count
    await db.update(users)
      .set({ 
        supportRequestsUsed: (userData.supportRequestsUsed || 0) + 1 
      })
      .where(eq(users.id, request.userId));

    return newReferral[0];
  } catch (error) {
    console.error('Error creating referral:', error);
    throw error;
  }
}

export async function getReferrals(userId: string): Promise<ReferralWithDetails[]> {
  try {
    // Get concerns (referrals) with related data
    const referralsData = await db
      .select({
        // Concern fields
        id: concerns.id,
        studentFirstName: concerns.studentFirstName,
        studentLastInitial: concerns.studentLastInitial,
        grade: concerns.grade,
        teacherPosition: concerns.teacherPosition,
        incidentDate: concerns.incidentDate,
        location: concerns.location,
        concernTypes: concerns.concernTypes,
        otherConcernType: concerns.otherConcernType,
        description: concerns.description,
        severityLevel: concerns.severityLevel,
        actionsTaken: concerns.actionsTaken,
        otherActionTaken: concerns.otherActionTaken,
        createdAt: concerns.createdAt,
        // Teacher fields
        teacherId: users.id,
        teacherName: users.firstName,
        teacherLastName: users.lastName,
        teacherEmail: users.email,
      })
      .from(concerns)
      .innerJoin(users, eq(concerns.teacherId, users.id))
      .where(eq(concerns.teacherId, userId))
      .orderBy(desc(concerns.createdAt));

    // Get interventions and follow-up questions for each referral
    const referralsWithDetails = await Promise.all(
      referralsData.map(async (referral) => {
        const [referralInterventions, referralQuestions] = await Promise.all([
          db.select().from(interventions).where(eq(interventions.concernId, referral.id)),
          db.select().from(followUpQuestions).where(eq(followUpQuestions.concernId, referral.id))
        ]);

        return {
          id: referral.id,
          studentFirstName: referral.studentFirstName,
          studentLastInitial: referral.studentLastInitial,
          grade: referral.grade,
          teacherPosition: referral.teacherPosition,
          incidentDate: referral.incidentDate,
          location: referral.location,
          concernTypes: Array.isArray(referral.concernTypes) ? referral.concernTypes : [],
          otherConcernType: referral.otherConcernType,
          description: referral.description,
          severityLevel: referral.severityLevel,
          actionsTaken: Array.isArray(referral.actionsTaken) ? referral.actionsTaken : [],
          otherActionTaken: referral.otherActionTaken,
          createdAt: referral.createdAt,
          interventions: referralInterventions,
          followUpQuestions: referralQuestions,
          teacher: {
            id: referral.teacherId,
            name: `${referral.teacherName || ''} ${referral.teacherLastName || ''}`.trim(),
            email: referral.teacherEmail || '',
          }
        };
      })
    );

    return referralsWithDetails;
  } catch (error) {
    console.error('Error getting referrals:', error);
    throw error;
  }
}

export async function getReferralById(referralId: string, userId?: string): Promise<ReferralWithDetails | null> {
  try {
    const referralData = await db
      .select({
        // Concern fields
        id: concerns.id,
        studentFirstName: concerns.studentFirstName,
        studentLastInitial: concerns.studentLastInitial,
        grade: concerns.grade,
        teacherPosition: concerns.teacherPosition,
        incidentDate: concerns.incidentDate,
        location: concerns.location,
        concernTypes: concerns.concernTypes,
        otherConcernType: concerns.otherConcernType,
        description: concerns.description,
        severityLevel: concerns.severityLevel,
        actionsTaken: concerns.actionsTaken,
        otherActionTaken: concerns.otherActionTaken,
        createdAt: concerns.createdAt,
        // Teacher fields
        teacherId: users.id,
        teacherName: users.firstName,
        teacherLastName: users.lastName,
        teacherEmail: users.email,
      })
      .from(concerns)
      .innerJoin(users, eq(concerns.teacherId, users.id))
      .where(
        userId 
          ? and(eq(concerns.id, referralId), eq(concerns.teacherId, userId))
          : eq(concerns.id, referralId)
      )
      .limit(1);

    if (!referralData.length) {
      return null;
    }

    const referral = referralData[0];

    // Get related interventions and questions
    const [referralInterventions, referralQuestions] = await Promise.all([
      db.select().from(interventions).where(eq(interventions.concernId, referral.id)),
      db.select().from(followUpQuestions).where(eq(followUpQuestions.concernId, referral.id))
    ]);

    return {
      id: referral.id,
      studentFirstName: referral.studentFirstName,
      studentLastInitial: referral.studentLastInitial,
      grade: referral.grade,
      teacherPosition: referral.teacherPosition,
      incidentDate: referral.incidentDate,
      location: referral.location,
      concernTypes: Array.isArray(referral.concernTypes) ? referral.concernTypes : [],
      otherConcernType: referral.otherConcernType,
      description: referral.description,
      severityLevel: referral.severityLevel,
      actionsTaken: Array.isArray(referral.actionsTaken) ? referral.actionsTaken : [],
      otherActionTaken: referral.otherActionTaken,
      createdAt: referral.createdAt,
      interventions: referralInterventions,
      followUpQuestions: referralQuestions,
      teacher: {
        id: referral.teacherId,
        name: `${referral.teacherName || ''} ${referral.teacherLastName || ''}`.trim(),
        email: referral.teacherEmail || '',
      }
    };
  } catch (error) {
    console.error('Error getting referral by ID:', error);
    throw error;
  }
}

export async function updateReferralStatus(referralId: string, status: string, userId?: string) {
  try {
    // In a full implementation, you might have a status field
    // For now, we'll use this to update the concern description with status info
    const updateData = {
      description: `Status: ${status}\\n\\nOriginal Description: ` // This would be better as a separate status field
    };

    if (userId) {
      // Verify ownership before update
      const referral = await db
        .select({ teacherId: concerns.teacherId })
        .from(concerns)
        .where(eq(concerns.id, referralId))
        .limit(1);

      if (!referral.length || referral[0].teacherId !== userId) {
        throw new Error('Referral not found or access denied');
      }
    }

    const result = await db
      .update(concerns)
      .set(updateData)
      .where(eq(concerns.id, referralId))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error updating referral status:', error);
    throw error;
  }
}

export async function getReferralStats(userId?: string) {
  try {
    const whereClause = userId ? eq(concerns.teacherId, userId) : undefined;

    const [totalReferrals] = await db
      .select({ count: count() })
      .from(concerns)
      .where(whereClause);

    // Group by severity level
    const severityStats = await db
      .select({
        severityLevel: concerns.severityLevel,
        count: count()
      })
      .from(concerns)
      .where(whereClause)
      .groupBy(concerns.severityLevel);

    // Group by concern types (this would need more complex logic for JSONB arrays)
    const monthlyTrends = await db.execute(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as referral_count
      FROM concerns
      ${userId ? `WHERE teacher_id = '${userId}'` : ''}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `);

    return {
      totalReferrals: totalReferrals.count,
      severityBreakdown: severityStats,
      monthlyTrends: monthlyTrends.rows,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    throw error;
  }
}