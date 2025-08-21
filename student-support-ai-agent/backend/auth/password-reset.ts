import { api, APIError } from "encore.dev/api";
import { userDB } from "../users/db";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import log from "encore.dev/log";

export interface RequestPasswordResetRequest {
  email: string;
}

export interface RequestPasswordResetResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Request a password reset token for a teacher.
export const requestPasswordReset = api<RequestPasswordResetRequest, RequestPasswordResetResponse>(
  { expose: true, method: "POST", path: "/auth/password-reset/request" },
  async (req) => {
    if (!req.email) {
      throw APIError.invalidArgument("Email is required");
    }

    // Check if user exists
    const user = await userDB.queryRow<{
      id: number;
      email: string;
      name: string | null;
    }>`
      SELECT id, email, name FROM users WHERE email = ${req.email}
    `;

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return {
        success: true,
        message: "If an account with that email exists, a password reset link has been sent."
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    await userDB.exec`
      UPDATE users 
      SET 
        password_reset_token = ${resetToken},
        password_reset_expires = ${resetTokenExpiry},
        updated_at = NOW()
      WHERE id = ${user.id}
    `;

    // In a real implementation, you would send an email here
    // For demo purposes, we'll log the reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    log.info("Password reset link generated", { email: user.email, link: resetLink });

    return {
      success: true,
      message: "If an account with that email exists, a password reset link has been sent."
    };
  }
);

// Reset password using a valid token.
export const resetPassword = api<ResetPasswordRequest, ResetPasswordResponse>(
  { expose: true, method: "POST", path: "/auth/password-reset/confirm" },
  async (req) => {
    if (!req.token || !req.newPassword) {
      throw APIError.invalidArgument("Token and new password are required");
    }

    if (req.newPassword.length < 6) {
      throw APIError.invalidArgument("Password must be at least 6 characters long");
    }

    // Find user with valid reset token
    const user = await userDB.queryRow<{
      id: number;
      email: string;
      password_reset_token: string | null;
      password_reset_expires: Date | null;
    }>`
      SELECT id, email, password_reset_token, password_reset_expires
      FROM users 
      WHERE password_reset_token = ${req.token}
      AND password_reset_expires > NOW()
    `;

    if (!user) {
      throw APIError.invalidArgument("Invalid or expired reset token");
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(req.newPassword, saltRounds);

    // Update password and clear reset token
    await userDB.exec`
      UPDATE users 
      SET 
        password_hash = ${passwordHash},
        password_reset_token = NULL,
        password_reset_expires = NULL,
        updated_at = NOW()
      WHERE id = ${user.id}
    `;

    return {
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password."
    };
  }
);
