"use client";

import Link from "next/link";
import { useState } from "react";
import { Home } from "lucide-react";
import { UNIVERSITIES } from "@/lib/utils";

export default function SignupPage() {
  const [role, setRole] = useState<"student" | "landlord" | "professional">("student");

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #EDF7F0 0%, #F8FAF7 60%, #FEF9F0 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
    }}>
      <div style={{ width: "100%", maxWidth: "460px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none", justifyContent: "center" }}>
            <div style={{ width: 44, height: 44, background: "var(--primary)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={22} color="#fff" />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--primary)" }}>Thikana</span>
              <span className="bangla" style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)" }}>ঠিকানা</span>
            </div>
          </Link>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, textAlign: "center", marginBottom: "0.25rem" }}>Create your account</h1>
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Join thousands finding homes on Thikana</p>

          {/* Role selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "1.5rem" }}>
            {(["student", "landlord", "professional"] as const).map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                padding: "0.6rem 0.5rem", borderRadius: "var(--radius-md)",
                border: `2px solid ${role === r ? "var(--primary)" : "var(--border)"}`,
                cursor: "pointer", fontFamily: "inherit",
                background: role === r ? "var(--primary-xlight)" : "var(--bg-surface)",
                color: role === r ? "var(--primary)" : "var(--text-muted)",
                fontWeight: 600, fontSize: "0.75rem", transition: "all 0.2s",
              }}>
                {r === "student" ? "🎓 Student" : r === "landlord" ? "🏠 Landlord" : "💼 Professional"}
              </button>
            ))}
          </div>

          <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "5px" }}>First Name</label>
                <input type="text" className="input" placeholder="Rahim" />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "5px" }}>Last Name</label>
                <input type="text" className="input" placeholder="Uddin" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "5px" }}>Email address</label>
              <input type="email" className="input" placeholder="rahim@example.com" />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "5px" }}>Phone Number</label>
              <input type="tel" className="input" placeholder="01XXXXXXXXX" />
            </div>
            {role === "student" && (
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "5px" }}>University</label>
                <select className="input">
                  <option value="">Select your university</option>
                  {UNIVERSITIES.map(u => <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "5px" }}>Password</label>
              <input type="password" className="input" placeholder="Min. 8 characters" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}>
              Create Account — It&apos;s Free
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "1.25rem" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
