"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/shared/Navbar";
import { getChatThreads, getMessages, sendMessage, acceptConnection } from "@/app/actions/chat-actions";
import type { ChatThread } from "@/app/actions/chat-actions";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2, User, CheckCircle, MessageCircle } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default function ChatPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setMyUserId(data?.user?.id || null));

    async function load() {
      const data = await getChatThreads();
      setThreads(data);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!activeThread) return;
    
    async function loadMsgs() {
      const msgs = await getMessages(activeThread!.id);
      setMessages(msgs);
      scrollToBottom();
    }
    loadMsgs();

    // Set up realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel(`chat_${activeThread.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${activeThread.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        scrollToBottom();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeThread]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread) return;
    
    setSending(true);
    const text = newMessage;
    setNewMessage(""); // optimistic clear
    
    const res = await sendMessage(activeThread.id, text);
    if (res && 'error' in res && res.error) {
      console.error(res.error);
    } else {
      // Fallback/immediate update: fetch latest messages in case realtime is delayed
      const msgs = await getMessages(activeThread.id);
      setMessages(msgs);
      scrollToBottom();
    }
    setSending(false);
  };

  const handleAccept = async () => {
    if (!activeThread) return;
    await acceptConnection(activeThread.id);
    setActiveThread({ ...activeThread, status: 'accepted' });
    
    // Refresh threads list to update status there too
    const data = await getChatThreads();
    setThreads(data);
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[var(--bg-base)] flex flex-col overflow-hidden">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6 flex gap-6 overflow-hidden max-w-6xl">
        
        {/* Sidebar: Chat Threads */}
        <div className="w-1/3 bg-white border border-[var(--border)] rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-subtle)]">
            <h2 className="font-bold text-lg text-[var(--text-primary)]">Messages</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-muted)] text-sm">
                No connections yet. Go find some flatmates!
              </div>
            ) : (
              threads.map(thread => {
                const isActive = activeThread?.id === thread.id;
                const other = thread.other_user;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThread(thread)}
                    className={`w-full text-left p-4 flex items-center gap-3 border-b border-[var(--border)] transition-colors
                      ${isActive ? 'bg-[var(--primary-xlight)]' : 'hover:bg-[var(--bg-subtle)]'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                      {other?.avatar_url ? (
                        <img src={other.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : other?.fallback_avatar && (other.fallback_avatar.startsWith("data:image") || other.fallback_avatar.startsWith("http")) ? (
                        <img src={other.fallback_avatar} className="w-full h-full object-cover" alt="" />
                      ) : (
                        other?.fallback_avatar
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-bold text-sm text-[var(--text-primary)] truncate">{other?.full_name || "Unknown User"}</div>
                      <div className="text-xs text-[var(--text-muted)] truncate">
                        {thread.status === 'pending' ? 'Pending Request' : 'Connected'}
                      </div>
                    </div>
                    {thread.status === 'pending' && thread.receiver_id === myUserId && (
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 bg-white border border-[var(--border)] rounded-2xl flex flex-col overflow-hidden shadow-sm">
          {activeThread ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-bold flex items-center justify-center overflow-hidden">
                    {activeThread.other_user?.avatar_url ? (
                      <img src={activeThread.other_user.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : activeThread.other_user?.fallback_avatar && (activeThread.other_user.fallback_avatar.startsWith("data:image") || activeThread.other_user.fallback_avatar.startsWith("http")) ? (
                      <img src={activeThread.other_user.fallback_avatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      activeThread.other_user?.fallback_avatar
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)]">{activeThread.other_user?.full_name}</h3>
                    <span className="text-xs text-[var(--text-muted)] capitalize">{activeThread.other_user?.role}</span>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa] flex flex-col gap-3">
                {activeThread.status === 'pending' && (
                  <div className="bg-white border border-[var(--border)] p-4 rounded-xl text-center shadow-sm my-4 mx-8">
                    <p className="text-sm font-semibold mb-3 text-[var(--text-primary)]">
                      {activeThread.sender_id === myUserId 
                        ? `You sent a connection request to ${activeThread.other_user?.full_name}. You can chat once they accept.` 
                        : `${activeThread.other_user?.full_name} wants to connect with you!`}
                    </p>
                    {activeThread.receiver_id === myUserId && (
                      <button onClick={handleAccept} className="btn btn-primary text-sm px-6 py-2">
                        <CheckCircle size={16} className="mr-2" /> Accept Request
                      </button>
                    )}
                  </div>
                )}

                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === myUserId;
                  return (
                    <div key={msg.id || i} className={`max-w-[70%] flex flex-col ${isMe ? 'self-end' : 'self-start'}`}>
                      <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-[var(--primary)] text-white rounded-br-sm' : 'bg-white border border-[var(--border)] text-[var(--text-primary)] rounded-bl-sm'}`}>
                        {msg.text}
                      </div>
                      <div className={`text-[10px] text-[var(--text-muted)] mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {timeAgo(msg.created_at)}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-[var(--border)]">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={activeThread.status === 'pending' ? "Cannot send messages until connected..." : "Type a message..."}
                    disabled={activeThread.status === 'pending'}
                    className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[var(--primary)] disabled:opacity-50"
                  />
                  <button 
                    type="submit" 
                    disabled={activeThread.status === 'pending' || !newMessage.trim() || sending}
                    className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center disabled:opacity-50"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <MessageCircle size={48} className="mb-4 opacity-20" />
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
