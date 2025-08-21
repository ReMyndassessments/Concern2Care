import { Cookie, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { authDB } from "./db";

interface AuthParams {
  session?: Cookie<"app_session">;
}

export interface AuthData {
  userID: string;
  email: string;
  isAdmin: boolean;
  name: string;
}

const auth = authHandler<AuthParams, AuthData>(
  async (params) => {
    const token = params.session?.value;
    if (!token) {
      throw APIError.unauthenticated("not logged in");
    }

    const session = await authDB.queryRow<{
      user_id: string;
      user_email: string;
      user_name: string;
      is_admin: boolean;
    }>`
      SELECT user_id, user_email, user_name, is_admin
      FROM sessions
      WHERE token = ${token} AND expires_at > NOW()
    `;

    if (!session) {
      throw APIError.unauthenticated("invalid session");
    }

    return {
      userID: session.user_id,
      email: session.user_email,
      name: session.user_name,
      isAdmin: session.is_admin,
    };
  }
);

// Configure the API gateway to use the auth handler
export const gw = new Gateway({ authHandler: auth });
