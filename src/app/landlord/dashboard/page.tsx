"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import { formatBDT, timeAgo } from "@/lib/utils";
import { SEED_LISTINGS } from "@/lib/seed-listings";
import { PlusCircle, CheckCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";

const MOCK_TENANTS = [
  { id: "t1", listing_id: "1", tenant_name: "Rahim Uddin",  room_label: "Room A", monthly_rent: 4750, phone: "01712345678", status: "paid",    paid_on: "2026-06-02" },
  { id: "t2", listing_id: "1", tenant_name: "Karim Hossain", room_label: "Room B", monthly_rent: 4750, phone: "01812345678", status: "due",    paid_on: null },
  { id: "t3", listing_id: "3", tenant_name: "Fatema Begum",  room_label: "Master", monthly_rent: 22000, phone: "01912345678", status: "overdue", paid_on: null },
  { id: "t4", listing_id: "5", tenant_name: "Nasir Ahmed",   room_label: "Room 1", monthly_rent: 8000, phone: "01612345678", status: "paid",    paid_on: "2026-06-01" },
];

export default function LandlordDashboard() {
  const [tenants, setTenants] = useState(MOCK_TENANTS);
  const myListings = SEED_LISTINGS.slice(0, 3);

  const totalMonthly = tenants.reduce((s, t) => s + t.monthly_rent, 0);
  const collected = tenants.filter(t => t.status === "paid").reduce((s, t) => s + t.monthly_rent, 0);
  const pending = totalMonthly - collected;

  const markPaid = (id: string) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status: "paid", paid_on: new Date().toISOString().split("T")[0] } : t));
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      <div className="container" style={{ padding: "2rem 1.5rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Landlord Dashboard</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>June 2026 Overview</p>
          </div>
          <Link href="/listings/new" className="btn btn-primary" style={{ gap: "6px" }}>
            <PlusCircle size={16} /> Add New Listing
          </Link>
        </div>

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Total Monthly Income", val: formatBDT(totalMonthly), icon: "💰", color: "var(--primary-light)", textColor: "var(--primary)" },
            { label: "Collected This Month", val: formatBDT(collected), icon: "✅", color: "#dcfce7", textColor: "var(--success)" },
            { label: "Pending Collection", val: formatBDT(pending), icon: "⏳", color: pending > 0 ? "rgba(245,155,43,0.12)" : "#dcfce7", textColor: pending > 0 ? "var(--warning)" : "var(--success)" },
            { label: "Active Listings", val: String(myListings.length), icon: "🏠", color: "var(--accent-light)", textColor: "var(--accent-hover)" },
          ].map(s => (
            <div key={s.label} style={{ background: s.color, borderRadius: "var(--radius-lg)", padding: "1.25rem", border: "1px solid rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>{s.icon}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.textColor }}>{s.val}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
          {/* Payment Ledger */}
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Payment Ledger — June 2026</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {tenants.map(t => (
                <div key={t.id} className="card" style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: t.status === "paid" ? "#dcfce7" : t.status === "overdue" ? "rgba(220,38,38,0.1)" : "var(--accent-light)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
                      }}>👤</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{t.tenant_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{t.room_label} · {t.phone}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: "1rem" }}>{formatBDT(t.monthly_rent)}</div>
                        {t.paid_on && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Paid: {t.paid_on}</div>}
                      </div>
                      <StatusBadge status={t.status as "paid" | "due" | "overdue"} />
                      {t.status !== "paid" && (
                        <button onClick={() => markPaid(t.id)} className="btn btn-primary" style={{ padding: "0.4rem 0.9rem", fontSize: "0.78rem" }}>
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Listings sidebar */}
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>My Listings</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {myListings.map(l => (
                <div key={l.id} className="card" style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {l.photos[0] && (
                      <img src={l.photos[0]} alt="" style={{ width: 56, height: 56, borderRadius: "var(--radius-md)", objectFit: "cover", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title_en}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "6px" }}>{l.area}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.88rem" }}>{formatBDT(l.rent_bdt)}/mo</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.72rem",
                          color: l.is_available ? "var(--success)" : "var(--text-muted)" }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.is_available ? "var(--success)" : "var(--text-muted)" }} />
                          {l.is_available ? "Available" : "Occupied"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Link href="/listings/new" className="btn btn-outline" style={{ justifyContent: "center", gap: "6px" }}>
                <PlusCircle size={14} /> Add Listing
              </Link>
            </div>

            {/* Quick earnings */}
            <div className="card" style={{ padding: "1.25rem", marginTop: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "1rem" }}>
                <TrendingUp size={16} style={{ color: "var(--primary)" }} />
                <h3 style={{ fontWeight: 700, fontSize: "0.9rem" }}>Earnings Summary</h3>
              </div>
              {[["This Month", formatBDT(collected)], ["Pending", formatBDT(pending)], ["Annual Est.", formatBDT(totalMonthly * 12)]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>{l}</span>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "paid" | "due" | "overdue" }) {
  const config = {
    paid:    { label: "Paid",    bg: "#dcfce7", color: "var(--success)", icon: <CheckCircle size={12} /> },
    due:     { label: "Due",     bg: "var(--accent-light)", color: "var(--warning)", icon: <Clock size={12} /> },
    overdue: { label: "Overdue", bg: "rgba(220,38,38,0.1)", color: "var(--danger)", icon: <AlertCircle size={12} /> },
  }[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "var(--radius-full)", background: config.bg, color: config.color, fontWeight: 700, fontSize: "0.75rem" }}>
      {config.icon} {config.label}
    </span>
  );
}
