"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, ShieldCheck, CreditCard, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { createOrderAction } from "@/lib/actions";

export default function Checkout() {
  const { 
    cart, 
    activeCoupon, 
    clearCart, 
    activeUser, 
    applyCoupon, 
    completeFirstOrder,
    showToast,
    defaultAddress,
    decrementMockProductSizeStock
  } = useStore();
  
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "cod">("card");

  // Form State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [couponAttempted, setCouponAttempted] = useState(false);


  // Redirect guests to login & pre-populate address
  useEffect(() => {
    const savedUserStr = localStorage.getItem("moonz_user");
    const user = activeUser || (savedUserStr ? JSON.parse(savedUserStr) : null);
    console.log("[Checkout Page] Pre-population useEffect triggered. user:", user, "defaultAddress:", defaultAddress);
    
    if (!user) {
      console.log("[Checkout Page] No user found, redirecting to login");
      router.push("/login?redirect=/checkout");
    } else {
      setEmail(user.email || "");
      setName(user.name || "");
      if (defaultAddress) {
        console.log("[Checkout Page] Setting form values from defaultAddress:", defaultAddress);
        setAddress(defaultAddress.street || "");
        setCity(defaultAddress.city || "");
        setZip(defaultAddress.zip || "");
      } else {
        console.log("[Checkout Page] defaultAddress is null or undefined");
      }
    }
  }, [activeUser, defaultAddress, router]);

  // Auto-apply WELCOME15 coupon if first order is active and no coupon is set
  useEffect(() => {
    if (activeUser?.isFirstOrder && !activeCoupon && !couponAttempted) {
      console.log("[Checkout Page] Attempting to auto-apply WELCOME15 coupon");
      setCouponAttempted(true);
      applyCoupon("WELCOME15");
    }
  }, [activeUser, activeCoupon, couponAttempted, applyCoupon]);

  const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const discount = activeCoupon ? (subtotal * activeCoupon.discountPercent) / 100 : 0;
  const shipping = subtotal > 250 || subtotal === 0 ? 0 : 10;
  const codFee = paymentMethod === "cod" ? 10 : 0;
  const total = subtotal - discount + shipping + codFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);

    if (paymentMethod === "cod") {
      const codPayload = {
        userId: activeUser ? activeUser.id : "usr-guest",
        total: total,
        street: address,
        city: city,
        zip: zip,
        couponCode: activeCoupon ? activeCoupon.code : null,
        couponDiscountPercent: activeCoupon ? activeCoupon.discountPercent : 0,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          size: item.selectedSize
        }))
      };

      const res = await createOrderAction(codPayload);
      
      if (res.success && res.orderId) {
        setOrderId(`ord-${res.orderId.substring(0, 5)}`);
        setSuccess(true);
        clearCart();
        completeFirstOrder();
        showToast("Cash on Delivery order successfully placed!", "success");
      } else {
        const mockOrderId = `ord-${String(Date.now()).substring(7)}`;
        const mockOrder = {
          id: mockOrderId,
          realId: `mock-cod-${Date.now()}`,
          userId: activeUser ? activeUser.id : "usr-guest",
          customerName: name,
          email: email,
          date: new Date().toISOString().split("T")[0],
          total: total,
          status: "PENDING",
          address: {
            street: address,
            city: city,
            state: "WA",
            zip: zip,
            country: "United States"
          },
          coupon: activeCoupon ? {
            code: activeCoupon.code,
            discountPercent: activeCoupon.discountPercent
          } : null,
          items: cart.map((item) => ({
            productId: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            size: item.selectedSize,
            imageUrl: item.product.imageUrls[0]
          }))
        };

        const savedOrdersStr = localStorage.getItem("moonz_mock_orders");
        const currentOrders = savedOrdersStr ? JSON.parse(savedOrdersStr) : [];
        currentOrders.unshift(mockOrder);
        localStorage.setItem("moonz_mock_orders", JSON.stringify(currentOrders));

        // Decrement mock size-specific stock reactively
        cart.forEach((item) => {
          decrementMockProductSizeStock(item.product.id, item.selectedSize, item.quantity);
        });

        setOrderId(mockOrderId);
        setSuccess(true);
        clearCart();
        completeFirstOrder();
        showToast("[Mock] COD order placed successfully!", "success");
      }
      setLoading(false);
      return;
    }

    const checkoutPayload = {
      userId: activeUser ? activeUser.id : "usr-guest",
      couponCode: activeCoupon ? activeCoupon.code : null,
      couponDiscountPercent: activeCoupon ? activeCoupon.discountPercent : 0,
      address: {
        street: address,
        city: city,
        state: "WA", // default
        zip: zip,
        country: "United States"
      },
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        size: item.selectedSize,
        imageUrl: item.product.imageUrls[0]
      }))
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(checkoutPayload)
      });

      const data = await res.json();
      
      if (data.url) {
        // Securely redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        showToast(data.error || "Failed to initiate Stripe Checkout session.", "error");
        setLoading(false);
      }
    } catch (err) {
      console.error("Stripe Redirection Failure:", err);
      showToast("Network transmission failure. Check checkout gateway configuration.", "error");
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
        {success ? (
          /* Checkout Success Overlay */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center py-20 px-8 rounded-3xl glassmorphism flex flex-col items-center gap-6"
          >
            <CheckCircle className="w-16 h-16 text-[#B8A98F] animate-bounce" />
            <span className="text-[10px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">Transmission Cleared</span>
            <h1 className="font-gothic text-2xl md:text-3xl font-black uppercase text-[#F0EFE7] tracking-wider">Order Placed</h1>
            
            <div className="p-4 rounded-xl border border-[#F0EFE7]/5 bg-[#121212]/40 w-full text-xs text-[#F0EFE7]/80 flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="uppercase tracking-widest text-[#F0EFE7]/40">Order ID:</span>
                <span className="font-bold text-[#B8A98F]">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase tracking-widest text-[#F0EFE7]/40">Status:</span>
                <span className="font-bold uppercase tracking-wider text-green-400">Paid // Confirmed</span>
              </div>
            </div>
            
            <p className="text-xs text-[#F0EFE7]/60 leading-relaxed uppercase font-light">
              Your celestial package has been reserved in our archives. An authentication report and tracking ID have been transmitted to your email box.
            </p>

            <Link 
              href="/"
              className="w-full py-3 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-[0.25em] rounded-lg transition-colors flex items-center justify-center interactive"
            >
              Return Home
            </Link>
          </motion.div>
        ) : (
          /* Checkout Form & Order Summary */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Form Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="mb-4">
                <span className="text-[10px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">Transmission Details</span>
                <h1 className="font-gothic text-3xl font-black uppercase text-[#F0EFE7] tracking-wide mt-2">Checkout Details</h1>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                {/* Shipping Details */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#B8A98F] border-b border-[#F0EFE7]/10 pb-2">1. Shipping Destination</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="checkout-email" className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold pl-1">Transmission Email</label>
                      <input 
                        id="checkout-email"
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="EMAIL@DOMAIN.COM"
                        className="bg-[#121212] border border-[#F0EFE7]/10 rounded-lg p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="checkout-name" className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold pl-1">Full Name</label>
                      <input 
                        id="checkout-name"
                        type="text" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="LILA MOON"
                        className="bg-[#121212] border border-[#F0EFE7]/10 rounded-lg p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="checkout-address" className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold pl-1">Street Address</label>
                    <input 
                      id="checkout-address"
                      type="text" 
                      required 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="104 CELESTIAL ST, SUITE B"
                      className="bg-[#121212] border border-[#F0EFE7]/10 rounded-lg p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="checkout-city" className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold pl-1">City</label>
                      <input 
                        id="checkout-city"
                        type="text" 
                        required 
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="SEATTLE"
                        className="bg-[#121212] border border-[#F0EFE7]/10 rounded-lg p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="checkout-zip" className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold pl-1">Zip/Postal Code</label>
                      <input 
                        id="checkout-zip"
                        type="text" 
                        required 
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        placeholder="98101"
                        className="bg-[#121212] border border-[#F0EFE7]/10 rounded-lg p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                      />
                    </div>
                  </div>
                </div>

                {/* Billing / Card details */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#B8A98F] border-b border-[#F0EFE7]/10 pb-2">2. Payment Method</h3>
                  
                  {/* Selector Tabs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`py-3 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 interactive ${
                        paymentMethod === "card"
                          ? "bg-[#B8A98F]/10 border-[#B8A98F] text-[#F0EFE7] ring-1 ring-[#B8A98F]"
                          : "border-[#F0EFE7]/10 bg-[#121212] text-[#F0EFE7]/60 hover:text-[#B8A98F]"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 flex-shrink-0" />
                      Card Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("upi")}
                      className={`py-3 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 interactive ${
                        paymentMethod === "upi"
                          ? "bg-[#B8A98F]/10 border-[#B8A98F] text-[#F0EFE7] ring-1 ring-[#B8A98F]"
                          : "border-[#F0EFE7]/10 bg-[#121212] text-[#F0EFE7]/60 hover:text-[#B8A98F]"
                      }`}
                    >
                      <span className="text-xs font-black">₹</span>
                      UPI Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`py-3 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 interactive ${
                        paymentMethod === "cod"
                          ? "bg-[#B8A98F]/10 border-[#B8A98F] text-[#F0EFE7] ring-1 ring-[#B8A98F]"
                          : "border-[#F0EFE7]/10 bg-[#121212] text-[#F0EFE7]/60 hover:text-[#B8A98F]"
                      }`}
                    >
                      <span className="text-xs">🚚</span>
                      Cash on Delivery
                    </button>
                  </div>

                  {/* Payment Details Container */}
                  <div className="p-5 rounded-2xl border border-[#B8A98F]/20 bg-[#B8A98F]/5 flex flex-col gap-3 transition-all duration-300">
                    {paymentMethod === "card" ? (
                      <>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B8A98F]">
                          <CreditCard className="w-4 h-4 flex-shrink-0" />
                          <span>Global Stripe Gateway</span>
                        </div>
                        <p className="text-[10px] text-[#F0EFE7]/60 uppercase tracking-wider leading-relaxed">
                          Secure redirect to Stripe Checkout. We accept Mastercard, Visa, American Express, Apple Pay, and Google Pay worldwide.
                        </p>
                      </>
                    ) : paymentMethod === "upi" ? (
                      <>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B8A98F]">
                          <span className="text-sm font-black">₹</span>
                          <span>UPI Local Payment (INR Context)</span>
                        </div>
                        <p className="text-[10px] text-[#F0EFE7]/60 uppercase tracking-wider leading-relaxed">
                          Secure redirect to Stripe India portal. Pay with standard UPI applications like Google Pay, PhonePe, Paytm, BHIM, or your bank's UPI handle.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B8A98F]">
                          <span className="text-xs">🚚</span>
                          <span>COD Payment (Extra Handling Fee)</span>
                        </div>
                        <p className="text-[10px] text-[#F0EFE7]/60 uppercase tracking-wider leading-relaxed">
                          Pay in cash upon delivery. An additional flat COD handling fee of $10 applies to cover carrier processing.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={loading || cart.length === 0}
                  className="w-full py-4 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-[0.25em] rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 interactive disabled:opacity-40"
                >
                  {loading ? "Processing..." : paymentMethod === "cod" ? "Place COD Order" : `Authorize & Pay $${total.toFixed(0)}`}
                </button>
              </form>
            </div>

            {/* Order Summary Column */}
            <div className="flex flex-col gap-6">
              <div className="p-6 rounded-2xl bg-[#121212] border border-[#F0EFE7]/5 flex flex-col gap-5 sticky top-28">
                <h3 className="font-gothic text-xs uppercase tracking-[0.2em] font-bold text-[#B8A98F]">Bag Review</h3>
                
                {/* List Items */}
                <div className="flex flex-col gap-4 max-h-60 overflow-y-auto pr-2 border-b border-[#F0EFE7]/10 pb-4">
                  {cart.length > 0 ? (
                    cart.map((item) => (
                      <div key={`${item.product.id}-${item.selectedSize}`} className="flex gap-3 text-xs">
                        <div className="relative w-12 h-16 flex-shrink-0 bg-[#1a1a1a] rounded overflow-hidden">
                          <Image 
                            src={item.product.imageUrls[0]} 
                            alt={item.product.name} 
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-grow flex flex-col justify-between">
                          <div>
                            <p className="font-semibold text-[#F0EFE7] uppercase truncate max-w-[150px]">{item.product.name}</p>
                            <p className="text-[9px] text-[#F0EFE7]/50 uppercase mt-0.5">Size: {item.selectedSize} // Qty: {item.quantity}</p>
                          </div>
                          <span className="font-bold text-[#F0EFE7] text-[11px]">${item.product.price * item.quantity}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-[#F0EFE7]/40 uppercase tracking-widest py-4">No items to review.</p>
                  )}
                </div>

                {/* Subtotal summary */}
                <div className="flex flex-col gap-2.5 text-[10px] uppercase tracking-widest text-[#F0EFE7]/70 border-b border-[#F0EFE7]/10 pb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal}</span>
                  </div>
                  {activeCoupon && (
                    <div className="flex justify-between text-[#B8A98F]">
                      <span>Discount</span>
                      <span>-${discount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "FREE" : `$${shipping}`}</span>
                  </div>
                  {paymentMethod === "cod" && (
                    <div className="flex justify-between text-[#B8A98F]">
                      <span>COD Handling Fee</span>
                      <span>$10</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[#F0EFE7]">
                  <span>Total</span>
                  <span>${total.toFixed(0)}</span>
                </div>

                <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-[#F0EFE7]/40 mt-2 justify-center border-t border-[#F0EFE7]/5 pt-4">
                  <ShieldCheck className="w-4 h-4 text-[#B8A98F]" />
                  <span>Stripe Secured 256-bit connection</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
