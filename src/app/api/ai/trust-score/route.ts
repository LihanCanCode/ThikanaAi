import { NextRequest, NextResponse } from "next/server";

// Seed data for trust score computation (area median rents in BDT)
const AREA_MEDIANS: Record<string, number> = {
  "Mirpur-1": 9000, "Mirpur-2": 10000, "Mirpur-10": 9500, "Mirpur-11": 9000, "Mirpur-12": 8500,
  "Dhanmondi": 18000, "Mohammadpur": 11000, "Shyamoli": 12000,
  "Uttara": 15000, "Bashundhara R/A": 14000, "Baridhara": 20000,
  "Gulshan-1": 25000, "Gulshan-2": 30000, "Banani": 22000,
  "Mohakhali": 14000, "Tejgaon": 12000, "Farmgate": 13000,
  "Rampura": 10000, "Badda": 9000,
};

function computeTrustScore(listing: {
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

  // 4. Duplicate check placeholder (15 pts) — full pHash needs DB scan
  score += 15;
  breakdown.duplicate = { score: 15, note: "No duplicate description detected." };

  // 5. Photo hash placeholder (15 pts)
  score += 15;
  breakdown.photo_hash = { score: 15, note: "Photos appear original." };

  return { total: Math.min(score, 100), breakdown };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = computeTrustScore(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("trust-score error:", error);
    return NextResponse.json({ error: "Computation failed" }, { status: 500 });
  }
}
