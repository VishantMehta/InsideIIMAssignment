import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state.js";
import { intakeNode } from "./nodes/intake.js";
import { researchNode } from "./nodes/research.js";
import { fetchFinancialsNode } from "./nodes/fetchFinancials.js";
import { analyzeNode } from "./nodes/analyze.js";
import { swotAnalysisNode } from "./nodes/swotAnalysis.js";
import { riskAssessmentNode } from "./nodes/riskAssessment.js";
import { decideNode } from "./nodes/decide.js";
import { respondNode } from "./nodes/respond.js";

const builder = new StateGraph(GraphState)
  .addNode("intake", intakeNode)
  .addNode("research", researchNode)
  .addNode("fetchFinancials", fetchFinancialsNode)
  .addNode("analyze", analyzeNode)
  .addNode("swotAnalysis", swotAnalysisNode)
  .addNode("riskAssessment", riskAssessmentNode)
  .addNode("decide", decideNode)
  .addNode("respond", respondNode)
  .addEdge(START, "intake")
  // Adding conditional edges to short-circuit if error exists
  .addConditionalEdges("intake", (state) => state.error ? END : "research")
  .addConditionalEdges("research", (state) => state.error ? END : "fetchFinancials")
  .addConditionalEdges("fetchFinancials", (state) => state.error ? END : "analyze")
  .addConditionalEdges("analyze", (state) => state.error ? END : "swotAnalysis")
  .addConditionalEdges("swotAnalysis", (state) => state.error ? END : "riskAssessment")
  .addConditionalEdges("riskAssessment", (state) => state.error ? END : "decide")
  .addConditionalEdges("decide", (state) => state.error ? END : "respond")
  .addEdge("respond", END);

export const compileGraph = () => builder.compile();
