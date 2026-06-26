"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/shared/Navbar";
import { DHAKA_AREAS, UNIVERSITIES } from "@/lib/utils";
import { fadeUpStagger, fadeUp } from "@/lib/animations";
import { Users, Filter, Check, MapPin } from "lucide-react";

// Mock data
const MOCK_SEEKERS = [
  { id: "1", name: "Tanvir Ahmed", university: "IUT", budget: 6000, 
    gender: "male", area_pref: "Board Bazar", lifestyle: ["Early riser", "Non-smoker", "Vegetarian ok"],
    avatar: "T", bio: "CSE final year. Need quiet environment for thesis." },
  { id: "2", name: "Priya Das", university: "BRACU", budget: 8000,
    gender: "female", area_pref: "Mirpur-2", lifestyle: ["Night owl", "Non-smoker"],
    avatar: "P", bio: "Looking for 2 flatmates, already have a room." },
  { id: "3", name: "Rafiq Islam", university: "DIU", budget: 5000,
    gender: "male", area_pref: "Dhanmondi", lifestyle: ["Non-smoker"],
    avatar: "R", bio: "First year student, new to Dhaka." },
];

const LIFESTYLE_OPTIONS = ["Early riser", "Night owl", "Non-smoker", "Vegetarian ok", "Pets ok", "Quiet study environment"];

export default function FlatmatesPage() {
  const [formData, setFormData] = useState({
    name: "",
    university: UNIVERSITIES[0].short_name,
    budget: 5000,
    gender: "Any",
    area_pref: DHAKA_AREAS[0],
    lifestyle: [] as string[],
    bio: ""
  });

  const [filterUni, setFilterUni] = useState("All");
  const [maxBudget, setMaxBudget] = useState(15000);

  const toggleLifestyle = (opt: string) => {
    setFormData(prev => ({
      ...prev,
      lifestyle: prev.lifestyle.includes(opt) 
        ? prev.lifestyle.filter(l => l !== opt)
        : [...prev.lifestyle, opt]
    }));
  };

  const sortedSeekers = useMemo(() => {
    return MOCK_SEEKERS.map(seeker => {
      let score = 0;
      if (formData.university === seeker.university) score += 40;
      if (Math.abs(formData.budget - seeker.budget) <= 2000) score += 30;
      if (formData.area_pref === seeker.area_pref) score += 20;
      
      const overlap = seeker.lifestyle.filter(l => formData.lifestyle.includes(l)).length;
      if (overlap >= 1) score += 10;
      
      return { ...seeker, score };
    })
    .filter(s => filterUni === "All" || s.university === filterUni)
    .filter(s => s.budget <= maxBudget)
    .sort((a, b) => b.score - a.score);
  }, [formData, filterUni, maxBudget]);

  return (
    <div className="min-h-screen bg-[var(--mist)] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-28 container mx-auto px-6 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center md:text-left">
          <h1 className="display-xl text-[var(--forest)] mb-2 flex items-center justify-center md:justify-start gap-3">
            <Users size={36} className="text-[var(--emerald)]" /> Find Flatmates
          </h1>
          <p className="body-lg text-[var(--slate)] max-w-2xl">
            Post your profile and browse highly compatible students looking to share a flat.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT: 40% (Form) */}
          <div className="lg:w-[40%] flex-shrink-0">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[var(--foam)] shadow-[var(--shadow-sm)] sticky top-[100px]">
              <h2 className="text-xl font-bold text-[var(--forest)] mb-6 flex items-center gap-2">
                Post Your Profile
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-[var(--slate)] mb-1 block uppercase tracking-wider">Your Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Shakil" className="w-full py-3 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-sm font-bold text-[var(--forest)] transition-colors" />
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

                <button type="button" className="w-full bg-[var(--forest)] hover:bg-[var(--jade)] text-white py-3 rounded-xl font-bold text-sm transition-colors mt-2">
                  Find Matches
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

            <motion.div variants={fadeUpStagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {sortedSeekers.map(s => (
                  <motion.div key={s.id} variants={fadeUp} layout className="bg-white rounded-2xl p-5 border border-[var(--foam)] shadow-[var(--shadow-sm)] flex flex-col hover:border-[var(--emerald)] transition-colors">
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-lg">
                          {s.avatar}
                        </div>
                        <div>
                          <h3 className="font-bold text-[var(--forest)] text-base">{s.name}</h3>
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

                    <div className="flex items-center justify-between text-sm mb-3">
                      <div className="font-bold text-[var(--emerald)] bangla">৳{s.budget.toLocaleString()}</div>
                      <div className="flex items-center gap-1 text-[var(--slate)] font-medium text-xs">
                        <MapPin size={12} /> {s.area_pref}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {s.lifestyle.map((l, i) => (
                        <span key={i} className="px-2 py-1 bg-[var(--mist)] text-[var(--stone)] rounded-full text-[10px] font-semibold">{l}</span>
                      ))}
                    </div>

                    <p className="text-xs text-[var(--slate)] leading-relaxed flex-grow mb-4 bg-[var(--bg-subtle)] p-2 rounded-lg italic">
                      "{s.bio}"
                    </p>

                    <button type="button" onClick={() => console.log('Connect', s.id)} className="w-full bg-[var(--mist)] hover:bg-[var(--primary-light)] text-[var(--forest)] py-2.5 rounded-lg font-bold text-sm transition-colors mt-auto">
                      Connect
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {sortedSeekers.length === 0 && (
                <div className="col-span-full py-10 text-center text-[var(--slate)]">
                  No flatmates found matching your filters.
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  );
}
