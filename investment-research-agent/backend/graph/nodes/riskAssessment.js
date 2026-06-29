import { getStructuredLLM } from "../../services/llm.js";
import { z } from "zod";

const riskSchema = z.object({
  overallRiskScore: z.number().min(1).max(10).describe("Overall risk score from 1 (lowest risk) to 10 (highest risk)"),
  riskFactors: z.array(z.object({
    factor: z.string().describe("Name or brief description of the risk factor"),
    severity: z.enum(["low", "medium", "high"]).describe("Severity level of this specific risk"),
    explanation: z.string().describe("Brief explanation of why this is a risk and its potential impact")
  })).describe("List of specific risk factors identified")
});

export async function riskAssessmentNode(state) {
  if (state.error) return {};

  try {
    const structuredLlm = getStructuredLLM(riskSchema, "riskAssessment");
    
    const prompt = `Conduct a comprehensive risk assessment for ${state.companyName}.
Consider the qualitative research, financial metrics, and the previously identified SWOT analysis.
    
Research Data:
${JSON.stringify(state.researchData, null, 2)}

Financial Data:
${JSON.stringify(state.financials, null, 2)}

SWOT Analysis:
${JSON.stringify(state.swotData, null, 2)}
    `;
    
    const risk = await structuredLlm.invoke(prompt);
    return { riskData: risk };
  } catch (error) {
    console.error("[riskAssessmentNode] Error:", error.message);
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return { error: "Our AI provider is experiencing high demand right now. Please try again in a minute." };
    }
    return { error: "An unexpected error occurred during AI analysis. Please try again." };
  }
}
