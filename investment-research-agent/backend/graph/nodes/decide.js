import { getStructuredLLM } from "../../services/llm.js";
import { z } from "zod";

const decisionSchema = z.object({
  decision: z.enum(["INVEST", "PASS"]).describe("The final investment decision"),
  confidence: z.number().min(0).max(100).describe("Confidence score from 0 to 100"),
  reasoning: z.string().describe("Detailed reasoning for the decision"),
  keyFactors: z.array(z.string()).describe("List of key factors influencing the decision")
});

export async function decideNode(state) {
  if (state.error) return {}; // Skip if previous error

  try {
    const structuredLlm = getStructuredLLM(decisionSchema, "decision");
    
    const prompt = `You are the Lead Investment Strategist. Based on the comprehensive analysis below, make a final investment decision (INVEST or PASS) for ${state.companyName}.

You MUST incorporate the following into your reasoning:
1. Explicitly state and justify the 'overallRiskScore' provided in the Risk Assessment.
2. Directly reference at least one core 'Strength' or 'Opportunity' vs. a 'Weakness' or 'Threat' from the SWOT Analysis to justify your decision.
3. Ground your final verdict in the hard Financial Data (e.g., P/E ratio, margins).
4. Your confidence score should be inversely related to the overallRiskScore — a high risk score (7+) should generally correspond to either a high-confidence PASS or a low-confidence INVEST, not a low-confidence decision in either direction.
    
Analysis Data:
${JSON.stringify(state.analysisData, null, 2)}

Financial Data (Context):
${JSON.stringify(state.financials, null, 2)}

SWOT Analysis:
${JSON.stringify(state.swotData, null, 2)}

Risk Assessment:
${JSON.stringify(state.riskData, null, 2)}
    `;
    
    const decision = await structuredLlm.invoke(prompt);
    return { finalDecision: decision };
  } catch (error) {
    console.error("[decideNode] Error:", error.message);
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return { error: "Our AI provider is experiencing high demand right now. Please try again in a minute." };
    }
    return { error: "An unexpected error occurred during AI analysis. Please try again." };
  }
}
