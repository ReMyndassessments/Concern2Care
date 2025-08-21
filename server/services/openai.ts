if (!process.env.DEEPSEEK_API_KEY) {
  console.warn("DEEPSEEK_API_KEY environment variable not set. AI functionality will be limited.");
}

// DeepSeek API client
const deepseekClient = process.env.DEEPSEEK_API_KEY ? {
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1'
} : null;

export interface InterventionStrategy {
  title: string;
  description: string;
  steps: string[];
  timeline: string;
}

export async function generateInterventions(
  concernType: string,
  description: string,
  studentInfo: string
): Promise<InterventionStrategy[]> {
  console.log("🚀 Starting intervention generation...");
  console.log("🔑 DeepSeek client exists:", !!deepseekClient);
  console.log("📝 Concern type:", concernType);
  console.log("📝 Description:", description);
  
  if (!deepseekClient) {
    throw new Error("DeepSeek API key not configured. Please provide DEEPSEEK_API_KEY environment variable.");
  }
  const prompt = `You are an expert educational consultant specializing in evidence-based Tier 2 interventions for K-12 students. Generate 3-5 research-based intervention strategies for the following student concern:

Student: ${studentInfo}
Concern Type: ${concernType}
Description: ${description}

For each intervention strategy, provide:
1. A clear, actionable title
2. A detailed description of the intervention
3. Step-by-step implementation instructions (4-6 steps)
4. Expected timeline for seeing results

Focus on:
- Evidence-based practices appropriate for Tier 2 intervention
- Strategies that can be implemented in a general education classroom
- Clear, practical steps that teachers can follow
- Age-appropriate interventions for K-12 students
- Interventions that address the specific concern type

Respond with a JSON object containing an array of interventions with the following structure:
{
  "interventions": [
    {
      "title": "Strategy Title",
      "description": "Detailed description of the intervention approach",
      "steps": ["Step 1", "Step 2", "Step 3", "Step 4"],
      "timeline": "Expected timeline (e.g., 2-4 weeks)"
    }
  ]
}`;

  try {
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
            content: "You are an expert educational consultant specializing in evidence-based Tier 2 interventions. Provide only research-based, practical strategies that teachers can implement. Always respond with valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const content = data.choices[0].message.content || '{"interventions": []}';
    console.log("📝 Raw DeepSeek response:", content.substring(0, 200) + "...");
    
    let result;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*"interventions"[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : content;
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse DeepSeek response as JSON:", content);
      console.error("Parse error:", parseError);
      throw new Error("Invalid response format from DeepSeek API");
    }
    
    console.log("✅ Parsed interventions count:", result.interventions?.length || 0);
    return result.interventions || [];
  } catch (error) {
    console.error("Error generating interventions:", error);
    throw new Error("Failed to generate intervention strategies");
  }
}

export async function answerFollowUpQuestion(
  question: string,
  concernContext: string,
  interventions: InterventionStrategy[]
): Promise<string> {
  if (!deepseekClient) {
    throw new Error("DeepSeek API key not configured. Please provide DEEPSEEK_API_KEY environment variable.");
  }
  const prompt = `Based on the following student concern and intervention strategies, provide a detailed, practical answer to the teacher's follow-up question:

Original Concern: ${concernContext}

Intervention Strategies:
${interventions.map((intervention, index) => 
  `${index + 1}. ${intervention.title}: ${intervention.description}`
).join('\n')}

Teacher's Question: ${question}

Provide a helpful, specific response that gives practical implementation guidance. Focus on actionable advice that a teacher can immediately use.`;

  try {
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
            content: "You are an expert educational consultant. Provide practical, specific guidance for implementing intervention strategies."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 800,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || "I apologize, but I couldn't generate a response to your question. Please try rephrasing your question.";
  } catch (error) {
    console.error("Error answering follow-up question:", error);
    throw new Error("Failed to answer follow-up question");
  }
}
