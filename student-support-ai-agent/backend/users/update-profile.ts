import { api } from "encore.dev/api";
import { userDB } from "./db";
import { APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

export interface UpdateProfileRequest {
  name?: string;
  schoolName?: string;
  schoolDistrict?: string;
  primaryGrade?: string;
  primarySubject?: string;
  classId?: string;
  additionalGrades?: string[];
  additionalSubjects?: string[];
  teacherType?: string;
  schoolYear?: string;
  deepSeekApiKey?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  name?: string;
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

// Updates the authenticated user's profile information.
export const updateProfile = api<UpdateProfileRequest, UserProfile>(
  { expose: true, method: "PUT", path: "/users/profile", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    // First ensure user exists
    let user = await userDB.queryRow<{
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
    }>`
      SELECT 
        id, email, name, school_name, school_district, primary_grade, primary_subject, 
        class_id, additional_grades, additional_subjects, teacher_type, school_year,
        referrals_used_this_month, referrals_limit, additional_referral_packages,
        subscription_start_date, subscription_end_date, deepseek_api_key, created_at, updated_at
      FROM users 
      WHERE email = ${auth.email}
    `;

    if (!user) {
      // Create user if doesn't exist
      user = await userDB.queryRow<{
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
      }>`
        INSERT INTO users (
          email, name, school_name, school_district, primary_grade, primary_subject, 
          class_id, additional_grades, additional_subjects, teacher_type, school_year,
          deepseek_api_key, created_at, updated_at
        )
        VALUES (
          ${auth.email}, ${req.name || auth.name}, ${req.schoolName || null}, 
          ${req.schoolDistrict || null}, ${req.primaryGrade || null}, ${req.primarySubject || null},
          ${req.classId || null}, ${req.additionalGrades || null}, ${req.additionalSubjects || null},
          ${req.teacherType || 'classroom'}, ${req.schoolYear || null}, ${req.deepSeekApiKey || null}, 
          NOW(), NOW()
        )
        RETURNING 
          id, email, name, school_name, school_district, primary_grade, primary_subject, 
          class_id, additional_grades, additional_subjects, teacher_type, school_year,
          referrals_used_this_month, referrals_limit, additional_referral_packages,
          subscription_start_date, subscription_end_date, deepseek_api_key, created_at, updated_at
      `;
    } else {
      // Update existing user
      user = await userDB.queryRow<{
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
      }>`
        UPDATE users 
        SET 
          name = COALESCE(${req.name || null}, name),
          school_name = COALESCE(${req.schoolName || null}, school_name),
          school_district = COALESCE(${req.schoolDistrict || null}, school_district),
          primary_grade = COALESCE(${req.primaryGrade || null}, primary_grade),
          primary_subject = COALESCE(${req.primarySubject || null}, primary_subject),
          class_id = COALESCE(${req.classId || null}, class_id),
          additional_grades = COALESCE(${req.additionalGrades || null}, additional_grades),
          additional_subjects = COALESCE(${req.additionalSubjects || null}, additional_subjects),
          teacher_type = COALESCE(${req.teacherType || null}, teacher_type),
          school_year = COALESCE(${req.schoolYear || null}, school_year),
          deepseek_api_key = COALESCE(${req.deepSeekApiKey || null}, deepseek_api_key),
          updated_at = NOW()
        WHERE email = ${auth.email}
        RETURNING 
          id, email, name, school_name, school_district, primary_grade, primary_subject, 
          class_id, additional_grades, additional_subjects, teacher_type, school_year,
          referrals_used_this_month, referrals_limit, additional_referral_packages,
          subscription_start_date, subscription_end_date, deepseek_api_key, created_at, updated_at
      `;
    }

    if (!user) {
      throw APIError.internal("Failed to update user profile");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
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
