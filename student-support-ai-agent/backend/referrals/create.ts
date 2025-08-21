import { api, APIError } from "encore.dev/api";
import { referralDB } from "./db";
import { users } from "~encore/clients";
import { getAuthData } from "~encore/auth";
import log from "encore.dev/log";

export interface CreateSupportRequestRequest {
  studentFirstName: string;
  studentLastInitial: string;
  grade: string;
  teacher: string;
  teacherPosition: string;
  incidentDate: string;
  location: string;
  concernTypes: string[];
  otherConcernType?: string;
  concernDescription: string;
  severityLevel: string;
  actionsTaken: string[];
  otherActionTaken?: string;
  aiRecommendations?: string;
}

export interface SupportRequest {
  id: number;
  studentFirstName: string;
  studentLastInitial: string;
  grade: string;
  teacher: string;
  teacherPosition: string;
  incidentDate: string;
  location: string;
  concernTypes: string[];
  otherConcernType?: string;
  concernDescription: string;
  severityLevel: string;
  actionsTaken: string[];
  otherActionTaken?: string;
  aiRecommendations?: string;
  createdAt: Date;
}

// Creates a new student support request form.
export const create = api<CreateSupportRequestRequest, SupportRequest>(
  { expose: true, method: "POST", path: "/referrals", auth: true },
  async (req) => {
    const auth = getAuthData()!;

    // Check support request limit for all users
    const limitCheck = await users.checkSupportRequestLimit({ email: auth.email });
    
    if (!limitCheck.canCreateSupportRequest) {
      throw APIError.resourceExhausted(
        `Monthly support request limit reached: ${limitCheck.reason}. You have used ${limitCheck.supportRequestsUsed} of ${limitCheck.totalLimit} support requests this month. Please purchase additional packages or wait until next month.`
      );
    }

    const row = await referralDB.queryRow<{
      id: number;
      student_first_name: string;
      student_last_initial: string;
      grade: string;
      teacher: string;
      teacher_position: string;
      incident_date: string;
      location: string;
      concern_types: string;
      other_concern_type: string | null;
      concern_description: string;
      severity_level: string;
      actions_taken: string;
      other_action_taken: string | null;
      ai_recommendations: string | null;
      created_at: Date;
    }>`
      INSERT INTO referrals (
        student_first_name,
        student_last_initial,
        grade,
        teacher,
        teacher_position,
        incident_date,
        location,
        concern_types,
        other_concern_type,
        concern_description,
        severity_level,
        actions_taken,
        other_action_taken,
        ai_recommendations,
        created_by_email
      ) VALUES (
        ${req.studentFirstName},
        ${req.studentLastInitial},
        ${req.grade},
        ${req.teacher},
        ${req.teacherPosition},
        ${req.incidentDate},
        ${req.location},
        ${JSON.stringify(req.concernTypes)},
        ${req.otherConcernType || null},
        ${req.concernDescription},
        ${req.severityLevel},
        ${JSON.stringify(req.actionsTaken)},
        ${req.otherActionTaken || null},
        ${req.aiRecommendations || null},
        ${auth.email}
      )
      RETURNING *
    `;

    if (!row) {
      throw APIError.internal("Failed to create support request");
    }

    // Increment support request usage count for all users
    try {
      await users.incrementSupportRequestUsage({ email: auth.email });
    } catch (error) {
      log.error('Failed to increment support request usage:', { error, email: auth.email });
      // Don't fail the support request creation if usage tracking fails
    }

    return {
      id: row.id,
      studentFirstName: row.student_first_name,
      studentLastInitial: row.student_last_initial,
      grade: row.grade,
      teacher: row.teacher,
      teacherPosition: row.teacher_position,
      incidentDate: row.incident_date,
      location: row.location,
      concernTypes: JSON.parse(row.concern_types),
      otherConcernType: row.other_concern_type || undefined,
      concernDescription: row.concern_description,
      severityLevel: row.severity_level,
      actionsTaken: JSON.parse(row.actions_taken),
      otherActionTaken: row.other_action_taken || undefined,
      aiRecommendations: row.ai_recommendations || undefined,
      createdAt: row.created_at
    };
  }
);
