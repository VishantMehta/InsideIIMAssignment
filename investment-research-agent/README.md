# AI Investment Research Agent

## Overview
The AI Investment Research Agent is an autonomous, full-stack application that researches a given company and provides a structured "INVEST" or "PASS" decision. It uses LangGraph.js to orchestrate an AI workflow, Tavily for real-time web research, and Gemini 3.5 Flash for deep, structured analysis.

## How to run it (setup/env/run steps)

1. **Clone & Install**
   - Backend:
     ```bash
     cd backend
     npm install
     ```
   - Frontend:
     ```bash
     cd frontend
     npm install
     ```

2. **Environment Variables**
   - Create a `.env` file in the `/backend` directory based on the `.env.example`:
     ```env
     TAVILY_API_KEY=your_tavily_key
     GEMINI_API_KEY=your_gemini_key
     PORT=3001
     ```

3. **Run the Application**
   - Start the backend server:
     ```bash
     cd backend
     node server.js
     ```
   - Start the frontend server (in a separate terminal):
     ```bash
     cd frontend
     npm run dev
     ```
   - Open your browser to the local Vite URL (typically `http://localhost:5173`).

## How it works (architecture + diagram in words)

The application features a decoupled architecture built on Node.js/Express (backend) and React/Vite (frontend).

### Architecture Diagram (in words)
1. **Frontend (React)**: The user submits a company name. The UI opens a Server-Sent Events (SSE) connection (`EventSource`) to the backend.
2. **Backend (Express)**: Receives the request and kicks off a **LangGraph StateGraph**.
3. **LangGraph Nodes**:
   - `[ Intake ]`: Validates the company name input.
   - `[ Research ]`: Reaches out to the Tavily API to gather live web data (news, financials, competitors).
   - `[ Analyze ]`: Sends the research to the LLM with a strict Zod schema, extracting structured insights (strengths, risks).
   - `[ Decide ]`: Takes the structured analysis and tasks the LLM with generating a final "INVEST" or "PASS" decision with confidence scores.
   - `[ Respond ]`: Formats the final state.
4. **Streaming Updates**: Instead of blocking until the graph finishes, the backend streams the state updates as each node completes using `graph.stream({ streamMode: "updates" })`. The frontend listens and visually ticks off the progress boxes live.

## Key decisions & trade-offs
- **Server-Sent Events (SSE) over WebSockets**: I chose SSE because the communication is strictly unidirectional (backend -> frontend). It's simpler to implement, natively supported by browsers via `EventSource`, and avoids the overhead of managing WebSocket connections for a simple progress stream.
- **Structured Output natively via LangChain**: Instead of asking the LLM to reply in JSON and parsing it with Regex, I utilized `.withStructuredOutput(zodSchema)`. This leverages the model's native function-calling/schema-enforcement capabilities, making the pipeline significantly more robust and eliminating parsing crashes.
- **Fail-Fast Error Handling in LangGraph**: Conditional edges were implemented between every node. If `state.error` is populated by an exception (e.g., Tavily API timeout), the graph routes directly to `END`, immediately streaming the error to the UI instead of throwing an unhandled exception in the backend.

## Example runs
*Placeholder to be filled in with real output during the interview/testing phase.*
- **Company**: [Company Name]
  - **Decision**: [INVEST / PASS]
  - **Confidence**: [%]
  - **Reasoning**: [Reasoning Text]

## What I'd improve with more time
- **Research Depth / Multi-Agent System**: Break the research node into specialized sub-agents (e.g., a "Financial Analyst" agent that pulls Yahoo Finance data, and a "Sentiment Analyst" agent that checks news headlines).
- **Caching**: Implement a Redis or simple in-memory cache to store research and decisions for frequently searched companies (like Apple or Tesla) for a few hours to save LLM tokens and API calls.
- **Human-in-the-Loop**: Allow the user to see the initial research data and optionally inject their own context before the graph proceeds to the `Analyze` node.
