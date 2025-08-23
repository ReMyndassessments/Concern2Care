if (!process.env.DEEPSEEK_API_KEY) {
  console.warn("DEEPSEEK_API_KEY environment variable not set. AI functionality will be limited.");
}

// DeepSeek API client
const deepseekClient = process.env.DEEPSEEK_API_KEY ? {
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1'
} : null;

export interface GenerateRecommendationsRequest {
  studentFirstName: string;
  studentLastInitial: string;
  grade: string;
  teacherPosition: string;
  incidentDate: string;
  location: string;
  concernTypes: string[];
  otherConcernType?: string;
  concernDescription: string;
  severityLevel: string;
  actionsTaken: string[];
  otherActionTaken?: string;
  
  // Student differentiation fields
  hasIep?: boolean;
  hasDisability?: boolean;
  disabilityType?: string;
  isEalLearner?: boolean;
  ealProficiency?: string;
  isGifted?: boolean;
  isStruggling?: boolean;
  otherNeeds?: string;
  
  // File uploads for enhanced recommendations
  studentAssessmentFile?: string;
  lessonPlanFile?: string;
}

export interface GenerateRecommendationsResponse {
  recommendations: string;
  disclaimer: string;
}

export interface InterventionStrategy {
  title: string;
  description: string;
  steps: string[];
  timeline: string;
}

export async function generateRecommendations(
  req: GenerateRecommendationsRequest
): Promise<GenerateRecommendationsResponse> {
  console.log("🚀 Starting recommendation generation...");
  console.log("🔑 DeepSeek client exists:", !!deepseekClient);
  console.log("📝 Student:", req.studentFirstName, req.studentLastInitial);
  console.log("📝 Concern types:", req.concernTypes);
  
  if (!deepseekClient) {
    console.log("DeepSeek API key not set, returning mock data.");
    let mockRecommendations = generateMockRecommendations(req);
    
    // Add urgent case message for mock data too
    if (req.severityLevel === 'urgent') {
      mockRecommendations += `\n\n### **🚨 URGENT CASE - IMMEDIATE ACTION REQUIRED**

**Share this case with Student Support immediately:**
* Forward this concern and intervention plan to your school's student support team
* Schedule urgent consultation with counselor, social worker, or special education coordinator  
* Document all interventions and student responses for the support team
* Consider immediate safety protocols if student welfare is at risk
* Escalate to administration if no improvement within 48-72 hours

**Contact your school's student support department today to ensure this student receives comprehensive, coordinated care.**`;
    }
    
    const disclaimer = "⚠️ IMPORTANT DISCLAIMER: These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation. (API key not set, returning mock data)";
    return { recommendations: mockRecommendations, disclaimer };
  }
  const concernTypesText = req.concernTypes.length > 0 
    ? req.concernTypes.join(', ') + (req.otherConcernType ? `, ${req.otherConcernType}` : '')
    : 'Not specified';
  
  const actionsTakenText = req.actionsTaken.length > 0 
    ? req.actionsTaken.join(', ') + (req.otherActionTaken ? `, ${req.otherActionTaken}` : '')
    : 'None documented';

  // Build differentiation context for better AI recommendations
  console.log("🎯 AI Service received differentiation data:", {
    hasIep: req.hasIep,
    hasDisability: req.hasDisability,
    disabilityType: req.disabilityType,
    isEalLearner: req.isEalLearner,
    ealProficiency: req.ealProficiency,
    isGifted: req.isGifted,
    isStruggling: req.isStruggling,
    otherNeeds: req.otherNeeds,
  });

  const differentiationInfo = [];
  if (req.hasIep) differentiationInfo.push('Has IEP (Individualized Education Program)');
  if (req.hasDisability && req.disabilityType) differentiationInfo.push(`Diagnosed with: ${req.disabilityType}`);
  if (req.isEalLearner && req.ealProficiency) differentiationInfo.push(`EAL Learner (${req.ealProficiency} English proficiency)`);
  if (req.isGifted) differentiationInfo.push('Identified as gifted/talented');
  if (req.isStruggling) differentiationInfo.push('Currently struggling academically');
  if (req.otherNeeds) differentiationInfo.push(`Additional needs: ${req.otherNeeds}`);
  
  const differentiationText = differentiationInfo.length > 0 
    ? differentiationInfo.join('; ')
    : 'No specific learning needs documented';
    
  console.log("📝 Final differentiation text for AI:", differentiationText);

  // Read uploaded file contents for enhanced recommendations
  let assessmentContent = "";
  let lessonPlanContent = "";
  
  if (req.studentAssessmentFile) {
    try {
      const { ObjectStorageService } = await import("../objectStorage");
      const objectStorageService = new ObjectStorageService();
      assessmentContent = await objectStorageService.readFileContent(req.studentAssessmentFile);
      console.log("📄 Read student assessment file content:", assessmentContent.substring(0, 200) + "...");
    } catch (error) {
      console.error("Error reading assessment file:", error);
    }
  }
  
  if (req.lessonPlanFile) {
    try {
      const { ObjectStorageService } = await import("../objectStorage");
      const objectStorageService = new ObjectStorageService();
      lessonPlanContent = await objectStorageService.readFileContent(req.lessonPlanFile);
      console.log("📚 Read lesson plan file content:", lessonPlanContent.substring(0, 200) + "...");
    } catch (error) {
      console.error("Error reading lesson plan file:", error);
    }
  }

  const prompt = `You are an educational specialist AI assistant helping teachers with Tier 2 intervention recommendations for students who may need 504/IEP accommodations.

Student Information:
- Name: ${req.studentFirstName} ${req.studentLastInitial}.
- Grade: ${req.grade}
- Teacher: ${req.teacherPosition}
- Incident Date: ${req.incidentDate}
- Location: ${req.location}
- Type of Concern: ${concernTypesText}
- Severity Level: ${req.severityLevel}
- Actions Already Taken: ${actionsTakenText}
- Student Learning Profile: ${differentiationText}
- Detailed Description: ${req.concernDescription}${assessmentContent ? `\n- Student Assessment Data: ${assessmentContent}` : ''}${lessonPlanContent ? `\n- Lesson Plan to Differentiate: ${lessonPlanContent}` : ''}

Based on the concern type(s) identified (${concernTypesText}), severity level (${req.severityLevel}), and the student's learning profile (${differentiationText}), please provide specific, actionable Tier 2 intervention recommendations that a teacher could implement in the classroom. 

IMPORTANT: If the student has specific learning needs (IEP, diagnosis, EAL status, gifted, struggling, etc.), ensure ALL recommendations are differentiated to address these needs. For example:
- If student has ADHD: Include movement breaks, visual cues, chunked instructions
- If student is an EAL learner: Include visual supports, peer partnerships, modified language
- If student is gifted: Include extension activities, higher-order thinking, independent projects
- If student has anxiety: Include predictable routines, choice options, calming strategies

${assessmentContent ? 'IMPORTANT: Use the student assessment data provided to create targeted interventions based on their specific strengths, weaknesses, and documented needs.' : ''}

${lessonPlanContent ? 'IMPORTANT: If a lesson plan was provided, suggest specific adaptations and modifications to make the lesson accessible and challenging for this student. Include concrete examples of how to differentiate content, process, product, and learning environment.' : ''}

Focus on evidence-based strategies that specifically address both the concern AND the student's learning profile.

Format your response using this EXACT markdown structure for proper display:

### **1. Assessment Summary**
Brief analysis of the student's needs based on the concern type and severity

### **2. Immediate Interventions (1-2 weeks)**
* **Strategy: [Strategy Name]**
* **Implementation:**
  * Step 1
  * Step 2
  * Step 3

### **3. Short-term Strategies (2-6 weeks)**
* **Strategy: [Strategy Name]**
* **Implementation:**
  * Step 1
  * Step 2
  * Step 3

### **4. Long-term Support (6+ weeks)**
* **Strategy: [Strategy Name]**
* **Implementation:**
  * Step 1
  * Step 2

### **5. Progress Monitoring**
* **Data Collection:**
  * Method 1
  * Method 2
* **Review Timeline:** Weekly/Bi-weekly

### **6. When to Escalate**
* **Indicators:**
  * Clear sign 1
  * Clear sign 2

Use this EXACT formatting with ### for main headings, * ** for strategy names, and bullet points for implementation steps.`;

  try {
    console.log(`🌐 Making DeepSeek API call to: ${deepseekClient.baseURL}/chat/completions`);
    console.log(`🔑 Using API key: ${deepseekClient.apiKey.substring(0, 10)}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${deepseekClient.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekClient.apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an educational specialist AI assistant helping teachers with Tier 2 intervention recommendations for students who may need 504/IEP accommodations. Provide practical, evidence-based classroom strategies in a professional, well-structured format with clear headings and implementation details. Tailor recommendations based on the specific concern types and severity level provided."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log(`✅ DeepSeek API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DeepSeek API error: ${response.status} - ${errorText}`);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    let recommendations = data.choices[0]?.message?.content || 'Unable to generate recommendations at this time.';

    // Automatically add student support sharing message for urgent cases
    console.log('🚨 Checking severity level:', req.severityLevel, 'Type:', typeof req.severityLevel);
    if (req.severityLevel === 'urgent') {
      console.log('🚨 URGENT DETECTED! Adding urgent case message...');
      recommendations += `\n\n### **🚨 URGENT CASE - IMMEDIATE ACTION REQUIRED**

**Share this case with Student Support immediately:**
* Forward this concern and intervention plan to your school's student support team
* Schedule urgent consultation with counselor, social worker, or special education coordinator  
* Document all interventions and student responses for the support team
* Consider immediate safety protocols if student welfare is at risk
* Escalate to administration if no improvement within 48-72 hours

**Contact your school's student support department today to ensure this student receives comprehensive, coordinated care.**`;
      console.log('🚨 Urgent message appended. Final recommendations length:', recommendations.length);
    } else {
      console.log('🚨 Severity is not urgent, no special message added');
    }

    const disclaimer = "⚠️ IMPORTANT DISCLAIMER: These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation.";

    return {
      recommendations,
      disclaimer
    };
  } catch (error) {
    console.error('❌ Error calling DeepSeek API:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        console.log('🚫 Authentication error - Invalid API key');
        // Fall back to mock data instead of throwing error
        let mockRecommendations = generateMockRecommendations(req);
        
        // Add urgent case message for mock data too
        if (req.severityLevel === 'urgent') {
          mockRecommendations += `\n\n### **🚨 URGENT CASE - IMMEDIATE ACTION REQUIRED**

**Share this case with Student Support immediately:**
* Forward this concern and intervention plan to your school's student support team
* Schedule urgent consultation with counselor, social worker, or special education coordinator  
* Document all interventions and student responses for the support team
* Consider immediate safety protocols if student welfare is at risk
* Escalate to administration if no improvement within 48-72 hours

**Contact your school's student support department today to ensure this student receives comprehensive, coordinated care.**`;
        }
        
        const disclaimer = "⚠️ IMPORTANT DISCLAIMER: These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation. (DeepSeek API authentication failed, returning mock data)";
        return { recommendations: mockRecommendations, disclaimer };
      }
      if (error.name === 'AbortError') {
        console.log('⏰ API request timed out after 30 seconds');
      }
    }
    
    console.log('🔄 API call failed, falling back to mock data');
    let mockRecommendations = generateMockRecommendations(req);
    
    // Add urgent case message for mock data too
    if (req.severityLevel === 'urgent') {
      mockRecommendations += `\n\n### **🚨 URGENT CASE - IMMEDIATE ACTION REQUIRED**

**Share this case with Student Support immediately:**
* Forward this concern and intervention plan to your school's student support team
* Schedule urgent consultation with counselor, social worker, or special education coordinator  
* Document all interventions and student responses for the support team
* Consider immediate safety protocols if student welfare is at risk
* Escalate to administration if no improvement within 48-72 hours

**Contact your school's student support department today to ensure this student receives comprehensive, coordinated care.**`;
    }
    
    const disclaimer = "⚠️ IMPORTANT DISCLAIMER: These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation. (DeepSeek API unavailable, returning mock data)";
    return { recommendations: mockRecommendations, disclaimer };
  }
}

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

export async function followUpAssistance(
  req: FollowUpAssistanceRequest
): Promise<FollowUpAssistanceResponse> {
  if (!deepseekClient) {
    console.log("DeepSeek API key not set, returning mock data.");
    const mockAssistance = generateMockFollowUpAssistance(req);
    const disclaimer = "⚠️ IMPORTANT DISCLAIMER: This AI-generated assistance is for informational purposes only and should not replace professional educational consultation. Please work with your school's student support department, special education team, or educational specialists for comprehensive guidance. All suggestions should be reviewed and approved by qualified educational professionals before implementation. (API key not set, returning mock data)";
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
    console.log('🤝 Making DeepSeek API call for follow-up assistance');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${deepseekClient.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekClient.apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an educational specialist AI assistant providing follow-up assistance for implementing Tier 2 interventions. Provide practical, detailed guidance that helps teachers successfully implement interventions in their classrooms. Focus on actionable steps, troubleshooting, and realistic implementation strategies."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DeepSeek API error: ${response.status} - ${errorText}`);
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
    console.error('❌ Error calling DeepSeek API for follow-up assistance:', error);
    
    console.log('🔄 Follow-up assistance API failed, falling back to mock data');
    const mockAssistance = generateMockFollowUpAssistance(req);
    const disclaimer = "⚠️ IMPORTANT DISCLAIMER: This AI-generated assistance is for informational purposes only and should not replace professional educational consultation. Please work with your school's student support department, special education team, or educational specialists for comprehensive guidance. All suggestions should be reviewed and approved by qualified educational professionals before implementation. (DeepSeek API unavailable, returning mock data)";
    return { assistance: mockAssistance, disclaimer };
  }
}

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

// Legacy function for backward compatibility
export async function generateInterventions(
  concernType: string,
  description: string,
  studentInfo: string
): Promise<InterventionStrategy[]> {
  // Convert to new format
  const req: GenerateRecommendationsRequest = {
    studentFirstName: "Student",
    studentLastInitial: "S",
    grade: "Elementary",
    teacherPosition: "Teacher",
    incidentDate: new Date().toISOString().split('T')[0],
    location: "Classroom",
    concernTypes: [concernType],
    concernDescription: `${description}. Student: ${studentInfo}`,
    severityLevel: "moderate",
    actionsTaken: [],
  };

  const response = await generateRecommendations(req);
  
  // Parse the structured response into legacy format
  const interventions: InterventionStrategy[] = [
    {
      title: "Structured Support Plan",
      description: response.recommendations,
      steps: ["Review recommendations", "Implement strategies", "Monitor progress"],
      timeline: "2-6 weeks"
    }
  ];
  
  return interventions;
}

// Legacy function for backward compatibility  
export async function answerFollowUpQuestion(
  question: string,
  concernContext: string,
  interventions: InterventionStrategy[]
): Promise<string> {
  const req: FollowUpAssistanceRequest = {
    originalRecommendations: interventions.map(i => i.description).join('\n'),
    specificQuestion: question,
    studentFirstName: "Student",
    studentLastInitial: "S",
    grade: "Elementary",
    concernTypes: ["General"],
    severityLevel: "moderate"
  };
  
  const response = await followUpAssistance(req);
  return response.assistance;
}
