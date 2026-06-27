"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ShieldCheck, AlertTriangle, X, CheckCircle2, Heart } from "lucide-react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { formatBDT, timeAgo, truncate } from "@/lib/utils";
import type { Listing } from "@/types";
import { springTransition } from "@/lib/animations";

interface ListingCardProps {
  listing: Listing;
  distanceKm?: number;
}

export default function ListingCard({ listing, distanceKm }: ListingCardProps) {
  const [showTrustScore, setShowTrustScore] = useState(false);
  const trustScore = listing.trust_score ?? null;
  const breakdown = (listing as any).trust_score_breakdown ?? null;
  const isHighTrust = trustScore !== null && trustScore >= 80;

  return (
    <>
      <motion.div
        whileHover={{ y: -6, transition: springTransition }}
        className="group relative bg-white rounded-[16px] border border-[var(--foam)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-shadow duration-350 overflow-hidden flex flex-col"
      >
        <Link href={`/listings/${listing.id}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Image Container */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--mist)]">
            {listing.photos && listing.photos[0] ? (
              <Image
                src={listing.photos[0]}
                alt={listing.title_en}
                fill
                className="object-cover transition-transform duration-350 group-hover:scale-105"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-[var(--slate)] text-4xl bg-[var(--mist)]">
                🏠
              </div>
            )}
            
            {/* Type & Gender Badges overlay */}
            <div className="absolute top-3 left-3 flex gap-2 flex-wrap z-10">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm ${
                listing.type === "student" ? "bg-[var(--emerald)]/90 text-white" : 
                listing.type === "family" ? "bg-[var(--gold)]/90 text-white" : 
                "bg-[var(--slate)]/90 text-white"
              }`}>
                {listing.type === "student" ? "🎓 Student" : listing.type === "family" ? "👨‍👩‍👧 Family" : "💼 Professional"}
              </span>
              {listing.for_gender && listing.for_gender !== "any" && (
                <span className="bg-white/90 text-[var(--forest)] px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm border border-[var(--foam)]">
                  {listing.for_gender === "male" ? "👨 Male" : "👩 Female"}
                </span>
              )}
            </div>

            {/* AI Trust Score Badge */}
            {trustScore !== null && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTrustScore(true); }}
                className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-sm transition-transform hover:scale-105 z-10 ${
                  isHighTrust 
                    ? "bg-[var(--amber-soft)]/95 text-[var(--gold)] border border-[var(--gold)]/20" 
                    : trustScore >= 50 
                    ? "bg-[#FEF3C7]/95 text-[#D97706] border border-[#D97706]/20"
                    : "bg-[#FEE2E2]/95 text-[#DC2626] border border-[#DC2626]/20"
                }`}
              >
                {trustScore >= 80 ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                <span>{trustScore} AI Score</span>
              </button>
            )}

            {/* Analyzing badge when no score yet */}
            {trustScore === null && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-sm bg-white/90 text-[var(--text-muted)] border border-[var(--foam)] z-10">
                <span className="w-2 h-2 rounded-full border-2 border-[var(--slate)] border-t-transparent animate-spin" />
                Analyzing
              </div>
            )}

            {/* Available pill */}
            {listing.is_available && (
              <div className="absolute bottom-3 left-3 bg-[var(--success)]/95 text-white backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Available</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col gap-2 flex-grow bg-white">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1 text-[var(--stone)] text-xs font-medium mb-1">
                  <MapPin size={12} />
                  {listing.area}
                </div>
                <h3 className="font-['Playfair_Display'] font-semibold text-lg text-[var(--forest)] leading-tight line-clamp-1">
                  {truncate(listing.title_en, 50)}
                </h3>
                {listing.title_bn && (
                  <p className="bangla text-xs text-[var(--slate)] mt-1 line-clamp-1">
                    {truncate(listing.title_bn, 40)}
                  </p>
                )}
              </div>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="text-[var(--stone)] hover:text-red-500 transition-colors shrink-0 z-10"
              >
                <Heart size={18} />
              </button>
            </div>

            <div className="text-[var(--slate)] text-sm mb-1 mt-1 font-medium">
              {listing.rooms} Bed &middot; {listing.bathrooms} Bath
            </div>

            <div className="text-[var(--emerald)] font-bold text-xl bangla mb-2 mt-auto">
              ৳{listing.rent_bdt.toLocaleString('en-IN')} <span className="text-sm font-normal text-[var(--stone)] font-sans">/ month</span>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-[var(--foam)] my-1" />

            {/* Footer info */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {distanceKm !== undefined && (
                  <span className="text-xs font-semibold text-[var(--forest)] bg-[var(--mist)] px-2 py-1 rounded-md flex items-center gap-1">
                    🎓 {distanceKm.toFixed(1)} km
                  </span>
                )}
                {listing.utilities_included && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--success)] bg-[#ECFDF5] px-2 py-1 rounded-md flex items-center gap-1">
                    <CheckCircle2 size={12} /> Utilities
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-[var(--slate)] uppercase tracking-wider">
                {timeAgo(listing.created_at)}
              </span>
            </div>
          </div>
        </Link>
      </motion.div>

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
