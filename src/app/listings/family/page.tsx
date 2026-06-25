"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Loader2, Sparkles, Building, Briefcase } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import ListingCard from "@/components/listings/ListingCard";
import { SEED_LISTINGS } from "@/lib/seed-listings";
import { createClient } from "@/lib/supabase/client";
import { DHAKA_AREAS } from "@/lib/utils";
import type { Listing, SearchFilters } from "@/types";

function FamilyListingsContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [inputVal, setInputVal] = useState(initialQ);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiParsed, setAiParsed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const parseAndSearch = useCallback(async (q: string, listSource?: Listing[]) => {
    if (!q.trim()) {
      setFilters({});
      setAiParsed(false);
      applyFilters({}, listSource);
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
      const f: SearchFilters = data.filters ?? {};
      setFilters(f);
      setAiParsed(true);
      applyFilters(f, listSource);
    } catch {
      applyFilters({}, listSource);
    } finally {
      setLoading(false);
    }
  }, []);

  function applyFilters(f: SearchFilters, listSource?: Listing[]) {
    const source = listSource || allListings;
    // Only display Family or Professional listings (exclude student)
    let results = source.filter(l => l.type === "family" || l.type === "professional") as Listing[];
    
    if (f.area) results = results.filter(l => l.area.toLowerCase().includes(f.area!.toLowerCase()));
    if (f.max_rent) results = results.filter(l => l.rent_bdt <= f.max_rent!);
    if (f.min_rent) results = results.filter(l => l.rent_bdt >= f.min_rent!);
    if (f.rooms) results = results.filter(l => l.rooms >= f.rooms!);
    if (f.type) results = results.filter(l => l.type === f.type);
    if (f.furnishing) results = results.filter(l => l.furnishing === f.furnishing);
    
    setListings(results);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("listings")
      .select("*")
      .eq("is_available", true)
      .then(({ data, error }) => {
        let combined: Listing[];
        if (error || !data || data.length === 0) {
          combined = SEED_LISTINGS as Listing[];
        } else {
          combined = data as Listing[];
        }
        setAllListings(combined);
        applyFilters(filters, combined);
        if (initialQ) parseAndSearch(initialQ, combined);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputVal);
    parseAndSearch(inputVal);
  };

  const clearFilters = () => {
    setQuery("");
    setInputVal("");
    setFilters({});
    setAiParsed(false);
    applyFilters({});
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />

      {/* Top Search bar */}
      <div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", padding: "1.25rem 0" }}>
        <div className="container">
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "var(--accent-light)", color: "var(--accent-hover)",
              padding: "4px 12px", borderRadius: "var(--radius-full)",
              fontSize: "0.8rem", fontWeight: 700,
            }}>
              🏠 Family & Professional Rentals
            </span>
          </div>

          <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: "10px",
              background: "var(--bg-base)", border: "1.5px solid var(--border)",
              borderRadius: "var(--radius-lg)", padding: "0.6rem 1rem",
            }}>
              {loading ? <Loader2 size={17} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
                : <Search size={17} style={{ color: "var(--primary)" }} />}
              <input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder='Search family flats: "3 room flat in Dhanmondi" or "furnished sublet Banani"'
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "0.9rem", fontFamily: "inherit" }}
              />
              {inputVal && <button type="button" onClick={clearFilters} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={15} /></button>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 1.25rem" }}>Search</button>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className="btn btn-outline" style={{ padding: "0.6rem 1rem", gap: "6px" }}>
              <SlidersHorizontal size={15} /> Filters
            </button>
          </form>

          {/* AI parsed tags */}
          {aiParsed && Object.keys(filters).some(k => (filters as Record<string,unknown>)[k] !== null && (filters as Record<string,unknown>)[k] !== undefined) && (
            <div style={{
              marginTop: "10px", padding: "8px 14px",
              background: "var(--primary-xlight)", borderRadius: "var(--radius-md)",
              border: "1px solid var(--primary-light)",
              display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
            }}>
              <Sparkles size={14} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600 }}>AI understood:</span>
              {filters.area && <span className="badge badge-green">📍 {filters.area}</span>}
              {filters.rooms && <span className="badge badge-green">🛏 {filters.rooms} rooms</span>}
              {filters.max_rent && <span className="badge badge-green">৳ Under {filters.max_rent.toLocaleString()}</span>}
              {filters.type && <span className="badge badge-green">{filters.type}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", padding: "1rem 0" }}>
          <div className="container">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              <select className="input" style={{ fontSize: "0.85rem" }}
                value={filters.area || ""} onChange={e => { const f = { ...filters, area: e.target.value || undefined }; setFilters(f); applyFilters(f); }}>
                <option value="">All Areas</option>
                {DHAKA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select className="input" style={{ fontSize: "0.85rem" }}
                value={filters.type || ""} onChange={e => { const f = { ...filters, type: e.target.value as "family" | "professional" || undefined }; setFilters(f); applyFilters(f); }}>
                <option value="">All Types</option>
                <option value="family">👨‍👩‍👧 Family Flat</option>
                <option value="professional">💼 Professional Sublet</option>
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
                <option value="15000">Under ৳15,000</option>
                <option value="25000">Under ৳25,000</option>
                <option value="35000">Under ৳35,000</option>
                <option value="50000">Under ৳50,000</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Grid of listings */}
      <main className="container" style={{ padding: "2.5rem 1.5rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "1.5rem" }}>
          {listings.length} Premium Rentals Available
        </h1>

        {listings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
            <h3 style={{ fontWeight: 600 }}>No matching family homes</h3>
            <p style={{ fontSize: "0.85rem" }}>Try expanding your search filter parameters.</p>
            <button onClick={clearFilters} className="btn btn-outline" style={{ marginTop: "1rem" }}>Clear Filters</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>

      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function FamilyListingsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg-base)" }}><Navbar /></div>}>
      <FamilyListingsContent />
    </Suspense>
  );
}
