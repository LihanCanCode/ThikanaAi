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
        furnishing: "semi",
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
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      <div className="container" style={{ padding: "2rem 1.5rem", maxWidth: "700px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--primary)" }}>
          Post an Available Room
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.9rem" }}>
          Share a vacant room or seat in your flat with fellow students. Keep costs low, build a community!
        </p>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: "0", marginBottom: "2.5rem" }}>
          {["Room Details", "Flatmate Preferences", "Preview & Publish"].map((s, i) => (
            <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background:
                      step > i + 1
                        ? "var(--success)"
                        : step === i + 1
                        ? "var(--primary)"
                        : "var(--bg-muted)",
                    color: step >= i + 1 ? "#fff" : "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    transition: "all 0.3s",
                  }}
                >
                  {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: step === i + 1 ? "var(--primary)" : "var(--text-muted)",
                    marginTop: "4px",
                    fontWeight: step === i + 1 ? 600 : 400,
                    textAlign: "center",
                  }}
                >
                  {s}
                </span>
              </div>
              {i < 2 && (
                <div
                  style={{
                    flex: 0,
                    width: "40px",
                    height: 2,
                    background: step > i + 1 ? "var(--success)" : "var(--bg-muted)",
                    marginBottom: "18px",
                    transition: "all 0.3s",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Room Details */}
        {step === 1 && (
          <div className="card" style={{ padding: "1.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>
              🔑 Room & Seat Details
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Area *</label>
                  <select
                    className="input"
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
                  <label style={labelStyle}>Monthly Rent per Seat/Room (৳) *</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 4500"
                    value={form.rent}
                    onChange={(e) => set("rent", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Full Address</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Road No, House Name/No, Sector..."
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </div>

              {/* Location Picker */}
              <div
                style={{
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.25rem",
                  border: "1px solid var(--border)",
                }}
              >
                <label style={{ ...labelStyle, marginBottom: "8px" }}>
                  📍 Geo-Anchor Location
                </label>
                {form.lat !== 0 && form.lng !== 0 && (
                  <div
                    style={{
                      marginBottom: "10px",
                      padding: "6px 12px",
                      background: "var(--primary-xlight)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.8rem",
                      color: "var(--primary)",
                      fontWeight: 600,
                    }}
                  >
                    ✅ Pinned: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={geocodeAddress}
                    disabled={geocoding || (!form.address && !form.area)}
                    style={{ gap: "6px", fontSize: "0.82rem", background: "#fff" }}
                  >
                    {geocoding ? (
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <MapPin size={14} />
                    )}
                    Pin from Address
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={useCurrentLocation}
                    style={{ gap: "6px", fontSize: "0.82rem", background: "#fff" }}
                  >
                    <Navigation size={14} /> Use Current GPS
                  </button>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
                  This coordinates your room on our University-Distance Map view, showing walking path durations.
                </p>
              </div>

              {/* Student specific: Current Roommates and Seats Available */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Current Flatmates Living There *</label>
                  <select
                    className="input"
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
                  <label style={labelStyle}>Available Vacant Seats/Rooms *</label>
                  <select
                    className="input"
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
                <label style={labelStyle}>📸 Room Photos (Max 4)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: "2px dashed var(--border-strong)",
                    borderRadius: "var(--radius-md)",
                    padding: "1.5rem",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "var(--bg-surface)",
                    transition: "border-color 0.2s",
                  }}
                >
                  <Upload size={24} style={{ color: "var(--primary)", marginBottom: "8px" }} />
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                    Click to choose photos of the room/flat
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: "none" }}
                  />
                </div>
                {previews.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                    {previews.map((src, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img
                          src={src}
                          alt=""
                          style={{
                            width: 72,
                            height: 72,
                            objectFit: "cover",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border)",
                          }}
                        />
                        <button
                          onClick={() => removePhoto(i)}
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            background: "var(--danger)",
                            border: "none",
                            borderRadius: "50%",
                            width: 18,
                            height: 18,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <X size={10} color="#fff" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setStep(2)}
                disabled={!form.area || !form.rent}
                style={{ alignSelf: "flex-end", gap: "6px", marginTop: "1rem" }}
              >
                Next Step <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Flatmate Preferences */}
        {step === 2 && (
          <div className="card" style={{ padding: "1.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>
              👥 Flatmate Preferences
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Gender Preference</label>
                  <select
                    className="input"
                    value={form.gender_restriction}
                    onChange={(e) => set("gender_restriction", e.target.value)}
                  >
                    <option value="any">Any (Mixed flat)</option>
                    <option value="male">Males only 👦</option>
                    <option value="female">Females only 👧</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>University Restriction (Optional)</label>
                  <select
                    className="input"
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
                <label style={labelStyle}>Tell us about the flat & habits</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="e.g. Near campus gate, cooking mess facility available, study environment, quiet hours, non-smokers preferred..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div
                style={{
                  background: "var(--primary-xlight)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1.25rem",
                  border: "1px solid var(--primary-light)",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <Sparkles size={20} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--primary)", marginBottom: "4px" }}>
                    Bilingual AI Listing Generator
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Our AI will translate and format your listing into a highly polished, bilingual description (English & বাংলা) in one click.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                <button className="btn btn-outline" onClick={() => setStep(1)} style={{ background: "#fff" }}>
                  ← Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={generateBilingualDetails}
                  disabled={generating}
                  style={{ flex: 1, justifyContent: "center", gap: "8px" }}
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Generate Bilingual Listing
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Publish */}
        {step === 3 && generated && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div
              style={{
                background: "var(--success)",
                color: "#fff",
                borderRadius: "var(--radius-lg)",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <CheckCircle size={20} />
              <div>
                <div style={{ fontWeight: 700 }}>AI Copywriting generated!</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                  Review, edit, and publish your room share listing.
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--primary)" }}>
                🇬🇧 English Copy
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>Title (English)</label>
                  <input
                    className="input"
                    value={generated.title_en}
                    onChange={(e) => setGenerated({ ...generated, title_en: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Description (English)</label>
                  <textarea
                    className="input"
                    rows={4}
                    value={generated.description_en}
                    onChange={(e) => setGenerated({ ...generated, description_en: e.target.value })}
                    style={{ resize: "vertical" }}
                  />
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent-hover)" }}>
                🇧🇩 বাংলা সংস্করণ (Bengali Copy)
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>শিরোনাম (বাংলা)</label>
                  <input
                    className="input bangla"
                    value={generated.title_bn}
                    onChange={(e) => setGenerated({ ...generated, title_bn: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>বিবরণ (বাংলা)</label>
                  <textarea
                    className="input bangla"
                    rows={4}
                    value={generated.description_bn}
                    onChange={(e) => setGenerated({ ...generated, description_bn: e.target.value })}
                    style={{ resize: "vertical" }}
                  />
                </div>
              </div>
            </div>

            {publishError && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fca5a5",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem 1rem",
                  color: "#dc2626",
                  fontSize: "0.85rem",
                }}
              >
                ❌ Publish failed: {publishError}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="btn btn-outline"
                onClick={() => setStep(2)}
                style={{ background: "#fff" }}
              >
                ← Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePublish}
                disabled={publishing}
                style={{ flex: 1, justifyContent: "center" }}
              >
                {publishing ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite", marginRight: "6px" }} />
                    Publishing Room Share...
                  </>
                ) : (
                  "🚀 Publish Room Share"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
