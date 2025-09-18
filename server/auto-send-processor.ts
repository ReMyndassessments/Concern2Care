import { storage } from './storage';
import { sendReportEmail } from './services/email';
import { generateUniversalDisclaimer } from './services/ai';

export class AutoSendProcessor {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private readonly INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.start();
  }

  start(): void {
    if (this.intervalId) return;
    
    console.log('🤖 Auto-send processor starting...');
    
    // Process immediately on start
    this.processReadySubmissions();
    
    // Then process every 5 minutes
    this.intervalId = setInterval(() => {
      this.processReadySubmissions();
    }, this.INTERVAL_MS);
  }

  // Manual trigger for immediate processing (for admin force sends)
  async triggerImmediateProcessing(): Promise<{ processed: number; errors: string[] }> {
    console.log('⚡ Manual trigger: Processing submissions immediately...');
    
    if (this.isProcessing) {
      return { processed: 0, errors: ['Processor is already running'] };
    }
    
    const errors: string[] = [];
    let processed = 0;
    
    try {
      this.isProcessing = true;
      const readySubmissions = await storage.getSubmissionsReadyForAutoSend();
      
      console.log(`⚡ Found ${readySubmissions.length} submissions for immediate processing`);
      
      for (const submission of readySubmissions) {
        try {
          await this.processSubmission(submission);
          processed++;
        } catch (error) {
          console.error(`❌ Failed to immediately process submission ${submission.id}:`, error);
          errors.push(`Submission ${submission.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      console.log(`⚡ Immediate processing complete: ${processed} processed, ${errors.length} errors`);
      
    } catch (error) {
      console.error('❌ Immediate processing error:', error);
      errors.push(`General error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isProcessing = false;
    }
    
    return { processed, errors };
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Auto-send processor stopped');
    }
  }

  private async processReadySubmissions(): Promise<void> {
    if (this.isProcessing) {
      console.log('⏳ Auto-send processor already running, skipping...');
      return;
    }

    try {
      this.isProcessing = true;
      console.log('🔄 Processing submissions ready for auto-send...');

      const readySubmissions = await storage.getSubmissionsReadyForAutoSend();
      
      if (readySubmissions.length === 0) {
        console.log('✅ No submissions ready for auto-send');
        return;
      }

      console.log(`📨 Found ${readySubmissions.length} submissions ready for auto-send`);

      for (const submission of readySubmissions) {
        try {
          await this.processSubmission(submission);
        } catch (error) {
          console.error(`❌ Failed to process submission ${submission.id}:`, error);
          
          // For critical errors, we might want to retry later or flag for manual review
          await storage.updateClassroomSubmission(submission.id, { 
            status: 'pending',
            autoSendTime: new Date(Date.now() + 30 * 60 * 1000) // Retry in 30 minutes
          });
        }
      }

    } catch (error) {
      console.error('❌ Auto-send processor error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processSubmission(submission: any): Promise<void> {
    console.log(`📧 Processing submission ${submission.id} for auto-send...`);

    // Claim the submission atomically to prevent double-processing
    try {
      const claimedSubmission = await storage.claimSubmissionForSending(submission.id);
      if (!claimedSubmission) {
        console.log(`⏩ Submission ${submission.id} already claimed or no longer eligible, skipping`);
        return;
      }
      // Use the fresh claimed submission data
      submission = claimedSubmission;
    } catch (error) {
      console.error(`❌ Failed to claim submission ${submission.id}:`, error);
      return;
    }

    // Validate required data after claiming
    if (!submission.aiDraft) {
      console.error(`❌ Submission ${submission.id} missing AI draft, reverting claim`);
      await storage.revertSubmissionClaim(submission.id);
      return;
    }

    if (!submission.teacher || !submission.teacher.email || !submission.teacher.firstName) {
      console.error(`❌ Submission ${submission.id} missing required teacher data, reverting claim`);
      await storage.revertSubmissionClaim(submission.id);
      await storage.setSubmissionAutoSendTime(submission.id, new Date(Date.now() + 30 * 60 * 1000));
      return;
    }

    // Prepare final message with universal disclaimer system
    const universalDisclaimer = generateUniversalDisclaimer(submission.severityLevel as 'mild' | 'moderate' | 'urgent');
    
    const finalMessage = submission.aiDraft + universalDisclaimer;

    // Send email to teacher
    try {
      const emailSuccess = await sendReportEmail({
        recipients: [{ 
          email: submission.teacher.email, 
          name: submission.teacher.firstName + ' ' + submission.teacher.lastName,
          role: 'teacher'
        }],
        subject: `Classroom Solutions: ${submission.taskType === 'differentiation' ? 'Differentiation Strategies' : 'Tier 2 Intervention'} - ${submission.severityLevel} Priority`,
        message: `Dear ${submission.teacher.firstName},\n\nYour AI-generated classroom solution is ready:\n\n${finalMessage}\n\nThank you for using Concern2Care.`,
        userId: submission.teacher.id || submission.teacherId // Use proper user ID for email config lookup
      });

      if (emailSuccess) {
        // Mark as successfully sent
        await storage.markSubmissionAsSent(submission.id, finalMessage);
        console.log(`✅ Successfully sent submission ${submission.id} to ${submission.teacher.email}`);
      } else {
        console.error(`❌ Failed to send email for submission ${submission.id}`);
        // Revert claim and schedule retry to prevent permanent stalling
        await storage.revertSubmissionClaim(submission.id);
        // Schedule retry with exponential backoff (30 minutes initially)
        await storage.setSubmissionAutoSendTime(submission.id, new Date(Date.now() + 30 * 60 * 1000));
        throw new Error('Email sending failed - submission reverted for retry');
      }

    } catch (error) {
      console.error(`❌ Email sending failed for submission ${submission.id}:`, error);
      // Revert the claim so it can be retried later
      await storage.revertSubmissionClaim(submission.id);
      throw error; // Re-throw to trigger retry logic
    }
  }
}

// Export singleton instance
export const autoSendProcessor = new AutoSendProcessor();

// Graceful shutdown
process.on('SIGINT', () => {
  autoSendProcessor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  autoSendProcessor.stop();
  process.exit(0);
});