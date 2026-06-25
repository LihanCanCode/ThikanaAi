"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import { Sparkles, Loader2, CheckCircle, ChevronRight, MapPin, Upload, X, Navigation } from "lucide-react";
import { DHAKA_AREAS } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface GeneratedListing {
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.82rem", fontWeight: 600,
  color: "var(--text-secondary)", display: "block", marginBottom: "5px",
};

export default function NewListingPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [generated, setGenerated] = useState<GeneratedListing | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [form, setForm] = useState({
    area: "", address: "", rent: "", rooms: "1", bathrooms: "1",
    floor: "", type: "student",
    for_gender: "any", utilities: false, notes: "",
    lat: 0, lng: 0,
  });

  const set = (k: string, v: string | boolean | number) => setForm(prev => ({ ...prev, [k]: v }));

  // Geocode address to coordinates using Mapbox
  const geocodeAddress = async () => {
    if (!form.address && !form.area) return;
    const query = `${form.address}, ${form.area}, Dhaka, Bangladesh`;
    setGeocoding(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1&country=BD`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        set("lat", lat);
        set("lng", lng);
        alert(`📍 Location found!\nLat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}\n\nThis will be used for the map view.`);
      } else {
        alert("Could not find the location. Try a more specific address.");
      }
    } catch {
      alert("Geocoding failed. Check your internet connection.");
    } finally {
      setGeocoding(false);
    }
  };

  // Use browser GPS
  const useCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation is not supported by this browser.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("lat", pos.coords.latitude);
        set("lng", pos.coords.longitude);
        alert(`📡 GPS location captured!\nLat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`);
      },
      () => alert("Could not get your location. Please allow location access.")
    );
  };

  // Handle photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).slice(0, 5); // max 5 photos
    setPhotos(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // Upload photos to Supabase Storage
  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) {
      return ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"];
    }
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of photos) {
      const ext = file.name.split(".").pop();
      const path = `demo/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("listing-photos").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw new Error(`Photo upload failed: ${error.message}`);
      const { data: pub } = supabase.storage.from("listing-photos").getPublicUrl(path);
      if (pub?.publicUrl) urls.push(pub.publicUrl);
    }
    return urls;
  };

  const generateListing = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
      const data = await res.json();
      if (data.listing) {
        setGenerated(data.listing);
        setStep(3);
      }
    } catch {
      alert("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generated) return;
    setPublishing(true);
    setPublishError(null);

    try {
      // 1. Upload photos
      const photoUrls = await uploadPhotos();

      // 2. Resolve lat/lng fallback if not geocoded
      let lat = form.lat;
      let lng = form.lng;
      if (!lat || !lng) {
        const areaCoords: Record<string, { lat: number; lng: number }> = {
          "Mirpur-11": { lat: 23.8267, lng: 90.3667 },
          "Dhanmondi": { lat: 23.7461, lng: 90.3742 },
          "Uttara": { lat: 23.8759, lng: 90.3795 },
          "Bashundhara R/A": { lat: 23.8157, lng: 90.4292 },
          "Mohammadpur": { lat: 23.7631, lng: 90.3589 },
          "Banani": { lat: 23.7937, lng: 90.4016 },
          "Gulshan-2": { lat: 23.7945, lng: 90.4145 },
          "Mirpur-10": { lat: 23.8082, lng: 90.3672 },
          "Rayer Bazar": { lat: 23.7593, lng: 90.3612 },
        };
        const c = areaCoords[form.area] || { lat: 23.8103, lng: 90.4125 };
        lat = c.lat;
        lng = c.lng;
      }

      // 3. Insert into Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("listings").insert({
        landlord_id: user?.id ?? null,
        title_en: generated.title_en,
        title_bn: generated.title_bn,
        description_en: generated.description_en,
        description_bn: generated.description_bn,
        area: form.area,
        address: form.address || `${form.area}, Dhaka`,
        lat,
        lng,
        rent_bdt: parseInt(form.rent),
        rooms: parseInt(form.rooms),
        bathrooms: parseInt(form.bathrooms),
        floor: form.floor ? parseInt(form.floor) : null,
        type: form.type,
        for_gender: form.for_gender,
        utilities_included: form.utilities,
        photos: photoUrls,
        is_available: true,
        trust_score: 85,
      });

      if (error) throw new Error(error.message);

      // 4. Redirect
      if (form.type === "family" || form.type === "professional") {
        router.push("/listings/family");
      } else {
        router.push("/listings");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setPublishError(msg);
      console.error("Publish failed:", err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      <div className="container" style={{ padding: "2rem 1.5rem", maxWidth: "700px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>List Your Property</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.9rem" }}>
          Fill in the details and let us write the perfect bilingual listing for you.
        </p>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: "0", marginBottom: "2rem" }}>
          {["Property Details", "Preferences", "Review & Publish"].map((s, i) => (
            <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: step > i + 1 ? "var(--success)" : step === i + 1 ? "var(--primary)" : "var(--bg-muted)",
                  color: step >= i + 1 ? "#fff" : "var(--text-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.85rem", transition: "all 0.3s",
                }}>
                  {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span style={{ fontSize: "0.7rem", color: step === i + 1 ? "var(--primary)" : "var(--text-muted)", marginTop: "4px", fontWeight: step === i + 1 ? 600 : 400, textAlign: "center" }}>{s}</span>
              </div>
              {i < 2 && <div style={{ flex: 0, width: "40px", height: 2, background: step > i + 1 ? "var(--success)" : "var(--bg-muted)", marginBottom: "18px", transition: "all 0.3s" }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Property Details */}
        {step === 1 && (
          <div className="card" style={{ padding: "1.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem" }}>📍 Property Details</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Listing Type — Most important selector */}
              <div>
                <label style={{ ...labelStyle, fontSize: "0.9rem", marginBottom: "10px" }}>🏠 This listing is for *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    { value: "student", emoji: "🎓", title: "Students", desc: "Near universities, affordable rent" },
                    { value: "family", emoji: "👨‍👩‍👧", title: "Families", desc: "Spacious, premium accommodation" },
                  ].map(({ value, emoji, title, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set("type", value)}
                      style={{
                        padding: "1rem", borderRadius: "var(--radius-lg)", textAlign: "left",
                        border: `2px solid ${form.type === value ? "var(--primary)" : "var(--border)"}`,
                        background: form.type === value ? "var(--primary-xlight)" : "var(--bg-surface)",
                        cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>{emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: form.type === value ? "var(--primary)" : "var(--text-main)" }}>{title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Area *</label>
                  <select className="input" value={form.area} onChange={e => set("area", e.target.value)}>
                    <option value="">Select area</option>
                    {DHAKA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Monthly Rent (৳) *</label>
                  <input type="number" className="input" placeholder="e.g. 12000" value={form.rent} onChange={e => set("rent", e.target.value)} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Full Address</label>
                <input type="text" className="input" placeholder="House no, Road, Block..." value={form.address} onChange={e => set("address", e.target.value)} />
              </div>

              {/* Location Picker */}
              <div style={{ background: "var(--bg-muted)", borderRadius: "var(--radius-md)", padding: "1rem", border: "1px solid var(--border)" }}>
                <label style={{ ...labelStyle, marginBottom: "10px" }}>📍 Pin Location (for Map View)</label>
                {form.lat !== 0 && form.lng !== 0 && (
                  <div style={{ marginBottom: "8px", padding: "6px 10px", background: "var(--primary-xlight)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600 }}>
                    ✅ Location pinned: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-outline" onClick={geocodeAddress} disabled={geocoding || (!form.address && !form.area)} style={{ gap: "6px", fontSize: "0.82rem" }}>
                    {geocoding ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <MapPin size={14} />}
                    {geocoding ? "Finding..." : "Find from Address"}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={useCurrentLocation} style={{ gap: "6px", fontSize: "0.82rem" }}>
                    <Navigation size={14} /> Use My GPS
                  </button>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                  Needed to show walking distance to university on the listing detail page.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Bedrooms *</label>
                  <select className="input" value={form.rooms} onChange={e => set("rooms", e.target.value)}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Bathrooms *</label>
                  <select className="input" value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)}>
                    {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Floor</label>
                  <input type="number" className="input" placeholder="e.g. 3" value={form.floor} onChange={e => set("floor", e.target.value)} />
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label style={labelStyle}>📸 Property Photos (max 5)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: "2px dashed var(--border)", borderRadius: "var(--radius-md)",
                    padding: "1.25rem", textAlign: "center", cursor: "pointer",
                    background: "var(--bg-muted)", transition: "border-color 0.2s",
                  }}
                >
                  <Upload size={22} style={{ color: "var(--text-muted)", marginBottom: "6px" }} />
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                    Click to upload photos • JPG, PNG, WEBP
                  </p>
                  <input ref={fileRef} type="file" multiple accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
                </div>
                {previews.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                    {previews.map((src, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={src} alt="" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }} />
                        <button onClick={() => removePhoto(i)} style={{
                          position: "absolute", top: -6, right: -6,
                          background: "var(--danger, #ef4444)", border: "none", borderRadius: "50%",
                          width: 18, height: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                        }}>
                          <X size={10} color="#fff" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.utilities} onChange={e => set("utilities", e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "var(--primary)" }} />
                  Utilities (gas, water, electricity) included in rent
                </label>
              </div>

              <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!form.area || !form.rent} style={{ alignSelf: "flex-end", gap: "6px" }}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preferences + Notes */}
        {step === 2 && (
          <div className="card" style={{ padding: "1.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem" }}>🏷️ Preferences & Notes</h2>
            {/* Show selected type as a read-only badge */}
            <div style={{ marginBottom: "1rem", display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "var(--radius-full)", background: "var(--primary-xlight)", color: "var(--primary)", fontWeight: 700, fontSize: "0.82rem" }}>
              {form.type === "student" ? "🎓 Student Listing" : "👨‍👩‍👧 Family Listing"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Preferred gender</label>
                <select className="input" value={form.for_gender} onChange={e => set("for_gender", e.target.value)}>
                  <option value="any">Any</option>
                  <option value="male">Male only</option>
                  <option value="female">Female only</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Additional notes</label>
                <textarea className="input" rows={4} placeholder="E.g. Rooftop access, parking available, near bus stop, quiet neighborhood, no smokers..."
                  value={form.notes} onChange={e => set("notes", e.target.value)} style={{ resize: "vertical" }} />
              </div>

              <div style={{ background: "var(--primary-xlight)", borderRadius: "var(--radius-lg)", padding: "1.25rem", border: "1px solid var(--primary-light)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <Sparkles size={20} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--primary)", marginBottom: "4px" }}>Bilingual Listing Generator</h3>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      Click below and we will write a professional bilingual listing (English + বাংলা) from your details instantly.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" onClick={generateListing} disabled={generating} style={{ flex: 1, justifyContent: "center", gap: "8px" }}>
                  {generating ? (
                    <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                  ) : (
                    <><Sparkles size={16} /> Generate Bilingual Listing</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review + Publish */}
        {step === 3 && generated && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "var(--success)", color: "#fff", borderRadius: "var(--radius-lg)", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "10px" }}>
              <CheckCircle size={20} />
              <div>
                <div style={{ fontWeight: 700 }}>Listing generated successfully!</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>Review and publish your bilingual listing below.</div>
              </div>
            </div>

            <div className="card" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>English Version</h2>
              <label style={labelStyle}>Title (English)</label>
              <input className="input" value={generated.title_en} onChange={e => setGenerated({ ...generated, title_en: e.target.value })} style={{ marginBottom: "10px" }} />
              <label style={labelStyle}>Description (English)</label>
              <textarea className="input" rows={4} value={generated.description_en} onChange={e => setGenerated({ ...generated, description_en: e.target.value })} style={{ resize: "vertical" }} />
            </div>

            <div className="card" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>বাংলা সংস্করণ</h2>
              <label style={labelStyle}>শিরোনাম (বাংলা)</label>
              <input className="input bangla" value={generated.title_bn} onChange={e => setGenerated({ ...generated, title_bn: e.target.value })} style={{ marginBottom: "10px" }} />
              <label style={labelStyle}>বিবরণ (বাংলা)</label>
              <textarea className="input bangla" rows={4} value={generated.description_bn} onChange={e => setGenerated({ ...generated, description_bn: e.target.value })} style={{ resize: "vertical" }} />
            </div>

            {publishError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", color: "#dc2626", fontSize: "0.85rem" }}>
                ❌ Publish failed: {publishError}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>← Re-generate</button>
              <button className="btn btn-primary" onClick={handlePublish} disabled={publishing} style={{ flex: 1, justifyContent: "center" }}>
                {publishing ? (
                  <><Loader2 size={16} style={{ animation: "spin 1s linear infinite", marginRight: "6px" }} /> Publishing to Supabase...</>
                ) : (
                  "🚀 Publish Listing"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
