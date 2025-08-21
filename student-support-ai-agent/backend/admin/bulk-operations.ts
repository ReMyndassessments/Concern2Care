import { api } from "encore.dev/api";
import { userDB } from "../users/db";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";

export interface BulkUpdateTeachersRequest {
  teacherIds: number[];
  updates: {
    subscriptionEndDate?: string;
    supportRequestsLimit?: number;
    schoolName?: string;
    schoolDistrict?: string;
  };
}

export interface BulkUpdateResult {
  success: boolean;
  updatedCount: number;
  errors: string[];
}

export interface BulkDeleteTeachersRequest {
  teacherIds: number[];
}

export interface BulkDeleteResult {
  success: boolean;
  deletedCount: number;
  errors: string[];
}

// Bulk update multiple teachers at once.
export const bulkUpdateTeachers = api<BulkUpdateTeachersRequest, BulkUpdateResult>(
  { expose: true, method: "POST", path: "/admin/teachers/bulk-update", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    if (req.teacherIds.length === 0) {
      throw APIError.invalidArgument("No teacher IDs provided");
    }

    const errors: string[] = [];
    let updatedCount = 0;

    for (const teacherId of req.teacherIds) {
      try {
        const subscriptionEndDate = req.updates.subscriptionEndDate ? new Date(req.updates.subscriptionEndDate) : undefined;

        await userDB.exec`
          UPDATE users
          SET
            subscription_end_date = COALESCE(${subscriptionEndDate}, subscription_end_date),
            referrals_limit = COALESCE(${req.updates.supportRequestsLimit || null}, referrals_limit),
            school_name = COALESCE(${req.updates.schoolName || null}, school_name),
            school_district = COALESCE(${req.updates.schoolDistrict || null}, school_district),
            updated_at = NOW()
          WHERE id = ${teacherId}
        `;
        updatedCount++;
      } catch (error) {
        errors.push(`Failed to update teacher ID ${teacherId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      updatedCount,
      errors
    };
  }
);

// Bulk delete multiple teachers at once.
export const bulkDeleteTeachers = api<BulkDeleteTeachersRequest, BulkDeleteResult>(
  { expose: true, method: "POST", path: "/admin/teachers/bulk-delete", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    if (req.teacherIds.length === 0) {
      throw APIError.invalidArgument("No teacher IDs provided");
    }

    const errors: string[] = [];
    let deletedCount = 0;

    for (const teacherId of req.teacherIds) {
      try {
        await userDB.exec`DELETE FROM users WHERE id = ${teacherId}`;
        deletedCount++;
      } catch (error) {
        errors.push(`Failed to delete teacher ID ${teacherId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      deletedCount,
      errors
    };
  }
);
