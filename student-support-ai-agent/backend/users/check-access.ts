import { api } from "encore.dev/api";
import { userDB } from "./db";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";

export interface AccessResponse {
  hasAccess: boolean;
  reason?: string;
  planType?: string;
  subscriptionStatus?: string;
  requiresUpgrade?: boolean;
  suggestedPlan?: string;
}

// Checks if the authenticated user has access to a specific feature based on their subscription.
export const checkAccess = api<void, AccessResponse>(
  { expose: true, method: "GET", path: "/users/check-access", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    // For demo admin, always grant access
    if (auth.isAdmin) {
      return {
        hasAccess: true,
        planType: 'admin',
        subscriptionStatus: 'active'
      };
    }

    // Check for active subscription in the users table
    const user = await userDB.queryRow<{
      subscription_end_date: Date | null;
    }>`
      SELECT subscription_end_date
      FROM users 
      WHERE email = ${auth.email}
    `;

    if (!user || !user.subscription_end_date || user.subscription_end_date < new Date()) {
      return {
        hasAccess: false,
        reason: "No active subscription found. Please subscribe to access this feature.",
        requiresUpgrade: true,
        suggestedPlan: "school-wide"
      };
    }

    // All features are on the 'teacher' plan.
    return {
      hasAccess: true,
      planType: 'teacher',
      subscriptionStatus: 'active'
    };
  }
);
