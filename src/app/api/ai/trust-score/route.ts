import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeAHash, hammingDistance } from "@/lib/image-hash";

// Seed data for trust score computation (area median rents in BDT)
const AREA_MEDIANS: Record<string, number> = {
  "Mirpur-1": 9000, "Mirpur-2": 10000, "Mirpur-10": 9500, "Mirpur-11": 9000, "Mirpur-12": 8500,
  "Dhanmondi": 18000, "Mohammadpur": 11000, "Shyamoli": 12000,
  "Uttara": 15000, "Bashundhara R/A": 14000, "Baridhara": 20000,
  "Gulshan-1": 25000, "Gulshan-2": 30000, "Banani": 22000,
  "Mohakhali": 14000, "Tejgaon": 12000, "Farmgate": 13000,
  "Rampura": 10000, "Badda": 9000,
};

// Helper: Term frequency vector from string
function getTermFrequency(text: string): Record<string, number> {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const tf: Record<string, number> = {};
  for (const w of words) {
    tf[w] = (tf[w] || 0) + 1;
  }
  return tf;
}

// Helper: Cosine similarity
function cosineSimilarity(tf1: Record<string, number>, tf2: Record<string, number>): number {
  const keys = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  for (const k of keys) {
    const v1 = tf1[k] || 0;
    const v2 = tf2[k] || 0;
    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }
  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

async function computeTrustScore(listing: {
  id?: string;
  rent_bdt: number;
  area: string;
  photos: string[];
  description_en: string | null;
  description_bn: string | null;
}) {
  let score = 0;
  const breakdown: Record<string, { score: number; note: string }> = {};

  // 1. Price anomaly (30 pts)
  const median = AREA_MEDIANS[listing.area] ?? 12000;
  const ratio = listing.rent_bdt / median;
  if (ratio >= 0.5 && ratio <= 2.0) {
    score += 30;
    breakdown.price = { score: 30, note: "Rent is within expected range for this area." };
  } else if (ratio >= 0.3 && ratio < 0.5) {
    score += 10;
    breakdown.price = { score: 10, note: "Rent is suspiciously low — verify listing details." };
  } else if (ratio > 2.0) {
    score += 15;
    breakdown.price = { score: 15, note: "Rent is above average for this area." };
  } else {
    score += 0;
    breakdown.price = { score: 0, note: "Rent is extremely below market — possible fake listing." };
  }

  // 2. Photo count (20 pts)
  const photoCount = listing.photos?.length ?? 0;
  const photoScore = Math.min(photoCount * 5, 20);
  score += photoScore;
  breakdown.photos = {
    score: photoScore,
    note: photoCount >= 4
      ? "Good number of photos provided."
      : photoCount > 0
      ? "More photos would increase trust."
      : "No photos — significantly reduces trust.",
  };

  // 3. Description completeness (20 pts)
  const descLen = (listing.description_en?.length ?? 0) + (listing.description_bn?.length ?? 0);
  const descScore = descLen > 200 ? 20 : descLen > 80 ? 12 : descLen > 0 ? 6 : 0;
  score += descScore;
  breakdown.description = {
    score: descScore,
    note: descLen > 200
      ? "Detailed description provided."
      : descLen > 0
      ? "Description could be more detailed."
      : "No description — reduces credibility.",
  };

  // 4. Duplicate check & 5. Photo hash check
  let dupScore = 0;
  let dupNote = "";
  let pHashScore = 0;
  let pHashNote = "";

  try {
    const supabase = await createClient();

    // Only query if we have an ID to exclude
    if (listing.id) {
      // 4. Duplicate Description Check (15 pts)
      if (listing.description_en) {
        const { data: descs, error: descErr } = await supabase
          .from("listings")
          .select("description_en")
          .neq("id", listing.id)
          .limit(200);

        if (!descErr && descs) {
          const incomingTf = getTermFrequency(listing.description_en);
          let maxSim = 0;
          for (const d of descs) {
            if (d.description_en) {
              const sim = cosineSimilarity(incomingTf, getTermFrequency(d.description_en));
              if (sim > maxSim) maxSim = sim;
            }
          }

          if (maxSim > 0.7) {
            dupScore = 0;
            dupNote = "Possible duplicate description detected";
          } else if (maxSim > 0.4) {
            dupScore = 5;
            dupNote = "Similar listing found — verify originality";
          } else {
            dupScore = 15;
            dupNote = "No duplicate description found";
          }
        } else {
          // DB error fallback
          dupScore = 15;
          dupNote = "Duplicate check skipped (DB error)";
        }
      } else {
        dupScore = 0;
        dupNote = "No description provided for duplicate check";
      }

      // 5. Perceptual Hash Image Collision Check (15 pts)
      if (listing.photos && listing.photos.length > 0) {
        try {
          // Compute hashes for incoming photos
          const incomingHashes = await Promise.all(
            listing.photos.map(async (url: string) => {
              try {
                return await computeAHash(url);
              } catch (err) {
                console.error("Failed to hash incoming photo:", url);
                return null;
              }
            })
          );
          
          const validIncomingHashes = incomingHashes.filter(h => h !== null) as string[];

          if (validIncomingHashes.length === 0) {
            pHashScore = 5;
            pHashNote = "Photo similarity check failed (could not fetch images)";
          } else {
            // Fetch stored hashes from other listings
            const { data: storedHashesData, error: storedErr } = await supabase
              .from("listings")
              .select("photo_hashes")
              .neq("id", listing.id)
              .not("photo_hashes", "is", null);

            if (!storedErr && storedHashesData) {
              let reused = false;
              
              for (const row of storedHashesData) {
                if (!row.photo_hashes || !Array.isArray(row.photo_hashes)) continue;
                
                for (const storedHash of row.photo_hashes) {
                  for (const incomingHash of validIncomingHashes) {
                    if (storedHash.length === 64 && incomingHash.length === 64) {
                      const dist = hammingDistance(incomingHash, storedHash);
                      if (dist <= 10) {
                        reused = true;
                        break;
                      }
                    }
                  }
                  if (reused) break;
                }
                if (reused) break;
              }

              if (reused) {
                pHashScore = 0;
                pHashNote = "Visually similar photo detected in another listing";
              } else {
                pHashScore = 15;
                pHashNote = "Photos appear visually original";
              }
            } else {
              pHashScore = 15;
              pHashNote = "Photo check skipped (DB error)";
            }
          }
        } catch (error) {
          console.error("Photo hash logic error:", error);
          pHashScore = 5;
          pHashNote = "Photo similarity check failed";
        }
      } else {
        pHashScore = 0;
        pHashNote = "No photos provided for check";
      }

    } else {
      // If body has no description_en or id, skip and score 0.
      dupScore = 0;
      dupNote = "Skip duplicate check (no ID or description)";
      pHashScore = 0;
      pHashNote = "Skip photo check (no ID)";
    }
  } catch (error) {
    console.error("Supabase check error in computeTrustScore:", error);
    // Fall back to partial scores on DB error
    dupScore = 5;
    dupNote = "Duplicate check unavailable";
    pHashScore = 5;
    pHashNote = "Photo check unavailable";
  }

  score += dupScore;
  breakdown.duplicate = { score: dupScore, note: dupNote };

  score += pHashScore;
  breakdown.photo_hash = { score: pHashScore, note: pHashNote };

  return { total: Math.min(score, 100), breakdown };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await computeTrustScore(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("trust-score error:", error);
    return NextResponse.json({ error: "Computation failed" }, { status: 500 });
  }
}
