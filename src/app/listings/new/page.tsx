"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Home, DoorOpen, Check, UploadCloud, 
  Sparkles, Minus, Plus, CheckCircle2, ArrowRight, Loader2, X, AlertCircle
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { PropertyCard } from "@/components/cards/PropertyCard";
import { GreenButton } from "@/components/ui/GreenButton";
import { createClient } from "@/lib/supabase/client";
import { generateTrustScore } from "@/app/actions/ai-trust-score";

const STEPS = ["Basic", "Details", "Photos", "Pricing"];

type UploadedPhoto = {
  id: string;
  file: File;
  base64: string;
  mimeType: string;
  loading: boolean;
  score?: number;
  suggestion?: string;
  dismissedSuggestion?: boolean;
};

export default function ListPropertyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  
  // AI States
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<{min: number, max: number, median: number} | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [generatedDesc, setGeneratedDesc] = useState("");
  const [generatedListing, setGeneratedListing] = useState<{title_en: string, title_bn: string, description_en: string, description_bn: string} | null>(null);
  
  // Publish State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Photos State
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    type: "flat",
    address: "",
    area: "",
    beds: 2,
    baths: 2,
    floor: "4",
    furnishing: "semi",
    price: 12000,
    title: "New Property Listing"
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(curr => curr + 1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const id = Math.random().toString(36).substring(7);
      const mimeType = file.type;
      
      // Use Object URL for instant preview UI without waiting for base64 conversion
      const previewUrl = URL.createObjectURL(file);

      // Add to state immediately to show loading
      setUploadedPhotos((prev) => [
        ...prev,
        { id, file, base64: previewUrl, mimeType, loading: true }
      ]);

      // Client-side image resizing to prevent 413 Payload Too Large
      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 800;
        let { width, height } = img;

        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Get compressed base64 (converting to JPEG to save space)
        const resizedBase64 = canvas.toDataURL("image/jpeg", 0.7);

        fetch("/api/ai/photo-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: resizedBase64, mimeType: "image/jpeg" })
        })
        .then(res => res.json().then(data => ({ ok: res.ok, status: res.status, data })))
        .then(({ ok, status, data }) => {
          if (!ok || data.error) {
            console.error("Photo scoring failed (Status:", status, "):", data);
            setUploadedPhotos((prev) => prev.map(p => p.id === id ? { ...p, loading: false } : p));
            return;
          }
          if (data.skipped) {
            setUploadedPhotos((prev) => prev.map(p => p.id === id ? { ...p, loading: false } : p));
            return;
          }
          setUploadedPhotos((prev) => prev.map(p => 
            p.id === id ? { ...p, loading: false, score: data.score, suggestion: data.suggestion } : p
          ));
        })
        .catch(error => {
          console.error("Fetch error while scoring photo:", error);
          setUploadedPhotos((prev) => prev.map(p => p.id === id ? { ...p, loading: false } : p));
        });
      };
    });
  };

  const handleAiDesc = async () => {
    setIsGeneratingDesc(true);
    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area: formData.area,
          rent: formData.price.toString(),
          rooms: formData.beds.toString(),
          bathrooms: formData.baths.toString(),
          floor: formData.floor,
          furnishing: formData.furnishing,
          type: "student",
          utilities: false,
          notes: ""
        }),
      });
      const data = await res.json();
      if (data.listing) {
        setGeneratedListing(data.listing);
        setGeneratedDesc(data.listing.description_en + "\n\n" + data.listing.description_bn);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate description");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleAiPrice = async () => {
    setIsAiSuggesting(true);
    try {
      const res = await fetch("/api/ai/rent-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area: formData.area,
          rooms: formData.beds,
          furnishing: formData.furnishing
        })
      });
      const data = await res.json();
      if (data.median) {
        setSuggestedPrice(data);
        setFormData(prev => ({ ...prev, price: data.median }));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to suggest price");
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const defaultPhotos = ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop"];
      
      let photoHashes: string[] = [];
      try {
        const hashRes = await fetch("/api/utils/hash-photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: defaultPhotos })
        });
        if (hashRes.ok) {
          const hashData = await hashRes.json();
          photoHashes = hashData.hashes || [];
        }
      } catch (err) {
        console.error("Failed to hash photos before publish:", err);
      }

      const { data, error } = await supabase.from("listings").insert({
        landlord_id: user?.id ?? null,
        title_en: generatedListing?.title_en || formData.title,
        title_bn: generatedListing?.title_bn || formData.title,
        description_en: generatedListing?.description_en || generatedDesc.split("\n\n")[0] || "",
        description_bn: generatedListing?.description_bn || generatedDesc.split("\n\n")[1] || "",
        area: formData.area,
        address: formData.address,
        rent_bdt: formData.price,
        rooms: formData.beds,
        bathrooms: formData.baths,
        floor: parseInt(formData.floor) || null,
        type: "student",
        is_available: true,
        photos: defaultPhotos,
        photo_hashes: photoHashes
      }).select("id").single();

      if (error) {
        throw new Error(error.message);
      }

      if (data?.id) {
        generateTrustScore(data.id, "listing").catch(console.error);
        router.push(`/listings/${data.id}`);
      }
    } catch (e: any) {
      console.error(e);
      setPublishError(e.message);
    } finally {
      setIsPublishing(false);
    }
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
                          <option value="Uttara">Uttara</option>
                          <option value="Banani">Banani</option>
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

                    <div>
                      <h3 className="heading text-[var(--forest)] mb-4">Floor</h3>
                      <input 
                        type="text" 
                        value={formData.floor}
                        onChange={(e) => setFormData({...formData, floor: e.target.value})}
                        className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium"
                        placeholder="e.g. 4th Floor"
                      />
                    </div>

                    <div>
                      <h3 className="heading text-[var(--forest)] mb-4">Furnishing Status</h3>
                      <div className="flex gap-4">
                        {['Unfurnished', 'Semi-Furnished', 'Fully Furnished'].map(f => {
                          const id = f.toLowerCase().split('-')[0].split(' ')[0];
                          return (
                            <button
                              key={f}
                              onClick={() => setFormData({...formData, furnishing: id})}
                              className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                                formData.furnishing === id 
                                  ? "border-[var(--emerald)] bg-[var(--mint)] text-[var(--forest)]" 
                                  : "border-[var(--foam)] text-[var(--slate)] hover:border-[var(--emerald)] hover:bg-[var(--mist)]"
                              }`}
                            >
                              {f}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: PHOTOS */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <h2 className="display-lg text-[var(--forest)]">Upload property photos</h2>
                    <p className="body text-[var(--slate)] -mt-4">Good photos increase your trust score.</p>
                    
                    <label className="w-full h-64 border-2 border-dashed border-[var(--border-strong)] rounded-2xl bg-[var(--mist)] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[var(--foam)] hover:border-[var(--emerald)] transition-all group">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <UploadCloud size={32} className="text-[var(--emerald)]" />
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-[var(--forest)]">Click to upload</span> or drag and drop<br/>
                        <span className="text-sm text-[var(--stone)]">SVG, PNG, JPG or GIF (max. 800x400px)</span>
                      </div>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileUpload}
                      />
                    </label>

                    {uploadedPhotos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {uploadedPhotos.map((photo) => (
                          <div key={photo.id} className="relative flex flex-col gap-2">
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--mist)]">
                              <img src={photo.base64} alt="Preview" className="w-full h-full object-cover" />
                              
                              {/* AI Score Badge */}
                              <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                {photo.loading ? (
                                  <div className="bg-white/90 backdrop-blur text-[var(--forest)] text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                    <Loader2 size={12} className="animate-spin" /> Scoring
                                  </div>
                                ) : photo.score !== undefined ? (
                                  <div className={`text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 ${
                                    photo.score >= 70 ? "bg-green-500" :
                                    photo.score >= 40 ? "bg-amber-500" : "bg-red-500"
                                  }`}>
                                    <Sparkles size={12} /> {photo.score}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            
                            {/* Suggestion tip */}
                            {photo.score !== undefined && photo.score < 70 && !photo.dismissedSuggestion && photo.suggestion && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800 relative">
                                <button 
                                  onClick={() => setUploadedPhotos(prev => prev.map(p => p.id === photo.id ? {...p, dismissedSuggestion: true} : p))}
                                  className="absolute top-1 right-1 text-amber-600 hover:text-amber-900"
                                >
                                  <X size={12} />
                                </button>
                                <span className="font-semibold block mb-0.5">AI Tip:</span>
                                {photo.suggestion}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
                      disabled={isAiSuggesting || !formData.area}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-50 to-[var(--mint)] border border-indigo-100 flex items-center justify-center gap-2 font-semibold text-indigo-700 hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAiSuggesting ? (
                        <div className="flex gap-1 items-center"><Loader2 size={18} className="animate-spin"/> Analyzing market data...</div>
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
                            <div className="font-semibold text-[var(--forest)]">
                              Suggested: ৳{suggestedPrice.min.toLocaleString()} – ৳{suggestedPrice.max.toLocaleString()}
                            </div>
                            <p className="text-sm text-[var(--slate)] mt-1">Based on similar {formData.beds}-bedroom flats in this exact neighborhood.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="pt-6 border-t border-[var(--foam)]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="heading text-[var(--forest)]">Description</h3>
                        <button onClick={handleAiDesc} disabled={isGeneratingDesc || !formData.area} className="text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
                          {isGeneratingDesc ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14}/>} Generate AI Description
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

                    {publishError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        ❌ {publishError}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {currentStep === 2 && uploadedPhotos.some(p => p.score !== undefined && p.score < 40) && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-red-800">
                  <span className="font-semibold block mb-1">Low Quality Photos Detected</span>
                  Some photos may reduce your trust score. Consider replacing them.
                </div>
              </div>
            )}

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
                <GreenButton 
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="rounded-xl px-10 bg-gradient-to-r from-[var(--emerald)] to-[var(--jade)]"
                >
                  {isPublishing ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
                  {isPublishing ? "Publishing..." : "Publish Listing"}
                  {!isPublishing && <Check size={18} />}
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
                  title={generatedListing?.title_en || formData.title || "Your Property Title"}
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
