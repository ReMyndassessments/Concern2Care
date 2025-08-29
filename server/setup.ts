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
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    REPLIT_DOMAINS: process.env.REPLIT_DOMAINS
  });
  
  try {
    await ensureEssentialUsers();
    console.log('✅ Application initialization complete');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // In production, continue but log the failure
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️ PRODUCTION: Continuing despite initialization failure');
      return;
    }
    
    // In development, throw the error
    throw error;
  }
}

/**
 * Ensure essential user accounts exist
 */
async function ensureEssentialUsers() {
  console.log('👤 Checking essential user accounts...');
  
  // Test database connection first
  try {
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful');
  } catch (dbError) {
    console.error('❌ Database connection failed:', dbError);
    throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
  }
  
  const passwordHash = await bcrypt.hash('teacher123', 10);
  console.log('🔒 Password hash generated');
  
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