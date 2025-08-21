import { api, Query } from "encore.dev/api";
import { referralDB } from "./db";
import { getAuthData } from "~encore/auth";

export interface ListSupportRequestsRequest {
  limit?: Query<number>;
  teacher?: Query<string>;
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

export interface ListSupportRequestsResponse {
  supportRequests: SupportRequest[];
}

// Retrieves all support requests, optionally filtered by teacher.
export const list = api<ListSupportRequestsRequest, ListSupportRequestsResponse>(
  { expose: true, method: "GET", path: "/referrals", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const limit = req.limit || 50;
    let query = `
      SELECT 
        id,
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
        created_at
      FROM referrals
    `;
    
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (!auth.isAdmin) {
      whereClauses.push(`created_by_email = $${params.length + 1}`);
      params.push(auth.email);
    } else if (req.teacher) {
      whereClauses.push(`teacher = $${params.length + 1}`);
      params.push(req.teacher);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(" AND ")}`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const rows = await referralDB.rawQueryAll<{
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
    }>(query, ...params);

    const supportRequests: SupportRequest[] = rows.map(row => ({
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
    }));

    return { supportRequests };
  }
);
