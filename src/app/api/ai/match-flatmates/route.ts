import { NextRequest, NextResponse } from "next/server";
import { geminiFlash } from "@/lib/gemini";
import { createAdminClient } from "@/lib/supabase/admin";
import { UNIVERSITIES } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Fetch active flatmate profiles
    const supabase = await createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not found" }, { status: 500 });
    }
    const { data: profiles, error } = await supabase
      .from("flatmate_profiles")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    // Map universities
    const profilesSummary = (profiles || []).map(p => {
      const univName = UNIVERSITIES.find(u => u.id === p.university)?.short_name || p.university;
      return `- ${p.name} (Gender: ${p.gender}, University: ${univName}, Budget: ৳${p.budget_max}): Bio "${p.bio}". Habits: ${p.sleep_schedule} sleeper, ${p.smoking_habit} smoker.`;
    }).join("\n");

    const systemPrompt = `You are the "Thikana AI Roommate Matchmaker". 
You are a highly intelligent, conversational assistant helping a university student in Dhaka find the perfect flatmate from our database.

AVAILABLE FLATMATE DATABASE:
${profilesSummary || "No active profiles right now."}

INSTRUCTIONS:
1. You must ONLY recommend flatmates that exist in the database above. If no one matches the user's specific criteria, apologize politely and suggest someone close.
2. Use a friendly, enthusiastic tone with emojis.
3. Use Markdown formatting (**bolding**, bullet points). 
4. Keep the response very concise (max 3 short paragraphs). The user is reading this in a small chat window.
5. Highlight why they are a good match (e.g. matching sleep schedule, budget, or university).

User Request: "${query}"`;

    const result = await geminiFlash.generateContent(systemPrompt);
    const text = result.response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("Matchmaker API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
