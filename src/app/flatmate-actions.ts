"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type FlatmateProfile = {
  id: string;
  user_id?: string;
  name: string;
  university: string;
  budget_min: number;
  budget_max: number;
  preferred_areas: string[];
  profile_data: {
    gender: string;
    lifestyle: string[];
    bio: string;
    avatar: string;
  };
  created_at: string;
  verified?: boolean;
};

// Form data input
export type FlatmateFormData = {
  name: string;
  university: string;
  budget: number;
  gender: string;
  area_pref: string;
  lifestyle: string[];
  bio: string;
  avatar?: string;
  vacant_rooms?: number;
  location?: string;
};

export async function getFlatmateProfiles(): Promise<FlatmateProfile[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("flatmate_profiles")
    .select("*, profiles(verified)")
    .eq("is_active", true)
    .not("user_id", "is", null) // Exclude dummy seed profiles
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching flatmate profiles:", error);
    return [];
  }

  return (data || []).map((row: any) => {
    const profileObj = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      university: row.university,
      budget_min: row.budget_min,
      budget_max: row.budget_max,
      preferred_areas: row.preferred_areas,
      profile_data: row.profile_data,
      created_at: row.created_at,
      verified: profileObj?.verified ?? false,
    };
  });
}

export async function getFlatmateProfileByUserId(userId: string): Promise<FlatmateProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flatmate_profiles")
    .select("*, profiles(verified)")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  const profileObj = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    university: data.university,
    budget_min: data.budget_min,
    budget_max: data.budget_max,
    preferred_areas: data.preferred_areas,
    profile_data: data.profile_data,
    created_at: data.created_at,
    verified: profileObj?.verified ?? false,
  };
}

export async function postFlatmateProfile(formData: FlatmateFormData) {
  const supabase = await createClient();
  
  // Try to get user_id if logged in, otherwise null
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;

  const profileData = {
    gender: formData.gender.toLowerCase(),
    lifestyle: formData.lifestyle,
    bio: formData.bio || "Student looking for flatmates.",
    avatar: formData.avatar || formData.name.charAt(0).toUpperCase(),
    vacant_rooms: formData.vacant_rooms ?? 1,
    location: formData.location || ""
  };

  const { data, error } = await supabase
    .from("flatmate_profiles")
    .upsert({
      user_id: userId,
      name: formData.name,
      university: formData.university,
      budget_min: 0,
      budget_max: formData.budget,
      preferred_areas: [formData.area_pref],
      profile_data: profileData
    }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    console.error("Error posting flatmate profile:", error);
    return { error: error.message };
  }

  let verified = false;
  if (userId) {
    const { data: pData } = await supabase
      .from("profiles")
      .select("verified")
      .eq("id", userId)
      .single();
    verified = pData?.verified ?? false;
  }

  revalidatePath("/flatmates");
  return { success: true, profile: { ...data, verified } as FlatmateProfile };
}

export async function deleteFlatmateProfile(profileId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  if (!userId) return { error: "Not logged in" };

  const { error } = await supabase
    .from("flatmate_profiles")
    .delete()
    .eq("id", profileId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/flatmates");
  return { success: true };
}
