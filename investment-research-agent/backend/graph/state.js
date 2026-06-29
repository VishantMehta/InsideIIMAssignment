import { Annotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  companyName: Annotation(),
  ticker: Annotation(),
  researchData: Annotation(),
  financials: Annotation(),
  analysisData: Annotation(),
  swotData: Annotation(),
  riskData: Annotation(),
  finalDecision: Annotation(),
  error: Annotation(),
});
