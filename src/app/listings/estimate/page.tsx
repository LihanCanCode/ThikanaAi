"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import { DHAKA_AREAS } from "@/lib/utils";
import { Calculator, MapPin, Loader2, ArrowRight, Minus, Plus } from "lucide-react";
import { fadeUp } from "@/lib/animations";

export default function RentEstimatorPage() {
  const [area, setArea] = useState(DHAKA_AREAS[0]);
  const [rooms, setRooms] = useState(1);
  const [furnishing, setFurnishing] = useState<"unfurnished"|"semi"|"fully">("unfurnished");
  const [floor, setFloor] = useState<number | "">("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ min: number; max: number; median: number; sample_label: string; area: string } | null>(null);

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/rent-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area,
          rooms,
          furnishing,
          floor: floor === "" ? null : Number(floor)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--mist)] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-28 container mx-auto px-6 pb-24 flex justify-center">
        <div className="w-full max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="display-xl text-[var(--forest)] mb-4 flex items-center justify-center gap-3">
              <Calculator size={36} className="text-[var(--emerald)]" /> Smart Rent Estimator
            </h1>
            <p className="body-lg text-[var(--slate)] max-w-lg mx-auto">
              Get an instant AI-powered estimate for a flat in Dhaka based on real-time market data.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-3xl p-8 border border-[var(--foam)] shadow-[var(--shadow-sm)]">
            <form onSubmit={handleEstimate} className="space-y-8">
              {/* Area */}
              <div>
                <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Area in Dhaka</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--stone)]" />
                  <select 
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full py-4 pl-12 pr-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-lg font-bold text-[var(--forest)] appearance-none cursor-pointer"
                  >
                    {DHAKA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Rooms */}
                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Rooms (Beds)</label>
                  <div className="flex items-center justify-between p-2 bg-[var(--mist)] rounded-xl border-2 border-transparent">
                    <button type="button" onClick={() => setRooms(Math.max(1, rooms - 1))} className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center text-[var(--stone)] hover:text-[var(--forest)] hover:shadow-md transition-all active:scale-95">
                      <Minus size={20} />
                    </button>
                    <span className="text-xl font-bold text-[var(--forest)] w-12 text-center">{rooms}</span>
                    <button type="button" onClick={() => setRooms(Math.min(5, rooms + 1))} className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center text-[var(--stone)] hover:text-[var(--forest)] hover:shadow-md transition-all active:scale-95">
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Floor */}
                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Floor Level (Optional)</label>
                  <input 
                    type="number" 
                    value={floor}
                    onChange={(e) => setFloor(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 0 for Ground"
                    className="w-full py-4 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-lg font-bold text-[var(--forest)] transition-colors placeholder:text-[var(--stone)] placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Furnishing */}
              <div>
                <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Furnishing</label>
                <div className="flex gap-2">
                  {(["unfurnished", "semi", "fully"] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFurnishing(f)}
                      className={`flex-1 py-4 rounded-xl font-semibold capitalize transition-all border-2 ${
                        furnishing === f 
                          ? "bg-[var(--mint)] border-[var(--emerald)] text-[var(--forest)]" 
                          : "bg-[var(--mist)] border-transparent text-[var(--stone)] hover:bg-[var(--foam)]"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[var(--forest)] hover:bg-[var(--jade)] text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : "Estimate Rent"}
              </button>
            </form>

            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 40 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden border-t border-[var(--foam)] pt-10"
                >
                  <div className="text-center">
                    <div className="text-sm font-bold text-[var(--emerald)] uppercase tracking-wider mb-4">Estimated Monthly Rent</div>
                    
                    <div className="text-4xl md:text-5xl font-['Playfair_Display'] font-bold text-[var(--forest)] bangla mb-8 flex justify-center items-center gap-2 flex-wrap">
                      <span>৳{result.min.toLocaleString()}</span>
                      <span className="text-[var(--stone)] font-sans text-3xl">–</span>
                      <span>৳{result.max.toLocaleString()}</span>
                    </div>

                    {/* Median Slider visualization */}
                    <div className="relative w-full max-w-md mx-auto h-2 bg-[var(--mist)] rounded-full mb-8">
                      <div className="absolute left-0 top-0 h-full w-full rounded-full bg-gradient-to-r from-[var(--emerald)]/20 via-[var(--emerald)] to-[var(--emerald)]/20" />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-[var(--forest)] rounded-full border-2 border-white shadow-md transition-all duration-1000 ease-out flex items-center justify-center"
                        style={{ left: "50%", transform: "translate(-50%, -50%)" }}
                      >
                        <div className="absolute -top-7 text-xs font-bold text-[var(--forest)] whitespace-nowrap bg-[var(--mint)] px-2 py-0.5 rounded bangla">
                          Median: ৳{result.median.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-[var(--slate)] mb-6">{result.sample_label}</p>

                    <Link 
                      href={`/listings?area=${encodeURIComponent(result.area)}&max_rent=${result.max}&min_rent=${result.min}`}
                      className="inline-flex items-center gap-2 text-sm font-bold text-[var(--jade)] hover:text-[var(--emerald)] bg-[var(--mint)] px-6 py-3 rounded-full transition-colors hover:scale-105 transform duration-200"
                    >
                      Browse listings in this price range <ArrowRight size={16} />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </div>
      </main>
    </div>
  );
}
