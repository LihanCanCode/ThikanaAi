"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { Menu, X, ArrowRight, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Scroll progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navLinks = [
    { name: "Student Rent", href: "/student" },
    { name: "List Property", href: "/listings/new" },
    { name: "Finance", href: "/student/finance" },
  ];

  return (
    <>
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-green-400 z-50 origin-left"
        style={{ scaleX }}
      />

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
          isScrolled 
            ? "bg-white/90 backdrop-blur-xl border-b border-[var(--foam)] shadow-[var(--shadow-sm)] py-3" 
            : "bg-transparent py-5"
        )}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[var(--emerald)] rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.05 19.43 4 16.05 4 12C4 7.95 7.05 4.57 11 4.07V19.93ZM13 4.07C16.95 4.57 20 7.95 20 12C20 16.05 16.95 19.43 13 19.93V4.07Z" fill="white"/>
                <path d="M11 6.5C9.07 6.5 7.5 8.07 7.5 10C7.5 11.93 9.07 13.5 11 13.5V6.5Z" fill="white"/>
              </svg>
            </div>
            <span className={cn(
              "font-['Playfair_Display'] font-bold text-2xl tracking-tight transition-colors",
              isScrolled ? "text-[var(--forest)]" : "text-[var(--forest)] lg:text-white"
            )}>
              Thikana
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={cn(
                    "text-sm font-semibold transition-colors hover-underline",
                    isScrolled ? "text-[var(--forest)]" : "text-[var(--forest)] lg:text-white/90 lg:hover:text-white"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 border-l border-[var(--border)] pl-6">
              {user ? (
                <>
                  <Link 
                    href="/dashboard"
                    className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--emerald)]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--foam)] text-[var(--forest)] flex items-center justify-center">
                      <User size={16} />
                    </div>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="bg-transparent border-2 border-[var(--foam)] hover:border-red-200 hover:bg-red-50 text-red-600 text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-[var(--shadow-sm)]"
                  >
                    Log Out <LogOut size={14} />
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth/login"
                    className={cn(
                      "text-sm font-semibold transition-colors hover-underline",
                      isScrolled ? "text-[var(--slate)] hover:text-[var(--forest)]" : "text-[var(--forest)] lg:text-white/80 lg:hover:text-white"
                    )}
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/auth/signup"
                    className="bg-[var(--emerald)] hover:bg-[var(--jade)] text-white text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-1 transition-all shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
                  >
                    Sign Up <ArrowRight size={14} />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-[var(--forest)]"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col p-6">
          <div className="flex items-center justify-between mb-12">
            <div className="font-['Playfair_Display'] font-bold text-2xl text-[var(--forest)]">Thikana</div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[var(--slate)] bg-[var(--mist)] rounded-full">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-col gap-6 text-xl font-medium text-[var(--forest)]">
            {navLinks.map((link, i) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                  {link.name}
                </Link>
              </motion.div>
            ))}
            
            <div className="w-full h-px bg-[var(--foam)] my-4" />
            
            {user ? (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <button onClick={handleLogout} className="text-red-600 flex items-center gap-2">
                  <LogOut size={18} /> Log Out
                </button>
              </motion.div>
            ) : (
              <>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                  <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="text-[var(--slate)]">
                    Log In
                  </Link>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                  <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)} className="text-[var(--emerald)] flex items-center gap-2">
                    Sign Up <ArrowRight size={18} />
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
