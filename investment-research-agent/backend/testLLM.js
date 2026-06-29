import dotenv from "dotenv";
dotenv.config();

import { getLLM } from "./services/llm.js";

async function testLLM() {
  try {
    const llm = getLLM();
    console.log("Calling Gemini 3.5 Flash directly...");
    const response = await llm.invoke("Hello, what model are you?");
    console.log("\nRAW RESPONSE:");
    console.log(response.content);
  } catch (error) {
    console.error("LLM Test Error:", error);
  }
}

testLLM();
