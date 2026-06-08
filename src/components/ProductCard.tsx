"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/mockData";
import { useStore } from "@/context/StoreContext";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

// Generate mock color swatches based on product ID to simulate variant options in H&M style
const getMockSwatches = (id: string) => {
  const swatchesMap: { [key: string]: string[] } = {
    "prod-1": ["#0c0c0c", "#3a3a3a"], // black, gray
    "prod-2": ["#2e2a2a", "#f0efe7", "#8b7355"], // charcoal, offwhite, brown
    "prod-3": ["#3d4849", "#58676a"], // denim shades
    "prod-4": ["#5a463b", "#36454f"], // plaid colors
    "prod-5": ["#f0efe7", "#1c1c1c"], // white, black
    "prod-6": ["#1f2421", "#3f4b3b"], // olive, dark olive
    "prod-7": ["#0c0c0c", "#4a154b"], // black, purple
    "prod-8": ["#2e2a2a", "#5a5050"], // charcoal, grey
  };
  return swatchesMap[id] || ["#f0efe7"];
};

export default function ProductCard({ product }: ProductCardProps) {
  const { toggleWishlist, isInWishlist, activeUser } = useStore();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  const favorite = isInWishlist(product.id);
  const swatches = getMockSwatches(product.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeUser) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname || "/shop")}`);
      return;
    }
    toggleWishlist(product);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="group relative flex flex-col w-full bg-transparent border-none rounded-none overflow-hidden interactive"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image Container with Zoom effect */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#1a1a1a] rounded-none">
        <Link href={`/product/${product.id}`} className="absolute inset-0">
          <Image 
            src={product.imageUrls[0]} 
            alt={product.name} 
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Sold Out Banner */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-[#0c0c0c]/70 backdrop-blur-[2px] z-20 flex items-center justify-center pointer-events-none">
            <span className="border-y border-[#B8A98F]/50 px-5 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#B8A98F] bg-[#0c0c0c]/85 scale-105 shadow-2xl font-gothic rotate-[-10deg]">
              Sold Out // Void
            </span>
          </div>
        )}

        {/* Favorite Icon (Bottom Right of Image) */}
        <button 
          onClick={handleFavoriteClick}
          className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-[#0c0c0c]/80 backdrop-blur-md border border-[#F0EFE7]/10 flex items-center justify-center text-[#F0EFE7] hover:text-[#B8A98F] hover:border-[#B8A98F] transition-all interactive shadow-lg"
          aria-label="Add to wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${favorite ? "fill-[#B8A98F] text-[#B8A98F]" : ""}`} />
        </button>

        {/* Size & Condition Badges (Top Left of Image) */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
          <span className={`text-[8px] font-bold tracking-wider uppercase px-2 py-0.5 bg-[#0c0c0c]/80 backdrop-blur-md border ${product.stock === 0 ? "text-red-400 border-red-500/20" : "text-[#F0EFE7] border-[#F0EFE7]/10"}`}>
            {product.stock === 0 ? "SOLD OUT" : `SIZE: ${product.size}`}
          </span>
          {product.stock > 0 && (
            <span className="text-[8px] tracking-wider uppercase px-2 py-0.5 bg-[#B8A98F] text-[#0c0c0c] font-bold">
              {product.condition}
            </span>
          )}
        </div>
      </div>

      {/* Info Block (Underneath Image, Borderless) */}
      <div className="pt-3 pb-2 flex flex-col bg-transparent text-[11px] gap-1 pl-0">
        <span className="text-[8px] uppercase tracking-[0.2em] text-[#B8A98F]/80 font-bold font-sans">
          {product.brand}
        </span>
        <Link href={`/product/${product.id}`} className="hover:underline">
          <h3 className="text-[10px] font-bold tracking-wider text-[#F0EFE7] uppercase truncate group-hover:text-[#B8A98F] transition-colors font-sans">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[10px] font-semibold text-[#F0EFE7]/80">
            ${product.price}
          </span>
          <span className="text-[8px] tracking-wider text-[#F0EFE7]/30 uppercase font-light">
            {product.categoryName}
          </span>
        </div>

        {/* Variant Swatches list (replicating bottom dots) */}
        <div className="flex gap-1.5 mt-2 items-center">
          {swatches.map((color, sIdx) => (
            <span 
              key={sIdx} 
              style={{ backgroundColor: color }} 
              className="w-1.5 h-1.5 rounded-full border border-[#F0EFE7]/20"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
