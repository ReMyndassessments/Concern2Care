import { api } from "encore.dev/api";
import { userDB } from "../users/db";
import { referralDB } from "../referrals/db";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";

export interface ExportDataRequest {
  type: 'teachers' | 'support_requests' | 'all';
  format: 'csv' | 'json';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface ExportDataResponse {
  data: string; // Base64 encoded file content
  filename: string;
  contentType: string;
}

// Exports system data for admin analysis.
export const exportData = api<ExportDataRequest, ExportDataResponse>(
  { expose: true, method: "POST", path: "/admin/export", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    let data: any[] = [];
    let filename = '';

    if (req.type === 'teachers' || req.type === 'all') {
      const teachers = await userDB.queryAll<any>`
        SELECT 
          id, email, name, school_name, school_district, primary_grade, primary_subject,
          teacher_type, referrals_used_this_month, referrals_limit, 
          subscription_start_date, subscription_end_date, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
      `;

      if (req.type === 'teachers') {
        data = teachers;
        filename = `teachers_export_${new Date().toISOString().split('T')[0]}`;
      } else {
        data.push({ type: 'teachers', data: teachers });
      }
    }

    if (req.type === 'support_requests' || req.type === 'all') {
      let query = `
        SELECT 
          id, student_first_name, student_last_initial, grade, teacher, teacher_position,
          incident_date, location, concern_types, concern_description, severity_level,
          actions_taken, ai_recommendations, created_by_email, created_at
        FROM referrals
      `;

      const params: any[] = [];
      if (req.dateRange) {
        query += ` WHERE created_at BETWEEN $1 AND $2`;
        params.push(new Date(req.dateRange.startDate), new Date(req.dateRange.endDate));
      }

      query += ` ORDER BY created_at DESC`;

      const supportRequests = await referralDB.rawQueryAll<any>(query, ...params);

      if (req.type === 'support_requests') {
        data = supportRequests;
        filename = `support_requests_export_${new Date().toISOString().split('T')[0]}`;
      } else {
        data.push({ type: 'support_requests', data: supportRequests });
        filename = `full_export_${new Date().toISOString().split('T')[0]}`;
      }
    }

    let content: string;
    let contentType: string;

    if (req.format === 'json') {
      content = JSON.stringify(data, null, 2);
      contentType = 'application/json';
      filename += '.json';
    } else {
      // CSV format
      if (req.type === 'all') {
        // For 'all' type, create a simple JSON export since CSV doesn't handle nested structures well
        content = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        filename += '.json';
      } else {
        content = convertToCSV(data);
        contentType = 'text/csv';
        filename += '.csv';
      }
    }

    const encodedContent = Buffer.from(content).toString('base64');

    return {
      data: encodedContent,
      filename,
      contentType
    };
  }
);

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}
