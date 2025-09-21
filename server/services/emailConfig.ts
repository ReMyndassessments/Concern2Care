import { db } from "../db";
import { 
  userEmailConfigs, 
  schoolEmailConfigs, 
  type UserEmailConfig, 
  type SchoolEmailConfig,
  type InsertUserEmailConfig,
  type InsertSchoolEmailConfig
} from "@shared/schema";
import { eq } from "drizzle-orm";
import nodemailer from 'nodemailer';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

// Secure encryption for storing email passwords - set development default if not in production
if (process.env.NODE_ENV !== 'production' && !process.env.EMAIL_ENCRYPTION_KEY) {
  process.env.EMAIL_ENCRYPTION_KEY = 'dev-key-32-chars-minimum-required!';
  console.warn('Using development default for EMAIL_ENCRYPTION_KEY');
}

const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY === 'default-key-change-in-production') {
  throw new Error('EMAIL_ENCRYPTION_KEY environment variable is required and must be set to a secure value');
}
const scryptAsync = promisify(scrypt);

async function encryptPassword(password: string): Promise<string> {
  try {
    const iv = randomBytes(16);
    const key = (await scryptAsync(ENCRYPTION_KEY!, 'salt', 32)) as Buffer;
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Failed to encrypt password:', error);
    throw new Error('Failed to encrypt email password');
  }
}

async function decryptPassword(encryptedPassword: string): Promise<string> {
  try {
    const [ivHex, encrypted] = encryptedPassword.split(':');
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted password format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const key = (await scryptAsync(ENCRYPTION_KEY!, 'salt', 32)) as Buffer;
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt password:', error);
    throw new Error('Failed to decrypt email password');
  }
}

export interface EmailConfiguration {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromAddress: string;
  fromName: string;
  source: 'user' | 'school' | 'none';
}

export class EmailConfigurationService {
  /**
   * Get email configuration with priority: User settings → School settings → None
   */
  async getEmailConfiguration(userId: string): Promise<EmailConfiguration | null> {
    try {
      // First, try to get user's personal email configuration
      const userConfig = await this.getUserEmailConfig(userId);
      if (userConfig && userConfig.isActive) {
        return {
          smtpHost: userConfig.smtpHost,
          smtpPort: userConfig.smtpPort,
          smtpSecure: userConfig.smtpSecure || false,
          smtpUser: userConfig.smtpUser,
          smtpPassword: await decryptPassword(userConfig.smtpPassword),
          fromAddress: userConfig.fromAddress || userConfig.smtpUser,
          fromName: userConfig.fromName || 'Concern2Care',
          source: 'user'
        };
      }

      // If no user config, try school configuration
      const schoolConfig = await this.getSchoolEmailConfigForUser(userId);
      if (schoolConfig && schoolConfig.isActive) {
        return {
          smtpHost: schoolConfig.smtpHost,
          smtpPort: schoolConfig.smtpPort,
          smtpSecure: schoolConfig.smtpSecure || false,
          smtpUser: schoolConfig.smtpUser,
          smtpPassword: await decryptPassword(schoolConfig.smtpPassword),
          fromAddress: schoolConfig.fromAddress || schoolConfig.smtpUser,
          fromName: schoolConfig.fromName || 'Concern2Care',
          source: 'school'
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting email configuration:', error);
      return null;
    }
  }

  /**
   * Get user's personal email configuration
   */
  async getUserEmailConfig(userId: string): Promise<UserEmailConfig | null> {
    try {
      const [config] = await db
        .select()
        .from(userEmailConfigs)
        .where(eq(userEmailConfigs.userId, userId));
      
      return config || null;
    } catch (error) {
      console.error('Error getting user email config:', error);
      return null;
    }
  }

  /**
   * Get school email configuration for a user (based on their school)
   */
  async getSchoolEmailConfigForUser(userId: string): Promise<SchoolEmailConfig | null> {
    try {
      const result = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
        with: {
          school: {
            with: {
              emailConfig: true
            }
          }
        }
      });

      return result?.school?.emailConfig || null;
    } catch (error) {
      console.error('Error getting school email config for user:', error);
      return null;
    }
  }

  /**
   * Create or update user email configuration
   */
  async saveUserEmailConfig(userId: string, config: Omit<InsertUserEmailConfig, 'userId'>): Promise<UserEmailConfig> {
    try {
      const encryptedPassword = await encryptPassword(config.smtpPassword);
      
      const configData = {
        ...config,
        userId,
        smtpPassword: encryptedPassword,
        updatedAt: new Date()
      };

      // Use upsert (insert or update)
      const [savedConfig] = await db
        .insert(userEmailConfigs)
        .values(configData)
        .onConflictDoUpdate({
          target: userEmailConfigs.userId,
          set: {
            ...configData,
            updatedAt: new Date()
          }
        })
        .returning();

      return savedConfig;
    } catch (error) {
      console.error('Error saving user email config:', error);
      throw new Error('Failed to save email configuration');
    }
  }

  /**
   * Create or update school email configuration
   */
  async saveSchoolEmailConfig(schoolId: string, configuredBy: string, config: Omit<InsertSchoolEmailConfig, 'schoolId' | 'configuredBy'>): Promise<SchoolEmailConfig> {
    try {
      const encryptedPassword = await encryptPassword(config.smtpPassword);
      
      const configData = {
        ...config,
        schoolId,
        configuredBy,
        smtpPassword: encryptedPassword,
        updatedAt: new Date()
      };

      // Use upsert (insert or update)
      const [savedConfig] = await db
        .insert(schoolEmailConfigs)
        .values(configData)
        .onConflictDoUpdate({
          target: schoolEmailConfigs.schoolId,
          set: {
            ...configData,
            updatedAt: new Date()
          }
        })
        .returning();

      return savedConfig;
    } catch (error) {
      console.error('Error saving school email config:', error);
      throw new Error('Failed to save school email configuration');
    }
  }

  /**
   * Test email configuration by sending a test email
   */
  async testEmailConfiguration(config: EmailConfiguration, testEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword,
        },
      });

      // Verify connection
      await transporter.verify();

      // Send test email
      await transporter.sendMail({
        from: `${config.fromName} <${config.fromAddress}>`,
        to: testEmail,
        subject: 'Concern2Care Email Configuration Test',
        html: `
          <h2>Email Configuration Test Successful</h2>
          <p>This is a test email to confirm your email configuration is working correctly.</p>
          <p><strong>Configuration Source:</strong> ${config.source === 'user' ? 'Personal Settings' : 'School Settings'}</p>
          <p><strong>SMTP Host:</strong> ${config.smtpHost}</p>
          <p><strong>SMTP Port:</strong> ${config.smtpPort}</p>
          <p>Your email functionality is now active in Concern2Care.</p>
        `
      });

      return {
        success: true,
        message: 'Test email sent successfully'
      };
    } catch (error) {
      console.error('Email test failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Email test failed'
      };
    }
  }

  /**
   * Update test status for user email config
   */
  async updateUserEmailTestStatus(userId: string, status: 'success' | 'failed'): Promise<void> {
    try {
      await db
        .update(userEmailConfigs)
        .set({
          testStatus: status,
          lastTestedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(userEmailConfigs.userId, userId));
    } catch (error) {
      console.error('Error updating user email test status:', error);
    }
  }

  /**
   * Update test status for school email config
   */
  async updateSchoolEmailTestStatus(schoolId: string, status: 'success' | 'failed'): Promise<void> {
    try {
      await db
        .update(schoolEmailConfigs)
        .set({
          testStatus: status,
          lastTestedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(schoolEmailConfigs.schoolId, schoolId));
    } catch (error) {
      console.error('Error updating school email test status:', error);
    }
  }

  /**
   * Delete user email configuration
   */
  async deleteUserEmailConfig(userId: string): Promise<void> {
    try {
      await db
        .delete(userEmailConfigs)
        .where(eq(userEmailConfigs.userId, userId));
    } catch (error) {
      console.error('Error deleting user email config:', error);
      throw new Error('Failed to delete email configuration');
    }
  }

  /**
   * Delete school email configuration
   */
  async deleteSchoolEmailConfig(schoolId: string): Promise<void> {
    try {
      await db
        .delete(schoolEmailConfigs)
        .where(eq(schoolEmailConfigs.schoolId, schoolId));
    } catch (error) {
      console.error('Error deleting school email config:', error);
      throw new Error('Failed to delete school email configuration');
    }
  }

  /**
   * Get email configuration status for a user
   */
  async getEmailStatus(userId: string): Promise<{
    hasPersonalConfig: boolean;
    hasSchoolConfig: boolean;
    activeConfig: 'user' | 'school' | 'none';
    status: 'active' | 'limited';
  }> {
    try {
      const userConfig = await this.getUserEmailConfig(userId);
      const schoolConfig = await this.getSchoolEmailConfigForUser(userId);

      const hasPersonalConfig = !!(userConfig && userConfig.isActive);
      const hasSchoolConfig = !!(schoolConfig && schoolConfig.isActive);

      let activeConfig: 'user' | 'school' | 'none' = 'none';
      let status: 'active' | 'limited' = 'limited';

      if (hasPersonalConfig) {
        activeConfig = 'user';
        status = 'active';
      } else if (hasSchoolConfig) {
        activeConfig = 'school';
        status = 'active';
      }

      return {
        hasPersonalConfig,
        hasSchoolConfig,
        activeConfig,
        status
      };
    } catch (error) {
      console.error('Error getting email status:', error);
      return {
        hasPersonalConfig: false,
        hasSchoolConfig: false,
        activeConfig: 'none',
        status: 'limited'
      };
    }
  }

  async getAdminEmailConfiguration(): Promise<EmailConfiguration | null> {
    try {
      // Check for admin user's email configuration (admin-prod-nodot-1757375851498)
      const adminConfig = await this.getUserEmailConfig('admin-prod-nodot-1757375851498');
      if (adminConfig && adminConfig.isActive) {
        const decryptedPassword = await decryptPassword(adminConfig.smtpPassword);
        return {
          smtpHost: adminConfig.smtpHost,
          smtpPort: adminConfig.smtpPort,
          smtpSecure: adminConfig.smtpPort === 465,
          smtpUser: adminConfig.smtpUser,
          smtpPassword: decryptedPassword,
          fromAddress: adminConfig.fromAddress,
          fromName: adminConfig.fromName,
          source: 'user'
        } as EmailConfiguration & { toEmail?: string };
      }
      
      console.log('No admin email configuration found');
      return null;
    } catch (error) {
      console.error('Error getting admin email configuration:', error);
      return null;
    }
  }
}

export const emailConfigService = new EmailConfigurationService();