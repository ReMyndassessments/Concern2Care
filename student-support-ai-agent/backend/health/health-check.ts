import { api } from "encore.dev/api";

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  services: {
    database: string;
    ai: string;
  };
}

// Health check endpoint for Railway and monitoring
export const healthCheck = api<void, HealthResponse>(
  { expose: true, method: "GET", path: "/health" },
  async () => {
    // Basic health check - can be expanded with actual service checks
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: "connected",
        ai: "available"
      }
    };
  }
);
