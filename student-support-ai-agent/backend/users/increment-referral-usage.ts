import { api } from "encore.dev/api";
import { userDB } from "./db";
import { APIError } from "encore.dev/api";

export interface IncrementSupportRequestUsageRequest {
  email: string;
}

export interface IncrementSupportRequestUsageResponse {
  success: boolean;
  newUsageCount: number;
}

// Increments the user's monthly support request usage count.
export const incrementSupportRequestUsage = api<IncrementSupportRequestUsageRequest, IncrementSupportRequestUsageResponse>(
  { expose: false, method: "POST", path: "/users/increment-support-request-usage" },
  async (req) => {
    // For demo admin, track usage but with high limit
    if (req.email === 'admin@concern2care.demo') {
      return {
        success: true,
        newUsageCount: 1
      };
    }

    const result = await userDB.queryRow<{
      referrals_used_this_month: number;
    }>`
      UPDATE users 
      SET 
        referrals_used_this_month = referrals_used_this_month + 1,
        updated_at = NOW()
      WHERE email = ${req.email}
      RETURNING referrals_used_this_month
    `;

    if (!result) {
      throw APIError.notFound("User not found");
    }

    return {
      success: true,
      newUsageCount: result.referrals_used_this_month
    };
  }
);
