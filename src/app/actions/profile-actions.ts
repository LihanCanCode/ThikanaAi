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

export async function verifyStudentIdCard(imageBase64: string, mimeType: string) {
  // Legacy function stub (can be removed later once frontend calls are updated)
  return { success: false, error: "Legacy verification method disabled. Use submitIdCardsForVerification." };
}

export async function submitIdCardsForVerification(
  frontBase64: string,
  backBase64: string,
  frontExt: string,
  backExt: string
) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: "Not authenticated" };

    const frontBuffer = Buffer.from(frontBase64.split(",")[1] || frontBase64, "base64");
    const backBuffer = Buffer.from(backBase64.split(",")[1] || backBase64, "base64");

    const frontPath = `student-ids/${authData.user.id}-front-${Date.now()}.${frontExt}`;
    const backPath = `student-ids/${authData.user.id}-back-${Date.now()}.${backExt}`;

    const { error: uploadFrontErr } = await supabase.storage
      .from("listing-photos")
      .upload(frontPath, frontBuffer, { contentType: `image/${frontExt}`, upsert: true });

    if (uploadFrontErr) {
      return { error: `Front ID card upload failed: ${uploadFrontErr.message}` };
    }

    const { error: uploadBackErr } = await supabase.storage
      .from("listing-photos")
      .upload(backPath, backBuffer, { contentType: `image/${backExt}`, upsert: true });

    if (uploadBackErr) {
      return { error: `Back ID card upload failed: ${uploadBackErr.message}` };
    }

    const { data: frontPub } = supabase.storage.from("listing-photos").getPublicUrl(frontPath);
    const { data: backPub } = supabase.storage.from("listing-photos").getPublicUrl(backPath);

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        id_card_front_url: frontPub.publicUrl,
        id_card_back_url: backPub.publicUrl,
        verification_status: "pending",
        verified: false,
        verification_reject_reason: null
      })
      .eq("id", authData.user.id);

    if (updateErr) {
      throw new Error(`Profile update failed: ${updateErr.message}`);
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("submitIdCardsForVerification error:", error);
    return { error: error.message || "Failed to submit documents" };
  }
}

export async function getPendingVerifications() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: "Not authenticated" };

    const { data: caller } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", authData.user.id)
      .single();

    if (!caller?.is_admin) {
      return { error: "Unauthorized. Admin access only." };
    }

    const { data: pendingUsers, error } = await supabase
      .from("profiles")
      .select("id, full_name, university, phone, id_card_front_url, id_card_back_url, created_at")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { success: true, users: pendingUsers };
  } catch (error: any) {
    console.error("getPendingVerifications error:", error);
    return { error: error.message || "Failed to retrieve verifications" };
  }
}

export async function adminVerifyUser(targetUserId: string) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: "Not authenticated" };

    const { data: caller } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", authData.user.id)
      .single();

    if (!caller?.is_admin) return { error: "Unauthorized" };

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        verified: true,
        verification_status: "verified",
        verification_reject_reason: null
      })
      .eq("id", targetUserId);

    if (updateErr) throw updateErr;

    // Insert system notification
    await supabase.from("notifications").insert({
      user_id: targetUserId,
      title: "Student Verification Approved 🎓",
      message: "Congratulations! Your student identity has been verified by the admin. You have received the Verified Student Badge.",
      type: "verification_success",
      link: "/profile"
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("adminVerifyUser error:", error);
    return { error: error.message || "Failed to verify user" };
  }
}

export async function adminRejectUser(targetUserId: string, reason: string) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: "Not authenticated" };

    const { data: caller } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", authData.user.id)
      .single();

    if (!caller?.is_admin) return { error: "Unauthorized" };

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        verified: false,
        verification_status: "rejected",
        verification_reject_reason: reason
      })
      .eq("id", targetUserId);

    if (updateErr) throw updateErr;

    // Insert system notification
    await supabase.from("notifications").insert({
      user_id: targetUserId,
      title: "Student Verification Rejected ❌",
      message: `Unfortunately, your student verification was rejected. Reason: ${reason}. Please re-upload valid documents.`,
      type: "verification_failed",
      link: "/profile"
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("adminRejectUser error:", error);
    return { error: error.message || "Failed to reject user" };
  }
}

export async function getAdminDashboardStats() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: "Not authenticated" };

    const { data: caller } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", authData.user.id)
      .single();

    if (!caller?.is_admin) return { error: "Unauthorized" };

    const [
      { count: totalUsers },
      { count: totalListings },
      { count: pendingVerifications },
      { count: verifiedStudents }
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: 'exact', head: true }),
      supabase.from("listings").select("*", { count: 'exact', head: true }),
      supabase.from("profiles").select("*", { count: 'exact', head: true }).eq("verification_status", "pending"),
      supabase.from("profiles").select("*", { count: 'exact', head: true }).eq("verified", true)
    ]);

    return {
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        totalListings: totalListings || 0,
        pendingVerifications: pendingVerifications || 0,
        verifiedStudents: verifiedStudents || 0
      }
    };
  } catch (error: any) {
    console.error("getAdminDashboardStats error:", error);
    return { error: error.message || "Failed to fetch stats" };
  }
}
