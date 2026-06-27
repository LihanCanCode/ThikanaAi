"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import { DHAKA_AREAS, UNIVERSITIES, formatBDT } from "@/lib/utils";
import { fadeUpStagger, fadeUp } from "@/lib/animations";
import { Users, Filter, Check, MapPin, Loader2, DoorOpen, ShieldCheck, AlertTriangle, X, Phone, Bed, Sparkles, Send, CheckCircle, Trash2 } from "lucide-react";
import { getFlatmateProfiles, postFlatmateProfile, deleteFlatmateProfile } from "@/app/flatmate-actions";
import { sendConnectionRequest } from "@/app/actions/chat-actions";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { getRoomShares, type RoomShare } from "@/app/student/room-share-actions";

// Only real data is used now

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

const LIFESTYLE_OPTIONS = ["Early riser", "Night owl", "Non-smoker", "Vegetarian ok", "Pets ok", "Quiet study environment"];

export default function FlatmatesPage() {
  const [tab, setTab] = useState<"browse" | "teamup">("browse");
  const [seekers, setSeekers] = useState<any[]>([]);
  const [roomShares, setRoomShares] = useState<RoomShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosted, setIsPosted] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    university: UNIVERSITIES[0].short_name,
    budget: 5000,
    gender: "Any",
    area_pref: DHAKA_AREAS[0],
    lifestyle: [] as string[],
    bio: "",
    avatar: "",
    vacant_rooms: 1,
    location: ""
  });

  const [filterUni, setFilterUni] = useState("All");
  const [maxBudget, setMaxBudget] = useState(15000);

  // Load from DB
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const uId = data?.user?.id || null;
      setMyUserId(uId);
      if (uId) {
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", uId)
          .single()
          .then(({ data: pData }) => {
            if (pData?.full_name) {
              setFormData(prev => ({ ...prev, name: pData.full_name }));
            }
          });
      }
    });

    async function loadData() {
      try {
        const [dbProfiles, dbRooms] = await Promise.all([
          getFlatmateProfiles(),
          getRoomShares()
        ]);

        if (dbProfiles && dbProfiles.length > 0) {
          const mapped = dbProfiles.map(p => ({
            id: p.id,
            user_id: p.user_id,
            name: p.name,
            university: p.university,
            budget: p.budget_max,
            gender: p.profile_data?.gender || "any",
            area_pref: p.preferred_areas?.[0] || DHAKA_AREAS[0],
            lifestyle: p.profile_data?.lifestyle || [],
            avatar: p.profile_data?.avatar || p.name.charAt(0).toUpperCase(),
            bio: p.profile_data?.bio || "",
            vacant_rooms: (p.profile_data as any)?.vacant_rooms ?? 1,
            location: (p.profile_data as any)?.location || p.preferred_areas?.[0] || "",
            verified: p.verified
          }));
          setSeekers(mapped);
        } else {
          setSeekers([]);
        }

        if (dbRooms) {
          setRoomShares(dbRooms);
        }
      } catch (error) {
        console.error("Failed to load flatmates data", error);
        setSeekers([]);
        setRoomShares([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleLifestyle = (opt: string) => {
    setFormData(prev => ({
      ...prev,
      lifestyle: prev.lifestyle.includes(opt) 
        ? prev.lifestyle.filter(l => l !== opt)
        : [...prev.lifestyle, opt]
    }));
  };

  const sortedSeekers = useMemo(() => {
    return seekers.map(seeker => {
      let score = 0;
      if (formData.university === seeker.university) score += 40;
      if (Math.abs(formData.budget - seeker.budget) <= 2000) score += 30;
      if (formData.area_pref === seeker.area_pref) score += 20;
      
      const overlap = seeker.lifestyle.filter((l: string) => formData.lifestyle.includes(l)).length;
      if (overlap >= 1) score += 10;
      
      return { ...seeker, score };
    })
    .filter(s => filterUni === "All" || s.university === filterUni)
    .filter(s => s.budget <= maxBudget)
    .sort((a, b) => b.score - a.score);
  }, [formData, filterUni, maxBudget, seekers]);

  const handlePostSubmit = async () => {
    if (!formData.name.trim()) return;
    setIsPosting(true);
    
    try {
      const res = await postFlatmateProfile(formData);
      if (res.success && res.profile) {
        const newSeeker = {
          id: res.profile.id,
          user_id: myUserId || res.profile.user_id,
          name: res.profile.name,
          university: res.profile.university,
          budget: res.profile.budget_max,
          gender: res.profile.profile_data?.gender || "any",
          area_pref: res.profile.preferred_areas?.[0] || formData.area_pref,
          lifestyle: res.profile.profile_data?.lifestyle || [],
          avatar: res.profile.profile_data?.avatar || formData.name.charAt(0).toUpperCase(),
          bio: res.profile.profile_data?.bio || "",
          vacant_rooms: (res.profile.profile_data as any)?.vacant_rooms ?? formData.vacant_rooms,
          location: (res.profile.profile_data as any)?.location || formData.location,
          verified: res.profile.verified
        };
        
        // Prepend to top of list instantly
        setSeekers([newSeeker, ...seekers]);
        setIsPosted(true);
        setTimeout(() => setIsPosted(false), 3000);
      }
    } catch (error) {
      console.error("Submit error", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete your flatmate profile?")) return;
    setDeletingId(profileId);
    try {
      const res = await deleteFlatmateProfile(profileId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Profile deleted successfully!");
        setSeekers(prev => prev.filter(s => s.id !== profileId));
      }
    } catch (e) {
      toast.error("Failed to delete profile.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleConnect = async (profileId: string) => {
    setConnectingTo(profileId);
    try {
      const res = await sendConnectionRequest(profileId);
      if (res.error) {
        toast.error(res.error);
        if (res.error === "You must be logged in to connect with someone.") {
          window.location.href = "/auth/login";
        }
      } else {
        toast.success("Connection request sent! They will be notified.");
        setConnectedIds(prev => new Set([...prev, profileId]));
      }
    } catch (e) {
      toast.error("Failed to send request.");
    } finally {
      setConnectingTo(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--mist)] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-28 container mx-auto px-6 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <h1 className="display-xl text-[var(--forest)] mb-2 flex items-center justify-center gap-3">
            <Users size={36} className="text-[var(--emerald)]" /> Find Flatmates
          </h1>
          <p className="body-lg text-[var(--slate)] max-w-2xl mx-auto">
            Post your profile, search compatible students, or list a vacant room in your flat.
          </p>
        </motion.div>

        {/* Two Selector Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", maxWidth: "800px", margin: "0 auto 2.5rem auto" }}>
          {/* Card 1: Create Team-Up Profile */}
          <div 
            onClick={() => setTab(tab === "teamup" ? "browse" : "teamup")}
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
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Create Team-Up Profile</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>Find flatmates to rent a new place together</p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #f3f4f6", marginTop: "1rem", paddingTop: "0.5rem", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#166534", fontWeight: 600 }}>
              {seekers.some(s => s.user_id === myUserId) ? (
                <>
                  <Check size={14} style={{ color: "#166534" }} />
                  <span>Your profile is live · {seekers.length} students found</span>
                </>
              ) : (
                <span>Create your profile to start matching</span>
              )}
            </div>
          </div>

          {/* Card 2: Post Available Room */}
          <Link
            href="/student/room-shares/new"
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div 
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "1.25rem",
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
                transition: "all 0.2s",
                textAlign: "left"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.border = "1px solid #d97706";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.border = "1px solid #e5e7eb";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(251, 191, 36, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", flexShrink: 0 }}>
                  <span style={{ fontSize: "1.25rem", fontWeight: "bold" }}>+</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Post Available Room</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>List a vacant seat in your existing flat</p>
                </div>
              </div>
              <div style={{ borderTop: "1px solid #f3f4f6", marginTop: "1rem", paddingTop: "0.5rem", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                <span>{roomShares.length} room{roomShares.length !== 1 ? 's' : ''} currently available</span>
              </div>
            </div>
          </Link>
        </div>

        {tab === "browse" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
            
            {/* Section 1: Team-Up Profiles */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--forest)", margin: 0 }}>
                    👥 Student Team-Up Profiles
                  </h2>
                  <p style={{ fontSize: "0.9rem", color: "var(--slate)", margin: "4px 0 0 0" }}>
                    Students looking to team up and rent a new place together
                  </p>
                </div>
                <button 
                  onClick={() => setTab("teamup")}
                  className="btn btn-outline"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 700, background: "#fff" }}
                >
                  Create / View All
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10 text-[var(--slate)]">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading profiles...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sortedSeekers.slice(0, 4).map(s => (
                    <motion.div key={s.id} variants={fadeUp} layout className="bg-white rounded-2xl p-5 border border-[var(--foam)] shadow-[var(--shadow-sm)] flex flex-col hover:border-[var(--emerald)] transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-lg overflow-hidden flex-shrink-0">
                            {s.avatar && (s.avatar.startsWith("data:image") || s.avatar.startsWith("http")) ? (
                              <img src={s.avatar} alt={s.name} className="w-full h-full object-cover" />
                            ) : (
                              s.avatar
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-[var(--forest)] text-base">{s.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="px-2 py-0.5 bg-[var(--mint)] text-[var(--forest)] rounded text-[10px] font-bold tracking-wide">{s.university}</span>
                              <span className="text-xs text-[var(--slate)] capitalize">{s.gender}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center text-xs font-bold" style={{
                            borderColor: s.score >= 80 ? 'var(--success)' : s.score >= 50 ? 'var(--warning)' : 'var(--border)',
                            color: s.score >= 80 ? 'var(--success)' : s.score >= 50 ? 'var(--warning)' : 'var(--text-muted)'
                          }}>
                            {s.score}%
                          </div>
                          <span className="text-[9px] font-bold text-[var(--slate)] uppercase mt-1">Match</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="font-bold text-[var(--emerald)] bangla">৳{s.budget.toLocaleString()}</div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[var(--forest)] font-semibold text-xs bg-[var(--mint)] px-2 py-0.5 rounded-full">
                            <DoorOpen size={11} />
                            <span>{s.vacant_rooms} room{s.vacant_rooms !== 1 ? 's' : ''} free</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[var(--slate)] text-xs mb-3 font-medium">
                        <MapPin size={12} className="text-[var(--emerald)] flex-shrink-0" />
                        <span className="truncate">{s.location || s.area_pref}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {s.lifestyle.map((l: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-[var(--mist)] text-[var(--stone)] rounded-full text-[10px] font-semibold">{l}</span>
                        ))}
                      </div>

                      <p className="text-xs text-[var(--slate)] leading-relaxed flex-grow mb-4 bg-[var(--bg-subtle)] p-2 rounded-lg italic">
                        "{s.bio}"
                      </p>

                      {s.user_id === myUserId ? (
                        <button 
                          type="button" 
                          onClick={() => handleDeleteProfile(s.id)} 
                          disabled={deletingId === s.id}
                          className="w-full py-2.5 rounded-lg font-bold text-sm bg-red-50 hover:bg-red-100 text-red-600 transition-colors mt-auto flex items-center justify-center gap-2 border border-red-200"
                        >
                          {deletingId === s.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          Delete My Profile
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          onClick={() => handleConnect(s.id)} 
                          disabled={connectedIds.has(s.id) || connectingTo === s.id}
                          className={`w-full py-2.5 rounded-lg font-bold text-sm transition-colors mt-auto flex items-center justify-center gap-2
                            ${connectedIds.has(s.id) ? 'bg-[var(--primary-light)] text-[var(--primary)] cursor-not-allowed' : 
                              'bg-[var(--mist)] hover:bg-[var(--primary-light)] text-[var(--forest)]'}`}
                        >
                          {connectingTo === s.id ? <Loader2 size={16} className="animate-spin" /> : null}
                          {connectedIds.has(s.id) ? "Request Sent" : "Connect"}
                        </button>
                      )}
                    </motion.div>
                  ))}
                  {sortedSeekers.length === 0 && (
                    <div className="col-span-full py-6 text-center text-[var(--slate)]">
                      No flatmate profiles found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: Available Rooms */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--forest)", margin: 0 }}>
                    🏠 Available Rooms & Seats
                  </h2>
                  <p style={{ fontSize: "0.9rem", color: "var(--slate)", margin: "4px 0 0 0" }}>
                    Vacant spaces in student flats currently looking for roommates
                  </p>
                </div>
                <Link 
                  href="/student/room-shares/new"
                  className="btn btn-outline"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 700, background: "#fff", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  + Post Room
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10 text-[var(--slate)]">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading rooms...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roomShares.slice(0, 6).map(room => (
                    <RoomShareCard key={room.id} room={room} />
                  ))}
                  {roomShares.length === 0 && (
                    <div className="col-span-full py-6 text-center text-[var(--slate)]">
                      No rooms currently listed.
                    </div>
                  )}
                </div>
              )}
            </div>
            
          </div>
        ) : (
          /* Create Team-Up View (Split Screen) */
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <button 
                onClick={() => setTab("browse")}
                className="btn btn-outline"
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 700, background: "#fff", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                ← Back to Flatmate Hub
              </button>
            </div>
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* LEFT: 40% (Form) */}
              <div className="lg:w-[40%] flex-shrink-0">
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-[var(--foam)] shadow-[var(--shadow-sm)] sticky top-[100px]">
                  <h2 className="text-xl font-bold text-[var(--forest)] mb-6 flex items-center gap-2">
                    Post Your Profile
                  </h2>
                  
                  <div className="space-y-5">
                    <div className="flex flex-col items-center gap-2 mb-2">
                      <label className="text-xs font-semibold text-[var(--slate)] uppercase tracking-wider">Profile Picture</label>
                      <label className="relative w-20 h-20 rounded-full bg-[var(--mist)] border-2 border-dashed border-[var(--border-strong)] flex items-center justify-center cursor-pointer overflow-hidden hover:border-[var(--emerald)] group transition-all">
                        {formData.avatar ? (
                          <img src={formData.avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center flex flex-col items-center justify-center">
                            <Users size={20} className="text-[var(--slate)] group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] text-[var(--stone)] mt-0.5 font-semibold">Upload</span>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[var(--slate)] mb-1 block uppercase tracking-wider">Your Name (linked to account)</label>
                      <input type="text" value={formData.name} readOnly disabled className="w-full py-3 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl outline-none text-sm font-bold text-[var(--slate)] cursor-not-allowed opacity-80" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-[var(--slate)] mb-1 block uppercase tracking-wider">University</label>
                        <select value={formData.university} onChange={e => setFormData({...formData, university: e.target.value})} className="w-full py-3 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-sm font-bold text-[var(--forest)] transition-colors">
                          {UNIVERSITIES.map(u => <option key={u.id} value={u.short_name}>{u.short_name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--slate)] mb-1 block uppercase tracking-wider">Max Budget (৳)</label>
                        <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: Number(e.target.value)})} className="w-full py-3 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-sm font-bold text-[var(--forest)] bangla transition-colors" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-[var(--slate)] mb-1 block uppercase tracking-wider">Vacant Rooms</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={formData.vacant_rooms}
                          onChange={e => setFormData({...formData, vacant_rooms: Math.max(1, Number(e.target.value))})}
                          className="w-full py-3 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-sm font-bold text-[var(--forest)] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--slate)] mb-1 block uppercase tracking-wider">Gender</label>
                        <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full py-3 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-sm font-bold text-[var(--forest)] transition-colors">
                          <option>Any</option><option>Male</option><option>Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--slate)] mb-1 block uppercase tracking-wider">Preferred Area</label>
                        <select value={formData.area_pref} onChange={e => setFormData({...formData, area_pref: e.target.value})} className="w-full py-3 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-sm font-bold text-[var(--forest)] transition-colors">
                          {DHAKA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[var(--slate)] mb-1 block uppercase tracking-wider">Location / Full Address</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        placeholder="e.g. Road 7, Mirpur-2, Dhaka"
                        className="w-full py-3 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-sm font-medium text-[var(--forest)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Lifestyle Preferences</label>
                      <div className="flex flex-wrap gap-2">
                        {LIFESTYLE_OPTIONS.map(opt => {
                          const selected = formData.lifestyle.includes(opt);
                          return (
                            <button key={opt} type="button" onClick={() => toggleLifestyle(opt)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors flex items-center gap-1 ${selected ? "bg-[var(--emerald)] text-white border-[var(--emerald)]" : "bg-white text-[var(--stone)] border-[var(--foam)] hover:border-[var(--emerald)]"}`}>
                              {selected && <Check size={12} />} {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[var(--slate)] mb-1 block uppercase tracking-wider">Short Bio (150 chars)</label>
                      <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} maxLength={150} rows={3} placeholder="A bit about yourself..." className="w-full py-3 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-sm font-medium text-[var(--forest)] transition-colors resize-none" />
                    </div>

                    <button 
                      type="button" 
                      onClick={handlePostSubmit}
                      disabled={isPosting}
                      className={`w-full text-white py-3 rounded-xl font-bold text-sm transition-colors mt-2 flex justify-center items-center gap-2 ${isPosted ? 'bg-green-600' : isPosting ? 'bg-[var(--stone)] opacity-70 cursor-not-allowed' : 'bg-[var(--forest)] hover:bg-[var(--jade)]'}`}
                    >
                      {isPosting && <Loader2 size={16} className="animate-spin" />}
                      {isPosted ? "✓ Profile Posted!" : isPosting ? "Posting..." : "Post & Find Matches"}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT: 60% (Grid) */}
              <div className="lg:w-[60%] flex-col flex">
                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-[var(--foam)] shadow-[var(--shadow-sm)] mb-6 gap-4">
                  <div className="flex items-center gap-2 text-[var(--forest)] font-semibold text-sm">
                    <Filter size={18} /> Filters
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <select value={filterUni} onChange={e => setFilterUni(e.target.value)} className="bg-[var(--mist)] border-none text-sm font-semibold rounded-lg px-3 py-2 outline-none cursor-pointer">
                      <option value="All">All Universities</option>
                      {UNIVERSITIES.map(u => <option key={u.id} value={u.short_name}>{u.short_name}</option>)}
                    </select>
                    <div className="flex items-center gap-2 flex-1 sm:flex-none">
                      <span className="text-xs font-semibold text-[var(--slate)] whitespace-nowrap">Max ৳{maxBudget}</span>
                      <input type="range" min="3000" max="25000" step="500" value={maxBudget} onChange={e => setMaxBudget(Number(e.target.value))} className="w-24 accent-[var(--emerald)]" />
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20 text-[var(--slate)]">
                    <Loader2 className="animate-spin mr-2" size={24} /> Loading profiles...
                  </div>
                ) : (
                  <motion.div variants={fadeUpStagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                      {sortedSeekers.map(s => (
                        <motion.div key={s.id} variants={fadeUp} layout className="bg-white rounded-2xl p-5 border border-[var(--foam)] shadow-[var(--shadow-sm)] flex flex-col hover:border-[var(--emerald)] transition-colors">
                          
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-lg overflow-hidden flex-shrink-0">
                                {s.avatar && (s.avatar.startsWith("data:image") || s.avatar.startsWith("http")) ? (
                                  <img src={s.avatar} alt={s.name} className="w-full h-full object-cover" />
                                ) : (
                                  s.avatar
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-[var(--forest)] text-base flex items-center gap-1">
                                  {s.name}
                                  {s.verified && (
                                    <ShieldCheck size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                                  )}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="px-2 py-0.5 bg-[var(--mint)] text-[var(--forest)] rounded text-[10px] font-bold tracking-wide">{s.university}</span>
                                  <span className="text-xs text-[var(--slate)] capitalize">{s.gender}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Compatibility Score Circle */}
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center text-xs font-bold" style={{
                                borderColor: s.score >= 80 ? 'var(--success)' : s.score >= 50 ? 'var(--warning)' : 'var(--border)',
                                color: s.score >= 80 ? 'var(--success)' : s.score >= 50 ? 'var(--warning)' : 'var(--text-muted)'
                              }}>
                                {s.score}%
                              </div>
                              <span className="text-[9px] font-bold text-[var(--slate)] uppercase mt-1">Match</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm mb-2">
                            <div className="font-bold text-[var(--emerald)] bangla">৳{s.budget.toLocaleString()}</div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-[var(--forest)] font-semibold text-xs bg-[var(--mint)] px-2 py-0.5 rounded-full">
                                <DoorOpen size={11} />
                                <span>{s.vacant_rooms} room{s.vacant_rooms !== 1 ? 's' : ''} free</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[var(--slate)] text-xs mb-3 font-medium">
                            <MapPin size={12} className="text-[var(--emerald)] flex-shrink-0" />
                            <span className="truncate">{s.location || s.area_pref}</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {s.lifestyle.map((l: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-[var(--mist)] text-[var(--stone)] rounded-full text-[10px] font-semibold">{l}</span>
                            ))}
                          </div>

                          <p className="text-xs text-[var(--slate)] leading-relaxed flex-grow mb-4 bg-[var(--bg-subtle)] p-2 rounded-lg italic">
                            "{s.bio}"
                          </p>

                          {s.user_id === myUserId ? (
                            <button 
                              type="button" 
                              onClick={() => handleDeleteProfile(s.id)} 
                              disabled={deletingId === s.id}
                              className="w-full py-2.5 rounded-lg font-bold text-sm bg-red-50 hover:bg-red-100 text-red-600 transition-colors mt-auto flex items-center justify-center gap-2 border border-red-200"
                            >
                              {deletingId === s.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                              Delete My Profile
                            </button>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => handleConnect(s.id)} 
                              disabled={connectedIds.has(s.id) || connectingTo === s.id}
                              className={`w-full py-2.5 rounded-lg font-bold text-sm transition-colors mt-auto flex items-center justify-center gap-2
                                ${connectedIds.has(s.id) ? 'bg-[var(--primary-light)] text-[var(--primary)] cursor-not-allowed' : 
                                  'bg-[var(--mist)] hover:bg-[var(--primary-light)] text-[var(--forest)]'}`}
                            >
                              {connectingTo === s.id ? <Loader2 size={16} className="animate-spin" /> : null}
                              {connectedIds.has(s.id) ? "Request Sent" : "Connect"}
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {sortedSeekers.length === 0 && (
                      <div className="col-span-full py-10 text-center text-[var(--slate)]">
                        No flatmates found matching your filters.
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
