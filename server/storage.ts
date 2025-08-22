import {
  users,
  concerns,
  interventions,
  followUpQuestions,
  reports,
  type User,
  type UpsertUser,
  type InsertConcern,
  type Concern,
  type InsertIntervention,
  type Intervention,
  type InsertFollowUpQuestion,
  type FollowUpQuestion,
  type InsertReport,
  type Report,
  type ConcernWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRequestCount(id: string, count: number): Promise<void>;
  incrementUserRequestCount(id: string): Promise<User>;
  checkUserUsageLimit(id: string): Promise<{ canCreate: boolean; used: number; limit: number; }>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    const limit = user.supportRequestsLimit || 20;
    
    return {
      canCreate: used < limit,
      used,
      limit
    };
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
        interventions: true,
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
}

export const storage = new DatabaseStorage();
