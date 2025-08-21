import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { secret } from "encore.dev/config";
import log from "encore.dev/log";

const adminDeepSeekApiKey = secret("AdminDeepSeekAPIKey");

export interface FollowUpAssistanceRequest {
  originalRecommendations: string;
  specificQuestion: string;
  studentFirstName: string;
  studentLastInitial: string;
  grade: string;
  concernTypes: string[];
  severityLevel: string;
}

export interface FollowUpAssistanceResponse {
  assistance: string;
  disclaimer: string;
}

// Provides follow-up assistance for implementing Tier 2 interventions.
export const followUpAssistance = api<FollowUpAssistanceRequest, FollowUpAssistanceResponse>(
  { expose: true, method: "POST", path: "/ai/follow-up-assistance", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    const apiKey = adminDeepSeekApiKey();
    if (!apiKey) {
      log.info("AdminDeepSeekAPIKey not set, returning mock data.");
      const mockAssistance = generateMockFollowUpAssistance(req);
      const disclaimer = "⚠️ IMPORTANT DISCLAIMER: This AI-generated assistance is for informational purposes only and should not replace professional educational consultation. Please work with your school's student support department, special education team, or educational specialists for comprehensive guidance. All suggestions should be reviewed and approved by qualified educational professionals before implementation. (Admin API key not set, returning mock data)";
      return { assistance: mockAssistance, disclaimer };
    }

    const concernTypesText = req.concernTypes.length > 0 
      ? req.concernTypes.join(', ')
      : 'Not specified';

    const prompt = `You are an educational specialist AI assistant providing follow-up assistance for implementing Tier 2 interventions for students who may need 504/IEP accommodations.

Context:
- Student: ${req.studentFirstName} ${req.studentLastInitial}.
- Grade: ${req.grade}
- Concern Types: ${concernTypesText}
- Severity Level: ${req.severityLevel}

Original AI-Generated Recommendations:
${req.originalRecommendations}

Teacher's Specific Question/Request for Additional Assistance:
${req.specificQuestion}

Please provide detailed, practical guidance to help the teacher implement the interventions effectively. Your response should:

1. **Direct Answer** - Address the specific question or concern raised
2. **Implementation Steps** - Provide clear, step-by-step guidance
3. **Practical Tips** - Include classroom management strategies and best practices
4. **Resources Needed** - Specify any materials, tools, or support required
5. **Timeline Considerations** - Suggest realistic timeframes for implementation
6. **Troubleshooting** - Anticipate potential challenges and provide solutions
7. **Progress Monitoring** - Explain how to track effectiveness and make adjustments
8. **When to Seek Additional Support** - Clear indicators for escalating to specialists

Focus on actionable advice that a classroom teacher can realistically implement. Use professional educational terminology while keeping explanations clear and practical. Structure your response with clear headings and bullet points for easy reading.`;

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
              content: 'You are an educational specialist AI assistant providing follow-up assistance for implementing Tier 2 interventions. Provide practical, detailed guidance that helps teachers successfully implement interventions in their classrooms. Focus on actionable steps, troubleshooting, and realistic implementation strategies.'
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
      const assistance = data.choices[0]?.message?.content || 'Unable to generate follow-up assistance at this time.';

      const disclaimer = "⚠️ IMPORTANT DISCLAIMER: This AI-generated assistance is for informational purposes only and should not replace professional educational consultation. Please work with your school's student support department, special education team, or educational specialists for comprehensive guidance. All suggestions should be reviewed and approved by qualified educational professionals before implementation.";

      return {
        assistance,
        disclaimer
      };
    } catch (error) {
      log.error('Error calling DeepSeek API for follow-up assistance:', { error });
      
      if (error instanceof Error && error.message.includes('401')) {
        throw APIError.invalidArgument("Invalid DeepSeek API key. Please contact your administrator.");
      }
      
      throw APIError.internal('Unable to generate follow-up assistance at this time due to a technical error. Please try again later or contact your student support department directly for implementation guidance.');
    }
  }
);

function generateMockFollowUpAssistance(req: FollowUpAssistanceRequest): string {
  return `## Direct Answer

Thank you for your question: "${req.specificQuestion}"

Based on your specific implementation question and the original recommendations for ${req.studentFirstName} ${req.studentLastInitial}., here's detailed guidance to help you move forward effectively.

## Implementation Steps

**Step 1: Preparation (Days 1-2)**
- Gather necessary materials and resources
- Set up physical space if needed
- Prepare any visual aids or tools
- Brief any support staff involved

**Step 2: Introduction (Days 3-5)**
- Introduce the intervention to the student
- Explain expectations clearly
- Model the desired behavior or skill
- Practice together initially

**Step 3: Implementation (Week 2+)**
- Begin consistent daily implementation
- Monitor student response closely
- Adjust approach based on student needs
- Document progress regularly

## Practical Tips

- **Start Small**: Begin with shorter sessions and gradually increase
- **Be Consistent**: Same time, same approach daily
- **Stay Positive**: Focus on effort and improvement, not perfection
- **Involve the Student**: Ask for their input and feedback
- **Communicate**: Keep parents and support team informed

## Resources Needed

- Timer for structured activities
- Data collection sheet or app
- Visual supports (charts, pictures)
- Reinforcement items or activities
- Communication log for home-school connection

## Timeline Considerations

- **Week 1**: Setup and introduction
- **Weeks 2-4**: Full implementation with daily monitoring
- **Week 4**: Mid-point review and adjustments
- **Weeks 5-6**: Continue with any modifications
- **Week 6**: Comprehensive review and next steps

## Troubleshooting

**If the student resists:**
- Check if expectations are too high
- Increase reinforcement frequency
- Involve student in goal-setting

**If no progress is seen:**
- Review implementation fidelity
- Consider environmental factors
- Consult with support team

**If behaviors worsen:**
- Ensure safety first
- Document incidents
- Seek immediate support team consultation

## Progress Monitoring

- Daily: Quick check on target behavior/skill
- Weekly: Review data trends and patterns
- Bi-weekly: Assess overall effectiveness
- Monthly: Comprehensive review with team

**Data to Collect:**
- Frequency of target behavior
- Duration of interventions
- Student engagement level
- Academic performance indicators

## When to Seek Additional Support

Contact your student support team if:
- No improvement after 3-4 weeks of consistent implementation
- Student safety concerns arise
- Behaviors escalate beyond classroom management
- You need additional resources or training
- Family has concerns or questions

**Note:** This is demonstration assistance. In a real implementation, the guidance would be more specifically tailored to your exact question and situation.`;
}
