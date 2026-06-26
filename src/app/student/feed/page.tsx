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

  return (
    <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", height: "100%", transition: "all 0.2s" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
      }}>
      
      {/* Top Section */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
        <img 
          src={profile.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} 
          alt={profile.name}
          style={{ width: 60, height: 60, borderRadius: "50%", border: "3px solid var(--primary-light)", flexShrink: 0, objectFit: "cover" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "4px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile.name}
            </h3>
            {myProfile && (
              <div style={{ 
                background: score >= 80 ? "var(--success)" : score >= 60 ? "var(--accent)" : "var(--text-muted)",
                color: "#fff",
                padding: "2px 8px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0
              }}>
                {score}% Match
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            <GraduationCap size={13} style={{ color: "var(--primary)" }} /> {univ?.short_name || profile.university}
          </div>
          <span className="badge badge-green" style={{ fontSize: "0.68rem", padding: "1px 8px" }}>
            Seeking Flatmate
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1rem", background: "var(--bg-subtle)", padding: "8px 12px", borderRadius: "8px" }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Budget limit</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)" }}>
            {formatBDT(profile.budget_max)}/mo
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Preferred Areas</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {profile.preferred_areas.length > 0 ? profile.preferred_areas.join(", ") : "Any area"}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "1.25rem", flex: 1 }}>
        <span className="badge badge-muted" style={{ background: "var(--bg-muted)", color: "var(--text-secondary)", fontSize: "0.72rem" }}>
          {profile.sleep_schedule === "early_bird" ? "🌅 Early Bird" : profile.sleep_schedule === "night_owl" ? "🦉 Night Owl" : "😌 Flexible"}
        </span>
        <span className="badge badge-muted" style={{ background: "var(--bg-muted)", color: "var(--text-secondary)", fontSize: "0.72rem" }}>
          {profile.smoking === "non_smoker" ? "🚭 Non-Smoker" : "🚬 Smoker"}
        </span>
        <span className="badge badge-muted" style={{ background: "var(--bg-muted)", color: "var(--text-secondary)", fontSize: "0.72rem" }}>
          {profile.cleanliness === "spotless" ? "✨ Very Tidy" : profile.cleanliness === "relaxed" ? "😅 Relaxed" : "🙂 Clean"}
        </span>
      </div>

      {/* Action */}
      <button
        onClick={handleFlick}
        disabled={sent || flicking}
        className={`btn ${sent ? "btn-outline" : "btn-primary"}`}
        style={{ width: "100%", justifyContent: "center", padding: "0.55rem", fontSize: "0.85rem" }}
      >
        {flicking ? (
          <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Sending…</>
        ) : sent ? (
          <><CheckCircle size={14} style={{ color: "var(--success)" }} /> Flick Sent</>
        ) : (
          <><Send size={14} /> Send Flick</>
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
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>{creatorName}</div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{creatorUnivShort} Roommate</div>
            </div>
          </div>

          <button 
            onClick={() => setShowContact(!showContact)}
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
      <div style={{ background: "var(--primary-xlight)", padding: "3.5rem 1rem", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--primary)" }}>
          Student Flatmate Hub
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto", marginBottom: "2rem" }}>
          Find study partners to rent a new flat together, or list a vacant room in your current student home.
        </p>
        
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/student/matching" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem", fontSize: "0.92rem", display: "inline-flex", fontWeight: 700 }}>
            <Sparkles size={16} style={{ marginRight: "6px" }} />
            {myProfile ? "✏️ Edit My Team-Up Profile" : "Create Team-Up Profile"}
          </Link>
          {myProfile && (
            <button 
              onClick={handleDeleteProfile} 
              disabled={deletingProfile}
              className="btn btn-outline" 
              style={{ padding: "0.75rem 1.5rem", fontSize: "0.92rem", display: "inline-flex", fontWeight: 700, borderColor: "#FCA5A5", color: "#DC2626" }}
            >
              {deletingProfile ? "Deleting..." : "🗑️ Delete Profile"}
            </button>
          )}
          <Link href="/student/room-shares/new" className="btn btn-outline" style={{ background: "#fff", padding: "0.75rem 1.5rem", fontSize: "0.92rem", display: "inline-flex", fontWeight: 700 }}>
            + Post Available Room
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="container" style={{ padding: "2rem 1.5rem", flex: 1, display: "flex", gap: "2rem", flexDirection: "row", alignItems: "flex-start" }}>
        
        {/* Filters Sidebar */}
        <aside style={{ width: "260px", flexShrink: 0, position: "sticky", top: "80px" }} className="desktop-filters">
          <div className="card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <SlidersHorizontal size={16} style={{ color: "var(--primary)" }} /> Filters
            </h2>
            
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>Search Name or Area</label>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input 
                  className="input" 
                  placeholder={tab === "teamup" ? "Search name, area..." : "Search title, area..."} 
                  value={query} onChange={e => setQuery(e.target.value)}
                  style={{ width: "100%", paddingLeft: "32px", fontSize: "0.85rem" }} 
                />
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>University</label>
              <select className="input" value={selectedUniv} onChange={e => setSelectedUniv(e.target.value)} style={{ width: "100%", fontSize: "0.85rem" }}>
                <option value="">All Universities</option>
                {UNIVERSITIES.map(u => <option key={u.id} value={u.id}>{u.short_name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>Max Budget (BDT)</label>
              <select className="input" value={maxBudget} onChange={e => setMaxBudget(e.target.value)} style={{ width: "100%", fontSize: "0.85rem" }}>
                <option value="">Any Budget</option>
                <option value="5000">Up to 5,000</option>
                <option value="8000">Up to 8,000</option>
                <option value="12000">Up to 12,000</option>
              </select>
            </div>

            <button 
              onClick={() => { setQuery(""); setSelectedUniv(""); setMaxBudget(""); }}
              className="btn btn-outline" style={{ width: "100%", justifyContent: "center", padding: "0.5rem", fontSize: "0.85rem", background: "#fff" }}>
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Feed Core */}
        <main style={{ flex: 1 }}>
          
          {/* Tab Switcher */}
          <div style={{ display: "flex", background: "var(--bg-subtle)", borderRadius: "var(--radius-lg)", padding: "4px", marginBottom: "1.5rem" }}>
            <button 
              onClick={() => setTab("teamup")}
              style={{
                flex: 1, padding: "0.6rem", borderRadius: "var(--radius-md)",
                border: "none", cursor: "pointer", fontFamily: "inherit",
                fontWeight: 700, fontSize: "0.88rem",
                background: tab === "teamup" ? "var(--bg-surface)" : "transparent",
                color: tab === "teamup" ? "var(--primary)" : "var(--text-muted)",
                boxShadow: tab === "teamup" ? "var(--shadow-sm)" : "none",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
              }}
            >
              👥 Team-Up Profiles
            </button>
            <button 
              onClick={() => setTab("rooms")}
              style={{
                flex: 1, padding: "0.6rem", borderRadius: "var(--radius-md)",
                border: "none", cursor: "pointer", fontFamily: "inherit",
                fontWeight: 700, fontSize: "0.88rem",
                background: tab === "rooms" ? "var(--bg-surface)" : "transparent",
                color: tab === "rooms" ? "var(--primary)" : "var(--text-muted)",
                boxShadow: tab === "rooms" ? "var(--shadow-sm)" : "none",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
              }}
            >
              🔑 Shared Room Postings
            </button>
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

      <style jsx>{`
        @media (max-width: 768px) {
          .container { flex-direction: column !important; }
          .desktop-filters { width: 100% !important; position: static !important; }
        }
      `}</style>
    </div>
  );
}
