"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { User } from "@supabase/supabase-js";
import { Home, Search, PlusCircle, LayoutDashboard, Menu, X, Users, LogOut, ChevronDown, Bell, CheckCircle, XCircle, Loader2, GraduationCap, Phone, Wrench, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/auth/actions";
import { getPendingFlicks } from "@/app/student/flatmate-actions";
import type { PendingFlick } from "@/app/student/flatmate-actions";
import type { UserRole } from "@/types";
import { UNIVERSITIES } from "@/lib/utils";
import { getNotifications, markNotificationsRead, acceptConnection, rejectConnection, deleteNotification } from "@/app/actions/chat-actions";
import type { Notification } from "@/app/actions/chat-actions";
import { MessageCircle } from "lucide-react";

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function getDashboardHref(role: UserRole | string | undefined) {
  if (role === "landlord") return "/landlord/dashboard";
  if (role === "student") return "/student/feed";
  return "/listings";
}

// ── Notification Bell ────────────────────────────────────────────
function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [flicks, setFlicks] = useState<PendingFlick[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<Record<string, "loading" | "accepted" | "declined" | "error">>({});
  const [revealedContact, setRevealedContact] = useState<Record<string, string>>({});
  const [flickThreadIds, setFlickThreadIds] = useState<Record<string, string>>({});
  const [selectedFlick, setSelectedFlick] = useState<PendingFlick | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const loadAll = useCallback(async () => {
    try {
      const [fData, nData] = await Promise.all([
        getPendingFlicks(),
        getNotifications()
      ]);
      setFlicks(fData as PendingFlick[]);
      setNotifications(nData as Notification[]);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    
    const supabase = createClient();
    
    // Supabase Realtime Subscription for instant notifications
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          // Refresh data instantly when a notification changes
          loadAll();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'flatmate_flicks' },
        () => {
          // Refresh data instantly when a flick request comes in
          loadAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    // Mark general notifications as read when bell is clicked
    markNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleAction = async (flickId: string, status: "accepted" | "declined") => {
    setActionState((prev) => ({ ...prev, [flickId]: "loading" }));
    try {
      const res = await fetch("/student/flick-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flickId, status })
      });
      const result = await res.json();
      
      if (!res.ok || result.error) {
        setActionState((prev) => ({ ...prev, [flickId]: "error" }));
        return;
      }
      
      setActionState((prev) => ({ ...prev, [flickId]: status }));
      if (status === "accepted") {
        if (result.contactInfo) setRevealedContact((prev) => ({ ...prev, [flickId]: result.contactInfo as string }));
        if (result.threadId) setFlickThreadIds((prev) => ({ ...prev, [flickId]: result.threadId as string }));
      }
      
      if (status === "declined") {
        setTimeout(() => {
          setFlicks((prev) => prev.filter((f) => f.id !== flickId));
          if (selectedFlick?.id === flickId) setSelectedFlick(null);
        }, 3000);
      }
    } catch (e) {
      setActionState((prev) => ({ ...prev, [flickId]: "error" }));
    }
  };

  const handleConnectionAction = async (notifId: string, threadId: string, status: "accepted" | "declined") => {
    setActionState((prev) => ({ ...prev, [notifId]: "loading" }));
    try {
      let res;
      if (status === "accepted") {
        res = await acceptConnection(threadId);
      } else {
        res = await rejectConnection(threadId);
      }
      
      if (res?.error) {
        setActionState((prev) => ({ ...prev, [notifId]: "error" }));
        return;
      }
      
      setActionState((prev) => ({ ...prev, [notifId]: status }));
      
      if (status === "accepted") {
        setTimeout(() => {
          setOpen(false);
          window.location.href = `/chat?threadId=${threadId}`;
        }, 1000);
      } else {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== notifId));
        }, 2000);
      }
    } catch (e) {
      setActionState((prev) => ({ ...prev, [notifId]: "error" }));
    }
  };

  const handleDeleteNotif = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification(id);
    } catch (e) {
      console.error(e);
    }
  };

  const unreadDbCount = notifications.filter(n => !n.read).length;
  const pendingCount = flicks.length + unreadDbCount;

  return (
    <div ref={bellRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label={`Notifications${pendingCount > 0 ? ` (${pendingCount} new)` : ""}`}
        style={{
          position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 40, height: 40, borderRadius: "50%",
          border: "1px solid var(--border)",
          background: open ? "var(--primary-xlight)" : "var(--bg-surface)",
          cursor: "pointer", transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = open ? "var(--primary-xlight)" : "var(--bg-surface)")}
      >
        <Bell size={17} color={open ? "var(--primary)" : "var(--text-secondary)"} />
        {pendingCount > 0 && (
          <span style={{
            position: "absolute", top: 5, right: 5,
            width: 8, height: 8, borderRadius: "50%",
            background: "var(--accent)", border: "2px solid #fff",
            animation: "pulse 1.5s infinite",
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 10px)",
          width: "340px", background: "var(--bg-surface)",
          border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
          zIndex: 300, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "0.9rem 1.1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "7px" }}>
              <Bell size={15} style={{ color: "var(--primary)" }} /> Notifications
            </span>
            {pendingCount > 0 && (
              <span style={{ background: "var(--accent)", color: "#fff", fontSize: "0.65rem", fontWeight: 800, padding: "2px 7px", borderRadius: "999px" }}>
                {pendingCount} new
              </span>
            )}
          </div>

          {/* Body */}
          <div style={{ maxHeight: "420px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} />
              </div>
            ) : flicks.length === 0 && notifications.length === 0 ? (
              <div style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔔</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>No notifications yet</div>
              </div>
            ) : (
              <>
                {/* 1. General notifications (e.g. Connection requests, identity verification status) */}
                {notifications.map((notif) => {
                  const isConnectionReq = notif.type === "connection_request";
                  
                  // Parse params
                  const queryStr = notif.link?.split("?")[1] || "";
                  const threadId = queryStr.split("threadId=")[1]?.split("&")[0] || "";
                  const senderId = queryStr.split("senderId=")[1]?.split("&")[0] || "";
                  const state = actionState[notif.id];

                  const content = (
                    <div style={{ 
                      padding: "0.9rem 1rem", 
                      borderBottom: "1px solid var(--border)", 
                      background: notif.read ? "transparent" : "var(--primary-xlight)", 
                      transition: "background 0.15s ease",
                      position: "relative"
                    }}>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteNotif(notif.id); }}
                        style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", zIndex: 10 }}
                        aria-label="Delete notification"
                      >
                        <X size={14} />
                      </button>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "4px", paddingRight: "20px" }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: isConnectionReq ? "10px" : "0" }}>
                        {notif.message}
                      </div>
                      
                      {isConnectionReq && (
                        <div>
                          {state === "accepted" ? (
                            <div style={{ fontSize: "0.78rem", color: "var(--success)", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                              <CheckCircle size={13} /> Connection Request Accepted!
                            </div>
                          ) : state === "declined" ? (
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                              <XCircle size={13} /> Connection Request Declined
                            </div>
                          ) : state === "error" ? (
                            <div style={{ fontSize: "0.78rem", color: "var(--accent)", fontWeight: 700 }}>
                              Error occurred. Try again.
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                              <button
                                type="button"
                                onClick={() => handleConnectionAction(notif.id, threadId, "declined")}
                                style={{ flex: 1, padding: "6px", fontSize: "0.75rem", fontWeight: 700, borderRadius: "6px", border: "1px solid var(--border)", background: "#fff", cursor: "pointer", color: "var(--text-secondary)" }}
                              >
                                Decline
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConnectionAction(notif.id, threadId, "accepted")}
                                style={{ flex: 1, padding: "6px", fontSize: "0.75rem", fontWeight: 700, borderRadius: "6px", border: "none", background: "var(--primary)", color: "#fff", cursor: "pointer" }}
                              >
                                {state === "loading" ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : "Accept"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );

                  if (isConnectionReq) {
                    return <div key={notif.id}>{content}</div>;
                  }

                  return (
                    <Link
                      href={notif.link || "/chat"}
                      onClick={() => setOpen(false)}
                      key={notif.id}
                      style={{ textDecoration: "none" }}
                    >
                      {content}
                    </Link>
                  );
                })}

                {/* 2. Team-Up / Flick Requests */}
                {flicks.map((flick) => {
                  const sender = (flick as any).sender_profile;
                  const senderName = sender?.name ?? "A student";
                  const senderAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${flick.from_user_id}`;
                  const senderUniv = UNIVERSITIES.find((u) => u.id === sender?.university)?.short_name ?? "";
                  const senderProfileData = sender?.profile_data ?? {};
                  const contact = revealedContact[flick.id];
                  const state = actionState[flick.id];

                  return (
                    <div key={flick.id} style={{ padding: "0.9rem 1rem", borderBottom: "1px solid var(--border)" }}>
                      {/* Sender info */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <img src={senderAvatar} alt="" style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid var(--primary-light)" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.87rem", color: "var(--text-primary)" }}>{senderName}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                            {senderUniv && <><GraduationCap size={11} style={{ color: "var(--primary)" }} /> {senderUniv} · </>}
                            {senderProfileData?.sleep_schedule === "early_bird" ? "🌅 Early Bird" : senderProfileData?.sleep_schedule === "night_owl" ? "🦉 Night Owl" : "😌 Flexible"}
                          </div>
                        </div>
                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          wants to team up
                        </span>
                      </div>

                      {/* Contact revealed after accept */}
                      {contact && (
                        <div style={{ background: "var(--primary-xlight)", border: "1px solid var(--primary-light)", borderRadius: "8px", padding: "8px 12px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Phone size={13} style={{ color: "var(--primary)", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>Contact Info Revealed</div>
                            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--primary)" }}>{contact}</div>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {state === "accepted" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ fontSize: "0.78rem", color: "var(--success)", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                            <CheckCircle size={13} /> Accepted! {!contact && "Contact info not provided"}
                          </div>
                          {flickThreadIds[flick.id] && (
                            <Link href={`/chat?threadId=${flickThreadIds[flick.id]}`} onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", padding: "6px", background: "var(--primary)", color: "#fff", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, textDecoration: "none" }}>
                              <MessageCircle size={12} /> Chat
                            </Link>
                          )}
                        </div>
                      ) : state === "declined" ? (
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Declined</div>
                      ) : (
                        <button
                          onClick={() => { setSelectedFlick(flick); setOpen(false); }}
                          style={{
                            width: "100%", padding: "6px", borderRadius: "8px", border: "1px solid var(--border)",
                            background: "var(--bg-surface)", color: "var(--primary)",
                            fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "5px",
                            fontFamily: "inherit", transition: "all 0.15s ease",
                            justifyContent: "center"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-xlight)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
                        >
                          <Search size={12} /> View Profile
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "0.7rem 1rem", borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
            <Link href="/student/feed" onClick={() => setOpen(false)} style={{ fontSize: "0.78rem", color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
              View all Team-Up profiles →
            </Link>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {selectedFlick && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", zIndex: 99999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
        }}>
          <div style={{
            background: "var(--bg-base)", width: "100%", maxWidth: "500px",
            borderRadius: "var(--radius-xl)", overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            maxHeight: "90vh", display: "flex", flexDirection: "column"
          }}>
            {/* Modal Header */}
            <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>Team-Up Request</h3>
              <button onClick={() => setSelectedFlick(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.5rem", overflowY: "auto", background: "#fff", flex: 1 }}>
              {(() => {
                const sender = (selectedFlick as any).sender_profile;
                const senderName = sender?.name ?? "Student";
                const senderAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedFlick.from_user_id}`;
                const senderUniv = UNIVERSITIES.find((u) => u.id === sender?.university)?.short_name ?? "";
                const data = sender?.profile_data ?? {};
                const state = actionState[selectedFlick.id];
                const contact = revealedContact[selectedFlick.id];

                return (
                  <>
                    <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                      <img src={senderAvatar} alt="" style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid var(--primary-light)" }} />
                      <div>
                        <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)" }}>{senderName}</h2>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                          {senderUniv && <><GraduationCap size={14} style={{ color: "var(--primary)" }} /> {senderUniv}</>}
                        </div>
                        {data.budget_max && (
                          <div style={{ marginTop: "0.4rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", background: "var(--bg-muted)", display: "inline-block", padding: "2px 8px", borderRadius: "6px" }}>
                            Budget: ৳{(data.budget_min as number ?? 0).toLocaleString()} - ৳{(data.budget_max as number).toLocaleString()}/mo
                          </div>
                        )}
                      </div>
                    </div>

                    {/* About section */}
                    {data.self_description && (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 800, marginBottom: "0.5rem" }}>About</h4>
                        <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.5 }}>"{data.self_description}"</p>
                      </div>
                    )}

                    {/* Preferences Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>Sleep Schedule</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-primary)" }}>
                          {data.sleep_schedule === "early_bird" ? "🌅 Early Bird" : data.sleep_schedule === "night_owl" ? "🦉 Night Owl" : "😌 Flexible"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>Smoking</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-primary)" }}>
                          {data.smoking === "non_smoker" ? "🚭 Non-Smoker" : "🚬 Smoker"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>Cleanliness</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-primary)" }}>
                          {data.cleanliness === "spotless" ? "✨ Very Tidy" : data.cleanliness === "relaxed" ? "😅 Relaxed" : "🙂 Reasonable"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>Social Style</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-primary)" }}>
                          {data.social_style === "quiet" ? "🤫 Quiet" : data.social_style === "outgoing" ? "🎉 Outgoing" : "⚖️ Balanced"}
                        </div>
                      </div>
                    </div>

                    {/* Contact or Actions */}
                    {contact || flickThreadIds[selectedFlick.id] ? (
                      <div>
                        {contact && (
                          <div style={{ background: "var(--primary-xlight)", border: "2px solid var(--primary-light)", borderRadius: "12px", padding: "1rem", textAlign: "center", marginBottom: flickThreadIds[selectedFlick.id] ? "12px" : "0" }}>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "0.5rem" }}>Match Accepted! Contact Info:</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                              <Phone size={20} /> {contact}
                            </div>
                          </div>
                        )}
                        {flickThreadIds[selectedFlick.id] && (
                          <Link href={`/chat?threadId=${flickThreadIds[selectedFlick.id]}`} onClick={() => { setSelectedFlick(null); setOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", background: "var(--primary)", color: "#fff", borderRadius: "12px", fontSize: "1rem", fontWeight: 800, textDecoration: "none", width: "100%" }}>
                            <MessageCircle size={18} /> Open Chat
                          </Link>
                        )}
                      </div>
                    ) : (selectedFlick as any).is_connection_request ? (
                      <div>
                        {state === "accepted" ? (
                          <div style={{ textAlign: "center", padding: "1rem", color: "var(--success)", fontWeight: 700 }}>
                            <CheckCircle size={24} style={{ marginBottom: "8px" }} /><br/>
                            Connection Request Accepted! Redirecting to chat...
                          </div>
                        ) : state === "declined" ? (
                          <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontWeight: 700 }}>
                            <XCircle size={24} style={{ marginBottom: "8px" }} /><br/>
                            Request Declined
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "12px" }}>
                            <button
                              onClick={() => {
                                handleConnectionAction(selectedFlick.id, (selectedFlick as any).threadId, "declined");
                                setSelectedFlick(null);
                              }}
                              disabled={state === "loading"}
                              style={{
                                flex: 1, padding: "12px", borderRadius: "var(--radius)",
                                border: "2px solid var(--border)", background: "#fff",
                                color: "var(--text-secondary)", fontWeight: 700, fontSize: "1rem", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                              }}
                            >
                              <XCircle size={18} /> Decline
                            </button>
                            <button
                              onClick={() => handleConnectionAction(selectedFlick.id, (selectedFlick as any).threadId, "accepted")}
                              disabled={state === "loading"}
                              style={{
                                flex: 1, padding: "12px", borderRadius: "var(--radius)",
                                border: "none", background: "var(--primary)",
                                color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                              }}
                            >
                              {state === "loading" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <><CheckCircle size={18} /> Accept & Chat</>}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : state === "accepted" && !contact ? (
                      <div style={{ textAlign: "center", padding: "1rem", color: "var(--success)", fontWeight: 700 }}>
                        <CheckCircle size={24} style={{ marginBottom: "8px" }} /><br/>
                        Accepted! But they didn't provide contact info.
                      </div>
                    ) : state === "declined" ? (
                      <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontWeight: 700 }}>
                        <XCircle size={24} style={{ marginBottom: "8px" }} /><br/>
                        Request Declined
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          onClick={() => handleAction(selectedFlick.id, "declined")}
                          disabled={state === "loading"}
                          style={{
                            flex: 1, padding: "12px", borderRadius: "var(--radius)",
                            border: "2px solid var(--border)", background: "#fff",
                            color: "var(--text-secondary)", fontWeight: 700, fontSize: "1rem", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                          }}
                        >
                          {state === "loading" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <><XCircle size={18} /> Decline</>}
                        </button>
                        <button
                          onClick={() => handleAction(selectedFlick.id, "accepted")}
                          disabled={state === "loading"}
                          style={{
                            flex: 1, padding: "12px", borderRadius: "var(--radius)",
                            border: "none", background: "var(--primary)",
                            color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                          }}
                        >
                          {state === "loading" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <><CheckCircle size={18} /> Accept Match</>}
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
    </div>
  );
}



// ── Main Navbar ──────────────────────────────────────────────────
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileRole, setProfileRole] = useState<UserRole | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => setUser(currentUser));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setUserMenuOpen(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setProfileRole(null); setProfileName(null); return; }
    const supabase = createClient();
    supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setProfileRole(data.role as UserRole); setProfileName(data.full_name); }
    });
  }, [user]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!toolsMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) setToolsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [toolsMenuOpen]);

  const fullName = profileName ?? (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "User";
  const email = user?.email ?? "";
  const role = profileRole ?? (user?.user_metadata?.role as UserRole | undefined) ?? "student";
  const initials = getInitials(fullName);
  const dashboardHref = getDashboardHref(role);

  return (
    <header style={{
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100,
    }}>
      <nav className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, background: "var(--primary)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Home size={18} color="#fff" />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--primary)" }}>Thikana</span>
            <span className="bangla" style={{ display: "block", fontSize: "0.65rem", color: "var(--text-muted)", lineHeight: 1, marginTop: "-2px" }}>ঠিকানা</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="desktop-nav">
          <NavLink href="/listings" icon={<Search size={15} />}>Student Rent</NavLink>
          <NavLink href="/listings/family" icon={<Search size={15} />}>Family Rent</NavLink>
          {(!role || role === "student") && (
            <NavLink href="/flatmates" icon={<Users size={15} />}>Find Flatmates</NavLink>
          )}
          {role !== "student" && (
            <>
              <NavLink href="/listings/new" icon={<PlusCircle size={15} />}>List Property</NavLink>
              <NavLink href="/landlord/dashboard" icon={<LayoutDashboard size={15} />}>Dashboard</NavLink>
            </>
          )}
          {(!role || role === "student") && (
            <NavLink href="/student/finance">Finance</NavLink>
          )}
          
          {/* Tools Menu */}
          <div ref={toolsMenuRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setToolsMenuOpen((prev) => !prev)}
              style={{
                display: "flex", alignItems: "center", gap: "5px", padding: "0.4rem 0.75rem", 
                borderRadius: "var(--radius-full)", color: "var(--text-secondary)", 
                background: toolsMenuOpen ? "var(--bg-subtle)" : "transparent",
                border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--primary)"; }}
              onMouseLeave={(e) => { if(!toolsMenuOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
            >
              <Wrench size={15} /> Tools <ChevronDown size={12} style={{ transform: toolsMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }} />
            </button>
            {toolsMenuOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: "180px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", padding: "0.5rem", zIndex: 200 }}>
                <Link href="/listings/estimate" onClick={() => setToolsMenuOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0.65rem 0.85rem", borderRadius: "var(--radius-md)", color: "var(--text-primary)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Rent Estimator
                </Link>
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 4px" }} />

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* 🔔 Notification Bell — only for students with a profile */}
              {(role === "student" || !role) && <NotificationBell userId={user.id} />}
              
              {/* 💬 Direct Chat Link */}
              <Link
                href="/chat"
                aria-label="Chat"
                style={{
                  position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 40, height: 40, borderRadius: "50%",
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
              >
                <MessageCircle size={17} color="var(--text-secondary)" />
              </Link>

              {/* User Menu */}
              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "4px 8px 4px 4px", borderRadius: "var(--radius-full)",
                    border: `1px solid ${userMenuOpen ? "var(--primary)" : "var(--border)"}`,
                    background: userMenuOpen ? "var(--primary-xlight)" : "var(--bg-surface)",
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "border-color 0.15s ease, background 0.15s ease",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>
                    {initials}
                  </div>
                  <ChevronDown size={14} style={{ color: "var(--text-muted)", transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }} />
                </button>

                {userMenuOpen && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: "260px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg, 0 10px 40px rgba(0,0,0,0.12))", padding: "0.5rem", zIndex: 200 }}>
                    <div style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "2px" }}>{fullName}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "6px" }}>{email}</div>
                      <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--primary-xlight)", color: "var(--primary)", textTransform: "capitalize" }}>
                        {role}
                      </span>
                    </div>
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0.65rem 0.85rem", borderRadius: "var(--radius-md)", color: "var(--text-primary)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <UserCircle size={16} /> My Profile
                    </Link>
                    {role !== "student" && (
                      <Link href={dashboardHref} onClick={() => setUserMenuOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0.65rem 0.85rem", borderRadius: "var(--radius-md)", color: "var(--text-primary)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>
                    )}
                    <form action={logout}>
                      <button type="submit" style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "0.65rem 0.85rem", borderRadius: "var(--radius-md)", border: "none", background: "transparent", color: "#DC2626", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-outline" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>Sign In</Link>
              <Link href="/auth/signup" className="btn btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="mobile-menu-btn" style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", color: "var(--text-primary)" }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)", padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <MobileNavLink href="/listings" onClick={() => setOpen(false)}>🎓 Student Rent</MobileNavLink>
          <MobileNavLink href="/listings/family" onClick={() => setOpen(false)}>🏠 Family Rent</MobileNavLink>
          {(!role || role === "student") && (
            <MobileNavLink href="/flatmates" onClick={() => setOpen(false)}>🤝 Find Flatmates</MobileNavLink>
          )}
          {role !== "student" && (
            <>
              <MobileNavLink href="/listings/new" onClick={() => setOpen(false)}>➕ List Property</MobileNavLink>
              <MobileNavLink href="/landlord/dashboard" onClick={() => setOpen(false)}>📊 Dashboard</MobileNavLink>
            </>
          )}
          {(!role || role === "student") && (
            <MobileNavLink href="/student/finance" onClick={() => setOpen(false)}>Finance Tools</MobileNavLink>
          )}
          <MobileNavLink href="/listings/estimate" onClick={() => setOpen(false)}>🧮 Rent Estimator</MobileNavLink>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "0.5rem 0" }} />

          {user ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0.65rem 0.75rem", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{fullName}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{email}</div>
                </div>
              </div>
              <MobileNavLink href="/profile" onClick={() => setOpen(false)}>👤 My Profile</MobileNavLink>
              <MobileNavLink href="/alerts" onClick={() => setOpen(false)}>🔔 My Alerts</MobileNavLink>
              {role !== "student" && (
                <MobileNavLink href={dashboardHref} onClick={() => setOpen(false)}>📊 My Dashboard</MobileNavLink>
              )}
              <form action={logout}>
                <button type="submit" className="btn btn-outline" style={{ width: "100%", justifyContent: "center", color: "#DC2626", borderColor: "#FECACA" }}>Sign Out</button>
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
        @media (max-width: 768px) { .desktop-nav { display: none !important; } .mobile-menu-btn { display: block !important; } }
        @media (min-width: 769px) { .mobile-menu-btn { display: none !important; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
}

function NavLink({ href, icon, children }: { href: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-full)", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, transition: "all 0.15s ease" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; (e.currentTarget as HTMLElement).style.color = "var(--primary)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}>
      {icon}{children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{ display: "block", padding: "0.65rem 0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-primary)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, transition: "background 0.15s ease" }}
      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"}
      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
      {children}
    </Link>
  );
}
