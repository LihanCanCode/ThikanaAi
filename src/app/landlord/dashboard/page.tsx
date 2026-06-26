"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import { formatBDT } from "@/lib/utils";
import { PlusCircle, CheckCircle, Clock, AlertCircle, TrendingUp, Loader2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Listing } from "@/types";

export interface TenantWithPayment {
  id: string;
  listing_id: string | null;
  tenant_name: string;
  tenant_phone: string | null;
  room_label: string | null;
  monthly_rent: number;
  status: "paid" | "due" | "overdue";
  paid_on: string | null;
}

export default function LandlordDashboard() {
  const [tenants, setTenants] = useState<TenantWithPayment[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [monthLabel, setMonthLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [adding, setAdding] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const today = new Date();
    const currentMonth = today.toISOString().substring(0, 7); // YYYY-MM
    setMonthLabel(today.toLocaleDateString("en-US", { month: "long", year: "numeric" }));

    // a) SELECT * FROM listings WHERE landlord_id = {current_user_id} ORDER BY created_at DESC
    const { data: listings } = await supabase
      .from("listings")
      .select("*")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });

    if (listings) {
      setMyListings(listings as Listing[]);
    }

    // b) Fetch tenants and their payments
    const { data: tenantsData } = await supabase
      .from("tenants")
      .select(`
        *,
        rent_payments(status, paid_on, month)
      `)
      .eq("landlord_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (tenantsData) {
      const mappedTenants: TenantWithPayment[] = tenantsData.map((t: any) => {
        const paymentThisMonth = Array.isArray(t.rent_payments) 
          ? t.rent_payments.find((p: any) => p.month === currentMonth || (p.month && p.month.startsWith(currentMonth)))
          : null;
          
        return {
          id: t.id,
          listing_id: t.listing_id,
          tenant_name: t.tenant_name,
          tenant_phone: t.tenant_phone,
          room_label: t.room_label,
          monthly_rent: t.monthly_rent,
          status: paymentThisMonth?.status || "due",
          paid_on: paymentThisMonth?.paid_on || null,
        };
      });
      setTenants(mappedTenants);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalMonthly = tenants.reduce((s, t) => s + t.monthly_rent, 0);
  const collected = tenants.filter((t) => t.status === "paid").reduce((s, t) => s + t.monthly_rent, 0);
  const pending = totalMonthly - collected;

  const handleMarkPaid = async (tenantId: string, rent: number) => {
    setMarkingId(tenantId);
    
    const today = new Date();
    const currentMonthStr = today.toISOString().substring(0, 7); // 'YYYY-MM'
    
    // INSERT into rent_payments
    const { error } = await supabase.from("rent_payments").insert({
      tenant_id: tenantId,
      month: currentMonthStr,
      amount: rent,
      paid_on: today.toISOString().split("T")[0],
      status: "paid"
    });
    
    if (!error) {
      await loadData();
    }
    setMarkingId(null);
  };

  const handleAddTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAdding(true);
    const formData = new FormData(e.currentTarget);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAdding(false);
      return;
    }

    const tenant_name = formData.get("tenant_name") as string;
    const tenant_phone = formData.get("tenant_phone") as string;
    const room_label = formData.get("room_label") as string;
    const monthly_rent = parseInt(formData.get("monthly_rent") as string, 10);
    const listing_id = (formData.get("listing_id") as string) || null;

    const { error } = await supabase.from("tenants").insert({
      landlord_id: user.id,
      listing_id,
      tenant_name,
      tenant_phone: tenant_phone || null,
      room_label: room_label || null,
      monthly_rent,
      is_active: true
    });

    if (!error) {
      setShowAddTenant(false);
      await loadData();
      (e.target as HTMLFormElement).reset();
    }
    setAdding(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      <div className="container" style={{ padding: "2rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Landlord Dashboard</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>{monthLabel || "Current month"} overview</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button type="button" onClick={() => setShowAddTenant(!showAddTenant)} className="btn btn-outline" style={{ gap: "6px" }}>
              <UserPlus size={16} /> Add Tenant
            </button>
            <Link href="/listings/new" className="btn btn-primary" style={{ gap: "6px" }}>
              <PlusCircle size={16} /> Add New Listing
            </Link>
          </div>
        </div>

        {showAddTenant && (
          <form onSubmit={handleAddTenant} className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", alignItems: "end" }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Tenant Name *</label>
              <input name="tenant_name" className="input" required placeholder="Rahim Uddin" />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Phone</label>
              <input name="tenant_phone" className="input" placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Room</label>
              <input name="room_label" className="input" placeholder="Room A" />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Monthly Rent (BDT) *</label>
              <input name="monthly_rent" type="number" className="input" required min={1000} placeholder="8000" />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Listing</label>
              <select name="listing_id" className="input">
                <option value="">— Optional —</option>
                {myListings.map((l) => (
                  <option key={l.id} value={l.id}>{l.title_en}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={adding} className="btn btn-primary" style={{ justifyContent: "center" }}>
              {adding ? <Loader2 size={16} className="animate-spin" /> : "Save Tenant"}
            </button>
          </form>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Total Monthly Income", val: formatBDT(totalMonthly), icon: "💰", color: "var(--primary-light)", textColor: "var(--primary)" },
            { label: "Collected This Month", val: formatBDT(collected), icon: "✅", color: "#dcfce7", textColor: "var(--success)" },
            { label: "Pending Collection", val: formatBDT(pending), icon: "⏳", color: pending > 0 ? "rgba(245,155,43,0.12)" : "#dcfce7", textColor: pending > 0 ? "var(--warning)" : "var(--success)" },
            { label: "Active Listings", val: String(myListings.length), icon: "🏠", color: "var(--accent-light)", textColor: "var(--accent-hover)" },
          ].map((s) => (
            <div key={s.label} style={{ background: s.color, borderRadius: "var(--radius-lg)", padding: "1.25rem", border: "1px solid rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>{s.icon}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.textColor }}>{s.val}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ padding: "2rem", background: "var(--mist)", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite", borderRadius: "var(--radius-md)" }} />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1, 2].map(i => (
                <div key={i} className="card" style={{ padding: "2rem", background: "var(--mist)", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite", borderRadius: "var(--radius-md)" }} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Payment Ledger — {monthLabel}</h2>
              {tenants.length === 0 ? (
                <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <p>No tenants yet. Add a tenant to start tracking rent payments.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {tenants.map((t) => (
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
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{t.room_label || "—"} · {t.tenant_phone || "No phone"}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: "1rem" }}>{formatBDT(t.monthly_rent)}</div>
                            {t.paid_on && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Paid: {t.paid_on}</div>}
                          </div>
                          <StatusBadge status={t.status} />
                          {t.status !== "paid" && (
                            <button
                              onClick={() => handleMarkPaid(t.id, t.monthly_rent)}
                              disabled={markingId === t.id}
                              className="btn btn-primary"
                              style={{ padding: "0.4rem 0.9rem", fontSize: "0.78rem" }}
                            >
                              {markingId === t.id ? <Loader2 size={14} className="animate-spin" /> : "Mark Paid"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>My Listings</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {myListings.length === 0 ? (
                  <div className="card" style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                    No listings yet. Create your first listing.
                  </div>
                ) : (
                  myListings.map((l) => (
                    <div key={l.id} className="card" style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", gap: "10px" }}>
                        {l.photos?.[0] && (
                          <img src={l.photos[0]} alt="" style={{ width: 56, height: 56, borderRadius: "var(--radius-md)", objectFit: "cover", flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title_en}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "6px" }}>{l.area}</div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.88rem" }}>{formatBDT(l.rent_bdt)}/mo</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.72rem", color: l.is_available ? "var(--success)" : "var(--text-muted)" }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.is_available ? "var(--success)" : "var(--text-muted)" }} />
                              {l.is_available ? "Available" : "Occupied"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <Link href="/listings/new" className="btn btn-outline" style={{ justifyContent: "center", gap: "6px" }}>
                  <PlusCircle size={14} /> Add Listing
                </Link>
              </div>

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
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "paid" | "due" | "overdue" }) {
  const config = {
    paid: { label: "Paid", bg: "#dcfce7", color: "var(--success)", icon: <CheckCircle size={12} /> },
    due: { label: "Due", bg: "var(--accent-light)", color: "var(--warning)", icon: <Clock size={12} /> },
    overdue: { label: "Overdue", bg: "rgba(220,38,38,0.1)", color: "var(--danger)", icon: <AlertCircle size={12} /> },
  }[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "var(--radius-full)", background: config.bg, color: config.color, fontWeight: 700, fontSize: "0.75rem" }}>
      {config.icon} {config.label}
    </span>
  );
}
