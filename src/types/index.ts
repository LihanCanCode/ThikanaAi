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

// ── Flatmate Matching Types ──

export type SleepSchedule = "early_bird" | "night_owl" | "flexible";
export type StudyStyle = "deep_silence" | "light_bg_ok" | "headphones";
export type CleanlinessLevel = "spotless" | "reasonable" | "relaxed";
export type SocialStyle = "introvert" | "extrovert" | "balanced";
export type SmokingPref = "non_smoker" | "smoker_outside" | "smoker_anywhere" | "dont_mind";
export type GuestPref = "rarely" | "weekends_ok" | "often";
export type UniPriority = "near_my_uni" | "commutable_both" | "anywhere";

export interface FlatmateProfile {
  // identity (will be populated from auth in production)
  id: string;
  name: string;
  avatar?: string;
  university: string;         // university id (e.g. "iut")
  university_priority: UniPriority;

  // basics — hard filters
  budget_min: number;
  budget_max: number;
  preferred_areas: string[];  // can be empty if uni_priority = "commutable_both"
  looking_for_count: 1 | 2 | 3; // how many flatmates needed
  move_in: "within_week" | "this_month" | "next_month" | "flexible";
  gender_pref: GenderPref;

  // habits — AI scored
  sleep_schedule: SleepSchedule;
  wake_up: "before_7" | "7_to_9" | "after_9";
  study_style: StudyStyle;
  work_from_home: "yes_daily" | "sometimes" | "no";

  // lifestyle — AI scored
  smoking: SmokingPref;
  cooking: "cook_share" | "cook_alone" | "dont_cook" | "flexible";
  kitchen_cleanliness: CleanlinessLevel;
  guests: GuestPref;

  // personality — AI scored
  cleanliness: CleanlinessLevel;
  noise_level: "quiet" | "music_tv_ok" | "dont_care";
  social_style: SocialStyle;
  has_pet: boolean;
  pet_ok: boolean;

  // free text — fed to Gemini
  self_description: string;   // "describe yourself in 2 words"
  ideal_flatmate: string;     // "ideal flatmate in 1 sentence"
  contact_info?: string;      // "Phone / WhatsApp for accepted matches"
}

export interface MatchResult {
  profile: FlatmateProfile;
  score: number;             // 0–100
  green_flags: string[];     // top 3 positives
  yellow_flags: string[];    // top 2 cautions
  summary: string;           // one-line AI summary
  suggested_areas: string[]; // AI-suggested areas for both
  cross_uni: boolean;        // true if different universities
  commute_note?: string;     // e.g. "Mirpur-1 ~25 min for both"
}

export interface FlickRequest {
  from_id: string;
  to_id: string;
  status: "pending" | "accepted" | "declined";
  group_id?: string;        // set once accepted
}

export interface FlatmateGroup {
  id: string;
  members: FlatmateProfile[];
  combined_budget: number;
  suggested_areas: string[];
  created_at: string;
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
