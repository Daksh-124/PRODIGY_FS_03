"use client";

import { useState, useEffect } from "react";
import SplashLoader from "./SplashLoader";
import CustomCursor from "./CustomCursor";
import CartDrawer from "./CartDrawer";
import { useStore } from "@/context/StoreContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { toast } = useStore();

  useEffect(() => {
    setMounted(true);
    
    // Check if splash has already been shown in this session (optional)
    // To make user experience better when browsing pages, we only show splash once per session.
    const hasLoaded = sessionStorage.getItem("moonz_loaded");
    if (hasLoaded) {
      setLoading(false);
    }
  }, []);

  const handleSplashComplete = () => {
    setLoading(false);
    sessionStorage.setItem("moonz_loaded", "true");
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-[#F0EFE7] flex items-center justify-center font-gothic text-xl tracking-[0.3em]">
        MOONZTHRIFT...
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <SplashLoader onComplete={handleSplashComplete} />
      ) : (
        <div className="relative min-h-screen w-full select-none">
          {/* Vintage grain overlay */}
          <div className="grain-overlay" />
          
          {/* Custom Cursor commented out to fix interface performance lag */}
          {/* <CustomCursor /> */}
          
          {/* Global Slide-Out Cart Drawer */}
          <CartDrawer />
          
          {/* Main Website Content */}
          <main className="relative z-10 w-full min-h-screen flex flex-col">
            {children}
          </main>

          {/* Premium Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
                className="fixed bottom-6 right-6 z-[99999] px-5 py-3.5 rounded-2xl glassmorphism border border-[#B8A98F]/30 shadow-2xl flex items-center gap-3.5 max-w-sm pointer-events-auto"
              >
                <div className="w-5 h-5 rounded-full bg-[#B8A98F]/10 border border-[#B8A98F]/30 flex items-center justify-center text-[#B8A98F] text-[10px] font-bold">
                  ✓
                </div>
                <span className="text-[10px] uppercase tracking-widest text-[#F0EFE7] font-semibold leading-relaxed">
                  {toast.message}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
