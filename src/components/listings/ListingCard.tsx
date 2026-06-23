"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Bed, Bath, CheckCircle, Shield } from "lucide-react";
import { formatBDT, timeAgo, trustColor, trustLabel, truncate } from "@/lib/utils";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
  distanceKm?: number;
}

export default function ListingCard({ listing, distanceKm }: ListingCardProps) {
  const trustScore = listing.trust_score ?? 0;

  return (
    <Link href={`/listings/${listing.id}`} style={{ textDecoration: "none" }}>
      <article className="card" style={{ overflow: "hidden", cursor: "pointer" }}>
        {/* Photo */}
        <div style={{ position: "relative", height: "200px", background: "var(--bg-subtle)", overflow: "hidden" }}>
          {listing.photos[0] ? (
            <img
              src={listing.photos[0]}
              alt={listing.title_en}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "2rem" }}>
              🏠
            </div>
          )}

          {/* Badges overlay */}
          <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <span className={`badge badge-${listing.type === "student" ? "green" : listing.type === "family" ? "amber" : "muted"}`}>
              {listing.type === "student" ? "🎓 Student" : listing.type === "family" ? "👨‍👩‍👧 Family" : "💼 Professional"}
            </span>
            {listing.for_gender !== "any" && (
              <span className="badge badge-muted">
                {listing.for_gender === "male" ? "👨 Male" : "👩 Female"}
              </span>
            )}
          </div>

          {/* Trust score pill */}
          {listing.trust_score !== null && (
            <div style={{
              position: "absolute", top: "10px", right: "10px",
              background: "rgba(255,255,255,0.95)",
              borderRadius: "var(--radius-full)",
              padding: "4px 10px",
              display: "flex", alignItems: "center", gap: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}>
              <Shield size={12} className={trustColor(trustScore)} style={{ color: trustScore >= 75 ? "var(--success)" : trustScore >= 45 ? "var(--warning)" : "var(--danger)" }} />
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: trustScore >= 75 ? "var(--success)" : trustScore >= 45 ? "var(--warning)" : "var(--danger)",
              }}>
                {trustScore}
              </span>
            </div>
          )}

          {/* Available pill */}
          {listing.is_available && (
            <div style={{
              position: "absolute", bottom: "10px", left: "10px",
              background: "var(--success)",
              borderRadius: "var(--radius-full)",
              padding: "3px 10px",
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "pulse-green 2s infinite" }} />
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#fff" }}>Available</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "1rem" }}>
          {/* Location */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
            <MapPin size={13} style={{ color: "var(--primary)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>
              {listing.area}
              {distanceKm !== undefined && (
                <span style={{ marginLeft: "6px", color: "var(--primary)", fontWeight: 600 }}>
                  · {distanceKm.toFixed(1)} km
                </span>
              )}
            </span>
          </div>

          {/* Title */}
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px", lineHeight: 1.3 }}>
            {truncate(listing.title_en, 55)}
          </h3>
          {listing.title_bn && (
            <p className="bangla" style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "10px" }}>
              {truncate(listing.title_bn, 40)}
            </p>
          )}

          {/* Stats row */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
            <Stat icon={<Bed size={13} />} value={`${listing.rooms} bed`} />
            <Stat icon={<Bath size={13} />} value={`${listing.bathrooms} bath`} />
            <Stat icon={<span style={{ fontSize: "12px" }}>🪑</span>} value={listing.furnishing === "fully" ? "Furnished" : listing.furnishing === "semi" ? "Semi" : "Bare"} />
          </div>

          {/* Price row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
            <div>
              <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--primary)" }}>
                {formatBDT(listing.rent_bdt)}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "2px" }}>/month</span>
              {listing.utilities_included && (
                <span style={{ display: "block", fontSize: "0.7rem", color: "var(--success)", fontWeight: 600 }}>✓ Utilities included</span>
              )}
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{timeAgo(listing.created_at)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <span style={{ color: "var(--text-muted)" }}>{icon}</span>
      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
