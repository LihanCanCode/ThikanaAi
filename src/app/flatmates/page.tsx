"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/shared/Navbar";
import { DHAKA_AREAS, UNIVERSITIES } from "@/lib/utils";
import { fadeUpStagger, fadeUp } from "@/lib/animations";
import { Users, Filter, Check, MapPin, Loader2 } from "lucide-react";
import { getFlatmateProfiles, postFlatmateProfile, deleteFlatmateProfile } from "@/app/flatmate-actions";
import { sendConnectionRequest } from "@/app/actions/chat-actions";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

// Only real data is used now

const LIFESTYLE_OPTIONS = ["Early riser", "Night owl", "Non-smoker", "Vegetarian ok", "Pets ok", "Quiet study environment"];

export default function FlatmatesPage() {
  const [seekers, setSeekers] = useState<any[]>([]);
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
    avatar: ""
  });

  const [filterUni, setFilterUni] = useState("All");
  const [maxBudget, setMaxBudget] = useState(15000);

  // Load from DB
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setMyUserId(data?.user?.id || null));

    async function loadData() {
      try {
        const dbProfiles = await getFlatmateProfiles();
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
            bio: p.profile_data?.bio || ""
          }));
          setSeekers(mapped);
        } else {
          setSeekers([]);
        }
      } catch (error) {
        console.error("Failed to load profiles", error);
        setSeekers([]);
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
          bio: res.profile.profile_data?.bio || ""
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
      </main>
    </div>
  );
}
