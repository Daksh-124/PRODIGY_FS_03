"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, X, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartDrawer() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    activeCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    cartDrawerOpen,
    setCartDrawerOpen,
    activeUser,
    toggleWishlist,
    isInWishlist,
    showToast
  } = useStore();

  const router = useRouter();
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

  const handleCheckoutClick = () => {
    setCartDrawerOpen(false);
    if (!activeUser) {
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartDrawerOpen(false)}
            className="fixed inset-0 z-[99998] bg-[#0c0c0c]/60 backdrop-blur-sm pointer-events-auto"
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.35 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[440px] z-[99999] bg-[#0f0f0f] border-l border-[#F0EFE7]/10 flex flex-col shadow-2xl pointer-events-auto text-[#F0EFE7]"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#F0EFE7]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#B8A98F]" />
                <h2 className="font-gothic text-base font-bold uppercase tracking-wider">Your Bag</h2>
                <span className="text-[10px] bg-[#B8A98F] text-[#0c0c0c] font-black px-2 py-0.5 rounded-full uppercase scale-90">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="p-1.5 rounded-full border border-[#F0EFE7]/10 hover:border-[#B8A98F] hover:text-[#B8A98F] transition-all interactive cursor-pointer"
                aria-label="Close cart drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Feed */}
            <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}`}
                    className="flex gap-4 p-4 rounded-2xl bg-[#121212] border border-[#F0EFE7]/5 relative group overflow-hidden"
                  >
                    {/* Item Image */}
                    <div className="relative w-16 h-20 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product.imageUrls[0]}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-grow flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <span className="text-[8px] uppercase tracking-[0.15em] text-[#B8A98F] font-bold">
                            {item.product.brand}
                          </span>
                          <h4 className="text-xs font-semibold tracking-wide text-[#F0EFE7] uppercase truncate max-w-[180px] mt-0.5">
                            {item.product.name}
                          </h4>
                          <p className="text-[9px] text-[#F0EFE7]/50 mt-1 uppercase tracking-wider">
                            Size: {item.selectedSize} // {item.product.condition}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                          className="p-1 text-[#F0EFE7]/40 hover:text-red-400 rounded transition-colors interactive cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-[#F0EFE7]/10 rounded-lg p-0.5 bg-[#0c0c0c] scale-90 origin-left">
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.selectedSize, item.quantity - 1)}
                              className="p-1 hover:text-[#B8A98F] transition-colors interactive cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-[10px] font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.selectedSize, item.quantity + 1)}
                              className="p-1 hover:text-[#B8A98F] transition-colors interactive cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              if (!activeUser) {
                                setCartDrawerOpen(false);
                                router.push("/login");
                                return;
                              }
                              if (!isInWishlist(item.product.id)) {
                                toggleWishlist(item.product);
                              }
                              removeFromCart(item.product.id, item.selectedSize);
                              showToast("Grail drops relocated to saved wishlist", "success");
                            }}
                            className="text-[9px] uppercase tracking-widest text-[#B8A98F] hover:text-[#FFFFFF] transition-colors font-semibold interactive cursor-pointer"
                          >
                            Save for Later
                          </button>
                        </div>
                        <span className="text-xs font-bold text-[#F0EFE7]">
                          ${item.product.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center py-20 text-center select-none">
                  <span className="text-4xl mb-4">🛍️</span>
                  <h3 className="font-gothic text-sm font-bold uppercase tracking-wider text-[#F0EFE7] mb-1">
                    Your Bag is Empty
                  </h3>
                  <p className="text-[10px] text-[#F0EFE7]/40 max-w-[200px] mx-auto uppercase leading-relaxed font-light">
                    Explore our curated drops to fill your archive vault.
                  </p>
                  <button
                    onClick={() => setCartDrawerOpen(false)}
                    className="mt-6 px-6 py-2 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors interactive cursor-pointer"
                  >
                    Discover Fits
                  </button>
                </div>
              )}
            </div>

            {/* Bottom summary and checkouts */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-[#F0EFE7]/10 bg-[#0c0c0c]/80 flex flex-col gap-4">
                {/* Promo Forms */}
                <form onSubmit={handleApplyPromo} className="flex flex-col gap-2">
                  {activeCoupon ? (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#B8A98F]/10 border border-[#B8A98F]/20 text-[9px] uppercase tracking-wider font-semibold text-[#B8A98F]">
                      <span>Code Active: {activeCoupon.code} (-{activeCoupon.discountPercent}%)</span>
                      <button type="button" onClick={removeCoupon} className="text-red-400 hover:text-red-300 font-bold interactive cursor-pointer">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex border border-[#F0EFE7]/10 focus-within:border-[#B8A98F] rounded-lg overflow-hidden bg-[#121212] p-0.5">
                        <input
                          type="text"
                          placeholder="PROMO CODE"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          className="w-full bg-transparent text-[9px] tracking-widest uppercase font-light py-2 px-3 border-none outline-none text-[#F0EFE7] placeholder-[#F0EFE7]/30"
                        />
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[8px] font-bold uppercase tracking-widest rounded transition-colors interactive cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[8px] uppercase tracking-widest font-bold text-red-400 pl-1">
                          {couponError}
                        </p>
                      )}
                    </>
                  )}
                </form>

                {/* Subtotals list */}
                <div className="flex flex-col gap-2 text-[10px] uppercase tracking-widest text-[#F0EFE7]/60 border-b border-[#F0EFE7]/5 pb-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#F0EFE7]">${subtotal}</span>
                  </div>
                  {activeCoupon && (
                    <div className="flex justify-between text-[#B8A98F]">
                      <span>Discount</span>
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

                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[#F0EFE7] mb-2">
                  <span>Total</span>
                  <span>${total.toFixed(0)}</span>
                </div>

                {/* checkout link button */}
                <button
                  onClick={handleCheckoutClick}
                  className="w-full py-3 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg flex items-center justify-center gap-1.5 transition-all interactive cursor-pointer"
                >
                  Proceed to Checkout <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
