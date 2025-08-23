import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import crypto from "crypto";
// nodemailer import removed - using existing email service

// Simple in-memory token store (use Redis in production)
const passwordResetTokens = new Map<string, { email: string; expires: Date }>();

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetConfirmation {
  token: string;
  newPassword: string;
}

export async function initiatePasswordReset(email: string): Promise<PasswordResetResponse> {
  try {
    // Check if user exists
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (!user.length) {
      // Don't reveal that email doesn't exist for security
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      };
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour from now

    // Store token (in production, use Redis with TTL)
    passwordResetTokens.set(token, {
      email: email,
      expires: expires
    });

    // Send password reset email
    const resetLink = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    
    try {
      await sendPasswordResetEmail(email, resetLink, user[0].firstName || 'User');
      
      return {
        success: true,
        message: 'Password reset instructions have been sent to your email address.'
      };
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      
      // Remove token since email failed
      passwordResetTokens.delete(token);
      
      return {
        success: false,
        message: 'Email service not configured. Please configure email settings in the Admin panel under School Settings.'
      };
    }

  } catch (error) {
    console.error('Password reset initiation error:', error);
    return {
      success: false,
      message: 'An error occurred while processing your request. Please try again later.'
    };
  }
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<PasswordResetResponse> {
  try {
    // Validate input
    if (!token || !newPassword) {
      return {
        success: false,
        message: 'Token and new password are required.'
      };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        message: 'Password must be at least 8 characters long.'
      };
    }

    // Check if token exists and is valid
    const tokenData = passwordResetTokens.get(token);
    
    if (!tokenData) {
      return {
        success: false,
        message: 'Invalid or expired reset token.'
      };
    }

    if (new Date() > tokenData.expires) {
      // Remove expired token
      passwordResetTokens.delete(token);
      return {
        success: false,
        message: 'Reset token has expired. Please request a new password reset.'
      };
    }

    // Find user or create if they don't exist
    let user = await db.select().from(users).where(eq(users.email, tokenData.email)).limit(1);
    
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    if (!user.length) {
      // Create new user if they don't exist
      const [newUser] = await db.insert(users)
        .values({
          email: tokenData.email,
          password: hashedPassword,
          firstName: 'New', // Default values - user can update later
          lastName: 'User',
          school: 'Unknown School',
          isAdmin: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      user = [newUser];
    } else {
      // Update password for existing user
      await db.update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, user[0].id));
    }

    // Remove used token
    passwordResetTokens.delete(token);

    // Send confirmation email
    try {
      await sendPasswordResetConfirmationEmail(
        tokenData.email, 
        user[0].firstName || 'User'
      );
    } catch (emailError) {
      console.error('Failed to send password reset confirmation email:', emailError);
      // Don't fail the password reset if confirmation email fails
    }

    return {
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    };

  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return {
      success: false,
      message: 'An error occurred while resetting your password. Please try again.'
    };
  }
}

async function sendPasswordResetEmail(email: string, resetLink: string, userName: string) {
  // Use the existing email service
  const emailService = await import('./email');
  const { getEmailTransporter } = emailService;
  
  const emailSetup = await getEmailTransporter();
  if (!emailSetup) {
    throw new Error('Email service not configured. Please configure email settings in the Admin panel.');
  }
  
  const { transporter, fromAddress, fromName } = emailSetup;

  const mailOptions = {
    from: `${fromName} <${fromAddress}>`,
    to: email,
    subject: 'Password Reset Request - Concern2Care',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Concern2Care</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Student Support Platform</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p>Hello ${userName},</p>
          
          <p>We received a request to reset your password for your Concern2Care account. If you made this request, click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                      font-weight: bold; font-size: 16px;">
              Reset My Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour for security reasons. If you didn't request a password reset, 
            please ignore this email and your password will remain unchanged.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            If the button above doesn't work, you can copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px; margin: 0;">
            If you have any questions or need assistance, please contact our support team.
          </p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

async function sendPasswordResetConfirmationEmail(email: string, userName: string) {
  // Use the existing email service
  const emailService = await import('./email');
  const { getEmailTransporter } = emailService;
  
  const emailSetup = await getEmailTransporter();
  if (!emailSetup) {
    return; // Skip if email not configured
  }
  
  const { transporter, fromAddress, fromName } = emailSetup;

  const mailOptions = {
    from: `${fromName} <${fromAddress}>`,
    to: email,
    subject: 'Password Reset Successful - Concern2Care',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Concern2Care</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Successful</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Complete</h2>
          
          <p>Hello ${userName},</p>
          
          <p>Your password has been successfully reset. You can now log in to your Concern2Care account using your new password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BASE_URL || 'http://localhost:5000'}/login" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                      color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                      font-weight: bold; font-size: 16px;">
              Log In to Your Account
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If you didn't reset your password, please contact our support team immediately as your account may be compromised.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px; margin: 0;">
            For security tips and best practices, please visit our help center.
          </p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// Removed createEmailTransporter - now using existing email service

// Clean up expired tokens periodically
setInterval(() => {
  const now = new Date();
  const tokensToDelete: string[] = [];
  
  for (const [token, data] of passwordResetTokens.entries()) {
    if (now > data.expires) {
      tokensToDelete.push(token);
    }
  }
  
  tokensToDelete.forEach(token => passwordResetTokens.delete(token));
}, 15 * 60 * 1000); // Clean up every 15 minutes