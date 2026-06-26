"use client";

import { HTMLMotionProps, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GreenButtonProps extends HTMLMotionProps<"button"> {
  isLoading?: boolean;
  fullWidth?: boolean;
  className?: string;
  outline?: boolean;
}

export function GreenButton({ 
  children, 
  isLoading, 
  fullWidth, 
  className, 
  outline,
  ...props 
}: GreenButtonProps) {
  
  const baseClasses = "relative overflow-hidden inline-flex items-center justify-center gap-2 font-semibold text-[0.95rem] rounded-full transition-all duration-300 px-6 py-3";
  const filledClasses = "bg-emerald-700 text-white hover:bg-emerald-600 shadow-sm hover:shadow-md";
  const outlineClasses = "bg-transparent text-emerald-700 border-2 border-emerald-700 hover:bg-emerald-50";
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        baseClasses,
        outline ? outlineClasses : filledClasses,
        fullWidth ? "w-full" : "",
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Shimmer sweep effect */}
      {!outline && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]" />
      )}
      
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        children as any
      )}
    </motion.button>
  );
}
