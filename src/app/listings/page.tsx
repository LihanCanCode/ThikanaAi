"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, MapPin, X, Loader2, Sparkles, Map as MapIcon, List as ListIcon } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import ListingCard from "@/components/listings/ListingCard";
import ListingMap from "@/components/listings/ListingMap";
import { SEED_LISTINGS } from "@/lib/seed-listings";
import { DHAKA_AREAS, UNIVERSITIES, getDistanceKm } from "@/lib/utils";
import type { Listing, SearchFilters } from "@/types";

function StudentListingsContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [inputVal, setInputVal] = useState(initialQ);
  const [filters, setFilters] = useState<SearchFilters>({ type: "student" });
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiParsed, setAiParsed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Student Specific university search states
  const [selectedUniv, setSelectedUniv] = useState("iut"); // default to IUT
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"split" | "list" | "map">("split");

  const parseAndSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      const f = { type: "student" as const };
      setFilters(f);
      setAiParsed(false);
      applyFilters(f);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/parse-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      const f: SearchFilters = { ...data.filters, type: "student" };
      setFilters(f);
      setAiParsed(true);
      applyFilters(f);
    } catch {
      applyFilters({ type: "student" });
    } finally {
      setLoading(false);
    }
  }, []);

  function applyFilters(f: SearchFilters) {
    let results = SEED_LISTINGS.filter(l => l.type === "student") as Listing[];
    if (f.area) results = results.filter(l => l.area.toLowerCase().includes(f.area!.toLowerCase()));
    if (f.max_rent) results = results.filter(l => l.rent_bdt <= f.max_rent!);
    if (f.min_rent) results = results.filter(l => l.rent_bdt >= f.min_rent!);
    if (f.rooms) results = results.filter(l => l.rooms >= f.rooms!);
    if (f.for_gender && f.for_gender !== "any") {
      results = results.filter(l => l.for_gender === f.for_gender || l.for_gender === "any");
    }
    if (f.furnishing) results = results.filter(l => l.furnishing === f.furnishing);
    setListings(results);
  }

  useEffect(() => {
    // Initial filter applying
    applyFilters(filters);
    if (initialQ) parseAndSearch(initialQ);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputVal);
    parseAndSearch(inputVal);
  };

  const clearFilters = () => {
    setQuery("");
    setInputVal("");
    const f = { type: "student" as const };
    setFilters(f);
    setAiParsed(false);
    applyFilters(f);
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

            {/* View Mode controls for mobile */}
            <div className="view-toggle" style={{ display: "none", gap: "6px" }}>
              <button className={`btn ${viewMode === "list" ? "btn-primary" : "btn-outline"}`} style={{ padding: "4px 10px", fontSize: "0.75rem" }} onClick={() => setViewMode("list")}>
                <ListIcon size={12} /> List
              </button>
              <button className={`btn ${viewMode === "map" ? "btn-primary" : "btn-outline"}`} style={{ padding: "4px 10px", fontSize: "0.75rem" }} onClick={() => setViewMode("map")}>
                <MapIcon size={12} /> Map
              </button>
            </div>
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
                value={filters.area || ""} onChange={e => { const f = { ...filters, area: e.target.value || undefined }; setFilters(f); applyFilters(f); }}>
                <option value="">All Areas</option>
                {DHAKA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select className="input" style={{ fontSize: "0.85rem" }}
                value={filters.for_gender || ""} onChange={e => { const f = { ...filters, for_gender: e.target.value as SearchFilters["for_gender"] || undefined }; setFilters(f); applyFilters(f); }}>
                <option value="">Any Gender</option>
                <option value="male">Male Only</option>
                <option value="female">Female Only</option>
              </select>
              <select className="input" style={{ fontSize: "0.85rem" }}
                value={filters.furnishing || ""} onChange={e => { const f = { ...filters, furnishing: e.target.value as SearchFilters["furnishing"] || undefined }; setFilters(f); applyFilters(f); }}>
                <option value="">Any Furnishing</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="semi">Semi-Furnished</option>
                <option value="fully">Fully-Furnished</option>
              </select>
              <select className="input" style={{ fontSize: "0.85rem" }}
                value={filters.max_rent || ""} onChange={e => { const f = { ...filters, max_rent: e.target.value ? parseInt(e.target.value) : undefined }; setFilters(f); applyFilters(f); }}>
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

      {/* Main split-screen container */}
      <div style={{ display: "flex", flex: 1, position: "relative", overflow: "hidden" }}>
        
        {/* Left Side: Listing List */}
        <div className="list-panel" style={{
          width: "45%",
          overflowY: "auto",
          padding: "1.5rem",
          borderRight: "1px solid var(--border)",
          height: "calc(100vh - 128px)",
        }}>
          {sortedListings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem" }}>🔍</div>
              <h3 style={{ fontWeight: 600 }}>No Student flats found</h3>
              <p style={{ fontSize: "0.85rem" }}>Try changing filters or varsity location.</p>
              <button onClick={clearFilters} className="btn btn-outline" style={{ marginTop: "1rem" }}>Clear Filters</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
              {sortedListings.map(listing => (
                <div
                  key={listing.id}
                  onMouseEnter={() => setActiveListingId(listing.id)}
                  style={{
                    border: listing.id === activeListingId ? "1.5px solid var(--primary)" : "1px solid transparent",
                    borderRadius: "var(--radius-lg)",
                    transition: "all 0.2s",
                  }}
                >
                  <ListingCard listing={listing} distanceKm={getDistance(listing)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Mapbox Route Map */}
        <div className="map-panel" style={{
          flex: 1,
          height: "calc(100vh - 128px)",
          position: "relative",
        }}>
          <ListingMap
            listings={listings}
            selectedUniversityId={selectedUniv}
            activeListingId={activeListingId}
            onSelectListing={(id) => setActiveListingId(id)}
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
          .view-toggle { display: flex !important; }
          .list-panel {
            width: 100% !important;
            display: ${viewMode === "map" ? "none" : "block"} !important;
            height: auto !important;
          }
          .map-panel {
            width: 100% !important;
            display: ${viewMode === "list" ? "none" : "block"} !important;
            height: 400px !important;
          }
        }
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
