import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";

export function getLLM() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const primaryModel = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: geminiApiKey,
    temperature: 0.2,
  });

  const groqApiKey = process.env.GROQ_API_KEY;
  
  if (groqApiKey) {
    const fallbackModel = new ChatGroq({
      apiKey: groqApiKey,
      model: "llama3-8b-8192", // Fast and reliable fallback
      temperature: 0.2,
    });
    
    return primaryModel.withFallbacks({
      fallbacks: [fallbackModel]
    });
  }

  return primaryModel;
}
