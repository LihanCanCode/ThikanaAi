"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserCircle, MapPin, Phone, Loader2, Save, GraduationCap, UploadCloud, ShieldCheck, AlertCircle } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { getProfile, updateProfile, submitIdCardsForVerification } from "@/app/actions/profile-actions";
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
  const [submitting, setSubmitting] = useState(false);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [frontExt, setFrontExt] = useState<string>("");
  const [backExt, setBackExt] = useState<string>("");

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
        const p = await getProfile();
        if (p) setProfile(p);
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop() || "jpg";
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (side === "front") {
        setFrontImage(reader.result as string);
        setFrontExt(ext);
      } else {
        setBackImage(reader.result as string);
        setBackExt(ext);
      }
    };
  };

  const handleVerificationSubmit = async () => {
    if (!frontImage || !backImage) return;
    setSubmitting(true);
    try {
      const res = await submitIdCardsForVerification(frontImage, backImage, frontExt, backExt);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Documents submitted successfully for admin review!");
        setFrontImage(null);
        setBackImage(null);
        setFrontExt("");
        setBackExt("");
        const p = await getProfile();
        if (p) setProfile(p);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit documents");
    } finally {
      setSubmitting(false);
    }
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
              className="bg-white rounded-3xl p-8 shadow-[var(--shadow-md)] border border-[var(--border)] flex flex-col h-fit animate-fade-in"
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

              {profile.verification_status === "verified" || profile.verified ? (
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
              ) : profile.verification_status === "pending" ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
                    <GraduationCap size={36} />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-800 text-lg">Verification Pending Review</h3>
                    <p className="text-sm text-amber-700 mt-2 leading-relaxed">
                      Your front and back student ID card documents have been uploaded successfully. Our administration team is manually reviewing your details.
                    </p>
                    <p className="text-xs text-amber-600 mt-1 font-semibold">We will update your badge status shortly.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {profile.verification_status === "rejected" && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-800 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <AlertCircle size={18} />
                        Verification Rejected
                      </div>
                      <p className="text-xs leading-relaxed">
                        Reason: <strong className="underline">{profile.verification_reject_reason || "Invalid documents submitted."}</strong>
                      </p>
                      <p className="text-[0.7rem] text-red-600 font-medium">Please upload clear, valid front and back photos to submit again.</p>
                    </div>
                  )}

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Upload clear photos of the <strong>front</strong> and <strong>back</strong> of your university student ID card. An administrator will manually review and verify your affiliation to grant your badge.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {/* FRONT ID */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[var(--text-secondary)] block uppercase tracking-wider">
                        Front Side
                      </label>
                      {frontImage ? (
                        <div className="relative group rounded-2xl overflow-hidden aspect-[3/2] border border-[var(--border)] shadow-sm">
                          <img src={frontImage} className="w-full h-full object-cover" alt="Front Preview" />
                          <button 
                            type="button"
                            onClick={() => { setFrontImage(null); setFrontExt(""); }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md active:scale-95 transition-all text-xs"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] bg-[var(--bg-subtle)] hover:bg-[var(--primary-light)] rounded-2xl p-4 text-center block cursor-pointer transition-all aspect-[3/2] flex flex-col items-center justify-center group">
                          <UploadCloud className="text-[var(--text-muted)] group-hover:text-[var(--primary)] mb-1 transition-colors" size={24} />
                          <span className="font-bold text-[11px] text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                            Upload Front
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageSelect(e, "front")}
                          />
                        </label>
                      )}
                    </div>

                    {/* BACK ID */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[var(--text-secondary)] block uppercase tracking-wider">
                        Back Side
                      </label>
                      {backImage ? (
                        <div className="relative group rounded-2xl overflow-hidden aspect-[3/2] border border-[var(--border)] shadow-sm">
                          <img src={backImage} className="w-full h-full object-cover" alt="Back Preview" />
                          <button 
                            type="button"
                            onClick={() => { setBackImage(null); setBackExt(""); }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md active:scale-95 transition-all text-xs"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] bg-[var(--bg-subtle)] hover:bg-[var(--primary-light)] rounded-2xl p-4 text-center block cursor-pointer transition-all aspect-[3/2] flex flex-col items-center justify-center group">
                          <UploadCloud className="text-[var(--text-muted)] group-hover:text-[var(--primary)] mb-1 transition-colors" size={24} />
                          <span className="font-bold text-[11px] text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                            Upload Back
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageSelect(e, "back")}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerificationSubmit}
                    disabled={submitting || !frontImage || !backImage}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold rounded-xl transition-all shadow-[var(--shadow-sm)] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    {submitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <GraduationCap size={18} />
                    )}
                    {submitting ? "Submitting..." : "Submit for Review"}
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
