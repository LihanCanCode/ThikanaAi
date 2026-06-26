const fs = require('fs');
const content = fs.readFileSync('src/app/listings/new/page.tsx', 'utf8');
const lines = content.split('\n');

// The new UI starts at ListPropertyPage
const startIndex = lines.findIndex(l => l.startsWith('export default function ListPropertyPage'));

// Find where the new UI's return starts
const returnLine = lines.findIndex(l => l.includes('<div className="flex-grow pt-24 container mx-auto px-6 pb-20">'));

const imports = `
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Home, DoorOpen, Check, UploadCloud, 
  Sparkles, Minus, Plus, CheckCircle2, ArrowRight, Loader2
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { PropertyCard } from "@/components/cards/PropertyCard";
import { GreenButton } from "@/components/ui/GreenButton";
import { createClient } from "@/lib/supabase/client";
import { generateTrustScore } from "@/app/actions/ai-trust-score";

const STEPS = ["Basic", "Details", "Photos", "Pricing"];
`;

const componentStart = lines.slice(startIndex, returnLine - 1);
// Wait, the old UI return block is scattered.
// Let's just manually rebuild the whole file because the old UI is interleaved inside the new UI!
// See lines 328-372 which have old `card` UI! It's completely interlaced!
