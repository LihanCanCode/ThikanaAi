"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateTrustScore } from "@/app/actions/ai-trust-score";

export interface RoomShare {
  id?: string;
  creator_id?: string;
  title_en: string;
  title_bn?: string;
  description_en?: string;
  description_bn?: string;
  area: string;
  address?: string;
  lat?: number;
  lng?: number;
  rent_bdt: number;
  current_roommates: number;
  available_seats: number;
  gender_restriction: "male" | "female" | "any";
  university_restriction?: string;
  photos?: string[];
  is_available?: boolean;
  created_at?: string;
  trust_score?: number;
  trust_score_breakdown?: any;
}

export async function saveRoomShare(roomShare: RoomShare) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to post an available room." };

  // Ensure base profile exists to prevent foreign key errors
  await supabase.from("profiles").upsert(
    { 
      id: user.id, 
      role: user.user_metadata?.role || "student",
      full_name: user.user_metadata?.full_name || "Student Roommate"
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const payload = {
    creator_id: user.id,
    title_en: roomShare.title_en,
    title_bn: roomShare.title_bn || null,
    description_en: roomShare.description_en || null,
    description_bn: roomShare.description_bn || null,
    area: roomShare.area,
    address: roomShare.address || null,
    lat: roomShare.lat || null,
    lng: roomShare.lng || null,
    rent_bdt: roomShare.rent_bdt,
    current_roommates: roomShare.current_roommates,
    available_seats: roomShare.available_seats,
    gender_restriction: roomShare.gender_restriction,
    university_restriction: roomShare.university_restriction || null,
    photos: roomShare.photos || [],
    is_available: roomShare.is_available ?? true,
  };

  let result;
  if (roomShare.id) {
    result = await supabase
      .from("room_shares")
      .update(payload)
      .eq("id", roomShare.id)
      .eq("creator_id", user.id)
      .select("*")
      .single();
  } else {
    result = await supabase
      .from("room_shares")
      .insert(payload)
      .select("*")
      .single();
  }

  if (result.error) {
    return { error: result.error.message };
  }

  // Fire and forget the AI Trust Score calculation in the background
  // This keeps the UX instant for the user while Gemini processes the photos!
  if (result.data?.id) {
    generateTrustScore(result.data.id, "room_share").catch((err) => {
      console.error("Failed background AI trust score:", err);
    });
  }

  revalidatePath("/student/feed");
  return { success: true, roomShare: result.data as RoomShare };
}

export async function getRoomShares(filters?: {
  area?: string;
  universityId?: string;
  maxBudget?: number;
}): Promise<RoomShare[]> {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("room_shares")
    .select(`
      *,
      creator:profiles!creator_id(
        full_name,
        university
      )
    `)
    .eq("is_available", true)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false });

  if (filters?.area) {
    query = query.ilike("area", `%${filters.area}%`);
  }
  if (filters?.maxBudget) {
    query = query.lte("rent_bdt", filters.maxBudget);
  }
  if (filters?.universityId) {
    // If filtering by university, check both restriction and creator's university
    query = query.or(`university_restriction.eq.${filters.universityId},university_restriction.is.null`);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("Failed to fetch room shares:", error);
    return [];
  }

  return data as unknown as RoomShare[];
}

export async function getMyRoomShares(): Promise<RoomShare[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("room_shares")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as RoomShare[];
}

export async function deleteRoomShare(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const { error } = await supabase
    .from("room_shares")
    .delete()
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/student/feed");
  return { success: true };
}
