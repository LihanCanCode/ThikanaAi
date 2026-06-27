"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, GraduationCap, Sparkles, Send, CheckCircle, Loader2, Users, Bed, Eye, MapPin, Phone, Trash2, ShieldCheck, AlertTriangle, X } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { createPortal } from "react-dom";
import { UNIVERSITIES, formatBDT } from "@/lib/utils";
import {
  getFlatmateProfiles,
  getMyFlatmateProfile,
  sendFlatmateFlick,
  getSentFlickIds,
  deleteFlatmateProfile,
} from "@/app/student/flatmate-actions";
import { getRoomShares, type RoomShare } from "@/app/student/room-share-actions";
import type { FlatmateProfile } from "@/types";

type Tab = "teamup" | "rooms";

// 👥 Profile Card (For Students looking to Team Up)
function ProfileCard({
  profile,
  myProfile,
  flickSent,
  onFlick,
}: {
  profile: FlatmateProfile;
  myProfile: FlatmateProfile | null;
  flickSent: boolean;
  onFlick: (id: string) => Promise<void>;
}) {
  const [flicking, setFlicking] = useState(false);
  const [sent, setSent] = useState(flickSent);
  const univ = UNIVERSITIES.find((u) => u.id === profile.university);

  let score = 0;
  if (myProfile) {
    score = 50;
    if (myProfile.sleep_schedule === profile.sleep_schedule) score += 15;
    if (myProfile.smoking === profile.smoking) score += 10;
    if (myProfile.cleanliness === profile.cleanliness) score += 10;
    const overlap = Math.min(myProfile.budget_max, profile.budget_max) >= Math.max(myProfile.budget_min, profile.budget_min);
    if (overlap) score += 15;
  }

  const handleFlick = async () => {
    if (!myProfile) {
      alert("Please create your Team-Up profile first so others can see your lifestyle matches!");
      window.location.href = "/student/matching";
      return;
    }
    setFlicking(true);
    await onFlick(profile.id);
    setSent(true);
    setFlicking(false);
  };

  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : "?";

  return (
    <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", borderRadius: "16px", border: "1px solid var(--border)", background: "#fff", boxShadow: "var(--shadow-sm)", height: "100%", transition: "all 0.2s" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
      }}>
      
      {/* Top Section */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {profile.avatar ? (
          <img 
            src={profile.avatar} 
            alt={profile.name}
            style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#1e3a8a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.2rem" }}>
            {initial}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "4px" }}>
            {profile.name}
            {profile.verified && (
              <ShieldCheck size={14} style={{ color: "#10b981", flexShrink: 0 }} />
            )}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            <GraduationCap size={14} style={{ color: "var(--text-muted)" }} />
            <span>{univ?.short_name || profile.university}</span>
          </div>
        </div>
        {myProfile && (
          <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }}>
            {score}% match
          </div>
        )}
      </div>

      {/* Info Box */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--pearl)", padding: "0.75rem 1rem", borderRadius: "10px" }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Budget</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#166534" }}>
            {profile.budget_min ? `৳${profile.budget_min.toLocaleString('en-IN')}–` : ""}৳{profile.budget_max.toLocaleString('en-IN')}/mo
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Preferred Area</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile.preferred_areas && profile.preferred_areas.length > 0 ? profile.preferred_areas.join(", ") : "Any area"}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "var(--cloud)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 600 }}>
          {profile.sleep_schedule === "early_bird" ? "🌅 Flexible" : profile.sleep_schedule === "night_owl" ? "🦉 Night Owl" : "😌 Flexible"}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "var(--cloud)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 600 }}>
          {profile.smoking === "non_smoker" ? "🚭 Non-Smoker" : "🚬 Smoker"}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "var(--cloud)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 600 }}>
          {profile.cleanliness === "spotless" ? "✨ Spotless" : profile.cleanliness === "relaxed" ? "😅 Relaxed" : "🙂 Clean"}
        </span>
      </div>

      {/* Action Button */}
      <button
        onClick={handleFlick}
        disabled={sent || flicking}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          padding: "0.6rem",
          borderRadius: "8px",
          border: "1.5px solid #10b981",
          background: "transparent",
          color: "#10b981",
          fontSize: "0.85rem",
          fontWeight: 700,
          cursor: sent || flicking ? "default" : "pointer",
          transition: "all 0.2s",
          marginTop: "auto"
        }}
        onMouseEnter={e => {
          if (!sent && !flicking) {
            e.currentTarget.style.background = "rgba(16, 185, 129, 0.05)";
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {flicking ? (
          <>
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            <span>Sending...</span>
          </>
        ) : sent ? (
          <>
            <CheckCircle size={14} style={{ color: "#10b981" }} />
            <span>Flick Sent</span>
          </>
        ) : (
          <>
            <Send size={14} />
            <span>Send Flick</span>
          </>
        )}
      </button>
    </div>
  );
}

// 🔑 Room Share Listing Card (For vacant rooms in student flats)
function RoomShareCard({
  room,
}: {
  room: RoomShare;
}) {
  const [showContact, setShowContact] = useState(false);
  const [showTrustScore, setShowTrustScore] = useState(false);
  
  // Custom type cast to safely retrieve joined profile info
  const creatorProfile = (room as any).creator || {};
  const creatorName = creatorProfile.full_name || "Student Roommate";
  const creatorAvatar = creatorProfile.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.id}`;
  const creatorUnivShort = UNIVERSITIES.find((u) => u.id === creatorProfile.university)?.short_name ?? "";

  const roomPhoto = room.photos?.[0] || "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800";
  const preferredUniv = UNIVERSITIES.find((u) => u.id === room.university_restriction);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Link href={`/student/room-shares/${room.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div className="card" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", transition: "all 0.2s", cursor: "pointer" }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
        }}>
      
      {/* Image & Price Tag */}
      <div style={{ position: "relative", height: "160px", width: "100%" }}>
        <img src={roomPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", bottom: "10px", left: "10px", background: "var(--primary)", color: "#fff", padding: "4px 10px", borderRadius: "var(--radius-sm)", fontWeight: 800, fontSize: "0.95rem", zIndex: 10 }}>
          {formatBDT(room.rent_bdt)}/mo
        </div>
        <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(255,255,255,0.95)", color: "var(--text-primary)", padding: "2px 8px", borderRadius: "999px", fontWeight: 700, fontSize: "0.68rem", zIndex: 10 }}>
          {room.gender_restriction === "male" ? "👦 Males Only" : room.gender_restriction === "female" ? "👧 Females Only" : "🚻 Mixed Flat"}
        </div>
        
        {/* AI Trust Score Badge */}
        {room.trust_score !== undefined && room.trust_score !== null && (
          <button 
            onClick={(e) => { e.stopPropagation(); setShowTrustScore(true); }}
            style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(255,255,255,0.95)", color: room.trust_score >= 80 ? "var(--success)" : room.trust_score >= 50 ? "#F59E0B" : "var(--danger)", padding: "4px 10px", borderRadius: "999px", fontWeight: 800, fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px", border: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", zIndex: 10, boxShadow: "var(--shadow-sm)" }}
          >
            {room.trust_score >= 80 ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
            {room.trust_score} AI Score
          </button>
        )}
      </div>

      {/* Content Body */}
      <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* Title & Area */}
        <h3 style={{ fontSize: "0.98rem", fontWeight: 700, marginBottom: "4px", color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", height: "2.4rem", lineHeight: "1.2" }}>
          {room.title_en}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "12px" }}>
          <MapPin size={12} style={{ color: "var(--primary)" }} /> {room.area} · {room.address}
        </div>

        {/* Roommate details (The Student Room Share specific features!) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px", background: "var(--primary-xlight)", padding: "8px 10px", borderRadius: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={14} style={{ color: "var(--primary)" }} />
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Current flatmates</div>
              <strong style={{ fontSize: "0.78rem", color: "var(--primary)" }}>{room.current_roommates} living</strong>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Bed size={14} style={{ color: "var(--accent-hover)" }} />
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Available Seats</div>
              <strong style={{ fontSize: "0.78rem", color: "var(--accent-hover)" }}>{room.available_seats} vacant</strong>
            </div>
          </div>
        </div>

        {/* Short Description */}
        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "1rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {room.description_en}
        </p>

        {/* Preferred University Tag */}
        {preferredUniv && (
          <div style={{ marginBottom: "1rem", fontSize: "0.72rem", color: "var(--primary)", background: "var(--primary-light)", padding: "3px 8px", borderRadius: "4px", display: "inline-flex", width: "fit-content", fontWeight: 700 }}>
            🎓 {preferredUniv.short_name} students preferred
          </div>
        )}

        {/* Poster Profile */}
        <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img src={creatorAvatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "3px" }}>
                {creatorName}
                {creatorProfile.verified && (
                  <ShieldCheck size={12} style={{ color: "#10b981", flexShrink: 0 }} />
                )}
              </div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{creatorUnivShort} Roommate</div>
            </div>
          </div>

          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowContact(!showContact); }}
            className="btn btn-primary" 
            style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: "8px" }}
          >
            {showContact ? <Phone size={11} /> : "Contact"}
          </button>
        </div>

        {showContact && (
          <div style={{ marginTop: "10px", background: "var(--accent-light)", padding: "8px", borderRadius: "6px", textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-hover)" }}>
             📞 Call Rahim: 01712-345678
          </div>
        )}
      </div>

      {/* AI Trust Score Modal */}
      {showTrustScore && typeof document !== "undefined" && createPortal(
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setShowTrustScore(false)}>
          <div style={{ background: "#fff", width: "100%", maxWidth: "420px", borderRadius: "20px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem" }}>
              <ShieldCheck size={24} style={{ color: "var(--success)" }} />
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>AI Trust Score</h3>
              <button onClick={() => setShowTrustScore(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}><X size={20} /></button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: `6px solid ${room.trust_score! >= 80 ? "var(--success)" : room.trust_score! >= 50 ? "#F59E0B" : "var(--danger)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{room.trust_score}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>/ 100</div>
              </div>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: room.trust_score! >= 80 ? "var(--success)" : room.trust_score! >= 50 ? "#F59E0B" : "var(--danger)" }}>
                  {room.trust_score! >= 80 ? "High Trust" : room.trust_score! >= 50 ? "Medium Trust" : "Suspicious"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>Verified by Thikana AI</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {(() => {
                const breakdown = room.trust_score_breakdown || {};
                const metrics = [
                  { label: "Price fairness", score: breakdown.priceFairness ?? 0, max: 25 },
                  { label: "Photo quality", score: breakdown.photoQuality ?? 0, max: 25 },
                  { label: "Organized room", score: breakdown.organizedRoom ?? 0, max: 25 },
                  { label: "No duplicate found", score: breakdown.noDuplicates ?? 0, max: 25 }
                ];

                return metrics.map((m, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                      <span>{m.label}</span>
                      <span>{m.score}/{m.max}</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--bg-muted)", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(m.score / m.max) * 100}%`, background: m.score === m.max ? "var(--success)" : m.score >= m.max * 0.5 ? "#F59E0B" : "var(--danger)", borderRadius: "99px" }} />
                    </div>
                  </div>
                ));
              })()}
            </div>

            {room.trust_score_breakdown?.reasoning && (
              <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--bg-subtle)", borderRadius: "10px", fontSize: "0.85rem", color: "var(--text-primary)", fontStyle: "italic" }}>
                "{room.trust_score_breakdown.reasoning}"
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
      </Link>
    </div>
  );
}

export default function FlatmateFeedPage() {
  const [tab, setTab] = useState<Tab>("teamup");
  const [query, setQuery] = useState("");
  const [selectedUniv, setSelectedUniv] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [myProfile, setMyProfile] = useState<FlatmateProfile | null>(null);
  const [profiles, setProfiles] = useState<FlatmateProfile[]>([]);
  const [roomShares, setRoomShares] = useState<RoomShare[]>([]);
  const [sentFlicks, setSentFlicks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deletingProfile, setDeletingProfile] = useState(false);

  useEffect(() => {
    async function load() {
      // ⚠️ No dummy entry auto-seeding! Operating entirely on real data.
      const [allProfiles, mine, flickIds, allRooms] = await Promise.all([
        getFlatmateProfiles(),
        getMyFlatmateProfile(),
        getSentFlickIds(),
        getRoomShares(),
      ]);
      
      setProfiles(allProfiles.filter((p) => p.id !== mine?.id));
      setMyProfile(mine);
      setSentFlicks(new Set(flickIds));
      setRoomShares(allRooms);
      setLoading(false);
    }
    load();
  }, []);

  const handleFlick = async (profileId: string) => {
    const result = await sendFlatmateFlick(profileId);
    if (!result.error) {
      setSentFlicks((prev) => new Set([...prev, profileId]));
    }
  };

  const handleDeleteProfile = async () => {
    if (!confirm("Are you sure you want to delete your Team-Up profile? This cannot be undone.")) return;
    setDeletingProfile(true);
    await deleteFlatmateProfile();
    setMyProfile(null);
    setDeletingProfile(false);
  };

  // Filter Team-Up Profiles
  let filteredProfiles = profiles;
  if (tab === "teamup") {
    if (query) {
      const q = query.toLowerCase();
      filteredProfiles = filteredProfiles.filter(p => p.name.toLowerCase().includes(q) || p.preferred_areas.some(a => a.toLowerCase().includes(q)));
    }
    if (selectedUniv) {
      filteredProfiles = filteredProfiles.filter(p => p.university === selectedUniv);
    }
    if (maxBudget) {
      filteredProfiles = filteredProfiles.filter(p => p.budget_max <= parseInt(maxBudget));
    }
  }

  // Filter Room Shares
  let filteredRoomShares = roomShares;
  if (tab === "rooms") {
    if (query) {
      const q = query.toLowerCase();
      filteredRoomShares = filteredRoomShares.filter(r => r.title_en.toLowerCase().includes(q) || r.area.toLowerCase().includes(q));
    }
    if (selectedUniv) {
      // Matches rooms where either the creator goes to the university, or the restriction matches
      filteredRoomShares = filteredRoomShares.filter(r => 
        r.university_restriction === selectedUniv || 
        (r as any).creator?.university === selectedUniv
      );
    }
    if (maxBudget) {
      filteredRoomShares = filteredRoomShares.filter(r => r.rent_bdt <= parseInt(maxBudget));
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Banner */}
      <div style={{ background: "var(--primary-xlight)", padding: "3rem 1rem 1rem 1rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--primary)" }}>
          Student Flatmate Hub
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto", marginBottom: "2rem" }}>
          Find students to rent with, or share a vacant room in your flat.
        </p>

        {/* Two Selector Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", maxWidth: "800px", margin: "0 auto" }}>
          {/* Card 1: Create Team-Up Profile */}
          <div 
            onClick={() => setTab("teamup")}
            style={{
              background: "#fff",
              border: tab === "teamup" ? "2.5px solid #166534" : "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "1.25rem",
              cursor: "pointer",
              boxShadow: tab === "teamup" ? "var(--shadow-md)" : "var(--shadow-sm)",
              transition: "all 0.2s",
              textAlign: "left"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(22, 101, 52, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#166534", flexShrink: 0 }}>
                <Users size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Create Team-Up Profile</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>Find flatmates to rent a new place together</p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #f3f4f6", marginTop: "1rem", paddingTop: "0.5rem", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#166534", fontWeight: 600 }}>
              {myProfile ? (
                <>
                  <CheckCircle size={14} style={{ color: "#166534" }} />
                  <span>Your profile is live · {profiles.length + 1} student{profiles.length + 1 !== 1 ? 's' : ''} found</span>
                </>
              ) : (
                <span>No active profile found</span>
              )}
            </div>
          </div>

          {/* Card 2: Post Available Room */}
          <div 
            onClick={() => setTab("rooms")}
            style={{
              background: "#fff",
              border: tab === "rooms" ? "2.5px solid #166534" : "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "1.25rem",
              cursor: "pointer",
              boxShadow: tab === "rooms" ? "var(--shadow-md)" : "var(--shadow-sm)",
              transition: "all 0.2s",
              textAlign: "left"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(251, 191, 36, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", flexShrink: 0 }}>
                <span style={{ fontSize: "1.25rem", fontWeight: "bold" }}>+</span>
              </div>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Post Available Room</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>List a vacant seat in your existing flat</p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #f3f4f6", marginTop: "1rem", paddingTop: "0.5rem", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
              <span>{roomShares.length} room{roomShares.length !== 1 ? 's' : ''} currently available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container" style={{ padding: "2rem 1.5rem", flex: 1, maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        {/* Feed Core */}
        <main style={{ width: "100%" }}>
          
          {/* Action Banners */}
          {tab === "teamup" && (
            myProfile ? (
              <div style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "1rem 1.5rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
                boxShadow: "var(--shadow-sm)"
              }}>
                <div>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                    Your profile is live, {myProfile.name}! 🎉
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                    Students below can see your profile and send you a Flick.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <Link 
                    href="/student/matching" 
                    className="btn btn-primary"
                    style={{
                      padding: "0.5rem 1rem",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      background: "#166534",
                      color: "#fff",
                      borderRadius: "8px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Edit My Profile</span>
                  </Link>
                  <button 
                    onClick={handleDeleteProfile} 
                    disabled={deletingProfile}
                    style={{
                      padding: "0.5rem 1rem",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      background: "transparent",
                      border: "1px solid #fca5a5",
                      color: "#dc2626",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "1rem 1.5rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
                boxShadow: "var(--shadow-sm)"
              }}>
                <div>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                    Create your Team-Up profile to get matched! 👥
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                    Fill in your lifestyle choices, budget, and university to match with others.
                  </p>
                </div>
                <Link 
                  href="/student/matching" 
                  className="btn btn-primary"
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    background: "#166534",
                    color: "#fff",
                    borderRadius: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Sparkles size={14} />
                  <span>Create My Profile</span>
                </Link>
              </div>
            )
          )}

          {tab === "rooms" && (
            <div style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "1rem 1.5rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              boxShadow: "var(--shadow-sm)"
            }}>
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                  Have a vacant room or seat in your student flat? 🏠
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                  List it now to find student roommates from your university.
                </p>
              </div>
              <Link 
                href="/student/room-shares/new" 
                className="btn btn-primary"
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  background: "#166534",
                  color: "#fff",
                  borderRadius: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span>
                <span>Post Available Room</span>
              </Link>
            </div>
          )}

          {/* Inline Filters Bar */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                className="input" 
                placeholder={tab === "teamup" ? "Search name or area..." : "Search title or area..."} 
                value={query} 
                onChange={e => setQuery(e.target.value)}
                style={{ width: "100%", paddingLeft: "36px", height: "42px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "0.9rem" }} 
              />
            </div>

            <select 
              className="input" 
              value={selectedUniv} 
              onChange={e => setSelectedUniv(e.target.value)} 
              style={{ width: "220px", height: "42px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "0.9rem", cursor: "pointer" }}
            >
              <option value="">All Universities</option>
              {UNIVERSITIES.map(u => <option key={u.id} value={u.id}>{u.short_name}</option>)}
            </select>

            <select 
              className="input" 
              value={maxBudget} 
              onChange={e => setMaxBudget(e.target.value)} 
              style={{ width: "180px", height: "42px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "0.9rem", cursor: "pointer" }}
            >
              <option value="">Any Budget</option>
              <option value="5000">Up to ৳5,000</option>
              <option value="8000">Up to ৳8,000</option>
              <option value="12000">Up to ৳12,000</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
              <Loader2 size={28} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} />
            </div>
          ) : (
            <>
              {/* Team-Up Tab View */}
              {tab === "teamup" && (
                filteredProfiles.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
                    <h3 style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>No profiles found</h3>
                    <p style={{ fontSize: "0.85rem" }}>Create your profile or adjust filters to see students looking to rent.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                    {filteredProfiles.map((profile) => (
                      <ProfileCard
                        key={profile.id}
                        profile={profile}
                        myProfile={myProfile}
                        flickSent={sentFlicks.has(profile.id)}
                        onFlick={handleFlick}
                      />
                    ))}
                  </div>
                )
              )}

              {/* Room Shares Tab View */}
              {tab === "rooms" && (
                filteredRoomShares.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔑</div>
                    <h3 style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>No shared rooms listed</h3>
                    <p style={{ fontSize: "0.85rem" }}>Be the first to list an available room/seat in your flat!</p>
                    <Link href="/student/room-shares/new" className="btn btn-primary" style={{ marginTop: "1rem", fontSize: "0.8rem", padding: "0.5rem 1.2rem" }}>
                      + List a Vacant Seat
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                    {filteredRoomShares.map((room) => (
                      <RoomShareCard
                        key={room.id}
                        room={room}
                      />
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
