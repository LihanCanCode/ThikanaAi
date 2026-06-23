"use client";

import { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import { formatBDT } from "@/lib/utils";

type Tab = "split" | "bills" | "budget";

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>("split");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      <div className="container" style={{ padding: "2rem 1.5rem", maxWidth: "700px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>💰 Student Finance Toolkit</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.9rem" }}>
          Split rent, divide bills, and forecast your monthly budget — all in one place.
        </p>

        {/* Tabs */}
        <div style={{ display: "flex", background: "var(--bg-subtle)", borderRadius: "var(--radius-lg)", padding: "4px", marginBottom: "2rem" }}>
          {([["split","🏠 Rent Split"], ["bills","⚡ Bill Split"], ["budget","📊 Budget Forecast"]] as [Tab, string][]).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "0.55rem", borderRadius: "var(--radius-md)",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              fontWeight: 600, fontSize: "0.82rem",
              background: tab === t ? "var(--bg-surface)" : "transparent",
              color: tab === t ? "var(--primary)" : "var(--text-muted)",
              boxShadow: tab === t ? "var(--shadow-sm)" : "none",
              transition: "all 0.2s",
            }}>{l}</button>
          ))}
        </div>

        {tab === "split" && <RentSplitter />}
        {tab === "bills" && <BillSplitter />}
        {tab === "budget" && <BudgetForecast />}
      </div>
    </div>
  );
}

function RentSplitter() {
  const [rent, setRent] = useState("12000");
  const [persons, setPersons] = useState("3");
  const [names, setNames] = useState(["", "", ""]);

  const total = parseInt(rent) || 0;
  const n = Math.max(1, parseInt(persons) || 1);
  const perPerson = Math.ceil(total / n);

  const updatePersons = (val: string) => {
    const num = Math.min(10, Math.max(1, parseInt(val) || 1));
    setPersons(String(num));
    setNames(Array(num).fill("").map((_, i) => names[i] || ""));
  };

  return (
    <div className="card" style={{ padding: "1.75rem" }}>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1.25rem" }}>Rent Splitter</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <label style={label}>Total Monthly Rent (৳)</label>
          <input type="number" className="input" value={rent} onChange={e => setRent(e.target.value)} placeholder="12000" />
        </div>
        <div>
          <label style={label}>Number of Flatmates</label>
          <input type="number" className="input" value={persons} min={1} max={10} onChange={e => updatePersons(e.target.value)} />
        </div>
      </div>

      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ marginBottom: "8px" }}>
          <input className="input" placeholder={`Person ${i + 1} name (optional)`}
            value={names[i] || ""} onChange={e => { const ns = [...names]; ns[i] = e.target.value; setNames(ns); }}
            style={{ fontSize: "0.85rem" }} />
        </div>
      ))}

      {total > 0 && (
        <div style={{ marginTop: "1.5rem", background: "var(--primary-xlight)", borderRadius: "var(--radius-lg)", padding: "1.25rem", border: "1px solid var(--primary-light)" }}>
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--primary)" }}>{formatBDT(perPerson)}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>per person / month</div>
          </div>
          <div style={{ borderTop: "1px solid var(--primary-light)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "6px" }}>
            {Array.from({ length: n }).map((_, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{names[i] || `Person ${i + 1}`}</span>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>{formatBDT(perPerson)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--primary-light)" }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Total</span>
            <span style={{ fontWeight: 800, color: "var(--primary)" }}>{formatBDT(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BillSplitter() {
  const [bills, setBills] = useState([
    { name: "Electricity", amount: "1200" },
    { name: "Gas", amount: "500" },
    { name: "Internet", amount: "700" },
    { name: "Water", amount: "300" },
  ]);
  const [persons, setPersons] = useState("3");

  const total = bills.reduce((s, b) => s + (parseInt(b.amount) || 0), 0);
  const n = Math.max(1, parseInt(persons) || 1);
  const perPerson = Math.ceil(total / n);

  const addBill = () => setBills([...bills, { name: "", amount: "" }]);
  const updateBill = (i: number, k: "name" | "amount", v: string) => {
    const nb = [...bills]; nb[i] = { ...nb[i], [k]: v }; setBills(nb);
  };

  return (
    <div className="card" style={{ padding: "1.75rem" }}>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1.25rem" }}>Bill Splitter</h2>
      <div style={{ marginBottom: "1rem" }}>
        <label style={label}>Flatmates sharing bills</label>
        <input type="number" className="input" value={persons} min={1} max={10} onChange={e => setPersons(e.target.value)} style={{ maxWidth: "120px" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1rem" }}>
        {bills.map((b, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
            <input className="input" placeholder="Bill name (e.g. Electricity)" value={b.name} onChange={e => updateBill(i, "name", e.target.value)} style={{ fontSize: "0.85rem" }} />
            <input className="input" type="number" placeholder="৳ Amount" value={b.amount} onChange={e => updateBill(i, "amount", e.target.value)} style={{ width: "120px", fontSize: "0.85rem" }} />
          </div>
        ))}
      </div>

      <button onClick={addBill} className="btn btn-outline" style={{ width: "100%", marginBottom: "1.25rem", justifyContent: "center", fontSize: "0.85rem" }}>
        + Add Another Bill
      </button>

      {total > 0 && (
        <div style={{ background: "var(--accent-light)", borderRadius: "var(--radius-lg)", padding: "1.25rem", border: "1px solid rgba(245,155,43,0.3)" }}>
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-hover)" }}>{formatBDT(perPerson)}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>per person for all bills</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {bills.filter(b => b.amount).map(b => (
              <div key={b.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>{b.name || "Unnamed"}</span>
                <span style={{ color: "var(--text-muted)" }}>{formatBDT(parseInt(b.amount)||0)} ÷ {n} = <strong style={{ color: "var(--accent-hover)" }}>{formatBDT(Math.ceil((parseInt(b.amount)||0) / n))}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetForecast() {
  const [monthly, setMonthly] = useState("8000");
  const [rent, setRent] = useState("4000");
  const [meals, setMeals] = useState("3000");
  const [transport, setTransport] = useState("500");
  const [other, setOther] = useState("500");

  const income = parseInt(monthly) || 0;
  const totalExpense = (parseInt(rent)||0) + (parseInt(meals)||0) + (parseInt(transport)||0) + (parseInt(other)||0);
  const remaining = income - totalExpense;
  const rentPct = income > 0 ? Math.round(((parseInt(rent)||0) / income) * 100) : 0;
  const safePct = 40;
  const rentWarning = rentPct > safePct;

  const items = [
    { label: "Rent", val: parseInt(rent)||0, color: "var(--primary)", emoji: "🏠" },
    { label: "Meals", val: parseInt(meals)||0, color: "var(--accent)", emoji: "🍽️" },
    { label: "Transport", val: parseInt(transport)||0, color: "var(--info)", emoji: "🚌" },
    { label: "Other", val: parseInt(other)||0, color: "var(--text-muted)", emoji: "💸" },
  ];

  return (
    <div className="card" style={{ padding: "1.75rem" }}>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1.25rem" }}>Monthly Budget Forecast</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.5rem" }}>
        {[
          { k: "monthly", l: "Monthly Allowance (৳)", v: monthly, set: setMonthly },
          { k: "rent", l: "Rent / Month (৳)", v: rent, set: setRent },
          { k: "meals", l: "Monthly Meal Cost (৳)", v: meals, set: setMeals },
          { k: "transport", l: "Transport (৳)", v: transport, set: setTransport },
          { k: "other", l: "Other Expenses (৳)", v: other, set: setOther },
        ].map(({ k, l, v, set: s }) => (
          <div key={k} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", alignItems: "center" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>{l}</label>
            <input type="number" className="input" value={v} onChange={e => s(e.target.value)} style={{ width: "130px", fontSize: "0.85rem" }} />
          </div>
        ))}
      </div>

      {income > 0 && (
        <div>
          {/* Budget bar */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              <span>Expenses: {formatBDT(totalExpense)}</span>
              <span>Budget: {formatBDT(income)}</span>
            </div>
            <div style={{ height: 12, background: "var(--bg-muted)", borderRadius: 6, overflow: "hidden" }}>
              <div style={{
                width: `${Math.min((totalExpense / income) * 100, 100)}%`,
                height: "100%", borderRadius: 6,
                background: totalExpense > income ? "var(--danger)" : totalExpense > income * 0.85 ? "var(--warning)" : "var(--success)",
                transition: "width 0.4s ease",
              }} />
            </div>
            {items.map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flex: 1 }}>{item.emoji} {item.label}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{formatBDT(item.val)}</span>
              </div>
            ))}
          </div>

          {/* Warnings */}
          {rentWarning && (
            <div style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.25)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.82rem", color: "var(--warning)" }}>
              ⚠️ Your rent ({rentPct}% of budget) exceeds the recommended 40% limit. Consider cheaper options.
            </div>
          )}

          {/* Summary */}
          <div style={{
            background: remaining >= 0 ? "var(--primary-xlight)" : "rgba(220,38,38,0.06)",
            border: `1px solid ${remaining >= 0 ? "var(--primary-light)" : "rgba(220,38,38,0.2)"}`,
            borderRadius: "var(--radius-lg)", padding: "1.25rem", textAlign: "center",
          }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              {remaining >= 0 ? "Monthly savings" : "Monthly shortfall"}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: remaining >= 0 ? "var(--primary)" : "var(--danger)" }}>
              {remaining >= 0 ? "+" : ""}{formatBDT(Math.abs(remaining))}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
              {remaining >= 0 ? `You save ${Math.round((remaining/income)*100)}% of your monthly allowance` : "Your expenses exceed your allowance — consider adjustments"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const label: React.CSSProperties = {
  fontSize: "0.82rem", fontWeight: 600,
  color: "var(--text-secondary)", display: "block", marginBottom: "5px",
};
