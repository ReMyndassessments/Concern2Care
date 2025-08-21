import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { getAuthData } from "~encore/auth";
import type { UserProfile } from "./me";
import * as bcrypt from "bcrypt";

export interface UpdateUserByAdminRequest {
  id: number; // from path
  name?: string;
  email?: string;
  password?: string;
  schoolName?: string;
  schoolDistrict?: string;
  teacherType?: string;
  subscriptionEndDate?: string; // ISO 8601 date string
  supportRequestsLimit?: number;
}

// Updates a user's profile. For admins only.
export const updateUserByAdmin = api<UpdateUserByAdminRequest, UserProfile>(
  { expose: true, method: "PUT", path: "/users/admin/:id", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("You do not have permission to update users.");
    }

    const subscriptionEndDate = req.subscriptionEndDate ? new Date(req.subscriptionEndDate) : undefined;
    
    let passwordHash: string | undefined;
    if (req.password) {
      if (req.password.length < 6) {
        throw APIError.invalidArgument("Password must be at least 6 characters long.");
      }
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(req.password, saltRounds);
    }

    const user = await userDB.queryRow<any>`
      UPDATE users
      SET
        name = COALESCE(${req.name || null}, name),
        email = COALESCE(${req.email || null}, email),
        password_hash = COALESCE(${passwordHash || null}, password_hash),
        school_name = COALESCE(${req.schoolName || null}, school_name),
        school_district = COALESCE(${req.schoolDistrict || null}, school_district),
        teacher_type = COALESCE(${req.teacherType || null}, teacher_type),
        subscription_end_date = COALESCE(${subscriptionEndDate}, subscription_end_date),
        referrals_limit = COALESCE(${req.supportRequestsLimit || null}, referrals_limit),
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING
        id, email, name, school_name, school_district, primary_grade, primary_subject, 
        class_id, additional_grades, additional_subjects, teacher_type, school_year,
        referrals_used_this_month, referrals_limit, additional_referral_packages,
        subscription_start_date, subscription_end_date, deepseek_api_key, created_at, updated_at
    `;

    if (!user) {
      throw APIError.notFound("User not found.");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      isAdmin: false, // Only non-admin users can be updated this way
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
    };
  }
);
