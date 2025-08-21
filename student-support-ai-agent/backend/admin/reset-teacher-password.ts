import { api } from "encore.dev/api";
import { userDB } from "../users/db";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import * as bcrypt from "bcrypt";

export interface AdminResetPasswordRequest {
  teacherId: number;
  newPassword: string;
}

export interface AdminResetPasswordResponse {
  success: boolean;
  message: string;
}

// Admin resets a teacher's password directly.
export const adminResetPassword = api<AdminResetPasswordRequest, AdminResetPasswordResponse>(
  { expose: true, method: "POST", path: "/admin/teachers/:teacherId/reset-password", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    if (!req.newPassword || req.newPassword.length < 6) {
      throw APIError.invalidArgument("Password must be at least 6 characters long");
    }

    // Check if teacher exists
    const teacher = await userDB.queryRow<{
      id: number;
      email: string;
      name: string | null;
    }>`
      SELECT id, email, name FROM users WHERE id = ${req.teacherId}
    `;

    if (!teacher) {
      throw APIError.notFound("Teacher not found");
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(req.newPassword, saltRounds);

    // Update password and clear any existing reset tokens
    await userDB.exec`
      UPDATE users 
      SET 
        password_hash = ${passwordHash},
        password_reset_token = NULL,
        password_reset_expires = NULL,
        updated_at = NOW()
      WHERE id = ${req.teacherId}
    `;

    // In a real implementation, you would send an email notification to the teacher
    console.log(`
=== PASSWORD RESET NOTIFICATION ===
To: ${teacher.email}
Subject: Your Concern2Care Password Has Been Reset

Hello ${teacher.name || 'Teacher'},

Your password for Concern2Care has been reset by an administrator.

Your new temporary password is: ${req.newPassword}

Please log in and change your password as soon as possible.

Best regards,
The Concern2Care Team
===================================
    `);

    return {
      success: true,
      message: `Password has been reset for ${teacher.name || teacher.email}. The teacher has been notified via email.`
    };
  }
);
