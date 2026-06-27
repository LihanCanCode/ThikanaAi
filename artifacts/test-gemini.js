const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

async function run() {
  try {
    console.log("Key:", process.env.GOOGLE_GEMINI_API_KEY ? "Found" : "Missing");
    // We can also try listing models
    // Since ListModels might not be directly exposed in the same way, we can fetch via fetch
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GEMINI_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("Models list response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

run();
