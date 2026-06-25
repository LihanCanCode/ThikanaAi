"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rowToFlatmateProfile, flatmateProfileToRow } from "@/lib/flatmate-db";
import { createAdminClient } from "@/lib/supabase/admin";
import { SEED_PROFILES } from "@/lib/seed-profiles";
import type { FlatmateProfile } from "@/types";

export async function saveFlatmateProfile(profile: FlatmateProfile) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to save your profile" };

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
  const { data, error } = await supabase
    .from("flatmate_profiles")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return SEED_PROFILES;
  }

  return data.map(rowToFlatmateProfile);
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

export async function seedDemoFlatmateProfiles() {
  const admin = createAdminClient();
  if (!admin) return { seeded: false };

  const { count } = await admin
    .from("flatmate_profiles")
    .select("*", { count: "exact", head: true })
    .is("user_id", null);

  if ((count ?? 0) > 0) return { seeded: false };

  const rows = SEED_PROFILES.map((p) => ({
    user_id: null,
    name: p.name,
    university: p.university,
    budget_min: p.budget_min,
    budget_max: p.budget_max,
    preferred_areas: p.preferred_areas,
    profile_data: {
      university_priority: p.university_priority,
      looking_for_count: p.looking_for_count,
      move_in: p.move_in,
      gender_pref: p.gender_pref,
      sleep_schedule: p.sleep_schedule,
      wake_up: p.wake_up,
      study_style: p.study_style,
      work_from_home: p.work_from_home,
      smoking: p.smoking,
      cooking: p.cooking,
      kitchen_cleanliness: p.kitchen_cleanliness,
      guests: p.guests,
      cleanliness: p.cleanliness,
      noise_level: p.noise_level,
      social_style: p.social_style,
      has_pet: p.has_pet,
      pet_ok: p.pet_ok,
      self_description: p.self_description,
      ideal_flatmate: p.ideal_flatmate,
      avatar: p.avatar,
    },
    is_active: true,
  }));

  const { error } = await admin.from("flatmate_profiles").insert(rows);
  if (error) return { error: error.message };
  return { seeded: true };
}
