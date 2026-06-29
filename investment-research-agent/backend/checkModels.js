import dotenv from "dotenv";
dotenv.config();

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log(data.models.map(m => m.name).filter(n => n.includes("flash")));
  } catch (e) {
    console.error(e);
  }
}

checkModels();
