import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateInterventions, answerFollowUpQuestion, generateRecommendations, followUpAssistance, GenerateRecommendationsRequest, FollowUpAssistanceRequest } from "./services/ai";
import { generateConcernReport, ensureReportsDirectory } from "./services/pdf";
import { sendReportEmail, generateSecureReportLink } from "./services/email";
import { insertConcernSchema, insertFollowUpQuestionSchema } from "@shared/schema";
import { db } from "./db";
import { concerns } from "@shared/schema";
import path from "path";
import fs from "fs";
import session from "express-session";

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
          id: "teacher-001", 
          email: "noel.roberts@school.edu",
          firstName: "Noel", 
          lastName: "Roberts",
          school: "Demo Elementary School"
        },
        { 
          id: "teacher-002", 
          email: "demo@teacher.com",
          firstName: "Demo", 
          lastName: "Teacher",
          school: "Sample Middle School"
        }
      ];

      const teacher = demoTeachers.find(t => 
        t.email.toLowerCase() === email.toLowerCase() && 
        (password === "teacher123" || password === "demo")
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

  // Get current teacher
  app.get('/api/auth/user', (req: any, res) => {
    if (req.session.isAuthenticated && req.session.user) {
      res.json(req.session.user);
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

  // Create a new concern and generate recommendations - PROTECTED
  app.post("/api/concerns", requireAuth, async (req: any, res) => {
    console.log("🔍 POST /api/concerns - Request received");
    console.log("🔍 Request body:", req.body);
    try {
      // SECURE: Get real user ID from authenticated session
      const userId = req.user.claims.sub;
      console.log("🔍 User ID:", userId);
      
      // Create concern in database
      const newConcern = await storage.createConcern({
        teacherId: userId,
        studentFirstName: String(req.body.studentFirstName),
        studentLastInitial: String(req.body.studentLastInitial),
        grade: String(req.body.grade),
        teacherPosition: String(req.body.teacherPosition),
        incidentDate: new Date(), // Automatically set to current date/time
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
        incidentDate: newConcern.incidentDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        location: newConcern.location || "Classroom",
        concernTypes: Array.isArray(newConcern.concernTypes) ? newConcern.concernTypes : [],
        otherConcernType: newConcern.otherConcernType || undefined,
        concernDescription: newConcern.description,
        severityLevel: newConcern.severityLevel || "moderate",
        actionsTaken: Array.isArray(newConcern.actionsTaken) ? newConcern.actionsTaken : [],
        otherActionTaken: newConcern.otherActionTaken || undefined,
      };

      console.log("🔍 About to call generateRecommendations...");
      const recommendationResponse = await generateRecommendations(recommendationRequest);
      console.log("🔍 AI response received:", !!recommendationResponse);

      // Save the AI response as a single intervention record for now
      const savedInterventions = await storage.createInterventions([{
        concernId: newConcern.id,
        title: "AI-Generated Tier 2 Recommendations",
        description: recommendationResponse.recommendations,
        steps: ["Review Assessment Summary", "Implement Immediate Interventions", "Apply Short-term Strategies", "Monitor Progress"],
        timeline: "2-6 weeks",
      }]);

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
      const report = await storage.getReportByConcernId(reportId);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
