"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Heart, Search, User, ShieldAlert, X, ChevronRight } from "lucide-react";

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { cart, wishlist, activeUser, loginMock, logoutMock, setCartDrawerOpen, products, categories, subcategories } = useStore();
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeHoverMenu, setActiveHoverMenu] = useState<"men" | "women" | "rare" | null>(null);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const liveResults = searchQuery.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const handleRoleToggle = (role: "USER" | "ADMIN") => {
    loginMock(role);
    setShowProfileMenu(false);
  };

  return (
    <>


      <header 
        className="sticky top-0 z-50 w-full px-6 py-4 transition-all duration-300"
        onMouseLeave={() => setActiveHoverMenu(null)}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-full glassmorphism">
          
          {/* Logo: Moon Phases Stacked Vertically */}
          <Link href="/" className="flex items-center gap-3 group interactive" onMouseEnter={() => setActiveHoverMenu(null)}>
            <div className="flex flex-col items-center justify-center leading-none text-[8px] text-[#B8A98F]">
              <span>🌕</span>
              <span>🌗</span>
              <span>🌑</span>
            </div>
            <span className="font-gothic text-lg font-bold tracking-[0.2em] text-[#F0EFE7] group-hover:text-[#B8A98F] transition-colors">
              MOONZTHRIFT
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 h-full">
            <Link 
              href="/shop" 
              className={`text-xs tracking-widest uppercase transition-colors py-2 interactive ${pathname === "/shop" && !searchParams.get("gender") && !searchParams.get("category") ? "text-[#B8A98F] font-semibold" : "text-[#F0EFE7]/80 hover:text-[#B8A98F]"}`}
              onMouseEnter={() => setActiveHoverMenu(null)}
            >
              Shop All
            </Link>
            <div 
              className="relative py-2"
              onMouseEnter={() => setActiveHoverMenu("men")}
            >
              <Link 
                href="/shop?gender=men" 
                className={`text-xs tracking-widest uppercase transition-colors interactive ${searchParams.get("gender") === "men" ? "text-[#B8A98F] font-semibold" : "text-[#F0EFE7]/80 hover:text-[#B8A98F]"}`}
              >
                Men
              </Link>
            </div>
            <div 
              className="relative py-2"
              onMouseEnter={() => setActiveHoverMenu("women")}
            >
              <Link 
                href="/shop?gender=women" 
                className={`text-xs tracking-widest uppercase transition-colors interactive ${searchParams.get("gender") === "women" ? "text-[#B8A98F] font-semibold" : "text-[#F0EFE7]/80 hover:text-[#B8A98F]"}`}
              >
                Women
              </Link>
            </div>
            <div 
              className="relative py-2"
              onMouseEnter={() => setActiveHoverMenu("rare")}
            >
              <Link 
                href="/shop?category=rare-finds" 
                className={`text-xs tracking-widest uppercase transition-colors interactive ${searchParams.get("category") === "rare-finds" || searchParams.get("category") === "cat-rare" ? "text-[#B8A98F] font-semibold" : "text-[#F0EFE7]/80 hover:text-[#B8A98F]"}`}
              >
                Rare Finds
              </Link>
            </div>

          </nav>

          {/* Icon Actions */}
          <div className="flex items-center gap-4" onMouseEnter={() => setActiveHoverMenu(null)}>
            {/* Search Trigger */}
            <button 
              onClick={() => setShowSearch(true)} 
              className="text-[#F0EFE7]/80 hover:text-[#B8A98F] transition-colors p-1.5 interactive"
              aria-label="Search"
            >
              <Search className="w-4 h-4 md:w-5 h-5" />
            </button>

            {/* Wishlist Link */}
            <Link href="/wishlist" className="relative text-[#F0EFE7]/80 hover:text-[#B8A98F] transition-colors p-1.5 interactive" aria-label="Wishlist">
              <Heart className="w-4 h-4 md:w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#B8A98F] text-[#0c0c0c] text-[9px] font-bold flex items-center justify-center transform translate-x-1.5 -translate-y-1">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Trigger */}
            <button 
              onClick={() => setCartDrawerOpen(true)}
              className="relative text-[#F0EFE7]/80 hover:text-[#B8A98F] transition-colors p-1.5 interactive cursor-pointer" 
              aria-label="Open cart drawer"
            >
              <ShoppingBag className="w-4 h-4 md:w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#F0EFE7] text-[#0c0c0c] text-[9px] font-bold flex items-center justify-center transform translate-x-1.5 -translate-y-1">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account / Role Selector Toggle */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="text-[#F0EFE7]/80 hover:text-[#B8A98F] transition-colors p-1.5 flex items-center gap-1.5 border border-transparent hover:border-[#F0EFE7]/10 rounded-full interactive"
                aria-label="User profile options"
              >
                <User className="w-4 h-4 md:w-5 h-5" />
                <span className="hidden lg:inline text-[9px] uppercase tracking-wider text-[#B8A98F]">
                  {activeUser ? activeUser.role : "Guest"}
                </span>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 p-2 rounded-2xl glassmorphism z-50 text-[#F0EFE7]"
                  >
                    {activeUser ? (
                      <>
                        <div className="px-3 py-2 border-b border-[#F0EFE7]/10 mb-2">
                          <p className="text-[10px] text-[#B8A98F] tracking-widest uppercase">Logged In As</p>
                          <p className="text-xs font-semibold truncate">{activeUser.name}</p>
                          <Link 
                            href="/profile" 
                            onClick={() => setShowProfileMenu(false)}
                            className="block mt-2 text-[10px] uppercase tracking-widest text-[#B8A98F] hover:text-[#FFFFFF] transition-colors border border-[#B8A98F]/20 hover:border-[#B8A98F] rounded py-1.5 text-center font-bold"
                          >
                            Profile Vault
                          </Link>
                          {activeUser.role === "ADMIN" && (
                            <Link 
                              href="/admin/dashboard" 
                              onClick={() => setShowProfileMenu(false)}
                              className="block mt-2 text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors border border-red-400/20 hover:border-red-400 rounded py-1.5 text-center font-bold interactive"
                            >
                              Admin Console
                            </Link>
                          )}
                        </div>



                        <div className="border-t border-[#F0EFE7]/10 mt-2 pt-2">
                          <button 
                            onClick={() => { logoutMock(); setShowProfileMenu(false); }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors interactive"
                          >
                            Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 text-center flex flex-col gap-2">
                        <p className="text-[10px] text-[#F0EFE7]/40 uppercase tracking-widest font-semibold">Guest Session</p>
                        <Link 
                          href="/login" 
                          onClick={() => setShowProfileMenu(false)}
                          className="block w-full py-2 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors"
                        >
                          Sign In / Register
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {activeHoverMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-6 right-6 top-[72px] z-40 p-8 rounded-3xl glassmorphism border border-[#F0EFE7]/10 text-left"
              onMouseEnter={() => setActiveHoverMenu(activeHoverMenu)}
              onMouseLeave={() => setActiveHoverMenu(null)}
            >
              <div className="grid grid-cols-4 gap-8 max-w-7xl mx-auto">
                {activeHoverMenu === "men" || activeHoverMenu === "women" ? (
                  (() => {
                    const catSubs = (subcategories || []).filter(s => s.categoryId === activeHoverMenu);
                    return (
                      <div className="col-span-3 flex flex-col gap-3">
                        <span className="text-[10px] tracking-[0.2em] font-bold text-[#B8A98F] uppercase border-b border-[#F0EFE7]/10 pb-1.5">
                          {activeHoverMenu === "men" ? "Men's Apparel" : "Women's Apparel"}
                        </span>
                        <div className="grid grid-cols-3 gap-y-2.5 gap-x-6 mt-1">
                          <Link 
                            href={`/shop?category=${activeHoverMenu}`}
                            onClick={() => setActiveHoverMenu(null)}
                            className="text-[11px] uppercase tracking-widest font-semibold text-[#F0EFE7] hover:text-[#B8A98F] transition-colors col-span-3 mb-1"
                          >
                            Shop All {activeHoverMenu === "men" ? "Men" : "Women"}
                          </Link>
                          {catSubs.map(sub => (
                            <Link 
                              key={sub.id}
                              href={`/shop?category=${activeHoverMenu}&subcategory=${sub.id}`}
                              onClick={() => setActiveHoverMenu(null)}
                              className="text-[11px] uppercase tracking-widest text-[#F0EFE7]/60 hover:text-[#B8A98F] transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  (() => {
                    const rareCat = (categories || []).find(c => c.id === "rare-finds" || c.slug === "rare-finds") || categories[0];
                    if (!rareCat) return null;
                    const rareSubs = (subcategories || []).filter(s => s.categoryId === rareCat.id);
                    return (
                      <>
                        <div className="col-span-2 flex flex-col gap-3">
                          <span className="text-[10px] tracking-[0.2em] font-bold text-[#B8A98F] uppercase border-b border-[#F0EFE7]/10 pb-1.5">Rare Finds Vault</span>
                          <div className="grid grid-cols-2 gap-4">
                            <Link 
                              href={`/shop?category=${rareCat.id}`}
                              onClick={() => setActiveHoverMenu(null)}
                              className="text-[11px] uppercase tracking-widest font-semibold text-[#F0EFE7] hover:text-[#B8A98F] transition-colors col-span-2"
                            >
                              Shop All Rare Finds
                            </Link>
                            {rareSubs.map(sub => (
                              <Link 
                                key={sub.id}
                                href={`/shop?category=${rareCat.id}&subcategory=${sub.id}`}
                                onClick={() => setActiveHoverMenu(null)}
                                className="text-[11px] uppercase tracking-widest text-[#F0EFE7]/60 hover:text-[#B8A98F] transition-colors pl-2"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                        <div className="col-span-2 rounded-2xl overflow-hidden border border-[#F0EFE7]/5 relative aspect-[21/9]">
                          <div className="absolute inset-0 bg-black/40 z-10" />
                          <Image 
                            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600" 
                            alt="Rare finds banner" 
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover grayscale opacity-70"
                          />
                          <div className="absolute inset-0 z-20 p-4 flex flex-col justify-end items-start">
                            <span className="text-[8px] tracking-widest text-[#B8A98F] uppercase font-bold">Orbital Grail Drops</span>
                            <span className="text-xs text-[#F0EFE7] uppercase font-bold tracking-wider mt-1">1-of-1 archive releases</span>
                          </div>
                        </div>
                      </>
                    );
                  })()
                )}
 
                {(activeHoverMenu === "men" || activeHoverMenu === "women") && (
                  <div className="flex flex-col gap-3 col-start-4">
                    <span className="text-[10px] tracking-[0.2em] font-bold text-[#B8A98F] uppercase border-b border-[#F0EFE7]/10 pb-1.5">Spotlight Collection</span>
                    <div className="rounded-xl overflow-hidden border border-[#F0EFE7]/5 relative aspect-[16/10] bg-[#121212]">
                      <div className="absolute inset-0 bg-black/40 z-10" />
                      <Image 
                        src={activeHoverMenu === "men" ? "https://images.unsplash.com/photo-1517462964-21fdcec3f25b?q=80&w=600" : "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600"} 
                        alt="Spotlight banner" 
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover grayscale opacity-70"
                      />
                      <div className="absolute inset-0 z-20 p-4 flex flex-col justify-end items-start">
                        <span className="text-[8px] tracking-widest text-[#B8A98F] uppercase font-bold">New Streetwear Drops</span>
                        <Link href={`/shop?category=${activeHoverMenu}`} onClick={() => setActiveHoverMenu(null)} className="text-[10px] text-[#F0EFE7] hover:underline uppercase font-bold tracking-wider mt-1">Explore Now →</Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Floating Fullscreen Search Drawer */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#0c0c0c]/95 backdrop-blur-md flex items-center justify-center p-6"
          >
            <button 
              onClick={() => { setShowSearch(false); setSearchQuery(""); }}
              className="absolute top-8 right-8 text-[#F0EFE7]/80 hover:text-[#B8A98F] p-2 rounded-full border border-[#F0EFE7]/10 hover:border-[#B8A98F] transition-all interactive"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full max-w-2xl flex flex-col gap-6">
              <p className="font-gothic text-xs tracking-[0.3em] text-[#B8A98F] uppercase text-center">Celestial Archive Search</p>
              
              <div className="relative border-b border-[#F0EFE7]/20 focus-within:border-[#B8A98F] transition-colors py-3">
                <input 
                  type="text" 
                  placeholder="SEARCH VINTAGE / STREETWEAR / RARE..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xl md:text-3xl tracking-widest uppercase font-light border-none outline-none text-[#F0EFE7] placeholder-[#F0EFE7]/20"
                  autoFocus
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#F0EFE7]/40 w-6 h-6" />
              </div>

              {/* Quick Search Tags */}
              <div className="flex flex-wrap items-center gap-3 justify-center mt-2">
                <span className="text-[10px] tracking-widest text-[#B8A98F] uppercase">Trending:</span>
                {["Leather", "Hoodie", "Cargo", "Represent", "Rare Finds"].map((tag) => (
                  <Link 
                    key={tag}
                    href={`/shop?search=${tag}`}
                    onClick={() => setShowSearch(false)}
                    className="text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-[#F0EFE7]/10 hover:border-[#B8A98F] hover:text-[#B8A98F] transition-all interactive"
                  >
                    {tag}
                  </Link>
                ))}
              </div>

              {/* Live Search Suggestions */}
              {searchQuery && (
                <div className="flex flex-col gap-3 mt-4">
                  <span className="text-[9px] uppercase tracking-widest text-[#B8A98F] font-bold text-center">Live Grail Suggestions ({liveResults.length})</span>
                  {liveResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {liveResults.map((p) => (
                        <Link
                          key={p.id}
                          href={`/product/${p.id}`}
                          onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                          className="flex items-center gap-4 p-3 rounded-xl bg-[#121212]/60 border border-[#F0EFE7]/5 hover:border-[#B8A98F]/30 hover:bg-[#181818]/80 transition-all text-left interactive group"
                        >
                          <div className="relative w-12 h-16 flex-shrink-0 bg-[#1a1a1a] rounded-lg overflow-hidden">
                            <Image 
                              src={p.imageUrls[0]} 
                              alt={p.name} 
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex flex-col flex-grow truncate">
                            <span className="text-[8px] uppercase tracking-widest text-[#B8A98F]/80 font-bold">{p.brand}</span>
                            <span className="text-xs uppercase tracking-wider text-[#F0EFE7] font-semibold truncate group-hover:text-[#B8A98F] transition-colors">{p.name}</span>
                            <span className="text-[10px] text-[#F0EFE7]/60 mt-1 font-bold">${p.price}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#F0EFE7]/30 uppercase tracking-widest text-center mt-2">No matching grails in vault.</p>
                  )}
                </div>
              )}

              {searchQuery && (
                <div className="mt-4 flex justify-center">
                  <Link 
                    key="results-link"
                    href={`/shop?search=${searchQuery}`} 
                    onClick={() => setShowSearch(false)}
                    className="text-xs uppercase tracking-[0.2em] font-semibold text-[#B8A98F] hover:text-[#FFFFFF] flex items-center gap-1.5 transition-colors interactive"
                  >
                    View results for &quot;{searchQuery}&quot; <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-50 w-full px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-full glassmorphism h-[58px]">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center justify-center leading-none text-[8px] text-[#B8A98F]">
              <span>🌕</span>
              <span>🌗</span>
              <span>🌑</span>
            </div>
            <span className="font-gothic text-lg font-bold tracking-[0.2em] text-[#F0EFE7]">
              MOONZTHRIFT
            </span>
          </div>
        </div>
      </header>
    }>
      <NavbarContent />
    </Suspense>
  );
}
