"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  CreditCard, 
  Smartphone, 
  Truck, 
  ShieldCheck, 
  Loader2, 
  CheckCircle, 
  QrCode, 
  ArrowRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function PaymentPortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cart, activeCoupon, paymentSettings } = useStore();

  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "cod">("card");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Form inputs
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const [upiApp, setUpiApp] = useState<"gpay" | "phonepe" | "paytm" | "bhim" | "custom">("gpay");
  const [upiId, setUpiId] = useState("");
  
  // Calculate pricing details from URL searchParams
  const couponDiscountPercent = Number(searchParams.get("couponDiscountPercent") || 0);
  const itemsRaw = searchParams.get("items") || "[]";
  let items: any[] = [];
  try {
    items = JSON.parse(itemsRaw);
  } catch (e) {
    items = [];
  }

  const subtotal = items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
  const discount = couponDiscountPercent ? (subtotal * couponDiscountPercent) / 100 : 0;
  const shipping = subtotal > 250 || subtotal === 0 ? 0 : 10;
  const total = subtotal - discount + shipping;

  // Format Card Number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").substring(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  // Format Expiry
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (val.length >= 2) {
      setCardExpiry(`${val.substring(0, 2)}/${val.substring(2)}`);
    } else {
      setCardExpiry(val);
    }
  };

  // Format CVV
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").substring(0, 3);
    setCardCvv(val);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStep(0);

    // Simulate authentic payment processing stages
    const steps = [
      "Securing connection to banking terminal...",
      paymentMethod === "card" 
        ? "Validating card signatures & securing vault..."
        : paymentMethod === "upi"
        ? "Sending collect request to selected UPI node..."
        : "Verifying shipping address logs...",
      "Encrypting transaction session metadata...",
      "Awaiting merchant gateway approval...",
      "Transaction approved! Securing inventory..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, i === 3 ? 1500 : 900));
      setLoadingStep(i + 1);
    }

    // Build success redirection URL with gateway tag
    const successUrl = new URL(window.location.href.replace("payment-portal", "success"));
    
    let gatewayName = "Mock Stripe Live";
    if (paymentMethod === "card") gatewayName = "Credit/Debit Card (Mock)";
    if (paymentMethod === "upi") {
      gatewayName = `UPI - ${upiApp === "custom" ? upiId : upiApp.toUpperCase()}`;
    }
    if (paymentMethod === "cod") gatewayName = "Cash on Delivery (COD)";

    successUrl.searchParams.set("gateway", gatewayName);

    // Redirect to success page
    router.push(successUrl.pathname + successUrl.search);
  };

  const loadingStepsText = [
    "Establishing handshake with gateway...",
    paymentMethod === "card" 
      ? "Securing credit card numbers..."
      : paymentMethod === "upi"
      ? "Transmitting UPI handle token..."
      : "Checking postal route limits...",
    "Authorizing credentials...",
    "Settling transaction payload...",
    "Clearing order inventory records..."
  ];

  return (
    <>
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12 flex-grow w-full relative z-10">
        <AnimatePresence mode="wait">
          {loading ? (
            /* Secure Payment Processing Overlay */
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto text-center py-20 px-8 rounded-3xl glassmorphism border border-[#B8A98F]/20 flex flex-col items-center gap-6"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-[#B8A98F] animate-spin absolute" />
                <ShieldCheck className="w-6 h-6 text-[#B8A98F]" />
              </div>
              
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[10px] tracking-[0.3em] text-[#B8A98F] uppercase font-bold flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                  GATEWAY CONNECTION ACTIVE
                </span>
                <h2 className="font-gothic text-xl uppercase font-black tracking-widest text-[#F0EFE7]">
                  {loadingStep < loadingStepsText.length 
                    ? "Securing Payment" 
                    : "Payment Confirmed"}
                </h2>
              </div>

              {/* Progress Indicator */}
              <div className="w-full bg-[#121212] border border-[#F0EFE7]/10 h-2 rounded-full overflow-hidden mt-2 relative">
                <motion.div 
                  className="bg-[#B8A98F] h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((loadingStep + 1) / (loadingStepsText.length + 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <p className="text-[10px] text-[#F0EFE7]/60 tracking-widest uppercase h-8 flex items-center justify-center font-semibold">
                {loadingStepsText[Math.min(loadingStep, loadingStepsText.length - 1)]}
              </p>

              <div className="text-[8px] text-[#B8A98F]/40 uppercase tracking-[0.2em] mt-4 font-mono">
                SECURE AUTH PROTOCOL // AES-256
              </div>
            </motion.div>
          ) : (
            /* Main Form */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-5 gap-8"
            >
              {/* Form Input Side */}
              <div className="md:col-span-3 flex flex-col gap-6">
                <div>
                  <span className="text-[10px] tracking-[0.3em] text-[#B8A98F] uppercase font-bold">Secure Gateway Terminal</span>
                  <h1 className="font-gothic text-2xl md:text-3xl font-black uppercase text-[#F0EFE7] tracking-wider mt-2">Select Payment</h1>
                </div>

                {/* Tabs Selector */}
                <div className="flex bg-[#121212] border border-[#F0EFE7]/10 rounded-2xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 py-3.5 rounded-xl text-[9px] uppercase font-bold tracking-widest transition-all flex flex-col items-center gap-1.5 interactive ${
                      paymentMethod === "card"
                        ? "bg-[#B8A98F] text-[#0c0c0c]"
                        : "text-[#F0EFE7]/60 hover:text-[#B8A98F] hover:bg-[#F0EFE7]/5"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`flex-1 py-3.5 rounded-xl text-[9px] uppercase font-bold tracking-widest transition-all flex flex-col items-center gap-1.5 interactive ${
                      paymentMethod === "upi"
                        ? "bg-[#B8A98F] text-[#0c0c0c]"
                        : "text-[#F0EFE7]/60 hover:text-[#B8A98F] hover:bg-[#F0EFE7]/5"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    UPI (GPay/PhonePe)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex-1 py-3.5 rounded-xl text-[9px] uppercase font-bold tracking-widest transition-all flex flex-col items-center gap-1.5 interactive ${
                      paymentMethod === "cod"
                        ? "bg-[#B8A98F] text-[#0c0c0c]"
                        : "text-[#F0EFE7]/60 hover:text-[#B8A98F] hover:bg-[#F0EFE7]/5"
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    COD
                  </button>
                </div>

                <form onSubmit={handlePay} className="flex flex-col gap-6">
                  {/* CARD METHOD */}
                  {paymentMethod === "card" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold pl-1">Cardholder Name</label>
                        <input 
                          type="text" 
                          required
                          placeholder="LILA MOON"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          className="bg-[#121212] border border-[#F0EFE7]/10 rounded-lg p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold pl-1">Card Number</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            required
                            placeholder="4111 2222 3333 4444"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            className="w-full bg-[#121212] border border-[#F0EFE7]/10 rounded-lg p-3 pl-11 text-xs tracking-wider outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                          />
                          <CreditCard className="absolute left-3.5 top-3.5 w-4 h-4 text-[#F0EFE7]/30" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold pl-1">Expiry Date</label>
                          <input 
                            type="text" 
                            required
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            className="bg-[#121212] border border-[#F0EFE7]/10 rounded-lg p-3 text-xs tracking-wider outline-none focus:border-[#B8A98F] text-[#F0EFE7] text-center"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold pl-1">CVV Security Code</label>
                          <input 
                            type="password" 
                            required
                            placeholder="•••"
                            value={cardCvv}
                            onChange={handleCvvChange}
                            className="bg-[#121212] border border-[#F0EFE7]/10 rounded-lg p-3 text-xs tracking-wider outline-none focus:border-[#B8A98F] text-[#F0EFE7] text-center"
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-[#B8A98F]/25 bg-[#B8A98F]/5 text-[10px] text-[#F0EFE7]/80 uppercase leading-relaxed flex gap-3.5 items-start mt-2">
                        <ShieldCheck className="w-5 h-5 text-[#B8A98F] flex-shrink-0 mt-0.5" />
                        <p>
                          Secured via Mock Stripe Vault. Real charges will not apply. Use any mock credit card digits to verify.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* UPI METHOD */}
                  {paymentMethod === "upi" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-6"
                    >
                      {/* App Selector Grid */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold pl-1">Choose UPI Application</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: "gpay", label: "Google Pay" },
                            { id: "phonepe", label: "PhonePe" },
                            { id: "paytm", label: "Paytm" },
                            { id: "bhim", label: "BHIM App" }
                          ].map((app) => (
                            <button
                              key={app.id}
                              type="button"
                              onClick={() => {
                                setUpiApp(app.id as any);
                                setUpiId("");
                              }}
                              className={`py-3.5 px-2 rounded-xl border text-[10px] uppercase font-bold tracking-widest transition-all interactive text-center ${
                                upiApp === app.id
                                  ? "bg-[#B8A98F]/10 border-[#B8A98F] text-[#F0EFE7] ring-1 ring-[#B8A98F]"
                                  : "border-[#F0EFE7]/10 bg-[#121212] text-[#F0EFE7]/50 hover:text-[#B8A98F]"
                              }`}
                            >
                              {app.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* QR Code Scan Section */}
                      <div className="flex flex-col sm:flex-row gap-6 p-5 rounded-2xl border border-[#F0EFE7]/10 bg-[#121212] items-center">
                        <div className="relative p-3 bg-white rounded-xl flex-shrink-0 shadow-lg border border-[#B8A98F]/30 overflow-hidden flex items-center justify-center min-w-[136px] min-h-[136px]">
                          {paymentSettings?.qrCodeUrl ? (
                            <Image 
                              src={paymentSettings.qrCodeUrl} 
                              alt="Store QR Code" 
                              width={112}
                              height={112}
                              className="object-contain" 
                              unoptimized
                            />
                          ) : (
                            <QrCode className="w-28 h-28 text-[#0c0c0c] animate-pulse" />
                          )}
                          <div className="absolute inset-0 border-2 border-[#B8A98F] rounded-xl pointer-events-none" />
                        </div>
                        <div className="flex flex-col gap-2 text-center sm:text-left">
                          <span className="text-[10px] tracking-widest text-[#B8A98F] uppercase font-bold">
                            {paymentSettings?.merchantName ? `Pay to: ${paymentSettings.merchantName}` : "Instant Scan QR Code"}
                          </span>
                          <h4 className="text-xs uppercase text-[#F0EFE7] font-semibold">
                            {paymentSettings?.upiId ? `UPI Handle: ${paymentSettings.upiId}` : "Pay via Scan"}
                          </h4>
                          <p className="text-[10px] text-[#F0EFE7]/50 uppercase leading-relaxed max-w-sm">
                            Open GPay, PhonePe, Paytm, or your banking app. Point your camera to scan this secure merchant QR screen to complete transaction.
                          </p>
                        </div>
                      </div>

                      {/* Custom UPI ID Option */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold pl-1">Or enter Custom UPI Handle</span>
                          <button
                            type="button"
                            onClick={() => setUpiApp("custom")}
                            className={`text-[8px] uppercase tracking-widest font-bold ${upiApp === "custom" ? "text-[#B8A98F]" : "text-[#F0EFE7]/40 hover:text-[#B8A98F]"}`}
                          >
                            Use Custom ID
                          </button>
                        </div>
                        
                        <input 
                          type="text" 
                          required={upiApp === "custom"}
                          placeholder={upiApp === "custom" ? "YOURNAME@UPI" : `ENTER YOUR ${upiApp.toUpperCase()} HANDLE`}
                          value={upiId}
                          onChange={(e) => {
                            setUpiApp("custom");
                            setUpiId(e.target.value);
                          }}
                          className="bg-[#121212] border border-[#F0EFE7]/10 rounded-lg p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* COD METHOD */}
                  {paymentMethod === "cod" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="p-6 rounded-2xl border border-[#B8A98F]/20 bg-[#B8A98F]/5 flex gap-4 items-start">
                        <Truck className="w-6 h-6 text-[#B8A98F] flex-shrink-0 mt-0.5 animate-bounce" />
                        <div className="flex flex-col gap-2">
                          <h4 className="text-xs uppercase text-[#F0EFE7] font-bold tracking-wider">Cash on Delivery Confirmation</h4>
                          <p className="text-[10px] text-[#F0EFE7]/60 uppercase leading-relaxed">
                            No digital transaction token or payment card is required to secure this order. You will fulfill the transaction total of <span className="text-[#B8A98F] font-bold">${total.toFixed(0)}</span> in cash or card directly to the courier agent upon physical package arrival.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-[#F0EFE7]/10 bg-[#121212]/40 text-[9px] uppercase tracking-wide text-[#F0EFE7]/40 flex gap-2 items-center justify-center">
                        <Info className="w-3.5 h-3.5 text-[#B8A98F]" />
                        <span>Fulfillment time may include standard transit checks.</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Pay button */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-[0.25em] rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 interactive"
                  >
                    {paymentMethod === "cod" ? "Confirm Order (COD)" : `Authorize & Pay $${total.toFixed(0)}`}
                  </button>
                </form>
              </div>

              {/* Order Summary Side */}
              <div className="md:col-span-2 flex flex-col gap-6">
                <div className="p-6 rounded-2xl bg-[#121212] border border-[#F0EFE7]/5 flex flex-col gap-5 sticky top-28">
                  <h3 className="font-gothic text-xs uppercase tracking-[0.2em] font-bold text-[#B8A98F]">Bag Review</h3>

                  {/* List Items */}
                  <div className="flex flex-col gap-4 max-h-60 overflow-y-auto pr-2 border-b border-[#F0EFE7]/10 pb-4">
                    {items.length > 0 ? (
                      items.map((item: any, idx: number) => (
                        <div key={`${item.productId}-${item.size}-${idx}`} className="flex gap-3 text-xs">
                          <div className="relative w-10 h-14 flex-shrink-0 bg-[#1a1a1a] rounded overflow-hidden">
                            <Image 
                              src={item.imageUrl || "/images/leather_trench_1.webp"} 
                              alt={item.name} 
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-grow flex flex-col justify-between">
                            <div>
                              <p className="font-semibold text-[#F0EFE7] uppercase truncate max-w-[130px]">{item.name}</p>
                              <p className="text-[8px] text-[#F0EFE7]/50 uppercase mt-0.5">Size: {item.size} // Qty: {item.quantity}</p>
                            </div>
                            <span className="font-bold text-[#F0EFE7] text-[10px]">${item.price * item.quantity}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-[#F0EFE7]/40 uppercase tracking-widest py-4">No items to review.</p>
                    )}
                  </div>

                  {/* Totals block */}
                  <div className="flex flex-col gap-2.5 text-[9px] uppercase tracking-widest text-[#F0EFE7]/70 border-b border-[#F0EFE7]/10 pb-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal}</span>
                    </div>
                    {couponDiscountPercent > 0 && (
                      <div className="flex justify-between text-[#B8A98F]">
                        <span>Discount</span>
                        <span>-${discount.toFixed(0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "FREE" : `$${shipping}`}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[#F0EFE7]">
                    <span>Total</span>
                    <span>${total.toFixed(0)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-[#F0EFE7]/40 mt-2 justify-center border-t border-[#F0EFE7]/5 pt-4">
                    <ShieldCheck className="w-4 h-4 text-[#B8A98F]" />
                    <span>Secure mock checkout pipeline</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </>
  );
}

export default function PaymentPortal() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0c0c0c] text-[#F0EFE7] flex items-center justify-center font-gothic text-xl tracking-[0.3em]">
        LOADING PAY GATEWAY...
      </div>
    }>
      <PaymentPortalContent />
    </Suspense>
  );
}
