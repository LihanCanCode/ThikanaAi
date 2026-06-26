"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, MapPin } from "lucide-react";

const QUERIES = [
  "2 bedroom flat near IUT under 15k",
  "Female-friendly room in Mirpur-2",
  "Bachelor flat near NSU with Wi-Fi",
  "Family apartment in Dhanmondi"
];

export function SecureValueAnimation() {
  const [queryIndex, setQueryIndex] = useState(0);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showResults, setShowResults] = useState(false);

  // Typewriter effect
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isTyping) {
      const currentQuery = QUERIES[queryIndex];
      if (text.length < currentQuery.length) {
        timeout = setTimeout(() => {
          setText(currentQuery.substring(0, text.length + 1));
        }, Math.random() * 30 + 40); // Natural random typing speed
      } else {
        timeout = setTimeout(() => {
          setIsTyping(false);
          setShowResults(true);
        }, 1200); // "Scanning" delay
      }
    } else if (showResults) {
      // Hold results for 3.5 seconds, then clear out
      timeout = setTimeout(() => {
        setShowResults(false);
        setText("");
        setIsTyping(true);
        setQueryIndex((prev) => (prev + 1) % QUERIES.length);
      }, 3500);
    }
    
    return () => clearTimeout(timeout);
  }, [text, isTyping, showResults, queryIndex]);

  return (
    <div className="relative w-full h-[380px] flex flex-col items-center justify-center mt-6">
      
      {/* Decorative background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--mint)]/5 to-transparent rounded-3xl pointer-events-none" />

      {/* AI Search Bar Simulation */}
      <motion.div 
        className="w-[90%] max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-3 relative z-20"
        layout
      >
        <div className="w-8 h-8 rounded-full bg-[var(--mint)]/20 flex items-center justify-center shrink-0">
          <Sparkles className="text-[var(--mint)]" size={16} />
        </div>
        <div className="flex-grow text-white font-medium text-[15px] relative h-6 overflow-hidden flex items-center">
           <span className="truncate">{text}</span>
           <motion.span 
             animate={{ opacity: [1, 0] }} 
             transition={{ duration: 0.8, repeat: Infinity }}
             className="ml-0.5 text-[var(--mint)]"
           >|</motion.span>
        </div>
      </motion.div>

      {/* AI Search Results Simulation */}
      <div className="w-full relative h-[220px] mt-8 flex justify-center perspective-[1000px]">
        
        {/* Loading State / Scanning */}
        <AnimatePresence>
          {!showResults && !isTyping && text.length > 0 && (
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="absolute top-6 flex flex-col items-center gap-4"
             >
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 border-2 border-white/20 border-t-[var(--mint)] rounded-full shadow-[0_0_15px_rgba(187,247,208,0.2)]"
                />
                <span className="text-[var(--mint)] text-sm font-medium tracking-wide animate-pulse">
                  Scanning verified listings...
                </span>
             </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResults && (
            <>
              {/* Result Card 1 (Front) */}
              <motion.div
                initial={{ opacity: 0, y: 40, rotateX: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                className="absolute top-0 w-[85%] max-w-[300px] bg-white rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-white/40 flex flex-col gap-3 z-10"
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-[var(--mist)] rounded-xl flex-shrink-0 relative overflow-hidden border border-[var(--foam)]">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[var(--emerald)]/20 to-[var(--mint)]/40" />
                  </div>
                  <div className="flex flex-col justify-center gap-2 flex-grow">
                    <div className="h-3.5 w-3/4 bg-[var(--forest)]/10 rounded-full" />
                    <div className="h-2.5 w-1/2 bg-[var(--forest)]/5 rounded-full" />
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-[var(--stone)]" />
                      <div className="h-2 w-1/3 bg-[var(--stone)]/20 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[var(--foam)] mt-1">
                   <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--mint)]/30 rounded-full text-[11px] font-bold text-[var(--emerald)]">
                     <CheckCircle2 size={12} className="text-[var(--jade)]" /> 98% AI Match
                   </div>
                   <div className="text-sm font-bold text-[var(--forest)]">
                     ৳12,500
                   </div>
                </div>
              </motion.div>

              {/* Result Card 2 (Stacked behind) */}
              <motion.div
                initial={{ opacity: 0, y: 60, rotateX: 15, scale: 0.8 }}
                animate={{ opacity: 0.7, y: 24, rotateX: 0, scale: 0.9 }}
                exit={{ opacity: 0, y: -10, scale: 0.85 }}
                transition={{ duration: 0.5, delay: 0.1, type: "spring", bounce: 0.3 }}
                className="absolute top-0 w-[85%] max-w-[300px] bg-white/90 rounded-2xl p-4 shadow-md border border-white/40 flex flex-col gap-3 z-0 backdrop-blur-sm"
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-[var(--mist)] rounded-xl border border-[var(--foam)]" />
                  <div className="flex flex-col justify-center gap-2 flex-grow">
                    <div className="h-3.5 w-full bg-[var(--forest)]/10 rounded-full" />
                    <div className="h-2.5 w-2/3 bg-[var(--forest)]/5 rounded-full" />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
