"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ChatThread = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  other_user?: any; // populated on fetch
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  read: boolean;
  created_at: string;
};

// 1. Send Connection Request
export async function sendConnectionRequest(targetProfileId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  if (!userId) {
    return { error: "You must be logged in to connect with someone." };
  }

  // Lookup the target user ID from the flatmate_profiles table
  const { data: targetProfileData, error: lookupError } = await supabase
    .from("flatmate_profiles")
    .select("user_id")
    .eq("id", targetProfileId)
    .single();

  if (lookupError || !targetProfileData?.user_id) {
    return { error: "Could not find the target user." };
  }

  const targetUserId = targetProfileData.user_id;

  if (userId === targetUserId) {
    return { error: "You cannot connect with yourself." };
  }

  // Check if thread exists
  const { data: existing } = await supabase
    .from("chat_threads")
    .select("*")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${userId})`)
    .single();

  if (existing) {
    return { error: "Connection already exists or is pending." };
  }

  // Get sender's profile for the notification
  const { data: senderProfile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
  const senderName = senderProfile?.full_name || "Someone";

  // Create thread
  const { data: thread, error: threadError } = await supabase
    .from("chat_threads")
    .insert({ sender_id: userId, receiver_id: targetUserId })
    .select()
    .single();

  if (threadError) return { error: threadError.message };

  // Create notification
  await supabase.from("notifications").insert({
    user_id: targetUserId,
    title: "New Connection Request",
    message: `${senderName} wants to connect with you on Flatmates!`,
    type: "connection_request",
    link: "/chat"
  });

  return { success: true, thread };
}

// 2. Get Notifications
export async function getNotifications() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (data || []) as Notification[];
}

export async function markNotificationsRead() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) return;

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", authData.user.id)
    .eq("read", false);
  
  revalidatePath("/", "layout");
}

// 3. Get Chat Threads
export async function getChatThreads() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) return [];
  const userId = authData.user.id;

  const { data: threads } = await supabase
    .from("chat_threads")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (!threads) return [];

  // Fetch profiles for the 'other' user
  const enrichedThreads = await Promise.all(threads.map(async (t) => {
    const otherId = t.sender_id === userId ? t.receiver_id : t.sender_id;
    const { data: profile } = await supabase.from("profiles").select("id, full_name, avatar_url, role").eq("id", otherId).single();
    
    // Also try to get their flatmate avatar if they have one
    const { data: flatmate } = await supabase.from("flatmate_profiles").select("profile_data").eq("user_id", otherId).single();
    
    return {
      ...t,
      other_user: {
        ...profile,
        fallback_avatar: flatmate?.profile_data?.avatar || profile?.full_name?.charAt(0) || "?"
      }
    };
  }));

  return enrichedThreads;
}

// 4. Accept Connection
export async function acceptConnection(threadId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("chat_threads")
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq("id", threadId);
    
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return { success: true };
}

// 5. Send Message
export async function sendMessage(threadId: string, text: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) return { error: "Not logged in" };

  const { error } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_id: authData.user.id,
      text
    });

  if (error) return { error: error.message };
  
  // Update thread updated_at
  await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
  
  revalidatePath("/chat");
  return { success: true };
}

export async function getMessages(threadId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
    
  return data || [];
}
