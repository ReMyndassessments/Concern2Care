// Get API client from environment variables or database-managed keys
async function getApiClient() {
  console.log("🔍 Getting API client...");
  
  // First, check environment variable (primary method)
  const envApiKey = process.env.DEEPSEEK_API_KEY;
  console.log("🔍 Environment API key exists:", !!envApiKey);
  
  if (envApiKey) {
    console.log("🔑 Using environment-managed DeepSeek API key");
    return {
      apiKey: envApiKey,
      baseURL: 'https://api.deepseek.com/v1'
    };
  }
  
  // Fallback to database-managed keys
  try {
    console.log("🔍 Trying database fallback...");
    const { getActiveApiKey } = await import('./admin');
    const activeDeepSeekKey = await getActiveApiKey('deepseek');
    
    if (activeDeepSeekKey) {
      console.log("🔑 Using database-managed DeepSeek API key:", activeDeepSeekKey.name);
      return {
        apiKey: activeDeepSeekKey.apiKey,
        baseURL: 'https://api.deepseek.com/v1'
      };
    }
  } catch (error) {
    console.error("❌ Error accessing database API keys:", error instanceof Error ? error.message : String(error));
  }
  
  console.warn("❌ No DeepSeek API key found in environment or database.");
  return null;
}

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
  
  // Content for enhanced recommendations
  studentAssessmentFile?: string;
  lessonPlanContent?: string;
  
  // Task type for focused AI responses
  taskType?: string;
  
  // Language preference for AI-generated content
  language?: string;
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

// Sanitize text to prevent database encoding errors
function sanitizeForDatabase(text: string): string {
  if (!text) return text;
  
  // Remove null bytes and other problematic characters
  return text
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \t, \n, \r
    .replace(/\uFFFD/g, '') // Remove replacement characters
    .trim();
}

export async function generateRecommendations(
  req: GenerateRecommendationsRequest
): Promise<GenerateRecommendationsResponse> {
  console.log("🚀 Starting recommendation generation...");
  console.log("📝 Student:", req.studentFirstName, req.studentLastInitial);
  console.log("📝 Concern types:", req.concernTypes);
  
  // Debug environment variable access
  console.log("🔍 Environment Debug:");
  console.log("  - DEEPSEEK_API_KEY exists:", !!process.env.DEEPSEEK_API_KEY);
  console.log("  - DEEPSEEK_API_KEY length:", process.env.DEEPSEEK_API_KEY?.length || 0);
  console.log("  - First 10 chars:", process.env.DEEPSEEK_API_KEY?.substring(0, 10) || 'none');
  
  const apiClient = await getApiClient();
  console.log("🔑 API client available:", !!apiClient);
  
  // Read uploaded file contents for enhanced recommendations
  let assessmentContent = "";
  let lessonPlanContent = "";
  
  if (req.studentAssessmentFile) {
    try {
      const { ObjectStorageService } = await import("../objectStorage");
      const objectStorageService = new ObjectStorageService();
      const rawContent = await objectStorageService.readFileContent(req.studentAssessmentFile);
      
      // Truncate content to fit within AI token limits (approximately 50,000 characters = ~12,500 tokens)
      // This leaves room for the rest of the prompt and response
      assessmentContent = rawContent.substring(0, 50000);
      
      if (rawContent.length > 50000) {
        assessmentContent += "\n\n[Document truncated due to length - showing first 50,000 characters]";
        console.log(`📄 Truncated assessment file: ${rawContent.length} chars → ${assessmentContent.length} chars`);
      } else {
        console.log("📄 Read student assessment file content:", assessmentContent.substring(0, 200) + "...");
      }
    } catch (error) {
      console.error("Error reading assessment file:", error);
    }
  }
  
  if (req.lessonPlanContent) {
    // Use text content directly - truncate if needed for AI token limits
    const rawContent = req.lessonPlanContent;
    lessonPlanContent = rawContent.substring(0, 25000);
    
    if (rawContent.length > 25000) {
      lessonPlanContent += "\n\n[Content truncated due to length - showing first 25,000 characters]";
      console.log(`📚 Truncated lesson plan: ${rawContent.length} chars → ${lessonPlanContent.length} chars`);
    } else {
      console.log("📚 Using lesson plan content:", lessonPlanContent.substring(0, 200) + "...");
    }
  }

  if (!apiClient) {
    console.log("No active API key found in database, returning enhanced mock data with file content.");
    let mockRecommendations = generateMockRecommendations(req, assessmentContent, lessonPlanContent);
    
    // Sanitize mock data too
    mockRecommendations = sanitizeForDatabase(mockRecommendations);
    
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
    
    const disclaimer = "⚠️ IMPORTANT DISCLAIMER: These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation. (No API key configured in admin interface, returning mock data)";
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

  // Generate different prompts based on task type
  const isDifferentiationTask = req.taskType === 'differentiation';
  console.log("🎯 Task type:", req.taskType, "- Is differentiation task:", isDifferentiationTask);
  
  const filePrompts = [];
  if (assessmentContent) {
    filePrompts.push(`- Student Assessment Data: ${assessmentContent}`);
  }
  if (lessonPlanContent) {
    filePrompts.push(`- Lesson Plan to Differentiate: ${lessonPlanContent}`);
  }
  
  let prompt;
  
  if (isDifferentiationTask) {
    if (lessonPlanContent) {
      prompt = `You are an educational differentiation specialist AI assistant. Your primary task is to take the uploaded lesson plan and create a differentiated version specifically adapted for this student's learning needs.

**Student Information:**
- Name: ${req.studentFirstName} ${req.studentLastInitial}
- Grade: ${req.grade}
- Teacher: ${req.teacherPosition}
- Location: ${req.location}

**Student Learning Profile:**
${differentiationInfo.join('\n')}

**ORIGINAL LESSON PLAN TO DIFFERENTIATE:**
${lessonPlanContent}

**YOUR TASK:** Create a differentiated version of the above lesson plan specifically adapted for ${req.studentFirstName}'s learning needs. Provide a complete, ready-to-use lesson plan that includes:

1. **Differentiated Learning Objectives:**
   - Modified or tiered objectives that match the student's ability level
   - Clear, measurable goals appropriate for their needs

2. **Adapted Content Delivery:**
   - Modified explanation methods
   - Visual supports and graphic organizers
   - Chunked information presentation
   - Alternative vocabulary or simplified language

3. **Differentiated Activities:**
   - Step-by-step modified activities from the original lesson
   - Alternative ways to engage with the content
   - Scaffolded practice opportunities
   - Choice options for different learning preferences

4. **Modified Assessment Methods:**
   - Alternative ways for the student to demonstrate understanding
   - Adapted rubrics or success criteria
   - Formative assessment strategies during the lesson

5. **Specific Accommodations:**
   - Environmental modifications needed
   - Technology tools or supports
   - Time adjustments
   - Material adaptations

6. **Implementation Notes:**
   - Specific instructions for the teacher
   - What to prepare in advance
   - Timing considerations

**Format:** Provide a complete, restructured lesson plan that the teacher can use immediately. Include specific examples, actual materials, and concrete directions. This should be a differentiated version of the original lesson, not general strategies.`;
    } else {
      prompt = `You are a leading educational specialist with advanced expertise in differentiated instruction, Universal Design for Learning (UDL), and evidence-based teaching practices. Drawing from current research in cognitive science, special education, and instructional design, provide detailed, immediately implementable differentiation strategies with specific learning objectives, assessment criteria, and research citations where applicable.

**Student Information:**
- Name: ${req.studentFirstName} ${req.studentLastInitial}
- Grade: ${req.grade}
- Teacher: ${req.teacherPosition}
- Location: ${req.location}

**Student Learning Profile:**
${differentiationInfo.join('\n')}

**CRITICAL REQUIREMENTS:**
- All strategies must be evidence-based and cite relevant educational research
- Provide specific, concrete examples with step-by-step implementation
- Include materials lists and preparation requirements
- Address multiple learning modalities (visual, auditory, kinesthetic, tactile)
- Consider Universal Design for Learning (UDL) principles
- Differentiate for this student's specific needs, not generic accommodations

**Required Output Structure:**

## **Student Learning Profile Summary**
Provide a comprehensive analysis of ${req.studentFirstName}'s learning strengths, challenges, and optimal learning conditions based on the profile provided.

## **1. Content Modifications**
### **Adjusting Complexity**
- Specific techniques for scaffolding content (include 3-5 concrete examples)
- Grade-appropriate modifications while maintaining rigor
- Multi-level materials and resources

### **Multiple Representations** 
- Visual supports (graphic organizers, concept maps, infographics)
- Auditory options (recordings, verbal explanations, music integration)
- Kinesthetic activities (hands-on manipulatives, movement-based learning)

### **Interest-Based Adaptations**
- Ways to connect content to student interests and cultural background
- Choice menus for topics and project themes

## **2. Process Modifications**
### **Instructional Delivery**
- Specific teaching strategies matched to learning style
- Pacing adjustments and chunking methods
- Collaborative vs. independent work balance

### **Scaffolding Techniques**
- Step-by-step process breakdowns
- Think-aloud strategies
- Peer support systems and buddy partnerships

### **Technology Integration**
- Assistive technology recommendations
- Digital tools and apps specific to learning needs
- Accessibility features and settings

## **3. Product Alternatives**
### **Assessment Options**
- Multiple ways to demonstrate mastery (portfolios, presentations, projects)
- Alternative assessment formats
- Modified rubrics with clear success criteria

### **Expression Methods**
- Written, oral, visual, and digital product options
- Creative alternatives to traditional assignments

## **4. Learning Environment Optimization**
### **Physical Space**
- Seating arrangements and workspace modifications
- Sensory considerations (lighting, noise, textures)
- Organization systems and visual supports

### **Social Environment**
- Grouping strategies for optimal learning
- Peer interaction structures
- Communication supports

## **5. Implementation Timeline**

### **Week 1-2: Immediate Strategies**
- Quick wins and essential accommodations
- Initial data collection methods

### **Weeks 3-6: Short-term Adaptations** 
- Skill-building interventions
- Progress monitoring systems

### **Ongoing: Long-term Support**
- Sustainable classroom modifications
- Transition planning for future grades

## **6. Progress Monitoring & Data Collection**
- Specific metrics to track improvement
- Data collection tools and schedules
- When and how to adjust strategies

## **7. Collaboration & Communication**
- Parent/family engagement strategies
- Coordination with support staff
- Documentation requirements

**Format Requirements:**
- Use bullet points for easy scanning
- Include specific examples for each strategy
- Provide implementation timelines
- List required materials and resources
- Make all recommendations immediately actionable for classroom use`;
    }
  } else {
    prompt =
    `You are a highly trained educational intervention specialist and instructional coach with 15+ years of classroom experience, expertise in evidence-based practices, special education law, Universal Design for Learning (UDL), and research-backed classroom strategies. You provide comprehensive, detailed, actionable Tier 2 interventions based on current educational research and best practices from leading institutions.

**CRITICAL ANALYSIS REQUIRED**: You MUST provide detailed analysis and evidence-based solutions that go beyond surface-level recommendations. Teachers need specific, practical strategies they can implement immediately.

## Student Profile Analysis:
- **Name**: ${req.studentFirstName} ${req.studentLastInitial}
- **Grade Level**: ${req.grade}
- **Teacher**: ${req.teacherPosition}
- **Incident Date**: ${req.incidentDate}
- **Location**: ${req.location}
- **Primary Concerns**: ${concernTypesText}
- **Severity Level**: ${req.severityLevel}
- **Previous Interventions**: ${actionsTakenText}
- **Learning Profile**: ${differentiationText}
- **Detailed Description**: ${req.concernDescription}${assessmentContent ? `\n\n**UPLOADED ASSESSMENT DATA ANALYSIS REQUIRED**:\n${assessmentContent}` : ''}${lessonPlanContent ? `\n\n**LESSON PLAN DIFFERENTIATION REQUIRED**:\n${lessonPlanContent}` : ''}

## COMPREHENSIVE INTERVENTION REQUIREMENTS:

### Evidence-Based Foundation
- Cite specific research studies and educational frameworks (e.g., RTI, PBIS, UDL, trauma-informed practices)
- Reference proven intervention programs and methodologies
- Include success metrics and expected outcomes

### Detailed Implementation Specifications
- Provide step-by-step implementation guides with exact scripts and materials
- Include timing, frequency, and duration for each strategy
- Specify required materials, resources, and preparation time
- Offer multiple differentiation options for varying ability levels

### Assessment Integration Analysis
${assessmentContent ? `**CRITICAL**: Analyze the provided assessment data thoroughly. Identify specific strengths, weaknesses, learning patterns, and intervention targets. Use this data to create targeted interventions that address documented needs rather than generic strategies.` : ''}

### Lesson Plan Adaptation Requirements
${lessonPlanContent ? `**CRITICAL**: Provide specific, detailed adaptations to the uploaded lesson plan. Include modified objectives, alternative activities, assessment accommodations, and environmental considerations. Make the lesson accessible while maintaining academic rigor.` : ''}

### Differentiation Specifications
For the identified learning profile (${differentiationText}), provide:
- Sensory and cognitive processing accommodations
- Language and communication supports
- Social-emotional regulation strategies
- Academic skill scaffolding techniques
- Technology integration recommendations

## REQUIRED RESPONSE FORMAT:

### **1. Comprehensive Student Analysis**
- Detailed analysis of concerns, learning profile, and contributing factors
- Connection between assessment data and intervention targets
- Risk factors and protective factors identification

### **2. Evidence-Based Intervention Framework**
- Primary intervention approach with research citations
- Theoretical foundation (behavioral, cognitive, academic)
- Expected outcomes and success indicators

### **3. Immediate Action Plan (Days 1-14)**
**Strategy 1: [Specific Strategy Name]**
- **Research Base**: [Citation/Framework]
- **Materials Needed**: [Detailed list]
- **Implementation Steps**:
  1. [Detailed step with timing]
  2. [Detailed step with timing]
  3. [Detailed step with timing]
- **Data Collection**: [Specific methods and tools]
- **Success Criteria**: [Measurable outcomes]

**Strategy 2: [Additional Strategy if needed]**
[Same detailed format]

### **4. Short-Term Intensive Support (Weeks 3-8)**
**Primary Focus Area: [Specific skill/behavior]**
- **Intervention Program**: [Specific program name if applicable]
- **Frequency**: [Exact schedule]
- **Progress Monitoring**: [Weekly data collection methods]
- **Adaptation Protocol**: [When and how to modify]

### **5. Long-Term Skill Development (Weeks 9-16)**
**Maintenance and Generalization Strategies**
- **Skill Transfer Plans**: [Cross-setting implementation]
- **Independence Building**: [Scaffolding reduction plan]
- **Family Engagement**: [Home-school collaboration strategies]

### **6. Comprehensive Progress Monitoring System**
- **Daily Data**: [Quick check methods]
- **Weekly Assessment**: [Formal measurement tools]
- **Monthly Review**: [Comprehensive evaluation criteria]
- **Decision Points**: [When to continue, modify, or escalate]

### **7. Collaboration and Communication Plan**
- **Team Members**: [Who needs to be involved]
- **Meeting Schedule**: [Regular check-in frequency]
- **Documentation Requirements**: [Record-keeping protocols]
- **Parent Communication**: [Update frequency and methods]

### **8. Escalation and Support Protocols**
- **Warning Signs**: [Specific behavioral/academic indicators]
- **Immediate Response**: [Crisis intervention steps]
- **Referral Criteria**: [When to involve specialists]
- **Emergency Contacts**: [Who to call and when]

### **9. Resource Recommendations**
- **Professional Development**: [Suggested training for teacher]
- **Educational Materials**: [Specific programs, books, websites]
- **Technology Tools**: [Apps, software, assistive devices]
- **Community Resources**: [External support services]

**FORMATTING REQUIREMENTS**: Use detailed bullet points, include specific timeframes, provide exact implementation steps, and ensure all recommendations are immediately actionable for classroom teachers.`;
  }

  // Add language instruction to the prompt if specified
  const targetLanguage = req.language && req.language !== 'English' ? req.language : null;
  
  if (targetLanguage) {
    prompt += `\n\n**IMPORTANT LANGUAGE REQUIREMENT: Please provide all recommendations, strategies, and content in ${targetLanguage}. Ensure all text, headers, implementation steps, and materials are written in ${targetLanguage}. Use culturally appropriate examples and references for ${targetLanguage}-speaking communities when applicable.**`;
  }

  try {
    console.log(`🌐 Making DeepSeek API call to: ${apiClient.baseURL}/chat/completions`);
    console.log(`🔑 Using API key: ${apiClient.apiKey.substring(0, 10)}...`);
    console.log(`🌍 Target language: ${targetLanguage || 'English (default)'}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const systemPrompt = targetLanguage 
      ? `You are a highly trained educational intervention specialist with expertise in evidence-based practices, special education law, and research-backed classroom strategies. You are fluent in ${targetLanguage} and will provide all responses in ${targetLanguage}. Provide comprehensive, research-backed intervention strategies with specific implementation details, materials lists, progress monitoring tools, and timeline expectations. Base all recommendations on peer-reviewed educational research and proven classroom practices. Include specific data collection methods and evidence-based modifications. All content must be in ${targetLanguage}.`
      : "You are a highly trained educational intervention specialist with expertise in evidence-based practices, special education law, and research-backed classroom strategies. Provide comprehensive, research-backed intervention strategies with specific implementation details, materials lists, progress monitoring tools, and timeline expectations. Base all recommendations on peer-reviewed educational research and proven classroom practices. Include specific data collection methods and evidence-based modifications.";
    
    const response = await fetch(`${apiClient.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiClient.apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
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
    
    // Sanitize the response to prevent database encoding errors
    recommendations = sanitizeForDatabase(recommendations);

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
        let mockRecommendations = generateMockRecommendations(req, assessmentContent, lessonPlanContent);
        
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
        
        const disclaimer = "⚠️ IMPORTANT DISCLAIMER: These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation. (API authentication failed, returning mock data)";
        return { recommendations: mockRecommendations, disclaimer };
      }
      if (error.name === 'AbortError') {
        console.log('⏰ API request timed out after 30 seconds');
      }
    }
    
    console.log('🔄 API call failed, falling back to mock data');
    let mockRecommendations = generateMockRecommendations(req, assessmentContent, lessonPlanContent);
    
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
    
    const disclaimer = "⚠️ IMPORTANT DISCLAIMER: These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation. (API service unavailable, returning mock data)";
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
  language?: string;
}

export interface FollowUpAssistanceResponse {
  assistance: string;
  disclaimer: string;
}

export async function followUpAssistance(
  req: FollowUpAssistanceRequest
): Promise<FollowUpAssistanceResponse> {
  const apiClient = await getApiClient();
  
  if (!apiClient) {
    console.log("No active API key found in database, returning mock data.");
    const mockAssistance = generateMockFollowUpAssistance(req);
    const disclaimer = "";
    return { assistance: mockAssistance, disclaimer };
  }

  const concernTypesText = req.concernTypes.length > 0 
    ? req.concernTypes.join(', ')
    : 'Not specified';

  // Detect if Chinese translation is requested
  const hasChinese = /chinese|中文|中国|翻译|中国人|中国话|中文版|chinese|translate.*chinese|write.*chinese|explain.*chinese/i.test(req.specificQuestion);
  const targetLanguage = hasChinese ? 'Chinese' : req.language;
  
  let prompt = `You are a highly trained educational intervention specialist with expertise in implementation science and evidence-based classroom practices. Provide detailed, research-backed implementation guidance for Tier 2 interventions with specific steps, materials, troubleshooting, and progress monitoring strategies.`;

  // Add language instruction if Chinese is requested
  if (targetLanguage === 'Chinese' || hasChinese) {
    prompt += `\n\n**IMPORTANT LANGUAGE REQUIREMENT: The user is requesting a Chinese translation or explanation. Please provide your entire response in simplified Chinese (中文). All text, headers, implementation steps, and materials should be written in Chinese. Use culturally appropriate examples for Chinese-speaking communities.**\n\n`;
  }

  prompt += `

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
    
    const response = await fetch(`${apiClient.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiClient.apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: targetLanguage === 'Chinese' || hasChinese 
              ? "You are a highly trained educational intervention specialist with expertise in implementation science and evidence-based classroom practices. You are fluent in Chinese and will provide all responses in simplified Chinese (中文). Provide comprehensive, research-backed implementation guidance with specific procedural steps, materials lists, data collection methods, and troubleshooting strategies. Base all recommendations on proven implementation research and successful classroom practices. All content must be in Chinese."
              : "You are a highly trained educational intervention specialist with expertise in implementation science and evidence-based classroom practices. Provide comprehensive, research-backed implementation guidance with specific procedural steps, materials lists, data collection methods, and troubleshooting strategies. Base all recommendations on proven implementation research and successful classroom practices."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
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

    const disclaimer = "";

    return {
      assistance,
      disclaimer
    };
  } catch (error) {
    console.error('❌ Error calling DeepSeek API for follow-up assistance:', error);
    
    console.log('🔄 Follow-up assistance API failed, falling back to mock data');
    const mockAssistance = generateMockFollowUpAssistance(req);
    const disclaimer = "";
    return { assistance: mockAssistance, disclaimer };
  }
}

function generateMockRecommendations(req: GenerateRecommendationsRequest, assessmentContent: string = "", lessonPlanContent: string = ""): string {
  const isDifferentiationTask = req.taskType === 'differentiation';
  
  if (isDifferentiationTask) {
    return generateMockDifferentiationStrategies(req);
  } else {
    return generateMockInterventionRecommendations(req, assessmentContent, lessonPlanContent);
  }
}

function generateMockDifferentiationStrategies(req: GenerateRecommendationsRequest): string {
  return `# Differentiation Strategies for ${req.studentFirstName} ${req.studentLastInitial}

## **Student Learning Profile Summary**
Based on the provided learning profile information, ${req.studentFirstName} demonstrates unique learning strengths and needs that require targeted differentiation strategies. This student would benefit from multi-modal instruction, structured support systems, and flexible learning options to maximize academic success and engagement.

## **1. Content Modifications**

### **Adjusting Complexity**
- **Scaffolded Content Delivery**: Break lessons into 10-15 minute chunks with visual organizers
- **Multi-Level Materials**: Provide same content at 3 different reading levels (below, at, above grade level)
- **Concept Mapping**: Use graphic organizers to show relationships between ideas
- **Vocabulary Pre-Teaching**: Introduce key terms with visual aids and real-world examples
- **Concrete-Abstract Bridge**: Start with hands-on examples before moving to abstract concepts

### **Multiple Representations**
- **Visual Supports**: Create infographics, charts, and color-coded materials for key concepts
- **Auditory Options**: Provide recorded instructions, audiobooks, and verbal processing time
- **Kinesthetic Activities**: Use manipulatives, role-playing, and movement-based learning
- **Digital Integration**: Utilize interactive apps, virtual simulations, and multimedia presentations

### **Interest-Based Adaptations**
- **Student Interest Surveys**: Connect curriculum to personal interests and hobbies
- **Cultural Connections**: Incorporate culturally relevant examples and contexts
- **Choice Menus**: Offer 3-4 topic options for research projects and presentations

## **2. Process Modifications**

### **Instructional Delivery**
- **Think-Aloud Modeling**: Demonstrate problem-solving processes step-by-step
- **Chunked Instruction**: Present information in small, manageable segments
- **Wait Time**: Provide 5-7 seconds for processing before expecting responses
- **Multiple Exposures**: Review key concepts through different activities and formats

### **Scaffolding Techniques**
- **Step-by-Step Guides**: Create visual process charts for complex tasks
- **Peer Buddy System**: Pair with supportive classmate for collaboration and support
- **Teacher Check-Ins**: Schedule brief 2-minute progress checks every 15 minutes
- **Success Criteria**: Provide clear rubrics and examples of quality work

### **Technology Integration**
- **Text-to-Speech**: Use assistive technology for reading support
- **Speech-to-Text**: Allow voice recording for written responses
- **Organization Apps**: Utilize digital planners and reminder systems
- **Interactive Whiteboards**: Engage with touch-screen technology for kinesthetic learning

## **3. Product Alternatives**

### **Assessment Options**
- **Portfolio Collections**: Gather work samples showing progress over time
- **Oral Presentations**: Allow verbal demonstration of knowledge
- **Digital Projects**: Create multimedia presentations, videos, or interactive displays
- **Performance Tasks**: Use real-world applications and hands-on demonstrations
- **Choice Boards**: Offer 6-9 options for demonstrating learning

### **Expression Methods**
- **Written Options**: Traditional essays, graphic organizers, annotated drawings
- **Verbal Options**: Recorded explanations, debates, storytelling
- **Visual Options**: Posters, infographics, comic strips, photo journals
- **Digital Options**: Websites, presentations, video projects, interactive timelines

## **4. Learning Environment Optimization**

### **Physical Space**
- **Flexible Seating**: Standing desk, stability ball, floor cushions, traditional desk options
- **Quiet Zones**: Designated low-stimulation areas with noise-reducing headphones
- **Organization Systems**: Color-coded folders, labeled storage, visual schedules
- **Lighting Options**: Natural light when possible, reduce fluorescent glare
- **Movement Breaks**: Scheduled 2-minute movement opportunities every 20 minutes

### **Social Environment**
- **Strategic Grouping**: Rotate between individual, pair, and small group configurations
- **Peer Support Networks**: Establish study buddies and collaboration partnerships
- **Clear Communication**: Visual and verbal instructions, posted classroom expectations
- **Positive Reinforcement**: Frequent specific praise and recognition systems

## **5. Implementation Timeline**

### **Week 1-2: Immediate Strategies**
- Set up physical environment modifications (seating, organization systems)
- Introduce visual supports and communication methods
- Begin data collection on current performance levels
- Establish peer buddy partnerships and support systems

### **Weeks 3-6: Short-term Adaptations**
- Implement scaffolded instruction techniques and chunked content delivery
- Introduce technology tools and assistive supports
- Develop and practice new assessment formats
- Monitor progress and adjust strategies based on student response

### **Ongoing: Long-term Support**
- Maintain consistent environmental modifications and support systems
- Regularly update and refine differentiation strategies based on student growth
- Prepare transition materials for next grade level or new teachers
- Continue family communication and collaboration

## **6. Progress Monitoring & Data Collection**

- **Weekly Academic Data**: Track completion rates, accuracy scores, and engagement levels
- **Behavioral Observations**: Document on-task behavior, social interactions, and self-regulation
- **Student Self-Assessment**: Weekly check-ins on learning preferences and challenges
- **Work Sample Analysis**: Review quality and growth in student products monthly
- **Adjustment Protocol**: Modify strategies if no progress seen after 2-3 weeks of consistent implementation

## **7. Collaboration & Communication**

- **Family Partnership**: Share strategies for home reinforcement, communicate progress weekly
- **Support Staff Coordination**: Collaborate with special education team, counselors, and specialists
- **Documentation**: Maintain detailed records of interventions tried and student responses
- **Professional Development**: Seek additional training in differentiation strategies as needed

**Note**: These are research-based strategies that should be implemented consistently and monitored for effectiveness. Regular communication with all stakeholders ensures the best possible outcomes for ${req.studentFirstName}.`;
}

function generateMockInterventionRecommendations(req: GenerateRecommendationsRequest, assessmentContent: string = "", lessonPlanContent: string = ""): string {
  const concernTypes = req.concernTypes.join(', ');
  
  const assessmentSection = assessmentContent ? `

**Based on uploaded assessment data, the following specific needs have been identified:**
${assessmentContent.substring(0, 800)}${assessmentContent.length > 800 ? '...' : ''}

` : '';

  return `# Assessment Summary

Based on the ${req.severityLevel} level concerns related to ${concernTypes} for ${req.studentFirstName} ${req.studentLastInitial}. (Grade ${req.grade}), the following Tier 2 interventions are recommended to address the observed challenges in ${req.location}.${assessmentSection}

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

## Additional Research-Based Resources

**Professional Development:** Consider attending training on specific intervention strategies
**Assessment Tools:** Use validated instruments to monitor progress (CBM, behavior tracking)
**Collaboration:** Partner with special education team and school psychologist for ongoing support`;
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
