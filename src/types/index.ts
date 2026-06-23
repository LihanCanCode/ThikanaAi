// ── Thikana Shared Types ──

export type UserRole = "student" | "landlord" | "professional";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  university: string | null;
  monthly_budget: number | null;
  verified: boolean;
  created_at: string;
}

export type FurnishingType = "unfurnished" | "semi" | "fully";
export type ListingType = "student" | "family" | "professional";
export type GenderPref = "male" | "female" | "any";

export interface TrustScoreBreakdown {
  price:       { score: number; note: string };
  photos:      { score: number; note: string };
  description: { score: number; note: string };
  duplicate:   { score: number; note: string };
  total:       number;
}

export interface Listing {
  id: string;
  landlord_id: string;
  title_en: string;
  title_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  area: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rent_bdt: number;
  rooms: number;
  bathrooms: number;
  floor: number | null;
  furnishing: FurnishingType;
  type: ListingType;
  for_gender: GenderPref;
  utilities_included: boolean;
  photos: string[];
  is_available: boolean;
  trust_score: number | null;
  trust_score_breakdown: TrustScoreBreakdown | null;
  created_at: string;
  updated_at: string;
  // joined
  profiles?: Pick<Profile, "full_name" | "phone" | "avatar_url" | "verified">;
}

export interface University {
  id: string;
  name: string;
  short_name: string;
  lat: number;
  lng: number;
}

export interface Tenant {
  id: string;
  landlord_id: string;
  listing_id: string;
  tenant_name: string;
  tenant_phone: string | null;
  room_label: string | null;
  monthly_rent: number;
  move_in_date: string | null;
  is_active: boolean;
}

export type PaymentStatus = "paid" | "due" | "overdue";

export interface RentPayment {
  id: string;
  tenant_id: string;
  month: string;
  amount: number;
  paid_on: string | null;
  status: PaymentStatus;
  notes: string | null;
}

// AI-related
export interface ParsedSearchQuery {
  area: string | null;
  rooms: number | null;
  max_rent: number | null;
  min_rent: number | null;
  type: ListingType | null;
  for_gender: GenderPref | null;
  furnishing: FurnishingType | null;
}

export interface GeneratedListing {
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
}

export interface RentEstimate {
  min: number;
  max: number;
  median: number;
  sample_count: number;
}

// Finance toolkit
export interface SplitResult {
  per_person: number;
  total: number;
  persons: number;
}

// Search filters (UI state)
export interface SearchFilters {
  query?: string;
  area?: string;
  type?: ListingType;
  for_gender?: GenderPref;
  min_rent?: number;
  max_rent?: number;
  rooms?: number;
  furnishing?: FurnishingType;
  university?: string;
  max_distance_km?: number;
}
