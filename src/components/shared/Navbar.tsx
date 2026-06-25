"use client";

import Link from "next/link";
import { useState } from "react";
import { Home, Search, PlusCircle, LayoutDashboard, Menu, X, Users } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header style={{
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <nav className="container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "64px",
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36,
            background: "var(--primary)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Home size={18} color="#fff" />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--primary)" }}>Thikana</span>
            <span className="bangla" style={{ display: "block", fontSize: "0.65rem", color: "var(--text-muted)", lineHeight: 1, marginTop: "-2px" }}>
              ঠিকানা
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="desktop-nav">
          <NavLink href="/listings" icon={<Search size={15} />}>Student Rent</NavLink>
          <NavLink href="/listings/family" icon={<Search size={15} />}>Family Rent</NavLink>
          <NavLink href="/student/feed" icon={<Users size={15} />}>Find Flatmate</NavLink>
          <NavLink href="/listings/new" icon={<PlusCircle size={15} />}>List Property</NavLink>
          <NavLink href="/landlord/dashboard" icon={<LayoutDashboard size={15} />}>Dashboard</NavLink>
          <NavLink href="/student/finance" icon={<span style={{ fontSize: "15px" }}>💰</span>}>Finance</NavLink>
          <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 4px" }} />
          <Link href="/auth/login" className="btn btn-outline" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
            Sign In
          </Link>
          <Link href="/auth/signup" className="btn btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="mobile-menu-btn"
          style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", color: "var(--text-primary)" }}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div style={{
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border)",
          padding: "1rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}>
          <MobileNavLink href="/listings" onClick={() => setOpen(false)}>🎓 Student Rent</MobileNavLink>
          <MobileNavLink href="/listings/family" onClick={() => setOpen(false)}>🏠 Family Rent</MobileNavLink>
          <MobileNavLink href="/student/feed" onClick={() => setOpen(false)}>🤝 Find Flatmate</MobileNavLink>
          <MobileNavLink href="/listings/new" onClick={() => setOpen(false)}>➕ List Property</MobileNavLink>
          <MobileNavLink href="/landlord/dashboard" onClick={() => setOpen(false)}>📊 Dashboard</MobileNavLink>
          <MobileNavLink href="/student/finance" onClick={() => setOpen(false)}>💰 Finance Tools</MobileNavLink>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "0.5rem 0" }} />
          <Link href="/auth/login" className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }} onClick={() => setOpen(false)}>Sign In</Link>
          <Link href="/auth/signup" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setOpen(false)}>Get Started</Link>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: "5px",
      padding: "0.4rem 0.75rem",
      borderRadius: "var(--radius-full)",
      color: "var(--text-secondary)",
      textDecoration: "none",
      fontSize: "0.875rem",
      fontWeight: 500,
      transition: "all 0.15s ease",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)";
      (e.currentTarget as HTMLElement).style.color = "var(--primary)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.background = "transparent";
      (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
    }}>
      {icon}{children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: "block", padding: "0.65rem 0.75rem",
      borderRadius: "var(--radius-md)",
      color: "var(--text-primary)",
      textDecoration: "none",
      fontSize: "0.95rem",
      fontWeight: 500,
      transition: "background 0.15s ease",
    }}
    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"}
    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
      {children}
    </Link>
  );
}
