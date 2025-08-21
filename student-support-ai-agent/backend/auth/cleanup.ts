import { cron } from "encore.dev/cron";
import { authDB } from "./db";
import log from "encore.dev/log";

// cleanupExpiredSessions runs once a day and deletes expired sessions from the database.
export const cleanupExpiredSessions = cron.daily("cleanup-sessions", async () => {
  log.info("Running cron job to clean up expired sessions");
  try {
    await authDB.exec`
      DELETE FROM sessions WHERE expires_at < NOW()
    `;
    log.info("Successfully cleaned up expired sessions");
  } catch (error) {
    log.error("Failed to clean up expired sessions", { error });
  }
});
