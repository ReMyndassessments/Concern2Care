import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { userDB } from "./db";
import { APIError } from "encore.dev/api";

export interface CheckSupportRequestLimitRequest {
  email: Query<string>;
}

export interface SupportRequestLimitResponse {
  canCreateSupportRequest: boolean;
  supportRequestsUsed: number;
  supportRequestsLimit: number;
  additionalPackages: number;
  totalLimit: number;
  reason?: string;
}

// Checks if a user can create a new support request based on their monthly limit.
export const checkSupportRequestLimit = api<CheckSupportRequestLimitRequest, SupportRequestLimitResponse>(
  { expose: false, method: "GET", path: "/users/check-support-request-limit" },
  async (req) => {
    // For demo admin, use a high limit but still enforce it
    if (req.email === 'admin@concern2care.demo') {
      return {
        canCreateSupportRequest: true,
        supportRequestsUsed: 0,
        supportRequestsLimit: 999,
        additionalPackages: 0,
        totalLimit: 999
      };
    }

    const user = await userDB.queryRow<{
      referrals_used_this_month: number;
      referrals_limit: number;
      additional_referral_packages: number;
      subscription_end_date: Date | null;
    }>`
      SELECT referrals_used_this_month, referrals_limit, additional_referral_packages, subscription_end_date
      FROM users 
      WHERE email = ${req.email}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    // Check if subscription is active
    if (!user.subscription_end_date || user.subscription_end_date < new Date()) {
      return {
        canCreateSupportRequest: false,
        supportRequestsUsed: user.referrals_used_this_month,
        supportRequestsLimit: user.referrals_limit,
        additionalPackages: user.additional_referral_packages,
        totalLimit: user.referrals_limit + (user.additional_referral_packages * 10),
        reason: "Subscription expired or inactive"
      };
    }

    const totalLimit = user.referrals_limit + (user.additional_referral_packages * 10);
    const canCreate = user.referrals_used_this_month < totalLimit;

    return {
      canCreateSupportRequest: canCreate,
      supportRequestsUsed: user.referrals_used_this_month,
      supportRequestsLimit: user.referrals_limit,
      additionalPackages: user.additional_referral_packages,
      totalLimit,
      reason: canCreate ? undefined : "Monthly support request limit reached"
    };
  }
);
