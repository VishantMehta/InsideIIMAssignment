import { resolveTicker } from "../../services/yahooFinance.js";

export async function intakeNode(state) {
  const companyName = state.companyName?.trim();
  if (!companyName) {
    throw new Error("Company name is required.");
  }
  try {
    const ticker = await resolveTicker(companyName);
    
    return { 
      companyName,
      ticker: ticker || "UNKNOWN"
    };
  } catch (error) {
    console.error(`[intakeNode] Error resolving ticker for ${companyName}:`, error.message);
    return { error: "Couldn't initialize the research. Please try again with a valid company name." };
  }
}
