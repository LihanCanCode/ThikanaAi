"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface TrustScoreBreakdown {
  priceFairness: number; // out of 25
  photoQuality: number; // out of 25
  organizedRoom: number; // out of 25
  noDuplicates: number; // out of 25
  totalScore: number;
  reasoning: string;
}

export async function generateTrustScore(
  itemId: string,
  type: "room_share" | "listing"
): Promise<{ success: boolean; score?: TrustScoreBreakdown; error?: string }> {
  try {
    const admin = createAdminClient();
    if (!admin) throw new Error("Server error");

    const table = type === "room_share" ? "room_shares" : "listings";
    
    // 1. Fetch item details
    const { data: item, error: fetchErr } = await admin
      .from(table)
      .select("*")
      .eq("id", itemId)
      .single();

    if (fetchErr || !item) throw new Error("Item not found");

    // 2. Fake / Duplicate Check (25 points)
    // Check if another creator posted a listing with same rent in same area in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: duplicates } = await admin
      .from(table)
      .select("id")
      .eq("area", item.area)
      .eq("rent_bdt", item.rent_bdt)
      .neq(type === "room_share" ? "creator_id" : "landlord_id", item.creator_id || item.landlord_id || "null")
      .gte("created_at", sevenDaysAgo);

    const isDuplicate = (duplicates && duplicates.length > 0);
    const noDuplicatesScore = isDuplicate ? 0 : 25;

    // If there are no photos, AI can't score photos or organization.
    const photos = (item.photos as string[]) || [];
    let photoQuality = 0;
    let organizedRoom = 0;
    let priceFairness = 15; // default fallback
    let reasoning = "Calculated manually due to missing photos or AI error.";

    if (photos.length > 0 && process.env.GOOGLE_GEMINI_API_KEY) {
      // 3. Call Gemini Vision
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Fetch the first photo to send to Gemini
      const imgRes = await fetch(photos[0]);
      if (imgRes.ok) {
        const arrayBuffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        
        const prompt = `
          You are an expert real estate AI analyst for student housing in Bangladesh.
          Analyze this room/flat photo and the following details:
          Rent: ${item.rent_bdt} BDT
          Area: ${item.area}

          Please provide a strict JSON response with no markdown formatting or code blocks. The JSON must have these exactly 4 keys:
          - "photoQuality": a number from 0 to 25. (High if well-lit, clear, and clearly shows a room. Low if blurry, dark, or looks like a fake stock photo).
          - "organizedRoom": a number from 0 to 25. (High if tidy and clean. Low if clothes are everywhere, unmade beds, messy).
          - "priceFairness": a number from 0 to 25. (Is ${item.rent_bdt} BDT fair for ${item.area}? 25 means perfectly fair/great deal. 0 means massive scam or way too expensive).
          - "reasoning": a 1-2 sentence string summarizing your thoughts on the price and photo.
        `;

        const imagePart = {
          inlineData: {
            data: base64,
            mimeType: imgRes.headers.get("content-type") || "image/jpeg",
          },
        };

        const aiResult = await model.generateContent([prompt, imagePart]);
        const responseText = aiResult.response.text();
        
        // Safely parse JSON out of potential markdown block
        const cleanJsonStr = responseText.replace(/^```json/m, "").replace(/```$/m, "").trim();
        try {
          const aiScores = JSON.parse(cleanJsonStr);
          photoQuality = Math.min(25, Math.max(0, aiScores.photoQuality || 0));
          organizedRoom = Math.min(25, Math.max(0, aiScores.organizedRoom || 0));
          priceFairness = Math.min(25, Math.max(0, aiScores.priceFairness || 0));
          reasoning = aiScores.reasoning || "AI completed analysis successfully.";
        } catch (e) {
          console.error("Failed to parse Gemini JSON", e);
        }
      }
    } else {
      // Fallback heuristics if no photos or no API key
      photoQuality = photos.length >= 3 ? 25 : photos.length > 0 ? 15 : 0;
      organizedRoom = photos.length > 0 ? 15 : 0; // Can't tell if organized without AI
      priceFairness = 20; // Generic fallback
    }

    // 4. Final Calculation
    const totalScore = priceFairness + photoQuality + organizedRoom + noDuplicatesScore;

    const breakdown: TrustScoreBreakdown = {
      priceFairness,
      photoQuality,
      organizedRoom,
      noDuplicates: noDuplicatesScore,
      totalScore,
      reasoning
    };

    // 5. Save to database
    await admin
      .from(table)
      .update({
        trust_score: totalScore,
        trust_score_breakdown: breakdown as any
      })
      .eq("id", itemId);

    return { success: true, score: breakdown };
  } catch (error: any) {
    console.error("AI Trust Score Error:", error);
    return { success: false, error: error.message };
  }
}
