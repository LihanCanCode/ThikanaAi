"use client";

import { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import { Sparkles, Loader2, CheckCircle, ChevronRight } from "lucide-react";
import { DHAKA_AREAS } from "@/lib/utils";

interface GeneratedListing {
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
}

export default function NewListingPage() {
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedListing | null>(null);
  const [form, setForm] = useState({
    area: "", address: "", rent: "", rooms: "1", bathrooms: "1",
    floor: "", furnishing: "unfurnished", type: "student",
    for_gender: "any", utilities: false, notes: "",
  });

  const set = (k: string, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

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
      alert("AI generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      <div className="container" style={{ padding: "2rem 1.5rem", maxWidth: "700px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>List Your Property</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.9rem" }}>
          Fill in the details and let our AI write the perfect bilingual listing for you.
        </p>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: "0", marginBottom: "2rem" }}>
          {["Property Details", "Preferences", "AI Review & Publish"].map((s, i) => (
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

        {/* Step 1: Property details */}
        {step === 1 && (
          <div className="card" style={{ padding: "1.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem" }}>📍 Property Details</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Bedrooms *</label>
                  <select className="input" value={form.rooms} onChange={e => set("rooms", e.target.value)}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Bathrooms *</label>
                  <select className="input" value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)}>
                    {[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Floor</label>
                  <input type="number" className="input" placeholder="e.g. 3" value={form.floor} onChange={e => set("floor", e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Furnishing</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {[["unfurnished","🪑 Bare"], ["semi","🛋️ Semi"], ["fully","🏡 Fully Furnished"]].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => set("furnishing", v)} style={{
                      padding: "0.6rem", borderRadius: "var(--radius-md)",
                      border: `2px solid ${form.furnishing === v ? "var(--primary)" : "var(--border)"}`,
                      background: form.furnishing === v ? "var(--primary-xlight)" : "var(--bg-surface)",
                      color: form.furnishing === v ? "var(--primary)" : "var(--text-secondary)",
                      cursor: "pointer", fontWeight: 600, fontSize: "0.78rem", fontFamily: "inherit",
                    }}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.utilities} onChange={e => set("utilities", e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "var(--primary)" }} />
                  Utilities (gas, water, electricity) included in rent
                </label>
              </div>
              <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!form.area || !form.rent}
                style={{ alignSelf: "flex-end", gap: "6px" }}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preferences + Notes */}
        {step === 2 && (
          <div className="card" style={{ padding: "1.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem" }}>🏷️ Preferences & Notes</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Property type</label>
                  <select className="input" value={form.type} onChange={e => set("type", e.target.value)}>
                    <option value="student">🎓 Student</option>
                    <option value="family">👨‍👩‍👧 Family</option>
                    <option value="professional">💼 Professional</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Preferred gender</label>
                  <select className="input" value={form.for_gender} onChange={e => set("for_gender", e.target.value)}>
                    <option value="any">Any</option>
                    <option value="male">Male only</option>
                    <option value="female">Female only</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Additional notes (for AI)</label>
                <textarea className="input" rows={4} placeholder="E.g. Rooftop access, parking available, near bus stop, quiet neighborhood, no smokers..."
                  value={form.notes} onChange={e => set("notes", e.target.value)}
                  style={{ resize: "vertical" }} />
              </div>

              {/* AI generate button */}
              <div style={{ background: "var(--primary-xlight)", borderRadius: "var(--radius-lg)", padding: "1.25rem", border: "1px solid var(--primary-light)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <Sparkles size={20} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--primary)", marginBottom: "4px" }}>AI Listing Generator</h3>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      Click below and our AI will write a professional bilingual listing (English + বাংলা) from your details in seconds.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" onClick={generateListing} disabled={generating}
                  style={{ flex: 1, justifyContent: "center", gap: "8px" }}>
                  {generating ? (
                    <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating with AI...</>
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
                <div style={{ fontWeight: 700 }}>AI listing generated successfully!</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>Review and publish your bilingual listing below.</div>
              </div>
            </div>

            <div className="card" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>English Version</h2>
              <div>
                <label style={labelStyle}>Title (English)</label>
                <input className="input" value={generated.title_en} onChange={e => setGenerated({ ...generated, title_en: e.target.value })} style={{ marginBottom: "10px" }} />
                <label style={labelStyle}>Description (English)</label>
                <textarea className="input" rows={4} value={generated.description_en} onChange={e => setGenerated({ ...generated, description_en: e.target.value })} style={{ resize: "vertical" }} />
              </div>
            </div>

            <div className="card" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>বাংলা সংস্করণ</h2>
              <div>
                <label style={labelStyle}>শিরোনাম (বাংলা)</label>
                <input className="input bangla" value={generated.title_bn} onChange={e => setGenerated({ ...generated, title_bn: e.target.value })} style={{ marginBottom: "10px" }} />
                <label style={labelStyle}>বিবরণ (বাংলা)</label>
                <textarea className="input bangla" rows={4} value={generated.description_bn} onChange={e => setGenerated({ ...generated, description_bn: e.target.value })} style={{ resize: "vertical" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>← Re-generate</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                🚀 Publish Listing
              </button>
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.82rem", fontWeight: 600,
  color: "var(--text-secondary)", display: "block", marginBottom: "5px",
};
