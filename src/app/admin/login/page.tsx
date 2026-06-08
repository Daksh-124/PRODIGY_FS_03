"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, Lock, ShieldAlert, Key } from "lucide-react";
import { checkIsAdminAction } from "@/lib/actions";

export default function AdminLogin() {
  const router = useRouter();
  const { loginMock, logoutMock, activeUser } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in as Admin
  useEffect(() => {
    if (activeUser) {
      if (activeUser.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        // If a standard USER hits this page, prompt them to sign in as admin
        setErrorMsg("Your current account is a regular buyer account. Please sign in with admin credentials.");
      }
    }
  }, [activeUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Please populate all credential inputs.");
      return;
    }

    setLoading(true);

    try {
      // 1. Verify user is an administrator first
      const isAdmin = await checkIsAdminAction(email);
      if (!isAdmin) {
        setErrorMsg("Access Restricted: Regular buyer accounts are not authorized to access the Admin Console.");
        setLoading(false);
        return;
      }

      // 2. Perform NextAuth authentication
      const res = await loginMock(email, password);
      if (res.success) {
        setSuccessMsg("Terminal authorized. Accessing operations console...");
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 1200);
      } else {
        setErrorMsg(res.error || "Authentication failed. Check your security credentials.");
      }
    } catch (err) {
      setErrorMsg("A system authentication failure occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleInstantBypass = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    
    const res = await loginMock("ADMIN");
    if (res.success) {
      setSuccessMsg("Bypass active. Initiating administrator console...");
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1000);
    } else {
      setErrorMsg("Bypass failure.");
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />

      <div className="flex-grow flex items-center justify-center py-24 px-6 max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-[#121212] border border-[#B8A98F]/20 p-8 rounded-3xl relative overflow-hidden"
        >
          {/* Background Glow Ring */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#B8A98F]/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#8B7355]/10 blur-3xl" />

          {/* Secure system header */}
          <div className="flex flex-col items-center text-center mb-8 relative z-10">
            <span className="text-[9px] tracking-[0.3em] text-[#B8A98F] uppercase font-bold flex items-center gap-1.5 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
              SECURE LOGIN TERMINAL // PORTAL
            </span>
            <h1 className="font-gothic text-xl md:text-2xl font-black tracking-widest text-[#F0EFE7] uppercase">
              MoonzThrift Admin
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-[#B8A98F] mt-1.5 font-semibold">
              Console Authentication Protocol
            </p>
          </div>

          {/* Success/Error displays */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 mb-5 text-[10px] uppercase tracking-wider text-red-400 text-center font-bold flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                {errorMsg}
              </motion.div>
            )}
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-500/10 border border-green-500/30 rounded-xl p-3.5 mb-5 text-[10px] uppercase tracking-wider text-green-400 text-center font-bold flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Credentials Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold pl-1">Admin Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  placeholder="ADMIN@MOONZTHRIFT.COM" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0c0c0c] border border-[#F0EFE7]/10 focus:border-[#B8A98F] rounded-xl py-3 pl-10 pr-4 text-xs tracking-wider uppercase outline-none text-[#F0EFE7] transition-colors"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#F0EFE7]/30" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold pl-1">Security Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0c0c0c] border border-[#F0EFE7]/10 focus:border-[#B8A98F] rounded-xl py-3 pl-10 pr-4 text-xs tracking-wider outline-none text-[#F0EFE7] transition-colors"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#F0EFE7]/30" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#F0EFE7] hover:bg-[#B8A98F] disabled:bg-[#F0EFE7]/40 text-[#0c0c0c] text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 mt-2 interactive"
            >
              <Key className="w-3.5 h-3.5" />
              {loading ? "Authorizing..." : "Authorize Access"}
            </button>
          </form>

          {/* Dev Bypass Helper Section */}
          {process.env.NODE_ENV !== "production" && (
            <div className="mt-8 pt-6 border-t border-[#F0EFE7]/10 relative z-10 flex flex-col gap-3 text-center">
              <span className="text-[8px] uppercase tracking-widest text-[#B8A98F]/60 font-bold">Developer Bypass Node</span>
              <div className="p-3.5 rounded-xl border border-[#B8A98F]/20 bg-[#0c0c0c]/40 text-[9px] text-[#F0EFE7]/50 uppercase leading-relaxed font-light">
                Admin Creds: admin@moonzthrift.com // admin123
              </div>
              <button
                onClick={handleInstantBypass}
                disabled={loading}
                className="py-2.5 border border-[#B8A98F]/25 hover:border-[#B8A98F] text-[#F0EFE7]/80 hover:text-[#B8A98F] text-[9px] uppercase tracking-widest rounded-xl transition-all interactive disabled:opacity-40"
              >
                Instant Admin Bypass (Dev Only)
              </button>
            </div>
          )}

        </motion.div>
      </div>

      <Footer />
    </>
  );
}
