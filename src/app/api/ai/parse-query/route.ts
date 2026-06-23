import { NextRequest, NextResponse } from "next/server";
import { geminiFlash, parseGeminiJSON } from "@/lib/gemini";
import type { ParsedSearchQuery } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ filters: {} });
    }

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
  "for_gender": "male" | "female" | "any" | null,
  "furnishing": "unfurnished" | "semi" | "fully" | null
}`;

    const result = await geminiFlash.generateContent(prompt);
    const text = result.response.text();
    const filters = parseGeminiJSON<ParsedSearchQuery>(text);

    return NextResponse.json({ filters: filters ?? {}, raw: text });
  } catch (error) {
    console.error("parse-query error:", error);
    return NextResponse.json({ filters: {}, error: "Parse failed" }, { status: 500 });
  }
}
