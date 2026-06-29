import { getStructuredLLM } from "../../services/llm.js";
import { z } from "zod";

const analysisSchema = z.object({
  strengths: z.array(z.string()).describe("Key strengths of the company"),
  risks: z.array(z.string()).describe("Key risks or weaknesses"),
  financialHealth: z.string().describe("Summary of financial health/funding"),
  marketSentiment: z.string().describe("Current market sentiment towards the company")
});

export async function analyzeNode(state) {
  if (state.error) return {}; // Skip if previous error

  try {
    const structuredLlm = getStructuredLLM(analysisSchema, "analysis");
    
    const prompt = `Based on the following research data and financial metrics for ${state.companyName}, extract the structured findings. Be sure to ground your analysis of strengths, risks, and financial health in the hard financial metrics provided.
    
Research Data:
${JSON.stringify(state.researchData, null, 2)}

Financial Data:
${JSON.stringify(state.financials, null, 2)}
    `;
    
    const analysis = await structuredLlm.invoke(prompt);
    return { analysisData: analysis };
  } catch (error) {
    console.error("[analyzeNode] Error:", error.message);
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return { error: "Our AI provider is experiencing high demand right now. Please try again in a minute." };
    }
    return { error: "An unexpected error occurred during AI analysis. Please try again." };
  }
}
