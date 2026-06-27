import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format BDT currency — e.g. 12000 → "৳12,000" */
export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}

/** Haversine distance between two lat/lng points (returns km) */
export function getDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface CommuteEstimate {
  walkMins: number;
  rickshawMins: number;
}

/** 
 * Estimate commute time using straight-line distance, 
 * applying a 1.3x routing factor for Dhaka roads.
 */
export function calculateCommute(lat1: number, lng1: number, lat2: number, lng2: number): CommuteEstimate {
  const straightLineKm = getDistanceKm(lat1, lng1, lat2, lng2);
  const roadDistanceKm = straightLineKm * 1.3;

  // Walk: ~5 km/h => 12 mins per km
  const walkMins = Math.round(roadDistanceKm * 12);
  
  // Rickshaw: ~12 km/h => 5 mins per km
  const rickshawMins = Math.round(roadDistanceKm * 5);

  return { walkMins, rickshawMins };
}

/** Trust score → color class */
export function trustColor(score: number): string {
  if (score >= 75) return "trust-high";
  if (score >= 45) return "trust-medium";
  return "trust-low";
}

/** Trust score → label */
export function trustLabel(score: number): string {
  if (score >= 75) return "High Trust";
  if (score >= 45) return "Moderate";
  return "Low Trust";
}

/** Relative time — e.g. "2 days ago" */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/** Truncate text */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max).trim() + "…" : str;
}

/** Bangla numerals */
export function toBanglaNum(n: number): string {
  const bn = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];
  return String(n).replace(/[0-9]/g, (d) => bn[+d]);
}

/** Dhaka area list for autocomplete */
export const DHAKA_AREAS = [
  "Mirpur-1","Mirpur-2","Mirpur-10","Mirpur-11","Mirpur-12",
  "Dhanmondi","Mohammadpur","Shyamoli","Rayer Bazar",
  "Uttara","Uttara Sector 3","Uttara Sector 7","Uttara Sector 11",
  "Bashundhara R/A","Baridhara","Gulshan-1","Gulshan-2",
  "Banani","Mohakhali","Tejgaon","Farmgate",
  "Purana Paltan","Motijheel","Rampura","Badda",
  "Demra","Jatrabari","Keraniganj","Narayanganj",
  "Gazipur","Tongi","Savar","Ashulia",
];

/** University list with coordinates */
export const UNIVERSITIES = [
  { id: "iut",  name: "Islamic University of Technology",  short_name: "IUT",  lat: 23.9518, lng: 90.3868 },
  { id: "duet", name: "Dhaka University of Engineering & Technology", short_name: "DUET", lat: 24.0039, lng: 90.4181 },
  { id: "diu",  name: "Daffodil International University", short_name: "DIU",  lat: 23.7513, lng: 90.3576 },
  { id: "buet", name: "Bangladesh University of Engineering and Technology", short_name: "BUET", lat: 23.7264, lng: 90.3928 },
  { id: "du",   name: "University of Dhaka",               short_name: "DU",   lat: 23.7279, lng: 90.3989 },
  { id: "nsu",  name: "North South University",            short_name: "NSU",  lat: 23.8157, lng: 90.4292 },
  { id: "brac", name: "BRAC University",                   short_name: "BRAC", lat: 23.7787, lng: 90.4022 },
  { id: "aiub", name: "American International University", short_name: "AIUB", lat: 23.8750, lng: 90.4170 },
];
