"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserCircle, MapPin, Phone, Loader2, Save, GraduationCap, UploadCloud, ShieldCheck, AlertCircle } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { getProfile, updateProfile, verifyStudentIdCard } from "@/app/actions/profile-actions";
import { toast } from "react-hot-toast";
import { fadeUp } from "@/lib/animations";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    university: "",
    phone: "",
  });

  // Verification states
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const p = await getProfile();
      if (p) {
        setProfile(p);
        setFormData({
          full_name: p.full_name || "",
          university: p.university || "",
          phone: p.phone || "",
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
        // Refresh local profile state
        const p = await getProfile();
        if (p) setProfile(p);
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVerifying(true);
    setVerificationError(null);

    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await verifyStudentIdCard(base64, file.type);
        if (res.success) {
          toast.success("Student ID verified successfully!");
          const p = await getProfile();
          if (p) {
            setProfile(p);
            setFormData(prev => ({
              ...prev,
              university: p.university || prev.university
            }));
          }
        } else {
          setVerificationError(res.error || "Verification failed. The card could not be validated.");
          toast.error(res.error || "Verification failed");
        }
      } catch (err: any) {
        setVerificationError(err.message || "An unexpected error occurred during OCR validation.");
        toast.error("Verification failed");
      } finally {
        setVerifying(false);
      }
    };
    reader.onerror = () => {
      setVerificationError("Failed to read the uploaded image file.");
      setVerifying(false);
    };
  };

  return (
    <div className="min-h-screen bg-[var(--mist)]">
      <Navbar />
      
      <main className="container mx-auto px-6 py-12 md:py-20 max-w-5xl">
        <div className={`grid gap-8 ${profile?.role === "student" ? "md:grid-cols-2" : "max-w-lg mx-auto"}`}>
          
          {/* PROFILE FORM */}
          <motion.div 
            variants={fadeUp} 
            initial="hidden" 
            animate="show"
            className="w-full bg-white rounded-3xl p-8 shadow-[var(--shadow-md)] border border-[var(--border)] h-fit"
          >
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--border)]">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                  <UserCircle size={32} />
                </div>
                {profile?.verified && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white" title="Verified Student">
                    <ShieldCheck size={16} />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  My Profile
                  {profile?.verified && (
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <ShieldCheck size={10} /> Verified
                    </span>
                  )}
                </h1>
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

          {/* STUDENT VERIFICATION CARD */}
          {profile?.role === "student" && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="bg-white rounded-3xl p-8 shadow-[var(--shadow-md)] border border-[var(--border)] flex flex-col h-fit"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border)]">
                <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Student ID Verification</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Earn your Verified Student badge</p>
                </div>
              </div>

              {profile.verified ? (
                <div className="bg-[var(--mint)] border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                    <ShieldCheck size={36} />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-800 text-lg">Verified Student Profile</h3>
                    <p className="text-sm text-emerald-700 mt-1">
                      Your university affiliation at <strong>{profile.university}</strong> has been verified.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Upload your official student ID card. Our AI will automatically perform OCR extraction to verify your name, university affiliation, and card validity instantly.
                  </p>

                  {verifying ? (
                    <div className="border-2 border-dashed border-[var(--primary)] bg-[var(--bg-subtle)] rounded-2xl p-8 text-center space-y-3">
                      <Loader2 className="animate-spin text-[var(--primary)] mx-auto" size={32} />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">AI processing student ID...</p>
                      <p className="text-xs text-[var(--text-secondary)]">Reading credentials, validating status</p>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] bg-[var(--bg-subtle)] hover:bg-[var(--primary-light)] rounded-2xl p-8 text-center block cursor-pointer transition-all group">
                      <UploadCloud className="text-[var(--text-muted)] group-hover:text-[var(--primary)] mx-auto mb-3 transition-colors" size={40} />
                      <span className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                        Upload ID Card Image
                      </span>
                      <span className="block text-xs text-[var(--text-secondary)] mt-1">
                        PNG, JPG, or JPEG (max 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleIdUpload}
                      />
                    </label>
                  )}

                  {verificationError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800">
                      <AlertCircle size={20} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">Verification Failed</p>
                        <p className="text-xs mt-0.5">{verificationError}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
