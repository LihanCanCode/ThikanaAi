import { NextRequest, NextResponse } from "next/server";
import type { GeneratedListing } from "@/types";

function generateBilingualListing(details: {
  area: string;
  rent: number;
  rooms: number;
  bathrooms: number;
  floor?: string;
  furnishing: string;
  type: string;
  utilities: boolean;
  notes?: string;
}): GeneratedListing {
  const { area, rent, rooms, bathrooms, floor, furnishing, type, utilities, notes } = details;

  const fText = floor ? `${floor} floor ` : "";
  const fTextBn = floor ? `${floor} তলার ` : "";
  const furnText = furnishing === "fully" ? "fully furnished" : furnishing === "semi" ? "semi-furnished" : "unfurnished";
  const furnTextBn = furnishing === "fully" ? "সম্পূর্ণ সুসজ্জিত" : furnishing === "semi" ? "আংশিক সুসজ্জিত" : "অসজ্জিত";
  
  const title_en = `Cozy ${rooms}-Bed ${furnText} Flat in ${area}`;
  const title_bn = `${area}-এ আরামদায়ক ${rooms} রুমের ${furnTextBn} ফ্ল্যাট`;

  const description_en = `A well-maintained ${rooms}-bedroom and ${bathrooms}-bathroom flat located in ${area}, Dhaka. Situated on the ${fText || "convenient floor"} of the building, it features a ${furnText} setup, making it ideal for ${type} tenants. ${utilities ? "Utilities are included in the rent." : "Utilities are to be paid separately."} ${notes ? `Additional details: ${notes}` : ""}`;
  
  const description_bn = `ঢাকার ${area}-এ অবস্থিত একটি সুন্দর এবং পরিপাটি ${rooms} বেডরুম ও ${bathrooms} বাথরুমের ফ্ল্যাট। এটি ভবনের ${fTextBn || "সুবিধাজনক"} তলায় অবস্থিত এবং ফ্ল্যাটটি ${furnTextBn} অবস্থায় রয়েছে যা ${type === "student" ? "ছাত্রদের" : "পরিবারের"} জন্য চমৎকার। ${utilities ? "ভাড়ার সাথে ইউটিলিটি বিল অন্তর্ভুক্ত।" : "ইউটিলিটি বিল আলাদাভাবে পরিশোধ করতে হবে।"} ${notes ? `অতিরিক্ত বিবরণ: ${notes}` : ""}`;

  return {
    title_en,
    title_bn,
    description_en,
    description_bn
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const generated = generateBilingualListing(body);
    return NextResponse.json({ listing: generated });
  } catch (error) {
    console.error("generate-listing error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
