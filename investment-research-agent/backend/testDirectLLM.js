import dotenv from "dotenv";
dotenv.config();

async function testDirectLLM() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = "gemini-3.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log(`Calling ${model} directly via REST...`);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello, what model are you?" }] }]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("\nRAW RESPONSE:");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Direct LLM Test Error:", error);
  }
}

testDirectLLM();
