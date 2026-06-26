import type { FlatmateProfile } from "@/types";

export interface FlatmateProfileRow {
  id: string;
  user_id: string | null;
  name: string;
  university: string;
  budget_min: number;
  budget_max: number;
  preferred_areas: string[];
  profile_data: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export function rowToFlatmateProfile(row: FlatmateProfileRow): FlatmateProfile {
  const data = (row.profile_data ?? {}) as Partial<FlatmateProfile>;
  return {
    id: row.id,
    name: row.name,
    university: row.university,
    budget_min: row.budget_min,
    budget_max: row.budget_max,
    preferred_areas: row.preferred_areas ?? [],
    university_priority: data.university_priority ?? "commutable_both",
    looking_for_count: data.looking_for_count ?? 1,
    move_in: data.move_in ?? "flexible",
    gender_pref: data.gender_pref ?? "any",
    sleep_schedule: data.sleep_schedule ?? "flexible",
    wake_up: data.wake_up ?? "7_to_9",
    study_style: data.study_style ?? "light_bg_ok",
    work_from_home: data.work_from_home ?? "no",
    smoking: data.smoking ?? "dont_mind",
    cooking: data.cooking ?? "flexible",
    kitchen_cleanliness: data.kitchen_cleanliness ?? "reasonable",
    guests: data.guests ?? "weekends_ok",
    cleanliness: data.cleanliness ?? "reasonable",
    noise_level: data.noise_level ?? "music_tv_ok",
    social_style: data.social_style ?? "balanced",
    has_pet: data.has_pet ?? false,
    pet_ok: data.pet_ok ?? true,
    self_description: data.self_description ?? "",
    ideal_flatmate: data.ideal_flatmate ?? "",
    contact_info: data.contact_info,
    avatar: data.avatar as string | undefined,
  };
}

export function flatmateProfileToRow(profile: FlatmateProfile, userId: string) {
  const { id: _id, name, university, budget_min, budget_max, preferred_areas, ...rest } = profile;
  return {
    user_id: userId,
    name,
    university,
    budget_min,
    budget_max,
    preferred_areas: preferred_areas ?? [],
    profile_data: rest,
    is_active: true,
  };
}
