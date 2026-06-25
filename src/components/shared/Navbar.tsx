"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Home, Search, PlusCircle, LayoutDashboard, Menu, X, Users, LogOut, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/auth/actions";
import type { UserRole } from "@/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDashboardHref(role: UserRole | string | undefined) {
  if (role === "landlord") return "/landlord/dashboard";
  if (role === "student") return "/student/feed";
  return "/listings";
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileRole, setProfileRole] = useState<UserRole | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setUserMenuOpen(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfileRole(null);
      setProfileName(null);
      return;
    }
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileRole(data.role as UserRole);
          setProfileName(data.full_name);
        }
      });
  }, [user]);

  useEffect(() => {
    if (!userMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const fullName = profileName ?? (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "User";
  const email = user?.email ?? "";
  const role = profileRole ?? (user?.user_metadata?.role as UserRole | undefined) ?? "student";
  const initials = getInitials(fullName);
  const dashboardHref = getDashboardHref(role);

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

          {user ? (
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 8px 4px 4px",
                  borderRadius: "var(--radius-full)",
                  border: `1px solid ${userMenuOpen ? "var(--primary)" : "var(--border)"}`,
                  background: userMenuOpen ? "var(--primary-xlight)" : "var(--bg-surface)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s ease, background 0.15s ease",
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}>
                  {initials}
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    color: "var(--text-muted)",
                    transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.15s ease",
                  }}
                />
              </button>

              {userMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    width: "260px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-lg, 0 10px 40px rgba(0,0,0,0.12))",
                    padding: "0.5rem",
                    zIndex: 200,
                  }}
                >
                  <div style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "2px" }}>
                      {fullName}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                      {email}
                    </div>
                    <span style={{
                      display: "inline-block",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      background: "var(--primary-xlight)",
                      color: "var(--primary)",
                      textTransform: "capitalize",
                    }}>
                      {role}
                    </span>
                  </div>

                  <Link
                    href={dashboardHref}
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      textDecoration: "none",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>

                  <form action={logout}>
                    <button
                      type="submit"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "var(--radius-md)",
                        border: "none",
                        background: "transparent",
                        color: "#DC2626",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-outline" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
                Get Started
              </Link>
            </>
          )}
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

          {user ? (
            <>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "0.65rem 0.75rem",
                background: "var(--bg-subtle)",
                borderRadius: "var(--radius-md)",
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{fullName}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{email}</div>
                </div>
              </div>
              <MobileNavLink href={dashboardHref} onClick={() => setOpen(false)}>📊 My Dashboard</MobileNavLink>
              <form action={logout}>
                <button
                  type="submit"
                  className="btn btn-outline"
                  style={{ width: "100%", justifyContent: "center", color: "#DC2626", borderColor: "#FECACA" }}
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }} onClick={() => setOpen(false)}>Sign In</Link>
              <Link href="/auth/signup" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setOpen(false)}>Get Started</Link>
            </>
          )}
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
