import { api, Cookie } from "encore.dev/api";
import { authDB } from "./db";

export interface LogoutResponse {
  success: boolean;
  session: Cookie<"app_session">;
}

// Logs out the current user by deleting their session.
export const logout = api<void, LogoutResponse>(
  { expose: true, method: "POST", path: "/auth/logout" },
  async (_, { req }) => {
    const token = req.cookies.app_session;
    if (token) {
      await authDB.exec`
        DELETE FROM sessions WHERE token = ${token}
      `;
    }

    return {
      success: true,
      session: {
        value: "",
        expires: new Date(0), // Expire immediately
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/"
      }
    };
  }
);
