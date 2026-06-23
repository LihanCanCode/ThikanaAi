import { NextRequest, NextResponse } from "next/server";
import { geminiFlash, parseGeminiJSON } from "@/lib/gemini";
import type { GeneratedListing } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { area, rent, rooms, bathrooms, floor, furnishing, type, utilities, notes } = body;

    const prompt = `You are a professional bilingual real estate copywriter for Bangladesh.
Generate a compelling, accurate listing description in BOTH English and Bangla.

Property details:
- Area: ${area}, Dhaka
- Monthly Rent: ৳${rent}
- Bedrooms: ${rooms}
- Bathrooms: ${bathrooms}
- Floor: ${floor || "Not specified"}
- Furnishing: ${furnishing}
- Property type: ${type} housing
- Utilities included: ${utilities ? "Yes" : "No"}
- Landlord notes: "${notes || "None"}"

Instructions:
1. title_en: Short English title, max 60 chars, catchy and informative
2. title_bn: Bangla equivalent of the title
3. description_en: 3-4 sentences, professional tone, mention key selling points, avoid exaggeration
4. description_bn: Bangla equivalent of description_en (do not translate literally—make it natural Bangla)

Return ONLY valid JSON:
{
  "title_en": "...",
  "title_bn": "...",
  "description_en": "...",
  "description_bn": "..."
}`;

    const result = await geminiFlash.generateContent(prompt);
    const text = result.response.text();
    const generated = parseGeminiJSON<GeneratedListing>(text);

    if (!generated) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ listing: generated });
  } catch (error) {
    console.error("generate-listing error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
