"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, ChevronDown, Sparkles, Bell, SlidersHorizontal, Map as MapIcon, LayoutGrid, Loader2 } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import ListingCard from "@/components/listings/ListingCard";
import ListingMap from "@/components/listings/ListingMap";
import { DHAKA_AREAS, UNIVERSITIES, getDistanceKm } from "@/lib/utils";
import type { Listing, SearchFilters } from "@/types";
import { Toaster, toast } from "react-hot-toast";

import { fadeUpStagger, fadeUp } from "@/lib/animations";

function StudentListingsContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [inputVal, setInputVal] = useState(initialQ);
  const [filters, setFilters] = useState<SearchFilters>({ type: "student" });
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiParsed, setAiParsed] = useState(false);
  
  // View states
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedUniv, setSelectedUniv] = useState("iut");
  const [sortOption, setSortOption] = useState("recommended");

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

  const handleSaveSearch = async () => {
    try {
      const res = await fetch("/api/alerts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters)
      });
      if (res.status === 401) {
        window.location.href = "/auth/login?returnUrl=/listings/student";
        return;
      }
      if (res.ok) {
        toast.success("Alert saved! We'll notify you when new matches appear.");
      } else {
        toast.error("Failed to save alert.");
      }
    } catch (err) {
      toast.error("An error occurred.");
    }
  };

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
    setFilters({ type: "student" });
    parseAndSearch("");
  };

  const removeFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    newFilters.type = "student";
    setFilters(newFilters);
    searchWithFilters(newFilters);
  };

  const getDistance = (listing: Listing) => {
    if (!selectedUniv || !listing.lat || !listing.lng) return undefined;
    const univ = UNIVERSITIES.find(u => u.id === selectedUniv);
    if (!univ) return undefined;
    return getDistanceKm(listing.lat, listing.lng, univ.lat, univ.lng);
  };

  const sortedListings = [...listings].sort((a, b) => {
    if (sortOption === "price_low") return a.rent_bdt - b.rent_bdt;
    if (sortOption === "price_high") return b.rent_bdt - a.rent_bdt;
    if (sortOption === "ai_score") return (b.trust_score ?? 0) - (a.trust_score ?? 0);
    
    // Recommended
    if (selectedUniv && a.lat && b.lat) {
      return (getDistance(a) ?? 999) - (getDistance(b) ?? 999);
    }
    return (b.trust_score ?? 0) - (a.trust_score ?? 0);
  });

  return (
    <div className="min-h-screen bg-[var(--mist)] flex flex-col">
      <Navbar />
      <Toaster position="bottom-center" />

      <div className="flex-grow pt-8 container mx-auto px-6 pb-20 flex flex-col md:flex-row gap-8">
        
        {/* FILTER SIDEBAR */}
        <aside className="w-full md:w-[280px] shrink-0 h-fit md:sticky md:top-24 bg-white rounded-2xl border border-[var(--foam)] shadow-[var(--shadow-sm)] p-6 overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading text-[var(--forest)] flex items-center gap-2">
              <SlidersHorizontal size={18} /> Filters
            </h2>
            <button onClick={clearFilters} className="text-sm font-medium text-[var(--jade)] hover:text-[var(--emerald)] hover-underline">Reset All</button>
          </div>

          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--stone)]" />
              <input 
                type="text" 
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                className="input pl-9 w-full text-sm" 
                placeholder="AI Search..." 
              />
            </div>
            {aiParsed && (
              <div className="mt-2 text-xs font-semibold text-[var(--emerald)] flex items-center gap-1 bg-[var(--mint)] px-2 py-1 rounded">
                <Sparkles size={12} /> AI filters applied
              </div>
            )}
          </form>

          <div className="space-y-6">
            {/* Location */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="caption text-[var(--slate)] font-semibold uppercase tracking-wider">Area</h3>
              </div>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--stone)]" />
                <select 
                  className="input pl-9 w-full text-sm cursor-pointer appearance-none bg-transparent"
                  value={filters.area || ""} 
                  onChange={e => { const f = { ...filters, area: e.target.value || undefined, type: "student" as const }; setFilters(f); searchWithFilters(f); }}
                >
                  <option value="">All Dhaka Areas</option>
                  {DHAKA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--stone)] pointer-events-none" />
              </div>
            </div>

            <div className="w-full h-px bg-[var(--foam)]" />

            {/* University Distance */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="caption text-[var(--slate)] font-semibold uppercase tracking-wider">University</h3>
              </div>
              <div className="relative">
                <select 
                  className="input w-full text-sm cursor-pointer appearance-none pr-8"
                  value={selectedUniv} 
                  onChange={e => setSelectedUniv(e.target.value)}
                >
                  <option value="">Select Varsity</option>
                  {UNIVERSITIES.map(u => <option key={u.id} value={u.id}>{u.short_name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--stone)] pointer-events-none" />
              </div>
            </div>

            <div className="w-full h-px bg-[var(--foam)]" />

            {/* Price Range */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="caption text-[var(--slate)] font-semibold uppercase tracking-wider">Max Price</h3>
                <span className="text-sm font-semibold text-[var(--emerald)] bangla">
                  {filters.max_rent ? `৳${filters.max_rent.toLocaleString()}` : "Any"}
                </span>
              </div>
              <input 
                type="range" 
                min="5000" max="30000" step="500" 
                value={filters.max_rent || 30000}
                onChange={e => {
                  const val = Number(e.target.value);
                  const f = { ...filters, max_rent: val >= 30000 ? undefined : val, type: "student" as const };
                  setFilters(f);
                  searchWithFilters(f);
                }}
                className="w-full accent-[var(--emerald)]"
              />
              <div className="flex justify-between text-xs text-[var(--stone)] mt-2 bangla">
                <span>৳5k</span>
                <span>৳30k+</span>
              </div>
            </div>

            <div className="w-full h-px bg-[var(--foam)]" />

            {/* Gender Filter */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="caption text-[var(--slate)] font-semibold uppercase tracking-wider">Allowed Gender</h3>
              </div>
              <div className="relative">
                <select 
                  className="input w-full text-sm cursor-pointer appearance-none pr-8"
                  value={filters.for_gender || ""} 
                  onChange={e => { const f = { ...filters, for_gender: e.target.value as SearchFilters["for_gender"] || undefined, type: "student" as const }; setFilters(f); searchWithFilters(f); }}
                >
                  <option value="">Any Gender</option>
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--stone)] pointer-events-none" />
              </div>
            </div>
            
            <div className="w-full h-px bg-[var(--foam)]" />

            {/* Furnishing Filter */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="caption text-[var(--slate)] font-semibold uppercase tracking-wider">Furnishing</h3>
              </div>
              <div className="relative">
                <select 
                  className="input w-full text-sm cursor-pointer appearance-none pr-8"
                  value={filters.furnishing || ""} 
                  onChange={e => { const f = { ...filters, furnishing: e.target.value as SearchFilters["furnishing"] || undefined, type: "student" as const }; setFilters(f); searchWithFilters(f); }}
                >
                  <option value="">Any Furnishing</option>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi">Semi-Furnished</option>
                  <option value="fully">Fully-Furnished</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--stone)] pointer-events-none" />
              </div>
            </div>
            
          </div>

          <div className="mt-8">
            <button onClick={handleSaveSearch} className="w-full py-3 bg-[var(--primary-light)] hover:bg-[var(--primary-xlight)] text-[var(--forest)] rounded-xl font-bold transition-colors flex items-center justify-center gap-2 border border-[var(--emerald)]/30">
              <Bell size={16} /> Save Search as Alert
            </button>
          </div>
        </aside>

        {/* RESULTS AREA */}
        <div className="flex-grow flex flex-col min-w-0">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-['Playfair_Display'] font-bold text-[var(--forest)] mb-2">
                {loading ? "Searching..." : `${sortedListings.length} student rooms found`}
              </h1>
              {/* Active Filter Chips */}
              <AnimatePresence>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).filter(([k,v]) => k !== 'type' && v !== undefined && v !== "").map(([k, v]) => (
                    <motion.div 
                      key={k}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="bg-[var(--mint)] text-[var(--forest)] text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-[var(--emerald)]/20"
                    >
                      <span className="capitalize">{k.replace('_', ' ')}:</span> {v}
                      <button onClick={() => removeFilter(k as keyof SearchFilters)} className="hover:text-red-600 transition-colors ml-1">
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-4 self-start sm:self-auto shrink-0">
              <div className="relative">
                <select 
                  className="input py-2 pl-3 pr-8 text-sm bg-white cursor-pointer appearance-none border-[var(--foam)] hover:border-[var(--emerald)]"
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value)}
                >
                  <option value="recommended">Sort: Recommended</option>
                  <option value="price_low">Sort: Price (Low to High)</option>
                  <option value="price_high">Sort: Price (High to Low)</option>
                  <option value="ai_score">Sort: Highest AI Score</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--stone)] pointer-events-none" />
              </div>
              
              <div className="flex bg-white rounded-lg border border-[var(--foam)] p-1 shrink-0 shadow-sm">
                <button 
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[var(--mist)] text-[var(--emerald)]" : "text-[var(--stone)] hover:text-[var(--forest)]"}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode("map")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "map" ? "bg-[var(--mist)] text-[var(--emerald)]" : "text-[var(--stone)] hover:text-[var(--forest)]"}`}
                >
                  <MapIcon size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Content: Grid or Map */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--slate)]">
              <Loader2 size={32} className="animate-spin text-[var(--emerald)] mb-4" />
              <p className="font-medium">Finding the best matches...</p>
            </div>
          ) : viewMode === "map" ? (
            <div className="flex-grow flex gap-6 h-[calc(100vh-220px)] bg-white rounded-2xl border border-[var(--foam)] p-2 overflow-hidden shadow-[var(--shadow-sm)]">
              {/* List alongside map */}
              <div className="w-[45%] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {sortedListings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-80">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-[var(--slate)] font-medium mb-3">No properties found</p>
                    <button onClick={clearFilters} className="bg-[var(--forest)] text-white px-4 py-1.5 rounded-full text-sm font-semibold">Clear Filters</button>
                  </div>
                ) : (
                  sortedListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} distanceKm={getDistance(listing)} />
                  ))
                )}
              </div>
              <div className="flex-grow bg-[var(--bg-muted)] rounded-xl relative overflow-hidden">
                <ListingMap listings={sortedListings} selectedUniversityId={selectedUniv} />
              </div>
            </div>
          ) : sortedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[var(--foam)] shadow-sm text-center px-6">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-[var(--forest)] mb-2">No Student flats found</h3>
              <p className="text-[var(--slate)] mb-6">Try changing your search terms, removing filters, or choosing a different area.</p>
              <button onClick={clearFilters} className="bg-[var(--forest)] hover:bg-[var(--jade)] text-white px-6 py-2 rounded-full font-semibold transition-colors">
                Clear Filters
              </button>
            </div>
          ) : (
            <motion.div 
              variants={fadeUpStagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {sortedListings.map((listing) => (
                <motion.div key={listing.id} variants={fadeUp}>
                  <ListingCard listing={listing} distanceKm={getDistance(listing)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--mist)]"><Navbar /></div>}>
      <StudentListingsContent />
    </Suspense>
  );
}
