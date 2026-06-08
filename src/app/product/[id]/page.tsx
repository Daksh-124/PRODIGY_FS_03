"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Star, ShieldCheck, Truck, RefreshCw, Plus, Heart, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { submitReviewAction } from "@/lib/actions";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetail({ params }: ProductPageProps) {
  // Unwrap the params promise using React.use
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const { products, addToCart, toggleWishlist, isInWishlist, addToRecentlyViewed, activeUser, showToast, fetchProducts } = useStore();
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);
  
  const [product, setProduct] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"details" | "shipping" | "reviews">("details");
  const [selectedSize, setSelectedSize] = useState("");
  
  // Review form state
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Size Calculator states & logic
  const [showSizeCalculator, setShowSizeCalculator] = useState(false);
  const [calculatorHeight, setCalculatorHeight] = useState(175);
  const [calculatorWeight, setCalculatorWeight] = useState(70);
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);

  const handleCalculateSize = (e: React.FormEvent) => {
    e.preventDefault();
    let size = "M";
    if (calculatorWeight < 62) {
      size = "S";
    } else if (calculatorWeight >= 62 && calculatorWeight < 76) {
      size = "M";
    } else if (calculatorWeight >= 76 && calculatorWeight < 88) {
      size = "L";
    } else {
      size = "XL";
    }
    
    if (calculatorHeight > 185 && size === "M") {
      size = "L";
    } else if (calculatorHeight < 170 && size === "M") {
      size = "S";
    }
    setRecommendedSize(size);
  };

  useEffect(() => {
    if (activeUser) {
      setReviewName(activeUser.name || "");
    }
  }, [activeUser]);

  useEffect(() => {
    const found = products.find((p) => p.id === productId);
    if (found) {
      setProduct(found);
      setReviewsList(found.reviews || []);
      setActiveImageIdx(0);
      addToRecentlyViewed(found);
      const availableSizes = (found.size || "").split(",").map((s: any) => s.trim().toUpperCase());
      setSelectedSize(availableSizes[0] || "");
    }
  }, [productId, products]);

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-32 text-center">
          <span className="text-4xl mb-4">🌑</span>
          <h2 className="font-gothic text-2xl font-bold tracking-widest uppercase text-[#F0EFE7]">Grail Not Found</h2>
          <p className="text-xs text-[#F0EFE7]/50 mt-2 uppercase tracking-wide">The piece you are looking for has returned to the void.</p>
        </div>
        <Footer />
      </>
    );
  }

  const handleAddToCart = () => {
    if (!activeUser) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname || `/product/${product.id}`)}`);
      return;
    }
    addToCart(product, 1, selectedSize || product.size);
    showToast(`Added ${product.name} to your bag.`, "success");
  };

  const handleToggleWishlist = () => {
    if (!activeUser) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname || `/product/${product.id}`)}`);
      return;
    }
    toggleWishlist(product);
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) {
      showToast("Authentication required to submit review.", "error");
      return;
    }
    if (!reviewComment) return;

    const res = await submitReviewAction(product.id, activeUser.id, reviewRating, reviewComment);

    if (res.success && res.data) {
      showToast("Review transmitted successfully", "success");
      const newReview = {
        id: res.data.id,
        userName: activeUser.name || "Grail Hunter",
        rating: reviewRating,
        comment: reviewComment,
        createdAt: new Date().toISOString().split("T")[0]
      };

      const updatedReviews = [newReview, ...reviewsList];
      const newAverage = Number((updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length).toFixed(1));
      
      setReviewsList(updatedReviews);
      setProduct((prev: any) => ({
        ...prev,
        rating: newAverage,
        reviews: updatedReviews
      }));
      setReviewComment("");
      setReviewRating(5);
    } else if (res.fallback) {
      // Offline fallback: save to localStorage under `moonz_custom_products`
      const newReview = {
        id: `rev-${Date.now()}`,
        userName: activeUser.name || "Grail Hunter",
        rating: reviewRating,
        comment: reviewComment,
        createdAt: new Date().toISOString().split("T")[0]
      };

      const updatedReviews = [newReview, ...reviewsList];
      const newAverage = Number((updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length).toFixed(1));

      try {
        const savedProdsStr = localStorage.getItem("moonz_custom_products");
        let savedProds = savedProdsStr ? JSON.parse(savedProdsStr) : [];
        
        let targetProduct = savedProds.find((p: any) => p.id === product.id);
        if (!targetProduct) {
          targetProduct = { ...product };
          savedProds.push(targetProduct);
        }
        
        targetProduct.reviews = updatedReviews;
        targetProduct.rating = newAverage;
        
        localStorage.setItem("moonz_custom_products", JSON.stringify(savedProds));
      } catch (err) {
        console.error("Failed to save mock review to localStorage:", err);
      }

      setReviewsList(updatedReviews);
      setProduct((prev: any) => ({
        ...prev,
        rating: newAverage,
        reviews: updatedReviews
      }));
      setReviewComment("");
      setReviewRating(5);
      showToast("[Mock] Review saved locally", "success");
    } else {
      showToast("Transmission failed. Please try again.", "error");
    }
  };

  const relatedProducts = products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  const favorite = isInWishlist(product.id);

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
        {/* Product Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Left Column: Image Gallery */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#121212] border border-[#F0EFE7]/5 rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeImageIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0"
                >
                  <Image 
                    src={product.imageUrls[activeImageIdx]} 
                    alt={product.name} 
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              <span className="absolute top-4 left-4 z-20 text-[9px] tracking-wider uppercase px-2 py-0.5 rounded bg-[#B8A98F]/95 text-[#0c0c0c] font-semibold">
                {product.condition}
              </span>
            </div>

            {/* Thumbnails */}
            {product.imageUrls.length > 1 && (
              <div className="flex gap-4">
                {product.imageUrls.map((url: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative aspect-[3/4] w-20 overflow-hidden rounded-lg border transition-all interactive ${activeImageIdx === idx ? "border-[#B8A98F]" : "border-[#F0EFE7]/10 hover:border-[#B8A98F]/50"}`}
                  >
                    <Image 
                      src={url} 
                      alt={`${product.name} thumbnail`} 
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Info & Action Block */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.25em] text-[#B8A98F] font-semibold">{product.brand}</span>
              <h1 className="font-gothic text-3xl md:text-4xl font-extrabold tracking-wide uppercase text-[#F0EFE7]">{product.name}</h1>
              
              {/* Star Ratings */}
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex text-[#B8A98F]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? "fill-[#B8A98F]" : "opacity-35"}`} />
                  ))}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#F0EFE7]/50 mt-0.5">({reviewsList.length} reviews)</span>
              </div>
            </div>

            <div className="text-2xl font-bold text-[#F0EFE7] border-y border-[#F0EFE7]/10 py-4">
              ${product.price}
            </div>

            <div className="flex flex-col gap-4">
              {/* Size Selector */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-widest text-[#B8A98F] font-semibold">Select Size (1-of-1 Grail)</span>
                  <button
                    onClick={() => {
                      setShowSizeCalculator(true);
                      setRecommendedSize(null);
                    }}
                    className="text-[10px] tracking-widest uppercase text-[#B8A98F] hover:text-[#FFFFFF] border-b border-[#B8A98F]/40 hover:border-[#FFFFFF] pb-0.5 transition-colors font-semibold cursor-pointer interactive"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex justify-between items-center -mt-1.5 mb-1">
                  <span className="text-[9px] text-[#F0EFE7]/40 uppercase tracking-widest">
                    Available: {product.size} (fits true to size)
                  </span>
                  <span className={`text-[10px] uppercase tracking-widest font-semibold ${product.stock === 0 ? "text-red-400" : "text-[#F0EFE7]/40"}`}>
                    {product.stock === 0 ? "Out of stock // SOLD OUT" : "Only one available"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const availableSizes = (product.size || "").split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean);
                    return availableSizes.map((sz) => {
                      const isAvailable = product.stock > 0;
                      const isSelected = selectedSize === sz;
                      return (
                        <button
                          key={sz}
                          disabled={!isAvailable}
                          onClick={() => {
                            if (isAvailable) setSelectedSize(sz);
                          }}
                          className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border transition-all text-xs font-bold relative uppercase
                            ${isAvailable 
                              ? isSelected
                                ? "border-[#B8A98F] bg-[#B8A98F]/10 text-[#F0EFE7] ring-1 ring-[#B8A98F]"
                                : "border-[#F0EFE7]/20 bg-[#121212] text-[#F0EFE7] hover:border-[#B8A98F]"
                              : "border-[#F0EFE7]/5 bg-[#0c0c0c]/40 text-[#F0EFE7]/20 cursor-not-allowed overflow-hidden"
                            }
                          `}
                        >
                          <span>{sz}</span>
                          {isAvailable && (
                            <span className="text-[7px] text-[#B8A98F] font-semibold scale-75 mt-0.5 tracking-tighter">1 LEFT</span>
                          )}
                          {!isAvailable && product.stock === 0 ? (
                            <span className="text-[6px] text-red-400 font-semibold scale-75 mt-0.5 tracking-tighter">SOLD OUT</span>
                          ) : !isAvailable ? (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-[140%] h-px bg-[#F0EFE7]/10 rotate-45" />
                            </div>
                          ) : null}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Add to Bag and Wishlist triggers */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all ${
                    product.stock === 0
                      ? "bg-[#1a1a1a] text-[#F0EFE7]/20 border border-[#F0EFE7]/5 cursor-not-allowed"
                      : "bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] interactive transition-colors"
                  }`}
                >
                  {product.stock === 0 ? (
                    <span>Sold Out // Void</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Add to Bag
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleToggleWishlist}
                  className="px-6 py-3 border border-[#F0EFE7]/10 hover:border-[#B8A98F] hover:text-[#B8A98F] rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all interactive"
                >
                  <Heart className={`w-4 h-4 ${favorite ? "fill-[#B8A98F] text-[#B8A98F]" : ""}`} /> 
                  {favorite ? "Wishlisted" : "Add to Wishlist"}
                </button>
              </div>
            </div>

            {/* Authenticity badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#F0EFE7]/10 pt-6 mt-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#121212] border border-[#F0EFE7]/5">
                <ShieldCheck className="w-5 h-5 text-[#B8A98F] flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F0EFE7]">100% Legit</span>
                  <span className="text-[8px] text-[#F0EFE7]/50 uppercase tracking-widest">Verified grail</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#121212] border border-[#F0EFE7]/5">
                <Truck className="w-5 h-5 text-[#B8A98F] flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F0EFE7]">Fast Ship</span>
                  <span className="text-[8px] text-[#F0EFE7]/50 uppercase tracking-widest">Dispatched 24h</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#121212] border border-[#F0EFE7]/5">
                <RefreshCw className="w-5 h-5 text-[#B8A98F] flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F0EFE7]">Secure Pay</span>
                  <span className="text-[8px] text-[#F0EFE7]/50 uppercase tracking-widest">Stripe certified</span>
                </div>
              </div>
            </div>

            {/* Tabs details */}
            <div className="flex flex-col mt-6 border border-[#F0EFE7]/10 rounded-2xl overflow-hidden">
              <div className="flex bg-[#121212] border-b border-[#F0EFE7]/10">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold border-b-2 transition-all interactive ${activeTab === "details" ? "border-[#B8A98F] text-[#B8A98F]" : "border-transparent text-[#F0EFE7]/60"}`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab("shipping")}
                  className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold border-b-2 transition-all interactive ${activeTab === "shipping" ? "border-[#B8A98F] text-[#B8A98F]" : "border-transparent text-[#F0EFE7]/60"}`}
                >
                  Dispatches
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold border-b-2 transition-all interactive ${activeTab === "reviews" ? "border-[#B8A98F] text-[#B8A98F]" : "border-transparent text-[#F0EFE7]/60"}`}
                >
                  Reviews ({reviewsList.length})
                </button>
              </div>

              <div className="p-6 bg-[#0e0e0e] text-xs text-[#F0EFE7]/80 leading-relaxed uppercase font-light">
                <AnimatePresence mode="wait">
                  {activeTab === "details" && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="flex flex-col gap-3"
                    >
                      <p>{product.description}</p>
                      <ul className="flex flex-col gap-2 mt-2 border-t border-[#F0EFE7]/5 pt-3 text-[10px] tracking-wider font-semibold text-[#B8A98F]">
                        <li>BRAND: {product.brand}</li>
                        <li>CONDITION: {product.condition}</li>
                        <li>SIZE: {product.size} (FITS TRUE TO SIZE)</li>
                      </ul>
                    </motion.div>
                  )}

                  {activeTab === "shipping" && (
                    <motion.div
                      key="shipping"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                    >
                      <p>All items dispatch from our celestial vaults in 24-48 hours. Shipping is standard tracked courier ($10 flat rate or free for orders over $250).</p>
                      <p className="mt-2 text-[#B8A98F] font-semibold text-[10px] tracking-wider">Note: Thrifted items are unique. Sales are final unless authentication discrepancy is proved.</p>
                    </motion.div>
                  )}

                  {activeTab === "reviews" && (
                    <motion.div
                      key="reviews"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="flex flex-col gap-6"
                    >
                      {activeUser ? (
                        /* Authenticated Review Form */
                        <form onSubmit={handleAddReview} className="flex flex-col gap-4 p-5 rounded-2xl border border-[#B8A98F]/25 bg-[#121212]/40 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#B8A98F]/2 blur-xl pointer-events-none" />
                          <span className="text-[10px] tracking-widest text-[#B8A98F] font-bold">Transmit Grail Review</span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold pl-1">Reviewer Identity</label>
                              <input 
                                type="text" 
                                disabled 
                                value={reviewName}
                                className="bg-[#0c0c0c]/50 border border-[#F0EFE7]/5 rounded-lg p-3 text-[10px] tracking-widest uppercase outline-none text-[#F0EFE7]/50 cursor-not-allowed font-bold"
                              />
                            </div>
                            
                            {/* Star Selector */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold pl-1">Grail Rating</label>
                              <div className="flex items-center gap-2 h-[42px] px-3.5 rounded-lg border border-[#F0EFE7]/10 bg-[#0c0c0c]">
                                {[1, 2, 3, 4, 5].map((starVal) => {
                                  const isFilled = hoverRating !== null ? starVal <= hoverRating : starVal <= reviewRating;
                                  return (
                                    <button
                                      key={starVal}
                                      type="button"
                                      onMouseEnter={() => setHoverRating(starVal)}
                                      onMouseLeave={() => setHoverRating(null)}
                                      onClick={() => setReviewRating(starVal)}
                                      className="text-[#B8A98F] hover:scale-115 transition-transform p-0.5 interactive"
                                      aria-label={`Rate ${starVal} stars`}
                                    >
                                      <Star className={`w-4 h-4 ${isFilled ? "fill-[#B8A98F]" : "opacity-20"}`} />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold pl-1">Comment / Feedback</label>
                            <textarea 
                              placeholder="SHARE YOUR DETAILED FIT FEEDBACK OR TEXTURE GRAIL DETAILS..." 
                              rows={3}
                              required
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              className="bg-[#0c0c0c] border border-[#F0EFE7]/10 focus:border-[#B8A98F] rounded-lg p-3 text-[10px] tracking-widest uppercase outline-none text-[#F0EFE7] resize-none transition-colors"
                            />
                          </div>

                          <button 
                            type="submit"
                            className="py-3 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[10px] font-bold tracking-widest uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5 interactive"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Transmit Review
                          </button>
                        </form>
                      ) : (
                        /* Unauthenticated CTA */
                        <div className="p-6 rounded-2xl border border-[#F0EFE7]/5 bg-[#121212]/40 text-center flex flex-col items-center justify-center gap-4 py-8 relative overflow-hidden">
                          <div className="absolute inset-0 bg-[#0c0c0c]/10 z-0 pointer-events-none" />
                          <span className="text-xl">🔒</span>
                          <div className="flex flex-col gap-1">
                            <h3 className="font-gothic text-xs font-bold uppercase tracking-wider text-[#F0EFE7]">Authentication Required</h3>
                            <p className="text-[9px] text-[#F0EFE7]/40 uppercase leading-relaxed font-light">
                              Please sign in to write an archive review for this grail drop.
                            </p>
                          </div>
                          <Link
                            href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : `/product/${product.id}`)}`}
                            className="px-5 py-2 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors interactive relative z-10"
                          >
                            Sign In to Write Review
                          </Link>
                        </div>
                      )}

                      {/* Review List */}
                      <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-2">
                        {reviewsList.length > 0 ? (
                          reviewsList.map((rev: any) => (
                            <div key={rev.id} className="border-b border-[#F0EFE7]/5 pb-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] tracking-wider font-semibold text-[#B8A98F]">{rev.userName}</span>
                                <span className="text-[9px] text-[#F0EFE7]/40">{rev.createdAt}</span>
                              </div>
                              <div className="flex text-[#B8A98F] gap-0.5 my-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-2.5 h-2.5 ${i < rev.rating ? "fill-[#B8A98F]" : "opacity-20"}`} />
                                ))}
                              </div>
                              <p className="text-[10px] text-[#F0EFE7]/70 italic mt-1">{rev.comment}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-[#F0EFE7]/40 uppercase tracking-widest">No reviews yet for this grail.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Carousel */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-[#F0EFE7]/10">
            <div className="flex flex-col mb-10">
              <span className="text-[10px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">Matched Gravity</span>
              <h2 className="font-gothic text-2xl md:text-3xl font-black mt-2 tracking-wide uppercase">Related Grails</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Premium Size Calculator Modal */}
      <AnimatePresence>
        {showSizeCalculator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#0c0c0c]/85 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md p-6 rounded-3xl bg-gradient-to-br from-[#121212] to-[#181818] border border-[#B8A98F]/25 flex flex-col gap-6 relative shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#B8A98F]/2 blur-xl pointer-events-none" />
              
              <div className="flex justify-between items-center border-b border-[#F0EFE7]/10 pb-3">
                <span className="text-[10px] tracking-widest text-[#B8A98F] font-bold uppercase">Size Recommendation Calculator</span>
                <button
                  onClick={() => setShowSizeCalculator(false)}
                  className="text-xs uppercase text-[#F0EFE7]/50 hover:text-red-400 font-bold p-1 interactive"
                >
                  ×
                </button>
              </div>

              {!recommendedSize ? (
                <form onSubmit={handleCalculateSize} className="flex flex-col gap-5 text-left">
                  <p className="text-[10px] text-[#F0EFE7]/60 uppercase leading-relaxed font-light">
                    Input your body specifications to determine your optimal streetwear fit drape.
                  </p>
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-[#F0EFE7]/60">
                      <span>Height</span>
                      <span>{calculatorHeight} cm</span>
                    </div>
                    <input
                      type="range"
                      min={150}
                      max={210}
                      value={calculatorHeight}
                      onChange={(e) => setCalculatorHeight(Number(e.target.value))}
                      className="w-full h-1 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#B8A98F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-[#F0EFE7]/60">
                      <span>Weight</span>
                      <span>{calculatorWeight} kg</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={120}
                      value={calculatorWeight}
                      onChange={(e) => setCalculatorWeight(Number(e.target.value))}
                      className="w-full h-1 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#B8A98F]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors mt-2 interactive"
                  >
                    Calculate Recommended Fit
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-5 text-center items-center py-4">
                  <span className="text-3xl animate-bounce">⚡</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-[#B8A98F] font-bold">Recommended Size</span>
                    <span className="text-4xl font-black text-[#F0EFE7] font-gothic tracking-wider mt-1">{recommendedSize}</span>
                  </div>
                  <p className="text-[10px] text-[#F0EFE7]/70 uppercase leading-relaxed max-w-xs font-light">
                    Our proportional algorithm suggests size <strong className="text-[#B8A98F] font-bold">{recommendedSize}</strong> for a clean H&M/Zara style silhouette. 
                  </p>
                  
                  <div className="border-t border-[#F0EFE7]/10 pt-4 w-full flex flex-col gap-2">
                    <p className="text-[9px] text-[#F0EFE7]/40 uppercase">
                      This unique drop is available in size: <strong className="text-[#F0EFE7]">{product.size}</strong>
                    </p>
                    {product.size === recommendedSize && product.stock > 0 ? (
                      <button
                        onClick={() => {
                          setSelectedSize(product.size);
                          setShowSizeCalculator(false);
                          showToast("Recommended size matched & selected!", "success");
                        }}
                        className="w-full py-2 bg-[#B8A98F] hover:bg-[#F0EFE7] text-[#0c0c0c] text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all interactive"
                      >
                        Apply & Select {product.size}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowSizeCalculator(false)}
                        className="w-full py-2 border border-[#F0EFE7]/10 hover:border-[#B8A98F] text-[#F0EFE7]/70 hover:text-[#F0EFE7] text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all interactive"
                      >
                        Close Sizer
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
