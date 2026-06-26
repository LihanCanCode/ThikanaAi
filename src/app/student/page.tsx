"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, SlidersHorizontal, Map as MapIcon, LayoutGrid, X, ChevronDown, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { PropertyCard } from "@/components/cards/PropertyCard";
import { fadeUpStagger, fadeUp } from "@/lib/animations";

const MOCK_RESULTS = [
  { id: "1", title: "Modern 2-Bed Flat near IUT", location: "Board Bazar, Gazipur", price: 14000, beds: 2, baths: 2, floor: "4th", imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop", aiScore: 94, distanceToUniversity: "5 min to IUT", isVerified: true },
  { id: "2", title: "Furnished Room for Female Student", location: "Mirpur-2, Block B", price: 7500, beds: 1, baths: 1, floor: "2nd", imageUrl: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800&auto=format&fit=crop", aiScore: 88, distanceToUniversity: "10 min to BUBT", isVerified: true },
  { id: "3", title: "Premium 3-Bed Apartment", location: "Bashundhara R/A", price: 32000, beds: 3, baths: 3, floor: "6th", imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop", aiScore: 96, distanceToUniversity: "15 min to NSU", isVerified: true },
  { id: "4", title: "Affordable Sublet for Bachelor", location: "Dhanmondi 27", price: 6500, beds: 1, baths: 1, floor: "1st", imageUrl: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800&auto=format&fit=crop", aiScore: 82, distanceToUniversity: "20 min to UIU", isVerified: false },
  { id: "5", title: "2 Room Flat with Balcony", location: "Uttara Sector 10", price: 18000, beds: 2, baths: 2, floor: "3rd", imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1e5240980c?q=80&w=800&auto=format&fit=crop", aiScore: 91, distanceToUniversity: "12 min to IUBAT", isVerified: true },
  { id: "6", title: "Shared Room for Male Students", location: "Banani", price: 5000, beds: 1, baths: 1, floor: "Ground", imageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=800&auto=format&fit=crop", aiScore: 78, distanceToUniversity: "8 min to AIUB", isVerified: false },
];

const ACTIVE_FILTERS = [
  { id: 'loc', label: 'Mirpur-2' },
  { id: 'price', label: 'Under ৳12k' },
  { id: 'bed', label: '2 Bed' },
];

export default function StudentRentPage() {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [price, setPrice] = useState(12000);
  const [aiScore, setAiScore] = useState(85);
  const [filters, setFilters] = useState(ACTIVE_FILTERS);

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-[var(--mist)] flex flex-col">
      <Navbar />

      <div className="flex-grow pt-24 container mx-auto px-6 pb-20 flex flex-col md:flex-row gap-8">
        
        {/* FILTER SIDEBAR */}
        <aside className="w-full md:w-[280px] shrink-0 h-fit md:sticky md:top-24 bg-white rounded-2xl border border-[var(--foam)] shadow-[var(--shadow-sm)] p-6 overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading text-[var(--forest)] flex items-center gap-2">
              <SlidersHorizontal size={18} /> Filters
            </h2>
            <button className="text-sm font-medium text-[var(--jade)] hover:text-[var(--emerald)] hover-underline">Reset All</button>
          </div>

          <div className="space-y-6">
            {/* Location */}
            <div>
              <div className="flex items-center justify-between mb-3 cursor-pointer">
                <h3 className="caption text-[var(--slate)] font-semibold uppercase tracking-wider">Location</h3>
                <ChevronDown size={16} className="text-[var(--stone)]" />
              </div>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--stone)]" />
                <input type="text" className="input pl-9" placeholder="Search area..." defaultValue="Mirpur-2" />
              </div>
            </div>

            <div className="w-full h-px bg-[var(--foam)]" />

            {/* University Distance */}
            <div>
              <div className="flex items-center justify-between mb-3 cursor-pointer">
                <h3 className="caption text-[var(--slate)] font-semibold uppercase tracking-wider">Distance to Campus</h3>
                <ChevronDown size={16} className="text-[var(--stone)]" />
              </div>
              <div className="space-y-2">
                {['< 5 mins walk', '< 10 mins walk', '< 15 mins walk', 'Any distance'].map((label, i) => (
                  <label key={i} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${i===1 ? 'border-[var(--emerald)]' : 'border-[var(--stone)]'}`}>
                      {i === 1 && <div className="w-2 h-2 rounded-full bg-[var(--emerald)]" />}
                    </div>
                    <span className={`text-sm ${i===1 ? 'text-[var(--forest)] font-medium' : 'text-[var(--slate)] group-hover:text-[var(--forest)]'}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-[var(--foam)]" />

            {/* Price Range */}
            <div>
              <div className="flex items-center justify-between mb-3 cursor-pointer">
                <h3 className="caption text-[var(--slate)] font-semibold uppercase tracking-wider">Max Price</h3>
                <span className="text-sm font-semibold text-[var(--emerald)] bangla">৳{price.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min="5000" max="30000" step="500" 
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full accent-[var(--emerald)]"
              />
              <div className="flex justify-between text-xs text-[var(--stone)] mt-2 bangla">
                <span>৳5,000</span>
                <span>৳30,000+</span>
              </div>
            </div>

            <div className="w-full h-px bg-[var(--foam)]" />

            {/* AI Score */}
            <div>
              <div className="flex items-center justify-between mb-3 cursor-pointer">
                <h3 className="caption text-[var(--slate)] font-semibold uppercase tracking-wider">Min AI Trust Score</h3>
                <span className="text-sm font-semibold text-[var(--emerald)]">{aiScore}</span>
              </div>
              <input 
                type="range" 
                min="50" max="100" step="1" 
                value={aiScore}
                onChange={(e) => setAiScore(Number(e.target.value))}
                className="w-full accent-[var(--emerald)]"
              />
            </div>
          </div>
        </aside>

        {/* RESULTS AREA */}
        <div className="flex-grow flex flex-col">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-['Playfair_Display'] font-bold text-[var(--forest)] mb-2">342 rooms found near IUT</h1>
              {/* Active Filter Chips */}
              <AnimatePresence>
                <div className="flex flex-wrap gap-2">
                  {filters.map(f => (
                    <motion.div 
                      key={f.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="bg-[var(--mint)] text-[var(--forest)] text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                    >
                      {f.label}
                      <button onClick={() => removeFilter(f.id)} className="hover:text-red-600 transition-colors">
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-4 self-start sm:self-auto">
              <select className="input py-2 text-sm bg-white cursor-pointer w-auto pr-8">
                <option>Sort: Recommended</option>
                <option>Sort: Price (Low to High)</option>
                <option>Sort: Price (High to Low)</option>
                <option>Sort: Highest AI Score</option>
              </select>
              
              <div className="flex bg-white rounded-lg border border-[var(--foam)] p-1">
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
          {viewMode === "grid" ? (
            <motion.div 
              variants={fadeUpStagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {MOCK_RESULTS.map((prop) => (
                <motion.div key={prop.id} variants={fadeUp}>
                  <PropertyCard {...prop} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex-grow flex gap-6 h-[calc(100vh-220px)] bg-white rounded-2xl border border-[var(--foam)] p-2 overflow-hidden shadow-[var(--shadow-sm)]">
              {/* List alongside map */}
              <div className="w-[40%] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {MOCK_RESULTS.map((prop) => (
                  <PropertyCard key={prop.id} {...prop} />
                ))}
              </div>
              {/* Map Placeholder */}
              <div className="flex-grow bg-[var(--bg-muted)] rounded-xl relative overflow-hidden flex items-center justify-center">
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(42,125,70,0.5) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                 <div className="relative z-10 text-center text-[var(--forest)] flex flex-col items-center">
                   <MapIcon size={48} className="mb-4 opacity-50" />
                   <p className="font-medium">Mapbox Map Integration Here</p>
                   <p className="text-sm text-[var(--slate)]">Requires mapbox-gl token</p>
                 </div>
                 
                 {/* Mock Map Markers */}
                 <div className="absolute top-[30%] left-[40%] bg-[var(--emerald)] text-white text-sm font-bold py-1 px-2 rounded-full shadow-lg bangla transform hover:scale-110 cursor-pointer transition-transform">৳14,000</div>
                 <div className="absolute top-[50%] left-[60%] bg-[var(--emerald)] text-white text-sm font-bold py-1 px-2 rounded-full shadow-lg bangla transform hover:scale-110 cursor-pointer transition-transform">৳7,500</div>
              </div>
            </div>
          )}

          {/* Pagination / Load More */}
          {viewMode === "grid" && (
            <div className="mt-10 flex justify-center">
              <button className="bg-white border-2 border-[var(--border)] text-[var(--forest)] font-semibold px-8 py-3 rounded-full hover:border-[var(--emerald)] hover:text-[var(--emerald)] transition-all">
                Load More Results
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
