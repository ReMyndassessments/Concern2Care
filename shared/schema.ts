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

// Schools table for managing educational institutions
export const schools = pgTable("schools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  district: varchar("district"),
  address: text("address"),
  contactEmail: varchar("contact_email"),
  maxTeachers: integer("max_teachers").default(50),
  defaultRequestsPerTeacher: integer("default_requests_per_teacher").default(20),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // Hashed password for teacher login
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  school: varchar("school"), // Keep for backward compatibility
  schoolId: varchar("school_id").references(() => schools.id), // New structured school reference
  supportRequestsUsed: integer("support_requests_used").default(0),
  supportRequestsLimit: integer("support_requests_limit").default(20),
  additionalRequests: integer("additional_requests").default(0), // Bonus requests granted by admin
  isAdmin: boolean("is_admin").default(false),
  role: varchar("role").default('teacher'), // 'teacher' | 'admin' | 'super_admin'
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
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
  saved: boolean("saved").default(false),
  savedAt: timestamp("saved_at"),
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

// Progress notes for tracking intervention implementation and outcomes
export const progressNotes = pgTable("progress_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  interventionId: varchar("intervention_id").references(() => interventions.id).notNull(),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  note: text("note").notNull(),
  outcome: varchar("outcome"), // 'positive', 'mixed', 'needs_adjustment', 'no_change'
  nextSteps: text("next_steps"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin activity logging for audit trails
export const adminLogs = pgTable("admin_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(), // 'create_user' | 'update_user' | 'grant_requests' | 'create_school' etc.
  targetUserId: varchar("target_user_id").references(() => users.id),
  targetSchoolId: varchar("target_school_id").references(() => schools.id),
  details: jsonb("details").notNull().default('{}'), // Action-specific details
  createdAt: timestamp("created_at").defaultNow(),
});

// Performance analytics - daily aggregated stats
export const dailyStats = pgTable("daily_stats", {
  date: varchar("date").primaryKey(), // YYYY-MM-DD format
  totalConcernsCreated: integer("total_concerns_created").default(0),
  totalUsersActive: integer("total_users_active").default(0),
  totalAiRequests: integer("total_ai_requests").default(0),
  averageResponseTime: integer("average_response_time").default(0), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Feature flags for controlling system features
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flagName: varchar("flag_name").unique().notNull(),
  isGloballyEnabled: boolean("is_globally_enabled").default(false),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// School-specific feature flag overrides
export const schoolFeatureOverrides = pgTable("school_feature_overrides", {
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  flagName: varchar("flag_name").notNull(),
  isEnabled: boolean("is_enabled").notNull(),
  enabledBy: varchar("enabled_by").references(() => users.id),
  enabledAt: timestamp("enabled_at").defaultNow(),
}, (table) => [index("school_feature_idx").on(table.schoolId, table.flagName)]);

// AI API Keys management for DeepSeek and other providers
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  provider: varchar("provider").notNull().default('deepseek'), // 'deepseek', 'openai', etc.
  apiKey: text("api_key").notNull(), // Encrypted API key
  isActive: boolean("is_active").default(true),
  description: text("description"),
  usageCount: integer("usage_count").default(0),
  maxUsage: integer("max_usage").default(10000), // Monthly usage limit
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const schoolRelations = relations(schools, ({ many }) => ({
  users: many(users),
  featureOverrides: many(schoolFeatureOverrides),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id],
  }),
  concerns: many(concerns),
  adminLogs: many(adminLogs, { relationName: "admin_actions" }),
  targetLogs: many(adminLogs, { relationName: "admin_targets" }),
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

export const interventionRelations = relations(interventions, ({ one, many }) => ({
  concern: one(concerns, {
    fields: [interventions.concernId],
    references: [concerns.id],
  }),
  progressNotes: many(progressNotes),
}));

export const progressNoteRelations = relations(progressNotes, ({ one }) => ({
  intervention: one(interventions, {
    fields: [progressNotes.interventionId],
    references: [interventions.id],
  }),
  teacher: one(users, {
    fields: [progressNotes.teacherId],
    references: [users.id],
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

export const adminLogRelations = relations(adminLogs, ({ one }) => ({
  admin: one(users, {
    fields: [adminLogs.adminId],
    references: [users.id],
    relationName: "admin_actions",
  }),
  targetUser: one(users, {
    fields: [adminLogs.targetUserId],
    references: [users.id],
    relationName: "admin_targets",
  }),
  targetSchool: one(schools, {
    fields: [adminLogs.targetSchoolId],
    references: [schools.id],
  }),
}));

export const schoolFeatureOverrideRelations = relations(schoolFeatureOverrides, ({ one }) => ({
  school: one(schools, {
    fields: [schoolFeatureOverrides.schoolId],
    references: [schools.id],
  }),
  enabledByUser: one(users, {
    fields: [schoolFeatureOverrides.enabledBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertConcernSchema = createInsertSchema(concerns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  incidentDate: true, // Auto-generated server-side
}).extend({
  concernTypes: z.array(z.string()).min(1, "At least one concern type is required"),
  actionsTaken: z.array(z.string()).default([]),
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

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  createdAt: true,
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProgressNoteSchema = createInsertSchema(progressNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  lastUsedAt: true,
});

export const apiKeyRelations = relations(apiKeys, ({ one }) => ({
  createdByUser: one(users, {
    fields: [apiKeys.createdBy],
    references: [users.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schools.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type SchoolFeatureOverride = typeof schoolFeatureOverrides.$inferSelect;
export type DailyStat = typeof dailyStats.$inferSelect;
export type InsertConcern = z.infer<typeof insertConcernSchema>;
export type Concern = typeof concerns.$inferSelect;
export type InsertIntervention = z.infer<typeof insertInterventionSchema>;
export type Intervention = typeof interventions.$inferSelect;
export type InsertFollowUpQuestion = z.infer<typeof insertFollowUpQuestionSchema>;
export type FollowUpQuestion = typeof followUpQuestions.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertProgressNote = z.infer<typeof insertProgressNoteSchema>;
export type ProgressNote = typeof progressNotes.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// Extended types with relations
export type ConcernWithDetails = Concern & {
  interventions: InterventionWithProgressNotes[];
  followUpQuestions: FollowUpQuestion[];
  teacher: User;
};

export type InterventionWithProgressNotes = Intervention & {
  progressNotes: ProgressNote[];
};

export type UserWithSchool = Omit<User, 'school'> & {
  school: School | null;
};

export type SchoolWithUsers = School & {
  users: User[];
};

export type AdminLogWithDetails = AdminLog & {
  admin: User;
  targetUser: User | null;
  targetSchool: School | null;
};
