"use client";

/*
  SQL to create the saved_searches table in Supabase:

  CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    area TEXT,
    max_rent INTEGER,
    rooms INTEGER,
    type TEXT,
    for_gender TEXT,
    furnishing TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
  );
*/

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/shared/Navbar";
import { Bell, Trash2, Plus, X, Search, MapPin, ChevronDown } from "lucide-react";
import { fadeUpStagger, fadeUp } from "@/lib/animations";
import { DHAKA_AREAS } from "@/lib/utils";
import { SEED_LISTINGS } from "@/lib/seed-listings";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

type SavedSearch = {
  id: string;
  user_id: string;
  area: string | null;
  max_rent: number | null;
  rooms: number | null;
  type: string | null;
  for_gender: string | null;
  furnishing: string | null;
  created_at: string;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Filter Form State
  const [formData, setFormData] = useState({
    area: "",
    max_rent: 30000,
    rooms: 1,
    type: "student",
    for_gender: "",
    furnishing: ""
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadAlerts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth/login?returnUrl=/alerts";
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setAlerts(data);
      setLoading(false);
    }
    loadAlerts();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
        toast.success("Alert deleted");
      } else {
        toast.error("Failed to delete alert");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const handleSaveAlert = async () => {
    try {
      const payload = {
        area: formData.area || null,
        max_rent: formData.max_rent < 30000 ? formData.max_rent : null,
        rooms: formData.rooms || null,
        type: formData.type || null,
        for_gender: formData.for_gender || null,
        furnishing: formData.furnishing || null,
      };

      const res = await fetch("/api/alerts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const { alert } = await res.json();
        setAlerts([alert, ...alerts]);
        setShowAddPanel(false);
        toast.success("Alert created!");
      } else {
        toast.error("Failed to create alert");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const formatSummary = (alert: SavedSearch) => {
    const parts = [];
    if (alert.rooms) parts.push(`${alert.rooms}-bed`);
    if (alert.type) parts.push(alert.type);
    parts.push("flat");
    if (alert.area) parts.push(`in ${alert.area}`);
    if (alert.max_rent) parts.push(`under ৳${alert.max_rent.toLocaleString()}`);
    return parts.join(" ");
  };

  const getMatchesCount = (alert: SavedSearch) => {
    return SEED_LISTINGS.filter((l) => {
      if (alert.area && l.area !== alert.area) return false;
      if (alert.max_rent && l.rent_bdt > alert.max_rent) return false;
      if (alert.rooms && l.rooms !== alert.rooms) return false;
      if (alert.type && l.type !== alert.type) return false;
      if (alert.for_gender && l.for_gender !== alert.for_gender) return false;
      if (alert.furnishing && l.furnishing !== alert.furnishing) return false;
      return true;
    }).length;
  };

  const buildMatchUrl = (alert: SavedSearch) => {
    const params = new URLSearchParams();
    if (alert.area) params.set("area", alert.area);
    if (alert.max_rent) params.set("max_rent", alert.max_rent.toString());
    if (alert.rooms) params.set("rooms", alert.rooms.toString());
    if (alert.type) params.set("type", alert.type);
    if (alert.for_gender) params.set("for_gender", alert.for_gender);
    if (alert.furnishing) params.set("furnishing", alert.furnishing);
    
    const basePath = alert.type === "family" ? "/listings/family" : "/listings";
    return `${basePath}?${params.toString()}`;
  };

  if (loading) return <div className="min-h-screen bg-[var(--mist)]"><Navbar /><div className="pt-32 text-center">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-[var(--mist)] flex flex-col relative overflow-hidden">
      <Navbar />
      <Toaster position="bottom-center" />

      <main className="flex-grow pt-28 container mx-auto px-6 pb-24">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="display-xl text-[var(--forest)] mb-2 flex items-center gap-3">
              <Bell size={36} className="text-[var(--emerald)]" /> Smart Match Alerts
            </h1>
            <p className="body-lg text-[var(--slate)]">
              Get notified when listings matching your exact criteria are posted.
            </p>
          </motion.div>
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowAddPanel(true)}
            className="bg-[var(--forest)] hover:bg-[var(--jade)] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Add Alert
          </motion.button>
        </div>

        {alerts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[var(--foam)] shadow-[var(--shadow-sm)]">
            <Bell size={48} className="mx-auto text-[var(--stone)] mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-[var(--forest)] mb-2">No alerts yet</h3>
            <p className="text-[var(--slate)] max-w-md mx-auto mb-6">Create an alert to automatically get notified about new flats that match your budget and location.</p>
            <button onClick={() => setShowAddPanel(true)} className="btn btn-primary">Create Your First Alert</button>
          </div>
        ) : (
          <motion.div variants={fadeUpStagger} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {alerts.map((alert) => {
                const matchesCount = getMatchesCount(alert);
                return (
                  <motion.div key={alert.id} variants={fadeUp} layout initial={{ opacity: 0, scale: 0.9 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-2xl p-6 border border-[var(--foam)] shadow-[var(--shadow-sm)] flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                          <Search size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-[var(--forest)] text-lg capitalize">{formatSummary(alert)}</h3>
                          <div className="text-xs text-[var(--slate)] mt-0.5">
                            Created on {new Date(alert.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(alert.id)} className="text-[var(--stone)] hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {alert.area && <span className="px-2.5 py-1 bg-[var(--mist)] text-[var(--stone)] rounded-lg text-xs font-semibold flex items-center gap-1"><MapPin size={12}/> {alert.area}</span>}
                      {alert.max_rent && <span className="px-2.5 py-1 bg-[var(--mist)] text-[var(--stone)] rounded-lg text-xs font-semibold bangla">Max ৳{alert.max_rent.toLocaleString()}</span>}
                      {alert.rooms && <span className="px-2.5 py-1 bg-[var(--mist)] text-[var(--stone)] rounded-lg text-xs font-semibold">{alert.rooms} Beds</span>}
                      {alert.for_gender && <span className="px-2.5 py-1 bg-[var(--mist)] text-[var(--stone)] rounded-lg text-xs font-semibold capitalize">{alert.for_gender}</span>}
                      {alert.furnishing && <span className="px-2.5 py-1 bg-[var(--mist)] text-[var(--stone)] rounded-lg text-xs font-semibold capitalize">{alert.furnishing}</span>}
                    </div>

                    <div className="mt-auto pt-4 border-t border-[var(--foam)] flex items-center justify-between">
                      <div className="text-sm font-semibold text-[var(--slate)] flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${matchesCount > 0 ? 'bg-[var(--emerald)]' : 'bg-[var(--stone)]'}`} />
                        Matching listings right now: <span className="text-[var(--forest)]">{matchesCount}</span>
                      </div>
                      {matchesCount > 0 && (
                        <Link href={buildMatchUrl(alert)} className="text-[var(--emerald)] font-bold text-sm hover:underline">
                          View Matches &rarr;
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Slide-in Add Panel */}
      <AnimatePresence>
        {showAddPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]" onClick={() => setShowAddPanel(false)} />
            <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[110] border-l border-[var(--border)] flex flex-col">
              <div className="p-6 border-b border-[var(--foam)] flex justify-between items-center bg-[var(--bg-surface)]">
                <h2 className="text-xl font-bold text-[var(--forest)] flex items-center gap-2">
                  <Bell size={20} className="text-[var(--emerald)]"/> New Alert
                </h2>
                <button onClick={() => setShowAddPanel(false)} className="p-2 hover:bg-[var(--mist)] rounded-full transition-colors text-[var(--text-muted)]">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 flex-grow overflow-y-auto space-y-6">
                
                <div>
                  <label className="text-xs font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Area</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--stone)]" />
                    <select value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full py-3 pl-10 pr-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-sm font-bold text-[var(--forest)] appearance-none">
                      <option value="">Any Area</option>
                      {DHAKA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--stone)] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-[var(--slate)] uppercase tracking-wider">Max Rent</label>
                    <span className="text-sm font-bold text-[var(--emerald)] bangla">{formData.max_rent >= 30000 ? "Any" : `৳${formData.max_rent.toLocaleString()}`}</span>
                  </div>
                  <input type="range" min="5000" max="30000" step="500" value={formData.max_rent} onChange={e => setFormData({...formData, max_rent: Number(e.target.value)})} className="w-full accent-[var(--emerald)]" />
                  <div className="flex justify-between text-xs text-[var(--stone)] mt-1 bangla"><span>৳5k</span><span>৳30k+</span></div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Rooms (Beds)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(num => (
                      <button key={num} onClick={() => setFormData({...formData, rooms: num})} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${formData.rooms === num ? 'bg-[var(--emerald)] text-white' : 'bg-[var(--mist)] text-[var(--forest)] hover:bg-[var(--foam)]'}`}>
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Type</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full py-3 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-sm font-bold text-[var(--forest)] appearance-none">
                      <option value="student">Student</option>
                      <option value="family">Family</option>
                      <option value="sublet">Sublet</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Gender</label>
                    <select value={formData.for_gender} onChange={e => setFormData({...formData, for_gender: e.target.value})} className="w-full py-3 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-sm font-bold text-[var(--forest)] appearance-none">
                      <option value="">Any</option>
                      <option value="male">Male Only</option>
                      <option value="female">Female Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Furnishing</label>
                  <select value={formData.furnishing} onChange={e => setFormData({...formData, furnishing: e.target.value})} className="w-full py-3 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-sm font-bold text-[var(--forest)] appearance-none">
                    <option value="">Any</option>
                    <option value="unfurnished">Unfurnished</option>
                    <option value="semi">Semi-Furnished</option>
                    <option value="fully">Fully-Furnished</option>
                  </select>
                </div>

              </div>

              <div className="p-6 border-t border-[var(--foam)] bg-white">
                <button onClick={handleSaveAlert} className="w-full bg-[var(--forest)] hover:bg-[var(--jade)] text-white py-3.5 rounded-xl font-bold transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                  Save Alert <Bell size={16} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
