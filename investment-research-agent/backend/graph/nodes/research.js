import { searchTavily } from "../../services/tavily.js";

export async function researchNode(state) {
  if (state.error) return {}; // Skip if previous error

  try {
    const query = `${state.companyName} recent news, financials, competitors, and market position`;
    const results = await searchTavily(query);
    return { researchData: results };
  } catch (error) {
    console.error(`[researchNode] Tavily error for ${state.companyName}:`, error.message);
    return { researchData: "Couldn't fetch the latest news for this company. Continuing with available data." };
  }
}
