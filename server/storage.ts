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
  apiKeys,
  userEmailConfigs,
  schoolEmailConfigs,
  classroomEnrolledTeachers,
  classroomSubmissions,
  adminNotifications,
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
  type InsertClassroomEnrolledTeacher,
  type ClassroomEnrolledTeacher,
  type InsertClassroomSubmission,
  type ClassroomSubmission,
  type ClassroomSubmissionWithTeacher,
  type InsertAdminNotification,
  type AdminNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

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
  checkAndResetUsageIfNeeded(id: string): Promise<boolean>;
  resetUserUsage(id: string): Promise<User>;
  
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
  
  // Data safety methods for deletion analysis
  getUsersBySchoolId(schoolId: string): Promise<User[]>;
  getSchool(schoolId: string): Promise<School | undefined>;
  getFullUserExportData(userId: string): Promise<any>;
  
  // Concern operations
  createConcern(concern: InsertConcern): Promise<Concern>;
  getConcernsByTeacher(teacherId: string): Promise<Concern[]>;
  getConcernWithDetails(id: string): Promise<ConcernWithDetails | undefined>;
  deleteConcern(id: string): Promise<boolean>;
  
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
  updateReport(id: string, updates: Partial<Omit<InsertReport, 'concernId'>>): Promise<Report | undefined>;
  
  // Progress Note operations
  createProgressNote(progressNote: InsertProgressNote): Promise<ProgressNote>;
  getProgressNotesByInterventionId(interventionId: string): Promise<ProgressNote[]>;
  updateProgressNote(id: string, updates: Partial<Omit<InsertProgressNote, 'interventionId' | 'teacherId'>>): Promise<ProgressNote | undefined>;
  deleteProgressNote(id: string): Promise<boolean>;
  
  // Soft deletion alternatives
  markSchoolInactive(id: string): Promise<School>;
  markUserInactive(id: string): Promise<User>;
  
  // Classroom Solutions operations
  getClassroomEnrolledTeachers(): Promise<ClassroomEnrolledTeacher[]>;
  getClassroomEnrolledTeacher(id: string): Promise<ClassroomEnrolledTeacher | undefined>;
  getClassroomEnrolledTeacherByEmail(email: string): Promise<ClassroomEnrolledTeacher | undefined>;
  createClassroomEnrolledTeacher(teacher: InsertClassroomEnrolledTeacher): Promise<ClassroomEnrolledTeacher>;
  updateClassroomEnrolledTeacher(id: string, updates: Partial<InsertClassroomEnrolledTeacher>): Promise<ClassroomEnrolledTeacher>;
  deleteClassroomEnrolledTeacher(id: string): Promise<void>;
  checkClassroomTeacherUsageLimit(teacherId: string): Promise<{ canSubmit: boolean; used: number; limit: number; }>;
  incrementClassroomTeacherUsage(teacherId: string): Promise<ClassroomEnrolledTeacher>;
  resetClassroomTeacherUsage(teacherId: string): Promise<ClassroomEnrolledTeacher>;
  checkAndResetClassroomUsageIfNeeded(teacherId: string): Promise<boolean>;
  
  createClassroomSubmission(submission: InsertClassroomSubmission & { teacherId: string }): Promise<ClassroomSubmission>;
  getClassroomSubmissions(): Promise<ClassroomSubmissionWithTeacher[]>;
  getClassroomSubmission(id: string): Promise<ClassroomSubmissionWithTeacher | undefined>;
  updateClassroomSubmission(id: string, updates: Partial<ClassroomSubmission>): Promise<ClassroomSubmission>;
  getClassroomSubmissionsByStatus(status: string): Promise<ClassroomSubmissionWithTeacher[]>;
  
  // Delayed delivery system methods
  getSubmissionsReadyForAutoSend(): Promise<ClassroomSubmissionWithTeacher[]>;
  markSubmissionAsSent(id: string, sentText: string): Promise<ClassroomSubmission>;
  getUrgentSubmissions(): Promise<ClassroomSubmissionWithTeacher[]>;
  setSubmissionAutoSendTime(id: string, autoSendTime: Date): Promise<ClassroomSubmission>;
  
  // Admin notification methods
  createAdminNotification(notification: { submissionId: string; type: string; status: string; title: string; message?: string; priority?: string; adminId?: string }): Promise<any>;
  getAdminNotifications(adminId?: string): Promise<any[]>;
  markNotificationAsRead(id: string): Promise<any>;
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
        target: users.email,
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
    // Check and perform monthly reset if needed
    await this.checkAndResetUsageIfNeeded(id);
    
    const user = await this.getUser(id);
    
    if (!user) {
      throw new Error(`User ${id} not found`);
    }
    
    // Admin users have unlimited requests
    if (user.isAdmin) {
      return {
        canCreate: true,
        used: 0,
        limit: -1 // -1 indicates unlimited
      };
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

  async checkAndResetUsageIfNeeded(id: string): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) {
      return false;
    }

    const now = new Date();
    const lastReset = user.lastUsageReset || user.createdAt || new Date(0);
    
    // Check if we're in a new month since last reset
    const needsReset = 
      now.getFullYear() > lastReset.getFullYear() || 
      (now.getFullYear() === lastReset.getFullYear() && 
       now.getMonth() > lastReset.getMonth());

    if (needsReset) {
      await this.resetUserUsage(id);
      console.log(`🔄 Monthly usage reset performed for user ${id}`);
      return true;
    }

    return false;
  }

  async resetUserUsage(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        supportRequestsUsed: 0,
        lastUsageReset: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error(`User ${id} not found during reset`);
    }

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
    return await this.getUsersWithSchool();
  }

  async getUsersWithSchool(): Promise<UserWithSchool[]> {
    // Since users now have simple school strings, return them directly
    const result = await db
      .select()
      .from(users)
      .orderBy(users.createdAt);

    return result.map(user => ({
      ...user,
      school: user.school // Return the school string directly
    }));
  }

  async getUsersBySchool(schoolName: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.school, schoolName));
  }

  async createUser(user: UpsertUser): Promise<User> {
    // Hash password if provided and normalize email to lowercase
    const userData = { ...user };
    if (userData.email) {
      userData.email = userData.email.toLowerCase();
    }
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const [newUser] = await db.insert(users).values(userData).returning();
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
    console.log(`🗑️ Starting deletion of user ${id}...`);
    
    try {
      // Delete in order of foreign key dependencies (child tables first)
      
      // 1. Delete progress notes (references concerns via intervention_id and users via teacher_id)
      const deletedProgressNotes = await db.delete(progressNotes).where(eq(progressNotes.teacherId, id));
      console.log(`   ✅ Deleted progress notes for teacher ${id}`);
      
      // 2. Delete follow-up questions (references concerns)
      const userConcerns = await db.select({ id: concerns.id }).from(concerns).where(eq(concerns.teacherId, id));
      const concernIds = userConcerns.map(c => c.id);
      if (concernIds.length > 0) {
        await db.delete(followUpQuestions).where(inArray(followUpQuestions.concernId, concernIds));
        console.log(`   ✅ Deleted follow-up questions for ${concernIds.length} concerns`);
      }
      
      // 3. Delete reports (references concerns)
      if (concernIds.length > 0) {
        await db.delete(reports).where(inArray(reports.concernId, concernIds));
        console.log(`   ✅ Deleted reports for ${concernIds.length} concerns`);
      }
      
      // 4. Delete interventions (references concerns)
      if (concernIds.length > 0) {
        await db.delete(interventions).where(inArray(interventions.concernId, concernIds));
        console.log(`   ✅ Deleted interventions for ${concernIds.length} concerns`);
      }
      
      // 5. Delete concerns (references users via teacher_id)
      await db.delete(concerns).where(eq(concerns.teacherId, id));
      console.log(`   ✅ Deleted ${concernIds.length} concerns for teacher ${id}`);
      
      // 6. Delete API keys created by this user
      await db.delete(apiKeys).where(eq(apiKeys.createdBy, id));
      console.log(`   ✅ Deleted API keys created by user ${id}`);
      
      // 7. Delete user email configs
      await db.delete(userEmailConfigs).where(eq(userEmailConfigs.userId, id));
      console.log(`   ✅ Deleted email configs for user ${id}`);
      
      // 8. Delete school email configs where this user was the configurator
      await db.delete(schoolEmailConfigs).where(eq(schoolEmailConfigs.configuredBy, id));
      console.log(`   ✅ Deleted school email configs configured by user ${id}`);
      
      // 9. Delete school feature overrides enabled by this user
      await db.delete(schoolFeatureOverrides).where(eq(schoolFeatureOverrides.enabledBy, id));
      console.log(`   ✅ Deleted school feature overrides enabled by user ${id}`);
      
      // 10. Delete admin logs (both as admin and as target)
      await db.delete(adminLogs).where(eq(adminLogs.targetUserId, id));
      await db.delete(adminLogs).where(eq(adminLogs.adminId, id));
      console.log(`   ✅ Deleted admin logs for user ${id}`);
      
      // 11. Finally, delete the user
      const result = await db.delete(users).where(eq(users.id, id));
      console.log(`   ✅ Deleted user ${id} successfully`);
      
    } catch (error) {
      console.error(`❌ Error deleting user ${id}:`, error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    // Use Drizzle's with() method for optimized joins
    const logsWithDetails = await db.query.adminLogs.findMany({
      limit,
      orderBy: desc(adminLogs.createdAt),
      with: {
        admin: true,
        targetUser: true,
        targetSchool: true,
      },
    });

    return logsWithDetails as AdminLogWithDetails[];
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

  async isFeatureEnabled(flagName: string): Promise<boolean> {
    const [flag] = await db
      .select({ isGloballyEnabled: featureFlags.isGloballyEnabled })
      .from(featureFlags)
      .where(eq(featureFlags.flagName, flagName));
    
    return flag?.isGloballyEnabled || false;
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

  async deleteConcern(id: string): Promise<boolean> {
    // Note: Due to foreign key constraints, related data (interventions, follow-up questions, etc.) 
    // will be automatically deleted if cascade is set up, or we need to delete them manually
    const result = await db.delete(concerns).where(eq(concerns.id, id));
    return (result.rowCount || 0) > 0;
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

  async updateReport(id: string, updates: Partial<Omit<InsertReport, 'concernId'>>): Promise<Report | undefined> {
    const dataWithProcessedSharedWith = {
      ...updates,
      sharedWith: updates.sharedWith ? (updates.sharedWith as any) : undefined // Cast to any for jsonb storage
    };
    const [updatedReport] = await db
      .update(reports)
      .set(dataWithProcessedSharedWith)
      .where(eq(reports.id, id))
      .returning();
    return updatedReport;
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

  // Data safety methods for deletion analysis
  async getUsersBySchoolId(schoolId: string): Promise<User[]> {
    const schoolUsers = await db
      .select()
      .from(users)
      .where(eq(users.school, schoolId));
    return schoolUsers;
  }

  async getSchool(schoolId: string): Promise<School | undefined> {
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolId));
    return school;
  }

  async getFullUserExportData(userId: string): Promise<any> {
    // Get user details
    const user = await this.getUser(userId);
    if (!user) return null;

    // Get all concerns by this teacher
    const userConcerns = await db
      .select()
      .from(concerns)
      .where(eq(concerns.teacherId, userId));

    // Get interventions for each concern
    const concernsWithDetails = [];
    for (const concern of userConcerns) {
      const interventionList = await db
        .select()
        .from(interventions)
        .where(eq(interventions.concernId, concern.id));

      const followUps = await db
        .select()
        .from(followUpQuestions)
        .where(eq(followUpQuestions.concernId, concern.id));

      const reportsData = await db
        .select()
        .from(reports)
        .where(eq(reports.concernId, concern.id));

      concernsWithDetails.push({
        ...concern,
        interventions: interventionList,
        followUpQuestions: followUps,
        reports: reportsData
      });
    }

    // Get progress notes created by this teacher
    const teacherProgressNotes = await db
      .select()
      .from(progressNotes)
      .where(eq(progressNotes.teacherId, userId));

    return {
      user,
      concerns: concernsWithDetails,
      progressNotesCreated: teacherProgressNotes,
      exportDate: new Date().toISOString(),
      totalConcerns: userConcerns.length,
      totalInterventions: concernsWithDetails.reduce((sum, c) => sum + c.interventions.length, 0),
      totalReports: concernsWithDetails.reduce((sum, c) => sum + (c.reports?.length || 0), 0)
    };
  }

  // Soft deletion alternatives
  async markSchoolInactive(id: string): Promise<School> {
    const [updatedSchool] = await db
      .update(schools)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(schools.id, id))
      .returning();
    return updatedSchool;
  }

  async markUserInactive(id: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Classroom Solutions operations
  async getClassroomEnrolledTeachers(): Promise<ClassroomEnrolledTeacher[]> {
    return await db
      .select()
      .from(classroomEnrolledTeachers)
      .orderBy(classroomEnrolledTeachers.lastName, classroomEnrolledTeachers.firstName);
  }

  async getClassroomEnrolledTeacher(id: string): Promise<ClassroomEnrolledTeacher | undefined> {
    const [teacher] = await db
      .select()
      .from(classroomEnrolledTeachers)
      .where(eq(classroomEnrolledTeachers.id, id));
    return teacher;
  }

  async getClassroomEnrolledTeacherByEmail(email: string): Promise<ClassroomEnrolledTeacher | undefined> {
    const [teacher] = await db
      .select()
      .from(classroomEnrolledTeachers)
      .where(eq(classroomEnrolledTeachers.email, email));
    return teacher;
  }

  async createClassroomEnrolledTeacher(teacher: InsertClassroomEnrolledTeacher): Promise<ClassroomEnrolledTeacher> {
    const [newTeacher] = await db
      .insert(classroomEnrolledTeachers)
      .values(teacher)
      .returning();
    return newTeacher;
  }

  async updateClassroomEnrolledTeacher(id: string, updates: Partial<InsertClassroomEnrolledTeacher>): Promise<ClassroomEnrolledTeacher> {
    const [updatedTeacher] = await db
      .update(classroomEnrolledTeachers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(classroomEnrolledTeachers.id, id))
      .returning();
    return updatedTeacher;
  }

  async deleteClassroomEnrolledTeacher(id: string): Promise<void> {
    await db
      .delete(classroomEnrolledTeachers)
      .where(eq(classroomEnrolledTeachers.id, id));
  }

  async checkClassroomTeacherUsageLimit(teacherId: string): Promise<{ canSubmit: boolean; used: number; limit: number; }> {
    // Check and reset usage if needed
    await this.checkAndResetClassroomUsageIfNeeded(teacherId);
    
    const teacher = await this.getClassroomEnrolledTeacher(teacherId);
    if (!teacher) {
      throw new Error(`Classroom teacher ${teacherId} not found`);
    }

    const used = teacher.requestsUsed || 0;
    const limit = teacher.requestsLimit || 5;
    
    return {
      canSubmit: used < limit && (teacher.isActive ?? true),
      used,
      limit
    };
  }

  async incrementClassroomTeacherUsage(teacherId: string): Promise<ClassroomEnrolledTeacher> {
    // Atomic increment: only increment if usage is under limit and teacher is active
    const [updatedTeacher] = await db
      .update(classroomEnrolledTeachers)
      .set({ 
        requestsUsed: sql`COALESCE(${classroomEnrolledTeachers.requestsUsed}, 0) + 1`,
        updatedAt: new Date()
      })
      .where(and(
        eq(classroomEnrolledTeachers.id, teacherId),
        sql`COALESCE(${classroomEnrolledTeachers.requestsUsed}, 0) < COALESCE(${classroomEnrolledTeachers.requestsLimit}, 5)`,
        eq(classroomEnrolledTeachers.isActive, true)
      ))
      .returning();
    
    if (!updatedTeacher) {
      throw new Error('Usage limit exceeded, teacher inactive, or teacher not found');
    }
    
    return updatedTeacher;
  }

  async resetClassroomTeacherUsage(teacherId: string): Promise<ClassroomEnrolledTeacher> {
    const [updatedTeacher] = await db
      .update(classroomEnrolledTeachers)
      .set({ 
        requestsUsed: 0,
        lastUsageReset: new Date(),
        updatedAt: new Date()
      })
      .where(eq(classroomEnrolledTeachers.id, teacherId))
      .returning();
    
    return updatedTeacher;
  }

  async checkAndResetClassroomUsageIfNeeded(teacherId: string): Promise<boolean> {
    const teacher = await this.getClassroomEnrolledTeacher(teacherId);
    if (!teacher) {
      return false;
    }

    const now = new Date();
    const lastReset = teacher.lastUsageReset || teacher.createdAt || now;
    
    // Check if we've moved to a new month (calendar month boundary)
    const needsReset = now.getFullYear() > lastReset.getFullYear() || 
                      (now.getFullYear() === lastReset.getFullYear() && now.getMonth() > lastReset.getMonth());
    
    if (needsReset && (teacher.requestsUsed || 0) > 0) {
      await this.resetClassroomTeacherUsage(teacherId);
      return true;
    }
    
    return false;
  }

  async createClassroomSubmission(submission: InsertClassroomSubmission & { teacherId: string }): Promise<ClassroomSubmission> {
    const [newSubmission] = await db
      .insert(classroomSubmissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  async getClassroomSubmissions(): Promise<ClassroomSubmissionWithTeacher[]> {
    const submissions = await db
      .select()
      .from(classroomSubmissions)
      .leftJoin(classroomEnrolledTeachers, eq(classroomSubmissions.teacherId, classroomEnrolledTeachers.id))
      .orderBy(desc(classroomSubmissions.submittedAt));

    return submissions.map(({ classroom_submissions, classroom_enrolled_teachers }) => ({
      ...classroom_submissions,
      teacher: classroom_enrolled_teachers!
    }));
  }

  async getClassroomSubmission(id: string): Promise<ClassroomSubmissionWithTeacher | undefined> {
    const [result] = await db
      .select()
      .from(classroomSubmissions)
      .leftJoin(classroomEnrolledTeachers, eq(classroomSubmissions.teacherId, classroomEnrolledTeachers.id))
      .where(eq(classroomSubmissions.id, id));

    if (!result) return undefined;

    return {
      ...result.classroom_submissions,
      teacher: result.classroom_enrolled_teachers!
    };
  }

  async updateClassroomSubmission(id: string, updates: Partial<ClassroomSubmission>): Promise<ClassroomSubmission> {
    const [updatedSubmission] = await db
      .update(classroomSubmissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(classroomSubmissions.id, id))
      .returning();
    return updatedSubmission;
  }

  async getClassroomSubmissionsByStatus(status: string): Promise<ClassroomSubmissionWithTeacher[]> {
    const submissions = await db
      .select()
      .from(classroomSubmissions)
      .leftJoin(classroomEnrolledTeachers, eq(classroomSubmissions.teacherId, classroomEnrolledTeachers.id))
      .where(eq(classroomSubmissions.status, status))
      .orderBy(desc(classroomSubmissions.submittedAt));

    return submissions.map(({ classroom_submissions, classroom_enrolled_teachers }) => ({
      ...classroom_submissions,
      teacher: classroom_enrolled_teachers!
    }));
  }

  // Delayed delivery system methods
  async getSubmissionsReadyForAutoSend(): Promise<ClassroomSubmissionWithTeacher[]> {
    const now = new Date();
    const submissions = await db
      .select()
      .from(classroomSubmissions)
      .leftJoin(classroomEnrolledTeachers, eq(classroomSubmissions.teacherId, classroomEnrolledTeachers.id))
      .where(
        and(
          // Only process submissions that are pending or approved (not hold, cancelled, urgent_flagged, or already sent)
          inArray(classroomSubmissions.status, ['pending', 'approved']),
          sql`${classroomSubmissions.autoSendTime} <= ${now}`,
          eq(classroomSubmissions.urgentFlag, false) // Only auto-send non-urgent submissions
        )
      )
      .orderBy(classroomSubmissions.autoSendTime);

    return submissions.map(({ classroom_submissions, classroom_enrolled_teachers }) => ({
      ...classroom_submissions,
      teacher: classroom_enrolled_teachers!
    }));
  }

  async markSubmissionAsSent(id: string, sentText: string): Promise<ClassroomSubmission> {
    const [updatedSubmission] = await db
      .update(classroomSubmissions)
      .set({
        status: 'auto_sent',
        sentText,
        sentAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(classroomSubmissions.id, id))
      .returning();
    return updatedSubmission;
  }

  async getUrgentSubmissions(): Promise<ClassroomSubmissionWithTeacher[]> {
    const submissions = await db
      .select()
      .from(classroomSubmissions)
      .leftJoin(classroomEnrolledTeachers, eq(classroomSubmissions.teacherId, classroomEnrolledTeachers.id))
      .where(
        and(
          eq(classroomSubmissions.urgentFlag, true),
          inArray(classroomSubmissions.status, ['pending', 'urgent_flagged'])
        )
      )
      .orderBy(desc(classroomSubmissions.submittedAt));

    return submissions.map(({ classroom_submissions, classroom_enrolled_teachers }) => ({
      ...classroom_submissions,
      teacher: classroom_enrolled_teachers!
    }));
  }

  async setSubmissionAutoSendTime(id: string, autoSendTime: Date): Promise<ClassroomSubmission> {
    const [updatedSubmission] = await db
      .update(classroomSubmissions)
      .set({
        autoSendTime,
        updatedAt: new Date()
      })
      .where(eq(classroomSubmissions.id, id))
      .returning();
    return updatedSubmission;
  }

  // Admin notification methods
  async createAdminNotification(notification: Omit<InsertAdminNotification, 'id' | 'createdAt'>): Promise<AdminNotification> {
    const [newNotification] = await db
      .insert(adminNotifications)
      .values(notification)
      .returning();
    console.log('📢 Created admin notification:', newNotification.id, 'for submission:', notification.submissionId);
    return newNotification;
  }

  async getAdminNotifications(adminId?: string): Promise<AdminNotification[]> {
    const query = db
      .select()
      .from(adminNotifications)
      .orderBy(desc(adminNotifications.createdAt));
    
    if (adminId) {
      return await query.where(eq(adminNotifications.adminId, adminId));
    }
    
    return await query;
  }

  async markNotificationAsRead(id: string): Promise<AdminNotification> {
    const [updatedNotification] = await db
      .update(adminNotifications)
      .set({ 
        status: 'read',
        readAt: new Date()
      })
      .where(eq(adminNotifications.id, id))
      .returning();
    return updatedNotification;
  }

  async markNotificationAsResolved(id: string): Promise<AdminNotification> {
    const [updatedNotification] = await db
      .update(adminNotifications)
      .set({ 
        status: 'resolved',
        resolvedAt: new Date()
      })
      .where(eq(adminNotifications.id, id))
      .returning();
    return updatedNotification;
  }

  // Atomic job claiming methods for auto-send processor
  async claimSubmissionForSending(id: string): Promise<ClassroomSubmissionWithTeacher | null> {
    // Atomically claim a submission by setting status to 'sending'
    // Only claim if it's currently in a sendable state
    const [claimedSubmission] = await db
      .update(classroomSubmissions)
      .set({ 
        status: 'sending',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(classroomSubmissions.id, id),
          inArray(classroomSubmissions.status, ['pending', 'approved']),
          sql`${classroomSubmissions.autoSendTime} <= ${new Date()}`,
          eq(classroomSubmissions.urgentFlag, false)
        )
      )
      .returning();

    if (!claimedSubmission) {
      return null; // Already claimed or no longer eligible
    }

    // Fetch the full submission with teacher details to ensure we have complete data
    const fullSubmission = await this.getClassroomSubmission(id);
    if (!fullSubmission) {
      console.error(`❌ Failed to fetch full submission details after claiming ${id}`);
      return null;
    }
    
    // Verify we have teacher data
    if (!fullSubmission.teacher) {
      console.error(`❌ Claimed submission ${id} missing teacher data`);
      await this.revertSubmissionClaim(id); // Revert claim if data is incomplete
      return null;
    }
    
    return fullSubmission;
  }

  async revertSubmissionClaim(id: string): Promise<void> {
    // Revert a submission back to pending if sending failed
    // Only revert if it's currently in 'sending' status
    await db
      .update(classroomSubmissions)
      .set({ 
        status: 'pending',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(classroomSubmissions.id, id),
          eq(classroomSubmissions.status, 'sending')
        )
      );
  }
}

export const storage = new DatabaseStorage();
