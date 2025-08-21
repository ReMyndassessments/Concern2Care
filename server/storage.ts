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
  
  // Concern operations
  createConcern(concern: InsertConcern): Promise<Concern>;
  getConcernsByTeacher(teacherId: string): Promise<Concern[]>;
  getConcernWithDetails(id: string): Promise<ConcernWithDetails | undefined>;
  
  // Intervention operations
  createInterventions(interventions: InsertIntervention[]): Promise<Intervention[]>;
  
  // Follow-up question operations
  createFollowUpQuestion(question: InsertFollowUpQuestion): Promise<FollowUpQuestion>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
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

  // Concern operations
  async createConcern(concern: InsertConcern): Promise<Concern> {
    const [newConcern] = await db.insert(concerns).values(concern).returning();
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
    return await db.insert(interventions).values(interventionData).returning();
  }

  // Follow-up question operations
  async createFollowUpQuestion(question: InsertFollowUpQuestion): Promise<FollowUpQuestion> {
    const [newQuestion] = await db.insert(followUpQuestions).values(question).returning();
    return newQuestion;
  }

  // Report operations
  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
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
