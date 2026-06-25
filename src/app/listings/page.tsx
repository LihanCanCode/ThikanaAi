"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, MapPin, X, Loader2, Sparkles, Map as MapIcon, List as ListIcon } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import ListingCard from "@/components/listings/ListingCard";
import { DHAKA_AREAS, UNIVERSITIES, getDistanceKm } from "@/lib/utils";
import type { Listing, SearchFilters } from "@/types";

function StudentListingsContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [inputVal, setInputVal] = useState(initialQ);
  const [filters, setFilters] = useState<SearchFilters>({ type: "student" });
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiParsed, setAiParsed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Student Specific university search states
  const [selectedUniv, setSelectedUniv] = useState("iut"); // default to IUT

  const parseAndSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      let f: SearchFilters = { type: "student" };
      let parsed = false;

      if (q.trim()) {
        const parseRes = await fetch("/api/ai/parse-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });
        const parseData = await parseRes.json();
        f = { ...parseData.filters, type: "student" };
        parsed = true;
      }

      setFilters(f);
      setAiParsed(parsed);

      const searchRes = await fetch("/api/listings/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: f, query: q, type: "student" }),
      });
      const searchData = await searchRes.json();
      setListings(searchData.listings ?? []);
      setAllListings(searchData.listings ?? []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchWithFilters = useCallback(async (f: SearchFilters, q: string = query) => {
    setLoading(true);
    try {
      const searchRes = await fetch("/api/listings/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: f, query: q, type: "student" }),
      });
      const searchData = await searchRes.json();
      setListings(searchData.listings ?? []);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    parseAndSearch(initialQ);
  }, [initialQ, parseAndSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputVal);
    parseAndSearch(inputVal);
  };

  const clearFilters = () => {
    setQuery("");
    setInputVal("");
    parseAndSearch("");
  };

  const getDistance = (listing: Listing) => {
    if (!selectedUniv || !listing.lat || !listing.lng) return undefined;
    const univ = UNIVERSITIES.find(u => u.id === selectedUniv);
    if (!univ) return undefined;
    return getDistanceKm(listing.lat, listing.lng, univ.lat, univ.lng);
  };

  const sortedListings = [...listings].sort((a, b) => {
    if (selectedUniv && a.lat && b.lat) {
      return (getDistance(a) ?? 999) - (getDistance(b) ?? 999);
    }
    return (b.trust_score ?? 0) - (a.trust_score ?? 0);
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>
      <Navbar />

      {/* Search & Top Filters banner */}
      <div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", padding: "1rem 0", zIndex: 10 }}>
        <div className="container">
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: "10px",
              background: "var(--bg-base)", border: "1.5px solid var(--border)",
              borderRadius: "var(--radius-lg)", padding: "0.5rem 1rem",
            }}>
              {loading ? <Loader2 size={17} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
                : <Search size={17} style={{ color: "var(--primary)" }} />}
              <input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder='Search student rent: "Mirpure 2 room under 8k" or "seat near IUT"'
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "0.9rem", fontFamily: "inherit" }}
              />
              {inputVal && <button type="button" onClick={clearFilters} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={15} /></button>}
            </div>

            {/* University Selection (Prominent for Student page) */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)" }}>Varsity:</span>
              <select className="input" style={{ width: "120px", padding: "0.5rem", fontSize: "0.85rem" }}
                value={selectedUniv} onChange={e => setSelectedUniv(e.target.value)}>
                <option value="">Select Varsity</option>
                {UNIVERSITIES.map(u => <option key={u.id} value={u.id}>{u.short_name}</option>)}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1.25rem" }}>Search</button>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className="btn btn-outline" style={{ padding: "0.5rem 1rem", gap: "6px" }}>
              <SlidersHorizontal size={15} /> Filters
            </button>
          </form>

          {/* Quick Stats & Toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Showing {listings.length} student listings near {UNIVERSITIES.find(u => u.id === selectedUniv)?.short_name || "campus"}
            </span>

          </div>

          {/* AI parsed tag display */}
          {aiParsed && Object.keys(filters).some(k => k !== "type" && (filters as Record<string,unknown>)[k] !== null && (filters as Record<string,unknown>)[k] !== undefined) && (
            <div style={{
              marginTop: "10px", padding: "6px 12px",
              background: "var(--primary-xlight)", borderRadius: "var(--radius-md)",
              border: "1px solid var(--primary-light)",
              display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap",
            }}>
              <Sparkles size={13} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "0.78rem", color: "var(--primary)", fontWeight: 600 }}>AI parsed filters:</span>
              {filters.area && <span className="badge badge-green">📍 {filters.area}</span>}
              {filters.rooms && <span className="badge badge-green">🛏 {filters.rooms} rooms</span>}
              {filters.max_rent && <span className="badge badge-green">৳ Under {filters.max_rent.toLocaleString()}</span>}
              {filters.for_gender && filters.for_gender !== "any" && <span className="badge badge-green">{filters.for_gender} only</span>}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", padding: "1rem 0", zIndex: 9 }}>
          <div className="container">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              <select className="input" style={{ fontSize: "0.85rem" }}
                value={filters.area || ""} onChange={e => { const f = { ...filters, area: e.target.value || undefined, type: "student" as const }; setFilters(f); searchWithFilters(f); }}>
                <option value="">All Areas</option>
                {DHAKA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select className="input" style={{ fontSize: "0.85rem" }}
                value={filters.for_gender || ""} onChange={e => { const f = { ...filters, for_gender: e.target.value as SearchFilters["for_gender"] || undefined, type: "student" as const }; setFilters(f); searchWithFilters(f); }}>
                <option value="">Any Gender</option>
                <option value="male">Male Only</option>
                <option value="female">Female Only</option>
              </select>
              <select className="input" style={{ fontSize: "0.85rem" }}
                value={filters.furnishing || ""} onChange={e => { const f = { ...filters, furnishing: e.target.value as SearchFilters["furnishing"] || undefined, type: "student" as const }; setFilters(f); searchWithFilters(f); }}>
                <option value="">Any Furnishing</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="semi">Semi-Furnished</option>
                <option value="fully">Fully-Furnished</option>
              </select>
              <select className="input" style={{ fontSize: "0.85rem" }}
                value={filters.max_rent || ""} onChange={e => { const f = { ...filters, max_rent: e.target.value ? parseInt(e.target.value) : undefined, type: "student" as const }; setFilters(f); searchWithFilters(f); }}>
                <option value="">Max Rent</option>
                <option value="5000">Under ৳5,000</option>
                <option value="7000">Under ৳7,000</option>
                <option value="10000">Under ৳10,000</option>
                <option value="15000">Under ৳15,000</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="container" style={{ padding: "2rem 1rem", flex: 1 }}>
        {sortedListings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", background: "var(--bg-surface)", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
            <h3 style={{ fontWeight: 600, fontSize: "1.2rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>No Student flats found</h3>
            <p style={{ fontSize: "0.95rem" }}>Try changing your search terms, filters, or varsity location.</p>
            <button onClick={clearFilters} className="btn btn-outline" style={{ marginTop: "1.5rem" }}>Clear Search & Filters</button>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}>
            {sortedListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} distanceKm={getDistance(listing)} />
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg-base)" }}><Navbar /></div>}>
      <StudentListingsContent />
    </Suspense>
  );
}
