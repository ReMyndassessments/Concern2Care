/**
 * Application setup and database initialization
 */

import bcrypt from 'bcrypt';
import { db } from './db.js';
import { users, featureFlags } from '../shared/schema.js';
import { sql, eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Fallback admin account creation for production
 */
async function createAdminAccountFallback() {
  console.log('🔄 FALLBACK: Creating admin account directly...');
  
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminEmail = 'noelroberts43@gmail.com';
  const adminId = 'admin-fallback-' + Date.now();
  
  try {
    // Try simple insert first
    await db.execute(sql`
      INSERT INTO users (id, email, password, first_name, last_name, school, is_admin, role, is_active, support_requests_limit, created_at, updated_at) 
      VALUES (${adminId}, ${adminEmail}, ${passwordHash}, 'Noel', 'Roberts', 'Admin School', true, 'admin', true, 100, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        is_admin = true,
        role = 'admin',
        updated_at = NOW()
    `);
    console.log('✅ FALLBACK: Admin account created/updated successfully');
  } catch (error) {
    console.error('❌ FALLBACK: Direct insert failed, trying alternative:', error);
    
    // Alternative: Try to update existing account
    try {
      await db.execute(sql`
        UPDATE users SET 
          password = ${passwordHash},
          is_admin = true,
          role = 'admin',
          updated_at = NOW()
        WHERE email = ${adminEmail}
      `);
      console.log('✅ FALLBACK: Admin account updated successfully');
    } catch (updateError) {
      console.error('❌ FALLBACK: Update also failed:', updateError);
      throw updateError;
    }
  }
}

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
    await ensureEssentialFeatureFlags();
    console.log('✅ Application initialization complete');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // In production, try individual operations
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️ PRODUCTION: Trying fallback initialization...');
      try {
        await createAdminAccountFallback();
        console.log('✅ PRODUCTION: Fallback admin account creation succeeded');
      } catch (fallbackError) {
        console.error('❌ PRODUCTION: Fallback also failed:', fallbackError);
      }
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
  
  const passwordHash = await bcrypt.hash('password123', 10);
  console.log('🔒 Password hash generated');
  
  // Admin user - ONLY the correct email without dot
  try {
    const adminEmail = 'noelroberts43@gmail.com';
    const adminId = 'admin-prod-' + Date.now();
    
    await db.execute(sql`
      INSERT INTO users (id, email, password, first_name, last_name, school, is_admin, role, is_active, support_requests_limit, created_at, updated_at) 
      VALUES (${adminId}, ${adminEmail}, ${passwordHash}, ${'Noel'}, ${'Roberts'}, ${'Production School District'}, ${true}, ${'admin'}, ${true}, ${100}, ${new Date()}, ${new Date()})
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        is_admin = EXCLUDED.is_admin,
        role = EXCLUDED.role,
        updated_at = EXCLUDED.updated_at
    `);
    console.log('✅ Admin user ensured via SQL upsert');
  } catch (error) {
    console.log('ℹ️ Admin user operation result:', error instanceof Error ? error.message : String(error));
  }
  
  // Teacher user
  try {
    const teacherEmail = 'ameriasianjr@yahoo.com';
    const teacherId = 'teacher-prod-' + Date.now();
    
    await db.execute(sql`
      INSERT INTO users (id, email, password, first_name, last_name, school, is_admin, role, is_active, support_requests_limit, created_at, updated_at) 
      VALUES (${teacherId}, ${teacherEmail}, ${passwordHash}, ${'Demo-Teacher'}, ${'ROBERTS'}, ${'Calabar High School'}, ${false}, ${'teacher'}, ${true}, ${20}, ${new Date()}, ${new Date()})
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        is_admin = EXCLUDED.is_admin,
        role = EXCLUDED.role,
        updated_at = EXCLUDED.updated_at
    `);
    console.log('✅ Teacher user ensured via SQL upsert');
  } catch (error) {
    console.log('ℹ️ Teacher user operation result:', error instanceof Error ? error.message : String(error));
  }
  
  // Seija teacher user - PRODUCTION ESSENTIAL
  try {
    const seijaEmail = 'seija.kotipelto@lyceeshanghai.com';
    const seijaId = 'teacher-seija-' + Date.now();
    
    await db.execute(sql`
      INSERT INTO users (id, email, password, first_name, last_name, school, is_admin, role, is_active, support_requests_limit, created_at, updated_at) 
      VALUES (${seijaId}, ${seijaEmail}, ${passwordHash}, ${'Seija'}, ${'Kotipelto'}, ${'Lycee Francais de Shanghai'}, ${false}, ${'teacher'}, ${true}, ${20}, ${new Date()}, ${new Date()})
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        is_admin = EXCLUDED.is_admin,
        role = EXCLUDED.role,
        updated_at = EXCLUDED.updated_at
    `);
    console.log('✅ Seija teacher user ensured via SQL upsert');
  } catch (error) {
    console.log('ℹ️ Seija user operation result:', error instanceof Error ? error.message : String(error));
  }
  
  // Karen teacher user - PRODUCTION ESSENTIAL
  try {
    const karenEmail = 'yuj11@rchk.edu.hk';
    const karenId = 'teacher-karen-' + Date.now();
    
    await db.execute(sql`
      INSERT INTO users (id, email, password, first_name, last_name, school, is_admin, role, is_active, support_requests_limit, created_at, updated_at) 
      VALUES (${karenId}, ${karenEmail}, ${passwordHash}, ${'Karen'}, ${'Yu'}, ${'Renaissance College Hong Kong'}, ${false}, ${'teacher'}, ${true}, ${50}, ${new Date()}, ${new Date()})
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        is_admin = EXCLUDED.is_admin,
        role = EXCLUDED.role,
        updated_at = EXCLUDED.updated_at
    `);
    console.log('✅ Karen teacher user ensured via SQL upsert');
  } catch (error) {
    console.log('ℹ️ Karen user operation result:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Ensure essential feature flags exist
 */
async function ensureEssentialFeatureFlags() {
  console.log('🚩 Checking essential feature flags...');
  
  try {
    // Check if Chinese localization feature flag exists
    const existingFlag = await db.select()
      .from(featureFlags)
      .where(eq(featureFlags.flagName, 'chinese_localization'))
      .limit(1);
    
    if (existingFlag.length === 0) {
      // Create the Chinese localization feature flag
      await db.insert(featureFlags).values({
        id: crypto.randomUUID(),
        flagName: 'chinese_localization',
        description: 'Enable complete Chinese interface localization including forms, buttons, navigation, and all UI text. Allows users to switch between English and Chinese languages.',
        isGloballyEnabled: false, // Start disabled for safety
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Chinese localization feature flag created');
    } else {
      console.log('✅ Chinese localization feature flag already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing feature flags:', error);
    // Don\'t throw in production to avoid breaking the app startup
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
  }
}