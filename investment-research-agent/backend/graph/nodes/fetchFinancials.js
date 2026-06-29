import { getFinancials, getHistoricalPrices } from "../../services/yahooFinance.js";

export async function fetchFinancialsNode(state) {
  const { ticker } = state;
  
  if (!ticker || ticker === "UNKNOWN") {
    return { error: "Couldn't find financial data for this company — try the official company name or ticker symbol." };
  }

  try {
    const metrics = await getFinancials(ticker);
    const historicalPrices = await getHistoricalPrices(ticker);

    return {
      financials: {
        metrics,
        historicalPrices
      }
    };
  } catch (error) {
    console.error(`[fetchFinancialsNode] Yahoo Finance error for ${ticker}:`, error.message);
    return { error: "Couldn't find financial data for this company — try the official company name or ticker symbol." };
  }
}
