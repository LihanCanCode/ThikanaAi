import { createClient } from "@/lib/supabase/server";
import { rowToFlatmateProfile } from "@/lib/flatmate-db";
import { SEED_PROFILES } from "@/lib/seed-profiles";
import type { FlatmateProfile } from "@/types";

export async function getFlatmateCandidates(excludeProfileId?: string): Promise<FlatmateProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flatmate_profiles")
    .select("*")
    .eq("is_active", true);

  if (error || !data || data.length === 0) {
    return SEED_PROFILES.filter((p) => p.id !== excludeProfileId);
  }

  const profiles = data.map(rowToFlatmateProfile);
  if (excludeProfileId) {
    return profiles.filter((p) => p.id !== excludeProfileId);
  }
  return profiles;
}
