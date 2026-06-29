import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { compileGraph } from "./graph/index.js";

dotenv.config();

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "https://inside-iim-vishant.vercel.app"] }));
app.use(express.json());

const PORT = process.env.PORT || 3001;
const graph = compileGraph();

import { getCache, setCache } from "./services/cache.js";

// Utility to sleep for artificial delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.get("/api/research", async (req, res) => {
  const company = req.query.company;
  if (!company) {
    return res.status(400).json({ error: "Company name is required as a query parameter." });
  }

  // Set headers for SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const cacheKey = company.trim().toLowerCase();

  try {
    const cachedState = getCache(cacheKey);

    if (cachedState) {
      console.log(`[CACHE HIT] Returning cached data for ${company}`);
      // Replay events artificially for the UI
      const nodesToReplay = [
        "intake", "research", "fetchFinancials", "analyze",
        "swotAnalysis", "riskAssessment", "decide", "respond"
      ];

      for (const node of nodesToReplay) {
        // Send a minimal payload indicating this node finished, matching the real graph
        // To be accurate, we just send the whole cached state back for every node but keyed to the nodeName
        // Or we just send the specific properties that the node usually returns.
        // It's safer to just send the whole cached state on the final node, and empty objects for intermediate nodes 
        // to progress the UI.
        const eventData = { node };

        if (node === "respond") {
          // Send all data on the last node
          Object.assign(eventData, cachedState);
          eventData.isCached = true;
        }

        res.write(`data: ${JSON.stringify(eventData)}\n\n`);
        await sleep(300); // 300ms artificial delay
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      return res.end();
    }

    console.log(`[CACHE MISS] Running graph for ${company}`);
    const stream = await graph.stream(
      { companyName: company },
      { streamMode: "updates" }
    );

    let finalAccumulatedState = {};

    for await (const chunk of stream) {
      const nodeName = Object.keys(chunk)[0];
      const stateUpdate = chunk[nodeName];

      // Accumulate state for caching
      Object.assign(finalAccumulatedState, stateUpdate);

      const eventData = {
        node: nodeName,
        ...stateUpdate,
        isCached: false
      };

      res.write(`data: ${JSON.stringify(eventData)}\n\n`);

      if (stateUpdate.error) {
        // Just break or let it finish
      }
    }

    // Save successful run to cache (only if we have a final decision)
    if (finalAccumulatedState.finalDecision) {
      setCache(cacheKey, finalAccumulatedState);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Graph execution error:", error);
    res.write(`data: ${JSON.stringify({ error: "Something went wrong while analyzing this company. Please try again." })}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


