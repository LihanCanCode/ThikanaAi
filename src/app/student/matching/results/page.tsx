"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import { UNIVERSITIES, formatBDT } from "@/lib/utils";
import {
  CheckCircle, AlertCircle, MapPin, GraduationCap,
  Sparkles, ArrowLeft, Users, Send, Loader2, ArrowRight,
} from "lucide-react";
import type { MatchResult, FlatmateProfile } from "@/types";

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color =
    score >= 80 ? "#2A7D46" : score >= 60 ? "#F59B2B" : "#e74c3c";

  return (
    <div style={{ position: "relative", width: "88px", height: "88px", flexShrink: 0 }}>
      <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: "1.3rem", fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600 }}>MATCH</span>
      </div>
    </div>
  );
}

function MatchCard({ match, myUni, onFlick }: {
  match: MatchResult;
  myUni: string;
  onFlick: (id: string) => void;
}) {
  const [flicked, setFlicked] = useState(false);
  const [sending, setSending] = useState(false);
  const theirUni = UNIVERSITIES.find((u) => u.id === match.profile.university);
  const myUniName = UNIVERSITIES.find((u) => u.id === myUni)?.short_name ?? myUni;

  async function handleFlick() {
    setSending(true);
    await new Promise((r) => setTimeout(r, 900)); // simulate request
    setFlicked(true);
    setSending(false);
    onFlick(match.profile.id);
  }

  return (
    <div style={{
      background: "var(--surface)", borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border)", padding: "1.5rem",
      boxShadow: "var(--shadow-sm)", transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.2rem" }}>
        {/* Avatar */}
        <img
          src={match.profile.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.profile.name}`}
          alt={match.profile.name}
          width={56} height={56}
          style={{ borderRadius: "50%", border: "3px solid var(--primary-light)", flexShrink: 0 }}
        />
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-main)" }}>
            {match.profile.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "2px" }}>
            <GraduationCap size={13} /> {theirUni?.short_name ?? match.profile.university}
            {match.cross_uni && (
              <span style={{
                marginLeft: "6px", background: "var(--accent-light, #FEF3C7)",
                color: "var(--accent, #F59B2B)", borderRadius: "999px",
                padding: "1px 8px", fontSize: "0.7rem", fontWeight: 700,
              }}>
                Cross-uni 🗺️
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "3px" }}>
            Budget: {formatBDT(match.profile.budget_min)}–{formatBDT(match.profile.budget_max)}/mo
          </div>
        </div>
        {/* Score ring */}
        <ScoreRing score={match.score} />
      </div>

      {/* AI Summary */}
      <p style={{
        fontSize: "0.9rem", color: "var(--text-main)", fontStyle: "italic",
        background: "var(--bg)", borderRadius: "var(--radius)", padding: "10px 14px",
        marginBottom: "1rem", borderLeft: "3px solid var(--primary)",
      }}>
        ✨ {match.summary}
      </p>

      {/* Cross-uni commute note */}
      {match.cross_uni && match.commute_note && (
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "#FEF3C7", borderRadius: "var(--radius)",
          padding: "8px 12px", marginBottom: "1rem", fontSize: "0.83rem",
          color: "#92400E",
        }}>
          <MapPin size={13} /> {match.commute_note}
        </div>
      )}

      {/* Green flags */}
      {match.green_flags.length > 0 && (
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2A7D46", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ✅ Why you match
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {match.green_flags.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-main)" }}>
                <CheckCircle size={13} color="#2A7D46" style={{ flexShrink: 0 }} /> {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yellow flags */}
      {match.yellow_flags.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#B45309", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ⚠️ Worth a chat
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {match.yellow_flags.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-main)" }}>
                <AlertCircle size={13} color="#F59B2B" style={{ flexShrink: 0 }} /> {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested areas */}
      {match.suggested_areas.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            📍 Best areas for both
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {match.suggested_areas.map((area) => (
              <span key={area} style={{
                padding: "3px 10px", borderRadius: "999px", fontSize: "0.8rem",
                background: "var(--primary-light)", color: "var(--primary)", fontWeight: 600,
              }}>
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", marginTop: "1.2rem" }}>
        {flicked ? (
          <div style={{
            flex: 1, padding: "10px", borderRadius: "var(--radius)", textAlign: "center",
            background: "var(--primary-light)", color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem",
          }}>
            👋 Flick sent! Waiting for response…
          </div>
        ) : (
          <button
            onClick={handleFlick}
            disabled={sending}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              padding: "10px", borderRadius: "var(--radius)", border: "none",
              background: "var(--primary)", color: "#fff", cursor: sending ? "not-allowed" : "pointer",
              fontWeight: 700, fontSize: "0.9rem",
            }}
          >
            {sending
              ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Sending…</>
              : <><Send size={15} /> Send Flick</>}
          </button>
        )}
        <Link
          href={`/listings?budget=${match.profile.budget_min + 6000}&area=${match.suggested_areas[0] ?? ""}`}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "10px 14px", borderRadius: "var(--radius)",
            border: "1.5px solid var(--border)", background: "var(--surface)",
            color: "var(--text-main)", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem",
            whiteSpace: "nowrap",
          }}
        >
          🏠 Search together
        </Link>
      </div>
    </div>
  );
}

export default function MatchResultsPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [myProfile, setMyProfile] = useState<Partial<FlatmateProfile> | null>(null);
  const [flickedIds, setFlickedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const m = sessionStorage.getItem("flatmate_matches");
      const p = sessionStorage.getItem("my_profile");
      if (!m || m === "undefined" || m === "null") {
        router.push("/student/matching");
        return;
      }
      const parsed = JSON.parse(m);
      setMatches(Array.isArray(parsed) ? parsed : []);
      if (p && p !== "undefined" && p !== "null") {
        setMyProfile(JSON.parse(p));
      }
    } catch {
      router.push("/student/matching");
    }
  }, [router]);

  const myUni = myProfile?.university ?? "iut";
  const myUniName = UNIVERSITIES.find((u) => u.id === myUni)?.short_name ?? myUni;

  if (matches.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <div style={{ maxWidth: "600px", margin: "6rem auto", textAlign: "center", padding: "2rem" }}>
          <Users size={64} color="var(--text-muted)" style={{ marginBottom: "1rem" }} />
          <h2 style={{ color: "var(--text-main)", marginBottom: "0.5rem" }}>No matches found yet</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Try relaxing your preferences or check back when more students have joined.
          </p>
          <Link href="/student/matching" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "12px 24px", borderRadius: "var(--radius)", background: "var(--primary)",
            color: "#fff", textDecoration: "none", fontWeight: 700,
          }}>
            <ArrowLeft size={16} /> Retake questionnaire
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1rem 4rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "var(--primary-light)", color: "var(--primary)",
            borderRadius: "999px", padding: "6px 16px", fontSize: "0.85rem",
            fontWeight: 600, marginBottom: "1rem",
          }}>
            <Sparkles size={14} /> AI-Powered Results
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
            Your Top {matches.length} Matches
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
            Gemini scored your compatibility with {matches.length} students.
            Send a <strong>Flick</strong> to connect!
          </p>
        </div>

        {/* My profile pill */}
        {myProfile && (
          <div style={{
            display: "flex", alignItems: "center", gap: "12px",
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: "12px 20px",
            marginBottom: "1.5rem",
          }}>
            <GraduationCap size={18} color="var(--primary)" />
            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
              {myProfile.name || "You"} — {myUniName}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Budget: {formatBDT(myProfile.budget_min ?? 0)}–{formatBDT(myProfile.budget_max ?? 0)}/mo
            </span>
            <Link
              href="/student/matching"
              style={{ marginLeft: "auto", fontSize: "0.82rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}
            >
              ✏️ Edit profile
            </Link>
          </div>
        )}

        {/* Match cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {matches.map((m) => (
            <MatchCard
              key={m.profile.id}
              match={m}
              myUni={myUni}
              onFlick={(id) => setFlickedIds((prev) => [...prev, id])}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{
          marginTop: "2.5rem", textAlign: "center",
          padding: "2rem", background: "var(--primary-light)",
          borderRadius: "var(--radius-lg)",
        }}>
          <h3 style={{ fontWeight: 700, color: "var(--primary)", marginBottom: "0.5rem" }}>
            Ready to search together?
          </h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.2rem", fontSize: "0.9rem" }}>
            Once your Flick is accepted, you'll get a shared dashboard with combined budget and AI-suggested areas.
          </p>
          <Link href="/listings" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "12px 28px", borderRadius: "var(--radius)",
            background: "var(--primary)", color: "#fff",
            textDecoration: "none", fontWeight: 700,
          }}>
            🏠 Browse Student Listings <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
