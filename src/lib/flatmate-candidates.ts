import { createClient } from "@/lib/supabase/server";
import { rowToFlatmateProfile } from "@/lib/flatmate-db";
import type { FlatmateProfileRow } from "@/lib/flatmate-db";
import type { FlatmateProfile } from "@/types";

export async function getFlatmateCandidates(excludeProfileId?: string): Promise<FlatmateProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flatmate_profiles")
    .select("*, profiles(verified)")
    .eq("is_active", true)
    .not("user_id", "is", null); // Exclude dummy/seed profiles — real users only!

  if (error || !data) {
    return [];
  }

  const profiles = (data as FlatmateProfileRow[]).map(rowToFlatmateProfile);
  if (excludeProfileId) {
    return profiles.filter((p) => p.id !== excludeProfileId);
  }
  return profiles;
}
