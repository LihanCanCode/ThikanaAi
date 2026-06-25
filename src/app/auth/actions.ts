"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoleHomePath } from "@/lib/auth-utils";
import type { UserRole } from "@/types";

async function getProfileRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role) return profile.role as UserRole;

  const { data: { user } } = await supabase.auth.getUser();
  return (user?.user_metadata?.role as UserRole) ?? "student";
}

export async function login(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const role = data.user ? await getProfileRole(supabase, data.user.id) : "student";

  revalidatePath("/", "layout");
  redirect(getRoleHomePath(role));
}

export async function signup(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phone = formData.get("phone") as string;
  const role = formData.get("role") as UserRole;
  const university = formData.get("university") as string;

  if (!email || !password || !firstName || !lastName || !phone || !role) {
    return { error: "Please fill in all required fields" };
  }

  const supabase = await createClient();
  const fullName = `${firstName} ${lastName}`.trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role,
        university: role === "student" ? university : null,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      role,
      full_name: fullName,
      phone,
      university: role === "student" ? university : null,
    });
  }

  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
