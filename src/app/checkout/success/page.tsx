"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, ShieldCheck, ShoppingBag, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { finalizeStripeOrderAction, createOrderAction } from "@/lib/actions";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart, activeUser, completeFirstOrder, fetchOrdersHistory, decrementMockProductSizeStock } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState("");
  const [isMock, setIsMock] = useState(false);
  const [gatewayUsed, setGatewayUsed] = useState("");
  
  // Prevent duplicate execution of finalization block in React 18/19 StrictMode
  const finalized = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setError("No transaction reference detected. Invalid landing access.");
      setLoading(false);
      return;
    }

    if (finalized.current) return;
    finalized.current = true;

    const processFinalization = async () => {
      try {
        if (sessionId.startsWith("mock_session_")) {
          setIsMock(true);
          setGatewayUsed(searchParams.get("gateway") || "Mock Stripe Gateway");
          
          // Parse mock details from search parameters
          const userId = searchParams.get("userId") || "usr-guest";
          const street = searchParams.get("street") || "";
          const city = searchParams.get("city") || "";
          const state = searchParams.get("state") || "WA";
          const zip = searchParams.get("zip") || "";
          const country = searchParams.get("country") || "United States";
          const couponCode = searchParams.get("couponCode") || null;
          const couponDiscountPercent = Number(searchParams.get("couponDiscountPercent") || 0);
          
          let items: any[] = [];
          try {
            items = JSON.parse(searchParams.get("items") || "[]");
          } catch (e) {
            console.error("Failed to parse items:", e);
          }

          // Calculate total price
          const subtotal = items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
          const discount = couponCode ? (subtotal * couponDiscountPercent) / 100 : 0;
          const shipping = subtotal > 250 || subtotal === 0 ? 0 : 10;
          const total = subtotal - discount + shipping;

          // Commit database order entry
          const res = await createOrderAction({
            userId,
            street,
            city,
            state,
            zip,
            country,
            total,
            couponCode,
            couponDiscountPercent,
            items: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              size: item.size
            }))
          });

          if (res.success && res.orderId) {
            setOrderId(`MT-${res.orderId.substring(0, 6).toUpperCase()}`);
          } else {
            // Local fallback order ID
            setOrderId(`MT-${Math.floor(100000 + Math.random() * 900000)}`);
          }

          // Decrement mock size-specific stock reactively
          items.forEach((item: any) => {
            decrementMockProductSizeStock(item.productId, item.size, item.quantity);
          });

          // Retire first-order promo if active
          if (activeUser?.isFirstOrder) {
            completeFirstOrder();
          }

          clearCart();
          await fetchOrdersHistory();
          setLoading(false);
        } else {
          // Real Stripe session finalization
          const res = await finalizeStripeOrderAction(sessionId);
          if (res.success) {
            setOrderId(res.orderId ? `MT-${res.orderId.substring(0, 6).toUpperCase()}` : `MT-${sessionId.substring(8, 14).toUpperCase()}`);
            
            // Retire first-order promo if active
            if (activeUser?.isFirstOrder) {
              completeFirstOrder();
            }

            clearCart();
            await fetchOrdersHistory();
            setLoading(false);
          } else {
            setError(res.error || "Failed to finalize Stripe transaction session.");
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.error("Order finalization error:", err);
        setError(err.message || "An unexpected error occurred during confirmation.");
        setLoading(false);
      }
    };

    processFinalization();
  }, [searchParams, activeUser, clearCart, completeFirstOrder, fetchOrdersHistory]);

  return (
    <>
      <Navbar />

      <div className="flex-grow flex flex-col items-center justify-center py-20 px-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-10 h-10 text-[#B8A98F] animate-spin" />
            <span className="text-[10px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">Stripe Network Sync</span>
            <h2 className="font-gothic text-xl uppercase font-black tracking-widest text-[#F0EFE7]">Clearing Transmission...</h2>
            <p className="text-xs text-[#F0EFE7]/50 max-w-xs uppercase font-light">
              We are verifying your transaction with the Stripe gateway secure database archives. Please hold connection.
            </p>
          </div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center py-16 px-8 rounded-3xl glassmorphism flex flex-col items-center gap-6"
          >
            <AlertCircle className="w-12 h-12 text-red-400 animate-pulse" />
            <span className="text-[10px] tracking-[0.3em] text-red-400 uppercase font-semibold">Verification Aborted</span>
            <h1 className="font-gothic text-2xl font-black uppercase text-[#F0EFE7] tracking-wider">Sync Error</h1>
            <p className="text-xs text-[#F0EFE7]/60 leading-relaxed uppercase font-light">
              {error}
            </p>
            <Link 
              href="/cart"
              className="w-full py-3 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-[0.25em] rounded-lg transition-colors flex items-center justify-center interactive"
            >
              Return to Bag
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center py-16 px-8 rounded-3xl glassmorphism flex flex-col items-center gap-6"
          >
            <CheckCircle className="w-14 h-14 text-[#B8A98F] animate-bounce" />
            <span className="text-[10px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">Transmission Cleared</span>
            <h1 className="font-gothic text-2xl md:text-3xl font-black uppercase text-[#F0EFE7] tracking-wider">Order Secured</h1>
            
            <div className="p-4 rounded-xl border border-[#F0EFE7]/5 bg-[#121212]/40 w-full text-xs text-[#F0EFE7]/80 flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="uppercase tracking-widest text-[#F0EFE7]/40">Order Ref:</span>
                <span className="font-bold text-[#B8A98F]">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase tracking-widest text-[#F0EFE7]/40">Gateway:</span>
                <span className="font-bold uppercase tracking-wider text-[#B8A98F]">
                  {isMock ? (gatewayUsed || "Mock Stripe Gateway") : "Stripe Secure Live"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase tracking-widest text-[#F0EFE7]/40">Status:</span>
                <span className="font-bold uppercase tracking-wider text-green-400">
                  {gatewayUsed.toLowerCase().includes("cod") ? "Awaiting Payment // COD" : "Paid // Confirmed"}
                </span>
              </div>
            </div>
            
            <p className="text-xs text-[#F0EFE7]/60 leading-relaxed uppercase font-light">
              Your streetwear garments have been secured in the vault. An order confirmation code has been logged to the PostgreSQL system and synced to your profile dashboard.
            </p>

            <div className="flex flex-col gap-3 w-full mt-2">
              <Link 
                href="/profile"
                className="w-full py-3 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-[0.25em] rounded-lg transition-colors flex items-center justify-center interactive"
              >
                Track Orders
              </Link>
              <Link 
                href="/"
                className="w-full py-3 border border-[#F0EFE7]/10 hover:border-[#B8A98F]/50 text-[#F0EFE7]/80 hover:text-[#B8A98F] text-[10px] font-bold uppercase tracking-[0.25em] rounded-lg transition-colors flex items-center justify-center interactive"
              >
                Back to Shop
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0c0c0c] text-[#F0EFE7] flex items-center justify-center font-gothic text-xl tracking-[0.3em]">
        LOADING CONFIRMATION...
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
