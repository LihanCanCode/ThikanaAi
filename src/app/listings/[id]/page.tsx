"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin, Bed, Bath, Shield, ChevronLeft, MessageCircle,
  Send, Loader2, Sparkles, CheckCircle, Home, Navigation,
  Clock, Ruler, Star, Eye, Calendar, Phone, Building2,
  ZoomIn, X, ChevronRight, ChevronDown, Trash2
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import ListingMap from "@/components/listings/ListingMap";
import { createClient } from "@/lib/supabase/client";
import { formatBDT, timeAgo, UNIVERSITIES, getDistanceKm } from "@/lib/utils";
import type { Listing } from "@/types";
import { generateTrustScore } from "@/app/actions/ai-trust-score";

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isScoring, setIsScoring] = useState(false);

  useEffect(() => {
    if (listing && (listing.trust_score === null || listing.trust_score_breakdown === null) && !isScoring) {
      setIsScoring(true);
      generateTrustScore(listing.id, "listing").then((res) => {
        if (res.success && res.score) {
          setListing(prev => prev ? {
            ...prev,
            trust_score: res.score?.totalScore ?? 0,
            trust_score_breakdown: res.score as any
          } : prev);
        }
        setIsScoring(false);
      });
    }
  }, [listing, isScoring]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });

    supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setListing(null);
        } else {
          const listingData = data as any;
          if (listingData.landlord_id) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name, phone, avatar_url, verified")
              .eq("id", listingData.landlord_id)
              .single();
            if (profileData) {
              listingData.profiles = profileData;
            }
          }
          setListing(listingData as Listing);
        }
      });
  }, [id]);

  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [showAllBreakdown, setShowAllBreakdown] = useState(false);

  const isOwner = currentUser && listing && currentUser.id === listing.landlord_id;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", id);
      
      if (error) {
        alert("Failed to delete listing: " + error.message);
      } else {
        router.push("/listings");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("An error occurred while deleting the listing.");
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const defaultUniv = listing
    ? UNIVERSITIES.reduce((closest, u) => {
        if (!listing.lat || !listing.lng) return closest;
        const d1 = getDistanceKm(listing.lat, listing.lng, closest.lat, closest.lng);
        const d2 = getDistanceKm(listing.lat, listing.lng, u.lat, u.lng);
        return d2 < d1 ? u : closest;
      }, UNIVERSITIES[0]).id
    : "iut";

  const [selectedUniv, setSelectedUniv] = useState(defaultUniv);

  if (listing === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--mist)" }}>
        <Navbar />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: "1rem" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--emerald), var(--jade))",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "pulse 1.5s ease-in-out infinite",
          }}>
            <Home size={28} color="#fff" />
          </div>
          <p style={{ color: "var(--stone)", fontWeight: 500, fontSize: "0.95rem" }}>Loading listing details…</p>
        </div>
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.8} }`}</style>
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--mist)" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "6rem 1rem" }}>
          <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>🏚️</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--forest)", marginBottom: "0.5rem" }}>Listing Not Found</h1>
          <p style={{ color: "var(--stone)", marginBottom: "1.5rem" }}>This property may have been removed or doesn't exist.</p>
          <Link href="/listings" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "var(--emerald)", color: "#fff",
            padding: "0.75rem 1.5rem", borderRadius: "999px",
            fontWeight: 600, fontSize: "0.9rem", textDecoration: "none",
          }}>
            <Home size={15} /> Browse Listings
          </Link>
        </div>
      </div>
    );
  }

  const trustScore = listing.trust_score ?? null;
  const breakdown = (listing as any).trust_score_breakdown ?? null;
  const trustColorVal = trustScore !== null
    ? (trustScore >= 75 ? "var(--fern)" : trustScore >= 45 ? "#F59E0B" : "#EF4444")
    : "var(--stone)";
  const trustLabel = trustScore !== null
    ? (trustScore >= 75 ? "High Trust" : trustScore >= 45 ? "Moderate" : "Low Trust")
    : "Analyzing…";

  const askNeighborhood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuestion.trim()) return;
    setQaLoading(true);
    setQaAnswer("");
    try {
      const res = await fetch("/api/ai/neighborhood-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: qaQuestion, area: listing.area }),
      });
      const data = await res.json();
      setQaAnswer(data.answer || "Sorry, I couldn't get an answer right now.");
    } catch {
      setQaAnswer("Failed to connect. Please try again.");
    } finally {
      setQaLoading(false);
    }
  };

  const typeBadge = listing.type === "student"
    ? { label: "🎓 Student", bg: "#DCFCE7", color: "#166534" }
    : listing.type === "family"
    ? { label: "👨‍👩‍👧 Family", bg: "#FEF3C7", color: "#92400E" }
    : { label: "💼 Professional", bg: "#EDE9FE", color: "#5B21B6" };

  const nearestUniv = listing.lat && listing.lng
    ? UNIVERSITIES.reduce((closest, u) => {
        const d1 = getDistanceKm(listing.lat!, listing.lng!, closest.lat, closest.lng);
        const d2 = getDistanceKm(listing.lat!, listing.lng!, u.lat, u.lng);
        return d2 < d1 ? u : closest;
      }, UNIVERSITIES[0])
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--mist)" }}>
      <Navbar />

      {/* Lightbox */}
      {lightboxOpen && listing.photos[activePhoto] && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: "absolute", top: "1.5rem", right: "1.5rem",
              background: "rgba(255,255,255,0.15)", border: "none",
              borderRadius: "50%", width: 44, height: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff",
            }}
          ><X size={20} /></button>
          <button
            onClick={(e) => { e.stopPropagation(); setActivePhoto(p => (p - 1 + listing.photos.length) % listing.photos.length); }}
            style={{ position: "absolute", left: "1.5rem", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
          ><ChevronLeft size={22} /></button>
          <img
            src={listing.photos[activePhoto]}
            alt={listing.title_en}
            style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: "12px" }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setActivePhoto(p => (p + 1) % listing.photos.length); }}
            style={{ position: "absolute", right: "1.5rem", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
          ><ChevronRight size={22} /></button>
          <div style={{ position: "absolute", bottom: "1.5rem", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontWeight: 500 }}>
            {activePhoto + 1} / {listing.photos.length}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "1.25rem" }}>
          <Link href="/listings" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--stone)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 500, transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--emerald)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--stone)")}
          >
            <ChevronLeft size={14} /> Listings
          </Link>
          <span style={{ color: "var(--stone)", fontSize: "0.82rem" }}>/</span>
          <span style={{ color: "var(--ink)", fontSize: "0.82rem", fontWeight: 500 }}>{listing.area}</span>
        </div>

        {/* Hero: Full-width photo + details header */}
        <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "var(--shadow-lg)", marginBottom: "1.5rem", position: "relative", background: "#000" }}>
          {/* Main photo */}
          <div style={{ position: "relative", cursor: "zoom-in" }} onClick={() => setLightboxOpen(true)}>
            {listing.photos[activePhoto] ? (
              <img
                src={listing.photos[activePhoto]}
                alt={listing.title_en}
                style={{ width: "100%", height: 460, objectFit: "cover", display: "block", opacity: 0.92 }}
              />
            ) : (
              <div style={{ height: 460, background: "linear-gradient(135deg, #0F2D1F 0%, #166534 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem" }}>🏠</div>
            )}

            {/* Gradient overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(10,20,10,0.75) 0%, transparent 55%)",
            }} />

            {/* Photo counter pill */}
            <div style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
              color: "#fff", fontSize: "0.78rem", fontWeight: 600,
              padding: "4px 12px", borderRadius: 999,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Eye size={12} /> {listing.photos.length} photos
            </div>

            {/* Zoom hint */}
            <div style={{
              position: "absolute", top: 16, left: 16,
              background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
              color: "#fff", fontSize: "0.75rem", fontWeight: 500,
              padding: "4px 10px", borderRadius: 999,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <ZoomIn size={12} /> Click to expand
            </div>

            {/* Title overlay */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.5rem 1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                <span style={{ background: typeBadge.bg, color: typeBadge.color, fontSize: "0.75rem", fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>
                  {typeBadge.label}
                </span>
                {listing.utilities_included && (
                  <span style={{ background: "rgba(34,197,94,0.25)", color: "#86efac", fontSize: "0.75rem", fontWeight: 700, padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(34,197,94,0.4)" }}>
                    ✓ Utilities Included
                  </span>
                )}
                {listing.is_available && (
                  <span style={{ background: "rgba(34,197,94,0.25)", color: "#86efac", fontSize: "0.75rem", fontWeight: 700, padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(34,197,94,0.4)" }}>
                    ● Available Now
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.25, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                {listing.title_en}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
                <MapPin size={13} />
                {listing.address || `${listing.area}, Dhaka`}
                {nearestUniv && listing.lat && listing.lng && (
                  <span style={{ marginLeft: "4px", color: "rgba(255,255,255,0.5)" }}>
                    · {getDistanceKm(listing.lat, listing.lng, nearestUniv.lat, nearestUniv.lng).toFixed(1)} km from {nearestUniv.short_name}
                  </span>
                )}
              </div>
            </div>

            {/* Dot indicators */}
            <div style={{ position: "absolute", bottom: "1rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "5px" }}>
              {listing.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setActivePhoto(i); }}
                  style={{
                    width: i === activePhoto ? 20 : 6, height: 6,
                    borderRadius: 999,
                    background: i === activePhoto ? "#fff" : "rgba(255,255,255,0.45)",
                    border: "none", cursor: "pointer",
                    transition: "all 0.25s var(--ease-spring)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Thumbnail strip */}
          {listing.photos.length > 1 && (
            <div style={{ display: "flex", gap: "4px", padding: "6px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
              {listing.photos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  style={{
                    width: 72, height: 50, flexShrink: 0,
                    borderRadius: 8, overflow: "hidden",
                    border: `2px solid ${i === activePhoto ? "#22C55E" : "transparent"}`,
                    cursor: "pointer", padding: 0, background: "none",
                    transition: "border-color 0.2s ease",
                    opacity: i === activePhoto ? 1 : 0.6,
                  }}
                >
                  <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price strip + stats */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "1rem 1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow-sm)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "1rem",
          border: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "2.2rem", fontWeight: 900, color: "var(--emerald)", fontFamily: "'Playfair Display', serif" }}>
              {formatBDT(listing.rent_bdt)}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--stone)", fontWeight: 500 }}>/month</span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {[
              { icon: "🛏", label: "Bedrooms", val: listing.rooms },
              { icon: "🚿", label: "Bathrooms", val: listing.bathrooms },
              { icon: "🏢", label: "Floor", val: listing.floor ?? "—" },
              { icon: "🪑", label: "Furnishing", val: listing.furnishing === "fully" ? "Full" : listing.furnishing === "semi" ? "Semi" : "Bare" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem" }}>{s.icon}</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)" }}>{s.val}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--stone)", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem" }}>
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Description */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: "1.5rem",
              boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)",
            }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--forest)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <Building2 size={16} style={{ color: "var(--emerald)" }} /> About this property
              </h2>
              {listing.description_en && (
                <p style={{ color: "var(--slate)", lineHeight: 1.8, fontSize: "0.9rem", marginBottom: listing.description_bn ? "1rem" : 0 }}>
                  {listing.description_en}
                </p>
              )}
              {listing.description_bn && (
                <div style={{ background: "var(--mist)", borderRadius: 12, padding: "1rem", borderLeft: "3px solid var(--emerald)" }}>
                  <p className="bangla" style={{ color: "var(--slate)", lineHeight: 1.85, fontSize: "0.9rem", margin: 0 }}>
                    {listing.description_bn}
                  </p>
                </div>
              )}
            </div>

            {/* University distances */}
            {listing.lat && listing.lng && (
              <div style={{
                background: "#fff", borderRadius: 16, padding: "1.5rem",
                boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)",
              }}>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--forest)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  🎓 Distance from Universities
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "8px" }}>
                  {UNIVERSITIES.map(u => {
                    const dist = getDistanceKm(listing.lat!, listing.lng!, u.lat, u.lng);
                    const isNearest = nearestUniv?.id === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUniv(u.id)}
                        style={{
                          background: isNearest ? "linear-gradient(135deg, #DCFCE7, #F0FDF4)" : "var(--mist)",
                          borderRadius: 12, padding: "10px 14px",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          border: `1.5px solid ${isNearest ? "var(--fern)" : "var(--border)"}`,
                          cursor: "pointer", transition: "all 0.2s ease",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--emerald)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isNearest ? "var(--fern)" : "var(--border)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
                      >
                        <div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--forest)" }}>{u.short_name}</div>
                          {isNearest && <div style={{ fontSize: "0.65rem", color: "var(--emerald)", fontWeight: 600 }}>Nearest</div>}
                        </div>
                        <span style={{
                          fontSize: "0.82rem", fontWeight: 800,
                          color: dist <= 2 ? "var(--fern)" : dist <= 5 ? "#F59E0B" : "var(--stone)",
                        }}>
                          {dist.toFixed(1)} km
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--stone)", marginTop: "8px", fontStyle: "italic" }}>
                  💡 Click a university card to view its route on the map below
                </p>
              </div>
            )}

            {/* Map & Route */}
            {listing.lat && listing.lng && (
              <div style={{
                background: "#fff", borderRadius: 16, overflow: "hidden",
                boxShadow: "var(--shadow-md)", border: "1px solid var(--border)",
              }}>
                {/* Map header */}
                <div style={{
                  padding: "1rem 1.5rem",
                  background: "linear-gradient(135deg, #0F2D1F 0%, #166534 100%)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexWrap: "wrap", gap: "10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Navigation size={16} color="#fff" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", margin: 0 }}>Interactive Map & Route</h2>
                      <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", margin: 0 }}>Walking directions to nearest university</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>Route to:</span>
                    <select
                      className="input"
                      value={selectedUniv}
                      onChange={e => setSelectedUniv(e.target.value)}
                      style={{
                        width: "auto", padding: "0.35rem 0.75rem",
                        fontSize: "0.82rem", fontWeight: 600,
                        background: "rgba(255,255,255,0.12)",
                        border: "1.5px solid rgba(255,255,255,0.3)",
                        color: "#fff", borderRadius: 10,
                        cursor: "pointer",
                      }}
                    >
                      {UNIVERSITIES.map(u => (
                        <option key={u.id} value={u.id} style={{ color: "#000" }}>{u.short_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Map container */}
                <div style={{ height: 460, position: "relative" }}>
                  <ListingMap
                    listings={[listing]}
                    selectedUniversityId={selectedUniv}
                    activeListingId={listing.id}
                  />
                </div>

                {/* Map footer note */}
                <div style={{
                  padding: "0.75rem 1.25rem",
                  background: "var(--mist)",
                  borderTop: "1px solid var(--border)",
                  display: "flex", alignItems: "center", gap: "6px",
                  fontSize: "0.75rem", color: "var(--stone)",
                }}>
                  <MapPin size={12} style={{ color: "var(--emerald)", flexShrink: 0 }} />
                  🟢 Green pin = This property &nbsp;·&nbsp; 🔵 Blue pin = University &nbsp;·&nbsp; Green line = Walking route
                </div>
              </div>
            )}

            {/* AI Neighborhood Q&A */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: "1.5rem",
              boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: "linear-gradient(135deg, #166534, #22C55E)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Sparkles size={16} color="#fff" />
                </div>
                <div>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--forest)", margin: 0 }}>Ask About {listing.area}</h2>
                  <p style={{ fontSize: "0.72rem", color: "var(--stone)", margin: 0 }}>AI-powered neighborhood insights</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                {["How safe the area is?", "Where is the market located?", "Which wifi service is available here?", "Nearest hospital?", "Transport options?"].map(q => (
                  <button
                    key={q}
                    onClick={() => setQaQuestion(q)}
                    style={{
                      padding: "5px 13px", borderRadius: 999,
                      border: `1.5px solid ${qaQuestion === q ? "var(--emerald)" : "var(--border)"}`,
                      background: qaQuestion === q ? "var(--foam)" : "#fff",
                      color: qaQuestion === q ? "var(--emerald)" : "var(--slate)",
                      fontSize: "0.78rem", fontWeight: 500, cursor: "pointer",
                      fontFamily: "inherit", transition: "all 0.15s",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <form onSubmit={askNeighborhood} style={{ display: "flex", gap: "8px" }}>
                <input
                  value={qaQuestion}
                  onChange={e => setQaQuestion(e.target.value)}
                  placeholder={`Ask anything about ${listing.area}…`}
                  className="input"
                  style={{ flex: 1, fontSize: "0.88rem" }}
                />
                <button
                  type="submit"
                  disabled={qaLoading}
                  style={{
                    background: "var(--emerald)", color: "#fff", border: "none",
                    borderRadius: 12, padding: "0.6rem 1.1rem",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                    fontWeight: 600, fontSize: "0.85rem", transition: "background 0.15s",
                  }}
                >
                  {qaLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={15} />}
                  {qaLoading ? "" : "Ask"}
                </button>
              </form>

              {qaAnswer && (
                <div style={{
                  marginTop: "12px",
                  background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
                  borderRadius: 12, padding: "1rem 1.1rem",
                  borderLeft: "3px solid var(--emerald)",
                }}>
                  <p style={{ fontSize: "0.88rem", color: "var(--slate)", lineHeight: 1.75, margin: 0 }}>
                    <strong style={{ color: "var(--emerald)" }}>🤖 Thikana AI: </strong>{qaAnswer}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — sticky sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignSelf: "flex-start", position: "sticky", top: "80px" }}>

            {/* Price card */}
            <div style={{
              background: "linear-gradient(135deg, #0F2D1F 0%, #166534 100%)",
              borderRadius: 16, padding: "1.25rem",
              boxShadow: "var(--shadow-lg)",
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: "#fff" }}>{formatBDT(listing.rent_bdt)}</span>
                <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>/month</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", marginBottom: "1rem" }}>
                📍 {listing.area}, Dhaka
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {isOwner ? (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    style={{
                      background: "#EF4444", color: "#fff", border: "none",
                      borderRadius: 12, padding: "0.75rem 1rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: "8px", fontWeight: 700, fontSize: "0.9rem",
                      cursor: "pointer", transition: "background 0.15s, transform 0.1s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#DC2626")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#EF4444")}
                  >
                    <Trash2 size={15} /> Delete Listing
                  </button>
                ) : (
                  <>
                    <a
                      href="tel:+8801700000000"
                      style={{
                        background: "#22C55E", color: "#fff", textDecoration: "none",
                        borderRadius: 12, padding: "0.75rem 1rem",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: "8px", fontWeight: 700, fontSize: "0.9rem",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#16A34A")}
                      onMouseLeave={e => (e.currentTarget.style.background = "#22C55E")}
                    >
                      <Phone size={15} /> Call Landlord
                    </a>
                    <button
                      style={{
                        background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)",
                        borderRadius: 12, padding: "0.75rem 1rem",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: "8px", fontWeight: 600, fontSize: "0.88rem",
                        cursor: "pointer", transition: "background 0.15s", fontFamily: "inherit",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                    >
                      <MessageCircle size={15} /> Send Message
                    </button>
                  </>
                )}
              </div>
              <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "10px" }}>
                🛡️ Zero broker fees · Direct contact
              </p>
            </div>

            {/* Landlord card */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: "1.25rem",
              boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)",
            }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--forest)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Landlord</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {listing.profiles?.avatar_url ? (
                  <img
                    src={listing.profiles.avatar_url}
                    alt={listing.profiles.full_name || "Landlord"}
                    style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }}
                  />
                ) : (
                  <div style={{
                    width: 46, height: 46, borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--mint), var(--foam))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.4rem", border: "2px solid var(--border)",
                  }}>
                    {listing.profiles?.full_name ? listing.profiles.full_name.charAt(0).toUpperCase() : "👤"}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" }}>
                    {listing.profiles?.full_name || "Verified Landlord"}
                  </div>
                  {listing.profiles?.verified ? (
                    <div style={{ fontSize: "0.75rem", color: "var(--fern)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <CheckCircle size={11} style={{ color: "#10b981" }} /> Identity Verified
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.75rem", color: "var(--stone)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--stone)" }} /> Standard Member
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: "12px", padding: "10px 12px", background: "var(--mist)", borderRadius: 10, fontSize: "0.78rem", color: "var(--slate)" }}>
                🕐 Listed {listing.created_at ? timeAgo(listing.created_at) : "recently"}
              </div>
            </div>

            {/* AI Trust Score */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: "1.25rem",
              boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--forest)", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                  <Shield size={14} style={{ color: trustColorVal }} /> AI Trust Score
                </h3>
                {isOwner && (
                  <button 
                    onClick={() => {
                      setIsScoring(true);
                      generateTrustScore(listing.id, "listing").then((res) => {
                        if (res.success && res.score) {
                          setListing(prev => prev ? {
                            ...prev,
                            trust_score: res.score?.totalScore ?? 0,
                            trust_score_breakdown: res.score as any
                          } : prev);
                        }
                        setIsScoring(false);
                      });
                    }}
                    disabled={isScoring}
                    style={{ background: "none", border: "none", color: "var(--emerald)", fontSize: "0.75rem", fontWeight: 600, cursor: isScoring ? "not-allowed" : "pointer", opacity: isScoring ? 0.5 : 1, display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    {isScoring ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Recalculate
                  </button>
                )}
              </div>

              {/* Circular gauge */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                <div style={{
                  width: 76, height: 76, borderRadius: "50%",
                  background: trustScore !== null
                    ? `conic-gradient(${trustColorVal} ${trustScore * 3.6}deg, #F3F4F6 0deg)`
                    : "#F3F4F6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, position: "relative",
                }}>
                  <div style={{
                    width: 58, height: 58, borderRadius: "50%",
                    background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexDirection: "column",
                  }}>
                    {trustScore !== null ? (
                      <>
                        <span style={{ fontWeight: 900, fontSize: "1.15rem", color: trustColorVal, lineHeight: 1 }}>{trustScore}</span>
                        <span style={{ fontSize: "0.55rem", color: "var(--stone)" }}>/ 100</span>
                      </>
                    ) : (
                      <Loader2 size={16} style={{ color: "var(--stone)", animation: "spin 1.5s linear infinite" }} />
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: trustColorVal, fontSize: "1rem" }}>{trustLabel}</div>
                  <div style={{ fontSize: "0.73rem", color: "var(--stone)" }}>Verified by Thikana AI</div>
                  {trustScore !== null && (
                    <div style={{ fontSize: "0.7rem", color: "var(--stone)", marginTop: "4px" }}>
                      {trustScore >= 75 ? "✅ Safe to contact" : trustScore >= 45 ? "⚠️ Verify before paying" : "❌ High risk listing"}
                    </div>
                  )}
                </div>
              </div>

              {/* Score breakdown */}
              {breakdown ? (
                <>
                  {[
                    { label: "Price Anomaly", score: breakdown.price?.score ?? 0, max: 30, note: breakdown.price?.note },
                    { label: "Photo Evidence", score: breakdown.photos?.score ?? 0, max: 20, note: breakdown.photos?.note },
                    { label: "Description Quality", score: breakdown.description?.score ?? 0, max: 20, note: breakdown.description?.note },
                    ...(showAllBreakdown ? [
                      { label: "NLP Duplicate Check", score: breakdown.duplicate?.score ?? 0, max: 15, note: breakdown.duplicate?.note },
                      { label: "pHash Image Check", score: breakdown.photo_hash?.score ?? 0, max: 15, note: breakdown.photo_hash?.note },
                    ] : []),
                  ].map(item => (
                    <div key={item.label} style={{ marginBottom: "9px" }} title={item.note}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.73rem", marginBottom: "3px" }}>
                        <span style={{ color: "var(--stone)", fontWeight: 500 }}>{item.label}</span>
                        <span style={{ fontWeight: 700, color: "var(--slate)" }}>{item.score}/{item.max}</span>
                      </div>
                      <div style={{ height: 5, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          width: `${(item.score / item.max) * 100}%`,
                          height: "100%",
                          background: item.score >= item.max * 0.8 ? "var(--fern)" : item.score >= item.max * 0.4 ? "#F59E0B" : "#EF4444",
                          borderRadius: 99, transition: "width 0.6s var(--ease-out)",
                        }} />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowAllBreakdown(v => !v)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--emerald)", fontSize: "0.75rem", fontWeight: 600,
                      padding: "4px 0", display: "flex", alignItems: "center", gap: "4px",
                      fontFamily: "inherit",
                    }}
                  >
                    <ChevronDown size={13} style={{ transform: showAllBreakdown ? "rotate(180deg)" : "", transition: "transform 0.2s" }} />
                    {showAllBreakdown ? "Show less" : "Show full breakdown"}
                  </button>
                </>
              ) : (
                <div style={{ fontSize: "0.8rem", color: "var(--stone)", textAlign: "center", padding: "0.5rem 0" }}>
                  {trustScore !== null ? "Score details unavailable" : "🔍 AI is analyzing this listing…"}
                </div>
              )}
            </div>

            {/* Quick facts */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: "1.25rem",
              boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)",
            }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--forest)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Info</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { icon: "📍", label: "Area", val: listing.area },
                  { icon: "🏗", label: "Type", val: typeBadge.label },
                  { icon: "🪑", label: "Furnishing", val: listing.furnishing === "fully" ? "Fully Furnished" : listing.furnishing === "semi" ? "Semi-Furnished" : "Unfurnished" },
                  ...(listing.floor !== undefined && listing.floor !== null ? [{ icon: "🏢", label: "Floor", val: String(listing.floor) }] : []),
                  { icon: "⚡", label: "Utilities", val: listing.utilities_included ? "Included" : "Not included" },
                  { icon: "🔑", label: "Status", val: listing.is_available ? "Available" : "Not Available" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--mist)" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--stone)" }}>{item.icon} {item.label}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ink)" }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div
          onClick={() => setShowConfirmDelete(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: "2rem",
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              border: "1px solid var(--border)",
              textAlign: "center",
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#FEE2E2",
              color: "#EF4444",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1rem",
              fontSize: "1.5rem",
            }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--forest)", marginBottom: "0.5rem" }}>
              Delete Listing?
            </h3>
            <p style={{ color: "var(--stone)", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Are you sure you want to delete this listing? This action is permanent and cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  background: "var(--mist)", color: "var(--slate)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: "0.75rem",
                  fontWeight: 600, fontSize: "0.88rem",
                  cursor: "pointer", transition: "background 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--border)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--mist)")}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  background: "#EF4444", color: "#fff", border: "none",
                  borderRadius: 12, padding: "0.75rem",
                  fontWeight: 700, fontSize: "0.88rem",
                  cursor: "pointer", transition: "background 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  fontFamily: "inherit",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#DC2626")}
                onMouseLeave={e => (e.currentTarget.style.background = "#EF4444")}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
