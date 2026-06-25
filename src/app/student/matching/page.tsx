"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import { UNIVERSITIES } from "@/lib/utils";
import { saveFlatmateProfile } from "@/app/student/flatmate-actions";
import { Users, Sparkles, Loader2 } from "lucide-react";
import type { FlatmateProfile } from "@/types";

type Draft = Partial<FlatmateProfile>;

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "10px 18px", borderRadius: "999px",
      border: `2px solid ${selected ? "var(--primary)" : "var(--border)"}`,
      background: selected ? "var(--primary)" : "var(--surface)",
      color: selected ? "#fff" : "var(--text-main)",
      cursor: "pointer", fontSize: "0.9rem", fontWeight: selected ? 600 : 400,
      transition: "all 0.15s ease",
    }}>{label}</button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <label style={{ display: "block", fontWeight: 700, fontSize: "1rem", marginBottom: "0.35rem", color: "var(--text-main)" }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>{hint}</p>}
      {children}
    </div>
  );
}

export default function MatchingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft>({ id: "me", name: "", preferred_areas: [] });

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((p) => ({ ...p, [k]: v }));

  async function handleFind() {
    if (!draft.name?.trim()) { setError("Please enter your name."); return; }
    if (!draft.university) { setError("Please select your university."); return; }
    if (!draft.budget_max) { setError("Please enter your budget."); return; }
    if (!draft.sleep_schedule) { setError("Please select your sleep schedule."); return; }
    if (!draft.smoking) { setError("Please select your smoking preference."); return; }
    setError("");
    setLoading(true);
    try {
      const profile: FlatmateProfile = {
        id: "pending",
        name: draft.name!,
        university: draft.university!,
        university_priority: draft.university_priority ?? "commutable_both",
        budget_min: draft.budget_min ?? Math.round((draft.budget_max ?? 8000) * 0.6),
        budget_max: draft.budget_max!,
        preferred_areas: draft.preferred_areas ?? [],
        looking_for_count: 1,
        move_in: "flexible",
        gender_pref: "any",
        sleep_schedule: draft.sleep_schedule!,
        wake_up: "7_to_9",
        study_style: "light_bg_ok",
        work_from_home: "no",
        smoking: draft.smoking!,
        cooking: "flexible",
        kitchen_cleanliness: "reasonable",
        guests: "weekends_ok",
        cleanliness: draft.cleanliness ?? "reasonable",
        noise_level: "music_tv_ok",
        social_style: draft.social_style ?? "balanced",
        has_pet: false,
        pet_ok: true,
        self_description: draft.self_description ?? "",
        ideal_flatmate: "",
      };

      const saved = await saveFlatmateProfile(profile);
      if (saved.error) {
        setError(saved.error);
        return;
      }
      const savedProfile = saved.profile ?? profile;

      const res = await fetch("/api/ai/match-flatmates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: savedProfile }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const matches = data.matches ?? [];
      sessionStorage.setItem("flatmate_matches", JSON.stringify(matches));
      sessionStorage.setItem("my_profile", JSON.stringify(savedProfile));
      router.push("/student/matching/results");
    } catch (err) {
      setError("Matching failed — please check your API key or try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2.5rem 1rem 4rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "var(--primary-light)", color: "var(--primary)",
            borderRadius: "999px", padding: "6px 16px", fontSize: "0.85rem",
            fontWeight: 600, marginBottom: "1rem",
          }}>
            <Users size={14} /> AI Flatmate Matching
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
            Find Your Perfect Flatmate
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
            Answer 4 quick questions. Gemini AI finds your best matches.
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: "var(--surface)", borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)", padding: "2rem",
          boxShadow: "var(--shadow-sm)",
        }}>

          {/* Q1 — Name + University */}
          <Field label="1. Who are you?" hint="Tell us your name and university.">
            <input
              value={draft.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your name (e.g. Rahim Hossain)"
              style={{
                width: "100%", padding: "10px 14px", marginBottom: "12px",
                borderRadius: "var(--radius)", border: "1.5px solid var(--border)",
                fontSize: "0.95rem", background: "var(--bg)", color: "var(--text-main)",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {UNIVERSITIES.map((u) => (
                <Chip key={u.id} label={u.short_name}
                  selected={draft.university === u.id}
                  onClick={() => set("university", u.id)}
                />
              ))}
            </div>
          </Field>

          {/* Q2 — Budget */}
          <Field label="2. What's your monthly budget share?" hint="How much can you pay per month (your portion)?">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                { label: "৳3k–5k", min: 3000, max: 5000 },
                { label: "৳5k–8k", min: 5000, max: 8000 },
                { label: "৳8k–12k", min: 8000, max: 12000 },
                { label: "৳12k+", min: 12000, max: 20000 },
              ].map((b) => (
                <Chip key={b.label} label={b.label}
                  selected={draft.budget_max === b.max}
                  onClick={() => { set("budget_min", b.min); set("budget_max", b.max); }}
                />
              ))}
            </div>
          </Field>

          {/* Q3 — Sleep schedule */}
          <Field label="3. Are you an early bird or night owl?" hint="This matters a lot for day-to-day harmony.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <Chip label="🌅 Early bird (sleep before 11pm)" selected={draft.sleep_schedule === "early_bird"} onClick={() => set("sleep_schedule", "early_bird")} />
              <Chip label="🦉 Night owl (sleep after 1am)" selected={draft.sleep_schedule === "night_owl"} onClick={() => set("sleep_schedule", "night_owl")} />
              <Chip label="😌 Flexible" selected={draft.sleep_schedule === "flexible"} onClick={() => set("sleep_schedule", "flexible")} />
            </div>
          </Field>

          {/* Q4 — Smoking */}
          <Field label="4. Smoking preference?">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <Chip label="🚭 Non-smoker" selected={draft.smoking === "non_smoker"} onClick={() => set("smoking", "non_smoker")} />
              <Chip label="🚬 Smoker (outside only)" selected={draft.smoking === "smoker_outside"} onClick={() => set("smoking", "smoker_outside")} />
              <Chip label="😌 Don't mind" selected={draft.smoking === "dont_mind"} onClick={() => set("smoking", "dont_mind")} />
            </div>
          </Field>

          {/* Optional: describe yourself */}
          <Field label="✏️ Describe yourself in 2 words (optional)">
            <input
              value={draft.self_description ?? ""}
              onChange={(e) => set("self_description", e.target.value)}
              placeholder='e.g. "Chill & focused"'
              style={{
                width: "100%", padding: "10px 14px",
                borderRadius: "var(--radius)", border: "1.5px solid var(--border)",
                fontSize: "0.95rem", background: "var(--bg)", color: "var(--text-main)",
                boxSizing: "border-box",
              }}
            />
          </Field>

          {/* Error */}
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "var(--radius)", padding: "10px 14px", marginBottom: "1rem", color: "#B91C1C", fontSize: "0.875rem" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleFind}
            disabled={loading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "14px", borderRadius: "var(--radius)", border: "none",
              background: loading ? "var(--border)" : "var(--primary)",
              color: "#fff", cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700, fontSize: "1.05rem",
            }}
          >
            {loading
              ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Finding your matches…</>
              : <><Sparkles size={18} /> Find My Flatmates</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
