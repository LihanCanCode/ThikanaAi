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
  FileText,
  MapPin,
  CheckCircle
} from "lucide-react";
import { 
  getProfile, 
  getPendingVerifications, 
  adminVerifyUser, 
  adminRejectUser, 
  getAdminDashboardStats 
} from "@/app/actions/profile-actions";
import { getAllAcceptedRentals } from "@/app/actions/rental-actions";
import { getAdminReports, updateReportStatus, resolveReportWithActions } from "@/app/actions/report-actions";
import { toast } from "react-hot-toast";
import { fadeUp } from "@/lib/animations";

export default function AdminDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [actioningUser, setActioningUser] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null); // userId

  // Report Resolution Modal
  const [showResolveModal, setShowResolveModal] = useState<any>(null); // report object
  const [resolveForm, setResolveForm] = useState({
    deductScore: 0,
    suspendListings: false,
    sendWarning: false,
    terminateContract: false,
    adminNotes: ""
  });

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
    const [statsRes, pendingRes, rentalsRes, reportsRes] = await Promise.all([
      getAdminDashboardStats(),
      getPendingVerifications(),
      getAllAcceptedRentals(),
      getAdminReports()
    ]);

    if (statsRes.success) setStats(statsRes.stats);
    if (pendingRes.success && pendingRes.users) setPendingUsers(pendingRes.users);
    if (rentalsRes.success && rentalsRes.rentals) setRentals(rentalsRes.rentals);
    if (reportsRes.success && reportsRes.reports) setReports(reportsRes.reports);
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

  const handleReportAction = async (reportId: string, status: "reviewed" | "resolved" | "dismissed") => {
    setActioningUser(reportId);
    try {
      const res = await updateReportStatus(reportId, status);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Report marked as ${status}`);
        await refreshData();
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setActioningUser(null);
    }
  };

  const handleResolveSubmit = async () => {
    if (!showResolveModal) return;
    const report = showResolveModal;
    setActioningUser(report.id);
    try {
      const res = await resolveReportWithActions(
        report.id,
        report.owner_id,
        report.reporter_id,
        resolveForm.deductScore,
        resolveForm.suspendListings,
        resolveForm.sendWarning,
        resolveForm.terminateContract,
        resolveForm.adminNotes
      );
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Report resolved and actions executed successfully!");
        setShowResolveModal(null);
        setResolveForm({ deductScore: 0, suspendListings: false, sendWarning: false, terminateContract: false, adminNotes: "" });
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

        {/* ACTIVE RENTALS PANEL */}
        <section className="bg-white rounded-3xl border border-[var(--border)] shadow-sm overflow-hidden mt-8">
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Home className="text-[var(--emerald)]" size={22} />
              Active Rentals Database
            </h2>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              {rentals.length} Total Bookings
            </span>
          </div>

          {rentals.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-[var(--mist)] text-[var(--text-muted)] rounded-full flex items-center justify-center mx-auto">
                <Home size={32} />
              </div>
              <h3 className="font-bold text-[var(--text-primary)]">No Active Rentals</h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
                There are no accepted rental requests in the system yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--mist)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-[var(--border)]">Listing / Property</th>
                    <th className="p-4 font-bold border-b border-[var(--border)]">Tenant (Student)</th>
                    <th className="p-4 font-bold border-b border-[var(--border)]">Landlord / Owner</th>
                    <th className="p-4 font-bold border-b border-[var(--border)]">Status & Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-sm">
                  {rentals.map((rental) => (
                    <tr key={rental.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-[var(--text-primary)]">{rental.listing?.title_en || rental.room_share?.title_en}</div>
                        <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                          <MapPin size={12} /> {rental.listing?.address || rental.room_share?.address}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {rental.student?.full_name ? rental.student.full_name.charAt(0) : "S"}
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--text-primary)]">{rental.student?.full_name || "Unknown"}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{rental.student?.university}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-[var(--text-primary)]">{rental.owner?.full_name || "Unknown"}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{rental.owner?.phone}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          <CheckCircle size={12} /> Booked
                        </span>
                        <div className="text-xs text-[var(--text-muted)] mt-1">
                          {new Date(rental.updated_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* REPORTS AND DISPUTES PANEL */}
        <section className="bg-white rounded-3xl border border-[var(--border)] shadow-sm overflow-hidden mt-8">
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <AlertTriangle className="text-[var(--danger)]" size={22} />
              Tenant Reports & Disputes
            </h2>
            <span className="text-xs font-bold bg-red-100 text-red-800 px-3 py-1 rounded-full">
              {reports.filter(r => r.status === 'pending').length} Action Required
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-[var(--mist)] text-[var(--text-muted)] rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck size={32} />
              </div>
              <h3 className="font-bold text-[var(--text-primary)]">All Clear!</h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
                No active reports or disputes found in the system.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {reports.map((report) => (
                <div key={report.id} className="p-6 flex flex-col lg:flex-row gap-6">
                  {/* Left: Info */}
                  <div className="lg:w-[70%] space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        report.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        report.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        report.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {report.severity.toUpperCase()} SEVERITY
                      </span>
                      <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        {report.category}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-[var(--text-primary)] bg-[var(--mist)] p-4 rounded-xl border border-[var(--border)]">
                      "{report.description}"
                    </p>

                    <div className="flex items-center gap-6 mt-4 pt-2">
                      <div className="text-sm">
                        <span className="text-xs text-[var(--text-muted)] block mb-1">Reported By (Tenant)</span>
                        <div className="font-semibold text-[var(--text-primary)]">{report.reporter?.full_name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{report.reporter?.phone}</div>
                      </div>
                      <div className="w-px h-10 bg-[var(--border)]"></div>
                      <div className="text-sm">
                        <span className="text-xs text-[var(--text-muted)] block mb-1">Target Owner</span>
                        <div className="font-semibold text-[var(--text-primary)]">{report.owner?.full_name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{report.owner?.phone}</div>
                      </div>
                      <div className="w-px h-10 bg-[var(--border)]"></div>
                      <div className="text-sm">
                        <span className="text-xs text-[var(--text-muted)] block mb-1">Property</span>
                        <div className="font-semibold text-[var(--text-primary)] truncate max-w-[150px]">{report.target_title || "Unknown Property"}</div>
                        <div className="text-xs text-[var(--text-secondary)] uppercase">{report.target_type.replace('_', ' ')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="lg:w-[30%] flex flex-col gap-2 justify-center border-l border-[var(--border)] pl-6">
                    {report.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => setShowResolveModal(report)}
                          disabled={actioningUser !== null}
                          className="w-full bg-[var(--danger)] hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all"
                        >
                          Take Action & Resolve
                        </button>
                        <button
                          onClick={() => handleReportAction(report.id, "dismissed")}
                          disabled={actioningUser !== null}
                          className="w-full bg-[var(--mist)] hover:bg-[var(--border)] text-[var(--text-primary)] font-bold py-2.5 px-4 rounded-xl transition-all"
                        >
                          Dismiss Report
                        </button>
                        <p className="text-xs text-center text-[var(--text-muted)] mt-2">
                          Note: Critical/High severity automatically applies a trust score penalty.
                        </p>
                      </>
                    ) : (
                      <div className="text-center p-4 bg-[var(--mist)] rounded-xl border border-[var(--border)] flex flex-col items-center justify-center h-full">
                        <div className="font-bold text-[var(--text-primary)] mb-1">
                          Status: {report.status.toUpperCase()}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          Handled on {new Date(report.updated_at).toLocaleDateString()}
                        </div>
                        {report.admin_notes && (
                          <div className="w-full text-left text-xs bg-white p-3 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] mt-3">
                            <span className="font-bold text-[var(--text-primary)] block mb-1">Admin Notes:</span>
                            {report.admin_notes}
                          </div>
                        )}
                      </div>
                    )}
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

      {/* REPORT RESOLUTION MODAL */}
      <AnimatePresence>
        {showResolveModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full border border-[var(--border)] shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--danger)] flex items-center gap-2">
                  <ShieldCheck size={20} /> Resolve Report
                </h3>
                <button 
                  onClick={() => setShowResolveModal(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-[var(--mist)] p-4 rounded-xl border border-[var(--border)] mb-6 text-sm">
                <p className="font-bold text-[var(--text-primary)] mb-1">Target Owner: {showResolveModal.owner?.full_name}</p>
                <p className="text-[var(--text-secondary)]">AI Severity: <strong className="uppercase">{showResolveModal.severity}</strong></p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-[var(--text-primary)] mb-1 block">Manual Trust Score Penalty</label>
                  <p className="text-xs text-[var(--text-muted)] mb-2">Deduct points from all properties owned by this landlord.</p>
                  <input 
                    type="number" 
                    min="0" max="100"
                    value={resolveForm.deductScore}
                    onChange={(e) => setResolveForm({ ...resolveForm, deductScore: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 bg-white border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] text-sm"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-[var(--border)] rounded-xl">
                  <div>
                    <label className="text-sm font-bold text-[var(--text-primary)] block">Suspend Properties</label>
                    <p className="text-xs text-[var(--text-muted)]">Hide all listings from the public feed.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-[var(--danger)]"
                    checked={resolveForm.suspendListings}
                    onChange={(e) => setResolveForm({ ...resolveForm, suspendListings: e.target.checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-[var(--border)] rounded-xl">
                  <div>
                    <label className="text-sm font-bold text-[var(--text-primary)] block">Issue Official Warning</label>
                    <p className="text-xs text-[var(--text-muted)]">Send a system notification to the landlord.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-[var(--primary)]"
                    checked={resolveForm.sendWarning}
                    onChange={(e) => setResolveForm({ ...resolveForm, sendWarning: e.target.checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-[var(--border)] rounded-xl">
                  <div>
                    <label className="text-sm font-bold text-[var(--text-primary)] block">Terminate Contract</label>
                    <p className="text-xs text-[var(--text-muted)]">Cancel the tenant's current rental immediately.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-[var(--danger)]"
                    checked={resolveForm.terminateContract}
                    onChange={(e) => setResolveForm({ ...resolveForm, terminateContract: e.target.checked })}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[var(--text-primary)] mb-1 block">Admin Resolution Notes</label>
                  <textarea
                    rows={3}
                    value={resolveForm.adminNotes}
                    onChange={(e) => setResolveForm({ ...resolveForm, adminNotes: e.target.value })}
                    placeholder="E.g. Called landlord, applied 10 pt penalty."
                    className="w-full p-3 bg-white border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-2 border-t border-[var(--border)]">
                <button
                  onClick={() => setShowResolveModal(null)}
                  className="flex-1 py-3 bg-[var(--mist)] hover:bg-[var(--border)] text-[var(--text-primary)] font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveSubmit}
                  disabled={actioningUser !== null}
                  className="flex-1 py-3 bg-[var(--danger)] hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
                >
                  {actioningUser ? <Loader2 className="animate-spin" size={18} /> : <>Execute Actions <CheckCircle size={18} /></>}
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
