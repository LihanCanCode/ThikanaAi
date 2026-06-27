"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { MapPin, Users, Bed, Shield, ShieldCheck, AlertTriangle, ChevronLeft, Phone, CheckCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { createClient } from "@/lib/supabase/client";
import { formatBDT, timeAgo, UNIVERSITIES } from "@/lib/utils";
import type { RoomShare } from "@/app/student/room-share-actions";

export default function RoomShareDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [room, setRoom] = useState<(RoomShare & { trust_score_breakdown?: any }) | null | undefined>(undefined);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("room_shares")
      .select(`
        *,
        creator:profiles!creator_id(full_name, university, verified)
      `)
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        setRoom(error || !data ? null : (data as any));
      });
  }, [id]);

  if (room === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "5rem 1rem", color: "var(--text-muted)" }}>
          <Loader2 size={36} style={{ animation: "spin 1s linear infinite", marginBottom: "1rem", color: "var(--primary)" }} />
          <p>Loading room details...</p>
        </div>
        <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "5rem 1rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔑</div>
          <h1 style={{ marginBottom: "0.5rem" }}>Room Not Found</h1>
          <Link href="/student/feed" className="btn btn-primary" style={{ marginTop: "1rem" }}>Back to Feed</Link>
        </div>
      </div>
    );
  }

  const trustScore = (room as any).trust_score ?? null;
  const breakdown = room.trust_score_breakdown ?? null;
  const trustColorVal = trustScore !== null
    ? (trustScore >= 75 ? "var(--success)" : trustScore >= 45 ? "#F59E0B" : "var(--danger)")
    : "var(--text-muted)";
  const photos = room.photos ?? [];
  const creatorProfile = (room as any).creator ?? {};
  const creatorName = creatorProfile.full_name ?? "Student Roommate";
  const creatorUniv = UNIVERSITIES.find(u => u.id === creatorProfile.university)?.short_name ?? "";
  const preferredUniv = UNIVERSITIES.find(u => u.id === room.university_restriction);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      <div className="container" style={{ padding: "1.5rem" }}>
        {/* Back */}
        <Link href="/student/feed" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", marginBottom: "1.25rem", fontWeight: 500 }}>
          <ChevronLeft size={16} /> Back to Feed
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "flex-start" }}>
          {/* ── LEFT COLUMN ── */}
          <div>
            {/* Photo gallery */}
            <div style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", marginBottom: "1rem", position: "relative" }}>
              {photos[activePhoto] ? (
                <img src={photos[activePhoto]} alt={room.title_en}
                  style={{ width: "100%", height: "380px", objectFit: "cover" }} />
              ) : (
                <div style={{ height: "380px", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>🔑</div>
              )}
              {/* Dot nav */}
              {photos.length > 1 && (
                <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px" }}>
                  {photos.map((_: any, i: number) => (
                    <button key={i} onClick={() => setActivePhoto(i)} style={{
                      width: i === activePhoto ? 24 : 8, height: 8,
                      borderRadius: "999px", background: i === activePhoto ? "#fff" : "rgba(255,255,255,0.5)",
                      border: "none", cursor: "pointer", transition: "all 0.2s"
                    }} />
                  ))}
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {photos.length > 1 && (
              <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
                {photos.map((p: string, i: number) => (
                  <button key={i} onClick={() => setActivePhoto(i)} style={{
                    width: 72, height: 54, borderRadius: "var(--radius-md)", overflow: "hidden",
                    border: `2px solid ${i === activePhoto ? "var(--primary)" : "var(--border)"}`,
                    cursor: "pointer", padding: 0, background: "none",
                  }}>
                    <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}

            {/* Title + key info */}
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span className="badge badge-green">🔑 Shared Room</span>
                    <span className="badge badge-muted">
                      {room.gender_restriction === "male" ? "👦 Males Only" : room.gender_restriction === "female" ? "👧 Females Only" : "🚻 Mixed Flat"}
                    </span>
                    {preferredUniv && <span className="badge badge-amber">🎓 {preferredUniv.short_name} Preferred</span>}
                  </div>
                  <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "4px" }}>{room.title_en}</h1>
                  {room.title_bn && <p className="bangla" style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "8px" }}>{room.title_bn}</p>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--primary)" }}>{formatBDT(room.rent_bdt)}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>per seat / month</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <MapPin size={14} style={{ color: "var(--primary)" }} />
                {room.address ? `${room.address}, ${room.area}` : `${room.area}, Dhaka`}
              </div>

              {/* Roommate stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "1.25rem" }}>
                {[
                  { icon: <Users size={20} />, label: "Current Flatmates", val: room.current_roommates, color: "var(--primary)" },
                  { icon: <Bed size={20} />, label: "Available Seats", val: room.available_seats, color: "var(--success)" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center", background: "var(--primary-xlight)", borderRadius: "var(--radius-md)", padding: "16px 8px" }}>
                    <div style={{ color: s.color, marginBottom: "4px" }}>{s.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: "1.4rem", color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {(room.description_en || room.description_bn) && (
              <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>About this room</h2>
                {room.description_en && <p style={{ color: "var(--text-secondary)", lineHeight: 1.75, fontSize: "0.9rem", marginBottom: room.description_bn ? "1rem" : 0 }}>{room.description_en}</p>}
                {room.description_bn && (
                  <div style={{ background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", padding: "1rem", borderLeft: "3px solid var(--primary)" }}>
                    <p className="bangla" style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "0.9rem" }}>{room.description_bn}</p>
                  </div>
                )}
              </div>
            )}

            {/* Posted by */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Posted by</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${room.id}`}
                  alt="" style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid var(--primary-light)" }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    {creatorName}
                    {creatorProfile.verified && (
                      <ShieldCheck size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                    )}
                  </div>
                  {creatorUniv && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>🎓 {creatorUniv} Student</div>}
                  {room.created_at && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Posted {timeAgo(room.created_at)}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN (sticky) ── */}
          <div style={{ position: "sticky", top: "80px", alignSelf: "flex-start" }}>
            {/* AI Trust Score Card */}
            <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                {trustScore !== null && trustScore >= 75
                  ? <ShieldCheck size={15} style={{ color: "var(--success)" }} />
                  : trustScore !== null
                    ? <AlertTriangle size={15} style={{ color: trustColorVal }} />
                    : <Shield size={15} style={{ color: "var(--text-muted)" }} />
                }
                AI Trust Score
              </h3>

              {/* Gauge */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: trustScore !== null
                    ? `conic-gradient(${trustColorVal} ${trustScore * 3.6}deg, var(--bg-muted) 0deg)`
                    : "var(--bg-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                    {trustScore !== null ? (
                      <>
                        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: trustColorVal }}>{trustScore}</span>
                        <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>/ 100</span>
                      </>
                    ) : (
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.2 }}>AI<br />Analyzing</span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: trustColorVal, fontSize: "0.95rem" }}>
                    {trustScore !== null ? (trustScore >= 75 ? "High Trust" : trustScore >= 45 ? "Moderate" : "Low Trust") : "Analyzing…"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Verified by Thikana AI</div>
                </div>
              </div>

              {/* Score bars */}
              {breakdown ? (
                [
                  { label: "Price Anomaly", score: breakdown.price?.score ?? 0, max: 30, note: breakdown.price?.note },
                  { label: "Photo Evidence", score: breakdown.photos?.score ?? 0, max: 20, note: breakdown.photos?.note },
                  { label: "Description Quality", score: breakdown.description?.score ?? 0, max: 20, note: breakdown.description?.note },
                  { label: "NLP Duplicate Check", score: breakdown.duplicate?.score ?? 0, max: 15, note: breakdown.duplicate?.note },
                  { label: "pHash Image Check", score: breakdown.photo_hash?.score ?? 0, max: 15, note: breakdown.photo_hash?.note },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: "10px" }} title={item.note}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "3px" }}>
                      <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        {item.label}
                      </span>
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{item.score}/{item.max}</span>
                    </div>
                    <div style={{ height: 4, background: "var(--bg-muted)", borderRadius: 2, overflow: "hidden", marginBottom: "3px" }}>
                      <div style={{ width: `${(item.score / item.max) * 100}%`, height: "100%", background: item.score >= item.max * 0.8 ? "var(--success)" : item.score >= item.max * 0.4 ? "#F59E0B" : "var(--danger)", borderRadius: 2, transition: "width 0.5s ease" }} />
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.2 }}>
                      {item.note}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", padding: "0.5rem 0" }}>
                  {trustScore !== null ? "Score details unavailable" : "🔍 AI is analyzing this listing…"}
                </div>
              )}

              {breakdown?.reasoning && (
                <div style={{ marginTop: "10px", padding: "10px", background: "var(--bg-subtle)", borderRadius: "8px", fontSize: "0.78rem", color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.5 }}>
                  "{breakdown.reasoning}"
                </div>
              )}
            </div>

            {/* Contact Card */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem" }}>Contact Roommate</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${room.id}`} alt="" style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid var(--primary-light)" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    {creatorName}
                    {creatorProfile.verified && (
                      <ShieldCheck size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                    )}
                  </div>
                  {creatorUniv && (
                    <div style={{ fontSize: "0.75rem", color: "var(--success)", display: "flex", alignItems: "center", gap: "3px" }}>
                      <CheckCircle size={11} /> {creatorUniv} Student
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowContact(!showContact)}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", marginBottom: "8px" }}
              >
                <Phone size={15} style={{ marginRight: "6px" }} />
                {showContact ? "Hide Contact" : "Reveal Contact Info"}
              </button>
              {showContact && (
                <div style={{ background: "var(--primary-xlight)", border: "1px solid var(--primary-light)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "4px" }}>Contact Info</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--primary)" }}>
                    {(room as any).contact_info ?? "Contact info not provided"}
                  </div>
                </div>
              )}
              <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", textAlign: "center", marginTop: "10px" }}>
                🛡️ Zero broker fees · Peer-to-peer
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .container > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
