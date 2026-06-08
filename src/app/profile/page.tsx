"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { User, Heart, ShoppingBag, MapPin, LogOut, Trash2, ShoppingCart, CheckCircle, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_ADDRESS, MOCK_ORDERS } from "@/lib/mockData";

export default function ProfilePage() {
  const { 
    activeUser, 
    wishlist, 
    toggleWishlist, 
    addToCart, 
    logoutMock, 
    loginMock,
    ordersHistory,
    fetchOrdersHistory,
    showToast,
    defaultAddress,
    updateUserProfile
  } = useStore();

  const router = useRouter();

  // Redirect guest users
  useEffect(() => {
    const savedUserStr = localStorage.getItem("moonz_user");
    const user = activeUser || (savedUserStr ? JSON.parse(savedUserStr) : null);
    
    if (!user) {
      router.push("/login?redirect=/profile");
    }
  }, [activeUser, router]);

  const [activeTab, setActiveTab] = useState<"favorites" | "orders" | "details">("favorites");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReturnItems, setSelectedReturnItems] = useState<string[]>([]);
  const [returnReason, setReturnReason] = useState("");
  const [returnComments, setReturnComments] = useState("");

  // Sync return requests from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("moonz_return_requests");
    if (saved) {
      try {
        setReturnRequests(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const openReturnModal = () => {
    setSelectedReturnItems([]);
    setReturnReason("");
    setReturnComments("");
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (selectedReturnItems.length === 0) {
      showToast("Please select at least one item to return.", "error");
      return;
    }
    if (!returnReason) {
      showToast("Please select a reason for your return.", "error");
      return;
    }

    const newRequest = {
      id: `RET-${Math.floor(100000 + Math.random() * 900000)}`,
      orderId: selectedOrder.id,
      items: selectedReturnItems,
      reason: returnReason,
      comments: returnComments,
      status: "PENDING",
      date: new Date().toLocaleDateString()
    };

    const updatedRequests = [...returnRequests, newRequest];
    setReturnRequests(updatedRequests);
    localStorage.setItem("moonz_return_requests", JSON.stringify(updatedRequests));

    showToast("Return request submitted successfully. Our curator will review it.", "success");
    setIsReturnModalOpen(false);
  };

  // Reload purchase logs on tab change
  useEffect(() => {
    if (activeUser && activeTab === "orders") {
      fetchOrdersHistory();
    }
  }, [activeTab, activeUser]);

  const handleTabChange = (tabVal: "favorites" | "orders" | "details") => {
    setActiveTab(tabVal);
    setSelectedOrder(null);
  };
  
  // Account Details form state
  const [userName, setUserName] = useState("Lila Moon");
  const [userEmail, setUserEmail] = useState("lila@moonzthrift.com");
  const [street, setStreet] = useState(MOCK_ADDRESS.street);
  const [city, setCity] = useState(MOCK_ADDRESS.city);
  const [zip, setZip] = useState(MOCK_ADDRESS.zip);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state with activeUser when it changes
  useEffect(() => {
    if (activeUser) {
      setUserName(activeUser.name || "Lila Moon");
      setUserEmail(activeUser.email || "lila@moonzthrift.com");
    }
  }, [activeUser]);

  // Sync address state with defaultAddress when it changes/loads
  useEffect(() => {
    if (defaultAddress) {
      setStreet(defaultAddress.street || "");
      setCity(defaultAddress.city || "");
      setZip(defaultAddress.zip || "");
    }
  }, [defaultAddress]);

  if (!activeUser) {
    return (
      <>
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-32 text-center px-6">
          <User className="w-12 h-12 text-[#B8A98F] mb-6 animate-pulse" />
          <span className="text-[9px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">User Profile</span>
          <h1 className="font-gothic text-xl md:text-2xl font-black uppercase text-[#F0EFE7] tracking-wider mt-2">Please Sign In</h1>
          <p className="text-xs text-[#F0EFE7]/50 mt-3 max-w-sm uppercase font-light leading-relaxed">
            Please log in to view your account details, order history, and saved favorites.
          </p>
          <Link
            href="/login"
            className="mt-6 px-6 py-2.5 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-widest rounded-lg transition-colors interactive inline-block"
          >
            Sign In to Profile
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateUserProfile(userName, userEmail, street, city, zip);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleBuyFavorite = (product: any) => {
    addToCart(product, 1, product.size);
    showToast(`Added ${product.name} (${product.size}) to your bag.`, "success");
  };

  const activeOrders = ordersHistory && ordersHistory.length > 0 ? ordersHistory : MOCK_ORDERS.filter(o => o.userId === activeUser.id || o.email === activeUser.email);
  const totalOrders = activeOrders.length;
  const totalSpent = activeOrders.reduce((sum: number, o: any) => sum + o.total, 0);
  const activeDeliveries = activeOrders.filter((o: any) => ["PENDING", "PAID", "SHIPPED"].includes(o.status)).length;

  return (
    <>
      <div className="no-print min-h-screen flex flex-col">
        <Navbar />

        <div className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
        {/* Profile Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-center md:items-end border-b border-[#F0EFE7]/10 pb-6 gap-4">
          <div className="text-center md:text-left">
            <span className="text-[10px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">Account Portal</span>
            <h1 className="font-gothic text-2xl md:text-4xl font-black mt-2 tracking-wide uppercase">Welcome, {userName}</h1>
            <p className="text-[9px] text-[#B8A98F] uppercase tracking-widest mt-1">Role: {activeUser.role}</p>
          </div>
          
          <button
            onClick={logoutMock}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300 font-bold border border-red-400/20 hover:border-red-400/50 px-4 py-2 rounded-lg transition-colors interactive"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* Profile Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-2 bg-[#121212] border border-[#F0EFE7]/5 p-4 rounded-2xl">
            {[
              { label: "My Favorites", value: "favorites", icon: Heart },
              { label: "Order History", value: "orders", icon: ShoppingBag },
              { label: "Account Details", value: "details", icon: User }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value as any)}
                  className={`w-full text-left py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-3 transition-colors interactive ${activeTab === tab.value ? "bg-[#B8A98F] text-[#0c0c0c]" : "text-[#F0EFE7]/60 hover:bg-[#F0EFE7]/5"}`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right Content Panels */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {/* Favorites Panel */}
              {activeTab === "favorites" && (
                <motion.div
                  key="favorites"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="font-gothic text-lg font-bold uppercase tracking-wider text-[#B8A98F]">My Favorites ({wishlist.length})</h2>
                    <span className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Buy when ready</span>
                  </div>

                  {wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {wishlist.map((p) => (
                        <div 
                          key={p.id} 
                          className="flex gap-4 p-4 rounded-xl bg-[#121212] border border-[#F0EFE7]/5 items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-16 flex-shrink-0 bg-[#1a1a1a] rounded overflow-hidden">
                              <Image src={p.imageUrls[0]} alt={p.name} fill sizes="48px" className="object-cover" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] uppercase tracking-widest text-[#B8A98F] font-bold">{p.brand}</span>
                              <Link href={`/product/${p.id}`} className="hover:underline">
                                <span className="text-xs font-semibold text-[#F0EFE7] uppercase truncate max-w-[150px]">{p.name}</span>
                              </Link>
                              <span className="text-xs font-bold text-[#F0EFE7] mt-1">${p.price}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleBuyFavorite(p)}
                              className="p-2 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] rounded-lg transition-colors flex items-center justify-center interactive"
                              aria-label="Add to bag"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleWishlist(p)}
                              className="p-2 border border-[#F0EFE7]/10 hover:border-red-400 hover:text-red-400 rounded-lg transition-all flex items-center justify-center interactive"
                              aria-label="Remove favorite"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-[#121212]/30 border border-[#F0EFE7]/5">
                      <span className="text-3xl mb-4 select-none">🖤</span>
                      <h3 className="font-gothic text-sm font-bold uppercase tracking-wider text-[#F0EFE7]">No Favorites Saved</h3>
                      <p className="text-[10px] text-[#F0EFE7]/50 max-w-xs mx-auto uppercase leading-relaxed font-light mt-1">
                        Save clothing fits here while browsing so you can buy them later when you are ready.
                      </p>
                      <Link 
                        href="/shop"
                        className="mt-6 px-4 py-2 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors interactive"
                      >
                        Explore Vault
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Order History Panel */}
              {activeTab === "orders" && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-col gap-6"
                >
                  {selectedOrder ? (
                    /* Detailed Order Tracking Screen */
                    <div className="flex flex-col gap-6">
                      {/* Back button & Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0EFE7]/10 pb-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedOrder(null)}
                            className="px-3 py-1.5 border border-[#F0EFE7]/10 hover:border-[#B8A98F] hover:text-[#B8A98F] text-[10px] uppercase font-bold tracking-widest rounded-lg transition-colors flex items-center gap-1.5 interactive"
                          >
                            ← Back
                          </button>
                          <div className="flex flex-col text-left">
                            <h2 className="font-gothic text-base font-bold uppercase tracking-wider text-[#F0EFE7]">
                              {selectedOrder.id}
                            </h2>
                            <span className="text-[9px] text-[#F0EFE7]/40 uppercase font-semibold">Ordered: {selectedOrder.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-auto font-sans">
                          <button
                            onClick={() => window.print()}
                            className="px-3 py-1.5 bg-[#B8A98F] hover:bg-[#F0EFE7] text-[#0c0c0c] text-[10px] uppercase font-bold tracking-widest rounded-lg transition-all flex items-center gap-1.5 interactive cursor-pointer"
                          >
                            Print Invoice
                          </button>
                          {(() => {
                            const existingRequest = returnRequests.find((r) => r.orderId === selectedOrder.id);
                            if (existingRequest) {
                              return (
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
                                  Return: {existingRequest.status}
                                </span>
                              );
                            }
                            return (
                              <button
                                onClick={openReturnModal}
                                className="px-3 py-1.5 border border-amber-500/30 hover:border-[#B8A98F] hover:text-[#B8A98F] text-amber-400 hover:bg-[#B8A98F]/5 text-[10px] uppercase font-bold tracking-widest rounded-lg transition-all flex items-center gap-1.5 interactive cursor-pointer"
                              >
                                Request Return
                              </button>
                            );
                          })()}
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-green-400 px-3 py-1 rounded-full bg-green-400/10 border border-green-400/20">
                            Status: {selectedOrder.status}
                          </span>
                        </div>
                      </div>

                      {/* Visual Order Timeline */}
                      <div className="p-6 rounded-2xl bg-[#121212] border border-[#F0EFE7]/5 flex flex-col gap-6">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-[#B8A98F] text-left">Shipment Dispatch Status</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative mt-2 text-left">
                          {[
                            { step: "Placed", desc: "Order details verified & paid", statusKey: ["PENDING", "PAID", "SHIPPED", "DELIVERED"], info: "Session cleared" },
                            { step: "Processing", desc: "Thrift grail authenticity checklist", statusKey: ["PAID", "SHIPPED", "DELIVERED"], info: "Verification lock" },
                            { step: "Dispatched", desc: "Couriers picked up from celestial vaults", statusKey: ["SHIPPED", "DELIVERED"], info: "Vault out" },
                            { step: "Delivered", desc: "Arrival at destination coordinates", statusKey: ["DELIVERED"], info: "Carrier complete" }
                          ].map((stepObj, idx) => {
                            const isCurrentOrCompleted = stepObj.statusKey.includes(selectedOrder.status);
                            
                            return (
                              <div key={idx} className="flex flex-col gap-2 relative z-10">
                                <div className="flex items-center gap-3">
                                  {/* Step Circle */}
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all
                                    ${isCurrentOrCompleted 
                                      ? "border-[#B8A98F] bg-[#B8A98F]/10 text-[#B8A98F]" 
                                      : "border-[#F0EFE7]/10 bg-[#0c0c0c] text-[#F0EFE7]/30"
                                    }
                                  `}>
                                    {idx + 1}
                                  </div>
                                  <span className={`text-[11px] uppercase tracking-widest font-bold ${isCurrentOrCompleted ? "text-[#F0EFE7]" : "text-[#F0EFE7]/30"}`}>
                                    {stepObj.step}
                                  </span>
                                </div>
                                
                                <p className={`text-[9px] uppercase tracking-wide leading-relaxed pl-11 ${isCurrentOrCompleted ? "text-[#F0EFE7]/70" : "text-[#F0EFE7]/20"}`}>
                                  {stepObj.desc}
                                </p>
                                <span className={`text-[8px] uppercase tracking-widest font-bold pl-11 mt-1 ${isCurrentOrCompleted ? "text-[#B8A98F]/80" : "text-[#F0EFE7]/10"}`}>
                                  // {stepObj.info}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Info Split Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        {/* Left Info: Shipping Destination */}
                        <div className="p-5 rounded-2xl bg-[#121212] border border-[#F0EFE7]/5 flex flex-col gap-4">
                          <h3 className="text-xs uppercase tracking-widest font-bold text-[#B8A98F] border-b border-[#F0EFE7]/10 pb-2">
                            Shipping Destination
                          </h3>
                          {selectedOrder.address ? (
                            <div className="flex flex-col gap-1.5 text-xs text-[#F0EFE7]/80 uppercase font-light">
                              <p className="font-semibold text-[#F0EFE7]">{activeUser.name}</p>
                              <p>{selectedOrder.address.street}</p>
                              <p>{selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.zip}</p>
                              <p>{selectedOrder.address.country}</p>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5 text-xs text-[#F0EFE7]/80 uppercase font-light">
                              <p className="font-semibold text-[#F0EFE7]">{activeUser.name}</p>
                              <p>303 Eclipse Avenue, Suite A</p>
                              <p>Seattle, WA 98101</p>
                              <p>United States</p>
                            </div>
                          )}
                        </div>

                        {/* Right Info: Payment Details */}
                        <div className="p-5 rounded-2xl bg-[#121212] border border-[#F0EFE7]/5 flex flex-col gap-4">
                          <h3 className="text-xs uppercase tracking-widest font-bold text-[#B8A98F] border-b border-[#F0EFE7]/10 pb-2">
                            Payment Details
                          </h3>
                          <div className="flex flex-col gap-2 text-xs uppercase font-light text-[#F0EFE7]/80">
                            <div className="flex justify-between">
                              <span className="text-[#F0EFE7]/40">Payment Gateway:</span>
                              <span className="font-semibold text-[#F0EFE7]">Stripe Integrated</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#F0EFE7]/40">Payment Status:</span>
                              <span className="font-semibold text-green-400">Paid // Confirmed</span>
                            </div>
                            {selectedOrder.coupon && (
                              <div className="flex justify-between text-[#B8A98F] font-semibold">
                                <span>Discount applied:</span>
                                <span>{selectedOrder.coupon.code} (-{selectedOrder.coupon.discountPercent}%)</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-[#F0EFE7]/5 pt-2 font-bold text-[#F0EFE7]">
                              <span>Total Paid:</span>
                              <span>${selectedOrder.total}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Items Feed */}
                      <div className="p-6 rounded-2xl bg-[#121212] border border-[#F0EFE7]/5 flex flex-col gap-4 text-left">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-[#B8A98F] border-b border-[#F0EFE7]/10 pb-2">
                          Ordered Items
                        </h3>
                        <div className="flex flex-col gap-4">
                          {selectedOrder.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#0c0c0c]/40 border border-[#F0EFE7]/5">
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-14 flex-shrink-0 bg-[#1a1a1a] rounded overflow-hidden">
                                  <Image
                                    src={item.imageUrl || "/images/leather_trench_1.webp"}
                                    alt={item.name}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-[#F0EFE7] uppercase truncate max-w-[180px]">{item.name}</span>
                                  <span className="text-[9px] text-[#F0EFE7]/50 uppercase mt-0.5">Size: {item.size} // Qty: {item.quantity}</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-[#F0EFE7]">${item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Orders List */
                    <div className="flex flex-col gap-6">
                      <div className="flex justify-between items-center border-b border-[#F0EFE7]/5 pb-2">
                        <h2 className="font-gothic text-lg font-bold uppercase tracking-wider text-[#B8A98F]">Purchase Logs</h2>
                        <span className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Click an order to track shipment</span>
                      </div>

                      {/* Historical Order Metrics Dashboard Block */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        {/* Metric 1 */}
                        <div className="p-4 rounded-xl bg-[#121212] border border-[#F0EFE7]/5 flex flex-col gap-1 relative overflow-hidden group hover:border-[#B8A98F]/30 transition-all text-left">
                          <div className="absolute -right-3 -bottom-3 text-[#F0EFE7]/3 opacity-5 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                            <ShoppingBag className="w-16 h-16" />
                          </div>
                          <span className="text-[9px] uppercase tracking-[0.2em] text-[#F0EFE7]/40 font-bold">Total Orders</span>
                          <span className="text-xl font-bold text-[#F0EFE7] mt-1">{totalOrders}</span>
                          <span className="text-[7px] text-[#B8A98F] font-mono tracking-widest mt-1">// SECURED IN VAULT</span>
                        </div>

                        {/* Metric 2 */}
                        <div className="p-4 rounded-xl bg-[#121212] border border-[#F0EFE7]/5 flex flex-col gap-1 relative overflow-hidden group hover:border-[#B8A98F]/30 transition-all text-left">
                          <span className="text-[9px] uppercase tracking-[0.2em] text-[#F0EFE7]/40 font-bold">Total Investment</span>
                          <span className="text-xl font-bold text-[#F0EFE7] mt-1">${totalSpent.toFixed(2)}</span>
                          <span className="text-[7px] text-[#B8A98F] font-mono tracking-widest mt-1">// VALUE SHIPPED</span>
                        </div>

                        {/* Metric 3 */}
                        <div className="p-4 rounded-xl bg-[#121212] border border-[#F0EFE7]/5 flex flex-col gap-1 relative overflow-hidden group hover:border-[#B8A98F]/30 transition-all text-left">
                          <div className="absolute -right-3 -bottom-3 text-[#F0EFE7]/3 opacity-5 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                            <CheckCircle className="w-16 h-16" />
                          </div>
                          <span className="text-[9px] uppercase tracking-[0.2em] text-[#F0EFE7]/40 font-bold">Active Deliveries</span>
                          <span className="text-xl font-bold text-[#F0EFE7] mt-1">{activeDeliveries}</span>
                          <span className="text-[7px] text-[#B8A98F] font-mono tracking-widest mt-1">// IN-TRANSIT ROUTE</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        {activeOrders.map((ord: any) => (
                          <div 
                            key={ord.id}
                            onClick={() => setSelectedOrder(ord)}
                            className="p-5 rounded-xl bg-[#121212] border border-[#F0EFE7]/5 hover:border-[#B8A98F]/50 transition-colors flex flex-col gap-4 cursor-pointer interactive group text-left"
                          >
                            <div className="flex justify-between items-center border-b border-[#F0EFE7]/5 pb-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-[#F0EFE7] tracking-wider group-hover:text-[#B8A98F] transition-colors">{ord.id}</span>
                                <span className="text-[9px] text-[#F0EFE7]/40 font-semibold">{ord.date}</span>
                              </div>
                              <span className="text-[9px] uppercase tracking-wider font-semibold text-green-400 px-2.5 py-0.5 rounded bg-green-400/10 border border-green-400/20">
                                {ord.status}
                              </span>
                            </div>

                            {ord.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-8 h-10 flex-shrink-0 bg-[#1a1a1a] rounded overflow-hidden">
                                    <Image 
                                      src={item.imageUrl || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600"} 
                                      alt={item.name} 
                                      fill
                                      sizes="32px"
                                      className="object-cover" 
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-[#F0EFE7] uppercase">{item.name}</span>
                                    <span className="text-[9px] text-[#F0EFE7]/40 uppercase mt-0.5">Size: {item.size} // Qty: {item.quantity}</span>
                                  </div>
                                </div>
                                <span className="font-bold text-[#F0EFE7]">${item.price * item.quantity}</span>
                              </div>
                            ))}

                            <div className="flex justify-between items-center border-t border-[#F0EFE7]/5 pt-3 text-xs uppercase tracking-wider">
                              <span className="text-[#F0EFE7]/40">Total Paid</span>
                              <span className="font-bold text-[#F0EFE7]">${ord.total}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Account Details Panel */}
              {activeTab === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-col gap-6"
                >
                  <h2 className="font-gothic text-lg font-bold uppercase tracking-wider text-[#B8A98F]">Vault Details</h2>

                  <form onSubmit={handleSaveDetails} className="p-6 rounded-2xl bg-[#121212] border border-[#F0EFE7]/5 flex flex-col gap-5 max-w-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Display Name</label>
                        <input 
                          type="text" required value={userName} onChange={(e) => setUserName(e.target.value)}
                          className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Email Address</label>
                        <input 
                          type="email" required value={userEmail} onChange={(e) => setUserEmail(e.target.value)}
                          className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Default Shipping Destination</label>
                      <input 
                        type="text" required value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street Address"
                        className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5 col-span-2">
                        <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">City</label>
                        <input 
                          type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City"
                          className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Zip Code</label>
                        <input 
                          type="text" required value={zip} onChange={(e) => setZip(e.target.value)} placeholder="Zip"
                          className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-1.5 interactive"
                    >
                      Save Account Changes
                    </button>

                    <AnimatePresence>
                      {saveSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="text-[10px] uppercase tracking-widest text-[#B8A98F] font-semibold flex items-center gap-1.5 justify-center mt-2"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Details updated successfully
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      <Footer />
      </div>

      {/* Print-only Invoice Template */}
      {selectedOrder && (
        <div className="print-only text-black bg-white p-8 font-sans">
          {/* Header */}
          <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="font-serif text-3xl font-black tracking-wider uppercase">MoonzThrift</h1>
              <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Celestial Archive & Curated Grails</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold uppercase tracking-wider">Transaction Invoice</h2>
              <p className="text-xs font-mono mt-1">INVOICE: #{selectedOrder.id}</p>
              <p className="text-xs text-gray-500 mt-0.5">Date: {selectedOrder.date}</p>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-8 mb-8 text-xs text-left">
            <div>
              <h3 className="font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2 text-gray-700">Billing & Shipping Coordinates</h3>
              <p className="font-semibold text-sm">{activeUser.name}</p>
              {selectedOrder.address ? (
                <>
                  <p>{selectedOrder.address.street}</p>
                  <p>{selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.zip}</p>
                  <p>{selectedOrder.address.country}</p>
                </>
              ) : (
                <>
                  <p>303 Eclipse Avenue, Suite A</p>
                  <p>Seattle, WA 98101</p>
                  <p>United States</p>
                </>
              )}
            </div>
            <div>
              <h3 className="font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2 text-gray-700">Courier Dispatch Label</h3>
              <p className="font-semibold text-sm">MoonzThrift Celestial Vaults</p>
              <p>101 Eclipse Way, Sector 7</p>
              <p>Seattle, WA 98104</p>
              <p className="mt-2"><span className="font-bold">Contact Email:</span> {activeUser.email}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-black uppercase tracking-wider font-bold">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center">Size</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-3">
                      <span className="font-semibold block uppercase">{item.name}</span>
                      <span className="text-[10px] text-gray-500 uppercase">{item.brand || "Curated Vintage"}</span>
                    </td>
                    <td className="py-3 text-center font-mono">{item.size}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right font-mono">${item.price}</td>
                    <td className="py-3 text-right font-mono font-semibold">${item.price * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Net totals summary */}
          <div className="flex justify-end text-xs">
            <div className="w-64 flex flex-col gap-2">
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-mono">${selectedOrder.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)}</span>
              </div>
              {selectedOrder.coupon && (
                <div className="flex justify-between text-amber-700 border-b border-gray-100 pb-1">
                  <span>Discount ({selectedOrder.coupon.code}):</span>
                  <span className="font-mono">-{selectedOrder.coupon.discountPercent}%</span>
                </div>
              )}
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="text-gray-500">Shipping:</span>
                <span className="font-mono">
                  {selectedOrder.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) > 250 ? "FREE" : "$10"}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm border-b-2 border-black pb-1 mt-1">
                <span>Grand Net Total:</span>
                <span className="font-mono">${selectedOrder.total}</span>
              </div>
            </div>
          </div>

          {/* Footer terms */}
          <div className="mt-16 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-6">
            <p className="uppercase tracking-widest font-semibold mb-1">Thank you for acquiring from MoonzThrift</p>
            <p>Verification Checklist Passed // Authenticity Guaranteed // 1-of-1 Vault Archive drop</p>
            <p className="mt-2 text-gray-300">Invoice generated electronically. Non-refundable vault release drop transaction.</p>
          </div>
        </div>
      )}

      {/* Return Request Glassmorphic Modal */}
      <AnimatePresence>
        {isReturnModalOpen && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0c0c0c]/90 border border-[#F0EFE7]/10 p-6 rounded-2xl w-full max-w-lg flex flex-col gap-5 relative text-left shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="absolute top-4 right-4 text-[#F0EFE7]/60 hover:text-[#F0EFE7] transition-colors p-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[9px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">Reverse Transaction</span>
                <h3 className="font-gothic text-lg font-bold uppercase tracking-wider text-[#F0EFE7] mt-1">Request Return</h3>
                <p className="text-[10px] text-[#F0EFE7]/40 uppercase tracking-widest mt-0.5">Order Ref: {selectedOrder.id}</p>
              </div>

              <form onSubmit={handleReturnSubmit} className="flex flex-col gap-4">
                {/* Item Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold">Select Items to Return</label>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item: any, idx: number) => {
                      const isChecked = selectedReturnItems.includes(item.name);
                      return (
                        <label
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-[#121212] border border-[#F0EFE7]/5 cursor-pointer hover:border-[#B8A98F]/30 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedReturnItems(selectedReturnItems.filter(name => name !== item.name));
                                } else {
                                  setSelectedReturnItems([...selectedReturnItems, item.name]);
                                }
                              }}
                              className="w-4 h-4 rounded border-[#F0EFE7]/20 text-[#B8A98F] focus:ring-0 focus:ring-offset-0 bg-[#0c0c0c] cursor-pointer"
                            />
                            <div className="flex items-center gap-3">
                              <div className="relative w-8 h-10 flex-shrink-0 bg-[#1a1a1a] rounded overflow-hidden">
                                <Image
                                  src={item.imageUrl || "/images/leather_trench_1.webp"}
                                  alt={item.name}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-[#F0EFE7] uppercase truncate max-w-[200px]">{item.name}</span>
                                <span className="text-[8px] text-[#F0EFE7]/40 uppercase">Size: {item.size} // Qty: {item.quantity}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[#F0EFE7]">${item.price * item.quantity}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Reason Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold">Reason for Return</label>
                  <select
                    required
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                  >
                    <option value="" disabled>Select a reason...</option>
                    <option value="size">Size issue // Fit is incorrect</option>
                    <option value="defect">Item defective // Damaged in courier route</option>
                    <option value="not_described">Not as described // Vault mismatch</option>
                    <option value="changed_mind">Changed mind // Archive shift</option>
                  </select>
                </div>

                {/* Comments Textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/50 font-bold">Additional details (Optional)</label>
                  <textarea
                    rows={3}
                    value={returnComments}
                    onChange={(e) => setReturnComments(e.target.value)}
                    placeholder="Provide details about the issue..."
                    className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider outline-none focus:border-[#B8A98F] text-[#F0EFE7] resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-1.5 mt-2 interactive"
                >
                  Submit Return Request
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
