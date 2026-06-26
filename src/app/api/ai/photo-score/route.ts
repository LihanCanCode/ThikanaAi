import { NextRequest, NextResponse } from "next/server";
import { geminiFlash, parseGeminiJSON } from "@/lib/gemini";

type PhotoScoreResult = {
  score: number;
  issues: string[];
  suggestion: string;
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith("placeholder")) {
      return NextResponse.json({ skipped: true, reason: "No Gemini API Key" });
    }

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "Missing imageBase64 or mimeType" }, { status: 400 });
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
      You are a real estate photography expert. Evaluate the provided photo for a rental listing.
      Rate the photo on a scale of 0 to 100 based on the following criteria:
      - Brightness (Is it well-lit?)
      - Clarity (Is it sharp or blurry?)
      - Subject (Does it show the interior clearly?)
      - Staging (Is the space clean and presentable?)

      Return ONLY a JSON object with the following fields:
      - "score": (number) The overall score from 0 to 100.
      - "issues": (array of strings) A list of specific issues found (if any).
      - "suggestion": (string) One actionable tip for the landlord to improve the photo.
    `;

    const result = await geminiFlash.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType
        }
      }
    ]);

    const text = result.response.text();
    const parsed = parseGeminiJSON<PhotoScoreResult>(text);

    if (!parsed || typeof parsed.score !== "number") {
      throw new Error("Invalid Gemini response format");
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Photo scoring failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
