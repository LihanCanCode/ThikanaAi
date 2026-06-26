import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { area, max_rent, rooms, type, for_gender, furnishing } = body;

    // Insert into saved_searches
    const { data, error } = await supabase
      .from("saved_searches")
      .insert({
        user_id: user.id,
        area: area || null,
        max_rent: max_rent || null,
        rooms: rooms || null,
        type: type || null,
        for_gender: for_gender || null,
        furnishing: furnishing || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[alerts/save] DB error:", error);
      return NextResponse.json({ error: "Failed to save alert" }, { status: 500 });
    }

    return NextResponse.json({ success: true, alert: data });
  } catch (err) {
    console.error("[alerts/save]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
