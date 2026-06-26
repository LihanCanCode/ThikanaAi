"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { ArrowRight, Search, MapPin, CheckCircle2, Shield, Brain, CreditCard, MessageSquare } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { GreenButton } from "@/components/ui/GreenButton";
import { PropertyCard } from "@/components/cards/PropertyCard";
import { fadeUp, fadeUpStagger, slideRight, scaleUp } from "@/lib/animations";

const MOCK_PROPERTIES = [
  {
    id: "1",
    title: "Modern 2-Bed Flat near IUT",
    location: "Board Bazar, Gazipur",
    price: 14000,
    beds: 2,
    baths: 2,
    floor: "4th",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop",
    aiScore: 94,
    distanceToUniversity: "5 min to IUT",
    isVerified: true,
  },
  {
    id: "2",
    title: "Furnished Room for Female Student",
    location: "Mirpur-2, Block B",
    price: 7500,
    beds: 1,
    baths: 1,
    floor: "2nd",
    imageUrl: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800&auto=format&fit=crop",
    aiScore: 88,
    distanceToUniversity: "10 min to BUBT",
    isVerified: true,
  },
  {
    id: "3",
    title: "Premium 3-Bed Apartment",
    location: "Bashundhara R/A",
    price: 32000,
    beds: 3,
    baths: 3,
    floor: "6th",
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop",
    aiScore: 96,
    distanceToUniversity: "15 min to NSU",
    isVerified: true,
  }
];

const TYPEWRITER_TEXTS = [
  "Mirpur-2 te 2ta room 12k er niche...",
  "Furnished room near IUT under 8k...",
  "Bashundhara R/A te female sublet...",
  "3 bedroom flat near BRAC university...",
  "Dhanmondi te bachelor allow kore emon flat..."
];

export default function Home() {
  const [typewriterText, setTypewriterText] = useState("");
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [cards, setCards] = useState(MOCK_PROPERTIES);
  const [hasShuffled, setHasShuffled] = useState(false);

  // Card shuffle effect
  useEffect(() => {
    const timer = setInterval(() => {
      setHasShuffled(true);
      setCards(prev => {
        const newCards = [...prev];
        const first = newCards.shift();
        if (first) newCards.push(first);
        return newCards;
      });
    }, 4500); // Shuffle every 4.5 seconds
    return () => clearInterval(timer);
  }, []);

  // Typewriter effect
  useEffect(() => {
    const currentText = TYPEWRITER_TEXTS[typewriterIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setTypewriterText(currentText.substring(0, typewriterText.length + 1));
        if (typewriterText.length === currentText.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setTypewriterText(currentText.substring(0, typewriterText.length - 1));
        if (typewriterText.length === 0) {
          setIsDeleting(false);
          setTypewriterIndex((prev) => (prev + 1) % TYPEWRITER_TEXTS.length);
        }
      }
    }, isDeleting ? 40 : 80);

    return () => clearTimeout(timeout);
  }, [typewriterText, isDeleting, typewriterIndex]);

  return (
    <main className="min-h-screen bg-[var(--mist)] overflow-hidden">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative w-full h-[100dvh] pt-20 flex items-center">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_120%_80%_at_60%_50%,#DCFCE7_0%,#F0FDF4_40%,#FFFFFF_100%)]" />
        
        {/* Floating Orbs */}
        <div className="absolute top-[20%] left-[60%] w-96 h-96 bg-[var(--mint)] rounded-full blur-[80px] opacity-40 animate-[float_8s_ease-in-out_infinite] z-0" />
        <div className="absolute bottom-[10%] left-[40%] w-[500px] h-[500px] bg-[var(--foam)] rounded-full blur-[100px] opacity-50 animate-[float_10s_ease-in-out_infinite_reverse] z-0" />

        <div className="container relative z-10 mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center h-full pb-32">
          
          {/* Left Content */}
          <motion.div 
            variants={fadeUpStagger}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6 max-w-xl"
          >
            <motion.span variants={fadeUp} className="overline text-[var(--jade)]">
              Bangladesh&apos;s First AI Rental Platform
            </motion.span>
            
            <motion.h1 variants={fadeUp} className="display-2xl text-[var(--forest)]">
              Find Your<br />
              Perfect<br />
              <span className="text-[var(--emerald)]">Thikana.</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="body-lg text-[var(--slate)] max-w-lg">
              AI-powered listings for students and professionals.<br/>
              Bilingual. Verified. Trusted.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 mt-2">
              <Link href="/student">
                <GreenButton>
                  <Search size={18} /> Find a Room &rarr;
                </GreenButton>
              </Link>
              <Link href="/listings/new">
                <GreenButton outline>
                  List Your Property
                </GreenButton>
              </Link>
            </motion.div>
            
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 md:gap-6 mt-8 text-sm font-medium text-[var(--stone)]">
              <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[var(--jade)]"/> 4,200+ Listings</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[var(--jade)]"/> 1,800 Students Housed</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[var(--jade)]"/> AI Verified</div>
            </motion.div>
          </motion.div>

          {/* Right Content - 3D Cards */}
          <div className="hidden lg:block relative h-[600px] w-full perspective-[1000px]">
            {cards.map((prop, i) => {
              const isLast = hasShuffled && i === cards.length - 1;
              return (
                <motion.div
                  key={prop.id}
                  layout
                  initial={{ opacity: 0, x: 100, rotateY: 15 }}
                  animate={{ 
                    opacity: 1 - (i * 0.15), 
                    x: isLast ? [0, 350, i * 40] : i * 40, 
                    y: isLast ? [0, -30, i * -30] : i * -30,
                    rotateY: -5 - (i * 3),
                    scale: isLast ? [1, 1.08, 1 - (i * 0.05)] : 1 - (i * 0.05),
                    z: isLast ? [0, 50, i * -50] : i * -50,
                    zIndex: isLast ? [30, 30, 30 - i] : 30 - i
                  }}
                  transition={{ 
                    duration: isLast ? 1.4 : 0.8, 
                    times: isLast ? [0, 0.4, 1] : undefined,
                    ease: "easeInOut",
                    delay: !hasShuffled ? i * 0.15 : 0
                  }}
                  className="absolute top-[10%] right-[10%] w-[340px] origin-bottom-right"
                  style={{ zIndex: 30 - i }}
                >
                  <div className="animate-[float_6s_ease-in-out_infinite]" style={{ animationDelay: `${i * 1.5}s` }}>
                    <PropertyCard {...prop} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Animated Search Bar (Floating at bottom) */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-white rounded-full p-2.5 shadow-[var(--shadow-xl)] flex items-center gap-3 border-2 border-transparent focus-within:border-[var(--mint)] transition-colors z-20"
        >
          <div className="flex-grow flex items-center gap-3 pl-4">
            <MapPin className="text-[var(--emerald)]" size={20} />
            <div className="flex-grow relative h-6 overflow-hidden">
              <span className="absolute inset-0 text-[var(--slate)] font-medium text-lg leading-tight whitespace-nowrap overflow-hidden">
                {typewriterText}
                <span className="animate-pulse">|</span>
              </span>
            </div>
          </div>
          <Link href="/student">
            <GreenButton className="py-2.5 px-6 rounded-full shrink-0">Search</GreenButton>
          </Link>
        </motion.div>
      </section>

      {/* STATS SECTION */}
      <section className="bg-white py-16 border-y border-[var(--foam)]">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 divide-x-0 md:divide-x divide-[var(--foam)]">
          {[
            { end: 4200, label: "Active Listings", suffix: "+" },
            { end: 1800, label: "Students Housed", suffix: "+" },
            { end: 98, label: "Verified Rate", suffix: "%" },
            { end: 3, label: "Avg. Response", suffix: " min" }
          ].map((stat, i) => (
            <RevealOnScroll key={i} delay={i * 0.1} className="flex flex-col items-center text-center px-4">
              <div className="display-lg text-[var(--emerald)] mb-1">
                <CountUp end={stat.end} duration={2.5} enableScrollSpy scrollSpyOnce />{stat.suffix}
              </div>
              <div className="caption text-[var(--stone)]">{stat.label}</div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-[var(--mist)] relative overflow-hidden">
        <div className="container mx-auto px-6">
          <RevealOnScroll className="text-center mb-16">
            <h2 className="display-xl text-[var(--forest)] mb-4">Finding home is simple.</h2>
            <p className="body-lg text-[var(--slate)]">Three steps to your next Thikana.</p>
          </RevealOnScroll>

          <div className="relative max-w-4xl mx-auto">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-[var(--emerald)]/20 via-[var(--emerald)]/60 to-[var(--emerald)]/20" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              {[
                { step: "1", icon: <Search size={28}/>, title: "Search or Post", desc: "Use AI to find exactly what you need in seconds." },
                { step: "2", icon: <Shield size={28}/>, title: "AI Verifies", desc: "Our system scores every listing for authenticity." },
                { step: "3", icon: <CheckCircle2 size={28}/>, title: "Move In Happy", desc: "Connect instantly and settle into your new home." }
              ].map((item, i) => (
                <RevealOnScroll key={i} delay={i * 0.15} variant="scaleUp" className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white rounded-full shadow-[var(--shadow-md)] flex items-center justify-center text-[var(--emerald)] mb-6 relative">
                    {item.icon}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[var(--forest)] text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="heading text-[var(--forest)] mb-2">{item.title}</h3>
                  <p className="body text-[var(--slate)] px-4">{item.desc}</p>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE SHOWCASE */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 flex flex-col gap-32">
          
          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <RevealOnScroll variant="slideRight" className="order-2 lg:order-1 relative rounded-[24px] bg-[var(--mist)] p-8 aspect-square flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--emerald)]/10 to-transparent" />
              <div className="relative bg-white p-6 rounded-[20px] shadow-[var(--shadow-xl)] w-3/4 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--foam)]">
                  <Brain className="text-[var(--emerald)]" size={24} />
                  <span className="font-semibold text-[var(--forest)]">AI Assistant</span>
                </div>
                <div className="bg-[var(--foam)] p-3 rounded-lg text-sm text-[var(--forest)] font-medium mb-4 bangla">
                  &quot;Mirpur-2 te 2 room 12k er niche&quot;
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full bg-[var(--mist)] rounded-full" />
                  <div className="h-2 w-3/4 bg-[var(--mist)] rounded-full" />
                  <div className="h-2 w-5/6 bg-[var(--mist)] rounded-full" />
                </div>
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll className="order-1 lg:order-2 flex flex-col gap-6 items-start">
              <span className="overline">AI-Powered Discovery</span>
              <h2 className="display-lg text-[var(--forest)]">Find rooms in<br/>Bangla or English</h2>
              <p className="body text-[var(--slate)] text-lg">
                Just type naturally — &quot;Mirpur-2 te 2 room 12k er niche&quot; and our AI instantly filters 4,000+ listings for you.
              </p>
              <Link href="/student">
                <GreenButton outline>Try AI Search &rarr;</GreenButton>
              </Link>
            </RevealOnScroll>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <RevealOnScroll className="flex flex-col gap-6 items-start">
              <span className="overline">Trust Every Listing</span>
              <h2 className="display-lg text-[var(--forest)]">AI Integrity<br/>Score — 0 to 100</h2>
              <p className="body text-[var(--slate)] text-lg">
                Every listing gets a transparent fraud score. Price anomaly check. Duplicate photo detection. Fake description filter.
              </p>
              <div className="w-16 h-1 rounded-full bg-gradient-to-r from-emerald-600 to-green-400 my-2" />
            </RevealOnScroll>

            <RevealOnScroll variant="slideRight" delay={0.2} className="relative rounded-[24px] bg-[var(--mist)] p-8 aspect-square flex items-center justify-center overflow-hidden">
              <div className="relative bg-white p-8 rounded-[20px] shadow-[var(--shadow-xl)] w-4/5 text-center">
                <div className="w-24 h-24 mx-auto rounded-full border-8 border-[var(--jade)] border-t-[var(--foam)] flex items-center justify-center mb-6 relative">
                  <span className="text-3xl font-bold text-[var(--forest)]">94</span>
                </div>
                <h4 className="font-semibold text-[var(--forest)] mb-4">Score Breakdown</h4>
                <div className="space-y-3 text-sm text-[var(--slate)]">
                  <div className="flex justify-between items-center"><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[var(--jade)]"/> Price match</span><span className="font-medium">+40</span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[var(--jade)]"/> Unique photos</span><span className="font-medium">+35</span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[var(--jade)]"/> Verified ID</span><span className="font-medium">+19</span></div>
                </div>
              </div>
            </RevealOnScroll>
          </div>

        </div>
      </section>

      {/* NEIGHBOURHOOD SAFETY */}
      <section className="bg-[var(--forest)] text-white py-[120px] relative overflow-hidden">
        {/* Glow dots bg */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="container mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          <RevealOnScroll>
            <span className="overline text-[var(--mint)] mb-6 block">Neighbourhood Assistant</span>
            <h2 className="display-xl text-white mb-8 max-w-3xl mx-auto leading-tight">
              &quot;Is Adabor safe for<br/>a female student?&quot;
            </h2>
            <p className="body-lg text-slate-300 max-w-2xl mx-auto mb-10">
              Ask anything about any area. Our AI answers using real-time web search — never hallucinating.
            </p>
            <button className="bg-white hover:bg-[var(--mist)] text-[var(--forest)] font-semibold px-8 py-3.5 rounded-full transition-transform hover:scale-105 inline-flex items-center gap-2">
              Ask a Question &rarr;
            </button>
          </RevealOnScroll>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[var(--foam)] py-[100px] overflow-hidden">
        <div className="container mx-auto px-6 mb-16 text-center">
          <RevealOnScroll>
            <span className="overline block mb-4">Real Students, Real Stories</span>
            <h2 className="display-lg text-[var(--forest)]">They found their Thikana.</h2>
          </RevealOnScroll>
        </div>

        {/* Auto Scroll Carousel */}
        <div className="relative w-full flex overflow-hidden group">
          <div className="flex gap-6 whitespace-nowrap animate-[scroll_20s_linear_infinite] group-hover:[animation-play-state:paused] px-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="inline-block w-[360px] bg-white rounded-[20px] p-8 shadow-[var(--shadow-sm)] hover:-translate-y-2 hover:shadow-[var(--shadow-lg)] transition-all duration-300 whitespace-normal">
                <div className="flex gap-1 text-[var(--gold)] mb-4">
                  {[1,2,3,4,5].map(s => <span key={s}>★</span>)}
                </div>
                <p className="text-[var(--forest)] font-medium text-lg mb-8 leading-snug">
                  &quot;Found my Mirpur flat in 2 hours. The AI score saved me from a fake listing.&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--forest)] font-bold text-xl">
                    T
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--forest)]">Tanvir Ahmed</div>
                    <div className="text-sm text-[var(--slate)]">CSE 4th Year, IUT</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Duplicate for seamless loop */}
          <div className="flex gap-6 whitespace-nowrap animate-[scroll_20s_linear_infinite] group-hover:[animation-play-state:paused] pr-6 absolute top-0 left-[100%]">
             {[1, 2, 3, 4].map((i) => (
              <div key={i} className="inline-block w-[360px] bg-white rounded-[20px] p-8 shadow-[var(--shadow-sm)] hover:-translate-y-2 hover:shadow-[var(--shadow-lg)] transition-all duration-300 whitespace-normal">
                <div className="flex gap-1 text-[var(--gold)] mb-4">
                  {[1,2,3,4,5].map(s => <span key={s}>★</span>)}
                </div>
                <p className="text-[var(--forest)] font-medium text-lg mb-8 leading-snug">
                  &quot;Found my Mirpur flat in 2 hours. The AI score saved me from a fake listing.&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--forest)] font-bold text-xl">
                    T
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--forest)]">Tanvir Ahmed</div>
                    <div className="text-sm text-[var(--slate)]">CSE 4th Year, IUT</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-[#166534] via-[#15803D] to-[#16A34A]">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 font-['Hind_Siliguri'] text-[400px] font-bold leading-none select-none pointer-events-none translate-x-1/4">
          ঠ
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          <RevealOnScroll>
            <h2 className="display-xl text-white mb-4">Ready to find your Thikana?</h2>
            <p className="text-[var(--mint)] text-xl mb-10 max-w-2xl mx-auto">
              Join 1,800+ students who found verified rooms without the hassle.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth/signup">
                <button className="bg-white text-[var(--emerald)] hover:bg-[var(--mist)] px-8 py-3.5 rounded-full font-semibold transition-transform hover:scale-105 shadow-lg">
                  Get Started Free &rarr;
                </button>
              </Link>
              <Link href="/listings/new">
                <button className="bg-transparent border-2 border-[var(--mint)] text-[var(--mint)] hover:bg-[var(--mint)] hover:text-[var(--forest)] px-8 py-3.5 rounded-full font-semibold transition-all">
                  List a Property
                </button>
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[var(--forest)] pt-20 pb-8 border-t border-[var(--mint)]/20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.05 19.43 4 16.05 4 12C4 7.95 7.05 4.57 11 4.07V19.93ZM13 4.07C16.95 4.57 20 7.95 20 12C20 16.05 16.95 19.43 13 19.93V4.07Z" fill="#BBF7D0"/>
                    <path d="M11 6.5C9.07 6.5 7.5 8.07 7.5 10C7.5 11.93 9.07 13.5 11 13.5V6.5Z" fill="#BBF7D0"/>
                  </svg>
                </div>
                <span className="font-['Playfair_Display'] font-bold text-2xl text-white">Thikana</span>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                The smart, bilingual rental platform built to make housing easy, safe, and transparent for everyone in Bangladesh.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-slate-400 hover:text-[var(--mint)] transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
                <a href="#" className="text-slate-400 hover:text-[var(--mint)] transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
                <a href="#" className="text-slate-400 hover:text-[var(--mint)] transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">For Students</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><Link href="/student" className="hover:text-white transition-colors hover-underline">Search Rooms</Link></li>
                <li><Link href="/student/finance" className="hover:text-white transition-colors hover-underline">Split Rent & Finance</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors hover-underline">AI Safety Check</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors hover-underline">University Guides</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">For Landlords</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><Link href="/listings/new" className="hover:text-white transition-colors hover-underline">Post a Property</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors hover-underline">Dashboard</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors hover-underline">Tenant Screening</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors hover-underline">Pricing Tool</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Company</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors hover-underline">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors hover-underline">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors hover-underline">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors hover-underline">Contact</Link></li>
              </ul>
            </div>
            
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>&copy; 2026 Thikana &middot; Made with &hearts; by IUT_TwinCoder</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
