"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Home, DoorOpen, Check, UploadCloud, 
  Sparkles, Minus, Plus, CheckCircle2, ArrowRight
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { PropertyCard } from "@/components/cards/PropertyCard";
import { GreenButton } from "@/components/ui/GreenButton";

const STEPS = ["Basic", "Details", "Photos", "Pricing"];

export default function ListPropertyPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [generatedDesc, setGeneratedDesc] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    type: "flat",
    address: "",
    area: "",
    beds: 2,
    baths: 2,
    floor: "4th",
    furnishing: "semi",
    price: 12000,
    title: "New Property Listing"
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(curr => curr + 1);
  };

  const handleAiPrice = () => {
    setIsAiSuggesting(true);
    setTimeout(() => {
      setIsAiSuggesting(false);
      setSuggestedPrice(13500);
      setFormData(prev => ({ ...prev, price: 13500 }));
    }, 1500);
  };

  const handleAiDesc = () => {
    setIsGeneratingDesc(true);
    const desc = "A beautiful and spacious flat perfect for students. Excellent sunlight, secure neighborhood, and just 5 minutes walk from the university campus.\n\nখুব সুন্দর এবং খোলামেলা একটি ফ্ল্যাট। স্টুডেন্টদের জন্য উপযুক্ত। পর্যাপ্ত আলো বাতাস এবং ক্যাম্পাস থেকে মাত্র ৫ মিনিটের হাঁটা দূরত্ব।";
    
    // Simulate streaming
    setGeneratedDesc("");
    let i = 0;
    const interval = setInterval(() => {
      setGeneratedDesc(desc.substring(0, i));
      i++;
      if (i > desc.length) {
        clearInterval(interval);
        setIsGeneratingDesc(false);
      }
    }, 20);
  };

  return (
    <div className="min-h-screen bg-[var(--mist)] flex flex-col">
      <Navbar />

      <div className="flex-grow pt-24 container mx-auto px-6 pb-20">
        
        {/* PROGRESS INDICATOR */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative flex justify-between items-center">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[var(--foam)] rounded-full z-0" />
            <motion.div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[var(--emerald)] rounded-full z-0 transition-all duration-500 ease-in-out"
              style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            />
            
            {STEPS.map((step, i) => (
              <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                  i < currentStep ? "bg-[var(--emerald)] text-white" :
                  i === currentStep ? "bg-white border-2 border-[var(--emerald)] text-[var(--emerald)]" :
                  "bg-white border-2 border-[var(--foam)] text-[var(--stone)]"
                }`}>
                  {i < currentStep ? <Check size={16} /> : i + 1}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${i <= currentStep ? "text-[var(--forest)]" : "text-[var(--stone)]"}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SPLIT LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* LEFT: FORM AREA (60%) */}
          <div className="w-full lg:w-[60%] bg-white rounded-3xl p-8 shadow-[var(--shadow-sm)] border border-[var(--foam)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-[400px]"
              >
                {/* STEP 1: BASIC INFO */}
                {currentStep === 0 && (
                  <div className="space-y-8">
                    <h2 className="display-lg text-[var(--forest)]">What kind of place is it?</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { id: 'house', icon: Home, label: 'Full House' },
                        { id: 'flat', icon: Building2, label: 'Entire Flat' },
                        { id: 'room', icon: DoorOpen, label: 'Single Room' },
                        { id: 'sublet', icon: Home, label: 'Sublet' },
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setFormData({...formData, type: t.id})}
                          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 ${
                            formData.type === t.id 
                              ? "border-[var(--emerald)] bg-[var(--mint)] text-[var(--forest)] shadow-md scale-105" 
                              : "border-[var(--foam)] text-[var(--slate)] hover:border-[var(--emerald)] hover:bg-[var(--mist)]"
                          }`}
                        >
                          <t.icon size={32} className="mb-3" />
                          <span className="font-semibold text-sm">{t.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="relative group">
                        <input 
                          type="text" 
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full pt-6 pb-2 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors peer text-[var(--forest)] font-medium"
                          placeholder=" "
                        />
                        <label htmlFor="address" className={`absolute left-4 transition-all duration-200 pointer-events-none text-[var(--slate)] font-medium ${formData.address ? 'top-2 text-xs' : 'top-4 text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--emerald)]'}`}>
                          Full Address
                        </label>
                      </div>

                      <div className="relative group">
                        <select 
                          className="w-full pt-6 pb-2 px-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium appearance-none"
                          value={formData.area}
                          onChange={(e) => setFormData({...formData, area: e.target.value})}
                        >
                          <option value="" disabled>Select Area</option>
                          <option value="Mirpur-2">Mirpur-2</option>
                          <option value="Bashundhara">Bashundhara R/A</option>
                          <option value="Dhanmondi">Dhanmondi</option>
                          <option value="Board Bazar">Board Bazar (Gazipur)</option>
                        </select>
                        <label className="absolute left-4 top-2 text-xs text-[var(--slate)] font-medium pointer-events-none">
                          Neighborhood Area
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: DETAILS */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <h2 className="display-lg text-[var(--forest)]">Share some details</h2>
                    
                    <div className="space-y-6">
                      {[
                        { id: 'beds', label: 'Bedrooms', value: formData.beds },
                        { id: 'baths', label: 'Bathrooms', value: formData.baths },
                      ].map(counter => (
                        <div key={counter.id} className="flex items-center justify-between p-4 bg-[var(--mist)] rounded-xl">
                          <span className="font-semibold text-[var(--forest)]">{counter.label}</span>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setFormData({...formData, [counter.id]: Math.max(1, counter.value - 1)})}
                              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[var(--stone)] hover:text-[var(--forest)] hover:shadow-md transition-all active:scale-95"
                            >
                              <Minus size={18} />
                            </button>
                            <span className="w-4 text-center font-bold text-lg text-[var(--forest)]">{counter.value}</span>
                            <button 
                              onClick={() => setFormData({...formData, [counter.id]: counter.value + 1})}
                              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[var(--stone)] hover:text-[var(--forest)] hover:shadow-md transition-all active:scale-95"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <h3 className="heading text-[var(--forest)] mt-8 mb-4">Furnishing Status</h3>
                    <div className="flex gap-4">
                      {['Unfurnished', 'Semi-Furnished', 'Fully Furnished'].map(f => {
                        const id = f.toLowerCase().split('-')[0];
                        return (
                          <button
                            key={f}
                            onClick={() => setFormData({...formData, furnishing: id})}
                            className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                              formData.furnishing === id 
                                ? "border-[var(--emerald)] bg-[var(--mint)] text-[var(--forest)]" 
                                : "border-[var(--foam)] text-[var(--slate)] hover:border-[var(--emerald)]"
                            }`}
                          >
                            {f}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 3: PHOTOS */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <h2 className="display-lg text-[var(--forest)]">Upload property photos</h2>
                    <p className="body text-[var(--slate)] -mt-4">Good photos increase your trust score.</p>
                    
                    <div className="w-full h-64 border-2 border-dashed border-[var(--border-strong)] rounded-2xl bg-[var(--mist)] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[var(--foam)] hover:border-[var(--emerald)] transition-all group">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <UploadCloud size={32} className="text-[var(--emerald)]" />
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-[var(--forest)]">Click to upload</span> or drag and drop<br/>
                        <span className="text-sm text-[var(--stone)]">SVG, PNG, JPG or GIF (max. 800x400px)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: PRICING & DESC */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    <h2 className="display-lg text-[var(--forest)]">Set your price</h2>
                    
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-['Playfair_Display'] font-bold text-[var(--forest)] bangla">৳</div>
                      <input 
                        type="number" 
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                        className="w-full py-6 pl-12 pr-6 bg-[var(--mist)] border-2 border-transparent rounded-2xl focus:border-[var(--emerald)] outline-none transition-colors text-4xl font-['Playfair_Display'] font-bold text-[var(--forest)]"
                      />
                    </div>

                    <button 
                      onClick={handleAiPrice}
                      disabled={isAiSuggesting}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-50 to-[var(--mint)] border border-indigo-100 flex items-center justify-center gap-2 font-semibold text-indigo-700 hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      {isAiSuggesting ? (
                        <div className="flex gap-1 items-center animate-pulse"><Sparkles size={18}/> Analyzing market data...</div>
                      ) : (
                        <><Sparkles size={18} /> AI Suggest Fair Price</>
                      )}
                    </button>

                    <AnimatePresence>
                      {suggestedPrice && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-[var(--foam)] rounded-xl p-4 flex items-start gap-3"
                        >
                          <CheckCircle2 className="text-[var(--emerald)] mt-0.5 shrink-0" size={20} />
                          <div>
                            <div className="font-semibold text-[var(--forest)]">Suggested: ৳13,000 – ৳14,500</div>
                            <p className="text-sm text-[var(--slate)] mt-1">Based on similar 2-bedroom flats in this exact neighborhood.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="pt-6 border-t border-[var(--foam)]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="heading text-[var(--forest)]">Description</h3>
                        <button onClick={handleAiDesc} className="text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:underline">
                          <Sparkles size={14}/> Generate AI Description
                        </button>
                      </div>
                      <textarea 
                        rows={5}
                        value={generatedDesc}
                        onChange={(e) => setGeneratedDesc(e.target.value)}
                        placeholder="Describe your property..."
                        className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)]"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-[var(--foam)] flex justify-between">
              {currentStep > 0 ? (
                <button onClick={() => setCurrentStep(c => c - 1)} className="font-semibold text-[var(--slate)] hover:text-[var(--forest)] px-6 py-3">
                  Back
                </button>
              ) : <div/>}
              
              {currentStep < STEPS.length - 1 ? (
                <GreenButton onClick={handleNext} className="rounded-xl px-8">
                  Continue <ArrowRight size={18} />
                </GreenButton>
              ) : (
                <GreenButton className="rounded-xl px-10 bg-gradient-to-r from-[var(--emerald)] to-[var(--jade)]">
                  Publish Listing <Check size={18} />
                </GreenButton>
              )}
            </div>
          </div>

          {/* RIGHT: LIVE PREVIEW (40%) */}
          <div className="hidden lg:block lg:w-[40%]">
            <div className="sticky top-24">
              <h3 className="overline mb-4">Live Preview</h3>
              <div className="relative group">
                <PropertyCard 
                  id="preview"
                  title={formData.title || "Your Property Title"}
                  location={formData.area || "Neighborhood, City"}
                  price={formData.price}
                  beds={formData.beds}
                  baths={formData.baths}
                  floor={formData.floor}
                  imageUrl="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop"
                  aiScore={100}
                />
                <div className="absolute inset-0 pointer-events-none border-4 border-white/20 rounded-[16px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80 font-bold text-4xl -rotate-12 opacity-50 pointer-events-none select-none tracking-widest uppercase shadow-black drop-shadow-lg">
                  Preview
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
