"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Trash2, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function Wishlist() {
  const { wishlist, activeUser, toggleWishlist, addToCart, showToast, setCartDrawerOpen } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!activeUser) {
      router.push("/login?redirect=/wishlist");
    }
  }, [activeUser, router]);

  const handleMoveToBag = (product: any) => {
    addToCart(product, 1, product.size);
    toggleWishlist(product);
    setCartDrawerOpen(true);
    showToast(`Moved ${product.name} (${product.size}) to your bag.`, "success");
  };

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
        {/* Header */}
        <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between border-b border-[#F0EFE7]/10 pb-6">
          <div>
            <span className="text-[10px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">Your Vault</span>
            <h1 className="font-gothic text-3xl md:text-5xl font-black mt-2 tracking-wide uppercase">My Wishlist</h1>
          </div>
          <Link 
            href="/shop" 
            className="text-xs uppercase tracking-widest text-[#B8A98F] hover:text-[#FFFFFF] mt-3 md:mt-0 flex items-center gap-1.5 justify-center transition-colors interactive"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
        </div>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlist.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="group relative flex flex-col w-full bg-[#121212] border border-[#F0EFE7]/5 rounded-2xl overflow-hidden interactive"
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#1a1a1a]">
                  <Link href={`/product/${p.id}`} className="absolute inset-0">
                    <Image 
                      src={p.imageUrls[0]} 
                      alt={p.name} 
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </Link>
                  
                  {/* Delete Button */}
                  <button 
                    onClick={(e) => { e.preventDefault(); toggleWishlist(p); }}
                    className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[#0c0c0c]/80 backdrop-blur-md border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-950/40 flex items-center justify-center transition-all interactive"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  
                  {/* Size tag */}
                  <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
                    <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#0c0c0c]/80 backdrop-blur-md text-[#F0EFE7] border border-[#F0EFE7]/5">
                      Size: {p.size}
                    </span>
                  </div>
                </div>

                {/* Content Block */}
                <div className="p-4 flex flex-col gap-3 bg-[#121212]">
                  <div>
                    <span className="text-[8px] uppercase tracking-[0.2em] text-[#B8A98F] font-medium">{p.brand}</span>
                    <Link href={`/product/${p.id}`} className="hover:underline">
                      <h3 className="text-xs font-semibold tracking-wide text-[#F0EFE7] truncate mt-0.5">{p.name}</h3>
                    </Link>
                    <span className="text-xs font-bold text-[#F0EFE7] mt-1 block">${p.price}</span>
                  </div>

                  <button 
                    onClick={() => handleMoveToBag(p)}
                    className="w-full py-2 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-1.5 interactive"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Move to Bag
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl glassmorphism bg-[#121212]/40 border border-[#F0EFE7]/5">
            <span className="text-4xl mb-4 select-none">🖤</span>
            <h3 className="font-gothic text-lg font-bold text-[#F0EFE7] tracking-wider uppercase mb-1">Wishlist Empty</h3>
            <p className="text-xs text-[#F0EFE7]/50 max-w-xs mx-auto uppercase font-light leading-relaxed">
              No grails saved in your vault. Explore our collections and click the heart icons to save items.
            </p>
            <Link 
              href="/shop"
              className="mt-6 px-6 py-2 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center interactive"
            >
              Discover Grails
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
