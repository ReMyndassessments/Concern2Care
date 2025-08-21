import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateInterventions, answerFollowUpQuestion, generateRecommendations, followUpAssistance, GenerateRecommendationsRequest, FollowUpAssistanceRequest } from "./services/openai";
import { generateConcernReport, ensureReportsDirectory } from "./services/pdf";
import { sendReportEmail, generateSecureReportLink } from "./services/email";
import { insertConcernSchema, insertFollowUpQuestionSchema } from "@shared/schema";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware disabled for demo

  // Auth routes - simplified for demo
  app.get('/api/auth/user', async (req: any, res) => {
    // Return demo user for simplified testing
    res.json({
      id: "demo-teacher-123",
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "Teacher",
      supportRequestsUsed: 0,
      supportRequestsLimit: 20
    });
  });

  // Create a new concern and generate recommendations
  app.post("/api/concerns", async (req: any, res) => {
    console.log("🔍 POST /api/concerns - Request received");
    console.log("🔍 User authenticated:", !!req.user);
    console.log("🔍 User ID:", req.user?.claims?.sub);
    try {
      // Skip user checks for demo - use a demo teacher ID
      const userId = "demo-teacher-123";

      // Validate request body with enhanced schema
      const validatedData = insertConcernSchema.parse({
        ...req.body,
        teacherId: userId,
      });

      // Create concern
      const concern = await storage.createConcern(validatedData);

      // Generate AI recommendations using the enhanced format
      const recommendationRequest: GenerateRecommendationsRequest = {
        studentFirstName: concern.studentFirstName,
        studentLastInitial: concern.studentLastInitial,
        grade: concern.grade || "Elementary",
        teacherPosition: concern.teacherPosition || "Teacher",
        incidentDate: concern.incidentDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        location: concern.location || "Classroom",
        concernTypes: Array.isArray(concern.concernTypes) ? concern.concernTypes : [concern.concernType || "Academic"],
        otherConcernType: concern.otherConcernType,
        concernDescription: concern.description,
        severityLevel: concern.severityLevel || "moderate",
        actionsTaken: Array.isArray(concern.actionsTaken) ? concern.actionsTaken : [],
        otherActionTaken: concern.otherActionTaken,
      };

      const recommendationResponse = await generateRecommendations(recommendationRequest);

      // Save the AI response as a single intervention record for now
      const savedInterventions = await storage.createInterventions([{
        concernId: concern.id,
        title: "AI-Generated Tier 2 Recommendations",
        description: recommendationResponse.recommendations,
        steps: ["Review Assessment Summary", "Implement Immediate Interventions", "Apply Short-term Strategies", "Monitor Progress"],
        timeline: "2-6 weeks",
      }]);

      // Skip user count update for demo

      res.json({
        concern,
        interventions: savedInterventions,
        recommendations: recommendationResponse.recommendations,
        disclaimer: recommendationResponse.disclaimer,
      });
    } catch (error) {
      console.error("Error creating concern:", error);
      res.status(500).json({ message: "Failed to create concern and generate recommendations" });
    }
  });

  // Get concerns for the current teacher
  app.get("/api/concerns", async (req: any, res) => {
    try {
      const userId = "demo-teacher-123";
      const concerns = await storage.getConcernsByTeacher(userId);
      res.json(concerns);
    } catch (error) {
      console.error("Error fetching concerns:", error);
      res.status(500).json({ message: "Failed to fetch concerns" });
    }
  });

  // Get a specific concern with all details  
  app.get("/api/concerns/:id", async (req: any, res) => {
    try {
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

  // Ask a follow-up question using enhanced AI assistance
  app.post("/api/concerns/:id/questions", async (req: any, res) => {
    try {
      const userId = "demo-teacher-123"; // Use demo user for now
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

  // Generate PDF report
  app.post("/api/concerns/:id/report", async (req: any, res) => {
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

  // Download PDF report
  app.get("/api/reports/:id/download", async (req: any, res) => {
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

  // Share report via email
  app.post("/api/concerns/:id/share", async (req: any, res) => {
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
