/**
 * Application setup and database initialization
 */

import bcrypt from 'bcrypt';
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { sql } from 'drizzle-orm';

/**
 * Initialize the application on startup
 * This ensures essential data exists in production
 */
export async function initializeApp() {
  console.log('🚀 Initializing application...');
  
  try {
    await ensureEssentialUsers();
    console.log('✅ Application initialization complete');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    // Don't exit in production, just log the error
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
  }
}

/**
 * Ensure essential user accounts exist
 */
async function ensureEssentialUsers() {
  console.log('👤 Checking essential user accounts...');
  
  const passwordHash = await bcrypt.hash('teacher123', 10);
  
  // Admin user
  try {
    await db.insert(users).values({
      id: 'teacher-001',
      email: 'noel.roberts43@gmail.com',
      password: passwordHash,
      firstName: 'Noel',
      lastName: 'Roberts',
      school: 'Production School District',
      isAdmin: true,
      role: 'admin',
      isActive: true,
      supportRequestsLimit: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing();
    console.log('✅ Admin user ensured');
  } catch (error) {
    console.log('ℹ️ Admin user already exists or error occurred:', error instanceof Error ? error.message : String(error));
  }
  
  // Teacher user
  try {
    await db.insert(users).values({
      id: 'teacher-1756432651127',
      email: 'ameriasianjr@yahoo.com',
      password: passwordHash,
      firstName: 'Demo-Teacher',
      lastName: 'ROBERTS',
      school: 'Calabar High School',
      isAdmin: false,
      role: 'teacher',
      isActive: true,
      supportRequestsLimit: 20,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing();
    console.log('✅ Teacher user ensured');
  } catch (error) {
    console.log('ℹ️ Teacher user already exists or error occurred:', error instanceof Error ? error.message : String(error));
  }
}