import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { userDB } from "./db";
import { APIError } from "encore.dev/api";

export interface GetDeepSeekKeyRequest {
  email: Query<string>;
}

export interface DeepSeekKeyResponse {
  hasKey: boolean;
  key?: string;
}

// Retrieves a regular user's DeepSeek API key for internal use.
export const getDeepSeekKey = api<GetDeepSeekKeyRequest, DeepSeekKeyResponse>(
  { expose: false, method: "GET", path: "/users/deepseek-key" },
  async (req) => {
    const user = await userDB.queryRow<{
      deepseek_api_key: string | null;
    }>`
      SELECT deepseek_api_key
      FROM users 
      WHERE email = ${req.email}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    return {
      hasKey: !!user.deepseek_api_key,
      key: user.deepseek_api_key || undefined
    };
  }
);
