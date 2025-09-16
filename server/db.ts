import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with safer defaults and error handling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  maxUses: Infinity,
  allowExitOnIdle: false,
  idleTimeoutMillis: 10000
});

// Add error handling to prevent crashes
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Don't crash the application, just log the error
});

// Handle process cleanup
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

export const db = drizzle({ client: pool, schema });