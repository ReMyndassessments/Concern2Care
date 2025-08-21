import { api, Cookie, APIError } from "encore.dev/api";
import { userDB } from "../users/db";
import { authDB } from "./db";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface LoginResponse {
  success: boolean;
  session: Cookie<"app_session">;
  user: UserInfo;
}

// Login for both teachers and the demo admin.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    if (!req.email || !req.password) {
      throw APIError.invalidArgument("Email and password are required");
    }

    let user: UserInfo;

    // Check for demo admin login
    const validAdminPasswords = ["demo2024", "demo", "admin", "password"];
    if (req.email.toLowerCase() === 'admin@concern2care.demo' && validAdminPasswords.includes(req.password.toLowerCase())) {
      user = {
        id: '0', // Admin has a static ID
        email: 'admin@concern2care.demo',
        name: 'Demo Administrator',
        isAdmin: true,
      };
    } else {
      // Teacher login
      const teacher = await userDB.queryRow<{
        id: number;
        email: string;
        name: string | null;
        password_hash: string | null;
        subscription_end_date: Date | null;
      }>`
        SELECT id, email, name, password_hash, subscription_end_date
        FROM users 
        WHERE email = ${req.email}
      `;

      if (!teacher || !teacher.password_hash) {
        throw APIError.unauthenticated("Invalid email or password");
      }

      const passwordMatch = await bcrypt.compare(req.password, teacher.password_hash);
      if (!passwordMatch) {
        throw APIError.unauthenticated("Invalid email or password");
      }

      if (!teacher.subscription_end_date || teacher.subscription_end_date < new Date()) {
        throw APIError.permissionDenied("Your subscription has expired. Please contact your administrator.");
      }

      user = {
        id: teacher.id.toString(),
        email: teacher.email,
        name: teacher.name || 'Teacher',
        isAdmin: false,
      };
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await authDB.exec`
      INSERT INTO sessions (token, user_id, is_admin, user_email, user_name, expires_at)
      VALUES (${sessionToken}, ${user.id}, ${user.isAdmin}, ${user.email}, ${user.name}, ${expiresAt})
    `;

    return {
      success: true,
      session: {
        value: sessionToken,
        expires: expiresAt,
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/"
      },
      user: user
    };
  }
);
