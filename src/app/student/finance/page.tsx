"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { Users, Calculator, Plus, Minus, Utensils, AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { GreenButton } from "@/components/ui/GreenButton";
import { fadeUpStagger, fadeUp } from "@/lib/animations";

export default function FinancePage() {
  // Rent Splitter State
  const [rent, setRent] = useState(24000);
  const [flatmates, setFlatmates] = useState(3);
  
  // Meal Tracker State
  const [meals, setMeals] = useState({ breakfast: 40, lunch: 70, dinner: 70 });
  const [days, setDays] = useState(30);
  
  // Budget State
  const [allowance, setAllowance] = useState(15000);
  const [utilities, setUtilities] = useState(900);

  // Derived Values
  const rentShare = Math.round(rent / flatmates);
  const dailyMealCost = meals.breakfast + meals.lunch + meals.dinner;
  const monthlyMealCost = dailyMealCost * days;
  
  const totalExpenses = rentShare + monthlyMealCost + utilities;
  const remaining = allowance - totalExpenses;
  const spentPercentage = Math.min(100, Math.max(0, (totalExpenses / allowance) * 100));
  const isDanger = remaining < (allowance * 0.1);

  return (
    <div className="min-h-screen bg-[var(--mist)] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-28 container mx-auto px-6 pb-24">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto mb-16 text-center">
          <span className="overline mb-4 block">Student Finance Tool</span>
          <h1 className="display-xl text-[var(--forest)] mb-4">Split rent. Track meals.<br/>Stay on budget.</h1>
          <p className="body-lg text-[var(--slate)] max-w-2xl mx-auto">The only platform that understands your allowance, your flatmates, and your daily meal contributions.</p>
        </motion.div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-8 flex flex-col">
            
            {/* SECTION 1: RENT SPLITTER */}
            <motion.div variants={fadeUpStagger} initial="hidden" animate="show" className="bg-white rounded-3xl p-8 border border-[var(--foam)] shadow-[var(--shadow-sm)] flex-1">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--forest)]">
                  <Users size={20} />
                </div>
                <h2 className="display-lg text-[var(--forest)] text-2xl">Rent Splitter</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Total Monthly Rent</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[var(--slate)] bangla">৳</div>
                    <input 
                      type="number" 
                      value={rent}
                      onChange={(e) => setRent(Number(e.target.value))}
                      className="w-full py-4 pl-10 pr-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-2xl font-bold text-[var(--forest)] bangla transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Number of Flatmates</label>
                  <div className="flex items-center justify-between p-2 bg-[var(--mist)] rounded-xl border-2 border-transparent">
                    <button onClick={() => setFlatmates(Math.max(1, flatmates - 1))} className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center text-[var(--stone)] hover:text-[var(--forest)] hover:shadow-md transition-all active:scale-95">
                      <Minus size={20} />
                    </button>
                    <span className="text-2xl font-bold text-[var(--forest)] w-12 text-center">{flatmates}</span>
                    <button onClick={() => setFlatmates(flatmates + 1)} className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center text-[var(--stone)] hover:text-[var(--forest)] hover:shadow-md transition-all active:scale-95">
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[var(--foam)] flex items-end justify-between">
                <div>
                  <div className="text-[var(--slate)] font-medium mb-1">Each person pays</div>
                  <div className="text-4xl font-['Playfair_Display'] font-bold text-[var(--emerald)] bangla">
                    ৳<CountUp end={rentShare} duration={1} separator="," />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* SECTION 2: MEAL TRACKER */}
            <motion.div variants={fadeUpStagger} initial="hidden" animate="show" className="bg-white rounded-3xl p-8 border border-[var(--foam)] shadow-[var(--shadow-sm)] flex-1">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--forest)]">
                    <Utensils size={20} />
                  </div>
                  <h2 className="display-lg text-[var(--forest)] text-2xl">Meal Tracker</h2>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[var(--slate)] font-medium">Daily Cost</div>
                  <div className="font-bold text-[var(--emerald)] bangla">৳{dailyMealCost}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {['breakfast', 'lunch', 'dinner'].map((meal) => (
                  <div key={meal}>
                    <label className="text-xs font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">{meal}</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--slate)] bangla">৳</div>
                      <input 
                        type="number" 
                        value={meals[meal as keyof typeof meals]}
                        onChange={(e) => setMeals({...meals, [meal]: Number(e.target.value)})}
                        className="w-full py-3 pl-8 pr-2 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none text-lg font-bold text-[var(--forest)] bangla transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold text-[var(--slate)] mb-2 uppercase tracking-wider">
                  <span>Days in Month</span>
                  <span className="text-[var(--emerald)]">{days} days</span>
                </div>
                <input 
                  type="range" min="1" max="31" value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full accent-[var(--emerald)]"
                />
              </div>

              <div className="mt-8 pt-6 border-t border-[var(--foam)] flex items-center gap-6">
                {/* Circular Progress Ring CSS Mock */}
                <div className="relative w-16 h-16 rounded-full bg-[var(--mist)] flex items-center justify-center overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-[var(--emerald)]" style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`, transform: `translateY(${100 - ((monthlyMealCost / allowance) * 100)}%)`, transition: 'transform 0.5s ease' }} />
                  <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center text-xs font-bold text-[var(--forest)]">
                    {Math.round((monthlyMealCost / allowance) * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-[var(--slate)] font-medium mb-1">Monthly Food Cost</div>
                  <div className="text-3xl font-['Playfair_Display'] font-bold text-[var(--forest)] bangla">
                    ৳<CountUp end={monthlyMealCost} duration={1} separator="," />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* SECTION 3: BUDGET FORECAST */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-[var(--forest)] rounded-3xl p-8 lg:p-12 text-white shadow-[var(--shadow-lg)] flex flex-col relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[var(--mint)]">
                  <Calculator size={20} />
                </div>
                <h2 className="display-lg text-white text-2xl">Monthly Forecast</h2>
              </div>

              <div className="mb-10">
                <label className="text-sm font-semibold text-[var(--mint)]/80 mb-2 block uppercase tracking-wider">Total Monthly Allowance</label>
                <div className="relative border-b border-white/20 pb-2">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-white/50 bangla">৳</div>
                  <input 
                    type="number" 
                    value={allowance}
                    onChange={(e) => setAllowance(Number(e.target.value))}
                    className="w-full py-2 pl-8 bg-transparent outline-none text-4xl font-['Playfair_Display'] font-bold text-white bangla placeholder-white/20"
                  />
                </div>
              </div>

              {/* Visual Budget Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm font-semibold mb-3">
                  <span className="text-white">Budget Usage</span>
                  <span className={isDanger ? 'text-red-400' : 'text-[var(--mint)]'}>{Math.round(spentPercentage)}% spent</span>
                </div>
                <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden flex">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(rentShare / allowance) * 100}%` }}
                    className="h-full bg-[var(--mint)] transition-all duration-500 ease-out"
                    title="Rent"
                  />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(monthlyMealCost / allowance) * 100}%` }}
                    className="h-full bg-[var(--emerald)] transition-all duration-500 ease-out"
                    title="Food"
                  />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(utilities / allowance) * 100}%` }}
                    className="h-full bg-white transition-all duration-500 ease-out"
                    title="Utilities"
                  />
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-4 mb-auto">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[var(--mint)]" /> Rent</div>
                  <div className="font-bold bangla">৳{rentShare.toLocaleString()}</div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[var(--emerald)]" /> Food</div>
                  <div className="font-bold bangla">৳{monthlyMealCost.toLocaleString()}</div>
                </div>
                <div className="flex justify-between items-center text-sm group">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-white" /> Utilities</div>
                  <div className="font-bold bangla bg-white/10 rounded px-2 py-1 flex items-center">
                    ৳ <input type="number" value={utilities} onChange={e=>setUtilities(Number(e.target.value))} className="w-12 bg-transparent outline-none ml-1 text-right" />
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-white/20">
                <div className="flex justify-between items-end mb-4">
                  <div className="text-white/80 font-medium">Remaining</div>
                  <div className={`text-4xl font-['Playfair_Display'] font-bold bangla ${isDanger ? 'text-red-400' : 'text-white'}`}>
                    ৳<CountUp end={remaining} duration={1.5} separator="," />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isDanger && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="mt-6 bg-[#FEF2F2] rounded-xl p-4 text-[#991B1B]"
                  >
                    <div className="flex gap-3">
                      <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                      <div>
                        <div className="font-bold text-sm mb-1">Your budget is tight.</div>
                        <p className="text-xs mb-3 opacity-90">Consider filtering for rooms under ৳{Math.floor((allowance - monthlyMealCost - utilities)/1000)}k to stay safe.</p>
                        <button className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:underline">
                          Find Cheaper Rooms <ArrowRight size={14}/>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
