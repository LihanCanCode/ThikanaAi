"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Bed, Bath, Shield, ShieldCheck, AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";
import { formatBDT, timeAgo, truncate } from "@/lib/utils";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
  distanceKm?: number;
}

export default function ListingCard({ listing, distanceKm }: ListingCardProps) {
  const [showTrustScore, setShowTrustScore] = useState(false);
  const trustScore = listing.trust_score ?? null;
  const breakdown = (listing as any).trust_score_breakdown ?? null;

  return (
    <>
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

            {/* Type/Gender Badges overlay */}
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

            {/* AI Trust Score pill - clickable */}
            {trustScore !== null && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTrustScore(true); }}
                style={{
                  position: "absolute", top: "10px", right: "10px",
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: "var(--radius-full)",
                  padding: "4px 10px",
                  display: "flex", alignItems: "center", gap: "4px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  border: "none", cursor: "pointer",
                  color: trustScore >= 80 ? "var(--success)" : trustScore >= 50 ? "#F59E0B" : "var(--danger)",
                  fontWeight: 800, fontSize: "0.75rem",
                }}
              >
                {trustScore >= 80 ? <ShieldCheck size={13} /> : <AlertTriangle size={13} />}
                {trustScore} AI Score
              </button>
            )}

            {/* Analyzing badge when no score yet */}
            {trustScore === null && (
              <div style={{
                position: "absolute", top: "10px", right: "10px",
                background: "rgba(255,255,255,0.9)", borderRadius: "999px",
                padding: "4px 10px", fontSize: "0.7rem", fontWeight: 700,
                color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px"
              }}>
                <Shield size={12} /> Analyzing…
              </div>
            )}

            {/* Available pill */}
            {listing.is_available && (
              <div style={{
                position: "absolute", bottom: "10px", left: "10px",
                background: "var(--success)", borderRadius: "var(--radius-full)",
                padding: "3px 10px", display: "flex", alignItems: "center", gap: "4px",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "pulse-green 2s infinite" }} />
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#fff" }}>Available</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: "1rem" }}>
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

            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px", lineHeight: 1.3 }}>
              {truncate(listing.title_en, 55)}
            </h3>
            {listing.title_bn && (
              <p className="bangla" style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                {truncate(listing.title_bn, 40)}
              </p>
            )}

            <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
              <Stat icon={<Bed size={13} />} value={`${listing.rooms} bed`} />
              <Stat icon={<Bath size={13} />} value={`${listing.bathrooms} bath`} />
              <Stat icon={<span style={{ fontSize: "12px" }}>🪑</span>} value={listing.furnishing === "fully" ? "Furnished" : listing.furnishing === "semi" ? "Semi" : "Bare"} />
            </div>

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

      {/* AI Trust Score Scorecard Modal */}
      {showTrustScore && typeof document !== "undefined" && createPortal(
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setShowTrustScore(false)}
        >
          <div
            style={{ background: "#fff", width: "100%", maxWidth: "420px", borderRadius: "20px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", padding: "1.5rem" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem" }}>
              <ShieldCheck size={24} style={{ color: "var(--success)" }} />
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>AI Trust Score</h3>
              <button
                onClick={() => setShowTrustScore(false)}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Circular gauge + label */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                border: `6px solid ${trustScore! >= 80 ? "var(--success)" : trustScore! >= 50 ? "#F59E0B" : "var(--danger)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", flexShrink: 0,
              }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{trustScore}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>/ 100</div>
              </div>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: trustScore! >= 80 ? "var(--success)" : trustScore! >= 50 ? "#F59E0B" : "var(--danger)" }}>
                  {trustScore! >= 80 ? "High Trust" : trustScore! >= 50 ? "Medium Trust" : "Suspicious"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>Verified by Thikana AI</div>
              </div>
            </div>

            {/* Progress bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { label: "Price fairness", score: breakdown?.priceFairness ?? 0, max: 25 },
                { label: "Photo quality", score: breakdown?.photoQuality ?? 0, max: 25 },
                { label: "Organized room", score: breakdown?.organizedRoom ?? 0, max: 25 },
                { label: "No duplicate found", score: breakdown?.noDuplicates ?? 0, max: 25 },
              ].map((m, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    <span>{m.label}</span>
                    <span>{m.score}/{m.max}</span>
                  </div>
                  <div style={{ height: "6px", background: "var(--bg-muted)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(m.score / m.max) * 100}%`,
                      background: m.score === m.max ? "var(--success)" : m.score >= m.max * 0.5 ? "#F59E0B" : "var(--danger)",
                      borderRadius: "99px",
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Reasoning */}
            {breakdown?.reasoning && (
              <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--bg-subtle)", borderRadius: "10px", fontSize: "0.85rem", color: "var(--text-primary)", fontStyle: "italic" }}>
                "{breakdown.reasoning}"
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
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
