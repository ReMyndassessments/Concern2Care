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
  
  // Demo Program Management
  isDemoSchool: boolean("is_demo_school").default(false),
  demoStartDate: timestamp("demo_start_date"),
  demoEndDate: timestamp("demo_end_date"),
  demoStatus: varchar("demo_status").default("inactive"), // 'inactive' | 'active' | 'expired' | 'converted'
  pilotTeacherCount: integer("pilot_teacher_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table for teachers and admins.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // Hashed password for teacher login
  adminViewablePassword: varchar("admin_viewable_password"), // Plain text password for admin viewing
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  school: varchar("school"), // Simple school name field
  schoolDistrict: varchar("school_district"), // School district information
  primaryGrade: varchar("primary_grade"), // Primary grade taught
  primarySubject: varchar("primary_subject"), // Primary subject taught
  teacherType: varchar("teacher_type"), // Teacher role type
  supportRequestsUsed: integer("support_requests_used").default(0),
  supportRequestsLimit: integer("support_requests_limit").default(20),
  additionalRequests: integer("additional_requests").default(0), // Bonus requests granted by admin
  lastUsageReset: timestamp("last_usage_reset").defaultNow(), // Track monthly usage reset
  isAdmin: boolean("is_admin").default(false),
  role: varchar("role").default('teacher'), // 'teacher' | 'admin' | 'super_admin'
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  activeUsersIdx: index("users_active_idx").on(table.isActive),
  lastLoginIdx: index("users_last_login_idx").on(table.lastLoginAt),
}));

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
  
  // Student differentiation needs (optional fields for better AI recommendations)
  hasIep: boolean("has_iep").default(false),
  hasDisability: boolean("has_disability").default(false),
  disabilityType: varchar("disability_type"), // e.g., "ADHD", "Autism", "Learning Disability"
  isEalLearner: boolean("is_eal_learner").default(false),
  ealProficiency: varchar("eal_proficiency"), // e.g., "Beginner", "Intermediate", "Advanced"
  isGifted: boolean("is_gifted").default(false),
  isStruggling: boolean("is_struggling").default(false),
  otherNeeds: varchar("other_needs"), // Free text for anything else
  
  // Text content for enhanced AI recommendations
  studentAssessmentFile: varchar("student_assessment_file"), // URL to uploaded assessment
  lessonPlanContent: text("lesson_plan_content"), // Text content of lesson plan
  
  // Task type selection for focused AI responses
  taskType: varchar("task_type").default("tier2_intervention"), // "differentiation" | "tier2_intervention"
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  teacherIdIdx: index("concerns_teacher_id_idx").on(table.teacherId),
  createdAtIdx: index("concerns_created_at_idx").on(table.createdAt),
  severityIdx: index("concerns_severity_idx").on(table.severityLevel),
  taskTypeIdx: index("concerns_task_type_idx").on(table.taskType),
}));

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

// User-level email configurations
export const userEmailConfigs = pgTable("user_email_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  smtpHost: varchar("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpSecure: boolean("smtp_secure").default(false), // true for 465, false for other ports
  smtpUser: varchar("smtp_user").notNull(),
  smtpPassword: text("smtp_password").notNull(), // Encrypted
  fromAddress: varchar("from_address"), // Optional custom from address
  fromName: varchar("from_name"), // Optional custom from name
  isActive: boolean("is_active").default(true),
  lastTestedAt: timestamp("last_tested_at"),
  testStatus: varchar("test_status"), // 'success' | 'failed' | 'pending'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// School-level email configurations 
export const schoolEmailConfigs = pgTable("school_email_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id).notNull().unique(),
  smtpHost: varchar("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpSecure: boolean("smtp_secure").default(false),
  smtpUser: varchar("smtp_user").notNull(),
  smtpPassword: text("smtp_password").notNull(), // Encrypted
  fromAddress: varchar("from_address"), // School's preferred from address
  fromName: varchar("from_name"), // School name for emails
  isActive: boolean("is_active").default(true),
  configuredBy: varchar("configured_by").references(() => users.id).notNull(),
  lastTestedAt: timestamp("last_tested_at"),
  testStatus: varchar("test_status"), // 'success' | 'failed' | 'pending'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Classroom Solutions: Enrolled Teachers
export const classroomEnrolledTeachers = pgTable("classroom_enrolled_teachers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull().unique(),
  position: varchar("position").notNull(), // e.g., "3rd Grade Teacher"
  school: varchar("school"),
  requestsUsed: integer("requests_used").default(0),
  requestsLimit: integer("requests_limit").default(5),
  lastUsageReset: timestamp("last_usage_reset"),
  isActive: boolean("is_active").default(true),
  enrolledBy: varchar("enrolled_by").references(() => users.id).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("classroom_enrolled_teachers_email_idx").on(table.email),
  activeIdx: index("classroom_enrolled_teachers_active_idx").on(table.isActive),
}));

// Teacher Limits: Tracks monthly usage quota (5 per month)
export const teacherLimits = pgTable("teacher_limits", {
  teacherId: varchar("teacher_id").references(() => classroomEnrolledTeachers.id).primaryKey(),
  monthYear: varchar("month_year", { length: 7 }).notNull(), // Format YYYY-MM
  submissionsUsed: integer("submissions_used").default(0),
  limit: integer("limit").default(5), // Configurable limit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  monthIdx: index("teacher_limits_month_idx").on(table.monthYear),
}));

// Admin Notifications: Stores pings for urgent cases & follow-ups
export const adminNotifications = pgTable("admin_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").references(() => classroomSubmissions.id).notNull(), // Related case
  adminId: varchar("admin_id").references(() => users.id), // If assigned to specific admin
  type: varchar("type").notNull(), // 'urgent' | 'reminder' | 'followup'
  status: varchar("status").notNull().default('unread'), // 'unread' | 'read' | 'resolved'
  title: varchar("title").notNull(),
  message: text("message"),
  priority: varchar("priority").default('normal'), // 'low' | 'normal' | 'high' | 'urgent'
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
  resolvedAt: timestamp("resolved_at"),
}, (table) => ({
  submissionIdx: index("admin_notifications_submission_idx").on(table.submissionId),
  statusIdx: index("admin_notifications_status_idx").on(table.status),
  priorityIdx: index("admin_notifications_priority_idx").on(table.priority),
  createdAtIdx: index("admin_notifications_created_at_idx").on(table.createdAt),
}));

// Classroom Reports: Pre-computed reporting for dashboards
export const classroomReports = pgTable("classroom_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  monthYear: varchar("month_year", { length: 7 }).notNull(), // Reporting cycle YYYY-MM
  totalSubmissions: integer("total_submissions").default(0),
  differentiationRequests: integer("differentiation_requests").default(0),
  tier2Requests: integer("tier2_requests").default(0),
  mildCases: integer("mild_cases").default(0),
  moderateCases: integer("moderate_cases").default(0),
  urgentCases: integer("urgent_cases").default(0),
  autoSentRate: integer("auto_sent_rate").default(0), // Percentage (0-100)
  avgReviewTimeMinutes: integer("avg_review_time_minutes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  monthIdx: index("classroom_reports_month_idx").on(table.monthYear),
}));

// Classroom Solutions: Form Submissions
export const classroomSubmissions = pgTable("classroom_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").references(() => classroomEnrolledTeachers.id).notNull(),
  
  // Teacher Info (from form)
  teacherFirstName: varchar("teacher_first_name").notNull(),
  teacherLastInitial: varchar("teacher_last_initial").notNull(),
  teacherPosition: varchar("teacher_position").notNull(),
  teacherEmail: varchar("teacher_email").notNull(),
  
  // Student Info (anonymized) - enhanced for privacy
  firstName: varchar("first_name", { length: 50 }).notNull(), // Student first name or initials
  lastInitial: varchar("last_initial", { length: 1 }).notNull(), // Student last initial
  studentAge: integer("student_age").notNull(),
  studentGrade: varchar("student_grade", { length: 10 }).notNull(),
  
  // Form Data - enhanced with required enums
  taskType: varchar("task_type").notNull(), // 'differentiation' | 'tier2_intervention'
  learningProfile: jsonb("learning_profile").notNull().default('[]'), // Array of profile tags
  
  // Additional details for specific learning profile items
  englishAsAdditionalLanguageDetails: text("english_as_additional_language_details"),
  diagnosedDisabilityDetails: text("diagnosed_disability_details"),
  otherLearningNeedsDetails: text("other_learning_needs_details"),
  
  concernTypes: jsonb("concern_types").notNull().default('[]'), // Array of selected concern categories
  concernDescription: text("concern_description").notNull(),
  severityLevel: varchar("severity_level").notNull(), // 'mild' | 'moderate' | 'urgent'
  actionsTaken: jsonb("actions_taken").notNull().default('[]'), // Array of teacher's actions
  
  // Enhanced Workflow Status
  status: varchar("status").notNull().default('pending'), // 'pending' | 'reviewed' | 'auto_sent' | 'urgent_flagged' | 'completed'
  
  // AI Content Management - separated for clarity
  aiDraft: text("ai_draft"), // Auto-generated intervention text
  reviewedText: text("reviewed_text"), // Admin-updated intervention text
  sentText: text("sent_text"), // Final version sent to teacher
  disclaimerAttached: boolean("disclaimer_attached").default(true), // Always TRUE for sent outputs
  
  // Urgent Case Handling
  urgentFlag: boolean("urgent_flag").default(false), // Auto-set if keyword trigger or teacher marked urgent
  
  // Delayed Delivery System
  autoSendTime: timestamp("auto_send_time"), // When draft will be auto-sent (created_at + 30min by default)
  sentAt: timestamp("sent_at"), // When actually sent to teacher
  
  // Admin Review Tracking
  adminReviewedBy: varchar("admin_reviewed_by").references(() => users.id), // Null if auto-sent
  adminNotes: text("admin_notes"),
  
  // Legacy fields for backward compatibility
  aiDraftGenerated: boolean("ai_draft_generated").default(false),
  aiDraftContent: text("ai_draft_content"), // Keep for backward compatibility
  finalContent: text("final_content"), // Keep for backward compatibility
  
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  teacherIdIdx: index("classroom_submissions_teacher_id_idx").on(table.teacherId),
  statusIdx: index("classroom_submissions_status_idx").on(table.status),
  urgentIdx: index("classroom_submissions_urgent_idx").on(table.urgentFlag),
  autoSendIdx: index("classroom_submissions_auto_send_idx").on(table.autoSendTime),
  createdAtIdx: index("classroom_submissions_created_at_idx").on(table.submittedAt),
}));

// Relations
export const schoolRelations = relations(schools, ({ one, many }) => ({
  users: many(users),
  featureOverrides: many(schoolFeatureOverrides),
  emailConfig: one(schoolEmailConfigs),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  concerns: many(concerns),
  adminLogs: many(adminLogs, { relationName: "admin_actions" }),
  targetLogs: many(adminLogs, { relationName: "admin_targets" }),
  emailConfig: one(userEmailConfigs),
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

export const insertUserEmailConfigSchema = createInsertSchema(userEmailConfigs).omit({
  id: true,
  userId: true, // Omit userId - it comes from authenticated user, not request body
  createdAt: true,
  updatedAt: true,
  lastTestedAt: true,
  testStatus: true,
});

export const insertSchoolEmailConfigSchema = createInsertSchema(schoolEmailConfigs).omit({
  id: true,
  schoolId: true, // Omit schoolId - it comes from authenticated user's school
  configuredBy: true, // Omit configuredBy - it comes from authenticated user
  createdAt: true,
  updatedAt: true,
  lastTestedAt: true,
  testStatus: true,
});

export const apiKeyRelations = relations(apiKeys, ({ one }) => ({
  createdByUser: one(users, {
    fields: [apiKeys.createdBy],
    references: [users.id],
  }),
}));

export const userEmailConfigRelations = relations(userEmailConfigs, ({ one }) => ({
  user: one(users, {
    fields: [userEmailConfigs.userId],
    references: [users.id],
  }),
}));

export const schoolEmailConfigRelations = relations(schoolEmailConfigs, ({ one }) => ({
  school: one(schools, {
    fields: [schoolEmailConfigs.schoolId],
    references: [schools.id],
  }),
  configuredByUser: one(users, {
    fields: [schoolEmailConfigs.configuredBy],
    references: [users.id],
  }),
}));

// Classroom Solutions Relations
export const classroomEnrolledTeacherRelations = relations(classroomEnrolledTeachers, ({ one, many }) => ({
  enrolledByUser: one(users, {
    fields: [classroomEnrolledTeachers.enrolledBy],
    references: [users.id],
  }),
  submissions: many(classroomSubmissions),
  limits: many(teacherLimits),
}));

export const classroomSubmissionRelations = relations(classroomSubmissions, ({ one, many }) => ({
  teacher: one(classroomEnrolledTeachers, {
    fields: [classroomSubmissions.teacherId],
    references: [classroomEnrolledTeachers.id],
  }),
  reviewedByAdmin: one(users, {
    fields: [classroomSubmissions.adminReviewedBy],
    references: [users.id],
  }),
  notifications: many(adminNotifications),
}));

export const teacherLimitRelations = relations(teacherLimits, ({ one }) => ({
  teacher: one(classroomEnrolledTeachers, {
    fields: [teacherLimits.teacherId],
    references: [classroomEnrolledTeachers.id],
  }),
}));

export const adminNotificationRelations = relations(adminNotifications, ({ one }) => ({
  submission: one(classroomSubmissions, {
    fields: [adminNotifications.submissionId],
    references: [classroomSubmissions.id],
  }),
  admin: one(users, {
    fields: [adminNotifications.adminId],
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
export type InsertUserEmailConfig = z.infer<typeof insertUserEmailConfigSchema>;
export type UserEmailConfig = typeof userEmailConfigs.$inferSelect;
export type InsertSchoolEmailConfig = z.infer<typeof insertSchoolEmailConfigSchema>;
export type SchoolEmailConfig = typeof schoolEmailConfigs.$inferSelect;

// Extended types with relations
export type ConcernWithDetails = Concern & {
  interventions: InterventionWithProgressNotes[];
  followUpQuestions: FollowUpQuestion[];
  teacher: User;
};

export type InterventionWithProgressNotes = Intervention & {
  progressNotes: ProgressNote[];
};

export type UserWithSchool = User;

export type SchoolWithUsers = School & {
  users: User[];
};

export type UserWithEmailConfig = User & {
  emailConfig: UserEmailConfig | null;
};

export type SchoolWithEmailConfig = School & {
  emailConfig: SchoolEmailConfig | null;
};

export type AdminLogWithDetails = AdminLog & {
  admin: User;
  targetUser: User | null;
  targetSchool: School | null;
};

// Enhanced Classroom Solutions schemas
export const insertClassroomEnrolledTeacherSchema = createInsertSchema(classroomEnrolledTeachers).omit({
  id: true,
  requestsUsed: true,
  lastUsageReset: true,
  enrolledAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClassroomSubmissionSchema = createInsertSchema(classroomSubmissions).omit({
  id: true,
  teacherId: true,
  status: true,
  aiDraft: true,
  reviewedText: true,
  sentText: true,
  disclaimerAttached: true,
  urgentFlag: true,
  autoSendTime: true,
  sentAt: true,
  adminReviewedBy: true,
  adminNotes: true,
  aiDraftGenerated: true,
  aiDraftContent: true,
  finalContent: true,
  submittedAt: true,
  updatedAt: true,
}).extend({
  taskType: z.enum(['differentiation', 'tier2_intervention']),
  severityLevel: z.enum(['mild', 'moderate', 'urgent']),
  learningProfile: z.array(z.string()).default([]),
  concernTypes: z.array(z.string()).min(1, "At least one concern type is required"),
  actionsTaken: z.array(z.string()).default([]),
});

export const insertTeacherLimitSchema = createInsertSchema(teacherLimits).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
  resolvedAt: true,
});

export const insertClassroomReportSchema = createInsertSchema(classroomReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced Classroom Solutions types
export type InsertClassroomEnrolledTeacher = z.infer<typeof insertClassroomEnrolledTeacherSchema>;
export type ClassroomEnrolledTeacher = typeof classroomEnrolledTeachers.$inferSelect;
export type InsertClassroomSubmission = z.infer<typeof insertClassroomSubmissionSchema>;
export type ClassroomSubmission = typeof classroomSubmissions.$inferSelect;
export type InsertTeacherLimit = z.infer<typeof insertTeacherLimitSchema>;
export type TeacherLimit = typeof teacherLimits.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertClassroomReport = z.infer<typeof insertClassroomReportSchema>;
export type ClassroomReport = typeof classroomReports.$inferSelect;

// Extended types for Classroom Solutions with relations
export type ClassroomSubmissionWithTeacher = ClassroomSubmission & {
  teacher: ClassroomEnrolledTeacher;
};

export type ClassroomSubmissionWithDetails = ClassroomSubmission & {
  teacher: ClassroomEnrolledTeacher;
  reviewedByAdmin?: User;
  notifications: AdminNotification[];
};

export type ClassroomEnrolledTeacherWithLimits = ClassroomEnrolledTeacher & {
  limits: TeacherLimit[];
  submissions: ClassroomSubmission[];
};

export type AdminNotificationWithDetails = AdminNotification & {
  submission: ClassroomSubmission;
  admin?: User;
};

// Severity and status enums for type safety
export const CLASSROOM_TASK_TYPES = ['differentiation', 'tier2_intervention'] as const;
export const CLASSROOM_SEVERITY_LEVELS = ['mild', 'moderate', 'urgent'] as const;
export const CLASSROOM_SUBMISSION_STATUSES = ['pending', 'reviewed', 'auto_sent', 'urgent_flagged', 'completed'] as const;
export const ADMIN_NOTIFICATION_TYPES = ['urgent', 'reminder', 'followup'] as const;
export const ADMIN_NOTIFICATION_STATUSES = ['unread', 'read', 'resolved'] as const;
export const ADMIN_NOTIFICATION_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

export type ClassroomTaskType = typeof CLASSROOM_TASK_TYPES[number];
export type ClassroomSeverityLevel = typeof CLASSROOM_SEVERITY_LEVELS[number];
export type ClassroomSubmissionStatus = typeof CLASSROOM_SUBMISSION_STATUSES[number];
export type AdminNotificationType = typeof ADMIN_NOTIFICATION_TYPES[number];
export type AdminNotificationStatus = typeof ADMIN_NOTIFICATION_STATUSES[number];
export type AdminNotificationPriority = typeof ADMIN_NOTIFICATION_PRIORITIES[number];
