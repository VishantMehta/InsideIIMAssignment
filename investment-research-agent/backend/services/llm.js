import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";

export function getStructuredLLM(schema, name) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const primaryModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: geminiApiKey,
    temperature: 0.2,
  });

  const primaryStructured = primaryModel.withStructuredOutput(schema, { name });

  const groqApiKey = process.env.GROQ_API_KEY;

  if (groqApiKey) {
    const fallbackModel = new ChatGroq({
      apiKey: groqApiKey,
      model: "llama-3.1-8b-instant", // Fast and reliable fallback
      temperature: 0.2,
    });

    const fallbackStructured = fallbackModel.withStructuredOutput(schema, { name });

    return primaryStructured.withFallbacks({
      fallbacks: [fallbackStructured]
    });
  }

  return primaryStructured;
}
