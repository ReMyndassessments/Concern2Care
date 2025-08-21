import { api } from "encore.dev/api";
import { userDB } from "./db";
import { APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

export interface PurchaseSupportRequestPackageRequest {
  packages: number; // Number of 10-support request packages to purchase
}

export interface PurchaseSupportRequestPackageResponse {
  success: boolean;
  newPackageCount: number;
  newTotalLimit: number;
  checkoutUrl?: string; // For future payment integration
}

// Purchases additional support request packages for the authenticated user.
export const purchaseSupportRequestPackage = api<PurchaseSupportRequestPackageRequest, PurchaseSupportRequestPackageResponse>(
  { expose: true, method: "POST", path: "/users/purchase-support-request-package", auth: true },
  async (req) => {
    const auth = getAuthData()!;

    if (req.packages < 1 || req.packages > 10) {
      throw APIError.invalidArgument("Can purchase between 1 and 10 packages at a time");
    }

    // For now, we'll just add the packages directly
    // In the future, this would integrate with a payment processor
    const result = await userDB.queryRow<{
      additional_referral_packages: number;
      referrals_limit: number;
    }>`
      UPDATE users 
      SET 
        additional_referral_packages = additional_referral_packages + ${req.packages},
        updated_at = NOW()
      WHERE email = ${auth.email}
      RETURNING additional_referral_packages, referrals_limit
    `;

    if (!result) {
      throw APIError.notFound("User not found");
    }

    const newTotalLimit = result.referrals_limit + (result.additional_referral_packages * 10);

    return {
      success: true,
      newPackageCount: result.additional_referral_packages,
      newTotalLimit,
      checkoutUrl: undefined // Will be implemented when payment integration is added
    };
  }
);
