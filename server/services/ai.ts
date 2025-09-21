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
  
  // CRITICAL SAFETY DETECTION - Check for safety concerns FIRST
  const safetyCheck = detectUrgentKeywords(req.concernDescription);
  console.log("🚨 Safety check result:", safetyCheck);
  
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
    
    // Add safety alert for mock data if safety concerns detected
    if (safetyCheck.isUrgent) {
      mockRecommendations = generateUrgentSafeguardMessage(safetyCheck.triggeredKeywords) + '\n\n' + mockRecommendations;
    } else if (req.severityLevel === 'urgent') {
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

**YOUR TASK:** Create a COMPLETE differentiated version of the above lesson plan specifically adapted for ${req.studentFirstName}'s learning needs. This must be a fully developed, ready-to-use lesson plan with all activities, materials, and assessments modified. Include BOTH the modified lesson plan AND general strategies:

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

7. **Ongoing Differentiation Strategies:**
   - Long-term content modifications
   - Process adaptations for future lessons
   - Assessment alternatives
   - Environment optimizations
   - Progress monitoring systems
   - Collaboration and communication plans

**Format:** 
1. **FIRST**: Provide a COMPLETE, restructured lesson plan with specific activities, modified materials, timing, and assessment methods
2. **THEN**: Include comprehensive research-based differentiation strategies with citations, implementation timelines, and progress monitoring systems (use the same detailed format as provided for general differentiation tasks)

This should include BOTH an actual differentiated lesson plan the teacher can implement immediately AND comprehensive ongoing support strategies.`;
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
    `You are a supportive teaching colleague speaking with a fellow professional educator. You recognize that this teacher brings valuable experience, knowledge, and insight to their classroom. Your role is to offer ideas and suggestions that build on their existing expertise.

**VOICE & TONE**: Write as a respectful peer who acknowledges the teacher's professional judgment and existing skills. Use phrases like "Building on what you already know," "You likely have experience with...", "Given your professional expertise," "As you've probably noticed," and "Your classroom knowledge suggests..." Recognize their competence while offering additional tools for their professional toolkit.

**PROFESSIONAL APPROACH**: Present strategies as additions to their existing repertoire, not replacements. Honor their experience by saying things like "You may already be doing some of this" or "This might complement your current approach." Frame suggestions as collaborative ideas between professionals, not instructions to follow.

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
      ? `You are a respectful colleague speaking with a professional educator. You are fluent in ${targetLanguage} and will provide all responses in ${targetLanguage}. 

**CRITICAL SAFETY PROTOCOL:** Before generating any intervention suggestions, analyze the teacher's input for ANY indicators of:
1. Direct mentions: suicide, self-harm, self-injury, cutting, harm to others, violence
2. Concerning patterns: withdrawal, giving away possessions, saying goodbye, threats, aggression
3. Risk indicators: hopelessness, worthlessness, isolation, concerning drawings/writing

IF ANY SAFETY CONCERNS ARE DETECTED:
- IMMEDIATELY flag this as HIGH PRIORITY SAFETY CONCERN
- Override normal intervention suggestions with emergency response protocol
- Provide clear action steps for immediate professional intervention

**VOICE**: Acknowledge the teacher's existing expertise and professional knowledge. Use phrases that honor their experience like "building on your classroom insights," "adding to your professional toolkit," "you likely already know," and "your experience suggests." **APPROACH**: Present ideas as collaborative suggestions between professionals, not instructions. Recognize their competence while offering additional resources and strategies they can consider integrating into their practice. All content must be in ${targetLanguage}.`
      : `You are a respectful colleague speaking with a professional educator. 

**CRITICAL SAFETY PROTOCOL:** Before generating any intervention suggestions, analyze the teacher's input for ANY indicators of:
1. Direct mentions: suicide, self-harm, self-injury, cutting, harm to others, violence
2. Concerning patterns: withdrawal, giving away possessions, saying goodbye, threats, aggression toward peers
3. Risk indicators: hopelessness, worthlessness, isolation, sudden mood changes, concerning drawings/writing

IF ANY SAFETY CONCERNS ARE DETECTED:
- IMMEDIATELY flag this as HIGH PRIORITY SAFETY CONCERN
- Override normal intervention suggestions with emergency response protocol
- Provide clear action steps for immediate professional intervention

**VOICE**: Acknowledge the teacher's existing expertise and professional knowledge. Use phrases that honor their experience like 'building on your classroom insights,' 'adding to your professional toolkit,' 'you likely already know,' and 'your experience suggests.' **APPROACH**: Present ideas as collaborative suggestions between professionals, not instructions. Recognize their competence while offering additional resources and strategies they can consider integrating into their practice.`;
    
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

    // Check for safety concerns and add critical safety alert if needed
    if (safetyCheck.isUrgent) {
      console.log('🚨 CRITICAL SAFETY ALERT! Adding safety warning...');
      recommendations = generateUrgentSafeguardMessage(safetyCheck.triggeredKeywords) + '\n\n' + recommendations;
    } else if (req.severityLevel === 'urgent') {
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
      console.log('🚨 No safety concerns or urgency detected');
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
        
        // Add safety alert if safety concerns detected
        if (safetyCheck.isUrgent) {
          mockRecommendations = generateUrgentSafeguardMessage(safetyCheck.triggeredKeywords) + '\n\n' + mockRecommendations;
        } else if (req.severityLevel === 'urgent') {
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
  // CRITICAL SAFETY DETECTION - Check for safety concerns in follow-up questions
  const safetyCheck = detectUrgentKeywords(req.specificQuestion);
  console.log("🚨 Follow-up safety check result:", safetyCheck);
  
  const apiClient = await getApiClient();
  
  if (!apiClient) {
    console.log("No active API key found in database, returning mock data.");
    let mockAssistance = generateMockFollowUpAssistance(req);
    
    // Add safety alert for mock follow-up assistance if needed
    if (safetyCheck.isUrgent) {
      mockAssistance = generateUrgentSafeguardMessage(safetyCheck.triggeredKeywords) + '\n\n' + mockAssistance;
    }
    
    const disclaimer = "";
    return { assistance: mockAssistance, disclaimer };
  }

  const concernTypesText = req.concernTypes.length > 0 
    ? req.concernTypes.join(', ')
    : 'Not specified';

  // Detect if Chinese translation is requested
  const hasChinese = /chinese|中文|中国|翻译|中国人|中国话|中文版|chinese|translate.*chinese|write.*chinese|explain.*chinese/i.test(req.specificQuestion);
  const targetLanguage = hasChinese ? 'Chinese' : req.language;
  
  let prompt = `You are a highly trained educational intervention specialist with expertise in implementation science and evidence-based classroom practices. **IMPORTANT: Provide direct, professional guidance without conversational phrases. Start immediately with implementation guidance.** Provide detailed, research-backed implementation guidance for Tier 2 interventions with specific steps, materials, troubleshooting, and progress monitoring strategies.`;

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
              ? "You are a highly trained educational intervention specialist with expertise in implementation science and evidence-based classroom practices. You are fluent in Chinese and will provide all responses in simplified Chinese (中文). **IMPORTANT: Provide direct, professional guidance without conversational phrases. Start immediately with implementation guidance.** Provide comprehensive, research-backed implementation guidance with specific procedural steps, materials lists, data collection methods, and troubleshooting strategies. Base all recommendations on proven implementation research and successful classroom practices. All content must be in Chinese."
              : "You are a highly trained educational intervention specialist with expertise in implementation science and evidence-based classroom practices. **IMPORTANT: Provide direct, professional guidance without conversational phrases like 'Of course' or 'I will help'. Start immediately with implementation guidance.** Provide comprehensive, research-backed implementation guidance with specific procedural steps, materials lists, data collection methods, and troubleshooting strategies. Base all recommendations on proven implementation research and successful classroom practices."
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
    let assistance = data.choices[0]?.message?.content || 'Unable to generate follow-up assistance at this time.';

    // Add safety alert if safety concerns detected in follow-up question
    if (safetyCheck.isUrgent) {
      console.log('🚨 CRITICAL SAFETY ALERT in follow-up! Adding safety warning...');
      assistance = generateUrgentSafeguardMessage(safetyCheck.triggeredKeywords) + '\n\n' + assistance;
    }

    const disclaimer = "";

    return {
      assistance,
      disclaimer
    };
  } catch (error) {
    console.error('❌ Error calling DeepSeek API for follow-up assistance:', error);
    
    console.log('🔄 Follow-up assistance API failed, falling back to mock data');
    let mockAssistance = generateMockFollowUpAssistance(req);
    
    // Add safety alert for mock follow-up assistance if needed
    if (safetyCheck.isUrgent) {
      mockAssistance = generateUrgentSafeguardMessage(safetyCheck.triggeredKeywords) + '\n\n' + mockAssistance;
    }
    
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

// CRITICAL SAFETY DETECTION - Enhanced keyword detection for student protection
const URGENT_KEYWORDS = [
  // Self-harm and suicide indicators
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die', 'better off dead',
  'no reason to live', 'can\'t go on', 'worthless', 'hopeless', 'giving up',
  'self-harm', 'self harm', 'cutting', 'hurting myself', 'hurt myself', 'self-injury',
  'burning myself', 'scratching', 'hitting myself', 'punching myself',
  
  // Concerning behavioral patterns
  'giving away belongings', 'saying goodbye', 'sudden mood change', 'withdrawing',
  'talking about death', 'death wish', 'funeral plans', 'writing will',
  
  // Violence and harm to others
  'kill', 'killing', 'murder', 'violent', 'weapon', 'gun', 'knife', 'bomb',
  'harm others', 'hurt others', 'hurt someone', 'violence', 'attack', 'fight',
  'death threats', 'threatening', 'going to hurt', 'make them pay',
  'revenge', 'get back at', 'shooting', 'stabbing', 'beating up',
  
  // Abuse indicators
  'abuse', 'sexual abuse', 'physical abuse', 'emotional abuse', 'neglect',
  'touching inappropriately', 'inappropriate behavior', 'molesting', 'rape',
  'hitting at home', 'bruises', 'scared to go home', 'family violence',
  
  // Crisis language
  'emergency', 'crisis', 'can\'t cope', 'breaking point', 'losing control',
  'dangerous thoughts', 'scary thoughts', 'voices telling me'
];

export interface UrgentSafeguardResult {
  isUrgent: boolean;
  triggeredKeywords: string[];
  requiresImmediateAttention: boolean;
  bypassDelay: boolean;
}

/**
 * Scans text for urgent keywords that require immediate safeguard protocols
 */
export function detectUrgentKeywords(text: string): UrgentSafeguardResult {
  if (!text || typeof text !== 'string') {
    return {
      isUrgent: false,
      triggeredKeywords: [],
      requiresImmediateAttention: false,
      bypassDelay: false
    };
  }

  const lowerText = text.toLowerCase();
  const triggeredKeywords: string[] = [];

  for (const keyword of URGENT_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      triggeredKeywords.push(keyword);
    }
  }

  const isUrgent = triggeredKeywords.length > 0;
  const requiresImmediateAttention = isUrgent;
  const bypassDelay = isUrgent; // Bypass 30-minute delay for urgent cases

  console.log('🔍 Urgent keyword detection:', {
    hasKeywords: isUrgent,
    keywords: triggeredKeywords,
    textLength: text.length
  });

  return {
    isUrgent,
    triggeredKeywords,
    requiresImmediateAttention,
    bypassDelay
  };
}

/**
 * Generates critical safety alert message for teachers
 */
export function generateUrgentSafeguardMessage(triggeredKeywords: string[] = []): string {
  const keywordText = triggeredKeywords.length > 0 
    ? `\n**SAFETY KEYWORDS DETECTED:** The following words in your submission triggered this alert: "${triggeredKeywords.join('", "')}"`
    : '';
  
  return `🚨 **IMMEDIATE SAFETY CONCERN DETECTED** 🚨

**URGENT ACTION REQUIRED - DO NOT DELAY:**

1. **CONTACT STUDENT SUPPORT SERVICES IMMEDIATELY**
2. **NOTIFY SENIOR MANAGEMENT TEAM TODAY**  
3. **FOLLOW YOUR SCHOOL'S CHILD PROTECTION POLICY**
4. **DO NOT LEAVE THIS STUDENT UNSUPERVISED**
5. **DOCUMENT THIS CONCERN FORMALLY**

${keywordText}

**⚠️ CRITICAL SAFETY PROTOCOL:**
This situation requires immediate professional intervention beyond classroom strategies. The safety concerns identified require specialized support from trained professionals.

**If there is imminent danger, follow your local emergency protocols immediately.**

**Educational strategies are provided below ONLY after safety measures are in place:**

**Note:** The intervention strategies below are provided as general guidance only. Professional assessment and intervention are required for this case.`;
}

/**
 * Generates messaging for teacher when urgent case is detected but admin review is required
 */
export function generateUrgentReviewPendingMessage(): string {
  return `**🚨 URGENT CASE - IMMEDIATE SUPPORT REQUIRED**

**An urgent case requires rapid support. Initial strategies are provided now. Please notify your student support department immediately.**

**IMMEDIATE ACTIONS:**
• Contact your school's student support team or administration today
• Follow your school's emergency protocols for student welfare concerns  
• Document all observations and interactions
• Do not delay seeking professional support

**Professional Review:** Your submission has been flagged for immediate administrative review due to the urgent nature of the concerns. Additional professional guidance will follow.

**Remember:** Student safety is the absolute priority. When in doubt, seek immediate help from qualified professionals.`;
}

/**
 * Generates universal disclaimer required for all AI outputs
 */
export function generateUniversalDisclaimer(severityLevel: 'mild' | 'moderate' | 'urgent'): string {
  let severitySpecificMessage = '';
  
  switch (severityLevel) {
    case 'mild':
    case 'moderate':
      severitySpecificMessage = '• For Mild/Moderate concerns: Please review and adapt recommendations according to your classroom and school context.';
      break;
    case 'urgent':
      severitySpecificMessage = '• For Urgent concerns: Notify your student support department immediately.\n• For any indication of suicide, self-harm, or harm to others: Consult your school\'s child protection protocol immediately.';
      break;
  }
  
  return `\n\n---\n\n**DISCLAIMER**\n\nThe strategies provided here are AI-assisted suggestions intended to support your professional practice. They are not a substitute for your school's policies, student support team, or child protection protocols.\n\n${severitySpecificMessage}`;
}

// Classroom Solutions AI Draft Generation
export interface GenerateClassroomSolutionRequest {
  teacherFirstName: string;
  teacherLastInitial: string;
  teacherPosition: string;
  studentAge: string;
  studentGrade: string;
  taskType: 'differentiation' | 'tier2_intervention';
  learningProfile: string[]; // JSON parsed array
  concernTypes: string[]; // JSON parsed array  
  concernDescription: string;
  severityLevel: 'mild' | 'moderate' | 'urgent';
  actionsTaken: string[]; // JSON parsed array
  language?: string;
}

export async function generateClassroomSolutionDraft(req: GenerateClassroomSolutionRequest) {
  console.log("🚀 Starting classroom solution draft generation...");
  console.log("📝 Teacher:", req.teacherFirstName, req.teacherLastInitial);
  console.log("📝 Task type:", req.taskType);
  console.log("📝 Concern types:", req.concernTypes);
  console.log("📝 Severity level:", req.severityLevel);
  
  // URGENT KEYWORD DETECTION - Check for safeguard triggers
  const urgentCheck = detectUrgentKeywords(req.concernDescription);
  console.log("🚨 Urgent keyword check result:", urgentCheck);
  
  const apiClient = await getApiClient();
  console.log("🔑 API client available:", !!apiClient);
  
  if (!apiClient) {
    console.log("No active API key found, returning mock classroom solution data.");
    return generateMockClassroomSolution(req, urgentCheck);
  }

  // Build learning profile details
  const learningProfileInfo = [];
  if (req.learningProfile.includes('Has IEP / 504 Plan')) {
    learningProfileInfo.push('- Student has an Individualized Education Program (IEP) or 504 Plan');
  }
  if (req.learningProfile.includes('Has Diagnosed Disability')) {
    learningProfileInfo.push('- Student has a diagnosed disability');
  }
  if (req.learningProfile.includes('English as an Additional Language')) {
    learningProfileInfo.push('- Student is an English as an Additional Language (EAL) learner');
  }
  if (req.learningProfile.includes('Gifted / Talented')) {
    learningProfileInfo.push('- Student is identified as gifted/talented');
  }
  if (req.learningProfile.includes('Struggling Academically')) {
    learningProfileInfo.push('- Student is struggling academically');
  }
  if (req.learningProfile.includes('Other Learning Needs or Notes')) {
    learningProfileInfo.push('- Student has other learning needs or special considerations');
  }

  // Build actions taken
  const actionsTakenInfo = req.actionsTaken.map(action => `- ${action}`).join('\n');

  let prompt;
  
  if (req.taskType === 'differentiation') {
    prompt = `You are an educational differentiation specialist AI assistant. Create evidence-based differentiation strategies for a student based on the information provided.

**Student Information:**
- Age: ${req.studentAge}
- Grade: ${req.studentGrade}
- Teacher: ${req.teacherPosition}

**Student Learning Profile:**
${learningProfileInfo.join('\n')}

**Concern Details:**
- Concern Types: ${req.concernTypes.join(', ')}
- Severity Level: ${req.severityLevel}
- Detailed Description: ${req.concernDescription}

**Actions Already Taken:**
${actionsTakenInfo}

**YOUR TASK:** Provide comprehensive, evidence-based differentiation strategies specifically tailored to this student's needs. Structure your response as follows:

1. **Learning Objectives Modifications:**
   - Tiered objectives appropriate for the student's level
   - Clear, measurable goals that match their abilities
   - Scaffolded progression steps

2. **Content Differentiation:**
   - Modified explanation methods
   - Visual supports and graphic organizers  
   - Chunked information presentation
   - Alternative vocabulary or simplified language
   - Multi-sensory approaches

3. **Process Differentiation:**
   - Alternative ways to engage with content
   - Scaffolded practice opportunities
   - Choice options for learning preferences
   - Technology integration strategies
   - Collaborative learning adaptations

4. **Product Differentiation:**
   - Alternative assessment methods
   - Multiple ways to demonstrate understanding
   - Portfolio-based assessments
   - Performance tasks adapted to strengths

5. **Environmental Modifications:**
   - Classroom setup considerations
   - Seating arrangements
   - Noise management
   - Materials accessibility
   - Technology accommodations

6. **Implementation Timeline:**
   - Short-term strategies (1-2 weeks)
   - Medium-term adaptations (1 month)
   - Long-term support plan (semester)

7. **Progress Monitoring:**
   - Data collection methods
   - Frequency of assessment
   - Success indicators
   - When to adjust strategies

**Format:** Use clear headings, bullet points, and specific examples. Be practical and actionable.`;

  } else { // tier2_intervention
    prompt = `You are a Tier 2 intervention specialist with expertise in Response to Intervention (RTI) and evidence-based classroom interventions. Create a comprehensive Tier 2 intervention plan for the student described below.

**Student Information:**
- Age: ${req.studentAge}  
- Grade: ${req.studentGrade}
- Teacher: ${req.teacherPosition}

**Student Learning Profile:**
${learningProfileInfo.join('\n')}

**Concern Details:**
- Concern Types: ${req.concernTypes.join(', ')}
- Severity Level: ${req.severityLevel}
- Detailed Description: ${req.concernDescription}

**Actions Already Taken (Tier 1):**
${actionsTakenInfo}

**YOUR TASK:** Design a structured Tier 2 intervention plan with research-based strategies. Structure your response as follows:

1. **Intervention Goals:**
   - Specific, measurable objectives
   - Target behaviors or skills to address
   - Expected outcomes within 6-8 weeks

2. **Evidence-Based Interventions:**
   - Research-backed strategies for identified concerns
   - Specific programs or protocols to implement  
   - Frequency and duration of interventions
   - Group size and composition recommendations

3. **Data Collection Plan:**
   - Baseline data requirements
   - Progress monitoring tools and schedule
   - Who will collect data and when
   - Decision-making criteria for success/changes

4. **Implementation Details:**
   - Daily/weekly schedule for interventions
   - Materials and resources needed
   - Staff responsibilities and training needs
   - Location and setup requirements

5. **Behavioral Supports (if applicable):**
   - Behavior intervention strategies
   - Positive reinforcement systems
   - Environmental modifications
   - Crisis prevention and response

6. **Family Communication:**
   - Parent notification and involvement
   - Home-school collaboration strategies
   - Progress reporting schedule

7. **Exit Criteria and Next Steps:**
   - Conditions for returning to Tier 1 only
   - Indicators for intensifying to Tier 3
   - Timeline for decision-making
   - Transition planning

**Format:** Use clear headings, specific timeframes, and actionable steps. Include research references where possible.`;
  }

  // Add language instruction if needed
  if (req.language === 'Chinese') {
    prompt = `**IMPORTANT LANGUAGE REQUIREMENT: Please provide your entire response in simplified Chinese (中文). All text, headers, strategies, and recommendations should be written in Chinese.**\n\n${prompt}`;
  }

  // Add urgency note for urgent cases
  if (req.severityLevel === 'urgent') {
    prompt += `\n\n**URGENT CASE NOTE:** This case has been marked as urgent requiring immediate follow-up. Please include a note in your response recommending that the teacher share this case with student support services or administration as appropriate.`;
  }

  try {
    console.log("🤖 Making API request to DeepSeek...");
    
    const response = await fetch(`${apiClient.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiClient.apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational specialist providing evidence-based classroom solutions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: false
      })
    });

    if (!response.ok) {
      console.error("❌ DeepSeek API error:", response.status, response.statusText);
      console.log("Falling back to mock data due to API error.");
      return generateMockClassroomSolution(req);
    }

    const data = await response.json();
    console.log("✅ DeepSeek API response received");
    
    const aiResponse = data.choices?.[0]?.message?.content || '';
    
    if (!aiResponse.trim()) {
      console.warn("Empty response from DeepSeek API, using mock data.");
      return generateMockClassroomSolution(req);
    }

    // Sanitize the response for database storage
    let sanitizedResponse = sanitizeForDatabase(aiResponse);
    
    // Add urgent safeguard messaging if urgent keywords detected
    if (urgentCheck.isUrgent) {
      const urgentMessage = generateUrgentSafeguardMessage();
      sanitizedResponse = urgentMessage + "\n\n" + sanitizedResponse;
    }
    
    // Add universal disclaimer to all outputs
    const disclaimer = generateUniversalDisclaimer(req.severityLevel);
    sanitizedResponse += disclaimer;

    return {
      draft: sanitizedResponse,
      source: 'deepseek',
      timestamp: new Date().toISOString(),
      urgentSafeguard: urgentCheck
    };

  } catch (error) {
    console.error("❌ Error calling DeepSeek API:", error);
    console.log("Falling back to mock data due to error.");
    return generateMockClassroomSolution(req, urgentCheck);
  }
}

function generateMockClassroomSolution(req: GenerateClassroomSolutionRequest, urgentCheck?: UrgentSafeguardResult) {
  console.log("📝 Generating mock classroom solution for:", req.taskType);
  
  const isUrgent = req.severityLevel === 'urgent';
  const hasUrgentKeywords = urgentCheck?.isUrgent || false;
  
  let urgentNote = "";
  if (hasUrgentKeywords) {
    urgentNote = "\n\n" + generateUrgentSafeguardMessage();
  } else if (isUrgent) {
    urgentNote = "\n\n⚠️ **URGENT CASE:** This case requires immediate attention. Please share with student support services or administration.";
  }

  let mockData;
  
  if (req.taskType === 'differentiation') {
    mockData = `# Differentiation Strategies for ${req.studentAge}-year-old Student

## Learning Objectives Modifications
- Break down complex tasks into smaller, manageable steps
- Provide multiple entry points for different skill levels
- Use visual and verbal learning objectives
- Create tiered assignments with varying complexity

## Content Differentiation  
- Use graphic organizers and visual supports
- Provide information in multiple formats (text, audio, visual)
- Chunk information into smaller segments
- Use simplified vocabulary when appropriate
- Incorporate hands-on learning activities

## Process Differentiation
- Offer choice in learning activities and materials
- Use flexible grouping strategies
- Provide additional time when needed
- Incorporate technology tools for engagement
- Use peer tutoring and collaborative learning

## Product Differentiation
- Allow multiple ways to demonstrate learning
- Use portfolio-based assessment
- Provide choice in final products
- Use formative assessments regularly
- Adapt rubrics to student needs

## Environmental Modifications
- Create quiet work spaces
- Use preferential seating
- Minimize distractions
- Provide access to support materials
- Ensure comfortable learning environment

## Implementation Timeline
**Week 1-2:** Establish baseline and introduce initial strategies
**Week 3-4:** Monitor progress and adjust as needed  
**Month 2:** Evaluate effectiveness and expand successful strategies

## Progress Monitoring
- Weekly check-ins with student
- Collect work samples biweekly
- Use simple progress charts
- Communicate with parents monthly
- Adjust strategies based on data${urgentNote}`;
    
    // Add universal disclaimer to differentiation mock data
    const disclaimer = generateUniversalDisclaimer(req.severityLevel);
    mockData += disclaimer;

  } else {
    mockData = `# Tier 2 Intervention Plan for ${req.studentAge}-year-old Student

## Intervention Goals
- Increase targeted skill development by 50% within 6 weeks
- Improve classroom engagement and participation
- Develop self-regulation strategies
- Strengthen academic foundation in identified areas

## Evidence-Based Interventions
- **Check-In/Check-Out (CICO):** Daily structured support system
- **Small group instruction:** 3-4 students, 20 minutes daily
- **Behavior intervention support:** Token economy system
- **Academic support:** Targeted skill building sessions
- **Social skills training:** Weekly 30-minute sessions

## Data Collection Plan
- **Baseline:** Current performance levels in target areas
- **Daily:** Behavior tracking sheets and academic performance
- **Weekly:** Progress monitoring assessments  
- **Biweekly:** Review and analysis of collected data
- **Decision point:** 6-week comprehensive review

## Implementation Details
- **Schedule:** Monday-Friday, 20 minutes after lunch
- **Location:** Resource room or quiet classroom space
- **Materials:** Specialized curriculum, tracking sheets, rewards
- **Staff:** Special education teacher or trained paraprofessional
- **Group size:** 3-4 students with similar needs

## Behavioral Supports
- Clear expectations and consistent routines
- Positive reinforcement system with daily rewards
- Break cards and coping strategies
- Parent communication system
- Crisis prevention plan with de-escalation techniques

## Family Communication  
- Initial meeting to explain intervention plan
- Weekly progress reports sent home
- Monthly parent conferences
- Home-school collaboration strategies
- Regular updates on student progress

## Exit Criteria and Next Steps
**Return to Tier 1:** 80% improvement in target behaviors for 3 consecutive weeks
**Move to Tier 3:** Less than 25% improvement after 8 weeks of intervention
**Timeline:** Review every 6 weeks for placement decisions
**Transition:** Gradual fade of supports when appropriate${urgentNote}`;
    
    // Add universal disclaimer to tier2 mock data
    const disclaimer = generateUniversalDisclaimer(req.severityLevel);
    mockData += disclaimer;
  }

  return {
    draft: sanitizeForDatabase(mockData),
    source: 'mock',
    timestamp: new Date().toISOString(),
    urgentSafeguard: urgentCheck || {
      isUrgent: false,
      triggeredKeywords: [],
      requiresImmediateAttention: false,
      bypassDelay: false
    }
  };
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
