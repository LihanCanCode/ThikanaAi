"use server";

import { createClient } from "@/lib/supabase/server";
import { computeAHash, hammingDistance } from "@/lib/image-hash";

// ---------------------------------------------------------------------------
// Area median rents (BDT) — used for Price Anomaly scoring
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

// ---------------------------------------------------------------------------
// Core scoring engine — pure deterministic math, zero AI/LLM calls
// ---------------------------------------------------------------------------
async function computeTrustScore(item: {
  id: string;
  rent_bdt: number;
  area: string;
  photos: string[];
  description_en: string | null;
  description_bn: string | null;
  photo_hashes?: string[] | null;
}): Promise<TrustScoreBreakdown> {

  const breakdown: Partial<TrustScoreBreakdown> = {};

  // ─── 1. Price Anomaly (max 30 pts) ───────────────────────────────────────
  const median = AREA_MEDIANS[item.area] ?? 12000;
  const ratio  = item.rent_bdt / median;

  let priceScore: number;
  let priceNote: string;

  if (ratio >= 0.5 && ratio <= 2.0) {
    priceScore = 30;
    priceNote  = "Rent is within the expected range for this area.";
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

  // ─── 2. Photo Evidence (max 20 pts, 5 pts per photo) ────────────────────
  const photoCount = (item.photos ?? []).length;
  const photoScore = Math.min(photoCount * 5, 20);
  breakdown.photos = {
    score: photoScore,
    note:  photoCount >= 4 ? "4+ photos provided — strong visual evidence."
         : photoCount >  0 ? `${photoCount} photo(s) provided — more photos increase trust.`
                           : "No photos — significantly reduces trust.",
  };

  // ─── 3. Description Quality (max 20 pts) ────────────────────────────────
  const descLen = (item.description_en?.length ?? 0)
                + (item.description_bn?.length ?? 0);
  const descScore = descLen > 200 ? 20
                  : descLen > 80  ? 12
                  : descLen > 0   ? 6
                                  : 0;
  breakdown.description = {
    score: descScore,
    note:  descLen > 200 ? "Detailed description provided."
         : descLen > 80  ? "Description is moderate — more detail would help."
         : descLen > 0   ? "Very short description — reduces credibility."
                         : "No description — greatly reduces trust.",
  };

  // ─── 4 & 5. DB-dependent checks (NLP + pHash) ───────────────────────────
  let dupScore   = 15;
  let dupNote    = "Duplicate check skipped.";
  let pHashScore = 15;
  let pHashNote  = "Photo hash check skipped.";

  try {
    const admin = await createClient();
    if (admin) {

      // ── 4. NLP Duplicate Check (max 15 pts) ───────────────────────────
      if (item.description_en) {
        const { data: otherDescs, error: descErr } = await admin
          .from("listings")
          .select("description_en")
          .neq("id", item.id)
          .limit(300);

        if (!descErr && otherDescs) {
          const incomingTf = getTermFrequency(item.description_en);
          let maxSim = 0;
          for (const row of otherDescs) {
            if (row.description_en) {
              const sim = cosineSimilarity(incomingTf, getTermFrequency(row.description_en));
              if (sim > maxSim) maxSim = sim;
            }
          }

          // Rule: similarity > 0.7 → 0 pts | > 0.4 → 5 pts | else → 15 pts
          if (maxSim > 0.7) {
            dupScore = 0;
            dupNote  = "High similarity detected — possible duplicate description.";
          } else if (maxSim > 0.4) {
            dupScore = 5;
            dupNote  = "Similar listing found — verify originality.";
          } else {
            dupScore = 15;
            dupNote  = "No duplicate description found.";
          }
        } else {
          dupNote = "Duplicate check skipped (DB error).";
        }
      } else {
        dupScore = 0;
        dupNote  = "No description provided for NLP duplicate check.";
      }

      // ── 5. Image Hash Check (max 15 pts) ──────────────────────────────
      if (item.photos && item.photos.length > 0) {
        try {
          // Compute aHash for each photo of this listing
          const incomingHashes = (
            await Promise.all(
              item.photos.map(async (url) => {
                try { return await computeAHash(url); }
                catch { return null; }
              })
            )
          ).filter(Boolean) as string[];

          if (incomingHashes.length === 0) {
            pHashScore = 5;
            pHashNote  = "Photo similarity check failed (could not fetch images).";
          } else {
            // Compare against hashes stored in all other listings
            const { data: storedRows, error: storedErr } = await admin
              .from("listings")
              .select("photo_hashes")
              .neq("id", item.id)
              .not("photo_hashes", "is", null);

            if (!storedErr && storedRows) {
              let reused = false;
              outer: for (const row of storedRows) {
                if (!Array.isArray(row.photo_hashes)) continue;
                for (const storedHash of row.photo_hashes) {
                  for (const inHash of incomingHashes) {
                    if (storedHash.length === 64 && inHash.length === 64) {
                      // Rule: Hamming Distance <= 10 → image is stolen → 0 pts
                      if (hammingDistance(inHash, storedHash) <= 10) {
                        reused = true;
                        break outer;
                      }
                    }
                  }
                }
              }

              if (reused) {
                pHashScore = 0;
                pHashNote  = "Visually identical photo detected in another listing.";
              } else {
                pHashScore = 15;
                pHashNote  = "Photos appear visually original.";
              }
            } else {
              pHashNote = "Photo hash check skipped (DB error).";
            }
          }
        } catch (err) {
          console.error("pHash error:", err);
          pHashScore = 5;
          pHashNote  = "Photo similarity check failed (runtime error).";
        }
      } else {
        pHashScore = 0;
        pHashNote  = "No photos provided — image hash check skipped.";
      }
    }
  } catch (dbErr) {
    console.error("DB error in computeTrustScore:", dbErr);
    dupNote   = "Duplicate check unavailable (DB error).";
    pHashNote = "Photo check unavailable (DB error).";
  }

  breakdown.duplicate   = { score: dupScore,   note: dupNote   };
  breakdown.photo_hash  = { score: pHashScore,  note: pHashNote };

  // ─── Final total (capped at 100) ─────────────────────────────────────────
  const totalScore = Math.min(
    priceScore + photoScore + descScore + dupScore + pHashScore,
    100
  );
  breakdown.totalScore = totalScore;

  return breakdown as TrustScoreBreakdown;
}

// ---------------------------------------------------------------------------
// Public server action — called after listing creation
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
      id:             item.id,
      rent_bdt:       item.rent_bdt,
      area:           item.area,
      photos:         item.photos || [],
      description_en: item.description_en || null,
      description_bn: item.description_bn || null,
      photo_hashes:   item.photo_hashes   || null,
    });

    // Persist back to the database
    await admin
      .from(table)
      .update({
        trust_score:           breakdown.totalScore,
        trust_score_breakdown: breakdown,
      })
      .eq("id", itemId);

    return { success: true, score: breakdown };
  } catch (error: any) {
    console.error("generateTrustScore error:", error);
    return { success: false, error: error.message };
  }
}
