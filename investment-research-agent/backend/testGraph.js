import dotenv from "dotenv";
dotenv.config();

import { compileGraph } from "./graph/index.js";

async function runGraphTest() {
  const graph = compileGraph();
  const company = "Tesla";
  console.log(`Starting graph test for company: ${company}\n`);

  try {
    const stream = await graph.stream(
      { companyName: company },
      { streamMode: "updates" }
    );

    for await (const chunk of stream) {
      const nodeName = Object.keys(chunk)[0];
      const stateUpdate = chunk[nodeName];
      console.log(`=== NODE COMPLETED: ${nodeName.toUpperCase()} ===`);
      console.log(JSON.stringify(stateUpdate, null, 2));
      console.log("--------------------------------------------------\n");
    }
    
    console.log("Graph test completed successfully.");
  } catch (error) {
    console.error("Graph Test Error:", error);
  }
}

runGraphTest();
