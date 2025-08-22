import {
  users,
  schools,
  concerns,
  interventions,
  followUpQuestions,
  reports,
  adminLogs,
  dailyStats,
  featureFlags,
  schoolFeatureOverrides,
  progressNotes,
  type User,
  type UpsertUser,
  type InsertSchool,
  type School,
  type InsertConcern,
  type Concern,
  type InsertIntervention,
  type Intervention,
  type InterventionWithProgressNotes,
  type InsertFollowUpQuestion,
  type FollowUpQuestion,
  type InsertReport,
  type Report,
  type InsertAdminLog,
  type AdminLog,
  type FeatureFlag,
  type SchoolFeatureOverride,
  type DailyStat,
  type ConcernWithDetails,
  type UserWithSchool,
  type SchoolWithUsers,
  type AdminLogWithDetails,
  type InsertProgressNote,
  type ProgressNote,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRequestCount(id: string, count: number): Promise<void>;
  incrementUserRequestCount(id: string): Promise<User>;
  checkUserUsageLimit(id: string): Promise<{ canCreate: boolean; used: number; limit: number; }>;
  grantAdditionalRequests(id: string, amount: number, adminId: string): Promise<User>;
  
  // Admin-specific methods
  createSchool(school: InsertSchool): Promise<School>;
  getSchools(): Promise<School[]>;
  getSchoolById(id: string): Promise<School | undefined>;
  updateSchool(id: string, school: Partial<InsertSchool>): Promise<School>;
  deleteSchool(id: string): Promise<void>;
  getSchoolWithUsers(id: string): Promise<SchoolWithUsers | undefined>;
  
  // Enhanced user management for admin
  getAllUsers(): Promise<UserWithSchool[]>;
  getUsersWithSchool(): Promise<UserWithSchool[]>;
  getUsersBySchool(schoolId: string): Promise<User[]>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  bulkCreateUsers(users: UpsertUser[]): Promise<User[]>;
  bulkDeleteUsers(userIds: string[]): Promise<void>;
  
  // Admin logging
  logAdminAction(adminLog: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(limit?: number): Promise<AdminLogWithDetails[]>;
  
  // Analytics methods
  getDashboardStats(): Promise<{
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
  }>;
  getRecentActivity(limit?: number): Promise<AdminLogWithDetails[]>;
  getDailyStats(days?: number): Promise<DailyStat[]>;
  
  // Feature flags
  getFeatureFlags(): Promise<FeatureFlag[]>;
  toggleFeatureFlag(flagName: string, enabled: boolean): Promise<FeatureFlag>;
  getSchoolFeatureOverrides(schoolId: string): Promise<SchoolFeatureOverride[]>;
  setSchoolFeatureOverride(schoolId: string, flagName: string, enabled: boolean, adminId: string): Promise<SchoolFeatureOverride>;
  
  // Concern operations
  createConcern(concern: InsertConcern): Promise<Concern>;
  getConcernsByTeacher(teacherId: string): Promise<Concern[]>;
  getConcernWithDetails(id: string): Promise<ConcernWithDetails | undefined>;
  
  // Intervention operations
  createInterventions(interventions: InsertIntervention[]): Promise<Intervention[]>;
  getInterventionById(id: string): Promise<Intervention | undefined>;
  getConcernById(id: string): Promise<Concern | undefined>;
  saveIntervention(interventionId: string): Promise<Intervention>;
  
  // Follow-up question operations
  createFollowUpQuestion(question: InsertFollowUpQuestion): Promise<FollowUpQuestion>;
  getFollowUpQuestionsByConcern(concernId: string): Promise<FollowUpQuestion[]>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReportById(id: string): Promise<Report | undefined>;
  getReportByConcernId(concernId: string): Promise<Report | undefined>;
  
  // Progress Note operations
  createProgressNote(progressNote: InsertProgressNote): Promise<ProgressNote>;
  getProgressNotesByInterventionId(interventionId: string): Promise<ProgressNote[]>;
  updateProgressNote(id: string, updates: Partial<Omit<InsertProgressNote, 'interventionId' | 'teacherId'>>): Promise<ProgressNote | undefined>;
  deleteProgressNote(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRequestCount(id: string, count: number): Promise<void> {
    await db
      .update(users)
      .set({ supportRequestsUsed: count })
      .where(eq(users.id, id));
  }

  async incrementUserRequestCount(id: string): Promise<User> {
    // First get current user to get the current count
    const currentUser = await this.getUser(id);
    if (!currentUser) {
      throw new Error(`User ${id} not found`);
    }
    
    const newCount = (currentUser.supportRequestsUsed || 0) + 1;
    
    const [user] = await db
      .update(users)
      .set({ 
        supportRequestsUsed: newCount,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error(`User ${id} not found during update`);
    }
    
    return user;
  }

  async checkUserUsageLimit(id: string): Promise<{ canCreate: boolean; used: number; limit: number; }> {
    const user = await this.getUser(id);
    
    if (!user) {
      throw new Error(`User ${id} not found`);
    }
    
    const used = user.supportRequestsUsed || 0;
    const baseLimit = user.supportRequestsLimit || 20;
    const additionalRequests = user.additionalRequests || 0;
    const totalLimit = baseLimit + additionalRequests;
    
    return {
      canCreate: used < totalLimit,
      used,
      limit: totalLimit
    };
  }

  async grantAdditionalRequests(id: string, amount: number, adminId: string): Promise<User> {
    const currentUser = await this.getUser(id);
    if (!currentUser) {
      throw new Error(`User ${id} not found`);
    }
    
    const newAdditionalRequests = (currentUser.additionalRequests || 0) + amount;
    
    const [user] = await db
      .update(users)
      .set({ 
        additionalRequests: newAdditionalRequests,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error(`User ${id} not found during update`);
    }

    // Log admin action
    await this.logAdminAction({
      adminId,
      action: 'grant_additional_requests',
      targetUserId: id,
      details: {
        amount,
        previousTotal: currentUser.additionalRequests || 0,
        newTotal: newAdditionalRequests
      }
    });
    
    console.log(`✅ Granted ${amount} additional requests to user ${id} by admin ${adminId}. Total additional: ${newAdditionalRequests}`);
    
    return user;
  }

  // Admin-specific methods implementation
  async createSchool(school: InsertSchool): Promise<School> {
    const [newSchool] = await db.insert(schools).values(school).returning();
    if (!newSchool) {
      throw new Error("Failed to create school");
    }
    return newSchool;
  }

  async getSchools(): Promise<School[]> {
    return await db.select().from(schools).orderBy(schools.name);
  }

  async getSchoolById(id: string): Promise<School | undefined> {
    const result = await db.select().from(schools).where(eq(schools.id, id)).limit(1);
    return result[0];
  }

  async updateSchool(id: string, school: Partial<InsertSchool>): Promise<School> {
    const [updatedSchool] = await db
      .update(schools)
      .set({ ...school, updatedAt: new Date() })
      .where(eq(schools.id, id))
      .returning();
    if (!updatedSchool) {
      throw new Error(`School ${id} not found`);
    }
    return updatedSchool;
  }

  async deleteSchool(id: string): Promise<void> {
    await db.delete(schools).where(eq(schools.id, id));
  }

  async getSchoolWithUsers(id: string): Promise<SchoolWithUsers | undefined> {
    const school = await this.getSchoolById(id);
    if (!school) return undefined;

    const schoolUsers = await this.getUsersBySchool(id);
    return {
      ...school,
      users: schoolUsers
    };
  }

  async getAllUsers(): Promise<UserWithSchool[]> {
    const result = await db
      .select({
        user: users,
        schoolData: schools
      })
      .from(users)
      .leftJoin(schools, eq(users.schoolId, schools.id))
      .orderBy(users.createdAt);

    return result.map(row => ({
      ...row.user,
      school: row.schoolData
    }));
  }

  async getUsersWithSchool(): Promise<UserWithSchool[]> {
    return this.getAllUsers();
  }

  async getUsersBySchool(schoolId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.schoolId, schoolId));
  }

  async createUser(user: UpsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    if (!newUser) {
      throw new Error("Failed to create user");
    }
    return newUser;
  }

  async updateUser(id: string, user: Partial<UpsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!updatedUser) {
      throw new Error(`User ${id} not found`);
    }
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async bulkCreateUsers(userList: UpsertUser[]): Promise<User[]> {
    const newUsers = await db.insert(users).values(userList).returning();
    return newUsers;
  }

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    await db.delete(users).where(inArray(users.id, userIds));
  }

  async logAdminAction(adminLog: InsertAdminLog): Promise<AdminLog> {
    const [newLog] = await db.insert(adminLogs).values(adminLog).returning();
    if (!newLog) {
      throw new Error("Failed to log admin action");
    }
    return newLog;
  }

  async getAdminLogs(limit: number = 50): Promise<AdminLogWithDetails[]> {
    const result = await db
      .select({
        log: adminLogs,
        admin: users,
        targetUser: users,
        targetSchool: schools
      })
      .from(adminLogs)
      .leftJoin(users, eq(adminLogs.adminId, users.id))
      .leftJoin(users, eq(adminLogs.targetUserId, users.id))
      .leftJoin(schools, eq(adminLogs.targetSchoolId, schools.id))
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.log,
      admin: row.admin!,
      targetUser: row.targetUser,
      targetSchool: row.targetSchool
    }));
  }

  async getDashboardStats(): Promise<{
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
  }> {
    const [userCount, schoolCount, concernCount, interventionCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(schools),
      db.select({ count: sql<number>`count(*)` }).from(concerns),
      db.select({ count: sql<number>`count(*)` }).from(interventions)
    ]);

    // Count active users this month (users who created concerns)
    const activeUsersResult = await db
      .select({ count: sql<number>`count(distinct teacher_id)` })
      .from(concerns)
      .where(sql`date_trunc('month', created_at) = date_trunc('month', current_date)`);

    // Usage stats for this month vs last month
    const thisMonthConcerns = await db
      .select({ count: sql<number>`count(*)` })
      .from(concerns)
      .where(sql`date_trunc('month', created_at) = date_trunc('month', current_date)`);

    const lastMonthConcerns = await db
      .select({ count: sql<number>`count(*)` })
      .from(concerns)
      .where(sql`date_trunc('month', created_at) = date_trunc('month', current_date - interval '1 month')`);

    const thisMonthCount = thisMonthConcerns[0]?.count || 0;
    const lastMonthCount = lastMonthConcerns[0]?.count || 0;
    const percentChange = lastMonthCount > 0 ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100 : 0;

    return {
      totalUsers: userCount[0]?.count || 0,
      totalSchools: schoolCount[0]?.count || 0,
      totalConcerns: concernCount[0]?.count || 0,
      totalInterventions: interventionCount[0]?.count || 0,
      activeUsersThisMonth: activeUsersResult[0]?.count || 0,
      usageStats: {
        thisMonth: thisMonthCount,
        lastMonth: lastMonthCount,
        percentChange
      }
    };
  }

  async getRecentActivity(limit: number = 10): Promise<AdminLogWithDetails[]> {
    return this.getAdminLogs(limit);
  }

  async getDailyStats(days: number = 30): Promise<DailyStat[]> {
    return await db
      .select()
      .from(dailyStats)
      .orderBy(desc(dailyStats.date))
      .limit(days);
  }

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    return await db.select().from(featureFlags).orderBy(featureFlags.flagName);
  }

  async toggleFeatureFlag(flagName: string, enabled: boolean): Promise<FeatureFlag> {
    const [flag] = await db
      .update(featureFlags)
      .set({ isGloballyEnabled: enabled, updatedAt: new Date() })
      .where(eq(featureFlags.flagName, flagName))
      .returning();

    if (!flag) {
      throw new Error(`Feature flag ${flagName} not found`);
    }
    return flag;
  }

  async getSchoolFeatureOverrides(schoolId: string): Promise<SchoolFeatureOverride[]> {
    return await db
      .select()
      .from(schoolFeatureOverrides)
      .where(eq(schoolFeatureOverrides.schoolId, schoolId));
  }

  async setSchoolFeatureOverride(
    schoolId: string,
    flagName: string,
    enabled: boolean,
    adminId: string
  ): Promise<SchoolFeatureOverride> {
    const [override] = await db
      .insert(schoolFeatureOverrides)
      .values({
        schoolId,
        flagName,
        isEnabled: enabled,
        enabledBy: adminId
      })
      .onConflictDoUpdate({
        target: [schoolFeatureOverrides.schoolId, schoolFeatureOverrides.flagName],
        set: {
          isEnabled: enabled,
          enabledBy: adminId,
          enabledAt: new Date()
        }
      })
      .returning();

    if (!override) {
      throw new Error("Failed to set school feature override");
    }
    return override;
  }

  // Concern operations
  async createConcern(concern: InsertConcern): Promise<Concern> {
    const concernWithDate = {
      ...concern,
      incidentDate: new Date(), // Auto-generate the incident date
    };
    const [newConcern] = await db.insert(concerns).values(concernWithDate).returning();
    return newConcern;
  }

  async getConcernsByTeacher(teacherId: string): Promise<Concern[]> {
    return await db
      .select()
      .from(concerns)
      .where(eq(concerns.teacherId, teacherId))
      .orderBy(desc(concerns.createdAt));
  }

  async getConcernWithDetails(id: string): Promise<ConcernWithDetails | undefined> {
    const concernData = await db.query.concerns.findFirst({
      where: eq(concerns.id, id),
      with: {
        interventions: {
          with: {
            progressNotes: true,
          }
        },
        followUpQuestions: true,
        teacher: true,
      },
    });
    return concernData;
  }

  // Intervention operations
  async createInterventions(interventionData: InsertIntervention[]): Promise<Intervention[]> {
    if (interventionData.length === 0) return [];
    const dataWithProcessedSteps = interventionData.map(intervention => ({
      ...intervention,
      steps: intervention.steps as any // Cast to any for jsonb storage
    }));
    return await db.insert(interventions).values(dataWithProcessedSteps).returning();
  }

  // Follow-up question operations
  async createFollowUpQuestion(question: InsertFollowUpQuestion): Promise<FollowUpQuestion> {
    const [newQuestion] = await db.insert(followUpQuestions).values(question).returning();
    return newQuestion;
  }

  async getFollowUpQuestionsByConcern(concernId: string): Promise<FollowUpQuestion[]> {
    return await db
      .select()
      .from(followUpQuestions)
      .where(eq(followUpQuestions.concernId, concernId))
      .orderBy(desc(followUpQuestions.createdAt));
  }

  async getInterventionById(id: string): Promise<Intervention | undefined> {
    const [intervention] = await db.select().from(interventions).where(eq(interventions.id, id));
    return intervention;
  }

  async getConcernById(id: string): Promise<Concern | undefined> {
    const [concern] = await db.select().from(concerns).where(eq(concerns.id, id));
    return concern;
  }

  async saveIntervention(interventionId: string): Promise<Intervention> {
    const [savedIntervention] = await db
      .update(interventions)
      .set({ 
        saved: true, 
        savedAt: new Date() 
      })
      .where(eq(interventions.id, interventionId))
      .returning();
    return savedIntervention;
  }

  // Report operations
  async createReport(report: InsertReport): Promise<Report> {
    const dataWithProcessedSharedWith = {
      ...report,
      sharedWith: report.sharedWith as any // Cast to any for jsonb storage
    };
    const [newReport] = await db.insert(reports).values(dataWithProcessedSharedWith).returning();
    return newReport;
  }

  async getReportById(id: string): Promise<Report | undefined> {
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id));
    return report;
  }

  async getReportByConcernId(concernId: string): Promise<Report | undefined> {
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.concernId, concernId));
    return report;
  }

  // Progress Note operations
  async createProgressNote(progressNote: InsertProgressNote): Promise<ProgressNote> {
    const [newProgressNote] = await db
      .insert(progressNotes)
      .values(progressNote)
      .returning();
    return newProgressNote;
  }

  async getProgressNotesByInterventionId(interventionId: string): Promise<ProgressNote[]> {
    const notes = await db
      .select()
      .from(progressNotes)
      .where(eq(progressNotes.interventionId, interventionId))
      .orderBy(desc(progressNotes.createdAt));
    return notes;
  }

  async updateProgressNote(id: string, updates: Partial<Omit<InsertProgressNote, 'interventionId' | 'teacherId'>>): Promise<ProgressNote | undefined> {
    const [updatedNote] = await db
      .update(progressNotes)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(progressNotes.id, id))
      .returning();
    return updatedNote;
  }

  async deleteProgressNote(id: string): Promise<boolean> {
    const result = await db
      .delete(progressNotes)
      .where(eq(progressNotes.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
