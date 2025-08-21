import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";

export interface SystemSettings {
  defaultSupportRequestLimit: number;
  defaultSubscriptionDuration: number; // in days
  aiRecommendationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  maintenanceMode: boolean;
  maxFileUploadSize: number; // in MB
}

export interface UpdateSystemSettingsRequest {
  defaultSupportRequestLimit?: number;
  defaultSubscriptionDuration?: number;
  aiRecommendationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  maintenanceMode?: boolean;
  maxFileUploadSize?: number;
}

// Gets current system settings.
export const getSystemSettings = api<void, SystemSettings>(
  { expose: true, method: "GET", path: "/admin/system/settings", auth: true },
  async () => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    // For demo purposes, return default settings
    // In a real implementation, these would be stored in a database
    return {
      defaultSupportRequestLimit: 20,
      defaultSubscriptionDuration: 365,
      aiRecommendationsEnabled: true,
      emailNotificationsEnabled: true,
      maintenanceMode: false,
      maxFileUploadSize: 10
    };
  }
);

// Updates system settings.
export const updateSystemSettings = api<UpdateSystemSettingsRequest, SystemSettings>(
  { expose: true, method: "PUT", path: "/admin/system/settings", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    // For demo purposes, just return the updated settings
    // In a real implementation, these would be stored in a database
    const currentSettings = {
      defaultSupportRequestLimit: 20,
      defaultSubscriptionDuration: 365,
      aiRecommendationsEnabled: true,
      emailNotificationsEnabled: true,
      maintenanceMode: false,
      maxFileUploadSize: 10
    };

    return {
      ...currentSettings,
      ...req
    };
  }
);
