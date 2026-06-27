"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Home, 
  ShieldCheck, 
  GraduationCap, 
  Loader2, 
  AlertTriangle, 
  Check, 
  X, 
  Phone, 
  ArrowLeft, 
  FileText 
} from "lucide-react";
import { 
  getProfile, 
  getPendingVerifications, 
  adminVerifyUser, 
  adminRejectUser, 
  getAdminDashboardStats 
} from "@/app/actions/profile-actions";
import { toast } from "react-hot-toast";
import { fadeUp } from "@/lib/animations";

export default function AdminDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [actioningUser, setActioningUser] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null); // userId

  // Loaded image overlay/zoom
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        const profile = await getProfile();
        if (!profile || !profile.is_admin) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        setAuthorized(true);
        await refreshData();
      } catch (err) {
        console.error(err);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuthAndLoad();
  }, []);

  const refreshData = async () => {
    const [statsRes, pendingRes] = await Promise.all([
      getAdminDashboardStats(),
      getPendingVerifications()
    ]);

    if (statsRes.success) setStats(statsRes.stats);
    if (pendingRes.success && pendingRes.users) setPendingUsers(pendingRes.users);
  };

  const handleVerify = async (userId: string) => {
    setActioningUser(userId);
    try {
      const res = await adminVerifyUser(userId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Student verified successfully!");
        await refreshData();
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setActioningUser(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!showRejectModal) return;
    if (!rejectReason.trim()) {
      toast.error("Please enter a reason for rejection");
      return;
    }

    const userId = showRejectModal;
    setActioningUser(userId);
    try {
      const res = await adminRejectUser(userId, rejectReason);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Student verification rejected.");
        setShowRejectModal(null);
        setRejectReason("");
        await refreshData();
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setActioningUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--mist)]">
        <Loader2 className="animate-spin text-[var(--primary)] mb-4" size={48} />
        <p className="font-semibold text-[var(--text-secondary)]">Checking administration credentials...</p>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--mist)] p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-red-950">Access Denied</h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              This area is restricted to Thikana Portal Administrators. Your account does not possess administrator privileges.
            </p>
          </div>
          <button 
            onClick={() => router.push("/")}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold rounded-xl transition-all shadow-md"
          >
            <ArrowLeft size={16} /> Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--mist)] pb-12">
      {/* NAVBAR */}
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
              T
            </div>
            <div>
              <h1 className="font-bold text-[var(--text-primary)] text-lg flex items-center gap-2">
                Admin Dashboard
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase">
                  Staff
                </span>
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">Thikana Portal Management</p>
            </div>
          </div>
          <button 
            onClick={() => router.push("/")}
            className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
          >
            <Home size={16} /> View Portal
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 mt-8 max-w-7xl space-y-8">
        {/* STATS GRID */}
        {stats && (
          <motion.div 
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {/* Total Users */}
            <div className="bg-white rounded-3xl p-6 border border-[var(--border)] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Total Users</p>
                <p className="text-2xl font-black text-[var(--text-primary)]">{stats.totalUsers}</p>
              </div>
            </div>

            {/* Total Listings */}
            <div className="bg-white rounded-3xl p-6 border border-[var(--border)] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                <Home size={24} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Total Listings</p>
                <p className="text-2xl font-black text-[var(--text-primary)]">{stats.totalListings}</p>
              </div>
            </div>

            {/* Verified Students */}
            <div className="bg-white rounded-3xl p-6 border border-[var(--border)] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Verified Students</p>
                <p className="text-2xl font-black text-[var(--text-primary)]">{stats.verifiedStudents}</p>
              </div>
            </div>

            {/* Pending Verifications */}
            <div className="bg-white rounded-3xl p-6 border border-[var(--border)] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                <GraduationCap size={24} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Pending ID Verification</p>
                <p className="text-2xl font-black text-[var(--text-primary)]">{stats.pendingVerifications}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* VERIFICATION PANEL */}
        <section className="bg-white rounded-3xl border border-[var(--border)] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <GraduationCap className="text-[var(--primary)]" size={22} />
              Student ID Verifications
            </h2>
            <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
              {pendingUsers.length} Pending Approval
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-[var(--mist)] text-[var(--text-muted)] rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck size={32} />
              </div>
              <h3 className="font-bold text-[var(--text-primary)]">All Caught Up!</h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
                There are no pending student ID verification requests at the moment.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pendingUsers.map((user) => (
                <div key={user.id} className="p-6 flex flex-col lg:flex-row gap-6">
                  {/* Left: User Info (40%) */}
                  <div className="lg:w-[35%] space-y-4">
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)] text-lg">{user.full_name || "Anonymous User"}</h3>
                      <p className="text-xs text-[var(--text-secondary)]">User ID: {user.id}</p>
                    </div>

                    <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={16} className="text-[var(--text-muted)]" />
                        <span>University: <strong className="text-[var(--text-primary)]">{user.university || "Not provided"}</strong></span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-[var(--text-muted)]" />
                          <span>Phone: <strong className="text-[var(--text-primary)]">{user.phone}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[var(--text-muted)]" />
                        <span>Submitted: <strong className="text-[var(--text-primary)]">{new Date(user.created_at).toLocaleDateString()}</strong></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleVerify(user.id)}
                        disabled={actioningUser !== null}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        {actioningUser === user.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Check size={16} />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectModal(user.id)}
                        disabled={actioningUser !== null}
                        className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </div>
                  </div>

                  {/* Right: Documents side-by-side (65%) */}
                  <div className="lg:w-[65%] grid grid-cols-2 gap-4">
                    {/* Front Image */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">ID Front</p>
                      <div 
                        className="relative rounded-2xl overflow-hidden aspect-[3/2] border border-[var(--border)] cursor-zoom-in group shadow-sm bg-gray-50"
                        onClick={() => setZoomImage(user.id_card_front_url)}
                      >
                        {user.id_card_front_url ? (
                          <>
                            <img src={user.id_card_front_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Front ID" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                              Click to Enlarge
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)]">No Front Image</div>
                        )}
                      </div>
                    </div>

                    {/* Back Image */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">ID Back</p>
                      <div 
                        className="relative rounded-2xl overflow-hidden aspect-[3/2] border border-[var(--border)] cursor-zoom-in group shadow-sm bg-gray-50"
                        onClick={() => setZoomImage(user.id_card_back_url)}
                      >
                        {user.id_card_back_url ? (
                          <>
                            <img src={user.id_card_back_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Back ID" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                              Click to Enlarge
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)]">No Back Image</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* REJECTION MODAL */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-[var(--border)] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Reject Verification</h3>
                <button 
                  onClick={() => { setShowRejectModal(null); setRejectReason(""); }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] block uppercase tracking-wider">
                  Reason for Rejection
                </label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why the document was rejected (e.g. Blurry photo, expired ID card, incorrect name, etc.)"
                  className="w-full p-4 bg-[var(--mist)] border border-[var(--border)] rounded-2xl outline-none focus:border-red-500 transition-colors text-sm text-[var(--text-primary)] font-medium"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowRejectModal(null); setRejectReason(""); }}
                  className="flex-1 py-3 bg-[var(--mist)] hover:bg-[var(--border)] text-[var(--text-primary)] font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={actioningUser !== null}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-md"
                >
                  {actioningUser ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Submit Rejection"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMAGE ZOOM OVERLAY */}
      <AnimatePresence>
        {zoomImage && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setZoomImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center"
            >
              <img 
                src={zoomImage} 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
                alt="Enlarged Document" 
              />
              <button 
                onClick={() => setZoomImage(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
