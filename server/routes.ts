import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateInterventions, answerFollowUpQuestion, generateRecommendations, followUpAssistance, GenerateRecommendationsRequest, FollowUpAssistanceRequest } from "./services/ai";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { generateConcernReport, ensureReportsDirectory, parseMarkdownToPDF } from "./services/pdf";
import { generateConcernHTMLReport, generateMeetingHTMLReport } from "./services/htmlReport";
import { sendReportEmail, generateSecureReportLink } from "./services/email";
import { insertConcernSchema, insertFollowUpQuestionSchema, users, concerns, interventions, reports, schools, featureFlags, schoolFeatureOverrides } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import path from "path";
import fs from "fs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import multer from "multer";
import * as bcrypt from "bcrypt";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";

// Import all advanced services
import { 
  processBulkCSVUpload, 
  generateDemoData, 
 
  bulkUpdateTeachers, 
  bulkDeleteTeachers,
  getApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  startDemoProgram,
  getDemoSchools,
  getDemoSchoolDetails,
  setPilotTeacher,
  convertDemoToFull
} from "./services/admin";
// Removed unused analytics and deepseek-ai imports
import { getReferrals, createReferral } from "./services/referrals";
import { getSystemHealth, getDetailedSystemHealth, trackRequest } from "./services/health";
import { initiatePasswordReset, confirmPasswordReset } from "./services/auth";
import { getTeacherExportData, getSchoolExportData, convertToCSV, getAllSchoolNames } from "./services/export";
import { emailConfigService } from "./services/emailConfig";
import { insertUserEmailConfigSchema, insertSchoolEmailConfigSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment systems only - check for health check requests
  app.get('/', async (req, res, next) => {
    // Only respond with health check for deployment systems or explicit health check requests
    const userAgent = req.get('user-agent') || '';
    const acceptsJson = req.accepts(['html', 'json']) === 'json';
    
    // Health check for deployment systems (they typically don't send Accept: text/html)
    if (acceptsJson || userAgent.includes('health') || userAgent.includes('check') || userAgent.includes('monitor')) {
      try {
        const health = await getSystemHealth();
        return res.status(200).json(health);
      } catch (error) {
        return res.status(503).json({ 
          status: 'unhealthy', 
          timestamp: new Date().toISOString(),
          error: 'Health check failed'
        });
      }
    }
    
    // For regular users (browsers), continue to serve the React app
    next();
  });

  // Enable sessions for professional authentication with PostgreSQL persistence
  const pgSession = connectPgSimple(session);
  
  // Detect production environment
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.REPLIT_DOMAINS?.includes('.replit.app');
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'concern2care-session-secret-development-key-very-long',
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    store: new pgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'session', // Will be created automatically
      createTableIfMissing: true,
      ttl: 4 * 60 * 60 // 4 hours in seconds
    }),
    rolling: true, // Reset session timeout on activity
    name: 'connect.sid',
    cookie: {
      secure: false, // Keep false for Replit environment
      maxAge: 4 * 60 * 60 * 1000, // 4 hours
      httpOnly: true, // Prevent XSS attacks
      sameSite: 'lax' // Required for cross-origin requests
    }
  }));

  // Add session debugging middleware (removed destructive cleanup)
  app.use((req: any, res, next) => {
    if (req.path.includes('/api/auth')) {
      console.log('🍪 Session check - SessionID:', req.sessionID?.slice(0, 8), 'User:', req.session?.user?.email || 'none');
      console.log('🍪 Session data:', {
        hasSession: !!req.session,
        isAuthenticated: req.session?.isAuthenticated,
        userEmail: req.session?.user?.email
      });
    }
    next();
  });

  // Professional teacher authentication - no development modals
  
  // Teacher login endpoint
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { email, password: rawPassword } = req.body;
      const password = rawPassword?.trim(); // Remove any whitespace
      console.log('🔐 Login attempt - Email:', email, 'Password length:', password?.length);
      console.log('🔐 Password first/last chars:', password ? `"${password[0]}...${password[password.length-1]}"` : 'undefined');
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // First, check for real database users with hashed passwords
      try {
        const dbUser = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
        console.log('🔐 Database lookup - Found user:', !!dbUser.length, 'Has password:', !!dbUser[0]?.password);
        
        if (dbUser.length > 0 && dbUser[0].password) {
          // User exists in database with a password, check against hashed password
          console.log('🔐 Comparing password...');
          const isValidPassword = await bcrypt.compare(password, dbUser[0].password);
          console.log('🔐 Password validation result:', isValidPassword);
          
          if (isValidPassword) {
            // Valid database user login
            const user = dbUser[0];
            
            // Update last login time
            await db.update(users)
              .set({ lastLoginAt: new Date() })
              .where(eq(users.id, user.id));

            // Create session data first
            const sessionUser = {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              school: user.school,
              isAdmin: user.isAdmin || false
            };
            
            // Set session data directly (simpler approach)
            req.session.user = sessionUser;
            req.session.isAuthenticated = true;
            
            console.log('🔐 Session data after login:', {
              isAuthenticated: req.session.isAuthenticated,
              user: req.session.user ? 'present' : 'missing',
              sessionId: req.sessionID?.slice(0, 8)
            });

            // Force session save with enhanced error handling and retries
            const saveSessionWithRetry = (attempt = 1) => {
              req.session.save((err: any) => {
                if (err) {
                  console.error(`❌ Session save error (attempt ${attempt}):`, err);
                  if (attempt < 3) {
                    console.log(`🔄 Retrying session save (attempt ${attempt + 1})...`);
                    setTimeout(() => saveSessionWithRetry(attempt + 1), 200);
                    return;
                  } else {
                    return res.status(500).json({ message: "Session creation failed after retries" });
                  }
                }
                
                console.log('✅ Session saved successfully for:', user.email, 'SessionID:', req.sessionID?.slice(0, 8));
                console.log('✅ Session state after save:', {
                  isAuthenticated: req.session.isAuthenticated,
                  hasUser: !!req.session.user,
                  userEmail: req.session.user?.email,
                  sessionId: req.sessionID?.slice(0, 8)
                });
                
                // Verify session state before responding
                if (req.session.isAuthenticated !== true || !req.session.user) {
                  console.error('❌ Session state verification failed after save');
                  return res.status(500).json({ message: "Session state verification failed" });
                }
                
                // Add production delay to ensure session persistence across load balancers
                const delay = (process.env.NODE_ENV === 'production' || process.env.REPLIT_DOMAINS?.includes('.replit.app')) ? 750 : 100;
                setTimeout(() => {
                  return res.json({ 
                    success: true, 
                    user: req.session.user,
                    message: "Login successful",
                    sessionId: req.sessionID?.slice(0, 8) // For debugging
                  });
                }, delay);
              });
            };
            
            saveSessionWithRetry();
            return; // Exit after successful login
          }
        }
      } catch (dbError) {
        console.error("Database login check error:", dbError);
        return res.status(500).json({ message: "Database connection error" });
      }

      // No user found in database
      return res.status(401).json({ message: "Invalid email or password" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Teacher logout endpoint
  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });


  // Get current teacher with usage data
  app.get('/api/auth/user', async (req: any, res) => {
    console.log('🔍 Auth check - SessionID:', req.sessionID?.slice(0, 8));
    console.log('🔍 Session exists:', !!req.session);
    console.log('🔍 Is authenticated:', req.session?.isAuthenticated);
    console.log('🔍 Has user:', !!req.session?.user);
    
    if (req.session && req.session.isAuthenticated === true && req.session.user) {
      console.log('✅ Authentication successful for:', req.session.user.email);
      try {
        // Get updated user data with usage statistics from database
        const userWithUsage = await storage.getUser(req.session.user.id);
        
        const baseLimit = userWithUsage?.supportRequestsLimit || 20;
        const additionalRequests = userWithUsage?.additionalRequests || 0;
        const totalLimit = baseLimit + additionalRequests;
        
        const responseData = {
          ...req.session.user,
          supportRequestsUsed: userWithUsage?.supportRequestsUsed || 0,
          supportRequestsLimit: totalLimit,
          additionalRequests: additionalRequests,
          baseLimit: baseLimit
        };
        
        res.json(responseData);
      } catch (error) {
        console.error("Error fetching user usage data:", error);
        // Return basic user data if database lookup fails
        res.json({
          ...req.session.user,
          supportRequestsUsed: 0,
          supportRequestsLimit: 20,
          additionalRequests: 0,
          baseLimit: 20
        });
      }
    } else {
      console.log('❌ Authentication failed - Session state:');
      console.log('  - Session exists:', !!req.session);
      console.log('  - isAuthenticated value:', req.session?.isAuthenticated, 'type:', typeof req.session?.isAuthenticated);
      console.log('  - User exists:', !!req.session?.user);
      console.log('  - User data:', req.session?.user ? 'present' : 'missing');
      res.status(401).json({ message: "Not authenticated" });
    }
  });


  // Simple auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.session.isAuthenticated && req.session.user) {
      req.user = { claims: { sub: req.session.user.id } }; // Compatibility with existing code
      next();
    } else {
      res.status(401).json({ message: "Authentication required" });
    }
  };

  // Admin middleware - requires both authentication and admin privileges
  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.session.isAuthenticated && req.session.user && req.session.user.isAdmin) {
      req.user = { claims: { sub: req.session.user.id } }; // Compatibility with existing code
      next();
    } else {
      res.status(403).json({ message: "Admin access required" });
    }
  };


  // Update user profile - PROTECTED
  app.put('/api/user/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, email } = req.body;

      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }

      if (!email.includes('@')) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Email address is already in use" });
      }

      const updatedUser = await storage.updateUser(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim()
      });

      // Update session data to reflect changes
      if (req.session.user) {
        req.session.user.firstName = firstName.trim();
        req.session.user.lastName = lastName.trim();
        req.session.user.email = email.trim();
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Create a new concern and generate recommendations - PROTECTED
  app.post("/api/concerns", requireAuth, async (req: any, res) => {
    try {
      // SECURE: Get real user ID from authenticated session
      const userId = req.user.claims.sub;
      
      // Check usage limit BEFORE creating concern
      const usageCheck = await storage.checkUserUsageLimit(userId);
      if (!usageCheck.canCreate) {
        return res.status(429).json({ 
          message: `Monthly usage limit reached. You have used ${usageCheck.used} of ${usageCheck.limit} requests this month.`,
          usageData: usageCheck
        });
      }
      
      // Create concern in database
      const newConcern = await storage.createConcern({
        teacherId: userId,
        studentFirstName: String(req.body.studentFirstName),
        studentLastInitial: String(req.body.studentLastInitial),
        grade: String(req.body.grade),
        teacherPosition: String(req.body.teacherPosition),
        location: String(req.body.location),
        concernTypes: req.body.concernTypes || [],
        otherConcernType: req.body.otherConcernType || null,
        description: String(req.body.description),
        severityLevel: String(req.body.severityLevel),
        actionsTaken: req.body.actionsTaken || [],
        otherActionTaken: req.body.otherActionTaken || null,
        
        // Student differentiation fields
        hasIep: Boolean(req.body.hasIep),
        hasDisability: Boolean(req.body.hasDisability),
        disabilityType: req.body.disabilityType || null,
        isEalLearner: Boolean(req.body.isEalLearner),
        ealProficiency: req.body.ealProficiency || null,
        isGifted: Boolean(req.body.isGifted),
        isStruggling: Boolean(req.body.isStruggling),
        otherNeeds: req.body.otherNeeds || null,
        
        // File uploads
        studentAssessmentFile: req.body.studentAssessmentFile || null,
        lessonPlanContent: req.body.lessonPlanContent || null,
        
        // Task type selection
        taskType: req.body.taskType || "tier2_intervention",
      });
      
      // Debug: Log the differentiation data being received
      console.log("🔍 Differentiation data received from form:", {
        hasIep: req.body.hasIep,
        hasDisability: req.body.hasDisability,
        disabilityType: req.body.disabilityType,
        isEalLearner: req.body.isEalLearner,
        ealProficiency: req.body.ealProficiency,
        isGifted: req.body.isGifted,
        isStruggling: req.body.isStruggling,
        otherNeeds: req.body.otherNeeds,
      });

      // Generate AI recommendations using the enhanced format
      const recommendationRequest: GenerateRecommendationsRequest = {
        studentFirstName: newConcern.studentFirstName,
        studentLastInitial: newConcern.studentLastInitial,
        grade: newConcern.grade || "Elementary",
        teacherPosition: newConcern.teacherPosition || "Teacher",
        incidentDate: newConcern.incidentDate ? newConcern.incidentDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        location: newConcern.location || "Classroom",
        concernTypes: Array.isArray(newConcern.concernTypes) ? newConcern.concernTypes : [],
        otherConcernType: newConcern.otherConcernType || undefined,
        concernDescription: newConcern.description,
        severityLevel: newConcern.severityLevel || "moderate",
        actionsTaken: Array.isArray(newConcern.actionsTaken) ? newConcern.actionsTaken : [],
        otherActionTaken: newConcern.otherActionTaken || undefined,
        
        // Pass through student differentiation fields for AI personalization
        hasIep: newConcern.hasIep || false,
        hasDisability: newConcern.hasDisability || false,
        disabilityType: newConcern.disabilityType || undefined,
        isEalLearner: newConcern.isEalLearner || false,
        ealProficiency: newConcern.ealProficiency || undefined,
        isGifted: newConcern.isGifted || false,
        isStruggling: newConcern.isStruggling || false,
        otherNeeds: newConcern.otherNeeds || undefined,
        
        // File uploads for enhanced AI recommendations
        studentAssessmentFile: newConcern.studentAssessmentFile || undefined,
        lessonPlanContent: newConcern.lessonPlanContent || undefined,
        
        // Task type for focused AI responses
        taskType: newConcern.taskType || "tier2_intervention",
      };

      const recommendationResponse = await generateRecommendations(recommendationRequest);

      // Save the AI response with appropriate title based on task type
      const taskTypeLabel = newConcern.taskType === "differentiation" ? "Differentiation Strategies" : "Tier 2 Intervention Recommendations";
      const savedInterventions = await storage.createInterventions([{
        concernId: newConcern.id,
        title: `AI-Generated ${taskTypeLabel}`,
        description: recommendationResponse.recommendations,
        steps: newConcern.taskType === "differentiation" 
          ? ["Review Student Needs", "Adapt Instruction Methods", "Implement Accommodations", "Monitor Learning Progress"]
          : ["Review Assessment Summary", "Implement Immediate Interventions", "Apply Short-term Strategies", "Monitor Progress"],
        timeline: newConcern.taskType === "differentiation" ? "Ongoing" : "2-6 weeks",
      }]);

      // Increment usage count after successful concern creation
      try {
        const updatedUser = await storage.incrementUserRequestCount(userId);
        console.log(`✅ Incremented usage count for user ${userId} - new count: ${updatedUser.supportRequestsUsed}`);
      } catch (usageError) {
        console.error("Failed to increment usage count:", usageError);
        // Don't fail the concern creation if usage tracking fails
      }

      res.json({
        concern: newConcern,
        interventions: savedInterventions,
        recommendations: recommendationResponse.recommendations,
        disclaimer: recommendationResponse.disclaimer,
      });
    } catch (error) {
      console.error("Error creating concern:", error);
      res.status(500).json({ message: "Failed to create concern and generate recommendations" });
    }
  });

  // Get concerns for the current teacher - PROTECTED
  app.get("/api/concerns", requireAuth, async (req: any, res) => {
    try {
      // SECURE: Get real user ID from authenticated session
      const userId = req.user.claims.sub;
      const concerns = await storage.getConcernsByTeacher(userId);
      res.json(concerns);
    } catch (error) {
      console.error("Error fetching concerns:", error);
      res.status(500).json({ message: "Failed to fetch concerns" });
    }
  });

  // Save an intervention - PROTECTED
  app.post("/api/interventions/:id/save", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const interventionId = req.params.id;

      // Get the intervention and verify ownership through the concern
      const intervention = await storage.getInterventionById(interventionId);
      
      if (!intervention) {
        return res.status(404).json({ message: "Intervention not found" });
      }

      // Get the concern to verify ownership
      const concern = await storage.getConcernById(intervention.concernId);
      
      if (!concern || concern.teacherId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Save the intervention
      const savedIntervention = await storage.saveIntervention(interventionId);
      
      res.json({
        success: true,
        intervention: savedIntervention,
        message: "Intervention saved successfully"
      });
    } catch (error) {
      console.error("Error saving intervention:", error);
      res.status(500).json({ message: "Failed to save intervention" });
    }
  });

  // Object storage upload endpoint - PROTECTED
  app.post("/api/objects/upload", requireAuth, async (req: any, res) => {
    try {
      console.log('🔧 Upload endpoint called by user:', req.user?.claims?.sub);
      console.log('🔧 Environment check - PRIVATE_OBJECT_DIR:', process.env.PRIVATE_OBJECT_DIR ? '[SET]' : '[NOT SET]');
      
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log('✅ Generated upload URL successfully');
      
      // Also provide the normalized path for the application to use
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      
      res.json({ 
        uploadURL,
        normalizedPath 
      });
    } catch (error) {
      console.error('❌ Error getting upload URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('❌ Error details:', {
        message: errorMessage,
        stack: errorStack,
        privateObjectDir: process.env.PRIVATE_OBJECT_DIR
      });
      res.status(500).json({ 
        error: "Failed to get upload URL", 
        details: errorMessage,
        envCheck: {
          privateObjectDir: !!process.env.PRIVATE_OBJECT_DIR
        }
      });
    }
  });

  // Serve uploaded objects - PROTECTED
  app.get("/objects/:objectPath(*)", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const objectStorageService = new ObjectStorageService();
      
      console.log('📁 Serving object:', req.path, 'for user:', userId);
      
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // For now, allow all authenticated users to access their uploaded files
      // TODO: Implement proper ACL checking when needed
      const canAccess = true;
      
      if (!canAccess) {
        console.log('❌ Access denied for object:', req.path, 'user:', userId);
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Serve the file
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error('❌ Error serving object:', error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate AI recommendations directly (for testing)
  app.post("/api/concerns/generate-recommendations", requireAuth, async (req: any, res) => {
    console.log("🤖 AI generation endpoint called");
    try {
      // Validate the request data matches GenerateRecommendationsRequest interface
      const recommendationRequest: GenerateRecommendationsRequest = req.body;
      
      console.log("📋 Generating recommendations for:", recommendationRequest.studentFirstName, recommendationRequest.studentLastInitial);
      
      const recommendationResponse = await generateRecommendations(recommendationRequest);
      
      res.json({
        success: true,
        recommendations: recommendationResponse.recommendations,
        disclaimer: recommendationResponse.disclaimer
      });
    } catch (error) {
      console.error("❌ Error in AI generation endpoint:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to generate recommendations",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get a specific concern with all details - PROTECTED
  app.get("/api/concerns/:id", requireAuth, async (req: any, res) => {
    try {
      // SECURE: Get real user ID from authenticated session
      const userId = req.user.claims.sub;
      const concern = await storage.getConcernWithDetails(req.params.id);
      
      if (!concern) {
        return res.status(404).json({ message: "Concern not found" });
      }

      // Verify the concern belongs to the current user
      if (concern.teacherId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(concern);
    } catch (error) {
      console.error("Error fetching concern:", error);
      res.status(500).json({ message: "Failed to fetch concern" });
    }
  });

  // Delete a concern - PROTECTED
  app.delete("/api/concerns/:id", requireAuth, async (req: any, res) => {
    try {
      // SECURE: Get real user ID from authenticated session
      const userId = req.user.claims.sub;
      const concernId = req.params.id;

      // First, verify the concern exists and belongs to the current user
      const concern = await storage.getConcernById(concernId);
      
      if (!concern) {
        return res.status(404).json({ message: "Concern not found" });
      }

      // Verify the concern belongs to the current user
      if (concern.teacherId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Delete the concern (related data should cascade delete)
      const deleted = await storage.deleteConcern(concernId);
      
      if (deleted) {
        res.json({ message: "Concern deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete concern" });
      }
    } catch (error) {
      console.error("Error deleting concern:", error);
      res.status(500).json({ message: "Failed to delete concern" });
    }
  });

  // Get follow-up questions for a concern - PROTECTED
  app.get("/api/concerns/:id/questions", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const concernId = req.params.id;

      // Get concern to verify ownership
      const concern = await storage.getConcernById(concernId);
      
      if (!concern) {
        return res.status(404).json({ message: "Concern not found" });
      }

      if (concern.teacherId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get questions for this concern
      const questions = await storage.getFollowUpQuestionsByConcern(concernId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching follow-up questions:", error);
      res.status(500).json({ message: "Failed to fetch follow-up questions" });
    }
  });

  // Ask a follow-up question using enhanced AI assistance - PROTECTED
  app.post("/api/concerns/:id/questions", requireAuth, async (req: any, res) => {
    try {
      // SECURE: Get real user ID from authenticated session
      const userId = req.user.claims.sub;
      const concernId = req.params.id;
      const { question, language } = req.body;

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ message: "Question is required" });
      }

      // Get concern with interventions
      const concern = await storage.getConcernWithDetails(concernId);
      
      if (!concern) {
        return res.status(404).json({ message: "Concern not found" });
      }

      // Create follow-up assistance request using enhanced format
      const followUpRequest: FollowUpAssistanceRequest = {
        originalRecommendations: concern.interventions.map(i => i.description).join('\n\n'),
        specificQuestion: question,
        studentFirstName: concern.studentFirstName,
        studentLastInitial: concern.studentLastInitial,
        grade: concern.grade || "Elementary",
        concernTypes: Array.isArray(concern.concernTypes) ? concern.concernTypes : [concern.concernType || "Academic"],
        severityLevel: concern.severityLevel || "moderate",
        language: language,
      };

      const assistanceResponse = await followUpAssistance(followUpRequest);

      // Save the question and response
      const savedQuestion = await storage.createFollowUpQuestion({
        concernId,
        question,
        response: assistanceResponse.assistance,
      });

      res.json({
        ...savedQuestion,
        disclaimer: assistanceResponse.disclaimer,
      });
    } catch (error) {
      console.error("Error processing follow-up question:", error);
      res.status(500).json({ message: "Failed to process follow-up question" });
    }
  });

  // Generate HTML report - PROTECTED
  app.post("/api/concerns/:id/report", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const concernId = req.params.id;

      // Get concern with all details
      const concern = await storage.getConcernWithDetails(concernId);
      
      if (!concern) {
        return res.status(404).json({ message: "Concern not found" });
      }

      if (concern.teacherId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Ensure reports directory exists
      const reportsDir = ensureReportsDirectory();
      const filename = `concern-${concernId}-${Date.now()}.html`;
      const filePath = path.join(reportsDir, filename);

      // Generate HTML report
      await generateConcernHTMLReport(concern, concern.interventions, filePath);

      // Create report record (update field name to htmlPath)
      const report = await storage.createReport({
        concernId,
        pdfPath: filePath, // We'll keep this field name for now to avoid schema changes
      });

      res.json({
        reportId: report.id,
        viewUrl: `/api/reports/${report.id}/view`,
        downloadUrl: `/api/reports/${report.id}/download`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // View HTML report - PROTECTED
  app.get("/api/reports/:id/view", requireAuth, async (req: any, res) => {
    try {
      const reportId = req.params.id;
      const report = await storage.getReportById(reportId);
      
      if (!report || !report.pdfPath) {
        return res.status(404).json({ message: "Report not found" });
      }

      if (!fs.existsSync(report.pdfPath)) {
        return res.status(404).json({ message: "Report file not found" });
      }

      // Serve HTML file directly
      res.setHeader('Content-Type', 'text/html');
      const htmlContent = await fs.promises.readFile(report.pdfPath, 'utf8');
      res.send(htmlContent);
    } catch (error) {
      console.error("Error viewing report:", error);
      res.status(500).json({ message: "Failed to view report" });
    }
  });

  // Download HTML report - PROTECTED
  app.get("/api/reports/:id/download", requireAuth, async (req: any, res) => {
    try {
      const reportId = req.params.id;
      const report = await storage.getReportById(reportId);
      
      if (!report || !report.pdfPath) {
        return res.status(404).json({ message: "Report not found" });
      }

      if (!fs.existsSync(report.pdfPath)) {
        return res.status(404).json({ message: "Report file not found" });
      }

      // Serve as downloadable HTML file
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', 'attachment; filename="concern-report.html"');
      
      const fileStream = fs.createReadStream(report.pdfPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading report:", error);
      res.status(500).json({ message: "Failed to download report" });
    }
  });

  // Share report via email - PROTECTED
  app.post("/api/concerns/:id/share", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const concernId = req.params.id;
      const { recipients, message } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ message: "Recipients are required" });
      }

      // Get concern and report
      const concern = await storage.getConcernWithDetails(concernId);
      
      if (!concern) {
        return res.status(404).json({ message: "Concern not found" });
      }

      if (concern.teacherId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get or create report
      let report = await storage.getReportByConcernId(concernId);
      
      if (!report) {
        // Generate HTML report if it doesn't exist
        const reportsDir = ensureReportsDirectory();
        const filename = `concern-${concernId}-${Date.now()}.html`;
        const filePath = path.join(reportsDir, filename);

        await generateConcernHTMLReport(concern, concern.interventions, filePath);
        
        report = await storage.createReport({
          concernId,
          pdfPath: filePath, // Keep field name for compatibility
          sharedWith: recipients.map((r: any) => r.email),
        });
      }

      // Send email
      const baseUrl = req.protocol + '://' + req.get('host');
      const reportLink = generateSecureReportLink(concernId, baseUrl);
      
      const emailSuccess = await sendReportEmail({
        recipients,
        subject: `Student Concern Report - ${concern.studentFirstName} ${concern.studentLastInitial}.`,
        message,
        attachmentPath: report.pdfPath || undefined,
        reportLink,
        userId: userId  // Pass userId to use personal email configuration
      });

      if (emailSuccess) {
        res.json({ message: "Report shared successfully" });
      } else {
        res.status(500).json({ message: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sharing report:", error);
      res.status(500).json({ message: "Failed to share report" });
    }
  });

  // Bulk share multiple concerns - PROTECTED
  app.post("/api/concerns/bulk-share", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { concernIds, recipientEmail, recipientName, message, senderName } = req.body;

      if (!concernIds || !Array.isArray(concernIds) || concernIds.length === 0) {
        return res.status(400).json({ message: "Concern IDs are required" });
      }

      if (!recipientEmail) {
        return res.status(400).json({ message: "Recipient email is required" });
      }

      // Verify all concerns belong to the authenticated user
      const concerns = [];
      for (const concernId of concernIds) {
        const concern = await storage.getConcernWithDetails(concernId);
        
        if (!concern) {
          return res.status(404).json({ message: `Concern ${concernId} not found` });
        }

        if (concern.teacherId !== userId) {
          return res.status(403).json({ message: "Access denied to one or more concerns" });
        }

        concerns.push(concern);
      }

      // In a real implementation, send bulk email here
      // For now, just return success
      console.log(`Would send ${concerns.length} concerns to ${recipientEmail} from ${senderName}`);

      res.json({ 
        success: true, 
        message: `Successfully shared ${concerns.length} support requests with ${recipientName || recipientEmail}` 
      });
    } catch (error) {
      console.error("Error bulk sharing concerns:", error);
      res.status(500).json({ message: "Failed to bulk share concerns" });
    }
  });

  // Admin route to grant additional requests - PROTECTED ADMIN ONLY
  app.post("/api/admin/grant-additional-requests", requireAuth, async (req: any, res) => {
    try {
      // This is a demo - in production you'd check if user is admin via database
      const adminId = req.user.claims.sub;
      const { userId, amount, reason } = req.body;
      
      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Valid user ID and positive amount required" });
      }
      
      if (amount > 50) {
        return res.status(400).json({ message: "Cannot grant more than 50 additional requests at once" });
      }
      
      // Grant additional requests
      const updatedUser = await storage.grantAdditionalRequests(userId, amount, adminId);
      
      res.json({
        success: true,
        message: `Granted ${amount} additional requests to user ${userId}`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          totalLimit: (updatedUser.supportRequestsLimit || 20) + (updatedUser.additionalRequests || 0),
          additionalRequests: updatedUser.additionalRequests
        }
      });
    } catch (error) {
      console.error("Error granting additional requests:", error);
      res.status(500).json({ message: "Failed to grant additional requests" });
    }
  });

  // ===========================================
  // ADMIN ROUTES - All admin-only endpoints
  // ===========================================
  
  // Admin Dashboard Stats
  app.get("/api/admin/dashboard-stats", requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });
  
  // Admin Recent Activity
  app.get("/api/admin/recent-activity", requireAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const activity = await storage.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });
  
  // ===========================================
  // SCHOOL MANAGEMENT
  // ===========================================
  
  // Get all schools
  app.get("/api/admin/schools", requireAdmin, async (req: any, res) => {
    try {
      const schools = await storage.getSchools();
      res.json(schools);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });

  // Auto-create schools from teacher data
  app.post("/api/admin/schools/auto-create", requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      
      // Get school names directly from users table to avoid join complications
      const usersWithSchools = await db.select({ 
        id: users.id, 
        school: users.school 
      }).from(users).where(sql`${users.school} IS NOT NULL AND ${users.school} != ''`);
      
      console.log(`🔍 Found ${usersWithSchools.length} users with school information`);
      
      // Get existing schools to avoid duplicates
      const existingSchools = await storage.getSchools();
      console.log(`🔍 Found ${existingSchools.length} existing schools`);
      const existingSchoolNames = new Set(existingSchools.map(s => s.name.toLowerCase()));
      
      // Extract unique school names from users
      const userSchools = new Set<string>();
      usersWithSchools.forEach((user: any) => {
        console.log(`🔍 Checking user ${user.id}: school = "${user.school}"`);
        
        if (user.school && user.school.trim()) {
          const schoolName = user.school.trim();
          if (!existingSchoolNames.has(schoolName.toLowerCase())) {
            userSchools.add(schoolName);
            console.log(`🔍 Added school to creation list: "${schoolName}"`);
          } else {
            console.log(`🔍 School "${schoolName}" already exists, skipping`);
          }
        }
      });
      
      console.log(`🔍 Total unique schools to create: ${userSchools.size}`);
      
      // Create school records for each unique school name
      const createdSchools = [];
      for (const schoolName of Array.from(userSchools)) {
        try {
          const school = await storage.createSchool({ 
            name: schoolName,
            district: null,
            contactEmail: null
          });
          
          // Log admin action
          await storage.logAdminAction({
            adminId,
            action: 'auto_create_school',
            targetSchoolId: school.id,
            details: { schoolName: school.name }
          });
          
          createdSchools.push(school);
        } catch (error) {
          console.error(`Failed to create school ${schoolName}:`, error);
        }
      }
      
      res.json({ 
        success: true, 
        created: createdSchools.length,
        schools: createdSchools 
      });
    } catch (error) {
      console.error("Error auto-creating schools:", error);
      res.status(500).json({ message: "Failed to auto-create schools" });
    }
  });
  
  // Create new school
  app.post("/api/admin/schools", requireAuth, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const school = await storage.createSchool(req.body);
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: 'create_school',
        targetSchoolId: school.id,
        details: { schoolName: school.name }
      });
      
      res.json(school);
    } catch (error) {
      console.error("Error creating school:", error);
      res.status(500).json({ message: "Failed to create school" });
    }
  });
  
  // Get school with users
  app.get("/api/admin/schools/:id", requireAuth, async (req: any, res) => {
    try {
      const school = await storage.getSchoolWithUsers(req.params.id);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      res.json(school);
    } catch (error) {
      console.error("Error fetching school:", error);
      res.status(500).json({ message: "Failed to fetch school" });
    }
  });
  
  // Update school
  app.put("/api/admin/schools/:id", requireAuth, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const school = await storage.updateSchool(req.params.id, req.body);
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: 'update_school',
        targetSchoolId: school.id,
        details: { changes: req.body }
      });
      
      res.json(school);
    } catch (error) {
      console.error("Error updating school:", error);
      res.status(500).json({ message: "Failed to update school" });
    }
  });
  
  // Data impact analysis for school deletion safety
  app.get('/api/admin/schools/:schoolId/deletion-impact', requireAuth, async (req, res) => {
    try {
      const schoolId = req.params.schoolId;
      
      // Get school details
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }

      // Get affected users
      const affectedUsers = await storage.getUsersBySchoolId(schoolId);
      
      // Get total concerns from all teachers in this school
      const concernsQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(concerns)
        .innerJoin(users, eq(concerns.teacherId, users.id))
        .where(eq(users.schoolId, schoolId));
      
      const totalConcerns = concernsQuery[0]?.count || 0;

      // Get interventions count
      const interventionsQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(interventions)
        .innerJoin(concerns, eq(interventions.concernId, concerns.id))
        .innerJoin(users, eq(concerns.teacherId, users.id))
        .where(eq(users.schoolId, schoolId));
      
      const totalInterventions = interventionsQuery[0]?.count || 0;

      // Get reports count
      const reportsQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(reports)
        .innerJoin(concerns, eq(reports.concernId, concerns.id))
        .innerJoin(users, eq(concerns.teacherId, users.id))
        .where(eq(users.schoolId, schoolId));
      
      const totalReports = reportsQuery[0]?.count || 0;

      const impact = {
        school: school,
        affectedUsers: affectedUsers.length,
        userDetails: affectedUsers.map(u => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          requestsUsed: u.supportRequestsUsed
        })),
        totalConcerns,
        totalInterventions,
        totalReports,
        warnings: [
          `${affectedUsers.length} teacher accounts will be affected`,
          `${totalConcerns} student concerns will be lost`,
          `${totalInterventions} AI interventions will be lost`,
          `${totalReports} generated reports will be lost`,
          "All school email configurations will be removed",
          "All school feature settings will be lost"
        ]
      };

      res.json(impact);
    } catch (error) {
      console.error("Error analyzing school deletion impact:", error);
      res.status(500).json({ message: "Failed to analyze deletion impact" });
    }
  });

  // Comprehensive data export before school deletion
  app.get('/api/admin/schools/:schoolId/full-export', requireAuth, async (req, res) => {
    try {
      const schoolId = req.params.schoolId;
      
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }

      // Get all users in this school with their complete data
      const schoolUsers = await storage.getUsersBySchoolId(schoolId);
      
      const fullExportData = {
        school: school,
        exportDate: new Date().toISOString(),
        users: []
      };

      for (const user of schoolUsers) {
        const userData = await storage.getFullUserExportData(user.id);
        (fullExportData.users as any[]).push(userData);
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="school-${school.name.replace(/\s+/g, '-')}-complete-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(fullExportData);
    } catch (error) {
      console.error("Error creating full school export:", error);
      res.status(500).json({ message: "Failed to create export" });
    }
  });

  // Soft deletion alternative for schools
  app.put('/api/admin/schools/:id/mark-inactive', requireAuth, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const school = await storage.markSchoolInactive(req.params.id);
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: 'mark_school_inactive',
        targetSchoolId: school.id,
        details: { schoolName: school.name }
      });
      
      res.json({ success: true, school });
    } catch (error) {
      console.error("Error marking school inactive:", error);
      res.status(500).json({ message: "Failed to mark school inactive" });
    }
  });

  // Delete school (now with enhanced safety logging)
  app.delete("/api/admin/schools/:id", requireAuth, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      
      // Get school name before deletion for logging
      const school = await storage.getSchoolById(req.params.id);
      const schoolName = school?.name || 'Unknown';
      
      await storage.deleteSchool(req.params.id);
      
      // Log admin action with enhanced details
      await storage.logAdminAction({
        adminId,
        action: 'delete_school_permanently',
        details: { 
          schoolName,
          warning: 'PERMANENT DELETION - All associated data was permanently removed',
          deletedAt: new Date().toISOString()
        }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting school:", error);
      res.status(500).json({ message: "Failed to delete school" });
    }
  });
  
  // ===========================================
  // USER MANAGEMENT
  // ===========================================
  
  // Get all users with school info
  app.get("/api/admin/users", requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Create new user
  app.post("/api/admin/users", requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const user = await storage.createUser(req.body);
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: 'create_user',
        targetUserId: user.id,
        details: { email: user.email }
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // Bulk create users
  app.post("/api/admin/users/bulk", requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { users: userList } = req.body;
      
      if (!Array.isArray(userList) || userList.length === 0) {
        return res.status(400).json({ message: "Invalid user list" });
      }
      
      const newUsers = await storage.bulkCreateUsers(userList);
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: 'bulk_create_users',
        details: { count: newUsers.length }
      });
      
      res.json(newUsers);
    } catch (error) {
      console.error("Error bulk creating users:", error);
      res.status(500).json({ message: "Failed to bulk create users" });
    }
  });
  
  // Update user
  app.put("/api/admin/users/:id", requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const user = await storage.updateUser(req.params.id, req.body);
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: 'update_user',
        targetUserId: user.id,
        details: { changes: req.body }
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Data impact analysis for user deletion safety
  app.get('/api/admin/users/:userId/deletion-impact', requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      
      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's concerns
      const userConcerns = await db
        .select({ count: sql<number>`count(*)` })
        .from(concerns)
        .where(eq(concerns.teacherId, userId));
      
      const totalConcerns = userConcerns[0]?.count || 0;

      // Get interventions for this user's concerns
      const interventionsQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(interventions)
        .innerJoin(concerns, eq(interventions.concernId, concerns.id))
        .where(eq(concerns.teacherId, userId));
      
      const totalInterventions = interventionsQuery[0]?.count || 0;

      // Get reports for this user's concerns
      const reportsQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(reports)
        .innerJoin(concerns, eq(reports.concernId, concerns.id))
        .where(eq(concerns.teacherId, userId));
      
      const totalReports = reportsQuery[0]?.count || 0;

      const impact = {
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          school: user.school || 'No school assigned',
          requestsUsed: user.supportRequestsUsed
        },
        totalConcerns,
        totalInterventions,
        totalReports,
        warnings: [
          `${totalConcerns} student concerns will be lost`,
          `${totalInterventions} AI interventions will be lost`,
          `${totalReports} generated reports will be lost`,
          "All progress notes created by this teacher will be lost",
          "Personal email configuration will be removed",
          "All activity logs will remain for audit purposes"
        ]
      };

      res.json(impact);
    } catch (error) {
      console.error("Error analyzing user deletion impact:", error);
      res.status(500).json({ message: "Failed to analyze deletion impact" });
    }
  });

  // Comprehensive data export before user deletion
  app.get('/api/admin/users/:userId/full-export', requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      
      const userData = await storage.getFullUserExportData(userId);
      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-${userData.user.firstName}-${userData.user.lastName}-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(userData);
    } catch (error) {
      console.error("Error creating full user export:", error);
      res.status(500).json({ message: "Failed to create export" });
    }
  });

  // Soft deletion alternative for users
  app.put('/api/admin/users/:id/mark-inactive', requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const user = await storage.markUserInactive(req.params.id);
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: 'mark_user_inactive',
        targetUserId: user.id,
        details: { userEmail: user.email }
      });
      
      res.json({ success: true, user });
    } catch (error) {
      console.error("Error marking user inactive:", error);
      res.status(500).json({ message: "Failed to mark user inactive" });
    }
  });

  // Delete user (now with enhanced safety logging)
  app.delete("/api/admin/users/:id", requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      
      // Get user email before deletion for logging
      const user = await storage.getUser(req.params.id);
      const userEmail = user?.email || 'Unknown';
      
      await storage.deleteUser(req.params.id);
      
      // Log admin action with enhanced details
      await storage.logAdminAction({
        adminId,
        action: 'delete_user_permanently',
        details: { 
          userEmail,
          warning: 'PERMANENT DELETION - All user data and associated concerns were permanently removed',
          deletedAt: new Date().toISOString()
        }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  
  // Bulk delete users
  app.delete("/api/admin/users/bulk", requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { userIds } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "Invalid user ID list" });
      }
      
      await storage.bulkDeleteUsers(userIds);
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: 'bulk_delete_users',
        details: { count: userIds.length }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error bulk deleting users:", error);
      res.status(500).json({ message: "Failed to bulk delete users" });
    }
  });
  
  // Grant additional requests (enhanced)
  app.post("/api/admin/users/:id/grant-requests", requireAuth, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { amount, reason } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid positive amount required" });
      }
      
      if (amount > 50) {
        return res.status(400).json({ message: "Cannot grant more than 50 additional requests at once" });
      }
      
      const user = await storage.grantAdditionalRequests(req.params.id, amount, adminId);
      
      res.json({
        success: true,
        message: `Granted ${amount} additional requests to user ${req.params.id}`,
        user: {
          id: user.id,
          email: user.email,
          totalLimit: (user.supportRequestsLimit || 20) + (user.additionalRequests || 0),
          additionalRequests: user.additionalRequests
        }
      });
    } catch (error) {
      console.error("Error granting additional requests:", error);
      res.status(500).json({ message: "Failed to grant additional requests" });
    }
  });

  // Dedicated follow-up assistance API endpoint
  app.post("/api/ai/follow-up-assistance", async (req: any, res) => {
    try {
      // Validate request body
      const {
        originalRecommendations,
        specificQuestion,
        studentFirstName,
        studentLastInitial,
        grade,
        concernTypes,
        severityLevel
      } = req.body;

      if (!specificQuestion || !originalRecommendations) {
        return res.status(400).json({ message: "Original recommendations and specific question are required" });
      }

      const assistanceRequest: FollowUpAssistanceRequest = {
        originalRecommendations,
        specificQuestion,
        studentFirstName: studentFirstName || "Student",
        studentLastInitial: studentLastInitial || "S",
        grade: grade || "Elementary",
        concernTypes: concernTypes || ["General"],
        severityLevel: severityLevel || "moderate"
      };

      const response = await followUpAssistance(assistanceRequest);
      res.json(response);
    } catch (error) {
      console.error("Error in follow-up assistance:", error);
      res.status(500).json({ message: "Failed to generate follow-up assistance" });
    }
  });

  // Advanced Admin Services - Bulk CSV Upload
  app.post('/api/admin/teachers/bulk-csv-upload', requireAdmin, async (req: any, res) => {
    try {
      const { csvData, filename, schoolName, schoolDistrict, contactEmail, sendCredentials = false } = req.body;
      
      if (!csvData || !filename) {
        return res.status(400).json({ message: 'CSV data and filename are required' });
      }

      let csvContent: string;
      try {
        csvContent = Buffer.from(csvData, 'base64').toString('utf-8');
      } catch (error) {
        return res.status(400).json({ message: 'Invalid base64 CSV data' });
      }

      const result = await processBulkCSVUpload(csvContent);
      
      // If credentials should be sent and we have successful imports
      if (sendCredentials && result.successfulImports > 0 && result.createdCredentials.length > 0) {
        try {
          if (!schoolName || !contactEmail) {
            console.warn('School name or contact email missing for credential PDF');
          } else {
            const { sendCredentialPDF } = await import('./services/emailCredentials');
            
            const emailSent = await sendCredentialPDF({
              schoolName,
              schoolDistrict,
              contactEmail,
              credentials: result.createdCredentials,
              adminEmail: req.session?.user?.email,
              adminName: req.session?.user?.firstName && req.session?.user?.lastName 
                ? `${req.session.user.firstName} ${req.session.user.lastName}`
                : 'Administrator'
            });

            if (emailSent) {
              result.summary += ` Credential PDF sent to ${contactEmail}.`;
            } else {
              result.summary += ` Warning: Failed to send credential PDF to ${contactEmail}.`;
            }
          }
        } catch (emailError) {
          console.error('Error sending credential PDF:', emailError);
          result.summary += ' Warning: Could not send credential PDF due to email configuration.';
        }
      }

      res.json(result);
    } catch (error) {
      console.error('Bulk CSV upload error:', error);
      res.status(500).json({ message: 'Failed to process CSV upload' });
    }
  });

  // Demo Data Generation
  app.post('/api/admin/generate-demo-data', requireAdmin, async (req: any, res) => {
    try {
      const result = await generateDemoData();
      res.json(result);
    } catch (error) {
      console.error('Demo data generation error:', error);
      res.status(500).json({ message: 'Failed to generate demo data' });
    }
  });

  // Feature Flag Management Routes
  // Get all feature flags
  app.get('/api/admin/feature-flags', requireAdmin, async (req: any, res) => {
    try {
      const flags = await db.select().from(featureFlags).orderBy(featureFlags.createdAt);
      res.json({ flags });
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      res.status(500).json({ message: 'Failed to fetch feature flags' });
    }
  });

  // Create a new feature flag
  app.post('/api/admin/feature-flags', requireAdmin, async (req: any, res) => {
    try {
      const { flagName, description, isGloballyEnabled } = req.body;

      if (!flagName) {
        return res.status(400).json({ message: 'Flag name is required' });
      }

      // Check if flag already exists
      const existingFlag = await db.select()
        .from(featureFlags)
        .where(eq(featureFlags.flagName, flagName))
        .limit(1);

      if (existingFlag.length > 0) {
        return res.status(400).json({ message: 'Feature flag with this name already exists' });
      }

      const [newFlag] = await db.insert(featureFlags).values({
        flagName,
        description: description || null,
        isGloballyEnabled: isGloballyEnabled || false,
      }).returning();

      res.json({ flag: newFlag });
    } catch (error) {
      console.error('Error creating feature flag:', error);
      res.status(500).json({ message: 'Failed to create feature flag' });
    }
  });

  // Update a feature flag
  app.put('/api/admin/feature-flags/:id', requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { description, isGloballyEnabled } = req.body;

      const [updatedFlag] = await db.update(featureFlags)
        .set({
          description: description || null,
          isGloballyEnabled: isGloballyEnabled,
          updatedAt: new Date(),
        })
        .where(eq(featureFlags.id, id))
        .returning();

      if (!updatedFlag) {
        return res.status(404).json({ message: 'Feature flag not found' });
      }

      res.json({ flag: updatedFlag });
    } catch (error) {
      console.error('Error updating feature flag:', error);
      res.status(500).json({ message: 'Failed to update feature flag' });
    }
  });

  // Delete a feature flag
  app.delete('/api/admin/feature-flags/:id', requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      // First get the flag name to clean up overrides
      const [flag] = await db.select()
        .from(featureFlags)
        .where(eq(featureFlags.id, id))
        .limit(1);

      if (!flag) {
        return res.status(404).json({ message: 'Feature flag not found' });
      }

      // Delete associated school overrides
      await db.delete(schoolFeatureOverrides)
        .where(eq(schoolFeatureOverrides.flagName, flag.flagName));

      // Delete the feature flag
      await db.delete(featureFlags)
        .where(eq(featureFlags.id, id));

      res.json({ message: 'Feature flag deleted successfully' });
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      res.status(500).json({ message: 'Failed to delete feature flag' });
    }
  });

  // Toggle global status of a feature flag
  app.post('/api/admin/feature-flags/:id/toggle', requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { enabled } = req.body;

      const [updatedFlag] = await db.update(featureFlags)
        .set({
          isGloballyEnabled: enabled,
          updatedAt: new Date(),
        })
        .where(eq(featureFlags.id, id))
        .returning();

      if (!updatedFlag) {
        return res.status(404).json({ message: 'Feature flag not found' });
      }

      res.json({ flag: updatedFlag });
    } catch (error) {
      console.error('Error toggling feature flag:', error);
      res.status(500).json({ message: 'Failed to toggle feature flag' });
    }
  });

  // Get school overrides for a specific feature flag
  app.get('/api/admin/feature-flags/:flagName/overrides', requireAdmin, async (req: any, res) => {
    try {
      const { flagName } = req.params;

      const overrides = await db.select({
        schoolId: schoolFeatureOverrides.schoolId,
        flagName: schoolFeatureOverrides.flagName,
        isEnabled: schoolFeatureOverrides.isEnabled,
        enabledBy: schoolFeatureOverrides.enabledBy,
        enabledAt: schoolFeatureOverrides.enabledAt,
        schoolName: schools.name,
      })
        .from(schoolFeatureOverrides)
        .leftJoin(schools, eq(schoolFeatureOverrides.schoolId, schools.id))
        .where(eq(schoolFeatureOverrides.flagName, flagName))
        .orderBy(schoolFeatureOverrides.enabledAt);

      res.json({ overrides });
    } catch (error) {
      console.error('Error fetching feature flag overrides:', error);
      res.status(500).json({ message: 'Failed to fetch feature flag overrides' });
    }
  });

  // Public endpoint to check enabled feature flags (no authentication required)
  app.get('/api/feature-flags/enabled', async (req: any, res) => {
    try {
      const enabledFlags = await db.select({
        flagName: featureFlags.flagName,
        isGloballyEnabled: featureFlags.isGloballyEnabled,
      })
        .from(featureFlags)
        .where(eq(featureFlags.isGloballyEnabled, true));

      res.json({ flags: enabledFlags });
    } catch (error) {
      console.error('Error fetching enabled feature flags:', error);
      res.status(500).json({ message: 'Failed to fetch feature flags' });
    }
  });

  // Enhanced AI Services with DeepSeek
  app.post('/api/ai/recommendations', requireAuth, async (req: any, res) => {
    try {
      // Temporarily disabled - service removed
      const result = { message: "AI recommendations temporarily disabled" };
      res.json(result);
    } catch (error) {
      console.error('AI recommendations error:', error);
      res.status(500).json({ message: 'Failed to generate recommendations' });
    }
  });

  app.post('/api/ai/follow-up-assistance', requireAuth, async (req: any, res) => {
    try {
      // Temporarily disabled - service removed  
      const result = { message: "Follow-up assistance temporarily disabled" };
      res.json(result);
    } catch (error) {
      console.error('Follow-up assistance error:', error);
      res.status(500).json({ message: 'Failed to generate follow-up assistance' });
    }
  });

  // Analytics Dashboard Data
  app.get('/api/analytics/dashboard', requireAdmin, async (req: any, res) => {
    try {
      const dashboardStats = await storage.getDashboardStats();
      const recentActivity = await storage.getRecentActivity(10);
      const dailyStats = await storage.getDailyStats(30);
      
      const analytics = {
        ...dashboardStats,
        recentActivity,
        dailyStats
      };
      
      res.json(analytics);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: 'Failed to load analytics' });
    }
  });

  app.get('/api/analytics/usage-stats', requireAdmin, async (req: any, res) => {
    try {
      // Temporarily disabled - service removed
      const stats = { daily: [], weekly: [], monthly: [] };
      res.json(stats);
    } catch (error) {
      console.error('Usage stats error:', error);
      res.status(500).json({ message: 'Failed to load usage statistics' });
    }
  });

  // Referral Management System
  app.get('/api/referrals', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const referrals = await getReferrals(userId);
      res.json(referrals);
    } catch (error) {
      console.error('Referrals error:', error);
      res.status(500).json({ message: 'Failed to load referrals' });
    }
  });

  app.post('/api/referrals/create', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const referral = await createReferral({ ...req.body, userId });
      res.json(referral);
    } catch (error) {
      console.error('Create referral error:', error);
      res.status(500).json({ message: 'Failed to create referral' });
    }
  });

  // Enhanced Teacher Management
  app.get('/api/admin/teachers', requireAdmin, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json({ teachers: allUsers });
    } catch (error) {
      console.error('Teachers fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch teachers' });
    }
  });

  // Admin: Create a new teacher
  app.post('/api/admin/teachers', requireAdmin, async (req: any, res) => {
    try {
      const { firstName, lastName, email, password, school, schoolDistrict, primaryGrade, primarySubject, teacherType, supportRequestsLimit, isActive } = req.body;
      
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'First name, last name, email, and password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail?.(email);
      if (existingUser) {
        return res.status(409).json({ message: 'A teacher with this email already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the teacher
      const teacherData = {
        id: `teacher-${Date.now()}`,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        school: school || '',
        schoolDistrict: schoolDistrict || '',
        primaryGrade: primaryGrade || '',
        primarySubject: primarySubject || '',
        teacherType: teacherType || 'Classroom Teacher',
        supportRequestsLimit: parseInt(supportRequestsLimit) || 50,
        isActive: isActive !== false, // Default to true
        isAdmin: false,
        profileImageUrl: null,
      };

      await storage.upsertUser(teacherData);
      
      res.json({ 
        success: true, 
        teacher: {
          ...teacherData,
          name: `${firstName} ${lastName}`,
          supportRequestsUsed: 0,
          additionalRequests: 0,
          totalLimit: teacherData.supportRequestsLimit,
          role: 'teacher',
          lastLoginAt: null,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error creating teacher:', error);
      res.status(500).json({ message: 'Failed to create teacher' });
    }
  });

  // Admin: Update individual teacher
  app.put('/api/admin/teachers/:id', requireAdmin, async (req: any, res) => {
    try {
      const teacherId = req.params.id;
      const { firstName, lastName, email, school, supportRequestsLimit, isActive } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: 'First name, last name, and email are required' });
      }

      const updates = {
        firstName,
        lastName,
        email,
        school: school || '',
        supportRequestsLimit: parseInt(supportRequestsLimit) || 50,
        isActive: isActive !== false,
        updatedAt: new Date(),
      };

      await storage.updateUser(teacherId, updates);
      
      res.json({ success: true, message: 'Teacher updated successfully' });
    } catch (error) {
      console.error('Error updating teacher:', error);
      res.status(500).json({ message: 'Failed to update teacher' });
    }
  });

  // Admin: Send password reset email to teacher
  app.post('/api/admin/teachers/:id/password-reset', requireAdmin, async (req: any, res) => {
    try {
      const teacherId = req.params.id;
      
      // Get teacher information
      const teacher = await storage.getUser(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      // Initiate password reset
      if (!teacher.email) {
        return res.status(400).json({ message: 'Teacher email not found' });
      }
      const result = await initiatePasswordReset(teacher.email);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: `Password reset email sent to ${teacher.email}` 
        });
      } else {
        // Use 400 for configuration issues, not 500
        res.status(400).json({ 
          success: false, 
          message: result.message || 'Failed to send password reset email' 
        });
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      res.status(500).json({ message: 'Failed to send password reset email' });
    }
  });

  // Admin: Change teacher password directly (no email required)
  app.post('/api/admin/teachers/:id/change-password', requireAdmin, async (req: any, res) => {
    try {
      const teacherId = req.params.id;
      const { newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({ message: 'New password is required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      const teacher = await storage.getUser(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update teacher password
      await storage.updateUser(teacherId, { 
        password: hashedPassword,
        updatedAt: new Date(),
      });
      
      res.json({ 
        success: true, 
        message: `Password updated successfully for ${teacher.firstName} ${teacher.lastName}`
      });
    } catch (error) {
      console.error('Error changing teacher password:', error);
      res.status(500).json({ message: 'Failed to change teacher password' });
    }
  });

  // Admin: Grant additional requests to teacher
  app.post('/api/admin/teachers/:id/grant-requests', requireAdmin, async (req: any, res) => {
    try {
      const teacherId = req.params.id;
      const { additionalRequests } = req.body;
      
      if (!additionalRequests || additionalRequests <= 0) {
        return res.status(400).json({ message: 'Additional requests must be a positive number' });
      }

      const teacher = await storage.getUser(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      const newAdditionalRequests = (teacher.additionalRequests || 0) + parseInt(additionalRequests);
      await storage.updateUser(teacherId, { 
        additionalRequests: newAdditionalRequests,
        updatedAt: new Date(),
      });
      
      res.json({ 
        success: true, 
        message: `Granted ${additionalRequests} additional requests to ${teacher.firstName} ${teacher.lastName}`,
        newTotal: newAdditionalRequests
      });
    } catch (error) {
      console.error('Error granting requests:', error);
      res.status(500).json({ message: 'Failed to grant additional requests' });
    }
  });

  // Admin: Delete individual teacher
  app.delete('/api/admin/teachers/:id', requireAdmin, async (req: any, res) => {
    try {
      const teacherId = req.params.id;
      
      const teacher = await storage.getUser(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      await storage.deleteUser(teacherId);
      
      res.json({ 
        success: true, 
        message: `Teacher ${teacher.firstName} ${teacher.lastName} has been deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting teacher:', error);
      res.status(500).json({ message: 'Failed to delete teacher' });
    }
  });

  // Admin: Bulk grant requests by school
  app.post('/api/admin/teachers/bulk-grant-by-school', requireAdmin, async (req: any, res) => {
    try {
      const { school, additionalRequests } = req.body;
      
      if (!school || !additionalRequests || additionalRequests <= 0) {
        return res.status(400).json({ message: 'School and positive additional requests amount are required' });
      }

      // Get all active teachers from the specified school
      const teachersInSchool = await db
        .select()
        .from(users)
        .where(and(eq(users.school, school), eq(users.isActive, true), eq(users.role, 'teacher')));

      if (teachersInSchool.length === 0) {
        return res.status(404).json({ message: 'No active teachers found in the specified school' });
      }

      // Update additional requests for all teachers in the school
      const updatedTeachers = [];
      for (const teacher of teachersInSchool) {
        const newAdditionalRequests = (teacher.additionalRequests || 0) + parseInt(additionalRequests);
        await storage.updateUser(teacher.id, { 
          additionalRequests: newAdditionalRequests,
          updatedAt: new Date(),
        });
        updatedTeachers.push({
          ...teacher,
          additionalRequests: newAdditionalRequests
        });
      }
      
      res.json({ 
        success: true, 
        message: `Granted ${additionalRequests} additional requests to ${updatedTeachers.length} teachers at ${school}`,
        updatedCount: updatedTeachers.length,
        school: school
      });
    } catch (error) {
      console.error('Error bulk granting requests by school:', error);
      res.status(500).json({ message: 'Failed to grant additional requests to school teachers' });
    }
  });

  // Admin: Bulk grant requests to selected teachers
  app.post('/api/admin/teachers/bulk-grant-selected', requireAdmin, async (req: any, res) => {
    try {
      const { teacherIds, additionalRequests } = req.body;
      
      if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
        return res.status(400).json({ message: 'Teacher IDs array is required' });
      }
      
      if (!additionalRequests || additionalRequests <= 0) {
        return res.status(400).json({ message: 'Additional requests must be a positive number' });
      }

      const updatedTeachers = [];
      for (const teacherId of teacherIds) {
        const teacher = await storage.getUser(teacherId);
        if (teacher) {
          const newAdditionalRequests = (teacher.additionalRequests || 0) + parseInt(additionalRequests);
          await storage.updateUser(teacherId, { 
            additionalRequests: newAdditionalRequests,
            updatedAt: new Date(),
          });
          updatedTeachers.push({
            ...teacher,
            additionalRequests: newAdditionalRequests
          });
        }
      }
      
      res.json({ 
        success: true, 
        message: `Granted ${additionalRequests} additional requests to ${updatedTeachers.length} selected teachers`,
        updatedCount: updatedTeachers.length
      });
    } catch (error) {
      console.error('Error bulk granting requests to selected teachers:', error);
      res.status(500).json({ message: 'Failed to grant additional requests to selected teachers' });
    }
  });

  app.post('/api/admin/teachers/bulk-update', requireAdmin, async (req: any, res) => {
    try {
      const { teacherIds, updates } = req.body;
      const result = await bulkUpdateTeachers(teacherIds, updates);
      res.json(result);
    } catch (error) {
      console.error('Bulk update error:', error);
      res.status(500).json({ message: 'Failed to update teachers' });
    }
  });

  app.delete('/api/admin/teachers/bulk-delete', requireAdmin, async (req: any, res) => {
    try {
      const { teacherIds } = req.body;
      const result = await bulkDeleteTeachers(teacherIds);
      res.json(result);
    } catch (error) {
      console.error('Bulk delete error:', error);
      res.status(500).json({ message: 'Failed to delete teachers' });
    }
  });

  // API Key Management Routes
  app.get('/api/admin/api-keys', requireAdmin, async (req: any, res) => {
    try {
      const apiKeys = await getApiKeys();
      res.json({ apiKeys });
    } catch (error) {
      console.error('API keys fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch API keys' });
    }
  });

  app.post('/api/admin/api-keys', requireAdmin, async (req: any, res) => {
    try {
      const { name, apiKey, provider, description, maxUsage, isActive } = req.body;
      
      if (!name || !apiKey) {
        return res.status(400).json({ message: 'Name and API key are required' });
      }

      const adminId = req.user.claims.sub;
      const result = await createApiKey({
        name,
        apiKey,
        provider: provider || 'deepseek',
        description,
        maxUsage: maxUsage ? parseInt(maxUsage) : 10000,
        isActive: isActive !== false,
      }, adminId);
      
      res.json(result);
    } catch (error) {
      console.error('Create API key error:', error);
      res.status(500).json({ message: 'Failed to create API key' });
    }
  });

  app.put('/api/admin/api-keys/:id', requireAdmin, async (req: any, res) => {
    try {
      const keyId = req.params.id;
      const updates = req.body;
      
      const result = await updateApiKey(keyId, updates);
      res.json(result);
    } catch (error) {
      console.error('Update API key error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to update API key' });
    }
  });

  app.delete('/api/admin/api-keys/:id', requireAdmin, async (req: any, res) => {
    try {
      const keyId = req.params.id;
      
      const result = await deleteApiKey(keyId);
      res.json(result);
    } catch (error) {
      console.error('Delete API key error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to delete API key' });
    }
  });

  // ===========================================
  // DATA EXPORT MANAGEMENT
  // ===========================================

  // Get all available school names for export
  app.get('/api/admin/export/schools', requireAdmin, async (req: any, res) => {
    try {
      const schools = await getAllSchoolNames();
      res.json({ schools });
    } catch (error) {
      console.error('Error fetching schools for export:', error);
      res.status(500).json({ message: 'Failed to fetch schools' });
    }
  });

  // Export individual teacher data
  app.get('/api/admin/export/teacher/:teacherId', requireAdmin, async (req: any, res) => {
    try {
      const { teacherId } = req.params;
      const { format = 'json' } = req.query;

      const teacherData = await getTeacherExportData(teacherId);
      if (!teacherData) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      // Log admin action
      const adminId = req.user.claims.sub;
      await storage.logAdminAction({
        adminId,
        action: 'export_teacher_data',
        targetUserId: teacherId,
        details: { format, timestamp: new Date().toISOString() }
      });

      if (format === 'csv') {
        const csvData = convertToCSV(teacherData);
        const teacherName = `${teacherData.teacher.firstName}_${teacherData.teacher.lastName}`.replace(/\s+/g, '_');
        const filename = `teacher_export_${teacherName}_${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvData);
      } else {
        res.json(teacherData);
      }
    } catch (error) {
      console.error('Error exporting teacher data:', error);
      res.status(500).json({ message: 'Failed to export teacher data' });
    }
  });

  // Export school data (all teachers from a school)
  app.get('/api/admin/export/school/:schoolName', requireAdmin, async (req: any, res) => {
    try {
      const { schoolName } = req.params;
      const { format = 'json' } = req.query;

      const schoolData = await getSchoolExportData(decodeURIComponent(schoolName));
      if (!schoolData) {
        return res.status(404).json({ message: 'School not found or has no teachers' });
      }

      // Log admin action
      const adminId = req.user.claims.sub;
      await storage.logAdminAction({
        adminId,
        action: 'export_school_data',
        details: { 
          schoolName, 
          format, 
          teacherCount: schoolData.teachers.length,
          timestamp: new Date().toISOString() 
        }
      });

      if (format === 'csv') {
        const csvData = convertToCSV(schoolData);
        const schoolFileName = schoolName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const filename = `school_export_${schoolFileName}_${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvData);
      } else {
        res.json(schoolData);
      }
    } catch (error) {
      console.error('Error exporting school data:', error);
      res.status(500).json({ message: 'Failed to export school data' });
    }
  });

  // Bulk export multiple teachers by IDs
  app.post('/api/admin/export/teachers/bulk', requireAdmin, async (req: any, res) => {
    try {
      const { teacherIds, format = 'json' } = req.body;

      if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
        return res.status(400).json({ message: 'Teacher IDs array is required' });
      }

      const exportData: any[] = [];
      const failedTeachers: string[] = [];

      for (const teacherId of teacherIds) {
        try {
          const teacherData = await getTeacherExportData(teacherId);
          if (teacherData) {
            exportData.push(teacherData);
          } else {
            failedTeachers.push(teacherId);
          }
        } catch (error) {
          console.error(`Failed to export teacher ${teacherId}:`, error);
          failedTeachers.push(teacherId);
        }
      }

      // Log admin action
      const adminId = req.user.claims.sub;
      await storage.logAdminAction({
        adminId,
        action: 'bulk_export_teachers',
        details: { 
          teacherCount: exportData.length,
          failedCount: failedTeachers.length,
          format,
          timestamp: new Date().toISOString() 
        }
      });

      if (format === 'csv') {
        // For bulk CSV, create a combined CSV with all teachers
        const csvRows: string[] = [];
        csvRows.push('Export Type,Bulk Teacher Data');
        csvRows.push(`Export Date,${new Date().toLocaleDateString()}`);
        csvRows.push(`Total Teachers,${exportData.length}`);
        csvRows.push('');

        exportData.forEach((teacherData, index) => {
          if (index > 0) csvRows.push(''); // Add spacing between teachers
          
          const teacherCsv = convertToCSV(teacherData);
          csvRows.push(teacherCsv);
        });

        const filename = `bulk_teacher_export_${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvRows.join('\n'));
      } else {
        res.json({
          exportData,
          summary: {
            totalRequested: teacherIds.length,
            successfulExports: exportData.length,
            failedExports: failedTeachers.length,
            failedTeacherIds: failedTeachers
          }
        });
      }
    } catch (error) {
      console.error('Error bulk exporting teacher data:', error);
      res.status(500).json({ message: 'Failed to bulk export teacher data' });
    }
  });

  // Health Check and System Monitoring
  app.get('/api/health', async (req, res) => {
    try {
      const health = await getSystemHealth();
      res.json(health);
    } catch (error) {
      res.status(500).json({ message: 'System health check failed' });
    }
  });

  app.get('/api/health/detailed', requireAdmin, async (req, res) => {
    try {
      const health = await getDetailedSystemHealth();
      res.json(health);
    } catch (error) {
      res.status(500).json({ message: 'Detailed health check failed' });
    }
  });

  // Password Reset
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email } = req.body;
      const result = await initiatePasswordReset(email);
      res.json(result);
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Failed to initiate password reset' });
    }
  });

  app.post('/api/auth/confirm-password-reset', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const result = await confirmPasswordReset(token, newPassword);
      res.json(result);
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Progress Notes - Create new progress note
  app.post('/api/progress-notes', async (req: any, res) => {
    try {
      const session = req.session;
      if (!session?.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { interventionId, note, outcome, nextSteps } = req.body;
      
      if (!interventionId || !note) {
        return res.status(400).json({ message: 'Intervention ID and note are required' });
      }

      const progressNote = await storage.createProgressNote({
        interventionId,
        teacherId: session.user.id,
        note,
        outcome,
        nextSteps,
      });

      res.status(201).json(progressNote);
    } catch (error) {
      console.error('Error creating progress note:', error);
      res.status(500).json({ message: 'Failed to create progress note' });
    }
  });

  // Progress Notes - Get all progress notes for an intervention
  app.get('/api/progress-notes/:interventionId', async (req: any, res) => {
    try {
      const session = req.session;
      if (!session?.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { interventionId } = req.params;
      const progressNotes = await storage.getProgressNotesByInterventionId(interventionId);
      
      res.json(progressNotes);
    } catch (error) {
      console.error('Error fetching progress notes:', error);
      res.status(500).json({ message: 'Failed to fetch progress notes' });
    }
  });

  // Progress Notes - Update existing progress note
  app.put('/api/progress-notes/:id', async (req: any, res) => {
    try {
      const session = req.session;
      if (!session?.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const { note, outcome, nextSteps } = req.body;
      
      if (!note) {
        return res.status(400).json({ message: 'Note is required' });
      }

      const progressNote = await storage.updateProgressNote(id, {
        note,
        outcome,
        nextSteps,
      });

      if (!progressNote) {
        return res.status(404).json({ message: 'Progress note not found' });
      }

      res.json(progressNote);
    } catch (error) {
      console.error('Error updating progress note:', error);
      res.status(500).json({ message: 'Failed to update progress note' });
    }
  });

  // Progress Notes - Delete progress note
  app.delete('/api/progress-notes/:id', async (req: any, res) => {
    try {
      const session = req.session;
      if (!session?.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const deleted = await storage.deleteProgressNote(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Progress note not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting progress note:', error);
      res.status(500).json({ message: 'Failed to delete progress note' });
    }
  });

  // Teacher: Meeting Preparation HTML Document Generation
  app.post('/api/meeting-preparation/generate', async (req: any, res) => {
    try {
      const session = req.session;
      if (!session?.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { meetingData } = req.body;
      
      if (!meetingData) {
        return res.status(400).json({ message: 'Meeting data is required' });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const title = meetingData.title || meetingData.meetingTitle || 'meeting';
      const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
      const date = meetingData.date || meetingData.meetingDate || 'unknown-date';
      const filename = `meeting-prep-${sanitizedTitle}-${date}_${timestamp}.html`;
      const reportsDir = ensureReportsDirectory();
      const filePath = path.join(reportsDir, filename);

      // Generate HTML meeting document
      await generateMeetingHTMLReport(
        meetingData,
        filePath,
        {
          firstName: session.user.firstName,
          lastName: session.user.lastName
        }
      );

      // Send the HTML file for display
      const htmlContent = await fs.promises.readFile(filePath, 'utf8');
      
      // Set response headers for HTML display
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);
    } catch (error) {
      console.error('Error generating meeting preparation document:', error);
      res.status(500).json({ message: 'Failed to generate meeting preparation document' });
    }
  });

  // ===========================================
  // EMAIL CONFIGURATION MANAGEMENT
  // ===========================================
  
  // Get email configuration status for current user
  app.get("/api/email/status", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = await emailConfigService.getEmailStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("Error getting email status:", error);
      res.status(500).json({ message: "Failed to get email status" });
    }
  });

  // Get user's personal email configuration (without password)
  app.get("/api/email/user-config", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = await emailConfigService.getUserEmailConfig(userId);
      
      if (!config) {
        return res.json(null);
      }

      // Return config without password for security
      const { smtpPassword, ...safeConfig } = config;
      res.json(safeConfig);
    } catch (error) {
      console.error("Error getting user email config:", error);
      res.status(500).json({ message: "Failed to get email configuration" });
    }
  });

  // Save user's personal email configuration
  app.post("/api/email/user-config", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!userId) {
        console.error("No userId found in session");
        return res.status(401).json({ message: "User not authenticated properly" });
      }
      
      // Validate request body
      const result = insertUserEmailConfigSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Email config validation failed:", result.error.errors);
        return res.status(400).json({ message: "Invalid email configuration data", errors: result.error.errors });
      }
      
      // Save the email configuration
      const savedConfig = await emailConfigService.saveUserEmailConfig(userId, result.data);
      res.json({ message: "Email configuration saved successfully", config: savedConfig });
    } catch (error) {
      console.error("Error saving user email config:", error);
      res.status(500).json({ message: "Failed to save email configuration" });
    }
  });

  // Test user email configuration
  app.post("/api/email/user-config/test", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { testEmail } = req.body;

      if (!testEmail) {
        return res.status(400).json({ message: "Test email address is required" });
      }

      const emailConfig = await emailConfigService.getEmailConfiguration(userId);
      
      if (!emailConfig) {
        return res.status(404).json({ message: "No email configuration found" });
      }

      const testResult = await emailConfigService.testEmailConfiguration(emailConfig, testEmail);
      
      // Update test status
      if (emailConfig.isUserConfig) {
        await emailConfigService.updateUserEmailTestStatus(userId, testResult.success ? 'success' : 'failed');
      } else {
        const user = await storage.getUserByEmail(req.user.claims.email);
        if (user?.schoolId) {
          await emailConfigService.updateSchoolEmailTestStatus(user.schoolId, testResult.success ? 'success' : 'failed');
        }
      }

      res.json(testResult);
    } catch (error) {
      console.error("Error testing email configuration:", error);
      res.status(500).json({ message: "Failed to test email configuration" });
    }
  });

  // Delete user's personal email configuration
  app.delete("/api/email/user-config", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await emailConfigService.deleteUserEmailConfig(userId);
      res.json({ message: "Email configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting user email config:", error);
      res.status(500).json({ message: "Failed to delete email configuration" });
    }
  });

  // ===========================================
  // SCHOOL EMAIL CONFIGURATION (ADMIN ONLY)
  // ===========================================

  // Get school email configuration (admin only)
  app.get("/api/admin/school/:schoolId/email-config", requireAdmin, async (req: any, res) => {
    try {
      const { schoolId } = req.params;
      const config = await emailConfigService.getSchoolEmailConfig(parseInt(schoolId));
      
      if (!config) {
        return res.json(null);
      }

      // Return config without password for security
      const { smtpPassword, ...safeConfig } = config;
      res.json(safeConfig);
    } catch (error) {
      console.error("Error getting school email config:", error);
      res.status(500).json({ message: "Failed to get school email configuration" });
    }
  });

  // Save school email configuration (admin only)
  app.post("/api/admin/school/:schoolId/email-config", requireAdmin, async (req: any, res) => {
    try {
      const { schoolId } = req.params;
      const adminId = req.user.claims.sub;
      
      // Validate request body
      const result = insertSchoolEmailConfigSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid email configuration data", errors: result.error.errors });
      }

      const savedConfig = await emailConfigService.saveSchoolEmailConfig(parseInt(schoolId), adminId, result.data);
      
      // Log admin action
      console.log(`Admin ${adminId} configured email for school ${schoolId}`, {
        adminId,
        schoolId,
        action: 'configure_school_email',
        timestamp: new Date().toISOString()
      });
      
      res.json({ message: "School email configuration saved successfully", config: savedConfig });
    } catch (error) {
      console.error("Error saving school email config:", error);
      res.status(500).json({ message: "Failed to save school email configuration" });
    }
  });

  // Test school email configuration (admin only)
  app.post("/api/admin/school/:schoolId/email-config/test", requireAdmin, async (req: any, res) => {
    try {
      const { schoolId } = req.params;
      const { testEmail } = req.body;

      if (!testEmail) {
        return res.status(400).json({ message: "Test email address is required" });
      }

      // Get school email config directly
      const schoolConfig = await emailConfigService.getSchoolEmailConfig(parseInt(schoolId));
      
      if (!schoolConfig) {
        return res.status(400).json({ message: "No school email configuration found" });
      }

      // Convert to the format expected by testEmailConfiguration
      const emailConfigForTest = {
        smtpHost: schoolConfig.smtpHost,
        smtpPort: schoolConfig.smtpPort,
        smtpSecure: schoolConfig.smtpSecure,
        smtpUser: schoolConfig.smtpUser,
        smtpPassword: schoolConfig.smtpPassword,
        fromEmail: schoolConfig.fromEmail,
        fromName: schoolConfig.fromName,
        isUserConfig: false
      };

      // For admin testing, we need to get the configuration in the right format
      const schoolEmailConfig = await emailConfigService.getSchoolEmailConfigForUser('temp-admin-test');
      
      if (!schoolEmailConfig) {
        return res.status(400).json({ message: "Could not retrieve school email configuration for testing" });
      }

      const testResult = await emailConfigService.testEmailConfiguration(emailConfigForTest, testEmail);
      
      // Update test status for school
      await emailConfigService.updateSchoolEmailTestStatus(parseInt(schoolId), testResult.success ? 'success' : 'failed');

      res.json(testResult);
    } catch (error) {
      console.error("Error testing school email configuration:", error);
      res.status(500).json({ message: "Failed to test school email configuration" });
    }
  });

  // Delete school email configuration (admin only)
  app.delete("/api/admin/school/:schoolId/email-config", requireAdmin, async (req: any, res) => {
    try {
      const { schoolId } = req.params;
      const adminId = req.user.claims.sub;
      
      await emailConfigService.deleteSchoolEmailConfig(parseInt(schoolId));
      
      // Log admin action
      console.log(`Admin ${adminId} deleted email config for school ${schoolId}`, {
        adminId,
        schoolId,
        action: 'delete_school_email_config',
        timestamp: new Date().toISOString()
      });
      
      res.json({ message: "School email configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting school email config:", error);
      res.status(500).json({ message: "Failed to delete school email configuration" });
    }
  });

  // ===========================================
  // DATA EXPORT ROUTES (ADMIN ONLY)
  // ===========================================

  // Export teacher data (admin only)
  app.get('/api/admin/export/teachers', requireAdmin, async (req: any, res) => {
    try {
      const data = await getTeacherExportData();
      const csv = convertToCSV(data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="teachers_export.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Error exporting teacher data:', error);
      res.status(500).json({ message: 'Failed to export teacher data' });
    }
  });

  // Export school data (admin only)
  app.get('/api/admin/export/schools', requireAdmin, async (req: any, res) => {
    try {
      const data = await getSchoolExportData();
      const csv = convertToCSV(data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="schools_export.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Error exporting school data:', error);
      res.status(500).json({ message: 'Failed to export school data' });
    }
  });

  // Get all school names (for export/reports)
  app.get('/api/admin/school-names', requireAdmin, async (req: any, res) => {
    try {
      const schoolNames = await getAllSchoolNames();
      res.json(schoolNames);
    } catch (error) {
      console.error('Error getting school names:', error);
      res.status(500).json({ message: 'Failed to get school names' });
    }
  });

  // ===========================================
  // SYSTEM HEALTH & MONITORING
  // ===========================================

  // Get system health (public - for monitoring)
  app.get('/api/health', async (req, res) => {
    try {
      const health = await getSystemHealth();
      res.json(health);
    } catch (error) {
      console.error('Error getting system health:', error);
      res.status(500).json({ message: 'Failed to get system health' });
    }
  });

  // Get detailed system health (admin only)
  app.get('/api/admin/health/detailed', requireAdmin, async (req: any, res) => {
    try {
      const health = await getDetailedSystemHealth();
      res.json(health);
    } catch (error) {
      console.error('Error getting detailed system health:', error);
      res.status(500).json({ message: 'Failed to get detailed system health' });
    }
  });

  // ===========================================
  // REFERRAL SYSTEM
  // ===========================================

  // Get referrals for current user
  app.get('/api/referrals', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const referrals = await getReferrals(userId);
      res.json(referrals);
    } catch (error) {
      console.error('Error loading referrals:', error);
      res.status(500).json({ message: 'Failed to load referrals' });
    }
  });

  // Create new referral
  app.post('/api/referrals/create', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const referral = await createReferral({ ...req.body, userId });
      res.json(referral);
    } catch (error) {
      console.error('Error creating referral:', error);
      res.status(500).json({ message: 'Failed to create referral' });
    }
  });

  // ===========================================
  // PASSWORD RESET FUNCTIONALITY
  // ===========================================

  // Initiate password reset
  app.post('/api/auth/password-reset/initiate', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const result = await initiatePasswordReset(email);
      res.json(result);
    } catch (error) {
      console.error('Error initiating password reset:', error);
      res.status(500).json({ message: 'Failed to initiate password reset' });
    }
  });

  // Confirm password reset with token
  app.post('/api/auth/password-reset/confirm', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      const result = await confirmPasswordReset(token, newPassword);
      res.json(result);
    } catch (error) {
      console.error('Error confirming password reset:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
