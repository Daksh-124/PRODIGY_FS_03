"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  // Array of moon phases for the background cycle animation
  const moonCycle = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];

  return (
    <section className="relative w-full h-[95vh] flex items-center justify-center overflow-hidden px-6 pt-16">
      
      {/* Mystical Background Celestial Circle Gradient */}
      <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-gradient-to-b from-[#8B7355]/15 to-[#B8A98F]/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none z-0" />
      
      {/* Vertical Animating Moon Cycle (Side Rails) */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 hidden lg:flex flex-col items-center gap-5 text-xs text-[#B8A98F]/30 z-10 select-none">
        <span className="text-[10px] tracking-[0.3em] rotate-90 mb-6 uppercase text-[#B8A98F]/40 font-light">LUNAR TIME</span>
        {moonCycle.map((moon, index) => (
          <motion.span
            key={index}
            animate={{
              opacity: [0.2, 0.7, 0.2],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: index * 0.4,
              ease: "easeInOut"
            }}
            className="filter drop-shadow-[0_0_4px_rgba(184,169,143,0.3)]"
          >
            {moon}
          </motion.span>
        ))}
      </div>

      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center z-10 relative">
        {/* Celestial Sub-badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-4 py-1.5 rounded-full border border-[#B8A98F]/20 bg-[#121212]/50 backdrop-blur-md text-[10px] uppercase tracking-[0.3em] text-[#B8A98F] mb-6 flex items-center gap-2 select-none"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#B8A98F] animate-pulse" />
          MoonzThrift Archive V2.6
        </motion.div>

        {/* Large Gothic Typography Headings */}
        <h1 className="font-gothic text-4xl sm:text-6xl md:text-8xl font-black tracking-wider leading-tight max-w-5xl text-[#F0EFE7] drop-shadow-[0_0_30px_rgba(240,239,231,0.15)]">
          CELESTIAL FIT <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F0EFE7] via-[#B8A98F] to-[#8B7355]">
            CURATORS
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-6 text-xs sm:text-sm tracking-[0.25em] text-[#F0EFE7]/80 max-w-xl mx-auto font-light leading-relaxed uppercase"
        >
          PREMIUM STREETWEAR & ARCHIVAL VINTAGE FOR THE MYSTICAL CULT.
        </motion.p>

        {/* Action CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
        >
          <Link 
            href="/shop" 
            className="w-48 py-3 bg-[#F0EFE7] text-[#0c0c0c] text-xs font-bold uppercase tracking-[0.25em] rounded-full border border-[#F0EFE7] hover:bg-[#0c0c0c] hover:text-[#F0EFE7] hover:border-[#F0EFE7]/20 transition-all shadow-[0_0_20px_rgba(240,239,231,0.15)] flex items-center justify-center gap-2 group interactive"
          >
            Enter Shop
            <motion.span 
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </Link>
          
          <Link 
            href="/shop?category=rare-finds" 
            className="w-48 py-3 bg-[#121212]/80 text-[#F0EFE7] text-xs font-bold uppercase tracking-[0.25em] rounded-full border border-[#F0EFE7]/15 hover:border-[#B8A98F] hover:text-[#B8A98F] transition-all backdrop-blur-md flex items-center justify-center interactive"
          >
            Rare Drops
          </Link>
        </motion.div>
      </div>

      {/* Parallax bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0c0c0c] to-transparent pointer-events-none" />

      {/* Floating details / coordinates */}
      <div className="absolute bottom-10 left-10 hidden md:block text-[9px] tracking-widest text-[#F0EFE7]/30 uppercase select-none">
        LAT. 47° 36’ 35” N // LONG. 122° 19’ 59” W
      </div>
      <div className="absolute bottom-10 right-10 hidden md:block text-[9px] tracking-widest text-[#F0EFE7]/30 uppercase select-none">
        ALTITUDE: 104M // CELESTIAL ALIGNED
      </div>
    </section>
  );
}
