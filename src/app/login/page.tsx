"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, Lock, User, Sparkles, ArrowRight } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginMock, registerMock, activeUser } = useStore();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [redirectPath, setRedirectPath] = useState("/");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const r = searchParams.get("redirect") || "/";
    setRedirectPath(r);
  }, [searchParams]);

  useEffect(() => {
    // If user is already logged in, send them to the redirect path
    if (activeUser) {
      router.push(redirectPath);
    }
  }, [activeUser, redirectPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (mode === "login") {
      if (!email || !password) {
        setErrorMsg("Please fill in all security fields.");
        return;
      }

      const res = await loginMock(email, password);
      if (res.success) {
        setSuccessMsg("Authorization granted. Accessing vault...");
        setTimeout(() => {
          router.push(redirectPath);
        }, 1200);
      } else {
        setErrorMsg(res.error || "Invalid credentials.");
      }
    } else {
      if (!name || !email || !password || !confirmPassword) {
        setErrorMsg("All credentials must be populated.");
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg("Security passwords do not match.");
        return;
      }

      if (password.length < 6) {
        setErrorMsg("Password security strength must be at least 6 characters.");
        return;
      }

      const res = await registerMock(name, email, password);
      if (res.success) {
        setSuccessMsg("Registration complete! WELCOME15 (15% discount) auto-applied to first purchase. Entering vault...");
        setTimeout(() => {
          router.push(redirectPath);
        }, 2000);
      } else {
        setErrorMsg(res.error || "Registration failed.");
      }
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-20 px-6 max-w-7xl mx-auto w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#121212] border border-[#F0EFE7]/5 p-8 rounded-3xl relative overflow-hidden"
      >
        {/* Glow Element */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#B8A98F]/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#8B7355]/5 blur-3xl" />

        {/* Brand stack */}
        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="flex flex-col items-center justify-center leading-none text-[6px] text-[#B8A98F] mb-2 select-none">
            <span>🌕</span>
            <span>🌗</span>
            <span>🌑</span>
          </div>
          <h1 className="font-gothic text-2xl font-black tracking-[0.2em] text-[#F0EFE7] uppercase">
            MoonzThrift Auth
          </h1>
          <p className="text-[9px] uppercase tracking-widest text-[#B8A98F] mt-1.5 font-semibold">
            {mode === "login" ? "Enter the Archives" : "Create New Access"}
          </p>
        </div>

        {/* Message indicators */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5 text-[10px] uppercase tracking-wider text-red-400 text-center font-semibold"
            >
              {errorMsg}
            </motion.div>
          )}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-5 text-[10px] uppercase tracking-wider text-green-400 text-center font-semibold"
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
          {mode === "register" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold pl-1">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  placeholder="LILA MOON" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl py-3 pl-10 pr-4 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7] placeholder-[#F0EFE7]/20"
                />
                <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#F0EFE7]/30 w-4 h-4" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold pl-1">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                required
                placeholder="EMAIL@DOMAIN.COM" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl py-3 pl-10 pr-4 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7] placeholder-[#F0EFE7]/20"
              />
              <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#F0EFE7]/30 w-4 h-4" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold pl-1">Password</label>
            <div className="relative">
              <input 
                type="password" 
                required
                placeholder="••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl py-3 pl-10 pr-4 text-xs tracking-wider outline-none focus:border-[#B8A98F] text-[#F0EFE7] placeholder-[#F0EFE7]/20"
              />
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#F0EFE7]/30 w-4 h-4" />
            </div>
          </div>

          {mode === "register" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold pl-1">Confirm Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  placeholder="••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl py-3 pl-10 pr-4 text-xs tracking-wider outline-none focus:border-[#B8A98F] text-[#F0EFE7] placeholder-[#F0EFE7]/20"
                />
                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#F0EFE7]/30 w-4 h-4" />
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="bg-[#B8A98F]/5 border border-[#B8A98F]/10 rounded-xl p-3 mt-1 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#B8A98F] mt-0.5 flex-shrink-0 animate-pulse" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#B8A98F]">First Order Drop Discount</span>
                <span className="text-[8px] text-[#F0EFE7]/60 uppercase tracking-wide">Registering automatically claims a 15% discount on your first checkout.</span>
              </div>
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-3 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-1.5 transition-colors mt-3 interactive"
          >
            {mode === "login" ? "Authorize Entry" : "Establish Profile"} <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Social Sign-in Separator */}
          <div className="flex items-center gap-3 my-2 text-[8px] uppercase tracking-widest text-[#F0EFE7]/20">
            <div className="h-px bg-[#F0EFE7]/10 flex-grow" />
            <span>Or Connect Socially</span>
            <div className="h-px bg-[#F0EFE7]/10 flex-grow" />
          </div>

          <button 
            type="button"
            onClick={() => signIn("google", { callbackUrl: redirectPath })}
            className="w-full py-3 border border-[#F0EFE7]/10 hover:border-[#B8A98F] hover:text-[#B8A98F] bg-transparent text-xs font-bold uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2.5 transition-all interactive"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign In with Google
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="mt-6 text-center border-t border-[#F0EFE7]/5 pt-4 text-[10px] uppercase tracking-widest text-[#F0EFE7]/40 relative z-10 font-medium">
          {mode === "login" ? (
            <p>
              New here?{" "}
              <button 
                onClick={() => { setMode("register"); setErrorMsg(""); setSuccessMsg(""); }}
                className="text-[#B8A98F] hover:underline hover:text-[#FFFFFF] transition-colors font-bold interactive"
              >
                Register Account
              </button>
            </p>
          ) : (
            <p>
              Have access?{" "}
              <button 
                onClick={() => { setMode("login"); setErrorMsg(""); setSuccessMsg(""); }}
                className="text-[#B8A98F] hover:underline hover:text-[#FFFFFF] transition-colors font-bold interactive"
              >
                Sign In Credentials
              </button>
            </p>
          )}
        </div>

      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen bg-[#0c0c0c] text-[#F0EFE7] flex items-center justify-center font-gothic text-xl tracking-[0.3em]">
          INITIALIZING PORTAL...
        </div>
      }>
        <LoginContent />
      </Suspense>
      <Footer />
    </>
  );
}
