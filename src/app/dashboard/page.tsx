"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import CountUp from "react-countup";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Home, Building2, Users, Wallet, Bell, Settings, 
  TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle, Send
} from "lucide-react";
import { fadeUpStagger, fadeUp, slideRight } from "@/lib/animations";

const DATA = [
  { name: 'Jan', value: 38000 },
  { name: 'Feb', value: 42000 },
  { name: 'Mar', value: 40000 },
  { name: 'Apr', value: 45000 },
  { name: 'May', value: 44000 },
  { name: 'Jun', value: 48000 },
];

const TENANTS = [
  { name: "Tanvir Ahmed", unit: "Flat 3B", rent: 12000, status: "Paid" },
  { name: "Priya Das", unit: "Flat 2A", rent: 10500, status: "Due" },
  { name: "Rahul Islam", unit: "Room 1C", rent: 7000, status: "Late" },
];

const ACTIVITY = [
  { text: "New tenant applied for Flat 2A", time: "2h ago" },
  { text: "Rent received from Tanvir ৳12,000", time: "1d ago" },
  { text: "Listing AI Score updated to 94", time: "3d ago" },
  { text: "New inquiry from Sumaiya", time: "5d ago" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--mist)] flex">
      
      {/* SIDEBAR */}
      <aside className="w-[240px] bg-[var(--forest)] text-white fixed h-full hidden md:flex flex-col z-20">
        <div className="p-6">
          <Link href="/" className="font-['Playfair_Display'] font-bold text-2xl tracking-tight flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-[var(--mint)]">T</span>
            </div>
            Thikana
          </Link>
          
          <nav className="flex flex-col gap-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-[var(--mint)] border-l-4 border-[var(--mint)] font-medium">
              <Home size={18} /> Dashboard
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors font-medium">
              <Building2 size={18} /> Properties
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors font-medium">
              <Users size={18} /> Tenants
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors font-medium">
              <Wallet size={18} /> Finances
            </Link>
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="flex items-center gap-3 border-t border-white/10 pt-6">
            <div className="w-10 h-10 rounded-full bg-[var(--emerald)] flex items-center justify-center font-bold">K</div>
            <div>
              <div className="text-sm font-semibold">Karim Saheb</div>
              <div className="text-xs text-slate-400">Landlord</div>
            </div>
            <Settings size={16} className="text-slate-400 ml-auto cursor-pointer hover:text-white" />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-[240px] p-6 lg:p-10 max-w-[1400px]">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="display-lg text-[var(--forest)] mb-2">Good morning, Karim Saheb 👋</h1>
          <p className="body-lg text-[var(--slate)]">Here&apos;s your property overview for June 2026.</p>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={fadeUpStagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { title: "Active Listings", icon: Building2, value: 3, trend: "+1 this mo", trendUp: true },
            { title: "Tenants Current", icon: Users, value: 8, trend: "2 pending", trendUp: true },
            { title: "Monthly Revenue", icon: Wallet, value: 48000, prefix: "৳", trend: "+৳4k MoM", trendUp: true },
            { title: "Avg AI Score", icon: CheckCircle2, value: 91, trend: "Top 5%", trendUp: true },
          ].map((stat, i) => (
            <motion.div key={i} variants={fadeUp} className="bg-white rounded-[20px] p-6 border border-[var(--foam)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-4 text-[var(--slate)]">
                <span className="font-semibold">{stat.title}</span>
                <stat.icon size={20} className="text-[var(--emerald)]" />
              </div>
              <div className="text-3xl font-bold text-[var(--forest)] mb-2 font-['Playfair_Display']">
                {stat.prefix}<CountUp end={stat.value} duration={2} separator="," />
              </div>
              <div className={`text-sm font-medium flex items-center gap-1 ${stat.trendUp ? 'text-[var(--emerald)]' : 'text-[var(--danger)]'}`}>
                {stat.trendUp ? <TrendingUp size={14}/> : <TrendingDown size={14}/>} {stat.trend}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Chart + Table) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Chart */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-[24px] p-6 md:p-8 border border-[var(--foam)] shadow-[var(--shadow-sm)]">
              <h3 className="heading text-[var(--forest)] mb-6">Revenue Trend</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--emerald)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--emerald)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--foam)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--stone)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--stone)' }} tickFormatter={(val) => `৳${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                      formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="value" stroke="var(--emerald)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Table */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-[24px] overflow-hidden border border-[var(--foam)] shadow-[var(--shadow-sm)]">
              <div className="p-6 border-b border-[var(--foam)]">
                <h3 className="heading text-[var(--forest)]">Tenant Payment Status</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--mist)] text-[var(--slate)] text-sm uppercase tracking-wider">
                      <th className="p-4 font-semibold">Tenant Name</th>
                      <th className="p-4 font-semibold">Unit</th>
                      <th className="p-4 font-semibold">Rent</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TENANTS.map((t, i) => (
                      <tr key={i} className="border-b border-[var(--foam)] hover:bg-[var(--mint)]/30 transition-colors group">
                        <td className="p-4 font-medium text-[var(--forest)]">{t.name}</td>
                        <td className="p-4 text-[var(--slate)]">{t.unit}</td>
                        <td className="p-4 font-medium bangla">৳{t.rent.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            t.status === 'Paid' ? 'bg-[var(--mint)] text-[var(--forest)]' :
                            t.status === 'Due' ? 'bg-[var(--amber-soft)] text-[var(--gold)]' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {t.status === 'Paid' && <CheckCircle2 size={12}/>}
                            {t.status === 'Due' && <Clock size={12}/>}
                            {t.status === 'Late' && <AlertCircle size={12}/>}
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-all ${
                            t.status === 'Paid' 
                              ? 'border-transparent text-[var(--jade)] hover:bg-[var(--mist)]' 
                              : 'border-[var(--emerald)] text-[var(--emerald)] hover:bg-[var(--emerald)] hover:text-white'
                          }`}>
                            {t.status === 'Paid' ? 'View' : 'Remind'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* Right Column (Activity Feed) */}
          <motion.div variants={slideRight} initial="hidden" animate="show" className="bg-white rounded-[24px] p-6 border border-[var(--foam)] shadow-[var(--shadow-sm)] h-fit">
            <div className="flex items-center justify-between mb-8">
              <h3 className="heading text-[var(--forest)]">Activity</h3>
              <Bell size={18} className="text-[var(--stone)]" />
            </div>

            <div className="relative pl-6 border-l-2 border-[var(--foam)] space-y-8">
              {ACTIVITY.map((act, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="relative"
                >
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-[var(--emerald)]" />
                  <p className="text-sm font-medium text-[var(--forest)] mb-1 leading-snug">{act.text}</p>
                  <p className="text-xs text-[var(--stone)]">{act.time}</p>
                </motion.div>
              ))}
            </div>

            <button className="w-full mt-8 py-3 rounded-xl bg-[var(--mist)] text-[var(--emerald)] font-semibold text-sm hover:bg-[var(--mint)] transition-colors">
              View All Activity
            </button>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
