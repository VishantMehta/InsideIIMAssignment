# AI Investment Research Agent

**🌟 Live Demo:** [https://inside-iim-vishant.vercel.app/](https://inside-iim-vishant.vercel.app/)
**🐙 GitHub Repo:** [https://github.com/VishantMehta/InsideIIMAssignment](https://github.com/VishantMehta/InsideIIMAssignment)

## Overview — What it does
The AI Investment Research Agent is an intelligent, multi-agent financial terminal that performs comprehensive investment analysis on any publicly traded company. By orchestrating a pipeline of specialized AI nodes, it autonomously gathers qualitative web data, retrieves hard financial metrics, and synthesizes them into structured SWOT analyses, risk assessments, and a final, data-driven investment decision (INVEST, HOLD, or PASS).

## How to run it — Setup and Run steps

### Prerequisites
- Node.js (v18+)
- API Keys: 
  - [Tavily](https://tavily.com/) (Web Search)
  - [Google Gemini](https://ai.google.dev/) (Primary LLM)
  - [Groq](https://groq.com/) (Fallback LLM)

### Setup
1. **Clone/Unzip the repository**
2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Add your API keys to the .env file:
   # GEMINI_API_KEY=...
   # GROQ_API_KEY=...
   # TAVILY_API_KEY=...
   npm run start
   ```
3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   # The frontend points to http://localhost:3001 by default via Vite proxy.
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

## How it works — Approach and Architecture
The system uses an **Agentic Workflow** built on top of [LangGraph.js](https://js.langchain.com/docs/langgraph/). Instead of a single zero-shot prompt, the reasoning is split into specialized, sequential nodes, maintaining a shared "State":

1. **Intake Node**: Validates and normalizes the company ticker.
2. **Fetch Financials Node**: Pulls quantitative data (P/E, Margins, Historical Prices) using `yahoo-finance2`.
3. **Research Node**: Uses Tavily API to fetch qualitative market news and competitor sentiment.
4. **Analysis Node**: Synthesizes structured strengths, risks, and health metrics.
5. **SWOT & Risk Nodes**: Generates a 2x2 SWOT matrix and scores the company on a 1-10 Risk Scale.
6. **Decision Node**: Reaches a final verdict (INVEST/PASS) with an inversely-weighted confidence score based on the risk profile.
7. **Responder Node**: Streams the entire state back to the React frontend using Server-Sent Events (SSE) for a real-time, progressive UI experience.

## Key decisions & trade-offs
- **Graph-Based Reasoning vs. Single Prompt**: We chose LangGraph to enforce a strict chain of thought. A single prompt could hallucinate financial data; the graph strictly separates data retrieval from LLM inference.
- **LLM Fallback Strategy**: Implemented `@langchain/groq` as a seamless fallback to Gemini. If Gemini hits a `429 Too Many Requests` limit (common on free tiers), the pipeline instantly switches to Groq's Llama 3.1 without failing the user experience.
- **File-based Caching**: To preserve API quotas during demonstrations, a file-system cache replays pre-computed JSON states with an artificial delay to simulate real-time agent progression.
- **Trade-off - Data Sources**: Currently relying on Yahoo Finance for free access. In a true enterprise application, a paid terminal API (like Bloomberg or FactSet) would provide more robust, institutional-grade data.

## Example Runs
- **Tesla (TSLA)**: 
  - *Risk Score*: 8/10
  - *Decision*: PASS (Low Confidence). The agent correctly identified that while Tesla is an AI leader, aggressive valuation (high P/E) and squeezed operating margins present macroeconomic risks.
- **Anthropic**:
  - *Graceful Degradation*: Since Anthropic is private and lacks a stock ticker, the Fetch Financials node gracefully handles the failure, and the agent completes the qualitative research based solely on Tavily web data.

## What you would improve with more time
1. **Multi-Agent Debate**: Introduce a "Bull Agent" and a "Bear Agent" to debate the stock before the Decision node makes a final verdict.
2. **Persistent Database**: Replace the JSON file cache with PostgreSQL/Redis to track historical analysis of stocks over time.
3. **User Authentication & Portfolios**: Allow users to log in and save companies to a watchlist, running automated daily research crons.


# LLM Chat Session Transcripts & Prompt Engineering Log

*This document contains raw, unedited excerpts from the primary pair-programming sessions used to build this AI Investment Research Agent. It demonstrates how I utilized the AI assistant not merely for boilerplate code generation, but as a sparring partner for complex systems architecture, resolving production edge-cases, and debugging deep library-specific issues (e.g., LangChain quirks).*

---

## Session 1: Architecting the Multi-Agent Pipeline

**Developer (Me):**
I need to build an AI Investment Research Agent using Node.js and React. If I just pass a stock ticker into a single LLM prompt, it's going to hallucinate financial data like P/E ratios and recent news, which is unacceptable for a financial tool. I want to build a deterministic pipeline using LangGraph.js where we retrieve real data first, and then pass it to the LLM. 
Can you propose a `GraphState` schema and the nodes we would need?

**AI Assistant:**
This is a great approach. Separating data retrieval from reasoning is the best way to prevent hallucinations in financial contexts. Here is a proposed `GraphState` for LangGraph:

```javascript
import { StateGraph } from "@langchain/langgraph";

const graphState = {
  companyName: {
    value: (x, y) => y ? y : x,
    default: () => ""
  },
  researchData: {
    value: (x, y) => y ? y : x,
    default: () => null
  },
  financials: {
    value: (x, y) => y ? y : x,
    default: () => null
  },
  decision: {
    value: (x, y) => y ? y : x,
    default: () => null
  }
};
```
I recommend these nodes:
1. `fetchDataNode`: Uses an API (like Yahoo Finance) to get hard metrics.
2. `researchNode`: Uses a search tool (like Tavily) to get qualitative news.
3. `decideNode`: The LLM reads the compiled state and outputs a final decision.

**Developer (Me):**
This is a solid start, but let's make the reasoning process deeper. I don't want the `decideNode` doing all the heavy lifting in one shot. Let's add intermediate nodes: `swotAnalysisNode` and `riskAssessmentNode`. The `decideNode` must be forced to read the outputs of those specific intermediate nodes before it can make a final verdict. 

**AI Assistant:**
*(AI provided updated State and node boilerplate...)*

---

## Session 2: Enforcing Structured Outputs and Logical Consistency

**Developer (Me):**
The `decideNode` is currently returning a massive block of unstructured text. I want to build a strict dashboard UI, so it needs to return predictable JSON. I also noticed a logical gap: the `riskAssessmentNode` will sometimes give a stock a 9/10 risk score, but the `decideNode` will output "Decision: INVEST, Confidence: 95%". This makes no mathematical sense. 
Update the system prompt for the `decideNode`. Use Zod for strict JSON output, and add a strict rule about confidence vs risk score.

**AI Assistant:**
Here is the updated implementation using Zod and `.withStructuredOutput()`:

```javascript
const decisionSchema = z.object({
  decision: z.enum(["INVEST", "PASS", "HOLD"]),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
  keyFactors: z.array(z.string())
});

// ... inside decideNode.js ...
const prompt = `You are the Lead Investment Strategist. Based on the comprehensive analysis below, make a final investment decision (INVEST, PASS, or HOLD).

CRITICAL CONSTRAINTS:
1. Explicitly state and justify the 'overallRiskScore' provided in the Risk Assessment.
2. Your confidence score MUST be inversely related to the overallRiskScore — a high risk score (7+) should generally correspond to either a high-confidence PASS or a low-confidence INVEST. Do not contradict the established risk profile.`
```

---

## Session 3: Real-Time UI via Server-Sent Events (SSE)

**Developer (Me):**
The LangGraph pipeline takes about 15 seconds to run through all 4 LLM nodes. If we just expose a standard REST endpoint, the frontend user stares at a frozen loading spinner for 15 seconds. Let's stream the progress of the graph in real-time. Can we use Server-Sent Events (SSE) to push each node's output to the React frontend exactly as it finishes?

**AI Assistant:**
Absolutely! Since `LangGraph` natively supports streaming, we can iterate over the stream and push JSON chunks to the client. Here is how you can update `server.js`:

```javascript
app.get("/api/research", async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await graph.stream({ companyName: req.query.company });
  
  for await (const chunk of stream) {
    const nodeName = Object.keys(chunk)[0];
    res.write(`data: ${JSON.stringify({ node: nodeName, ...chunk[nodeName] })}\n\n`);
  }
  res.write(`data: {"done": true}\n\n`);
  res.end();
});
```

---

## Session 4: Debugging a Deep LangChain Fallback Quirk

**Developer (Me):**
I deployed to production on Render, but I'm occasionally hitting `429 Too Many Requests` on the Gemini free tier. I want to add Groq (Llama 3.1) as a fallback model so the app doesn't crash for the user. I tried wrapping Gemini in `primaryModel.withFallbacks({ fallbacks: [groqModel] })`, but when I run the graph, it crashes entirely with this backend error:
`TypeError: llm.withStructuredOutput is not a function`

Why is this happening? `withStructuredOutput` worked perfectly before I added the fallback chain.

**AI Assistant:**
Ah! This is a known architectural quirk in LangChain's class hierarchy. 

When you wrap a model using `.withFallbacks()`, LangChain returns a `RunnableWithFallbacks` instance. This is a generic Runnable wrapper, not a specific `BaseChatModel`. The `.withStructuredOutput()` method is only available directly on the base chat model classes.

To fix this, you must bind the structured output schema to the base models *first*, and *then* combine the bound runnables into the fallback chain.

**Developer (Me):**
Ah, that makes perfect sense. So instead of duplicating this inside each of the 4 LLM nodes, let's refactor `services/llm.js`. Expose a factory function `getStructuredLLM(schema, name)` that does this binding safely for both Gemini and Groq, and returns the combined fallback chain.

**AI Assistant:**
Here is the refactored `services/llm.js` applying the factory pattern:

```javascript
export function getStructuredLLM(schema, name) {
  const primaryModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: process.env.GEMINI_API_KEY,
  });
  
  // 1. Bind structure to primary FIRST
  const primaryStructured = primaryModel.withStructuredOutput(schema, { name });

  if (process.env.GROQ_API_KEY) {
    const fallbackModel = new ChatGroq({
      model: "llama-3.1-8b-instant",
      apiKey: process.env.GROQ_API_KEY,
    });
    
    // 2. Bind structure to fallback
    const fallbackStructured = fallbackModel.withStructuredOutput(schema, { name });
    
    // 3. Return the combined chain
    return primaryStructured.withFallbacks({
      fallbacks: [fallbackStructured]
    });
  }

  return primaryStructured;
}
```

**Developer (Me):**
Perfect. I deployed the hotfix and the fallback is now seamlessly catching 429 quota errors in production without the UI breaking. The fallback architecture is complete.
