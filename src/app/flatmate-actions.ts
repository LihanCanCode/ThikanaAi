"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type FlatmateProfile = {
  id: string;
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
};

export async function getFlatmateProfiles(): Promise<FlatmateProfile[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("flatmate_profiles")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching flatmate profiles:", error);
    return [];
  }

  return data as FlatmateProfile[];
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
    avatar: formData.name.charAt(0).toUpperCase()
  };

  const { data, error } = await supabase
    .from("flatmate_profiles")
    .insert({
      user_id: userId,
      name: formData.name,
      university: formData.university,
      budget_min: 0,
      budget_max: formData.budget,
      preferred_areas: [formData.area_pref],
      profile_data: profileData
    })
    .select()
    .single();

  if (error) {
    console.error("Error posting flatmate profile:", error);
    return { error: error.message };
  }

  revalidatePath("/flatmates");
  return { success: true, profile: data as FlatmateProfile };
}
