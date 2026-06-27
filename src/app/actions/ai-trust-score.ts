"use server";

import { createClient } from "@/lib/supabase/server";
import { computeAHash, hammingDistance } from "@/lib/image-hash";
import { geminiFlash } from "@/lib/gemini";

// ---------------------------------------------------------------------------
// Area median rents (BDT) — used for Price Anomaly scoring fallback
// ---------------------------------------------------------------------------
const AREA_MEDIANS: Record<string, number> = {
  "Mirpur-1": 9000,  "Mirpur-2": 10000, "Mirpur-10": 9500,
  "Mirpur-11": 9000, "Mirpur-12": 8500, "Dhanmondi": 18000,
  "Mohammadpur": 11000, "Shyamoli": 12000, "Uttara": 15000,
  "Bashundhara R/A": 14000, "Baridhara": 20000,
  "Gulshan-1": 25000, "Gulshan-2": 30000, "Banani": 22000,
  "Mohakhali": 14000, "Tejgaon": 12000, "Farmgate": 13000,
  "Rampura": 10000, "Badda": 9000,
};

// ---------------------------------------------------------------------------
// TrustScoreBreakdown — matches the exact 100-pt specification
// ---------------------------------------------------------------------------
export interface TrustScoreBreakdown {
  /** Price Anomaly — max 30 pts */
  price: { score: number; note: string };
  /** Photo Evidence — max 20 pts (5 per photo, capped at 4 photos) */
  photos: { score: number; note: string };
  /** Description Quality — max 20 pts */
  description: { score: number; note: string };
  /** NLP Duplicate Check — max 15 pts */
  duplicate: { score: number; note: string };
  /** Image Hash (pHash) Check — max 15 pts */
  photo_hash: { score: number; note: string };
  /** Sum of all categories (0–100) */
  totalScore: number;
}

// ---------------------------------------------------------------------------
// Helper: Term-frequency vector for cosine similarity
// ---------------------------------------------------------------------------
function getTermFrequency(text: string): Record<string, number> {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const tf: Record<string, number> = {};
  for (const w of words) tf[w] = (tf[w] || 0) + 1;
  return tf;
}

// ---------------------------------------------------------------------------
// Helper: Cosine similarity between two TF vectors
// ---------------------------------------------------------------------------
function cosineSimilarity(
  tf1: Record<string, number>,
  tf2: Record<string, number>
): number {
  const keys = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  let dot = 0, n1 = 0, n2 = 0;
  for (const k of keys) {
    const v1 = tf1[k] || 0;
    const v2 = tf2[k] || 0;
    dot += v1 * v2;
    n1  += v1 * v1;
    n2  += v2 * v2;
  }
  if (n1 === 0 || n2 === 0) return 0;
  return dot / (Math.sqrt(n1) * Math.sqrt(n2));
}

// Helper to convert Image URL to Base64 Part for Gemini
async function imageUrlToGenerativePart(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let mimeType = response.headers.get("content-type") || "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      mimeType = "image/jpeg";
    }
    return {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType,
      },
    };
  } catch (error) {
    console.error(`Error downloading image ${url} for Gemini trust score:`, error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Deterministic Scoring Fallback
// ---------------------------------------------------------------------------
function computeLocalTrustScore(
  item: {
    rent_bdt: number;
    area: string;
    photos: string[];
    description_en: string | null;
    description_bn: string | null;
  },
  maxSim: number,
  reusedPhoto: boolean
): TrustScoreBreakdown {
  const breakdown: Partial<TrustScoreBreakdown> = {};

  // 1. Price Anomaly (max 30 pts)
  const median = AREA_MEDIANS[item.area] ?? 12000;
  const ratio  = item.rent_bdt / median;
  let priceScore = 30;
  let priceNote = "Rent is within the expected range for this area.";

  if (ratio >= 0.5 && ratio <= 2.0) {
    priceScore = 30;
  } else if (ratio >= 0.3 && ratio < 0.5) {
    priceScore = 10;
    priceNote  = "Rent is suspiciously low — verify listing details.";
  } else if (ratio > 2.0) {
    priceScore = 15;
    priceNote  = "Rent is above average for this area.";
  } else {
    priceScore = 0;
    priceNote  = "Rent is extremely below market — possible fake listing.";
  }
  breakdown.price = { score: priceScore, note: priceNote };

  // 2. Photo Evidence (max 20 pts)
  const photoCount = (item.photos ?? []).length;
  const photoScore = Math.min(photoCount * 5, 20);
  breakdown.photos = {
    score: photoScore,
    note:  photoCount >= 4 ? "4+ photos provided — strong visual evidence."
         : photoCount >  0 ? `${photoCount} photo(s) provided — more photos increase trust.`
                           : "No photos — significantly reduces trust.",
  };

  // 3. Description Quality (max 20 pts)
  const descLen = (item.description_en?.length ?? 0) + (item.description_bn?.length ?? 0);
  const descScore = descLen > 200 ? 20 : descLen > 80 ? 12 : descLen > 0 ? 6 : 0;
  breakdown.description = {
    score: descScore,
    note:  descLen > 200 ? "Detailed description provided."
         : descLen > 80  ? "Description is moderate — more detail would help."
         : descLen > 0   ? "Very short description — reduces credibility."
                         : "No description — greatly reduces trust.",
  };

  // 4. Duplicate Check (max 15 pts)
  const dupScore = maxSim > 0.7 ? 0 : maxSim > 0.4 ? 5 : 15;
  const dupNote = maxSim > 0.7 ? "High similarity detected — possible duplicate description."
                : maxSim > 0.4 ? "Similar listing found — verify originality."
                : "No duplicate description found.";
  breakdown.duplicate = { score: dupScore, note: dupNote };

  // 5. Photo Hash Check (max 15 pts)
  const pHashScore = reusedPhoto ? 0 : 15;
  const pHashNote = reusedPhoto ? "Visually identical photo detected in another listing." : "Photos appear visually original.";
  breakdown.photo_hash = { score: pHashScore, note: pHashNote };

  breakdown.totalScore = priceScore + photoScore + descScore + dupScore + pHashScore;
  return breakdown as TrustScoreBreakdown;
}

// ---------------------------------------------------------------------------
// Core scoring engine — Hybrid Local + Gemini Multimodal analysis
// ---------------------------------------------------------------------------
async function computeTrustScore(
  item: {
    id: string;
    title_en: string;
    rent_bdt: number;
    area: string;
    photos: string[];
    description_en: string | null;
    description_bn: string | null;
    rooms?: number;
    furnishing?: string;
    utilities_included?: boolean;
  },
  table: "listings" | "room_shares"
): Promise<TrustScoreBreakdown> {
  let maxSim = 0;
  let reusedPhoto = false;

  const admin = await createClient();
  if (admin) {
    // 1. Local NLP Duplicate Check
    if (item.description_en) {
      try {
        const { data: otherDescs, error: descErr } = await admin
          .from(table)
          .select("description_en")
          .neq("id", item.id)
          .limit(300);

        if (!descErr && otherDescs) {
          const incomingTf = getTermFrequency(item.description_en);
          for (const row of otherDescs) {
            if (row.description_en) {
              const sim = cosineSimilarity(incomingTf, getTermFrequency(row.description_en));
              if (sim > maxSim) maxSim = sim;
            }
          }
        }
      } catch (err) {
        console.error("NLP Duplicate Check DB Error:", err);
      }
    }

    // 2. Local Photo similarity check using pHash
    if (item.photos && item.photos.length > 0) {
      try {
        const incomingHashes = (
          await Promise.all(
            item.photos.map(async (url) => {
              try { return await computeAHash(url); }
              catch { return null; }
            })
          )
        ).filter(Boolean) as string[];

        if (incomingHashes.length > 0) {
          const { data: storedRows, error: storedErr } = await admin
            .from(table)
            .select("photo_hashes")
            .neq("id", item.id)
            .not("photo_hashes", "is", null);

          if (!storedErr && storedRows) {
            outer: for (const row of storedRows) {
              if (!Array.isArray(row.photo_hashes)) continue;
              for (const storedHash of row.photo_hashes) {
                for (const inHash of incomingHashes) {
                  if (storedHash.length === 64 && inHash.length === 64) {
                    if (hammingDistance(inHash, storedHash) <= 10) {
                      reusedPhoto = true;
                      break outer;
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Photo pHash comparison error:", err);
      }
    }
  }

  // 3. Call Gemini Multimodal API to audit listing quality and verify photos
  try {
    const imageParts = (
      await Promise.all(
        (item.photos || []).slice(0, 3).map((url) => imageUrlToGenerativePart(url))
      )
    ).filter(Boolean) as any[];

    const prompt = `You are a real estate trust evaluation AI for Thikana, a housing portal in Dhaka, Bangladesh.
Analyze the following housing listing details and its attached photos to compute a structured Trust Score breakdown.

Listing Details:
- Title: "${item.title_en}"
- Area: "${item.area}"
- Rent: ${item.rent_bdt} BDT/month
- Bedrooms: ${item.rooms || 1}
- Description: "${item.description_en || ""}"
- Photo Count: ${item.photos.length}

Database Duplication Metrics (computed locally):
- Max Description Cosine Similarity: ${maxSim.toFixed(2)} (High duplication is >0.70, Moderate is >0.40)
- Exact/Near-identical Photo Found Reused in Database: ${reusedPhoto ? "Yes" : "No"}

Your job is to rate this listing out of 100 points based on the following 5 categories:
1. price (max 30 pts): Is the price realistic for the area "${item.area}"? If it is too low (e.g., <8,000 BDT for a 3-bedroom flat in Dhanmondi) or excessively high compared to standard prices, reduce the score. Provide a brief, helpful note explaining your assessment.
2. photos (max 20 pts): Analyze the visual content of the attached photos. Are they realistic interior/exterior photos of a real Dhaka residential property? If they look like stock photos from Google/Unsplash, high-end 3D architectural renders, or are unrelated/blurry, reduce the score. (Note: if no photos are provided, score is 0).
3. description (max 20 pts): Is the description detailed, authentic, and helpful for a prospective tenant? Very short or empty descriptions get low scores.
4. duplicate (max 15 pts): If Max Description Cosine Similarity is >0.7, score must be 0. If >0.4, score must be 5. Otherwise 15.
5. photo_hash (max 15 pts): If "Exact/Near-identical Photo Found Reused in Database" is "Yes", score must be 0 (indicating plagiarized photos). Otherwise 15.

Response Format:
Return ONLY a valid JSON object matching the following structure (do not include any markdown fences or extra text):
{
  "price": { "score": number, "note": "explanation" },
  "photos": { "score": number, "note": "explanation" },
  "description": { "score": number, "note": "explanation" },
  "duplicate": { "score": number, "note": "explanation" },
  "photo_hash": { "score": number, "note": "explanation" },
  "totalScore": number
}
`;

    const result = await geminiFlash.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            ...imageParts,
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.response.text().trim();
    const parsed = JSON.parse(responseText);

    if (
      parsed.price && 
      parsed.photos && 
      parsed.description && 
      parsed.duplicate && 
      parsed.photo_hash && 
      typeof parsed.totalScore === "number"
    ) {
      return parsed as TrustScoreBreakdown;
    }
    throw new Error("Invalid structure returned by Gemini");
  } catch (geminiError) {
    console.error("Gemini Trust Score API failed, falling back to local calculation:", geminiError);
    return computeLocalTrustScore(item, maxSim, reusedPhoto);
  }
}

// ---------------------------------------------------------------------------
// Public server action — called after listing creation or manual recalculation
// ---------------------------------------------------------------------------
export async function generateTrustScore(
  itemId: string,
  type: "room_share" | "listing"
): Promise<{ success: boolean; score?: TrustScoreBreakdown; error?: string }> {
  try {
    const admin = await createClient();
    if (!admin) throw new Error("Supabase client unavailable");

    const table = type === "room_share" ? "room_shares" : "listings";

    const { data: item, error: fetchErr } = await admin
      .from(table)
      .select("*")
      .eq("id", itemId)
      .single();

    if (fetchErr || !item) {
      console.error("fetchErr in generateTrustScore:", fetchErr);
      throw new Error("Item not found");
    }

    const breakdown = await computeTrustScore({
      id:                 item.id,
      title_en:           item.title_en || "Listing",
      rent_bdt:           item.rent_bdt,
      area:               item.area,
      photos:             item.photos || [],
      description_en:     item.description_en || null,
      description_bn:     item.description_bn || null,
      rooms:              item.rooms || 1,
      furnishing:         item.furnishing || "unfurnished",
      utilities_included: item.utilities_included || false,
    }, table);

    // Compute photo hashes to store in database so other listings can compare against them
    let photoHashes: string[] = [];
    if (item.photos && item.photos.length > 0) {
      try {
        photoHashes = (
          await Promise.all(
            item.photos.map(async (url: string) => {
              try { return await computeAHash(url); }
              catch { return null; }
            })
          )
        ).filter(Boolean) as string[];
      } catch (err) {
        console.error("Failed to compute photo hashes for storage:", err);
      }
    }

    // Persist back to the database
    await admin
      .from(table)
      .update({
        trust_score:           breakdown.totalScore,
        trust_score_breakdown: breakdown,
        photo_hashes:          photoHashes,
      })
      .eq("id", itemId);

    return { success: true, score: breakdown };
  } catch (error: any) {
    console.error("generateTrustScore error:", error);
    return { success: false, error: error.message };
  }
}
