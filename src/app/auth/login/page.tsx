"use client";

import Link from "next/link";
import { useState, useActionState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Loader2, ArrowRight } from "lucide-react";
import { login } from "@/app/auth/actions";
import { GreenButton } from "@/components/ui/GreenButton";
import { SecureValueAnimation } from "@/components/ui/SecureValueAnimation";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex">
      {/* LEFT: Illustration Panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-[var(--forest)] relative overflow-hidden items-center justify-center p-12">
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
        
        <div className="relative z-10 w-full max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-12">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
              <span className="text-[var(--mint)] font-bold text-3xl font-['Playfair_Display']">T</span>
            </div>
            <h1 className="display-xl text-white mb-6">Welcome back<br/>to your Thikana.</h1>
            <p className="body-lg text-[var(--mint)]">Continue your journey to finding the perfect home in Bangladesh.</p>
          </motion.div>

          {/* Interactive Secure Value Animation */}
          <SecureValueAnimation />
        </div>
      </div>

      {/* RIGHT: Form Panel */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          
          <Link href="/" className="lg:hidden font-['Playfair_Display'] font-bold text-2xl text-[var(--forest)] mb-12 block">Thikana</Link>

          <h2 className="display-lg text-[var(--forest)] mb-8">Log In</h2>

          <form action={formAction} className="space-y-6">
            
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: state?.error ? 'auto' : 0, opacity: state?.error ? 1 : 0 }} className="overflow-hidden">
              <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 font-medium">
                {state?.error}
              </div>
            </motion.div>

            <div className="space-y-5">
              <div className="relative group">
                <input 
                  type="email" 
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pt-6 pb-2 px-4 bg-[var(--mist)] border-2 ${state?.error ? 'border-red-300 focus:border-red-500' : 'border-transparent focus:border-[var(--emerald)]'} rounded-xl outline-none transition-colors peer text-[var(--forest)] font-medium`}
                  placeholder=" "
                  required
                />
                <label className={`absolute left-4 transition-all duration-200 pointer-events-none font-medium ${email ? 'top-2 text-xs text-[var(--slate)]' : 'top-4 text-base text-[var(--stone)] peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--emerald)]'}`}>
                  Email Address
                </label>
              </div>

              <div className="relative group">
                <input 
                  type="password" 
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pt-6 pb-2 px-4 bg-[var(--mist)] border-2 ${state?.error ? 'border-red-300 focus:border-red-500' : 'border-transparent focus:border-[var(--emerald)]'} rounded-xl outline-none transition-colors peer text-[var(--forest)] font-medium`}
                  placeholder=" "
                  required
                />
                <label className={`absolute left-4 transition-all duration-200 pointer-events-none font-medium ${password ? 'top-2 text-xs text-[var(--slate)]' : 'top-4 text-base text-[var(--stone)] peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--emerald)]'}`}>
                  Password
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="#" className="text-sm font-semibold text-[var(--jade)] hover:text-[var(--emerald)] hover-underline">
                Forgot password? &rarr;
              </Link>
            </div>

            <GreenButton type="submit" isLoading={isPending} fullWidth className="py-4 text-lg mt-2">
              Log In <ArrowRight size={18} />
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
            New to Thikana?{" "}
            <Link href="/auth/signup" className="font-semibold text-[var(--emerald)] hover:underline">
              Sign up free &rarr;
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
