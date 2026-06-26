"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProfile() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (error) return null;
  return data;
}

export async function updateProfile(formData: { full_name: string; university: string; phone: string }) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: formData.full_name,
      university: formData.university,
      phone: formData.phone
    })
    .eq("id", authData.user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}
