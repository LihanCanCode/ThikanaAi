"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, CheckCircle2 } from "lucide-react";
import { springTransition } from "@/lib/animations";

interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  floor: string;
  imageUrl: string;
  aiScore: number;
  distanceToUniversity?: string;
  isVerified?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function PropertyCard({
  id,
  title,
  location,
  price,
  beds,
  baths,
  floor,
  imageUrl,
  aiScore,
  distanceToUniversity,
  isVerified,
  onMouseEnter,
  onMouseLeave
}: PropertyCardProps) {
  
  const isHighTrust = aiScore >= 85;

  return (
    <motion.div
      whileHover={{ y: -6, transition: springTransition }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="group relative bg-white rounded-[16px] border border-[var(--foam)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-shadow duration-350 overflow-hidden flex flex-col"
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--mist)]">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-350 group-hover:scale-105"
        />
        
        {/* Floating AI Score Badge */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-sm ${
          isHighTrust 
            ? "bg-[var(--amber-soft)]/90 text-[var(--gold)] border border-[var(--gold)]/20" 
            : "bg-white/90 text-[var(--forest)] border border-[var(--forest)]/10"
        }`}>
          <span>AI Score: {aiScore}</span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full ${i < Math.floor(aiScore / 20) ? (isHighTrust ? 'bg-[var(--gold)]' : 'bg-[var(--forest)]') : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-grow">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1 text-[var(--stone)] text-xs font-medium mb-1">
              <MapPin size={12} />
              {location}
            </div>
            <h3 className="font-['Playfair_Display'] font-semibold text-lg text-[var(--forest)] leading-tight line-clamp-1">
              {title}
            </h3>
          </div>
          <button className="text-[var(--stone)] hover:text-red-500 transition-colors shrink-0">
            <Heart size={18} />
          </button>
        </div>

        <div className="text-[var(--slate)] text-sm mb-1">
          {beds} Bed &middot; {baths} Bath &middot; {floor} Floor
        </div>

        <div className="text-[var(--emerald)] font-bold text-xl bangla mb-2 mt-auto">
          ৳{price.toLocaleString('en-IN')} <span className="text-sm font-normal text-[var(--stone)] font-sans">/ month</span>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[var(--foam)] my-1" />

        {/* Footer info */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {distanceToUniversity && (
              <span className="text-xs font-medium text-[var(--slate)] bg-[var(--mist)] px-2 py-1 rounded-md flex items-center gap-1">
                🎓 {distanceToUniversity}
              </span>
            )}
            {isVerified && (
              <span className="text-xs font-medium text-[var(--gold)] bg-[var(--amber-soft)] px-2 py-1 rounded-md flex items-center gap-1">
                <CheckCircle2 size={12} /> Verified
              </span>
            )}
          </div>
          <Link 
            href={`/property/${id}`}
            className="text-xs font-semibold text-[var(--jade)] hover:text-[var(--emerald)] flex items-center gap-1 hover-underline"
          >
            View Details &rarr;
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
