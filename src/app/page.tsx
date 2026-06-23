"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, MapPin, Shield, Sparkles, ChevronRight, Home, Users, Star, TrendingDown } from "lucide-react";
import Navbar from "@/components/shared/Navbar";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"student" | "family">("student");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const dest = searchType === "student" ? "/listings" : "/listings/family";
    if (query.trim()) {
      window.location.href = `${dest}?q=${encodeURIComponent(query)}`;
    } else {
      window.location.href = dest;
    }
  };


  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{
        background: "linear-gradient(160deg, #EDF7F0 0%, #F8FAF7 50%, #FEF9F0 100%)",
        padding: "5rem 0 4rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: "-80px", right: "-80px",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(42,125,70,0.08) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-60px", left: "-60px",
          width: "300px", height: "300px",
          background: "radial-gradient(circle, rgba(245,155,43,0.08) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />

        <div className="container" style={{ position: "relative" }}>
          {/* Tagline pill */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "var(--primary-light)", color: "var(--primary)",
              padding: "6px 16px", borderRadius: "var(--radius-full)",
              fontSize: "0.82rem", fontWeight: 600,
            }}>
              <Sparkles size={13} /> AI-Powered · Bilingual · Bangladesh&apos;s First
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.4rem)",
            fontWeight: 800,
            textAlign: "center",
            color: "var(--text-primary)",
            lineHeight: 1.15,
            marginBottom: "0.75rem",
            maxWidth: "720px",
            margin: "0 auto 0.75rem",
          }}>
            Find Your{" "}
            <span style={{ color: "var(--primary)" }}>ঠিকানা</span>
            {" "}in Dhaka — Fast, Safe & Smart
          </h1>

          <p style={{
            textAlign: "center", color: "var(--text-secondary)",
            fontSize: "1.05rem", maxWidth: "560px",
            margin: "0 auto 2.5rem", lineHeight: 1.7,
          }}>
            No fake listings. No broker fees. Just verified rooms for students, professionals,
            and families — searched in plain Bangla or English.
          </p>

          {/* NL Search Bar Selector */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "1rem" }}>
            <button
              onClick={() => setSearchType("student")}
              style={{
                padding: "8px 16px", borderRadius: "var(--radius-full)",
                border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                fontFamily: "inherit",
                background: searchType === "student" ? "var(--primary)" : "var(--bg-muted)",
                color: searchType === "student" ? "#fff" : "var(--text-secondary)",
                transition: "all 0.2s",
              }}
            >
              🎓 Student Housing
            </button>
            <button
              onClick={() => setSearchType("family")}
              style={{
                padding: "8px 16px", borderRadius: "var(--radius-full)",
                border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                fontFamily: "inherit",
                background: searchType === "family" ? "var(--primary)" : "var(--bg-muted)",
                color: searchType === "family" ? "#fff" : "var(--text-secondary)",
                transition: "all 0.2s",
              }}
            >
              🏠 Family Rentals
            </button>
          </div>

          <form onSubmit={handleSearch} style={{ maxWidth: "640px", margin: "0 auto 1rem" }}>
            <div style={{
              display: "flex", background: "#fff",
              borderRadius: "var(--radius-xl)",
              border: "2px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
              transition: "border-color 0.2s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", paddingLeft: "1.25rem" }}>
                <Search size={18} style={{ color: "var(--primary)" }} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchType === "student" ? 'Try: "Mirpure 2 room under 8k" or "seat near IUT"' : 'Try: "3 room flat Dhanmondi" or "sublet near Gulshan"'}
                style={{
                  flex: 1, padding: "1rem 0.75rem",
                  border: "none", outline: "none",
                  fontSize: "0.95rem", color: "var(--text-primary)",
                  background: "transparent",
                  fontFamily: "inherit",
                }}
              />
              <button type="submit" className="btn btn-primary" style={{
                margin: "8px", borderRadius: "var(--radius-lg)",
                padding: "0.6rem 1.4rem", whiteSpace: "nowrap",
              }}>
                Search
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "8px" }}>
              ✨ AI automatically parses {searchType === "student" ? "varsity and budget queries" : "bedrooms and area requirements"}
            </p>
          </form>


          {/* Quick filter pills */}
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" }}>
            {(searchType === "student" ? [
              { label: "🎓 Student Hostels", q: "hostel" },
              { label: "📍 Near IUT", q: "near IUT Gazipur" },
              { label: "📍 Near DUET", q: "near DUET Gazipur" },
              { label: "💰 Under 6k", q: "under 6000" },
              { label: "🛋️ Furnished Rooms", q: "furnished" },
            ] : [
              { label: "👨‍👩‍👧 Family Flat", q: "family flat" },
              { label: "💼 Professional Sublet", q: "sublet" },
              { label: "📍 Dhanmondi", q: "Dhanmondi" },
              { label: "📍 Mirpur", q: "Mirpur" },
              { label: "💰 Under 25k", q: "under 25000" },
            ]).map((pill) => (
              <Link key={pill.label} href={`${searchType === "student" ? "/listings" : "/listings/family"}?q=${encodeURIComponent(pill.q)}`} style={{
                padding: "6px 14px", borderRadius: "var(--radius-full)",
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                color: "var(--text-secondary)", fontSize: "0.82rem",
                fontWeight: 500, textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--primary-light)";
                (e.currentTarget as HTMLElement).style.color = "var(--primary)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              }}>
                {pill.label}
              </Link>
            ))}
          </div>


          {/* Stats */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1rem", maxWidth: "700px", margin: "0 auto",
          }}>
            {[
              { num: "84%", label: "Students use FB for housing", icon: "📱", bad: true },
              { num: "71%", label: "Encounter fake listings", icon: "⚠️", bad: true },
              { num: "60%", label: "Lack university housing", icon: "🏛️", bad: true },
              { num: "0", label: "Broker fees on Thikana", icon: "✅", bad: false },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: stat.bad ? "rgba(220,38,38,0.05)" : "var(--primary-xlight)",
                border: `1px solid ${stat.bad ? "rgba(220,38,38,0.12)" : "var(--primary-light)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "1rem",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>{stat.icon}</div>
                <div style={{
                  fontSize: "1.6rem", fontWeight: 800,
                  color: stat.bad ? "var(--danger)" : "var(--primary)",
                }}>{stat.num}</div>
                <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="badge badge-green" style={{ marginBottom: "12px" }}>Why Thikana</span>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800 }}>
              Built around how Bangladeshi renters actually search
            </h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "500px", margin: "0.75rem auto 0" }}>
              Not a generic classifieds site. Every feature was designed for the Dhaka rental reality.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section-sm" style={{ background: "linear-gradient(135deg, var(--primary-xlight) 0%, var(--bg-subtle) 100%)" }}>
        <div className="container">
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, marginBottom: "3rem" }}>
            Find a Home in 3 Steps
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
            {[
              { step: "01", title: "Search in Your Language", desc: "Type in Bangla or English — our AI understands both and finds matching listings instantly.", icon: "🔍" },
              { step: "02", title: "Compare with Trust Scores", desc: "Every listing gets an AI integrity score (0–100) so you can spot fakes before you visit.", icon: "🛡️" },
              { step: "03", title: "Connect & Move In", desc: "Contact the verified landlord directly. No middlemen, no broker fees, no surprises.", icon: "🏠" },
            ].map((s) => (
              <div key={s.step} style={{
                background: "var(--bg-surface)", borderRadius: "var(--radius-lg)",
                padding: "1.5rem", border: "1px solid var(--border)",
                boxShadow: "var(--shadow-card)", textAlign: "center",
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{s.icon}</div>
                <div style={{
                  display: "inline-block", background: "var(--primary-light)",
                  color: "var(--primary)", borderRadius: "var(--radius-full)",
                  padding: "2px 12px", fontSize: "0.75rem", fontWeight: 700,
                  marginBottom: "0.75rem",
                }}>{s.step}</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{s.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section">
        <div className="container" style={{ textAlign: "center" }}>
          <div style={{
            background: "linear-gradient(135deg, var(--primary) 0%, #1a5e35 100%)",
            borderRadius: "var(--radius-xl)", padding: "3.5rem 2rem",
            color: "#fff", maxWidth: "700px", margin: "0 auto",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: "-40px", right: "-40px",
              width: "200px", height: "200px",
              background: "rgba(255,255,255,0.05)", borderRadius: "50%",
            }} />
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#fff", marginBottom: "0.75rem" }}>
              Ready to find your ঠিকানা?
            </h2>
            <p style={{ opacity: 0.85, marginBottom: "2rem", maxWidth: "440px", margin: "0 auto 2rem" }}>
              Join thousands of students and families finding verified homes across Dhaka without brokers.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/listings" className="btn" style={{ background: "#fff", color: "var(--primary)", fontWeight: 700 }}>
                Browse Listings <ChevronRight size={16} />
              </Link>
              <Link href="/listings/new" className="btn" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
                List Your Property
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: "var(--text-primary)", color: "rgba(255,255,255,0.7)",
        padding: "2.5rem 0", textAlign: "center",
      }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "1rem" }}>
            <div style={{ width: 28, height: 28, background: "var(--primary)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, color: "#fff", fontSize: "1rem" }}>Thikana</span>
          </div>
          <p style={{ fontSize: "0.82rem", marginBottom: "0.5rem" }}>
            Built with ❤️ by Team IUT_TwinCoder · Mindsparks 2026 · CodeFront Challenge
          </p>
          <p style={{ fontSize: "0.75rem", opacity: 0.5 }}>
            AI-Native Bilingual Rental Marketplace for Bangladesh
          </p>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: "🤖",
    title: "Natural Language Search",
    desc: 'Search in mixed Bangla/English. "Mirpure 2 room 12k er niche" works perfectly.',
    color: "var(--primary-light)",
    tag: "AI Feature",
  },
  {
    icon: "🛡️",
    title: "AI Integrity Score",
    desc: "Every listing is scored 0–100 for trust. Price anomalies, duplicate photos, and fake descriptions are flagged automatically.",
    color: "var(--accent-light)",
    tag: "AI Feature",
  },
  {
    icon: "🗺️",
    title: "University Distance Map",
    desc: "See exact walking/travel time from your university gate to every listing on an interactive map.",
    color: "var(--primary-xlight)",
    tag: "Smart Map",
  },
  {
    icon: "✍️",
    title: "AI Listing Generator",
    desc: "Landlords fill a simple form and click once — AI writes a polished bilingual listing in Bangla & English.",
    color: "var(--primary-light)",
    tag: "AI Feature",
  },
  {
    icon: "💰",
    title: "Student Finance Toolkit",
    desc: "Split rent, divide utility bills, calculate meal costs per head, and forecast monthly budget sufficiency.",
    color: "var(--accent-light)",
    tag: "Student Tool",
  },
  {
    icon: "🏘️",
    title: "Neighborhood Q&A",
    desc: 'Ask "Is Mirpur-1 safe for female students?" and get an AI-powered, source-grounded answer.',
    color: "var(--primary-xlight)",
    tag: "AI Feature",
  },
  {
    icon: "📊",
    title: "Landlord Payment Ledger",
    desc: "Track which tenants have paid, send rent reminders, and view monthly income — all in one dashboard.",
    color: "var(--primary-light)",
    tag: "Landlord Tool",
  },
  {
    icon: "🤝",
    title: "Flatmate Matching",
    desc: "Students matched by university, budget, lifestyle, and preferred area — no more Facebook group gambling.",
    color: "var(--accent-light)",
    tag: "Student Tool",
  },
];

function FeatureCard({ icon, title, desc, color, tag }: typeof FEATURES[0]) {
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{
        width: 48, height: 48, borderRadius: "var(--radius-md)",
        background: color, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "1.5rem", marginBottom: "1rem",
      }}>
        {icon}
      </div>
      <span style={{
        fontSize: "0.68rem", fontWeight: 700, color: "var(--primary)",
        textTransform: "uppercase", letterSpacing: "0.05em",
        display: "block", marginBottom: "6px",
      }}>{tag}</span>
      <h3 style={{ fontSize: "0.98rem", fontWeight: 700, marginBottom: "0.5rem" }}>{title}</h3>
      <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}
