"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserCircle, MapPin, Phone, Loader2, Save } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { getProfile, updateProfile } from "@/app/actions/profile-actions";
import { toast } from "react-hot-toast";
import { fadeUp } from "@/lib/animations";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    university: "",
    phone: "",
  });

  useEffect(() => {
    async function loadData() {
      const profile = await getProfile();
      if (profile) {
        setFormData({
          full_name: profile.full_name || "",
          university: profile.university || "",
          phone: profile.phone || "",
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--mist)]">
      <Navbar />
      
      <main className="container mx-auto px-6 py-12 md:py-20 flex justify-center">
        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="show"
          className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-[var(--shadow-md)] border border-[var(--border)]"
        >
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--border)]">
            <div className="w-16 h-16 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
              <UserCircle size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Profile</h1>
              <p className="text-sm text-[var(--text-secondary)]">Manage your personal information</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 block uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl focus:border-[var(--primary)] outline-none text-[var(--text-primary)] font-medium transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 block uppercase tracking-wider">
                  University / Working Place
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl focus:border-[var(--primary)] outline-none text-[var(--text-primary)] font-medium transition-colors"
                    placeholder="e.g. AUST, Dhaka University, or Google"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 block uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl focus:border-[var(--primary)] outline-none text-[var(--text-primary)] font-medium transition-colors"
                    placeholder="+880 1..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold rounded-xl transition-all shadow-[var(--shadow-sm)] disabled:opacity-70 mt-4"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
}
