"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft } from "lucide-react";

export default function Cart() {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    activeCoupon, 
    couponError, 
    applyCoupon, 
    removeCoupon,
    activeUser
  } = useStore();
  
  const router = useRouter();

  useEffect(() => {
    if (!activeUser) {
      router.push("/login?redirect=/cart");
    }
  }, [activeUser, router]);

  const [promoInput, setPromoInput] = useState("");

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput) return;
    const success = applyCoupon(promoInput);
    if (success) {
      setPromoInput("");
    }
  };

  const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const discount = activeCoupon ? (subtotal * activeCoupon.discountPercent) / 100 : 0;
  const shipping = subtotal > 250 || subtotal === 0 ? 0 : 10;
  const total = subtotal - discount + shipping;

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
        {/* Header */}
        <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between border-b border-[#F0EFE7]/10 pb-6">
          <div>
            <span className="text-[10px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">Your Bag</span>
            <h1 className="font-gothic text-3xl md:text-5xl font-black mt-2 tracking-wide uppercase">Shopping Bag</h1>
          </div>
          <Link 
            href="/shop" 
            className="text-xs uppercase tracking-widest text-[#B8A98F] hover:text-[#FFFFFF] mt-3 md:mt-0 flex items-center gap-1.5 justify-center transition-colors interactive"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>

        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Cart Items List */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {cart.map((item, idx) => (
                <div 
                  key={`${item.product.id}-${item.selectedSize}`}
                  className="flex gap-4 p-4 rounded-2xl bg-[#121212] border border-[#F0EFE7]/5"
                >
                  {/* Image */}
                  <div className="relative w-24 h-32 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
                    <Image 
                      src={item.product.imageUrls[0]} 
                      alt={item.product.name} 
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] uppercase tracking-[0.2em] text-[#B8A98F] font-medium">{item.product.brand}</span>
                          <h3 className="text-sm font-semibold tracking-wide text-[#F0EFE7] uppercase mt-0.5">{item.product.name}</h3>
                          <p className="text-[10px] text-[#F0EFE7]/50 mt-1 uppercase tracking-wider">Size: {item.selectedSize} // {item.product.condition}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                          className="p-1.5 text-[#F0EFE7]/40 hover:text-red-400 rounded-full transition-colors interactive"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quantity Selector & Price */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-[#F0EFE7]/10 rounded-lg p-1 bg-[#0c0c0c]">
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.selectedSize, item.quantity - 1)}
                          className="p-1 hover:text-[#B8A98F] transition-colors interactive"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.selectedSize, item.quantity + 1)}
                          className="p-1 hover:text-[#B8A98F] transition-colors interactive"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-bold text-[#F0EFE7]">
                        ${item.product.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Sidebar Summary */}
            <div className="flex flex-col gap-6">
              <div className="p-6 rounded-2xl bg-[#121212] border border-[#F0EFE7]/5 flex flex-col gap-5">
                <h3 className="font-gothic text-xs uppercase tracking-[0.2em] font-bold text-[#B8A98F]">Summary</h3>
                
                <div className="flex flex-col gap-3 text-xs uppercase tracking-wider font-light text-[#F0EFE7]/70 border-b border-[#F0EFE7]/10 pb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#F0EFE7]">${subtotal}</span>
                  </div>
                  {activeCoupon && (
                    <div className="flex justify-between text-[#B8A98F]">
                      <span>Discount ({activeCoupon.code})</span>
                      <span className="font-semibold">-${discount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-semibold text-[#F0EFE7]">
                      {shipping === 0 ? "FREE" : `$${shipping}`}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-[#F0EFE7]">
                  <span>Total</span>
                  <span>${total.toFixed(0)}</span>
                </div>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyPromo} className="mt-2 flex flex-col gap-2">
                  {activeCoupon ? (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#B8A98F]/10 border border-[#B8A98F]/25 text-[10px] uppercase tracking-wider font-semibold text-[#B8A98F]">
                      <span>Promo applied: {activeCoupon.code} (-{activeCoupon.discountPercent}%)</span>
                      <button type="button" onClick={removeCoupon} className="text-red-400 hover:text-red-300 font-bold interactive">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex border border-[#F0EFE7]/10 focus-within:border-[#B8A98F] rounded-lg overflow-hidden bg-[#0c0c0c] p-1">
                        <input 
                          type="text" 
                          placeholder="PROMO CODE" 
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          className="w-full bg-transparent text-[10px] tracking-widest uppercase font-light py-2 px-3 border-none outline-none text-[#F0EFE7] placeholder-[#F0EFE7]/30"
                        />
                        <button 
                          type="submit"
                          className="px-4 py-2 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[9px] font-bold uppercase tracking-widest rounded-md transition-colors interactive"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[9px] uppercase tracking-widest font-semibold text-red-400 mt-1 pl-1">
                          {couponError}
                        </p>
                      )}
                      <p className="text-[8px] text-[#F0EFE7]/40 uppercase tracking-widest pl-1 mt-0.5">Try: LUNAR15 or STREETWEAR20</p>
                    </>
                  )}
                </form>

                <Link 
                  href="/checkout"
                  className="w-full py-3 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-[0.2em] rounded-lg flex items-center justify-center gap-1.5 transition-colors mt-2 interactive"
                >
                  Checkout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl glassmorphism-light">
            <span className="text-4xl mb-4 select-none">🛍️</span>
            <h3 className="font-gothic text-lg font-bold text-[#F0EFE7] tracking-wider uppercase mb-1">Your Bag is Empty</h3>
            <p className="text-xs text-[#F0EFE7]/50 max-w-xs mx-auto uppercase font-light leading-relaxed">
              Looks like you haven&apos;t added any fits to your bag yet. Explore the shop to get started.
            </p>
            <Link 
              href="/shop"
              className="mt-6 px-6 py-2 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center interactive"
            >
              Discover Fits
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
