"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, GraduationCap, Sparkles, Send, CheckCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { UNIVERSITIES, formatBDT } from "@/lib/utils";
import {
  getFlatmateProfiles,
  getMyFlatmateProfile,
  sendFlatmateFlick,
  getSentFlickIds,
  seedDemoFlatmateProfiles,
} from "@/app/student/flatmate-actions";
import type { FlatmateProfile } from "@/types";

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
          style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid var(--primary-light)", flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "2px" }}>
              {profile.name}
            </h3>
            {myProfile && (
              <div style={{ 
                background: score >= 80 ? "var(--success)" : score >= 60 ? "var(--warning)" : "var(--border)",
                color: score >= 60 ? "#fff" : "var(--text-main)",
                padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700
              }}>
                {score}% Match
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            <GraduationCap size={14} /> {univ?.short_name || profile.university}
          </div>
          <div style={{ display: "inline-block", background: "var(--bg-subtle)", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            Needs Room
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Budget (Share)</div>
          <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--primary)" }}>
            {formatBDT(profile.budget_min)} - {formatBDT(profile.budget_max)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Areas</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {profile.preferred_areas.slice(0, 2).join(", ")}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "1.5rem", flex: 1 }}>
        <span className="badge badge-muted">
          {profile.sleep_schedule === "early_bird" ? "🌅 Early Bird" : profile.sleep_schedule === "night_owl" ? "🦉 Night Owl" : "😌 Flexible"}
        </span>
        <span className="badge badge-muted">
          {profile.smoking === "non_smoker" ? "🚭 Non-Smoker" : "🚬 Smoker"}
        </span>
        <span className="badge badge-muted">
          {profile.cleanliness === "spotless" ? "✨ Very Tidy" : profile.cleanliness === "relaxed" ? "😅 Relaxed" : "🙂 Clean"}
        </span>
      </div>

      {/* Action */}
      <button
        onClick={handleFlick}
        disabled={sent || flicking || !myProfile}
        className={`btn ${sent ? "btn-outline" : "btn-primary"}`}
        style={{ width: "100%", justifyContent: "center", padding: "0.6rem" }}
      >
        {flicking ? (
          <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Sending…</>
        ) : sent ? (
          <><CheckCircle size={16} style={{ color: "var(--success)" }} /> Flick Sent</>
        ) : (
          <><Send size={16} /> Send Flick</>
        )}
      </button>
    </div>
  );
}

export default function FlatmateFeedPage() {
  const [query, setQuery] = useState("");
  const [selectedUniv, setSelectedUniv] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [myProfile, setMyProfile] = useState<FlatmateProfile | null>(null);
  const [profiles, setProfiles] = useState<FlatmateProfile[]>([]);
  const [sentFlicks, setSentFlicks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      await seedDemoFlatmateProfiles();
      const [allProfiles, mine, flickIds] = await Promise.all([
        getFlatmateProfiles(),
        getMyFlatmateProfile(),
        getSentFlickIds(),
      ]);
      setProfiles(allProfiles.filter((p) => p.id !== mine?.id));
      setMyProfile(mine);
      setSentFlicks(new Set(flickIds));
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

  let filtered = profiles;
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.preferred_areas.some(a => a.toLowerCase().includes(q)));
  }
  if (selectedUniv) {
    filtered = filtered.filter(p => p.university === selectedUniv);
  }
  if (maxBudget) {
    filtered = filtered.filter(p => p.budget_min <= parseInt(maxBudget));
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Banner */}
      <div style={{ background: "var(--primary-light)", padding: "3rem 1rem", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--primary)" }}>Find Your Perfect Flatmate</h1>
        <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto", marginBottom: "2rem" }}>
          Browse students looking to team up, or post your own request to get matched.
        </p>
        
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {!myProfile && (
            <Link href="/student/matching" className="btn btn-primary" style={{ padding: "0.8rem 1.5rem", fontSize: "0.95rem", display: "inline-flex", fontWeight: 700 }}>
              <Sparkles size={18} style={{ marginRight: "6px" }} /> Create Team-Up Profile
            </Link>
          )}
          <Link href="/listings/new?type=shared_room" className="btn btn-outline" style={{ background: "#fff", padding: "0.8rem 1.5rem", fontSize: "0.95rem", display: "inline-flex", fontWeight: 700 }}>
             + Post Available Room
          </Link>
        </div>
      </div>

      <div className="container" style={{ padding: "2rem 1rem", flex: 1, display: "flex", gap: "2rem", flexDirection: "row", alignItems: "flex-start" }}>
        
        {/* Filters Sidebar */}
        <aside style={{ width: "260px", flexShrink: 0, position: "sticky", top: "80px" }} className="desktop-filters">
          <div className="card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <SlidersHorizontal size={16} /> Filters
            </h2>
            
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>Search Name or Area</label>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input 
                  className="input" 
                  placeholder="e.g. Mirpur" 
                  value={query} onChange={e => setQuery(e.target.value)}
                  style={{ width: "100%", paddingLeft: "32px", fontSize: "0.85rem" }} 
                />
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>University</label>
              <select className="input" value={selectedUniv} onChange={e => setSelectedUniv(e.target.value)} style={{ width: "100%", fontSize: "0.85rem" }}>
                <option value="">All Universities</option>
                {UNIVERSITIES.map(u => <option key={u.id} value={u.id}>{u.short_name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>Max Budget (BDT)</label>
              <select className="input" value={maxBudget} onChange={e => setMaxBudget(e.target.value)} style={{ width: "100%", fontSize: "0.85rem" }}>
                <option value="">Any Budget</option>
                <option value="5000">Up to 5,000</option>
                <option value="8000">Up to 8,000</option>
                <option value="12000">Up to 12,000</option>
              </select>
            </div>

            <button 
              onClick={() => { setQuery(""); setSelectedUniv(""); setMaxBudget(""); }}
              className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }}>
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Main Feed */}
        <main style={{ flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
              <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", background: "var(--bg-surface)", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
              <h3 style={{ fontWeight: 600, fontSize: "1.2rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>No profiles found</h3>
              <p style={{ fontSize: "0.95rem" }}>Try relaxing your search filters.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {filtered.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  myProfile={myProfile}
                  flickSent={sentFlicks.has(profile.id)}
                  onFlick={handleFlick}
                />
              ))}
            </div>
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
