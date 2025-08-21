import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { getAuthData } from "~encore/auth";
import { secret } from "encore.dev/config";

const adminDeepSeekApiKey = secret("AdminDeepSeekAPIKey");

export interface UserProfile {
  id: number;
  email: string;
  name?: string;
  isAdmin: boolean;
  schoolName?: string;
  schoolDistrict?: string;
  primaryGrade?: string;
  primarySubject?: string;
  classId?: string;
  additionalGrades?: string[];
  additionalSubjects?: string[];
  teacherType?: string;
  schoolYear?: string;
  supportRequestsUsedThisMonth: number;
  supportRequestsLimit: number;
  additionalSupportRequestPackages: number;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  hasDeepSeekApiKey: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  school_name: string | null;
  school_district: string | null;
  primary_grade: string | null;
  primary_subject: string | null;
  class_id: string | null;
  additional_grades: string[] | null;
  additional_subjects: string[] | null;
  teacher_type: string | null;
  school_year: string | null;
  referrals_used_this_month: number;
  referrals_limit: number;
  additional_referral_packages: number;
  subscription_start_date: Date | null;
  subscription_end_date: Date | null;
  deepseek_api_key: string | null;
  created_at: Date;
  updated_at: Date;
};

// Retrieves the authenticated user's profile information.
export const me = api<void, UserProfile>(
  { expose: true, method: "GET", path: "/users/me", auth: true },
  async () => {
    const auth = getAuthData()!;

    if (auth.isAdmin) {
      return {
        id: 0,
        email: auth.email,
        name: auth.name,
        isAdmin: true,
        supportRequestsUsedThisMonth: 0,
        supportRequestsLimit: 9999,
        additionalSupportRequestPackages: 0,
        hasDeepSeekApiKey: !!adminDeepSeekApiKey(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    let user = await userDB.queryRow<UserRow>`
      SELECT 
        id, email, name, school_name, school_district, primary_grade, primary_subject, 
        class_id, additional_grades, additional_subjects, teacher_type, school_year,
        referrals_used_this_month, referrals_limit, additional_referral_packages,
        subscription_start_date, subscription_end_date, deepseek_api_key, created_at, updated_at
      FROM users 
      WHERE email = ${auth.email}
    `;

    if (!user) {
      throw APIError.notFound("User profile not found.");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      isAdmin: auth.isAdmin,
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
