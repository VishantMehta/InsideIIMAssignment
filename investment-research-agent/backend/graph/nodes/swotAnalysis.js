import { getLLM } from "../../services/llm.js";
import { z } from "zod";

const swotSchema = z.object({
  strengths: z.array(z.string()).describe("Internal strengths of the company"),
  weaknesses: z.array(z.string()).describe("Internal weaknesses of the company"),
  opportunities: z.array(z.string()).describe("External opportunities for growth or improvement"),
  threats: z.array(z.string()).describe("External threats to the company's success")
});

export async function swotAnalysisNode(state) {
  if (state.error) return {};

  try {
    const llm = getLLM();
    const structuredLlm = llm.withStructuredOutput(swotSchema, { name: "swotAnalysis" });
    
    const prompt = `Perform a comprehensive SWOT analysis for ${state.companyName} based on the provided qualitative research and quantitative financial data.
    
Research Data:
${JSON.stringify(state.researchData, null, 2)}

Financial Data:
${JSON.stringify(state.financials, null, 2)}
    `;
    
    const swot = await structuredLlm.invoke(prompt);
    return { swotData: swot };
  } catch (error) {
    console.error("[swotAnalysisNode] Error:", error.message);
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return { error: "Our AI provider is experiencing high demand right now. Please try again in a minute." };
    }
    return { error: "An unexpected error occurred during AI analysis. Please try again." };
  }
}
