"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashLoaderProps {
  onComplete: () => void;
}

export default function SplashLoader({ onComplete }: SplashLoaderProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 800); // Allow exit transition to complete
    }, 3800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Unicode/SVG moon phases stacked vertically
  const moons = [
    { phase: "🌕", label: "FULL MOON" },
    { phase: "🌖", label: "GIBBOUS" },
    { phase: "🌗", label: "QUARTER" },
    { phase: "🌘", label: "CRESCENT" },
    { phase: "🌑", label: "NEW MOON" }
  ];

  const titleLetters = "MOONZTHRIFT".split("");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 bg-[#0c0c0c] z-[99999] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Subtle celestial background glow */}
          <div className="absolute w-[500px] h-[500px] bg-[#8B7355]/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Moon Phases Stack */}
          <div className="flex flex-col items-center gap-4 mb-10 z-10">
            {moons.map((moon, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.2 + index * 0.25,
                  duration: 0.6,
                  ease: "easeOut",
                }}
                className="text-2xl text-[#B8A98F] select-none filter drop-shadow-[0_0_8px_rgba(184,169,143,0.3)]"
              >
                {moon.phase}
              </motion.span>
            ))}
          </div>

          {/* Gothic Logo Typography */}
          <div className="flex items-center gap-1 md:gap-3 z-10">
            {titleLetters.map((letter, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{
                  delay: 1.2 + index * 0.1,
                  duration: 0.8,
                  ease: "easeOut",
                }}
                className="font-gothic text-3xl md:text-5xl font-extrabold tracking-widest text-[#F0EFE7] select-none filter drop-shadow-[0_0_12px_rgba(240,239,231,0.5)]"
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Mystical vintage subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="mt-6 text-xs tracking-[0.4em] text-[#B8A98F] uppercase font-light z-10"
          >
            mystical minimalism // streetwear couture
          </motion.p>

          {/* Scanning lines / vintage grain noise */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-10" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
