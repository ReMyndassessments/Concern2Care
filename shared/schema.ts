import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  school: varchar("school"),
  supportRequestsUsed: integer("support_requests_used").default(0),
  supportRequestsLimit: integer("support_requests_limit").default(20),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const concerns = pgTable("concerns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  studentFirstName: varchar("student_first_name").notNull(),
  studentLastInitial: varchar("student_last_initial", { length: 1 }).notNull(),
  grade: varchar("grade").notNull(),
  teacherPosition: varchar("teacher_position").notNull(),
  incidentDate: timestamp("incident_date").notNull(),
  location: varchar("location").notNull(),
  concernType: varchar("concern_type"), // Keep for backward compatibility
  concernTypes: jsonb("concern_types").notNull().default('[]'), // New array format
  otherConcernType: varchar("other_concern_type"),
  description: text("description").notNull(),
  severityLevel: varchar("severity_level").notNull(),
  actionsTaken: jsonb("actions_taken").notNull().default('[]'),
  otherActionTaken: varchar("other_action_taken"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const interventions = pgTable("interventions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  concernId: varchar("concern_id").references(() => concerns.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  steps: jsonb("steps").notNull(),
  timeline: varchar("timeline"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const followUpQuestions = pgTable("follow_up_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  concernId: varchar("concern_id").references(() => concerns.id).notNull(),
  question: text("question").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  concernId: varchar("concern_id").references(() => concerns.id).notNull(),
  pdfPath: varchar("pdf_path"),
  sharedWith: jsonb("shared_with").default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  concerns: many(concerns),
}));

export const concernRelations = relations(concerns, ({ one, many }) => ({
  teacher: one(users, {
    fields: [concerns.teacherId],
    references: [users.id],
  }),
  interventions: many(interventions),
  followUpQuestions: many(followUpQuestions),
  reports: many(reports),
}));

export const interventionRelations = relations(interventions, ({ one }) => ({
  concern: one(concerns, {
    fields: [interventions.concernId],
    references: [concerns.id],
  }),
}));

export const followUpQuestionRelations = relations(followUpQuestions, ({ one }) => ({
  concern: one(concerns, {
    fields: [followUpQuestions.concernId],
    references: [concerns.id],
  }),
}));

export const reportRelations = relations(reports, ({ one }) => ({
  concern: one(concerns, {
    fields: [reports.concernId],
    references: [concerns.id],
  }),
}));

// Insert schemas
export const insertConcernSchema = createInsertSchema(concerns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  concernTypes: z.array(z.string()).min(1, "At least one concern type is required"),
  actionsTaken: z.array(z.string()).default([]),
  incidentDate: z.string().min(1, "Incident date is required"),
});

export const insertInterventionSchema = createInsertSchema(interventions).omit({
  id: true,
  createdAt: true,
});

export const insertFollowUpQuestionSchema = createInsertSchema(followUpQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertConcern = z.infer<typeof insertConcernSchema>;
export type Concern = typeof concerns.$inferSelect;
export type InsertIntervention = z.infer<typeof insertInterventionSchema>;
export type Intervention = typeof interventions.$inferSelect;
export type InsertFollowUpQuestion = z.infer<typeof insertFollowUpQuestionSchema>;
export type FollowUpQuestion = typeof followUpQuestions.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// Extended types with relations
export type ConcernWithDetails = Concern & {
  interventions: Intervention[];
  followUpQuestions: FollowUpQuestion[];
  teacher: User;
};
