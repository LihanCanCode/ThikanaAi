"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rowToFlatmateProfile, flatmateProfileToRow } from "@/lib/flatmate-db";
import type { FlatmateProfileRow } from "@/lib/flatmate-db";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FlatmateProfile } from "@/types";

export async function saveFlatmateProfile(profile: FlatmateProfile) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to save your profile" };

  // Ensure base profile exists to prevent foreign key errors (if auth trigger failed or user is old)
  await supabase.from("profiles").upsert(
    { 
      id: user.id, 
      role: user.user_metadata?.role || "student",
      full_name: user.user_metadata?.full_name || profile.name
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const row = flatmateProfileToRow(profile, user.id);

  const { data, error } = await supabase
    .from("flatmate_profiles")
    .upsert(row, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/student/feed");
  revalidatePath("/student/matching");
  return { success: true, profile: rowToFlatmateProfile(data) };
}

export async function getFlatmateProfiles(): Promise<FlatmateProfile[]> {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("flatmate_profiles")
    .select("*")
    .eq("is_active", true)
    .not("user_id", "is", null) // Exclude dummy seed profiles!
    .gte("created_at", thirtyDaysAgo) // Auto-remove profiles older than 1 month
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as FlatmateProfileRow[]).map(rowToFlatmateProfile);
}

export async function getMyFlatmateProfile(): Promise<FlatmateProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("flatmate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ? rowToFlatmateProfile(data) : null;
}

export async function deleteFlatmateProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to delete your profile" };

  const { error } = await supabase
    .from("flatmate_profiles")
    .delete()
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/student/feed");
  return { success: true };
}

export async function sendFlatmateFlick(toProfileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to send a flick" };

  const { error } = await supabase.from("flatmate_flicks").upsert(
    {
      from_user_id: user.id,
      to_profile_id: toProfileId,
      status: "pending",
    },
    { onConflict: "from_user_id,to_profile_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/student/feed");
  return { success: true };
}

export async function getSentFlickIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("flatmate_flicks")
    .select("to_profile_id")
    .eq("from_user_id", user.id);

  return (data ?? []).map((f) => f.to_profile_id);
}


// ── Notification Actions ──────────────────────────────────────────
//
// WHY two-step queries:
//   flatmate_flicks.from_user_id → profiles.id   (FK exists)
//   flatmate_profiles.user_id   → profiles.id   (FK exists)
//   There is NO direct FK from flatmate_flicks → flatmate_profiles,
//   so Supabase cannot do flatmate_profiles!from_user_id join.
//   We fetch flicks first, then look up sender profiles by user_id.

export interface FlickWithSender {
  id: string;
  status: string;
  created_at: string;
  from_user_id: string;
  sender_profile: {
    id: string;
    name: string;
    university: string;
    profile_data: Record<string, unknown>;
  } | null;
}

/**
 * Fetch all pending flicks received by the current user.
 */
export async function getPendingFlicks(): Promise<FlickWithSender[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Step 1: find my flatmate profile id
  const { data: myProfile } = await supabase
    .from("flatmate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myProfile) return [];

  // Step 2: get pending flicks addressed to my profile
  const { data: flicks, error } = await supabase
    .from("flatmate_flicks")
    .select("id, status, created_at, from_user_id")
    .eq("to_profile_id", myProfile.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !flicks || flicks.length === 0) return [];

  // Step 3: look up the sender's flatmate profile using user_id = from_user_id
  const senderUserIds = flicks.map((f) => f.from_user_id);
  const { data: senderProfiles } = await supabase
    .from("flatmate_profiles")
    .select("id, name, university, profile_data, user_id")
    .in("user_id", senderUserIds);

  const profilesByUserId = Object.fromEntries(
    (senderProfiles ?? []).map((p) => [p.user_id, p])
  );

  return flicks.map((f) => ({
    id: f.id,
    status: f.status,
    created_at: f.created_at,
    from_user_id: f.from_user_id,
    sender_profile: profilesByUserId[f.from_user_id] ?? null,
  }));
}

export type PendingFlick = FlickWithSender;

/**
 * Accept or decline a flick. Reveals contact info on accept.
 */
export async function updateFlickStatus(
  flickId: string,
  status: "accepted" | "declined"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Update the flick status
  const { data: flick, error } = await supabase
    .from("flatmate_flicks")
    .update({ status })
    .eq("id", flickId)
    .select("id, status, from_user_id")
    .single();

  if (error || !flick) return { error: error?.message ?? "Update failed" };

  // Look up sender's flatmate profile to get contact info
  const { data: senderProfile } = await supabase
    .from("flatmate_profiles")
    .select("name, profile_data")
    .eq("user_id", flick.from_user_id)
    .maybeSingle();

  const profileData = (senderProfile?.profile_data ?? {}) as Record<string, unknown>;
  const contactInfo = (profileData.contact_info as string) ?? null;

  revalidatePath("/student/feed");
  return {
    success: true,
    status,
    contactInfo,
    senderName: senderProfile?.name ?? "Student",
  };
}

/**
 * Count of pending flicks for the navbar badge.
 */
export async function getPendingFlickCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: myProfile } = await supabase
    .from("flatmate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myProfile) return 0;

  const { count } = await supabase
    .from("flatmate_flicks")
    .select("*", { count: "exact", head: true })
    .eq("to_profile_id", myProfile.id)
    .eq("status", "pending");

  return count ?? 0;
}
