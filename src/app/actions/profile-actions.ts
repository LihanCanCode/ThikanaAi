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
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: "Not authenticated" };

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileErr || !profile) {
      return { error: "Profile not found" };
    }

    // Convert base64 image data to Gemini part
    const imagePart = {
      inlineData: {
        data: imageBase64.split(",")[1] || imageBase64, // strip prefix if present
        mimeType: mimeType || "image/jpeg",
      },
    };

    const prompt = `You are a Student ID verification system for Thikana, a housing rental portal in Bangladesh.
Analyze the attached image of a Student ID card and perform OCR to verify the student's status.

Compare the ID card details with the user's profile:
- User Profile Full Name: "${profile.full_name || ""}"
- User Profile University: "${profile.university || ""}"

Verify:
1. Is this a valid, official Student ID card issued by a university/college?
2. Does the name on the ID card reasonably match the user's name? (Allow minor spelling variations, abbreviations, or missing middle names).
3. Does the university on the ID card match the user's university? (Allow common acronyms/abbreviations, e.g. "IUT" vs "Islamic University of Technology", "NSU" vs "North South University", "DU" vs "Dhaka University").
4. Is the card expired? If there is an expiration year, check if it is before 2026. If no expiration date is found, assume it is still valid.

Return ONLY a valid JSON object matching this structure (no markdown styling, no fences):
{
  "isStudentId": boolean,
  "extractedName": "string",
  "extractedUniversity": "string",
  "isExpired": boolean,
  "nameMatch": boolean,
  "universityMatch": boolean,
  "verified": boolean,
  "confidenceScore": number,
  "reason": "string"
}
`;

    const { geminiFlash } = await import("@/lib/gemini");
    const result = await geminiFlash.generateContent({
      contents: [
        {
          role: "user",
          parts: [imagePart, { text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    } as any);

    const responseText = result.response.text().trim();
    const parsed = JSON.parse(responseText);

    if (parsed.verified) {
      // Update profile as verified!
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          verified: true,
          university: parsed.extractedUniversity || profile.university,
        })
        .eq("id", authData.user.id);

      if (updateErr) {
        throw new Error(`Database update failed: ${updateErr.message}`);
      }

      revalidatePath("/profile");
      return { success: true, details: parsed };
    } else {
      return { success: false, details: parsed, error: parsed.reason || "Verification failed." };
    }
  } catch (error: any) {
    console.error("verifyStudentIdCard error:", error);
    return { error: error.message || "Failed to process verification" };
  }
}
