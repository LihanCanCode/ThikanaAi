import { NextRequest, NextResponse } from "next/server";
import { SEED_PROFILES, getSharedAreas } from "@/lib/seed-profiles";
import { UNIVERSITIES } from "@/lib/utils";
import type { FlatmateProfile, MatchResult } from "@/types";

/** Hard filter: must-match basics */
function passesHardFilter(me: FlatmateProfile, other: FlatmateProfile): boolean {
  // Budget overlap
  if (me.budget_max + other.budget_max < 8000) return false;
  // Smoking dealbreaker
  if (me.smoking === "non_smoker" && other.smoking === "smoker_anywhere") return false;
  if (other.smoking === "non_smoker" && me.smoking === "smoker_anywhere") return false;
  // Pet allergy
  if (me.has_pet && !other.pet_ok) return false;
  if (other.has_pet && !me.pet_ok) return false;
  return true;
}

/** Rule-based score (0–100) — used as fallback when Gemini is unavailable */
function ruleBasedScore(me: FlatmateProfile, other: FlatmateProfile): number {
  let score = 50;
  // Sleep schedule
  if (me.sleep_schedule === other.sleep_schedule) score += 15;
  else if (me.sleep_schedule === "flexible" || other.sleep_schedule === "flexible") score += 7;
  else score -= 5;
  // Smoking
  if (me.smoking === other.smoking) score += 10;
  else if (me.smoking === "dont_mind" || other.smoking === "dont_mind") score += 5;
  // Cleanliness
  if (me.cleanliness === other.cleanliness) score += 10;
  else if (Math.abs(["spotless","reasonable","relaxed"].indexOf(me.cleanliness) - ["spotless","reasonable","relaxed"].indexOf(other.cleanliness)) === 1) score += 4;
  else score -= 8;
  // Social style
  if (me.social_style === other.social_style) score += 8;
  else if (me.social_style === "balanced" || other.social_style === "balanced") score += 4;
  // Guests
  if (me.guests === other.guests) score += 7;
  // Budget proximity
  const budgetOverlap = Math.min(me.budget_max, other.budget_max) - Math.max(me.budget_min, other.budget_min);
  if (budgetOverlap > 0) score += 5;
  return Math.min(100, Math.max(0, score));
}

/** Generate simple green/yellow flags without AI */
function ruleBasedFlags(me: FlatmateProfile, other: FlatmateProfile): { green: string[]; yellow: string[] } {
  const green: string[] = [];
  const yellow: string[] = [];

  if (me.sleep_schedule === other.sleep_schedule) green.push(`Both are ${me.sleep_schedule === "early_bird" ? "early birds 🌅" : me.sleep_schedule === "night_owl" ? "night owls 🦉" : "flexible sleepers"}`);
  else yellow.push("Different sleep schedules — worth a chat");

  if (me.smoking === other.smoking || me.smoking === "dont_mind" || other.smoking === "dont_mind") green.push("Smoking preferences compatible 🚭");

  if (me.cleanliness === other.cleanliness) green.push(`Both prefer ${me.cleanliness} cleanliness`);
  else if (me.cleanliness === "spotless" && other.cleanliness === "relaxed") yellow.push("Different cleanliness standards — agree on rules early");

  if (me.cooking === "cook_share" && other.cooking === "cook_share") green.push("Both enjoy cooking together 🍳");

  const budgetOverlap = Math.min(me.budget_max, other.budget_max) >= Math.max(me.budget_min, other.budget_min);
  if (budgetOverlap) green.push("Budget ranges overlap well 💰");
  else yellow.push("Budget ranges slightly different");

  return { green: green.slice(0, 3), yellow: yellow.slice(0, 2) };
}

function getUniShortName(id: string): string {
  return UNIVERSITIES.find((u) => u.id === id)?.short_name ?? id.toUpperCase();
}

/** Try Gemini scoring — returns null if API key is missing or call fails */
async function tryGeminiScore(me: FlatmateProfile, candidates: FlatmateProfile[]): Promise<Array<{
  index: number; score: number; green_flags: string[]; yellow_flags: string[]; summary: string;
}> | null> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("placeholder")) return null;

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
    });

    const prompt = `You are a flatmate compatibility AI for Thikana (Bangladesh student housing).

MY PROFILE: ${me.name}, ${getUniShortName(me.university)}, Budget ৳${me.budget_min}–৳${me.budget_max}, Sleep: ${me.sleep_schedule}, Smoking: ${me.smoking}, Cleanliness: ${me.cleanliness}, Social: ${me.social_style}, About: "${me.self_description}"

CANDIDATES:
${candidates.map((c, i) => `[${i}] ${c.name} (${getUniShortName(c.university)}) Budget ৳${c.budget_min}–৳${c.budget_max}, Sleep: ${c.sleep_schedule}, Smoking: ${c.smoking}, Cleanliness: ${c.cleanliness}, Social: ${c.social_style}, About: "${c.self_description}"`).join("\n")}

Return a JSON array (one object per candidate):
[{"index":0,"score":85,"green_flags":["Both night owls","Same budget range"],"yellow_flags":["Different cleanliness"],"summary":"Great energy match — both relaxed and budget-conscious."}]

Rules: score 0-100, max 3 green flags (≤8 words each), max 2 yellow flags, summary ≤20 words. Return ONLY the JSON array.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile: FlatmateProfile = body.profile;

    if (!profile?.university) {
      return NextResponse.json({ error: "Profile is required" }, { status: 400 });
    }

    // Filter candidates
    const candidates = SEED_PROFILES.filter(
      (p) => p.id !== profile.id && passesHardFilter(profile, p)
    );

    if (candidates.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Try Gemini; fall back to rule-based if unavailable
    const geminiScores = await tryGeminiScore(profile, candidates);

    const matches: MatchResult[] = candidates.map((candidate, index) => {
      const crossUni = candidate.university !== profile.university;
      const sharedAreas = crossUni
        ? getSharedAreas(profile.university, candidate.university)
        : candidate.preferred_areas.filter((a) => profile.preferred_areas.includes(a));

      const commuteNote = crossUni && sharedAreas.length > 0
        ? `${sharedAreas[0]} works for both ${getUniShortName(profile.university)} & ${getUniShortName(candidate.university)}`
        : undefined;

      // Use Gemini scores if available, else rule-based
      const ai = geminiScores?.find((s) => s.index === index);
      const { green: ruleGreen, yellow: ruleYellow } = ruleBasedFlags(profile, candidate);

      return {
        profile: candidate,
        score: ai?.score ?? ruleBasedScore(profile, candidate),
        green_flags: ai?.green_flags ?? ruleGreen,
        yellow_flags: ai?.yellow_flags ?? ruleYellow,
        summary: ai?.summary ?? `${candidate.name} seems like a solid match — compatible lifestyle and budget.`,
        suggested_areas: sharedAreas.length > 0 ? sharedAreas : candidate.preferred_areas.slice(0, 3),
        cross_uni: crossUni,
        commute_note: commuteNote,
      } satisfies MatchResult;
    });

    // Sort by score, return top 5
    matches.sort((a, b) => b.score - a.score);
    return NextResponse.json({ matches: matches.slice(0, 5) });

  } catch (err) {
    console.error("[match-flatmates]", err);
    return NextResponse.json({ error: "Matching failed", details: String(err) }, { status: 500 });
  }
}
