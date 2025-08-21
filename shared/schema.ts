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
  concernType: varchar("concern_type").notNull(), // academic, behavior, social-emotional, attendance
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const interventions = pgTable("interventions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  concernId: varchar("concern_id").references(() => concerns.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  steps: jsonb("steps").notNull().$type<string[]>(),
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
  sharedWith: jsonb("shared_with").$type<string[]>().default('[]'),
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
