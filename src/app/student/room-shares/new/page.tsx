"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import { Sparkles, Loader2, CheckCircle, ChevronRight, MapPin, Upload, X, Navigation, Info } from "lucide-react";
import { DHAKA_AREAS, UNIVERSITIES } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { saveRoomShare } from "@/app/student/room-share-actions";

interface GeneratedListing {
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
}

const labelStyle: any = {
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  display: "block",
  marginBottom: "6px",
};

export default function NewRoomSharePage() {
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
    area: "",
    address: "",
    rent: "",
    current_roommates: "2",
    available_seats: "1",
    gender_restriction: "any",
    university_restriction: "",
    notes: "",
    lat: 0,
    lng: 0,
  });

  const set = (k: string, v: string | boolean | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  // Geocode address using Mapbox
  const geocodeAddress = async () => {
    if (!form.address && !form.area) return;
    const query = `${form.address}, ${form.area}, Dhaka, Bangladesh`;
    setGeocoding(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${token}&limit=1&country=BD`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        set("lat", lat);
        set("lng", lng);
        alert(
          `📍 Location pinned!\nLat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}\n\nThis will show walking times to campus gates.`
        );
      } else {
        alert("Could not find the location. Try adding road/house details.");
      }
    } catch {
      alert("Geocoding failed. Check connection.");
    } finally {
      setGeocoding(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation)
      return alert("Geolocation is not supported by this browser.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("lat", pos.coords.latitude);
        set("lng", pos.coords.longitude);
        alert(
          `📡 GPS captured!\nLat: ${pos.coords.latitude.toFixed(
            5
          )}, Lng: ${pos.coords.longitude.toFixed(5)}`
        );
      },
      () => alert("Please allow GPS location access in your browser.")
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).slice(0, 4); // max 4 photos for rooms
    setPhotos(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) {
      return ["https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800"]; // clean cozy room fallback
    }
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of photos) {
      const ext = file.name.split(".").pop();
      const path = `room-shares/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("listing-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw new Error(`Photo upload failed: ${error.message}`);
      const { data: pub } = supabase.storage
        .from("listing-photos")
        .getPublicUrl(path);
      if (pub?.publicUrl) urls.push(pub.publicUrl);
    }
    return urls;
  };

  // AI Bilingual generation
  const generateBilingualDetails = async () => {
    setGenerating(true);
    try {
      // Prompt Gemini using our existing AI route
      // We pass simulated landlord inputs, adapting them for roommate style
      const dummyFormForAPI = {
        area: form.area,
        rent: form.rent,
        rooms: "1",
        bathrooms: "1",
        floor: "3",

        type: "student",
        utilities: false,
        notes: `Available room share in student flat. Currently ${form.current_roommates} flatmates living here. Renting out ${form.available_seats} seat/room. Gender: ${form.gender_restriction}. University pref: ${form.university_restriction || "any"}. Notes: ${form.notes}`,
      };

      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dummyFormForAPI),
      });
      const data = await res.json();
      if (data.listing) {
        setGenerated(data.listing);
        setStep(3);
      } else {
        throw new Error("Failed");
      }
    } catch {
      alert("AI generator failed. Proceeding with manual input.");
      // Fallback: populate manual entries if API fails
      setGenerated({
        title_en: `${form.available_seats} Bed/Room available in ${form.area} for Students`,
        title_bn: `${form.area}-এ ছাত্রদের জন্য ${form.available_seats} টি রুম/সিট খালি আছে`,
        description_en: `An affordable shared room opportunity in a student flat located in ${form.area}. Currently ${form.current_roommates} students are living here. It is ideal for students looking for a friendly, study-friendly environment near campus. Notes: ${form.notes}`,
        description_bn: `${form.area}-এ একটি চমৎকার এবং সাশ্রয়ী সিট/রুম ভাড়া দেওয়া হবে। বর্তমানে এখানে ${form.current_roommates} জন ছাত্র থাকছেন। পড়াশোনার জন্য নিরিবিলি ও বন্ধুত্বপূর্ণ পরিবেশ। বিস্তারিত: ${form.notes}`,
      });
      setStep(3);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generated) return;
    setPublishing(true);
    setPublishError(null);

    try {
      const photoUrls = await uploadPhotos();

      // Resolve coordinates fallback
      let lat = form.lat;
      let lng = form.lng;
      if (!lat || !lng) {
        const areaCoords: Record<string, { lat: number; lng: number }> = {
          "Mirpur-11": { lat: 23.8267, lng: 90.3667 },
          "Mirpur-2": { lat: 23.8042, lng: 90.3608 },
          "Dhanmondi": { lat: 23.7461, lng: 90.3742 },
          "Uttara": { lat: 23.8759, lng: 90.3795 },
          "Bashundhara R/A": { lat: 23.8157, lng: 90.4292 },
          "Mohammadpur": { lat: 23.7631, lng: 90.3589 },
          "Banani": { lat: 23.7937, lng: 90.4016 },
          "Gulshan-2": { lat: 23.7945, lng: 90.4145 },
          "Mirpur-10": { lat: 23.8082, lng: 90.3672 },
        };
        const c = areaCoords[form.area] || { lat: 23.8103, lng: 90.4125 };
        lat = c.lat;
        lng = c.lng;
      }

      const result = await saveRoomShare({
        title_en: generated.title_en,
        title_bn: generated.title_bn,
        description_en: generated.description_en,
        description_bn: generated.description_bn,
        area: form.area,
        address: form.address || `${form.area}, Dhaka`,
        lat,
        lng,
        rent_bdt: parseInt(form.rent),
        current_roommates: parseInt(form.current_roommates),
        available_seats: parseInt(form.available_seats),
        gender_restriction: form.gender_restriction as "male" | "female" | "any",
        university_restriction: form.university_restriction || undefined,
        photos: photoUrls,
        is_available: true,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      router.push("/student/feed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setPublishError(msg);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--mist)] flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-6 py-12 max-w-3xl">
        <h1 className="text-3xl font-['Playfair_Display'] font-bold text-[var(--forest)] mb-2">
          Post an Available Room
        </h1>
        <p className="text-[var(--slate)] mb-10">
          Share a vacant room or seat in your flat with fellow students. Keep costs low, build a community!
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-12">
          {["Room Details", "Flatmate Preferences", "Preview & Publish"].map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm ${
                    step > i + 1
                      ? "bg-[var(--fern)] text-white"
                      : step === i + 1
                      ? "bg-[var(--emerald)] text-white shadow-md scale-110"
                      : "bg-white text-[var(--stone)] border border-[var(--foam)]"
                  }`}
                >
                  {step > i + 1 ? <CheckCircle size={18} /> : i + 1}
                </div>
                <span
                  className={`text-xs mt-3 text-center ${
                    step === i + 1 ? "text-[var(--forest)] font-bold" : "text-[var(--stone)] font-medium"
                  }`}
                >
                  {s}
                </span>
              </div>
              {i < 2 && (
                <div
                  className={`flex-none w-12 h-1 rounded-full mb-6 transition-all duration-300 ${
                    step > i + 1 ? "bg-[var(--fern)]" : "bg-[var(--foam)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Room Details */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-[var(--foam)] shadow-[var(--shadow-sm)] p-8">
            <h2 className="heading text-[var(--forest)] mb-6 flex items-center gap-2">
              <span className="text-xl">🔑</span> Room & Seat Details
            </h2>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Area *</label>
                  <select
                    className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium appearance-none"
                    value={form.area}
                    onChange={(e) => set("area", e.target.value)}
                  >
                    <option value="">Select area</option>
                    {DHAKA_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Monthly Rent per Seat/Room (৳) *</label>
                  <input
                    type="number"
                    className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium"
                    placeholder="e.g. 4500"
                    value={form.rent}
                    onChange={(e) => set("rent", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Full Address</label>
                <input
                  type="text"
                  className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium"
                  placeholder="Road No, House Name/No, Sector..."
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </div>

              {/* Location Picker */}
              <div className="bg-[var(--mist)] rounded-xl p-6 border border-[var(--emerald)]/20">
                <label className="text-sm font-semibold text-[var(--slate)] mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <MapPin size={16} className="text-[var(--emerald)]" /> Geo-Anchor Location
                </label>
                {form.lat !== 0 && form.lng !== 0 && (
                  <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--mint)] text-[var(--forest)] rounded-lg text-xs font-bold border border-[var(--emerald)]/30">
                    <CheckCircle size={14} />
                    Pinned: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="bg-white border border-[var(--foam)] text-[var(--forest)] px-4 py-2 rounded-lg text-sm font-semibold hover:border-[var(--emerald)] hover:text-[var(--emerald)] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                    onClick={geocodeAddress}
                    disabled={geocoding || (!form.address && !form.area)}
                  >
                    {geocoding ? (
                      <Loader2 size={16} className="animate-spin text-[var(--emerald)]" />
                    ) : (
                      <MapPin size={16} />
                    )}
                    Pin from Address
                  </button>
                  <button
                    type="button"
                    className="bg-[var(--primary-light)] text-[var(--forest)] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--mint)] transition-colors flex items-center gap-2 shadow-sm"
                    onClick={useCurrentLocation}
                  >
                    <Navigation size={16} /> Use Current GPS
                  </button>
                </div>
                <p className="text-xs text-[var(--stone)] mt-3">
                  This coordinates your room on our University-Distance Map view, showing walking path durations.
                </p>
              </div>

              {/* Student specific: Current Roommates and Seats Available */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Current Flatmates Living There *</label>
                  <select
                    className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium appearance-none"
                    value={form.current_roommates}
                    onChange={(e) => set("current_roommates", e.target.value)}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "student" : "students"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Available Vacant Seats/Rooms *</label>
                  <select
                    className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium appearance-none"
                    value={form.available_seats}
                    onChange={(e) => set("available_seats", e.target.value)}
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "seat/room" : "seats/rooms"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">📸 Room Photos (Max 4)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-[var(--emerald)]/40 hover:border-[var(--emerald)] bg-[var(--mist)] rounded-2xl p-8 text-center cursor-pointer transition-colors"
                >
                  <Upload size={28} className="mx-auto text-[var(--emerald)] mb-3" />
                  <p className="text-sm font-medium text-[var(--forest)]">
                    Click to choose photos of the room/flat
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                {previews.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-4">
                    {previews.map((src, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={src}
                          alt=""
                          className="w-20 h-20 object-cover rounded-xl border-2 border-[var(--foam)] shadow-sm"
                        />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  className="bg-[var(--forest)] text-white hover:bg-[var(--jade)] px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                  onClick={() => setStep(2)}
                  disabled={!form.area || !form.rent}
                >
                  Next Step <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Flatmate Preferences */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-[var(--foam)] shadow-[var(--shadow-sm)] p-8">
            <h2 className="heading text-[var(--forest)] mb-6 flex items-center gap-2">
              <span className="text-xl">👥</span> Flatmate Preferences
            </h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Gender Preference</label>
                  <select
                    className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium appearance-none"
                    value={form.gender_restriction}
                    onChange={(e) => set("gender_restriction", e.target.value)}
                  >
                    <option value="any">Any (Mixed flat)</option>
                    <option value="male">Males only 👦</option>
                    <option value="female">Females only 👧</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">University Restriction (Optional)</label>
                  <select
                    className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium appearance-none"
                    value={form.university_restriction}
                    onChange={(e) => set("university_restriction", e.target.value)}
                  >
                    <option value="">No restriction (Open to all)</option>
                    {UNIVERSITIES.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.short_name} students preferred
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Tell us about the flat & habits</label>
                <textarea
                  className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium"
                  rows={4}
                  placeholder="e.g. Near campus gate, cooking mess facility available, study environment, quiet hours, non-smokers preferred..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>

              <div className="bg-[var(--mint)]/30 rounded-xl p-5 border border-[var(--emerald)]/20 flex gap-3 items-start">
                <Sparkles size={24} className="text-[var(--emerald)] shrink-0" />
                <div>
                  <h3 className="font-bold text-[var(--forest)] mb-1">
                    Bilingual AI Listing Generator
                  </h3>
                  <p className="text-sm text-[var(--slate)] leading-relaxed">
                    Our AI will translate and format your listing into a highly polished, bilingual description (English & বাংলা) in one click.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  className="bg-white border-2 border-[var(--foam)] text-[var(--forest)] px-6 py-3 rounded-xl font-bold hover:bg-[var(--mist)] transition-colors"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button
                  className="flex-1 bg-[var(--forest)] text-white hover:bg-[var(--jade)] px-6 py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                  onClick={generateBilingualDetails}
                  disabled={generating}
                >
                  {generating ? (
                    <><Loader2 size={18} className="animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles size={18} /> Generate Bilingual Listing</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Publish */}
        {step === 3 && generated && (
          <div className="space-y-6">
            <div className="bg-[var(--fern)] text-white rounded-2xl p-5 flex items-center gap-4 shadow-md">
              <CheckCircle size={24} className="shrink-0" />
              <div>
                <div className="font-bold text-lg">AI Copywriting generated!</div>
                <div className="text-sm opacity-90 mt-1">
                  Review, edit, and publish your room share listing.
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[var(--foam)] shadow-[var(--shadow-sm)] p-8">
              <h2 className="heading text-[var(--forest)] mb-6 flex items-center gap-2">
                <span className="text-xl">🇬🇧</span> English Copy
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Title (English)</label>
                  <input
                    className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium"
                    value={generated.title_en}
                    onChange={(e) => setGenerated({ ...generated, title_en: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">Description (English)</label>
                  <textarea
                    className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium min-h-[120px]"
                    rows={4}
                    value={generated.description_en}
                    onChange={(e) => setGenerated({ ...generated, description_en: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[var(--foam)] shadow-[var(--shadow-sm)] p-8">
              <h2 className="heading text-[var(--forest)] mb-6 flex items-center gap-2">
                <span className="text-xl">🇧🇩</span> বাংলা সংস্করণ (Bengali Copy)
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">শিরোনাম (বাংলা)</label>
                  <input
                    className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium bangla text-lg"
                    value={generated.title_bn}
                    onChange={(e) => setGenerated({ ...generated, title_bn: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[var(--slate)] mb-2 block uppercase tracking-wider">বিবরণ (বাংলা)</label>
                  <textarea
                    className="w-full p-4 bg-[var(--mist)] border-2 border-transparent rounded-xl focus:border-[var(--emerald)] outline-none transition-colors text-[var(--forest)] font-medium bangla text-lg min-h-[120px]"
                    rows={4}
                    value={generated.description_bn}
                    onChange={(e) => setGenerated({ ...generated, description_bn: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {publishError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
                ❌ Publish failed: {publishError}
              </div>
            )}

            <div className="pt-4 flex gap-4">
              <button
                className="bg-white border-2 border-[var(--foam)] text-[var(--forest)] px-6 py-3 rounded-xl font-bold hover:bg-[var(--mist)] transition-colors"
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <button
                className="flex-1 bg-[var(--forest)] text-white hover:bg-[var(--jade)] px-6 py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                onClick={handlePublish}
                disabled={publishing}
              >
                {publishing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Publishing Room Share...
                  </>
                ) : (
                  <>🚀 Publish Room Share</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
