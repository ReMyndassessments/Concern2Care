import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { secret } from "encore.dev/config";
import log from "encore.dev/log";

const adminDeepSeekApiKey = secret("AdminDeepSeekAPIKey");

export interface GenerateRecommendationsRequest {
  studentFirstName: string;
  studentLastInitial: string;
  grade: string;
  teacher: string;
  teacherPosition: string;
  incidentDate: string;
  location: string;
  concernTypes: string[];
  otherConcernType?: string;
  concernDescription: string;
  severityLevel: string;
  actionsTaken: string[];
  otherActionTaken?: string;
}

export interface GenerateRecommendationsResponse {
  recommendations: string;
  disclaimer: string;
}

// Generates Tier 2 intervention recommendations based on student information and concerns.
export const generateRecommendations = api<GenerateRecommendationsRequest, GenerateRecommendationsResponse>(
  { expose: true, method: "POST", path: "/ai/recommendations", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    const apiKey = adminDeepSeekApiKey();
    if (!apiKey) {
      log.info("AdminDeepSeekAPIKey not set, returning mock data.");
      const mockRecommendations = generateMockRecommendations(req);
      const disclaimer = "⚠️ IMPORTANT DISCLAIMER: These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation. (Admin API key not set, returning mock data)";
      return { recommendations: mockRecommendations, disclaimer };
    }

    const concernTypesText = req.concernTypes.length > 0 
      ? req.concernTypes.join(', ') + (req.otherConcernType ? `, ${req.otherConcernType}` : '')
      : 'Not specified';
    
    const actionsTakenText = req.actionsTaken.length > 0 
      ? req.actionsTaken.join(', ') + (req.otherActionTaken ? `, ${req.otherActionTaken}` : '')
      : 'None documented';

    const prompt = `You are an educational specialist AI assistant helping teachers with Tier 2 intervention recommendations for students who may need 504/IEP accommodations.

Student Information:
- Name: ${req.studentFirstName} ${req.studentLastInitial}.
- Grade: ${req.grade}
- Teacher: ${req.teacher} (${req.teacherPosition})
- Incident Date: ${req.incidentDate}
- Location: ${req.location}
- Type of Concern: ${concernTypesText}
- Severity Level: ${req.severityLevel}
- Actions Already Taken: ${actionsTakenText}
- Detailed Description: ${req.concernDescription}

Based on the concern type(s) identified (${concernTypesText}) and severity level (${req.severityLevel}), please provide specific, actionable Tier 2 intervention recommendations that a teacher could implement in the classroom. Focus on evidence-based strategies that address the described concerns.

Format your response as follows:
1. **Assessment Summary** - Brief analysis of the student's needs based on the concern type and severity
2. **Immediate Interventions** (1-2 weeks) - Quick strategies to implement right away
3. **Short-term Strategies** (2-6 weeks) - More comprehensive interventions
4. **Long-term Support** (6+ weeks) - Sustained support strategies
5. **Progress Monitoring** - How to track effectiveness
6. **When to Escalate** - Clear indicators for referring to student support team

For each strategy, include:
- Strategy name/title
- Clear implementation steps
- Expected outcomes
- Timeline for implementation
- Materials/resources needed

Use professional educational terminology and ensure recommendations are practical and classroom-friendly. Structure your response with clear headings and bullet points for easy reading.`;

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an educational specialist AI assistant helping teachers with Tier 2 intervention recommendations for students who may need 504/IEP accommodations. Provide practical, evidence-based classroom strategies in a professional, well-structured format with clear headings and implementation details. Tailor recommendations based on the specific concern types and severity level provided.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        log.error(`DeepSeek API error: ${response.status} - ${errorText}`);
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const recommendations = data.choices[0]?.message?.content || 'Unable to generate recommendations at this time.';

      const disclaimer = "⚠️ IMPORTANT DISCLAIMER: These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation.";

      return {
        recommendations,
        disclaimer
      };
    } catch (error) {
      log.error('Error calling DeepSeek API:', { error });
      
      if (error instanceof Error && error.message.includes('401')) {
        throw APIError.invalidArgument("Invalid DeepSeek API key. Please contact your administrator.");
      }
      
      throw APIError.internal('Unable to generate recommendations at this time due to a technical error. Please try again later or contact your student support department directly.');
    }
  }
);

function generateMockRecommendations(req: GenerateRecommendationsRequest): string {
  const concernTypes = req.concernTypes.join(', ');
  
  return `# Assessment Summary

Based on the ${req.severityLevel} level concerns related to ${concernTypes} for ${req.studentFirstName} ${req.studentLastInitial}. (Grade ${req.grade}), the following Tier 2 interventions are recommended to address the observed challenges in ${req.location}.

## Immediate Interventions (1-2 weeks)

**1. Structured Check-In System**
- Implementation: Daily 2-minute check-ins at the beginning of class
- Expected outcomes: Improved communication and early identification of issues
- Timeline: Start immediately, continue for 2 weeks minimum
- Materials needed: Simple check-in form or digital tool

**2. Clear Expectations and Visual Supports**
- Implementation: Create visual schedule and behavior expectations chart
- Expected outcomes: Increased understanding of classroom routines
- Timeline: Implement within 3 days
- Materials needed: Poster board, markers, laminator

## Short-term Strategies (2-6 weeks)

**3. Targeted Skill Building**
- Implementation: 15-minute focused sessions 3x per week
- Expected outcomes: Improvement in specific skill areas
- Timeline: 4-6 week intervention cycle
- Materials needed: Skill-specific worksheets and manipulatives

**4. Peer Support System**
- Implementation: Pair student with trained peer mentor
- Expected outcomes: Improved social skills and academic support
- Timeline: 4 weeks with weekly check-ins
- Materials needed: Peer mentor training materials

## Long-term Support (6+ weeks)

**5. Comprehensive Behavior Plan**
- Implementation: Develop individualized behavior intervention plan
- Expected outcomes: Sustained positive behavior changes
- Timeline: Ongoing with monthly reviews
- Materials needed: Data collection sheets, reward system

**6. Family Collaboration**
- Implementation: Regular communication with family about strategies
- Expected outcomes: Consistent support across environments
- Timeline: Ongoing partnership
- Materials needed: Communication log, home-school collaboration forms

## Progress Monitoring

- Weekly data collection on target behaviors/skills
- Bi-weekly review of intervention effectiveness
- Monthly team meetings to assess progress
- Use of standardized assessment tools as appropriate

## When to Escalate

Consider referring to the student support team if:
- No improvement after 4-6 weeks of consistent intervention
- Behaviors escalate in frequency or intensity
- Student expresses safety concerns
- Additional assessment needs are identified
- Family requests formal evaluation

**Note:** This is a demonstration of AI-generated recommendations. In a real implementation, these would be more detailed and specifically tailored to the exact concerns described.`;
}
