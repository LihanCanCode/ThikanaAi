"use client";

import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";
import * as animations from "@/lib/animations";

type RevealVariant = keyof typeof animations;

interface RevealOnScrollProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
}

export function RevealOnScroll({ 
  children, 
  variant = "fadeUp", 
  delay = 0, 
  className = "" 
}: RevealOnScrollProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const selectedVariant = animations[variant as keyof typeof animations] || animations.fadeUp;
  
  // Apply delay to the selected variant if needed
  const variantWithDelay = {
    ...selectedVariant,
    show: {
      ...((selectedVariant as any).show || {}),
      transition: {
        ...((selectedVariant as any).show?.transition || {}),
        delay: delay,
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={variantWithDelay as any}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      className={className}
    >
      {children as any}
    </motion.div>
  );
}
