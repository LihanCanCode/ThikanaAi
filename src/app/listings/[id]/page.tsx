"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { MapPin, Bed, Bath, Shield, ChevronLeft, MessageCircle, Send, Loader2, Sparkles, CheckCircle, Home } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import ListingMap from "@/components/listings/ListingMap";
import { SEED_LISTINGS } from "@/lib/seed-listings";
import { createClient } from "@/lib/supabase/client";
import { formatBDT, timeAgo, trustColor, UNIVERSITIES, getDistanceKm } from "@/lib/utils";
import type { Listing } from "@/types";

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [listing, setListing] = useState<Listing | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    // First try to find in seed data (fast)
    const seed = SEED_LISTINGS.find(l => l.id === id) as Listing | undefined;
    if (seed) {
      setListing(seed);
      return;
    }
    // Otherwise fetch from Supabase
    const supabase = createClient();
    supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setListing(null); // not found
        } else {
          setListing(data as Listing);
        }
      });
  }, [id]);


  const [activePhoto, setActivePhoto] = useState(0);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  
  // Find the closest university to use as default for the map route
  const defaultUniv = listing ? UNIVERSITIES.reduce((closest, u) => {
    if (!listing.lat || !listing.lng) return closest;
    const d1 = getDistanceKm(listing.lat, listing.lng, closest.lat, closest.lng);
    const d2 = getDistanceKm(listing.lat, listing.lng, u.lat, u.lng);
    return d2 < d1 ? u : closest;
  }, UNIVERSITIES[0]).id : "iut";
  
  const [selectedUniv, setSelectedUniv] = useState(defaultUniv);

  if (listing === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "5rem 1rem", color: "var(--text-muted)" }}>
          <Loader2 size={36} style={{ animation: "spin 1s linear infinite", marginBottom: "1rem", color: "var(--primary)" }} />
          <p>Loading listing...</p>
        </div>
        <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "5rem 1rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🏚️</div>
          <h1 style={{ marginBottom: "0.5rem" }}>Listing Not Found</h1>
          <Link href="/listings" className="btn btn-primary" style={{ marginTop: "1rem" }}>Browse Listings</Link>
        </div>
      </div>
    );
  }


  const trustScore = listing.trust_score ?? null;
  const breakdown = (listing as any).trust_score_breakdown ?? null;
  const trustColorVal = trustScore !== null
    ? (trustScore >= 75 ? "var(--success)" : trustScore >= 45 ? "var(--warning)" : "var(--danger)")
    : "var(--text-muted)";

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

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />

      <div className="container" style={{ padding: "1.5rem" }}>
        {/* Back */}
        <Link href="/listings" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", marginBottom: "1.25rem", fontWeight: 500 }}>
          <ChevronLeft size={16} /> Back to listings
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
          {/* Left: Photos + Details */}
          <div>
            {/* Photo gallery */}
            <div style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", marginBottom: "1rem", position: "relative" }}>
              {listing.photos[activePhoto] ? (
                <img src={listing.photos[activePhoto]} alt={listing.title_en}
                  style={{ width: "100%", height: "380px", objectFit: "cover" }} />
              ) : (
                <div style={{ height: "380px", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>🏠</div>
              )}
              <div style={{
                position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)",
                display: "flex", gap: "6px",
              }}>
                {listing.photos.map((_, i) => (
                  <button key={i} onClick={() => setActivePhoto(i)} style={{
                    width: i === activePhoto ? 24 : 8, height: 8,
                    borderRadius: "var(--radius-full)",
                    background: i === activePhoto ? "#fff" : "rgba(255,255,255,0.5)",
                    border: "none", cursor: "pointer",
                    transition: "all 0.2s ease",
                  }} />
                ))}
              </div>
            </div>

            {/* Thumbnail row */}
            {listing.photos.length > 1 && (
              <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
                {listing.photos.map((p, i) => (
                  <button key={i} onClick={() => setActivePhoto(i)} style={{
                    width: 72, height: 54, borderRadius: "var(--radius-md)",
                    overflow: "hidden", border: `2px solid ${i === activePhoto ? "var(--primary)" : "var(--border)"}`,
                    cursor: "pointer", padding: 0, background: "none",
                  }}>
                    <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}

            {/* Title block */}
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span className={`badge badge-${listing.type === "student" ? "green" : listing.type === "family" ? "amber" : "muted"}`}>
                      {listing.type === "student" ? "🎓 Student" : listing.type === "family" ? "👨‍👩‍👧 Family" : "💼 Professional"}
                    </span>
                    {listing.utilities_included && <span className="badge badge-green">✓ Utilities Included</span>}
                    {listing.is_available && <span className="badge badge-green">● Available</span>}
                  </div>
                  <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "4px" }}>{listing.title_en}</h1>
                  {listing.title_bn && <p className="bangla" style={{ fontSize: "1rem", color: "var(--text-muted)" }}>{listing.title_bn}</p>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--primary)" }}>{formatBDT(listing.rent_bdt)}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>per month</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <MapPin size={14} style={{ color: "var(--primary)" }} />
                {listing.address || listing.area + ", Dhaka"}
              </div>

              {/* Key stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "1.25rem" }}>
                {[
                  { icon: "🛏", label: "Bedrooms", val: listing.rooms },
                  { icon: "🚿", label: "Bathrooms", val: listing.bathrooms },
                  { icon: "🏢", label: "Floor", val: listing.floor ?? "—" },
                  { icon: "🪑", label: "Furnishing", val: listing.furnishing === "fully" ? "Full" : listing.furnishing === "semi" ? "Semi" : "Bare" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", padding: "12px 8px" }}>
                    <div style={{ fontSize: "1.3rem" }}>{s.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>{s.val}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>About this property</h2>
              {listing.description_en && <p style={{ color: "var(--text-secondary)", lineHeight: 1.75, fontSize: "0.9rem", marginBottom: listing.description_bn ? "1rem" : 0 }}>{listing.description_en}</p>}
              {listing.description_bn && (
                <div style={{ background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", padding: "1rem", borderLeft: "3px solid var(--primary)" }}>
                  <p className="bangla" style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "0.9rem" }}>{listing.description_bn}</p>
                </div>
              )}
            </div>

            {/* University distances */}
            {listing.lat && listing.lng && (
              <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>🎓 Distance from Universities</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
                  {UNIVERSITIES.map(u => {
                    const dist = getDistanceKm(listing.lat!, listing.lng!, u.lat, u.lng);
                    return (
                      <div key={u.id} style={{ background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>{u.short_name}</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: dist <= 2 ? "var(--success)" : dist <= 5 ? "var(--warning)" : "var(--text-muted)" }}>
                          {dist.toFixed(1)} km
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Map & Routing */}
            {listing.lat && listing.lng && (
              <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>🗺️ Map & Route</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Route to:</span>
                    <select className="input" style={{ width: "auto", padding: "0.3rem 0.6rem", fontSize: "0.85rem" }}
                      value={selectedUniv} onChange={e => setSelectedUniv(e.target.value)}>
                      {UNIVERSITIES.map(u => <option key={u.id} value={u.id}>{u.short_name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ height: "450px", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
                  <ListingMap
                    listings={[listing]}
                    selectedUniversityId={selectedUniv}
                    activeListingId={listing.id}
                  />
                </div>
              </div>
            )}

            {/* Neighborhood Q&A */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
                <div style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={15} style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Ask About {listing.area}</h2>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>AI-powered neighborhood insights</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                {["Is it safe?", "Transport options?", "Nearby markets?", "Good for students?"].map(q => (
                  <button key={q} onClick={() => setQaQuestion(q)} style={{
                    padding: "4px 12px", borderRadius: "var(--radius-full)",
                    border: "1px solid var(--border)", background: "var(--bg-subtle)",
                    color: "var(--text-secondary)", fontSize: "0.78rem", cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--primary-light)"; (e.currentTarget as HTMLElement).style.color = "var(--primary)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}>
                    {q}
                  </button>
                ))}
              </div>

              <form onSubmit={askNeighborhood} style={{ display: "flex", gap: "8px" }}>
                <input value={qaQuestion} onChange={e => setQaQuestion(e.target.value)}
                  placeholder={`Ask anything about ${listing.area}...`}
                  className="input" style={{ flex: 1 }} />
                <button type="submit" disabled={qaLoading} className="btn btn-primary" style={{ padding: "0.6rem 1rem" }}>
                  {qaLoading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={15} />}
                </button>
              </form>

              {qaAnswer && (
                <div style={{ marginTop: "12px", background: "var(--primary-xlight)", borderRadius: "var(--radius-md)", padding: "1rem", borderLeft: "3px solid var(--primary)" }}>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    <strong style={{ color: "var(--primary)" }}>🤖 Thikana AI: </strong>{qaAnswer}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Contact card */}
          <div style={{ position: "sticky", top: "80px", alignSelf: "flex-start" }}>
            {/* Trust score card */}
            <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Shield size={15} style={{ color: trustColorVal }} /> AI Trust Score
              </h3>
              {/* Circle gauge */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: trustScore !== null
                    ? `conic-gradient(${trustColorVal} ${trustScore * 3.6}deg, var(--bg-muted) 0deg)`
                    : "var(--bg-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "var(--bg-surface)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexDirection: "column",
                  }}>
                    {trustScore !== null ? (
                      <>
                        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: trustColorVal }}>{trustScore}</span>
                        <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>/ 100</span>
                      </>
                    ) : (
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.2 }}>AI<br/>Analyzing</span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: trustColorVal, fontSize: "0.95rem" }}>
                    {trustScore !== null
                      ? (trustScore >= 75 ? "High Trust" : trustScore >= 45 ? "Moderate" : "Low Trust")
                      : "Analyzing…"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Verified by Thikana AI</div>
                </div>
              </div>

              {/* Score bars — real data from DB */}
              {breakdown ? (
                [
                  { label: "Price fairness", score: breakdown.priceFairness ?? 0, max: 25 },
                  { label: "Photo quality", score: breakdown.photoQuality ?? 0, max: 25 },
                  { label: "Organized room", score: breakdown.organizedRoom ?? 0, max: 25 },
                  { label: "No duplicate found", score: breakdown.noDuplicates ?? 0, max: 25 },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "3px" }}>
                      <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{item.score}/{item.max}</span>
                    </div>
                    <div style={{ height: 4, background: "var(--bg-muted)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${(item.score / item.max) * 100}%`, height: "100%", background: item.score >= item.max ? "var(--success)" : item.score >= item.max * 0.5 ? "#F59E0B" : "var(--danger)", borderRadius: 2 }} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", padding: "0.5rem 0" }}>
                  {trustScore !== null ? "Score details unavailable" : "🔍 AI is analyzing this listing…"}
                </div>
              )}

              {/* AI Reasoning */}
              {breakdown?.reasoning && (
                <div style={{ marginTop: "10px", padding: "10px", background: "var(--bg-subtle)", borderRadius: "8px", fontSize: "0.78rem", color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.5 }}>
                  "{breakdown.reasoning}"
                </div>
              )}
            </div>

            {/* Contact card */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem" }}>Contact Landlord</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>👤</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Verified Landlord</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--success)", display: "flex", alignItems: "center", gap: "3px" }}>
                    <CheckCircle size={11} /> Identity Verified
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <a href="tel:+8801700000000" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  📞 Call Landlord
                </a>
                <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }}>
                  <MessageCircle size={15} /> Send Message
                </button>
              </div>
              <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", textAlign: "center", marginTop: "10px" }}>
                🛡️ Zero broker fees · Direct contact
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
