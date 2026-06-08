"use client";

import Navbar from "@/components/Navbar";
import Image from "next/image";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { useStore } from "@/context/StoreContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Send } from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const { products, fetchProducts } = useStore();
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  // Get trending products (main showcase)
  const trendingProducts = products.filter((p) => p.isTrending).slice(0, 4);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setEmailSubscribed(true);
    setNewsletterEmail("");
  };

  const collections = [
    { name: "Curated Tops", slug: "tops", img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop" },
    { name: "Premium Bottoms", slug: "bottoms", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop" },
    { name: "Rare Grails", slug: "rare-finds", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop" }
  ];

  return (
    <>
      <Navbar />
      <Hero />

      {/* Simplified Curated Collections Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-[9px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">THE ARCHIVE</span>
            <h2 className="font-gothic text-2xl md:text-4xl font-extrabold mt-1 tracking-wide uppercase">Curated Capsules</h2>
          </div>
          <Link 
            href="/shop" 
            className="text-[10px] tracking-widest uppercase text-[#B8A98F] hover:text-[#FFFFFF] transition-colors mt-2 md:mt-0 flex items-center gap-1.5 interactive"
          >
            Shop Catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((col, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="group relative aspect-[16/10] rounded-2xl overflow-hidden border border-[#F0EFE7]/5 bg-[#121212] interactive"
            >
              <div className="absolute inset-0 bg-[#0c0c0c]/40 z-10 transition-colors group-hover:bg-[#0c0c0c]/65" />
              <Image 
                src={col.img} 
                alt={col.name} 
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-103 grayscale opacity-60"
              />
              <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end items-start">
                <h3 className="font-gothic text-base font-bold text-[#F0EFE7] tracking-wider uppercase mb-2">{col.name}</h3>
                <Link 
                  href={`/shop?category=${col.slug}`}
                  className="text-[9px] tracking-widest font-bold uppercase text-[#B8A98F] group-hover:text-[#F0EFE7] flex items-center gap-1 transition-colors"
                >
                  Enter Archive →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Streamlined Trending Drops */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-[#F0EFE7]/5">
        <div className="flex flex-col items-center text-center mb-10">
          <span className="text-[9px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Spotlight
          </span>
          <h2 className="font-gothic text-2xl md:text-4xl font-extrabold mt-1 tracking-wide uppercase">Active Drops</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingProducts.length > 0 ? (
            trendingProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))
          ) : (
            <p className="text-xs text-[#F0EFE7]/40 uppercase col-span-full text-center">No fits currently in orbit.</p>
          )}
        </div>
      </section>

      {/* Brand Storytelling (Simplified & Elegant) */}
      <section id="brand-story" className="py-20 bg-[#080808] border-t border-[#F0EFE7]/5 px-6">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
          <span className="text-[9px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">Brand Philosophy</span>
          <h2 className="font-gothic text-2xl md:text-3xl font-extrabold tracking-wide uppercase text-[#F0EFE7] max-w-xl">
            At the Intersection of Shadows & Streetwear
          </h2>
          <p className="text-xs text-[#F0EFE7]/70 leading-relaxed uppercase max-w-2xl font-light">
            MoonzThrift is a dedicated archive filtering decades of design history. We reclaim unique streetwear, distressed heavy cottons, and high-drape garments that possess character. Every piece is cleaned, measured, and verified before drop release.
          </p>
          <div className="flex gap-10 mt-4 text-center">
            <div>
              <p className="text-base font-gothic font-bold text-[#B8A98F]">100%</p>
              <p className="text-[8px] uppercase tracking-wider text-[#F0EFE7]/40 mt-0.5 font-bold">Legit Checked</p>
            </div>
            <div className="w-px h-6 bg-[#F0EFE7]/10" />
            <div>
              <p className="text-base font-gothic font-bold text-[#B8A98F]">1 OF 1</p>
              <p className="text-[8px] uppercase tracking-wider text-[#F0EFE7]/40 mt-0.5 font-bold">Unique Drops</p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Newsletter Sign-up */}
      <section className="py-20 px-6 max-w-3xl mx-auto text-center border-t border-[#F0EFE7]/5">
        <div className="flex flex-col items-center gap-4">
          <span className="text-[9px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">TRANSMISSIONS</span>
          <h2 className="font-gothic text-xl md:text-2xl font-extrabold uppercase text-[#F0EFE7] tracking-wider">
            Sign up for drop alerts
          </h2>
          <p className="text-[11px] text-[#F0EFE7]/50 max-w-sm mx-auto uppercase leading-relaxed font-light">
            Receive orbital updates on curated archives before they sell out.
          </p>

          {emailSubscribed ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-semibold text-[#B8A98F] uppercase tracking-wider mt-4"
            >
              🚀 Registered successfully. Transmission open.
            </motion.p>
          ) : (
            <form onSubmit={handleSubscribe} className="w-full max-w-md flex items-center border border-[#F0EFE7]/10 focus-within:border-[#B8A98F] rounded-full p-1 transition-all bg-[#0c0c0c]/40 mt-4">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full bg-transparent text-[10px] tracking-widest uppercase font-light py-2 px-4 border-none outline-none text-[#F0EFE7] placeholder-[#F0EFE7]/30"
                required
              />
              <button 
                type="submit" 
                className="p-2 rounded-full bg-[#F0EFE7] text-[#0c0c0c] hover:bg-[#B8A98F] transition-colors flex items-center justify-center interactive"
                aria-label="Subscribe"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
