export interface DeepSeekRecommendationsRequest {
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

export interface DeepSeekRecommendationsResponse {
  recommendations: string;
  disclaimer: string;
}

export interface DeepSeekFollowUpRequest {
  originalRecommendations: string;
  specificQuestion: string;
  studentFirstName: string;
  studentLastInitial: string;
  grade: string;
  concernTypes: string[];
  severityLevel: string;
}

export interface DeepSeekFollowUpResponse {
  assistance: string;
  disclaimer: string;
}

// Mock implementation - Replace with actual DeepSeek API when available
export async function generateAIRecommendations(request: DeepSeekRecommendationsRequest): Promise<DeepSeekRecommendationsResponse> {
  try {
    // In production, this would call DeepSeek API
    const mockRecommendations = generateMockRecommendations(request);
    
    const disclaimer = "⚠️ IMPORTANT DISCLAIMER: These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation.";
    
    return {
      recommendations: mockRecommendations,
      disclaimer
    };
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    throw new Error('Failed to generate AI recommendations');
  }
}

export async function generateFollowUpAssistance(request: DeepSeekFollowUpRequest): Promise<DeepSeekFollowUpResponse> {
  try {
    // In production, this would call DeepSeek API
    const mockAssistance = generateMockFollowUpAssistance(request);
    
    const disclaimer = "⚠️ IMPORTANT DISCLAIMER: This AI-generated follow-up assistance is for informational purposes only and should not replace professional educational assessment. Please consult with your school's student support team for specific implementation guidance.";
    
    return {
      assistance: mockAssistance,
      disclaimer
    };
  } catch (error) {
    console.error('Error generating follow-up assistance:', error);
    throw new Error('Failed to generate follow-up assistance');
  }
}

function generateMockRecommendations(request: DeepSeekRecommendationsRequest): string {
  const concernTypesText = request.concernTypes.length > 0 
    ? request.concernTypes.join(', ') + (request.otherConcernType ? `, ${request.otherConcernType}` : '')
    : 'Not specified';
  
  const actionsTakenText = request.actionsTaken.length > 0 
    ? request.actionsTaken.join(', ') + (request.otherActionTaken ? `, ${request.otherActionTaken}` : '')
    : 'None documented';

  return `# Tier 2 Intervention Recommendations for ${request.studentFirstName} ${request.studentLastInitial}.

## **Assessment Summary**
Based on the ${request.severityLevel} severity level concerns related to ${concernTypesText}, this student would benefit from targeted Tier 2 interventions focusing on structured support and skill development.

## **Immediate Interventions** (1-2 weeks)

### 1. **Check-In System**
- **Implementation**: Daily 5-minute check-ins with ${request.studentFirstName} before class begins
- **Expected Outcomes**: Increased connection and early identification of daily challenges
- **Timeline**: Start immediately, continue for 2 weeks minimum
- **Materials Needed**: Check-in log sheet, timer

### 2. **Environmental Modifications**
- **Implementation**: Adjust seating arrangement to minimize distractions in ${request.location}
- **Expected Outcomes**: Improved focus and reduced disruptive behaviors
- **Timeline**: Implement within 3 days
- **Materials Needed**: Seating chart, visual barriers if needed

## **Short-term Strategies** (2-6 weeks)

### 3. **Structured Support Program**
- **Implementation**: Create a behavior/academic support plan with clear expectations and rewards
- **Expected Outcomes**: 25% improvement in target behaviors within 4 weeks
- **Timeline**: 4-6 week intervention period
- **Materials Needed**: Tracking sheets, reward system materials

### 4. **Skill Building Activities**
- **Implementation**: Targeted mini-lessons addressing specific concern areas
- **Expected Outcomes**: Measurable skill improvement in identified areas
- **Timeline**: 15-minute sessions, 3 times per week for 4 weeks
- **Materials Needed**: Specialized curriculum materials, assessment tools

## **Long-term Support** (6+ weeks)

### 5. **Collaborative Team Approach**
- **Implementation**: Regular meetings with support staff, parents, and ${request.studentFirstName}
- **Expected Outcomes**: Sustained progress and coordinated support
- **Timeline**: Monthly team meetings for remainder of academic year
- **Materials Needed**: Meeting scheduler, progress tracking forms

### 6. **Self-Advocacy Skills Development**
- **Implementation**: Teach ${request.studentFirstName} to recognize needs and ask for appropriate help
- **Expected Outcomes**: Increased independence and self-regulation
- **Timeline**: Ongoing skill development over 8-12 weeks
- **Materials Needed**: Self-monitoring tools, visual cues

## **Progress Monitoring**

- **Daily**: Quick visual checks and behavior observations
- **Weekly**: Review progress data and adjust strategies as needed
- **Bi-weekly**: Check-in with ${request.studentFirstName} about intervention effectiveness
- **Monthly**: Formal progress review meeting with team

**Data Collection Methods**:
- Behavior frequency charts
- Academic performance tracking
- Student self-assessment tools
- Teacher observation forms

## **When to Escalate**

Consider escalation to Tier 3 intensive interventions if:
- No improvement after 6-8 weeks of consistent Tier 2 implementation
- Safety concerns arise for ${request.studentFirstName} or others
- Significant regression in target behaviors or academic performance
- Additional concerning behaviors emerge
- Family requests more intensive support

**Next Steps for Escalation**:
1. Contact school psychologist or intervention specialist
2. Schedule comprehensive assessment meeting
3. Consider referral for special education evaluation if appropriate
4. Explore community-based support resources

---

*Actions already taken: ${actionsTakenText}*

*These recommendations should be implemented consistently and with fidelity. Regular data collection is essential for determining intervention effectiveness.*`;
}

function generateMockFollowUpAssistance(request: DeepSeekFollowUpRequest): string {
  return `# Follow-Up Assistance for ${request.studentFirstName} ${request.studentLastInitial}.

## **Addressing Your Question**: "${request.specificQuestion}"

Based on your original intervention plan and this specific question, here are targeted recommendations:

### **Immediate Action Steps**

1. **Assessment of Current Situation**
   - Review progress data from the past week
   - Document specific incidents or behaviors you're observing
   - Note any changes in ${request.studentFirstName}'s environment or routine

2. **Strategy Refinement**
   - Consider adjusting the frequency or intensity of current interventions
   - Look for patterns in when the concern is most/least present
   - Evaluate if environmental factors need modification

### **Specific Recommendations**

Based on the ${request.severityLevel} level concerns related to ${request.concernTypes.join(', ')}, consider these adaptations:

- **If Progress is Slower Than Expected**: Increase intervention frequency and add more immediate reinforcement
- **If New Behaviors Emerge**: Document patterns and consider whether this indicates a need for additional support
- **If Family Concerns Arise**: Schedule a collaborative meeting to align home and school strategies

### **Implementation Guidance**

1. **Timeline**: Implement these adjustments within 2-3 days
2. **Data Collection**: Continue tracking daily for at least one week to assess effectiveness
3. **Review Schedule**: Check progress in 5 school days

### **When to Seek Additional Support**

Contact your school's intervention team if:
- The situation escalates beyond current intervention level
- You need additional resources or materials
- ${request.studentFirstName} expresses distress about the interventions
- Family has concerns about the approach

### **Next Steps**

1. Try the suggested modifications for one week
2. Document what works and what doesn't
3. Prepare for your next team meeting with specific data and observations

*Remember: Consistency is key. Small adjustments to proven strategies often work better than completely changing approaches.*`;
}