"use client";

import Link from "next/link";
import { useState, useActionState } from "react";
import { Home, Eye, EyeOff, Loader2 } from "lucide-react";
import { login } from "@/app/auth/actions";

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState<"student" | "landlord">("student");
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #EDF7F0 0%, #F8FAF7 60%, #FEF9F0 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
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
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, textAlign: "center", marginBottom: "0.25rem" }}>Welcome back</h1>
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Sign in to your Thikana account</p>

          {/* Role toggle */}
          <div style={{ display: "flex", background: "var(--bg-subtle)", borderRadius: "var(--radius-lg)", padding: "4px", marginBottom: "1.5rem" }}>
            {(["student", "landlord"] as const).map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                flex: 1, padding: "0.5rem",
                borderRadius: "var(--radius-md)",
                border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: "0.85rem",
                fontFamily: "inherit",
                background: role === r ? "var(--bg-surface)" : "transparent",
                color: role === r ? "var(--primary)" : "var(--text-muted)",
                boxShadow: role === r ? "var(--shadow-sm)" : "none",
                transition: "all 0.2s",
              }}>
                {r === "student" ? "🎓 Student" : "🏠 Landlord"}
              </button>
            ))}
          </div>

          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {state?.error && (
              <div style={{ padding: "0.75rem", background: "#FEE2E2", color: "#B91C1C", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 500, textAlign: "center" }}>
                {state.error}
              </div>
            )}
            
            <input type="hidden" name="role" value={role} />
            
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "5px" }}>Email address</label>
              <input type="email" name="email" className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "5px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} name="password" className="input" placeholder="••••••••" required style={{ paddingRight: "2.5rem" }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.75rem", opacity: isPending ? 0.7 : 1 }}>
              {isPending ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "1.25rem" }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
