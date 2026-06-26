"use client";

import Link from "next/link";
import { useState, useActionState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Loader2, ArrowRight } from "lucide-react";
import { UNIVERSITIES } from "@/lib/utils";
import { signup } from "@/app/auth/actions";
import { GreenButton } from "@/components/ui/GreenButton";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, null);
  const [role, setRole] = useState<"student" | "landlord">("student");
  
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "", university: "", password: ""
  });

  // Password strength logic
  const getStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length > 7) score += 33;
    if (pass.match(/[A-Z]/) && pass.match(/[a-z]/)) score += 33;
    if (pass.match(/[0-9!@#$%^&*]/)) score += 34;
    return score;
  };
  const strength = getStrength(formData.password);

  return (
    <div className="min-h-screen flex">
      {/* LEFT: Illustration Panel */}
      <div className="hidden lg:flex w-1/2 bg-[var(--forest)] relative overflow-hidden items-center justify-center p-12">
        {/* Beautiful AI City Background Illustration */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/thikana-ai-city-bg.png" 
            alt="Thikana AI City" 
            fill 
            className="object-cover opacity-60 object-[center_top]" 
            priority
          />
          {/* Gradient overlay to ensure text readability but keep the image vibrant */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--forest)]/70 via-[var(--forest)]/30 to-[var(--forest)]/90" />
        </div>
        
        {/* Glowing dots */}
        {[...Array(8)].map((_, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0.5, 1], scale: 1 }}
            transition={{ delay: i * 0.4, duration: 3, repeat: Infinity, repeatType: "reverse" }}
            className="absolute w-2 h-2 rounded-full bg-[var(--emerald)] shadow-[0_0_15px_rgba(22,163,74,1)]"
            style={{ top: `${20 + Math.random() * 60}%`, left: `${20 + Math.random() * 60}%` }}
          />
        ))}

        <div className="relative z-10 text-center max-w-lg">
          <h2 className="text-4xl lg:text-5xl font-['Hind_Siliguri'] font-bold text-white mb-6 leading-tight">
            ৭০,০০০+ শিক্ষার্থীর ঠিকানা খোঁজার সাথী
          </h2>
          <p className="text-[var(--mint)] text-lg">
            Join the safest, smartest rental marketplace in Bangladesh.
          </p>
          
          {/* Floating mock card */}
          <motion.div 
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="mt-16 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex gap-4 text-left max-w-sm mx-auto"
          >
            <div className="w-16 h-16 bg-white/20 rounded-xl" />
            <div>
              <div className="h-4 w-32 bg-white/30 rounded mb-2" />
              <div className="h-3 w-24 bg-[var(--mint)]/50 rounded mb-3" />
              <div className="flex gap-1">
                <span className="text-[var(--gold)] text-xs">★★★★★</span>
                <span className="text-white/60 text-xs text-[10px]">AI Score 94</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT: Form Panel */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 py-12 sm:px-16 lg:px-24 overflow-y-auto custom-scrollbar">
        <div className="max-w-md w-full mx-auto">
          
          <Link href="/" className="lg:hidden font-['Playfair_Display'] font-bold text-2xl text-[var(--forest)] mb-8 block">Thikana</Link>

          <h2 className="display-lg text-[var(--forest)] mb-8">Create your account</h2>

          {/* Role Tab */}
          <div className="relative flex mb-8 bg-[var(--mist)] rounded-full p-1">
            <motion.div 
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm z-0"
              animate={{ left: role === "student" ? "4px" : "calc(50%)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <button 
              onClick={() => setRole("student")}
              className={`flex-1 py-2.5 text-sm font-semibold z-10 transition-colors ${role === "student" ? "text-[var(--forest)]" : "text-[var(--slate)]"}`}
            >
              I&apos;m a Student
            </button>
            <button 
              onClick={() => setRole("landlord")}
              className={`flex-1 py-2.5 text-sm font-semibold z-10 transition-colors ${role === "landlord" ? "text-[var(--forest)]" : "text-[var(--slate)]"}`}
            >
              I&apos;m a Landlord
            </button>
          </div>

          <form action={formAction} className="space-y-5">
            <input type="hidden" name="role" value={role} />
            
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: state?.error ? 'auto' : 0, opacity: state?.error ? 1 : 0 }} className="overflow-hidden">
              <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 font-medium mb-1">
                {state?.error}
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <input type="text" name="firstName" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full pt-6 pb-2 px-4 bg-[var(--mist)] border-2 border-transparent focus:border-[var(--emerald)] rounded-xl outline-none transition-colors peer text-[var(--forest)] font-medium" placeholder=" " required />
                <label className={`absolute left-4 transition-all duration-200 pointer-events-none font-medium ${formData.firstName ? 'top-2 text-xs text-[var(--slate)]' : 'top-4 text-[15px] text-[var(--stone)] peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--emerald)]'}`}>First Name</label>
              </div>
              <div className="relative group">
                <input type="text" name="lastName" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full pt-6 pb-2 px-4 bg-[var(--mist)] border-2 border-transparent focus:border-[var(--emerald)] rounded-xl outline-none transition-colors peer text-[var(--forest)] font-medium" placeholder=" " required />
                <label className={`absolute left-4 transition-all duration-200 pointer-events-none font-medium ${formData.lastName ? 'top-2 text-xs text-[var(--slate)]' : 'top-4 text-[15px] text-[var(--stone)] peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--emerald)]'}`}>Last Name</label>
              </div>
            </div>

            <div className="relative group">
              <input type="email" name="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pt-6 pb-2 px-4 bg-[var(--mist)] border-2 border-transparent focus:border-[var(--emerald)] rounded-xl outline-none transition-colors peer text-[var(--forest)] font-medium" placeholder=" " required />
              <label className={`absolute left-4 transition-all duration-200 pointer-events-none font-medium ${formData.email ? 'top-2 text-xs text-[var(--slate)]' : 'top-4 text-[15px] text-[var(--stone)] peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--emerald)]'}`}>Email Address</label>
            </div>

            <div className="relative group">
              <input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full pt-6 pb-2 px-4 bg-[var(--mist)] border-2 border-transparent focus:border-[var(--emerald)] rounded-xl outline-none transition-colors peer text-[var(--forest)] font-medium" placeholder=" " required />
              <label className={`absolute left-4 transition-all duration-200 pointer-events-none font-medium ${formData.phone ? 'top-2 text-xs text-[var(--slate)]' : 'top-4 text-[15px] text-[var(--stone)] peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--emerald)]'}`}>Phone Number (01...)</label>
            </div>

            <AnimatePresence>
              {role === "student" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="relative group overflow-hidden">
                  <select name="university" value={formData.university} onChange={(e) => setFormData({...formData, university: e.target.value})} className="w-full pt-6 pb-2 px-4 bg-[var(--mist)] border-2 border-transparent focus:border-[var(--emerald)] rounded-xl outline-none transition-colors text-[var(--forest)] font-medium appearance-none" required>
                    <option value="" disabled></option>
                    {UNIVERSITIES.map(u => <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>)}
                  </select>
                  <label className={`absolute left-4 transition-all duration-200 pointer-events-none font-medium ${formData.university ? 'top-2 text-xs text-[var(--slate)]' : 'top-4 text-[15px] text-[var(--stone)]'}`}>University</label>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <div className="relative group mb-2">
                <input type="password" name="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pt-6 pb-2 px-4 bg-[var(--mist)] border-2 border-transparent focus:border-[var(--emerald)] rounded-xl outline-none transition-colors peer text-[var(--forest)] font-medium" placeholder=" " required minLength={8} />
                <label className={`absolute left-4 transition-all duration-200 pointer-events-none font-medium ${formData.password ? 'top-2 text-xs text-[var(--slate)]' : 'top-4 text-[15px] text-[var(--stone)] peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--emerald)]'}`}>Password</label>
              </div>
              {/* Password Strength */}
              <div className="w-full h-1 bg-[var(--foam)] rounded-full overflow-hidden flex gap-1">
                <div className={`h-full transition-all duration-300 ${strength > 0 ? (strength <= 33 ? 'bg-red-500 w-1/3' : strength <= 67 ? 'bg-amber-500 w-2/3' : 'bg-[var(--emerald)] w-full') : 'w-0'}`} />
              </div>
            </div>

            <GreenButton type="submit" isLoading={isPending} fullWidth className="py-4 text-lg mt-4">
              <span className="bangla text-base mr-1">৳</span> Sign Up — free forever
            </GreenButton>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-[var(--foam)]" />
            <span className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[var(--foam)]" />
          </div>

          <button type="button" className="w-full py-4 bg-white border-2 border-[var(--foam)] hover:border-[var(--emerald)] hover:bg-[var(--mist)] rounded-full text-[var(--forest)] font-semibold transition-all flex items-center justify-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <p className="text-center mt-10 text-[var(--slate)]">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-[var(--emerald)] hover:underline">
              Log in &rarr;
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
