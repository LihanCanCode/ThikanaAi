import { NextRequest, NextResponse } from "next/server";
import { geminiFlash, parseGeminiJSON } from "@/lib/gemini";
import { parseQueryOffline } from "@/lib/parse-query-offline";
import type { ParsedSearchQuery } from "@/types";

export async function POST(req: NextRequest) {
  let query = "";
  try {
    const body = await req.json();
    query = body.query ?? "";
    if (!query.trim()) {
      return NextResponse.json({ filters: {}, source: "empty" });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const canUseGemini = apiKey && !apiKey.startsWith("placeholder") && (apiKey.startsWith("AIzaSy") || apiKey.startsWith("AQ."));

    if (canUseGemini) {
      try {
        const prompt = `You are a search query parser for a Bangladeshi rental platform called Thikana.
Parse the following mixed Bangla/English query into structured JSON search filters.

Query: "${query}"

Common Bangladeshi rental search patterns:
- "k" or "হাজার" = thousands (e.g. 12k = 12000, ১২ হাজার = 12000)
- "er niche" or "এর নিচে" = below/under (max price)
- "2 room" or "২ রুম" = 2 bedrooms
- Area names: Mirpur, Dhanmondi, Uttara, Bashundhara, Banani, Mohakhali, Gulshan, etc.
- "meye" or "মেয়ে" = female, "chele" or "ছেলে" = male
- "furnished" or "আসবাবপত্র সহ" = furnished

Return ONLY valid JSON with these optional fields (null if not mentioned):
{
  "area": string | null,
  "rooms": number | null,
  "max_rent": number | null,
  "min_rent": number | null,
  "type": "student" | "family" | "professional" | null,
  "for_gender": "male" | "female" | "any" | null
}`;

        const result = await geminiFlash.generateContent(prompt);
        const text = result.response.text();
        const filters = parseGeminiJSON<ParsedSearchQuery>(text);
        if (filters && Object.keys(filters).length > 0) {
          return NextResponse.json({ filters, source: "gemini" });
        }
      } catch (err) {
        console.warn("Gemini parse failed, using offline parser:", err);
      }
    }

    const filters = parseQueryOffline(query);
    return NextResponse.json({ filters, source: "offline" });
  } catch (error) {
    console.error("parse-query error:", error);
    return NextResponse.json({
      filters: query ? parseQueryOffline(query) : {},
      source: "offline",
      error: "Parse failed",
    });
  }
}
