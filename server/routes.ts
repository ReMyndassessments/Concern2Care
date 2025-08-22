import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateInterventions, answerFollowUpQuestion, generateRecommendations, followUpAssistance, GenerateRecommendationsRequest, FollowUpAssistanceRequest } from "./services/ai";
import { generateConcernReport, ensureReportsDirectory } from "./services/pdf";
import { sendReportEmail, generateSecureReportLink } from "./services/email";
import { insertConcernSchema, insertFollowUpQuestionSchema, users } from "@shared/schema";
import { db } from "./db";
import { concerns } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import path from "path";
import fs from "fs";
import session from "express-session";
import multer from "multer";
import * as bcrypt from "bcrypt";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";

// Import all advanced services
import { 
  processBulkCSVUpload, 
  generateDemoData, 
  getTeachersWithDetails, 
  bulkUpdateTeachers, 
  bulkDeleteTeachers 
} from "./services/admin";
import { getDashboardAnalytics, getUsageStatistics } from "./services/analytics";
import { generateAIRecommendations, generateFollowUpAssistance } from "./services/deepseek-ai";
import { getReferrals, createReferral } from "./services/referrals";
import { getSystemHealth, getDetailedSystemHealth, trackRequest } from "./services/health";
import { initiatePasswordReset, confirmPasswordReset } from "./services/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable sessions for professional authentication
  app.use(session({
    secret: 'concern2care-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Professional teacher authentication - no development modals
  
  // Teacher login endpoint
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // For demo purposes - in production this would validate against school's user database
      // Simulate teacher login validation
      const demoTeachers = [
        { 
          id: "admin-001", 
          email: "admin@school.edu",
          firstName: "Admin", 
          lastName: "User",
          school: "School District Admin",
          isAdmin: true
        },
        { 
          id: "teacher-001", 
          email: "noel.roberts@school.edu",
          firstName: "Noel", 
          lastName: "Roberts",
          school: "Demo Elementary School",
          isAdmin: false
        },
        { 
          id: "teacher-002", 
          email: "demo@teacher.com",
          firstName: "Demo", 
          lastName: "Teacher",
          school: "Sample Middle School",
          isAdmin: false
        }
      ];

      const teacher = demoTeachers.find(t => 
        t.email.toLowerCase() === email.toLowerCase() && 
        password === "teacher123"
      );

      if (!teacher) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Ensure user exists in database
      try {
        await storage.upsertUser({
          id: teacher.id,
          email: teacher.email,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          profileImageUrl: null,
          isAdmin: teacher.isAdmin || false,
        });
        console.log("🔍 User created/updated in database:", teacher.id);
      } catch (dbError) {
        console.error("Error creating user in database:", dbError);
      }

      // Create session (simplified)
      req.session.user = teacher;
      req.session.isAuthenticated = true;

      res.json({ 
        success: true, 
        user: teacher,
        message: "Login successful"
      });
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
    if (req.session.isAuthenticated && req.session.user) {
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
      };

      const recommendationResponse = await generateRecommendations(recommendationRequest);

      // Save the AI response as a single intervention record for now
      const savedInterventions = await storage.createInterventions([{
        concernId: newConcern.id,
        title: "AI-Generated Tier 2 Recommendations",
        description: recommendationResponse.recommendations,
        steps: ["Review Assessment Summary", "Implement Immediate Interventions", "Apply Short-term Strategies", "Monitor Progress"],
        timeline: "2-6 weeks",
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

  // Generate AI recommendations directly (for testing)
  app.post("/api/concerns/generate-recommendations", async (req: any, res) => {
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
      const { question } = req.body;

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

  // Generate PDF report - PROTECTED
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
      const filename = `concern-${concernId}-${Date.now()}.pdf`;
      const filePath = path.join(reportsDir, filename);

      // Generate PDF
      await generateConcernReport(concern, concern.interventions, filePath);

      // Create report record
      const report = await storage.createReport({
        concernId,
        pdfPath: filePath,
      });

      res.json({
        reportId: report.id,
        downloadUrl: `/api/reports/${report.id}/download`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Download PDF report - PROTECTED
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

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="concern-report.pdf"');
      
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
        // Generate PDF if it doesn't exist
        const reportsDir = ensureReportsDirectory();
        const filename = `concern-${concernId}-${Date.now()}.pdf`;
        const filePath = path.join(reportsDir, filename);

        await generateConcernReport(concern, concern.interventions, filePath);
        
        report = await storage.createReport({
          concernId,
          pdfPath: filePath,
          sharedWith: recipients.map((r: any) => r.email),
        });
      }

      // Send email
      const baseUrl = req.protocol + '://' + req.get('host');
      const reportLink = generateSecureReportLink(report.id, baseUrl);
      
      const emailSuccess = await sendReportEmail({
        recipients,
        subject: `Student Concern Report - ${concern.studentFirstName} ${concern.studentLastInitial}.`,
        message,
        attachmentPath: report.pdfPath || undefined,
        reportLink,
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
  app.get("/api/admin/dashboard-stats", requireAuth, async (req: any, res) => {
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
  
  // Delete school
  app.delete("/api/admin/schools/:id", requireAuth, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      
      // Get school name before deletion for logging
      const school = await storage.getSchoolById(req.params.id);
      const schoolName = school?.name || 'Unknown';
      
      await storage.deleteSchool(req.params.id);
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: 'delete_school',
        details: { schoolName }
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
  
  // Delete user
  app.delete("/api/admin/users/:id", requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      
      // Get user email before deletion for logging
      const user = await storage.getUser(req.params.id);
      const userEmail = user?.email || 'Unknown';
      
      await storage.deleteUser(req.params.id);
      
      // Log admin action
      await storage.logAdminAction({
        adminId,
        action: 'delete_user',
        details: { userEmail }
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
      const { csvData, filename } = req.body;
      
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

  // Enhanced AI Services with DeepSeek
  app.post('/api/ai/recommendations', requireAuth, async (req: any, res) => {
    try {
      const result = await generateAIRecommendations(req.body);
      res.json(result);
    } catch (error) {
      console.error('AI recommendations error:', error);
      res.status(500).json({ message: 'Failed to generate recommendations' });
    }
  });

  app.post('/api/ai/follow-up-assistance', requireAuth, async (req: any, res) => {
    try {
      const result = await generateFollowUpAssistance(req.body);
      res.json(result);
    } catch (error) {
      console.error('Follow-up assistance error:', error);
      res.status(500).json({ message: 'Failed to generate follow-up assistance' });
    }
  });

  // Analytics Dashboard Data
  app.get('/api/analytics/dashboard', requireAdmin, async (req: any, res) => {
    try {
      const analytics = await getDashboardAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: 'Failed to load analytics' });
    }
  });

  app.get('/api/analytics/usage-stats', requireAdmin, async (req: any, res) => {
    try {
      const stats = await getUsageStatistics();
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
      const teachers = await getTeachersWithDetails();
      res.json({ teachers });
    } catch (error) {
      console.error('Teachers fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch teachers' });
    }
  });

  // Admin: Create a new teacher
  app.post('/api/admin/teachers', requireAdmin, async (req: any, res) => {
    try {
      const { firstName, lastName, email, password, school, supportRequestsLimit, isActive } = req.body;
      
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
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the teacher
      const teacherData = {
        id: `teacher-${Date.now()}`,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        school: school || '',
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

  // Teacher: Meeting Preparation PDF Generation
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

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Uint8Array[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="meeting-prep-${meetingData.meetingDate}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        res.send(pdfBuffer);
      });

      // Header
      doc.fontSize(20).font('Helvetica-Bold');
      doc.text('MEETING PREPARATION DOCUMENT', { align: 'center' });
      doc.moveDown(2);

      // Meeting Details
      doc.fontSize(16).font('Helvetica-Bold');
      doc.text('Meeting Information', { underline: true });
      doc.moveDown();
      
      doc.fontSize(12).font('Helvetica');
      doc.text(`Title: ${meetingData.meetingTitle}`);
      doc.text(`Type: ${meetingData.meetingType}`);
      doc.text(`Date: ${meetingData.meetingDate}`);
      doc.text(`Time: ${meetingData.meetingTime}`);
      doc.moveDown();

      // Attendees
      if (meetingData.attendees && meetingData.attendees.length > 0) {
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text('Attendees:', { underline: true });
        doc.moveDown();
        
        doc.fontSize(12).font('Helvetica');
        meetingData.attendees.forEach((attendee: string) => {
          doc.text(`• ${attendee}`);
        });
        doc.moveDown(2);
      }

      // Agenda
      if (meetingData.agenda) {
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text('Meeting Agenda:', { underline: true });
        doc.moveDown();
        
        doc.fontSize(12).font('Helvetica');
        doc.text(meetingData.agenda, { align: 'left', width: 500 });
        doc.moveDown(2);
      }

      // Selected Concerns (if any)
      if (meetingData.selectedConcerns && meetingData.selectedConcerns.length > 0) {
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text('Student Concerns to Discuss:', { underline: true });
        doc.moveDown();
        
        // Get concern details (this would need to be passed from frontend or fetched)
        doc.fontSize(12).font('Helvetica');
        doc.text(`Number of concerns selected: ${meetingData.selectedConcerns.length}`);
        doc.text('(Detailed concern information would be included here based on your documented concerns)');
        doc.moveDown(2);
      }

      // Additional Notes
      if (meetingData.notes) {
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text('Additional Notes:', { underline: true });
        doc.moveDown();
        
        doc.fontSize(12).font('Helvetica');
        doc.text(meetingData.notes, { align: 'left', width: 500 });
        doc.moveDown(2);
      }

      // Document Options
      if (meetingData.includeRecommendations || meetingData.includeProgressNotes) {
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text('Document Includes:', { underline: true });
        doc.moveDown();
        
        doc.fontSize(12).font('Helvetica');
        if (meetingData.includeRecommendations) {
          doc.text('✓ Intervention recommendations');
        }
        if (meetingData.includeProgressNotes) {
          doc.text('✓ Progress notes section');
        }
        doc.moveDown(2);
      }

      // Footer
      doc.fontSize(10).font('Helvetica');
      doc.text(`Document generated on: ${new Date().toLocaleDateString()}`, {
        align: 'center'
      });
      doc.text(`Prepared by: ${session.user.firstName} ${session.user.lastName}`, {
        align: 'center'
      });

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error('Error generating meeting preparation PDF:', error);
      res.status(500).json({ message: 'Failed to generate meeting preparation document' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
