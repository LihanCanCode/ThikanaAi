import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

/** Fast model for parsing & generation */
export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.3,
    topP: 0.9,
    maxOutputTokens: 1024,
  },
});

/** Pro model for neighborhood Q&A (grounded) */
export const geminiPro = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  generationConfig: {
    temperature: 0.4,
    topP: 0.9,
    maxOutputTokens: 2048,
  },
});

/** Parse a JSON response safely from Gemini */
export function parseGeminiJSON<T>(text: string): T | null {
  try {
    // Strip markdown code fences if present
    const cleaned = text
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/gi, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}
