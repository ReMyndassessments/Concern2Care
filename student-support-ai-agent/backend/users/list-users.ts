import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { getAuthData } from "~encore/auth";
import type { UserProfile } from "./me";

export interface ListUsersResponse {
  users: UserProfile[];
}

// Lists all users in the system. For admins only.
export const listUsers = api<void, ListUsersResponse>(
  { expose: true, method: "GET", path: "/users/admin/list", auth: true },
  async () => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("You do not have permission to list users.");
    }

    const users = await userDB.queryAll<any>`
      SELECT 
        id, email, name, school_name, school_district, primary_grade, primary_subject, 
        class_id, additional_grades, additional_subjects, teacher_type, school_year,
        referrals_used_this_month, referrals_limit, additional_referral_packages,
        subscription_start_date, subscription_end_date, deepseek_api_key, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        isAdmin: false,
        schoolName: user.school_name || undefined,
        schoolDistrict: user.school_district || undefined,
        primaryGrade: user.primary_grade || undefined,
        primarySubject: user.primary_subject || undefined,
        classId: user.class_id || undefined,
        additionalGrades: user.additional_grades || undefined,
        additionalSubjects: user.additional_subjects || undefined,
        teacherType: user.teacher_type || undefined,
        schoolYear: user.school_year || undefined,
        supportRequestsUsedThisMonth: user.referrals_used_this_month,
        supportRequestsLimit: user.referrals_limit,
        additionalSupportRequestPackages: user.additional_referral_packages,
        subscriptionStartDate: user.subscription_start_date || undefined,
        subscriptionEndDate: user.subscription_end_date || undefined,
        hasDeepSeekApiKey: !!user.deepseek_api_key,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }))
    };
  }
);
