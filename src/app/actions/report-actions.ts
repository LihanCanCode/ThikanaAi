"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { geminiFlash } from "@/lib/gemini";

export async function checkEligibilityToReport(targetId: string, targetType: "listing" | "room_share") {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { eligible: false, error: "Not authenticated" };

    const targetColumn = targetType === "listing" ? "listing_id" : "room_share_id";

    const { data, error } = await supabase
      .from("rental_requests")
      .select("id")
      .eq("student_id", authData.user.id)
      .eq(targetColumn, targetId)
      .eq("status", "accepted")
      .single();

    if (error || !data) {
      return { eligible: false };
    }

    return { eligible: true };
  } catch (err: any) {
    return { eligible: false, error: err.message };
  }
}

export async function submitReport(
  targetId: string,
  targetType: "listing" | "room_share",
  ownerId: string,
  category: string,
  description: string
) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: "Authentication required." };

    const studentId = authData.user.id;

    // 1. Verify eligibility (must be an active tenant)
    const { eligible } = await checkEligibilityToReport(targetId, targetType);
    if (!eligible) {
      return { error: "You can only report properties that you are actively renting." };
    }

    // 2. Use Gemini AI to determine severity
    let severity = "low";
    try {
      const prompt = `You are a real estate platform moderator AI for Thikana.
      A tenant has submitted a report about their rental property.
      Category: ${category}
      Description: "${description}"
      
      Determine the severity of this report. 
      Options: "low", "medium", "high", "critical".
      - "critical": Immediate physical safety risk, illegal activity, severe harassment.
      - "high": Major habitability issues (no water/electricity for days), blatant scam.
      - "medium": Annoying but non-life-threatening issues (leaky faucet, rude behavior).
      - "low": Minor complaints, general feedback.
      
      Respond with ONLY the exact severity string (e.g. "high"). Do not use any punctuation.`;

      const result = await geminiFlash.generateContent(prompt);
      const aiResponse = result.response.text().trim().toLowerCase();
      if (["low", "medium", "high", "critical"].includes(aiResponse)) {
        severity = aiResponse;
      }
    } catch (aiError) {
      console.error("Gemini severity analysis failed:", aiError);
      // fallback to medium if AI fails
      severity = "medium";
    }

    // 3. Insert the report
    const { error: insertError } = await supabase
      .from("reports")
      .insert({
        reporter_id: studentId,
        target_type: targetType,
        target_id: targetId,
        owner_id: ownerId,
        category,
        description,
        severity,
        status: "pending"
      });

    if (insertError) throw insertError;

    // 4. If critical or high, automatically penalize ALL properties owned by this landlord
    if (severity === "critical" || severity === "high") {
      const penalty = severity === "critical" ? 20 : 10;
      
      // Update all listings owned by this landlord
      const { data: listings } = await supabase.from("listings").select("id, trust_score, trust_score_breakdown").eq("landlord_id", ownerId);
      if (listings && listings.length > 0) {
        await Promise.all(listings.map(async (item) => {
          if (item.trust_score !== null) {
            const newScore = Math.max(0, item.trust_score - penalty);
            const bd = item.trust_score_breakdown || {};
            await supabase.from("listings").update({
              trust_score: newScore,
              trust_score_breakdown: {
                ...bd,
                admin_penalty: { score: -penalty, note: `Auto-penalty applied due to a ${severity} severity tenant report against the landlord.` }
              }
            }).eq("id", item.id);
          }
        }));
      }

      // Update all room_shares owned by this landlord
      const { data: roomShares } = await supabase.from("room_shares").select("id, trust_score, trust_score_breakdown").eq("creator_id", ownerId);
      if (roomShares && roomShares.length > 0) {
        await Promise.all(roomShares.map(async (item) => {
          if (item.trust_score !== null) {
            const newScore = Math.max(0, item.trust_score - penalty);
            const bd = item.trust_score_breakdown || {};
            await supabase.from("room_shares").update({
              trust_score: newScore,
              trust_score_breakdown: {
                ...bd,
                admin_penalty: { score: -penalty, note: `Auto-penalty applied due to a ${severity} severity tenant report against the landlord.` }
              }
            }).eq("id", item.id);
          }
        }));
      }
    }

    return { success: true, severity };
  } catch (error: any) {
    console.error("submitReport error:", error);
    return { error: error.message || "Failed to submit report." };
  }
}

export async function submitGlobalReport(
  category: string,
  description: string
) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: "Authentication required." };
    const studentId = authData.user.id;

    // Find the active rental for this student
    const { data: activeRentals, error: rentalError } = await supabase
      .from("rental_requests")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .limit(1);
    
    if (rentalError || !activeRentals || activeRentals.length === 0) {
      return { error: "You are not actively renting any property, so you cannot file a report." };
    }

    const rental = activeRentals[0];
    const targetType = rental.listing_id ? "listing" : "room_share";
    const targetId = rental.listing_id || rental.room_share_id;
    const ownerId = rental.owner_id;

    // Call submitReport directly
    return await submitReport(targetId, targetType, ownerId, category, description);
  } catch (error: any) {
    console.error("submitGlobalReport error:", error);
    return { error: error.message || "Failed to submit report." };
  }
}

export async function getAdminReports() {
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

    const { data, error } = await supabase
      .from("reports")
      .select(`
        *,
        reporter:profiles!reporter_id (id, full_name, phone, university),
        owner:profiles!owner_id (id, full_name, phone)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    if (!data || data.length === 0) return { success: true, reports: [] };

    // Fetch target titles manually
    const listingIds = data.filter(r => r.target_type === 'listing').map(r => r.target_id);
    const roomShareIds = data.filter(r => r.target_type === 'room_share').map(r => r.target_id);
    
    let targetMap: Record<string, string> = {};
    
    if (listingIds.length > 0) {
      const { data: listings } = await supabase.from('listings').select('id, title_en').in('id', listingIds);
      listings?.forEach(l => { targetMap[l.id] = l.title_en; });
    }
    
    if (roomShareIds.length > 0) {
      const { data: roomShares } = await supabase.from('room_shares').select('id, title_en').in('id', roomShareIds);
      roomShares?.forEach(rs => { targetMap[rs.id] = rs.title_en; });
    }

    const enhancedData = data.map(r => ({
      ...r,
      target_title: targetMap[r.target_id] || "Unknown Property"
    }));

    return { success: true, reports: enhancedData };
  } catch (error: any) {
    console.error("getAdminReports error:", error);
    return { error: error.message || "Failed to fetch reports." };
  }
}

export async function updateReportStatus(reportId: string, status: "reviewed" | "resolved" | "dismissed") {
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

    const { error: updateError } = await supabase
      .from("reports")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", reportId);

    if (updateError) throw updateError;

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("updateReportStatus error:", error);
    return { error: error.message || "Failed to update report status." };
  }
}

export async function resolveReportWithActions(
  reportId: string,
  ownerId: string,
  reporterId: string,
  deductScore: number,
  suspendListings: boolean,
  sendWarning: boolean,
  terminateContract: boolean,
  adminNotes: string
) {
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

    // 1. Terminate Contract
    if (terminateContract) {
      await supabase
        .from("rental_requests")
        .update({ status: "terminated" })
        .eq("student_id", reporterId)
        .eq("owner_id", ownerId)
        .eq("status", "accepted");
    }

    // 2. Send Warning
    if (sendWarning) {
      await supabase.from("notifications").insert({
        user_id: ownerId,
        title: "Official Platform Warning",
        message: "You have received an official warning due to a verified tenant report. Further violations may result in account suspension.",
        type: "system",
        link: "/landlord/dashboard"
      });
    }

    // 3. Suspend Listings
    if (suspendListings) {
      await supabase.from("listings").update({ is_available: false }).eq("landlord_id", ownerId);
      await supabase.from("room_shares").update({ is_available: false }).eq("creator_id", ownerId);
    }

    // 4. Deduct Score manually across all properties
    if (deductScore > 0) {
      const { data: listings } = await supabase.from("listings").select("id, trust_score, trust_score_breakdown").eq("landlord_id", ownerId);
      if (listings && listings.length > 0) {
        await Promise.all(listings.map(async (item) => {
          if (item.trust_score !== null) {
            const newScore = Math.max(0, item.trust_score - deductScore);
            const bd = item.trust_score_breakdown || {};
            await supabase.from("listings").update({
              trust_score: newScore,
              trust_score_breakdown: {
                ...bd,
                admin_penalty: { score: -deductScore, note: `Manual Admin Penalty during report resolution.` }
              }
            }).eq("id", item.id);
          }
        }));
      }

      const { data: roomShares } = await supabase.from("room_shares").select("id, trust_score, trust_score_breakdown").eq("creator_id", ownerId);
      if (roomShares && roomShares.length > 0) {
        await Promise.all(roomShares.map(async (item) => {
          if (item.trust_score !== null) {
            const newScore = Math.max(0, item.trust_score - deductScore);
            const bd = item.trust_score_breakdown || {};
            await supabase.from("room_shares").update({
              trust_score: newScore,
              trust_score_breakdown: {
                ...bd,
                admin_penalty: { score: -deductScore, note: `Manual Admin Penalty during report resolution.` }
              }
            }).eq("id", item.id);
          }
        }));
      }
    }

    // 5. Update Report Status
    const { error: updateError } = await supabase
      .from("reports")
      .update({ 
        status: "resolved", 
        admin_notes: adminNotes,
        updated_at: new Date().toISOString() 
      })
      .eq("id", reportId);

    if (updateError) throw updateError;

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("resolveReportWithActions error:", error);
    return { error: error.message || "Failed to execute resolution actions." };
  }
}
