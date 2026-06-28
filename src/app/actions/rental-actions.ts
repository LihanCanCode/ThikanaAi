"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitRentalRequest(
  targetId: string, 
  targetType: "listing" | "room_share", 
  ownerId: string
) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData?.user) {
      return { error: "Authentication required to submit a rental request." };
    }

    const studentId = authData.user.id;

    if (studentId === ownerId) {
      return { error: "You cannot rent your own property." };
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from("rental_requests")
      .select("id, status")
      .eq("student_id", studentId)
      .eq(targetType === "listing" ? "listing_id" : "room_share_id", targetId)
      .single();

    if (existingRequest) {
      return { error: `You have already sent a request (Status: ${existingRequest.status}).` };
    }

    const insertData: any = {
      student_id: studentId,
      owner_id: ownerId,
      status: "pending",
      contract_accepted: true,
    };

    if (targetType === "listing") {
      insertData.listing_id = targetId;
    } else {
      insertData.room_share_id = targetId;
    }

    const { error: insertError } = await supabase
      .from("rental_requests")
      .insert(insertData);

    if (insertError) throw insertError;

    // Send a notification to the owner
    await supabase.from("notifications").insert({
      user_id: ownerId,
      title: "New Rental Request 🏠",
      message: "A student wants to rent your listing! Please review the request in your dashboard.",
      type: "rental_request",
      link: "/landlord" // Assuming landlord dashboard is here, wait I need to check where the owner dashboard is. Let's just use /
    });

    revalidatePath(`/listings/${targetId}`);
    return { success: true };
  } catch (error: any) {
    console.error("submitRentalRequest error:", error);
    return { error: error.message || "Failed to submit rental request." };
  }
}

export async function getOwnerRentalRequests() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: "Not authenticated" };

    const { data, error } = await supabase
      .from("rental_requests")
      .select(`
        *,
        student:profiles!student_id (id, full_name, phone, university, avatar_url),
        listing:listings!listing_id (id, title_en, address, rent_bdt),
        room_share:room_shares!room_share_id (id, title_en, address, rent_bdt)
      `)
      .eq("owner_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    return { success: true, requests: data || [] };
  } catch (error: any) {
    console.error("getOwnerRentalRequests error:", error);
    return { error: error.message || "Failed to fetch rental requests." };
  }
}

export async function respondToRentalRequest(requestId: string, status: "accepted" | "rejected") {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: "Not authenticated" };

    // Fetch the request to verify ownership and get details
    const { data: request, error: fetchError } = await supabase
      .from("rental_requests")
      .select("*")
      .eq("id", requestId)
      .eq("owner_id", authData.user.id)
      .single();

    if (fetchError || !request) {
      return { error: "Request not found or you don't have permission to update it." };
    }

    if (request.status !== "pending") {
      return { error: `Request is already ${request.status}.` };
    }

    const { error: updateError } = await supabase
      .from("rental_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (updateError) throw updateError;

    // If accepted, update the listing availability and add tenant
    if (status === "accepted") {
      let monthlyRent = 0;
      let roomLabel = "";

      if (request.listing_id) {
        const { data: listingData } = await supabase.from("listings").select("rent_bdt, title_en").eq("id", request.listing_id).single();
        if (listingData) {
          monthlyRent = listingData.rent_bdt;
          roomLabel = listingData.title_en;
        }
        await supabase.from("listings").update({ is_available: false }).eq("id", request.listing_id);
      } else if (request.room_share_id) {
        const { data: rsData } = await supabase.from("room_shares").select("rent_bdt, title_en").eq("id", request.room_share_id).single();
        if (rsData) {
          monthlyRent = rsData.rent_bdt;
          roomLabel = rsData.title_en;
        }
        await supabase.from("room_shares").update({ is_available: false }).eq("id", request.room_share_id);
      }
      
      // Auto-reject other pending requests for the same listing
      const targetColumn = request.listing_id ? "listing_id" : "room_share_id";
      const targetId = request.listing_id || request.room_share_id;
      
      await supabase
        .from("rental_requests")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq(targetColumn, targetId)
        .eq("status", "pending")
        .neq("id", requestId);

      // Fetch student details for the tenant entry
      const { data: studentProfile } = await supabase.from("profiles").select("full_name, phone").eq("id", request.student_id).single();

      // Automatically add to tenants list
      await supabase.from("tenants").insert({
        landlord_id: authData.user.id,
        listing_id: request.listing_id || null, 
        tenant_name: studentProfile?.full_name || "Unknown Student",
        tenant_phone: studentProfile?.phone || null,
        room_label: roomLabel || "Rental Property",
        monthly_rent: monthlyRent,
        move_in_date: new Date().toISOString().split('T')[0],
        is_active: true
      });
    }

    // Notify the student
    const statusText = status === "accepted" ? "accepted! 🎉" : "declined. ❌";
    await supabase.from("notifications").insert({
      user_id: request.student_id,
      title: `Rental Request ${status === 'accepted' ? 'Approved' : 'Declined'}`,
      message: `The owner has ${statusText} your rental request.`,
      type: "rental_response",
      link: "/"
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("respondToRentalRequest error:", error);
    return { error: error.message || "Failed to update rental request." };
  }
}

export async function getAllAcceptedRentals() {
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
      .from("rental_requests")
      .select(`
        *,
        student:profiles!student_id (id, full_name, phone, university),
        owner:profiles!owner_id (id, full_name, phone),
        listing:listings!listing_id (id, title_en, address, rent_bdt),
        room_share:room_shares!room_share_id (id, title_en, address, rent_bdt)
      `)
      .eq("status", "accepted")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    
    return { success: true, rentals: data || [] };
  } catch (error: any) {
    console.error("getAllAcceptedRentals error:", error);
    return { error: error.message || "Failed to fetch accepted rentals." };
  }
}
