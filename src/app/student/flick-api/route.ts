import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { flickId, status } = await req.json();
  if (!flickId || !["accepted", "declined"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createClient();
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use ADMIN client to bypass RLS since the receiver needs to update a row they didn't create
  const { data: flick, error } = await admin
    .from("flatmate_flicks")
    .update({ status })
    .eq("id", flickId)
    .select("id, status, from_user_id")
    .single();

  if (error || !flick) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });

  // Get sender's contact info from their flatmate profile JSONB
  const { data: senderProfile } = await admin
    .from("flatmate_profiles")
    .select("name, profile_data")
    .eq("user_id", flick.from_user_id)
    .maybeSingle();

  const profileData = (senderProfile?.profile_data ?? {}) as Record<string, unknown>;
  const contactInfo = (profileData.contact_info as string) ?? null;

  return NextResponse.json({
    success: true,
    status,
    contactInfo,
    senderName: senderProfile?.name ?? "Student",
  });
}
