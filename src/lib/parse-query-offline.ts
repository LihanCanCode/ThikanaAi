import { DHAKA_AREAS } from "@/lib/utils";
import type { ParsedSearchQuery } from "@/types";

const AREA_ALIASES: Record<string, string> = {
  mirpur: "Mirpur-2",
  mirpure: "Mirpur-2",
  "mirpur 2": "Mirpur-2",
  "mirpur-2": "Mirpur-2",
  "mirpur 1": "Mirpur-1",
  dhanmondi: "Dhanmondi",
  uttara: "Uttara",
  mohakhali: "Mohakhali",
  banani: "Banani",
  gulshan: "Gulshan-1",
  bashundhara: "Bashundhara R/A",
  mohammadpur: "Mohammadpur",
  farmgate: "Farmgate",
  rampura: "Rampura",
  badda: "Badda",
  shyamoli: "Shyamoli",
  gazipur: "Gazipur",
  savar: "Savar",
  tongi: "Tongi",
};

function normalizeArea(raw: string): string | null {
  const lower = raw.toLowerCase().trim();
  if (AREA_ALIASES[lower]) return AREA_ALIASES[lower];

  const match = DHAKA_AREAS.find(
    (a) => a.toLowerCase() === lower || a.toLowerCase().includes(lower) || lower.includes(a.toLowerCase())
  );
  return match ?? null;
}

function parseRentAmount(text: string): number | null {
  const bnDigits = "০১২৩৪৫৬৭৮৯";
  const normalized = text.replace(/[০-৯]/g, (c) => String(bnDigits.indexOf(c)));

  const kMatch = normalized.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  const hajarMatch = normalized.match(/(\d+)\s*(?:hajar|হাজার)/i);
  if (hajarMatch) return parseInt(hajarMatch[1], 10) * 1000;

  const numMatch = normalized.match(/\b(\d{4,6})\b/);
  if (numMatch) return parseInt(numMatch[1], 10);

  return null;
}

/** Rule-based Bangla/English query parser — works without Gemini */
export function parseQueryOffline(query: string): Partial<ParsedSearchQuery> {
  const q = query.trim();
  if (!q) return {};

  const lower = q.toLowerCase();
  const filters: Partial<ParsedSearchQuery> = {};

  // Area
  for (const [alias, area] of Object.entries(AREA_ALIASES)) {
    if (lower.includes(alias)) {
      filters.area = area;
      break;
    }
  }
  if (!filters.area) {
    for (const area of DHAKA_AREAS) {
      if (lower.includes(area.toLowerCase())) {
        filters.area = area;
        break;
      }
    }
  }
  if (!filters.area) {
    const areaChunk = q.match(/(?:in|at|near|এ|এর)\s+([a-zA-Z0-9\s-]+)/i);
    if (areaChunk) filters.area = normalizeArea(areaChunk[1]);
  }

  // Rooms
  const roomMatch = lower.match(/(\d+)\s*(?:room|bed|bedroom|রুম|বেড)/);
  if (roomMatch) filters.rooms = parseInt(roomMatch[1], 10);
  else if (/\b(?:single|ekta|এক)\s*(?:room|seat|রুম)?\b/.test(lower)) filters.rooms = 1;

  // Max rent — "under", "below", "er niche", "এর নিচে"
  const underPatterns = [
    /(?:under|below|max|upto|up to|er niche|er nicher|এর নিচে|এর নিচের)\s*[৳]?(\d[\dk\s.hajarহাজার]*)/i,
    /(\d[\d.k]*)\s*(?:k|hajar|হাজার)?\s*(?:er niche|er nicher|এর নিচে|taka|tk|টাকা)/i,
  ];
  for (const pattern of underPatterns) {
    const m = q.match(pattern);
    if (m) {
      const amount = parseRentAmount(m[1]);
      if (amount) {
        filters.max_rent = amount;
        break;
      }
    }
  }
  if (!filters.max_rent) {
    const looseAmount = parseRentAmount(q);
    if (looseAmount && /(?:under|below|niche|নিচে|k|hajar|হাজার|taka|tk)/i.test(q)) {
      filters.max_rent = looseAmount;
    }
  }

  // Min rent
  const minMatch = q.match(/(?:above|over|minimum|min|er upor|এর উপর)\s*[৳]?(\d[\dk\s.hajarহাজার]*)/i);
  if (minMatch) {
    const amount = parseRentAmount(minMatch[1]);
    if (amount) filters.min_rent = amount;
  }

  // Type
  if (/\b(?:student|seat|bachelor|ছাত্র|স্টুডেন্ট)\b/i.test(q)) filters.type = "student";
  else if (/\b(?:family|poribar|পরিবার)\b/i.test(q)) filters.type = "family";
  else if (/\b(?:professional|office|job)\b/i.test(q)) filters.type = "professional";

  // Gender
  if (/\b(?:female|meye|girl|মেয়ে|মহিলা)\b/i.test(q)) filters.for_gender = "female";
  else if (/\b(?:male|chele|boy|ছেলে|পুরুষ)\b/i.test(q)) filters.for_gender = "male";



  return filters;
}
