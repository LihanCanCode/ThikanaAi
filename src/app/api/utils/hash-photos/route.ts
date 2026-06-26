import { NextRequest, NextResponse } from "next/server";
import { computeAHash } from "@/lib/image-hash";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const urls: string[] = body.urls || [];

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ hashes: [] });
    }

    // Compute hashes in parallel
    const hashes = await Promise.all(
      urls.map(async (url) => {
        try {
          return await computeAHash(url);
        } catch (error) {
          console.error("Failed to hash url:", url, error);
          return null;
        }
      })
    );

    // Filter out failed hashes
    const validHashes = hashes.filter((h) => h !== null);

    return NextResponse.json({ hashes: validHashes });
  } catch (error: any) {
    console.error("Error in hash-photos route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
