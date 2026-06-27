import { NextRequest, NextResponse } from "next/server";
import { geminiFlash, parseGeminiJSON } from "@/lib/gemini";

const AREA_MEDIANS: Record<string, number> = {
  "Mirpur-1": 9000, "Mirpur-2": 10000, "Mirpur-10": 9500, "Mirpur-11": 9000, "Mirpur-12": 8500,
  "Dhanmondi": 18000, "Mohammadpur": 11000, "Shyamoli": 12000,
  "Uttara": 15000, "Bashundhara R/A": 14000, "Baridhara": 20000,
  "Gulshan-1": 25000, "Gulshan-2": 30000, "Banani": 22000,
  "Mohakhali": 14000, "Tejgaon": 12000, "Farmgate": 13000,
  "Rampura": 10000, "Badda": 9000,
};

type RentEstimateResult = {
  min: number;
  max: number;
  median: number;
  reasoning: string;
};

export async function POST(req: NextRequest) {
  try {
    const { area, rooms, furnishing, floor } = await req.json();

    const safeArea = area || "Mirpur-1";
    const safeRooms = Math.max(1, rooms || 1);
    const safeFurnishing = furnishing || "unfurnished";
    const baseMedian = AREA_MEDIANS[safeArea] ?? 11000;

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const canUseGemini = apiKey && !apiKey.startsWith("placeholder") && (apiKey.startsWith("AIzaSy") || apiKey.startsWith("AQ."));

    if (canUseGemini) {
      try {
        const prompt = `
          You are an expert real estate valuer for residential properties in Dhaka, Bangladesh.
          Provide a realistic monthly rent estimate in BDT for a flat with the following details:
          - Area: ${safeArea}
          - Rooms: ${safeRooms}
          - Furnishing: ${safeFurnishing}
          - Floor: ${floor !== undefined ? floor : "Unknown"}
          
          For reference, the baseline median rent for a standard 1-room unfurnished flat in this area is around ${baseMedian} BDT.

          Return ONLY a valid JSON object with the following keys:
          - min: (number) The minimum realistic rent.
          - max: (number) The maximum realistic rent.
          - median: (number) The expected median rent.
          - reasoning: (string) A 1-sentence reasoning in English explaining why this range makes sense based on the area and property details.
        `;

        const result = await geminiFlash.generateContent(prompt);
        const text = result.response.text();
        const parsed = parseGeminiJSON<RentEstimateResult>(text);

        if (parsed && typeof parsed.min === "number" && typeof parsed.max === "number" && typeof parsed.median === "number") {
          return NextResponse.json({
            min: parsed.min,
            max: parsed.max,
            median: parsed.median,
            area: safeArea,
            reasoning: parsed.reasoning || "Estimated by Gemini AI.",
            sample_label: `AI estimate based on ${safeArea} market data`,
            source: "gemini"
          });
        }
      } catch (geminiError) {
        console.error("Gemini rent estimate failed, falling back to offline:", geminiError);
      }
    }

    // Fallback: Offline Calculation
    let adjusted = baseMedian * (1 + (safeRooms - 1) * 0.20);

    if (safeFurnishing === "semi") adjusted *= 1.12;
    else if (safeFurnishing === "fully") adjusted *= 1.28;

    if (floor !== undefined && floor !== null) {
      if (floor === 0) adjusted *= 0.92; // ground floor
      else if (floor >= 1 && floor <= 3) adjusted *= 1.0;
      else if (floor >= 4) adjusted *= 1.06;
    }

    const min = Math.round((adjusted * 0.85) / 500) * 500;
    const max = Math.round((adjusted * 1.15) / 500) * 500;
    const median = Math.round(adjusted / 500) * 500;

    return NextResponse.json({
      min,
      max,
      median,
      area: safeArea,
      sample_label: "Based on area price data",
      source: "offline",
      reasoning: "Estimated using offline rule-based calculation."
    });
  } catch (error) {
    console.error("rent-estimate error:", error);
    return NextResponse.json({ error: "Failed to estimate rent" }, { status: 500 });
  }
}
