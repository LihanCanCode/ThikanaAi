import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Listing, SearchFilters } from "@/types";

function applyFilters(listings: Listing[], filters: SearchFilters, textQuery?: string): Listing[] {
  let results = [...listings];

  if (filters.type) results = results.filter((l) => l.type === filters.type);
  if (filters.area) {
    const area = filters.area.toLowerCase();
    results = results.filter((l) => l.area.toLowerCase().includes(area));
  }
  if (filters.max_rent) results = results.filter((l) => l.rent_bdt <= filters.max_rent!);
  if (filters.min_rent) results = results.filter((l) => l.rent_bdt >= filters.min_rent!);
  if (filters.rooms) results = results.filter((l) => l.rooms >= filters.rooms!);
  if (filters.for_gender && filters.for_gender !== "any") {
    results = results.filter((l) => l.for_gender === filters.for_gender || l.for_gender === "any");
  }


  if (textQuery?.trim()) {
    const qs = textQuery.toLowerCase();
    results = results.filter(
      (l) =>
        l.title_en.toLowerCase().includes(qs) ||
        l.area.toLowerCase().includes(qs) ||
        (l.description_en?.toLowerCase().includes(qs) ?? false) ||
        (l.title_bn?.includes(textQuery) ?? false)
    );
  }

  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const filters: SearchFilters = body.filters ?? {};
    const query: string = body.query ?? "";
    const type: string | undefined = body.type ?? filters.type;

    const supabase = await createClient();
    let queryBuilder = supabase.from("listings").select("*").eq("is_available", true);

    if (type) queryBuilder = queryBuilder.eq("type", type);
    if (filters.area) queryBuilder = queryBuilder.ilike("area", `%${filters.area}%`);
    if (filters.max_rent) queryBuilder = queryBuilder.lte("rent_bdt", filters.max_rent);
    if (filters.min_rent) queryBuilder = queryBuilder.gte("rent_bdt", filters.min_rent);
    if (filters.rooms) queryBuilder = queryBuilder.gte("rooms", filters.rooms);
    if (filters.for_gender && filters.for_gender !== "any") {
      queryBuilder = queryBuilder.in("for_gender", [filters.for_gender, "any"]);
    }


    const { data, error } = await queryBuilder.order("created_at", { ascending: false });

    let listings: Listing[] = [];
    if (!error && data && data.length > 0) {
      listings = applyFilters(data as Listing[], filters, query);
    }

    return NextResponse.json({ listings, count: listings.length });
  } catch (err) {
    console.error("[listings/search]", err);
    return NextResponse.json({ listings: [], count: 0, error: "Search failed" }, { status: 500 });
  }
}
