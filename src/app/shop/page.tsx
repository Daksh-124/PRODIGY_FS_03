"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { SlidersHorizontal, ArrowUpDown, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// Removed static CATEGORIES and SUBCATEGORIES imports

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { products, categories, subcategories, fetchProducts } = useStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  // Multi-Select Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(350);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFiltersMobile, setShowFiltersMobile] = useState<boolean>(false);

  // Accordion Expand/Collapse State
  const [accordionOpen, setAccordionOpen] = useState({
    genders: true,
    categories: true,
    subcategories: true,
    sizes: true,
    brands: true,
    conditions: true,
    price: true
  });

  const toggleAccordion = (section: keyof typeof accordionOpen) => {
    setAccordionOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Sync state with URL search params
  useEffect(() => {
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const search = searchParams.get("search") || "";
    const gender = searchParams.get("gender");

    if (category) {
      setSelectedCategories([category]);
    } else if (gender) {
      setSelectedCategories([gender]);
    } else {
      setSelectedCategories([]);
    }

    if (subcategory) {
      setSelectedSubcategories([subcategory]);
    } else {
      setSelectedSubcategories([]);
    }

    if (gender) {
      setSelectedGenders([gender]);
    } else {
      setSelectedGenders([]);
    }

    setSearchQuery(search);
  }, [searchParams]);

  // Prune subcategories if their parent category is deselected
  useEffect(() => {
    if (selectedCategories.length > 0) {
      setSelectedSubcategories((prev) =>
        prev.filter((subId) => {
          const sub = (subcategories || []).find((s) => s.id === subId);
          return sub && selectedCategories.includes(sub.categoryId);
        })
      );
    }
  }, [selectedCategories, subcategories]);

  const visibleSubcategories = selectedCategories.length > 0
    ? (subcategories || []).filter(sub => selectedCategories.includes(sub.categoryId))
    : (subcategories || []);

  // Dynamic compilation and sorting of all size variations active in the vault drops
  const standardSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const sizes = Array.from(
    new Set([
      ...standardSizes,
      ...products.flatMap((p) => (p.size || "").split(",").map((s: string) => s.trim().toUpperCase())).filter(Boolean)
    ])
  ).sort((a, b) => {
    const indexA = standardSizes.indexOf(a);
    const indexB = standardSizes.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
  const genders = [
    { name: "Men", value: "men" },
    { name: "Women", value: "women" }
  ];

  // Dynamic brand extraction from active products
  const availableBrands = Array.from(
    new Set(products.map((p) => p.brand).filter(Boolean))
  ) as string[];

  // Condition buckets mapping
  const availableConditions = [
    { name: "Near Mint", value: "Near Mint" },
    { name: "Excellent", value: "Excellent" },
    { name: "Light Wear", value: "Light Wear" },
    { name: "Vintage Patina", value: "Vintage Patina" }
  ];

  // Filter List Toggle Utility
  const toggleFilter = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setList((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  // Filter & Sort Logic
  const filteredProducts = products
    .filter((product) => {
      // Category Filter (multi-select)
      if (selectedCategories.length > 0) {
        const matchesCategory = selectedCategories.some(
          (catId) =>
            product.categoryId === catId ||
            product.categoryName.toLowerCase() === catId.toLowerCase() ||
            (categories || []).find(c => c.id === product.categoryId)?.slug === catId
        );
        if (!matchesCategory) return false;
      }
      // Subcategory Filter (multi-select)
      if (selectedSubcategories.length > 0) {
        const matchesSubcategory = selectedSubcategories.some(
          (subId) =>
            product.subCategoryId === subId ||
            product.subCategoryName?.toLowerCase() === subId.toLowerCase()
        );
        if (!matchesSubcategory) return false;
      }
      // Size Filter (multi-select)
      if (selectedSizes.length > 0) {
        const productSizes = (product.size || "").split(",").map((s: string) => s.trim().toUpperCase());
        const hasSize = selectedSizes.some(sz => productSizes.includes(sz.toUpperCase()));
        if (!hasSize) return false;
      }
      // Gender Filter (multi-select)
      if (selectedGenders.length > 0 && !selectedGenders.map(g => g.toLowerCase()).includes(product.gender.toLowerCase())) {
        return false;
      }
      // Brand Filter (multi-select)
      if (selectedBrands.length > 0 && (!product.brand || !selectedBrands.includes(product.brand))) {
        return false;
      }
      // Condition Filter (multi-select)
      if (selectedConditions.length > 0) {
        const matchesCondition = selectedConditions.some((cond) =>
          product.condition.toLowerCase().includes(cond.toLowerCase())
        );
        if (!matchesCondition) return false;
      }
      // Price Filter
      if (product.price > maxPrice) {
        return false;
      }
      // Search Query Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesBrand = product.brand?.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        return matchesName || matchesBrand || matchesDesc;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") {
        return a.price - b.price;
      }
      if (sortBy === "price-high") {
        return b.price - a.price;
      }
      // Default / Newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedSizes([]);
    setSelectedGenders([]);
    setSelectedBrands([]);
    setSelectedConditions([]);
    setMaxPrice(350);
    setSearchQuery("");
    router.push("/shop");
  };

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
        {/* Page Title & Horizontal Subcategories (H&M Style layout) */}
        <div className="mb-10 text-center md:text-left flex flex-col gap-4">
          <div>
            <span className="text-[9px] tracking-[0.3em] text-[#B8A98F] uppercase font-bold">Vault Catalogue // Archive</span>
            <h1 className="font-sans font-black text-2xl md:text-4xl mt-1 tracking-widest uppercase text-[#F0EFE7]">
              {selectedCategories.length === 1 
                ? `${categories.find(c => c.id === selectedCategories[0])?.name}'s Fits`
                : "Shop All Fits"}
            </h1>
            <p className="text-[9px] text-[#F0EFE7]/40 mt-1.5 uppercase font-light tracking-wider">
              Showing {filteredProducts.length} items out of {products.length} garments in orbit
            </p>
          </div>

          {/* Horizontal Subcategory Bar */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 border-t border-[#F0EFE7]/10 pt-4 mt-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedSubcategories([])}
              className={`text-[9px] uppercase tracking-[0.2em] font-bold pb-1 transition-all border-b-2 interactive ${
                selectedSubcategories.length === 0
                  ? "border-[#B8A98F] text-[#F0EFE7]"
                  : "border-transparent text-[#F0EFE7]/45 hover:text-[#B8A98F]"
              }`}
            >
              All Pieces
            </button>
            {visibleSubcategories.map((sub) => {
              const isSelected = selectedSubcategories.includes(sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategories([sub.id])}
                  className={`text-[9px] uppercase tracking-[0.2em] font-bold pb-1 transition-all border-b-2 interactive ${
                    isSelected
                      ? "border-[#B8A98F] text-[#F0EFE7]"
                      : "border-transparent text-[#F0EFE7]/45 hover:text-[#B8A98F]"
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Filter Toggle & Sort Header */}
        <div className="flex items-center justify-between border-y border-[#F0EFE7]/10 py-4 mb-8">
          <button 
            onClick={() => setShowFiltersMobile(true)}
            className="md:hidden flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8A98F] hover:text-[#FFFFFF] interactive"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          
          {/* Active Filter Pills (Desktop) */}
          <div className="hidden md:flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-[#F0EFE7]/40">
            <span>Active Filters:</span>
            {selectedGenders.map((g) => (
              <span key={g} className="px-2.5 py-1 rounded-full bg-[#121212] border border-[#F0EFE7]/10 text-[#F0EFE7] flex items-center gap-1.5 text-[10px]">
                {g}
                <button
                  onClick={() => toggleFilter(selectedGenders, setSelectedGenders, g)}
                  className="hover:text-red-400 font-bold ml-0.5 text-xs inline-flex"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedCategories.map((c) => {
              const catName = (categories || []).find(cat => cat.id === c)?.name || c;
              return (
                <span key={c} className="px-2.5 py-1 rounded-full bg-[#121212] border border-[#F0EFE7]/10 text-[#F0EFE7] flex items-center gap-1.5 text-[10px]">
                  {catName}
                  <button
                    onClick={() => toggleFilter(selectedCategories, setSelectedCategories, c)}
                    className="hover:text-red-400 font-bold ml-0.5 text-xs inline-flex"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {selectedSubcategories.map((subId) => {
              const subName = (subcategories || []).find(sub => sub.id === subId)?.name || subId;
              return (
                <span key={subId} className="px-2.5 py-1 rounded-full bg-[#121212] border border-[#F0EFE7]/10 text-[#F0EFE7] flex items-center gap-1.5 text-[10px]">
                  {subName}
                  <button
                    onClick={() => toggleFilter(selectedSubcategories, setSelectedSubcategories, subId)}
                    className="hover:text-red-400 font-bold ml-0.5 text-xs inline-flex"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {selectedSizes.map((s) => (
              <span key={s} className="px-2.5 py-1 rounded-full bg-[#121212] border border-[#F0EFE7]/10 text-[#F0EFE7] flex items-center gap-1.5 text-[10px]">
                Size: {s}
                <button
                  onClick={() => toggleFilter(selectedSizes, setSelectedSizes, s)}
                  className="hover:text-red-400 font-bold ml-0.5 text-xs inline-flex"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedBrands.map((b) => (
              <span key={b} className="px-2.5 py-1 rounded-full bg-[#121212] border border-[#F0EFE7]/10 text-[#F0EFE7] flex items-center gap-1.5 text-[10px]">
                {b}
                <button
                  onClick={() => toggleFilter(selectedBrands, setSelectedBrands, b)}
                  className="hover:text-red-400 font-bold ml-0.5 text-xs inline-flex"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedConditions.map((cond) => (
              <span key={cond} className="px-2.5 py-1 rounded-full bg-[#121212] border border-[#F0EFE7]/10 text-[#F0EFE7] flex items-center gap-1.5 text-[10px]">
                {cond}
                <button
                  onClick={() => toggleFilter(selectedConditions, setSelectedConditions, cond)}
                  className="hover:text-red-400 font-bold ml-0.5 text-xs inline-flex"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {maxPrice < 350 && (
              <span className="px-2.5 py-1 rounded-full bg-[#121212] border border-[#F0EFE7]/10 text-[#F0EFE7] flex items-center gap-1.5 text-[10px]">
                Max: ${maxPrice}
                <button
                  onClick={() => setMaxPrice(350)}
                  className="hover:text-red-400 font-bold ml-0.5 text-xs inline-flex"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="px-2.5 py-1 rounded-full bg-[#121212] border border-[#F0EFE7]/10 text-[#F0EFE7] flex items-center gap-1.5 text-[10px]">
                "{searchQuery}"
                <button
                  onClick={() => setSearchQuery("")}
                  className="hover:text-red-400 font-bold ml-0.5 text-xs inline-flex"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(selectedGenders.length > 0 || selectedCategories.length > 0 || selectedSubcategories.length > 0 || selectedSizes.length > 0 || selectedBrands.length > 0 || selectedConditions.length > 0 || maxPrice < 350 || searchQuery) ? (
              <button onClick={clearAllFilters} className="text-red-400 hover:text-red-300 font-bold ml-4 transition-colors interactive">
                Reset All
              </button>
            ) : (
              <span className="text-[#F0EFE7]/20 italic">None active</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ArrowUpDown className="w-4 h-4 text-[#B8A98F]" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#121212] border border-[#F0EFE7]/10 rounded-lg text-xs uppercase tracking-wider text-[#F0EFE7] px-3 py-1.5 focus:border-[#B8A98F] outline-none interactive"
            >
              <option value="newest">Newest Drops</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar Collapsible Accordion Filters (Desktop) */}
          <aside className="hidden md:flex flex-col gap-6">
            
            {/* Gender Accordion */}
            <div className="border-b border-[#F0EFE7]/10 pb-4">
              <button
                onClick={() => toggleAccordion("genders")}
                className="w-full flex items-center justify-between text-xs uppercase tracking-[0.25em] font-bold text-[#B8A98F] py-2 hover:text-[#F0EFE7] transition-colors"
              >
                <span>Segments</span>
                {accordionOpen.genders ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <AnimatePresence initial={false}>
                {accordionOpen.genders && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex flex-col gap-2 mt-2"
                  >
                    {genders.map((g) => {
                      const isSelected = selectedGenders.includes(g.value);
                      return (
                        <button
                          key={g.value}
                          onClick={() => toggleFilter(selectedGenders, setSelectedGenders, g.value)}
                          className={`text-left text-xs uppercase tracking-widest py-1.5 transition-colors flex items-center gap-2.5 interactive ${isSelected ? "text-[#F0EFE7] font-semibold" : "text-[#F0EFE7]/60 hover:text-[#B8A98F]"}`}
                        >
                          <div className={`w-3 h-3 border flex items-center justify-center rounded-sm transition-all ${isSelected ? "border-[#B8A98F] bg-[#B8A98F] text-[#0c0c0c]" : "border-[#F0EFE7]/20 bg-transparent"}`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-[#0c0c0c] rounded-[1px]" />}
                          </div>
                          <span>{g.name}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Conditional categories and subcategories sidebar accordion */}
            {selectedCategories.length === 1 && ["men", "women", "rare-finds"].includes(selectedCategories[0]) ? (
              <div className="border-b border-[#F0EFE7]/10 pb-4">
                <button
                  onClick={() => toggleAccordion("subcategories")}
                  className="w-full flex items-center justify-between text-xs uppercase tracking-[0.25em] font-bold text-[#B8A98F] py-2 hover:text-[#F0EFE7] transition-colors"
                >
                  <span>Categories</span>
                  {accordionOpen.subcategories ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <AnimatePresence initial={false}>
                  {accordionOpen.subcategories && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden flex flex-col gap-2 mt-2 max-h-[400px] overflow-y-auto pr-1"
                    >
                      {visibleSubcategories.map((sub) => {
                        const isSelected = selectedSubcategories.includes(sub.id);
                        return (
                          <button
                            key={sub.id}
                            onClick={() => toggleFilter(selectedSubcategories, setSelectedSubcategories, sub.id)}
                            className={`text-left text-xs uppercase tracking-widest py-1.5 transition-colors flex items-center gap-2.5 interactive ${isSelected ? "text-[#F0EFE7] font-semibold" : "text-[#F0EFE7]/60 hover:text-[#B8A98F]"}`}
                          >
                            <div className={`w-3 h-3 border flex items-center justify-center rounded-sm transition-all ${isSelected ? "border-[#B8A98F] bg-[#B8A98F] text-[#0c0c0c]" : "border-[#F0EFE7]/20 bg-transparent"}`}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-[#0c0c0c] rounded-[1px]" />}
                            </div>
                            <span>{sub.name}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                {/* Parent Categories Accordion */}
                <div className="border-b border-[#F0EFE7]/10 pb-4">
                  <button
                    onClick={() => toggleAccordion("categories")}
                    className="w-full flex items-center justify-between text-xs uppercase tracking-[0.25em] font-bold text-[#B8A98F] py-2 hover:text-[#F0EFE7] transition-colors"
                  >
                    <span>Divisions</span>
                    {accordionOpen.categories ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {accordionOpen.categories && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden flex flex-col gap-2 mt-2"
                      >
                        {(categories || []).map((cat) => {
                          const isSelected = selectedCategories.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              onClick={() => toggleFilter(selectedCategories, setSelectedCategories, cat.id)}
                              className={`text-left text-xs uppercase tracking-widest py-1.5 transition-colors flex items-center gap-2.5 interactive ${isSelected ? "text-[#F0EFE7] font-semibold" : "text-[#F0EFE7]/60 hover:text-[#B8A98F]"}`}
                            >
                              <div className={`w-3 h-3 border flex items-center justify-center rounded-sm transition-all ${isSelected ? "border-[#B8A98F] bg-[#B8A98F] text-[#0c0c0c]" : "border-[#F0EFE7]/20 bg-transparent"}`}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-[#0c0c0c] rounded-[1px]" />}
                              </div>
                              <span>{cat.name}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Subcategories Accordion */}
                <div className="border-b border-[#F0EFE7]/10 pb-4">
                  <button
                    onClick={() => toggleAccordion("subcategories")}
                    className="w-full flex items-center justify-between text-xs uppercase tracking-[0.25em] font-bold text-[#B8A98F] py-2 hover:text-[#F0EFE7] transition-colors"
                  >
                    <span>Subcategories</span>
                    {accordionOpen.subcategories ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {accordionOpen.subcategories && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden flex flex-col gap-2 mt-2 max-h-48 overflow-y-auto pr-1"
                      >
                        {visibleSubcategories.map((sub) => {
                          const isSelected = selectedSubcategories.includes(sub.id);
                          return (
                            <button
                              key={sub.id}
                              onClick={() => toggleFilter(selectedSubcategories, setSelectedSubcategories, sub.id)}
                              className={`text-left text-xs uppercase tracking-widest py-1.5 transition-colors flex items-center gap-2.5 interactive ${isSelected ? "text-[#F0EFE7] font-semibold" : "text-[#F0EFE7]/60 hover:text-[#B8A98F]"}`}
                            >
                              <div className={`w-3 h-3 border flex items-center justify-center rounded-sm transition-all ${isSelected ? "border-[#B8A98F] bg-[#B8A98F] text-[#0c0c0c]" : "border-[#F0EFE7]/20 bg-transparent"}`}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-[#0c0c0c] rounded-[1px]" />}
                              </div>
                              <span>{sub.name}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* Size Accordion */}
            <div className="border-b border-[#F0EFE7]/10 pb-4">
              <button
                onClick={() => toggleAccordion("sizes")}
                className="w-full flex items-center justify-between text-xs uppercase tracking-[0.25em] font-bold text-[#B8A98F] py-2 hover:text-[#F0EFE7] transition-colors"
              >
                <span>Sizes</span>
                {accordionOpen.sizes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <AnimatePresence initial={false}>
                {accordionOpen.sizes && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex flex-wrap gap-2 mt-3"
                  >
                    {sizes.map((sz) => {
                      const isSelected = selectedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          onClick={() => toggleFilter(selectedSizes, setSelectedSizes, sz)}
                          className={`w-10 h-10 rounded-lg border text-xs font-bold transition-all flex items-center justify-center interactive ${isSelected ? "bg-[#F0EFE7] text-[#0c0c0c] border-[#F0EFE7]" : "border-[#F0EFE7]/10 text-[#F0EFE7] hover:border-[#B8A98F] hover:text-[#B8A98F]"}`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Brand Accordion */}
            <div className="border-b border-[#F0EFE7]/10 pb-4">
              <button
                onClick={() => toggleAccordion("brands")}
                className="w-full flex items-center justify-between text-xs uppercase tracking-[0.25em] font-bold text-[#B8A98F] py-2 hover:text-[#F0EFE7] transition-colors"
              >
                <span>Brands</span>
                {accordionOpen.brands ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <AnimatePresence initial={false}>
                {accordionOpen.brands && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex flex-col gap-2 mt-2"
                  >
                    {availableBrands.length > 0 ? (
                      availableBrands.map((brand) => {
                        const isSelected = selectedBrands.includes(brand);
                        return (
                          <button
                            key={brand}
                            onClick={() => toggleFilter(selectedBrands, setSelectedBrands, brand)}
                            className={`text-left text-xs uppercase tracking-widest py-1.5 transition-colors flex items-center gap-2.5 interactive ${isSelected ? "text-[#F0EFE7] font-semibold" : "text-[#F0EFE7]/60 hover:text-[#B8A98F]"}`}
                          >
                            <div className={`w-3 h-3 border flex items-center justify-center rounded-sm transition-all ${isSelected ? "border-[#B8A98F] bg-[#B8A98F] text-[#0c0c0c]" : "border-[#F0EFE7]/20 bg-transparent"}`}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-[#0c0c0c] rounded-[1px]" />}
                            </div>
                            <span>{brand}</span>
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-[#F0EFE7]/20 uppercase tracking-widest">No brands loaded</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Condition Accordion */}
            <div className="border-b border-[#F0EFE7]/10 pb-4">
              <button
                onClick={() => toggleAccordion("conditions")}
                className="w-full flex items-center justify-between text-xs uppercase tracking-[0.25em] font-bold text-[#B8A98F] py-2 hover:text-[#F0EFE7] transition-colors"
              >
                <span>Condition</span>
                {accordionOpen.conditions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <AnimatePresence initial={false}>
                {accordionOpen.conditions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex flex-col gap-2 mt-2"
                  >
                    {availableConditions.map((cond) => {
                      const isSelected = selectedConditions.includes(cond.value);
                      return (
                        <button
                          key={cond.value}
                          onClick={() => toggleFilter(selectedConditions, setSelectedConditions, cond.value)}
                          className={`text-left text-xs uppercase tracking-widest py-1.5 transition-colors flex items-center gap-2.5 interactive ${isSelected ? "text-[#F0EFE7] font-semibold" : "text-[#F0EFE7]/60 hover:text-[#B8A98F]"}`}
                        >
                          <div className={`w-3 h-3 border flex items-center justify-center rounded-sm transition-all ${isSelected ? "border-[#B8A98F] bg-[#B8A98F] text-[#0c0c0c]" : "border-[#F0EFE7]/20 bg-transparent"}`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-[#0c0c0c] rounded-[1px]" />}
                          </div>
                          <span>{cond.name}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Price Accordion */}
            <div>
              <button
                onClick={() => toggleAccordion("price")}
                className="w-full flex items-center justify-between text-xs uppercase tracking-[0.25em] font-bold text-[#B8A98F] py-2 hover:text-[#F0EFE7] transition-colors"
              >
                <span>Price Limit</span>
                {accordionOpen.price ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <AnimatePresence initial={false}>
                {accordionOpen.price && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex flex-col gap-3 mt-3"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-widest font-bold">
                      <span className="text-[#F0EFE7]/40">Max Price</span>
                      <span className="text-[#F0EFE7]">${maxPrice}</span>
                    </div>
                    <input 
                      type="range" 
                      min={50} 
                      max={350} 
                      step={10} 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full h-1 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#B8A98F]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reset Button */}
            <button 
              onClick={clearAllFilters}
              className="w-full py-2.5 rounded-lg border border-[#F0EFE7]/10 hover:border-red-400 hover:text-red-400 text-xs font-semibold uppercase tracking-widest transition-all mt-4 interactive"
            >
              Clear All Filters
            </button>
          </aside>

          {/* Product Grid Area */}
          <div className="md:col-span-3">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl glassmorphism bg-[#121212]/40 border border-[#F0EFE7]/5">
                <span className="text-4xl mb-4 select-none">🌑</span>
                <h3 className="font-gothic text-lg font-bold text-[#F0EFE7] tracking-wider uppercase mb-1">Archive Empty</h3>
                <p className="text-xs text-[#F0EFE7]/50 max-w-xs mx-auto uppercase font-light leading-relaxed">
                  No streetwear grails matched your specified filters. Try loosening your search criteria.
                </p>
                <button 
                  onClick={clearAllFilters}
                  className="mt-6 px-6 py-2 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors interactive"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showFiltersMobile && (
        <div className="fixed inset-0 z-[9999] bg-[#0c0c0c]/90 backdrop-blur-md flex justify-end">
          <div className="w-80 h-full bg-[#121212] p-6 overflow-y-auto flex flex-col gap-6 shadow-2xl border-l border-[#F0EFE7]/5">
            <div className="flex items-center justify-between border-b border-[#F0EFE7]/10 pb-4">
              <h3 className="font-gothic text-sm font-bold uppercase tracking-wider text-[#F0EFE7]">Filters</h3>
              <button 
                onClick={() => setShowFiltersMobile(false)}
                className="p-1 text-[#F0EFE7]/60 hover:text-[#FFFFFF] interactive"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Genders */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-[#B8A98F]">Segments</h4>
              <div className="flex flex-col gap-2">
                {genders.map((g) => {
                  const isSelected = selectedGenders.includes(g.value);
                  return (
                    <button
                      key={g.value}
                      onClick={() => toggleFilter(selectedGenders, setSelectedGenders, g.value)}
                      className={`text-left text-xs uppercase tracking-widest py-1.5 transition-colors flex items-center gap-2.5 interactive ${isSelected ? "text-[#F0EFE7] font-semibold" : "text-[#F0EFE7]/60"}`}
                    >
                      <div className={`w-3 h-3 border flex items-center justify-center rounded-sm transition-all ${isSelected ? "border-[#B8A98F] bg-[#B8A98F] text-[#0c0c0c]" : "border-[#F0EFE7]/20 bg-transparent"}`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-[#0c0c0c] rounded-[1px]" />}
                      </div>
                      <span>{g.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Categories */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-[#B8A98F]">Categories</h4>
              <div className="flex flex-col gap-2">
                {(categories || []).map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleFilter(selectedCategories, setSelectedCategories, cat.id)}
                      className={`text-left text-xs uppercase tracking-widest py-1.5 transition-colors flex items-center gap-2.5 interactive ${isSelected ? "text-[#F0EFE7] font-semibold" : "text-[#F0EFE7]/60"}`}
                    >
                      <div className={`w-3 h-3 border flex items-center justify-center rounded-sm transition-all ${isSelected ? "border-[#B8A98F] bg-[#B8A98F] text-[#0c0c0c]" : "border-[#F0EFE7]/20 bg-transparent"}`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-[#0c0c0c] rounded-[1px]" />}
                      </div>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Subcategories */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-[#B8A98F]">Subcategories</h4>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {visibleSubcategories.map((sub) => {
                  const isSelected = selectedSubcategories.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => toggleFilter(selectedSubcategories, setSelectedSubcategories, sub.id)}
                      className={`text-left text-xs uppercase tracking-widest py-1.5 transition-colors flex items-center gap-2.5 interactive ${isSelected ? "text-[#F0EFE7] font-semibold" : "text-[#F0EFE7]/60"}`}
                    >
                      <div className={`w-3 h-3 border flex items-center justify-center rounded-sm transition-all ${isSelected ? "border-[#B8A98F] bg-[#B8A98F] text-[#0c0c0c]" : "border-[#F0EFE7]/20 bg-transparent"}`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-[#0c0c0c] rounded-[1px]" />}
                      </div>
                      <span>{sub.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Sizes */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-[#B8A98F]">Size</h4>
              <div className="flex flex-wrap gap-2">
                {sizes.map((sz) => {
                  const isSelected = selectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      onClick={() => toggleFilter(selectedSizes, setSelectedSizes, sz)}
                      className={`w-10 h-10 rounded-lg border text-xs font-bold transition-all flex items-center justify-center interactive ${isSelected ? "bg-[#F0EFE7] text-[#0c0c0c] border-[#F0EFE7]" : "border-[#F0EFE7]/10 text-[#F0EFE7]"}`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Brands */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-[#B8A98F]">Brands</h4>
              <div className="flex flex-col gap-2">
                {availableBrands.map((brand) => {
                  const isSelected = selectedBrands.includes(brand);
                  return (
                    <button
                      key={brand}
                      onClick={() => toggleFilter(selectedBrands, setSelectedBrands, brand)}
                      className={`text-left text-xs uppercase tracking-widest py-1.5 transition-colors flex items-center gap-2.5 interactive ${isSelected ? "text-[#F0EFE7] font-semibold" : "text-[#F0EFE7]/60"}`}
                    >
                      <div className={`w-3 h-3 border flex items-center justify-center rounded-sm transition-all ${isSelected ? "border-[#B8A98F] bg-[#B8A98F] text-[#0c0c0c]" : "border-[#F0EFE7]/20 bg-transparent"}`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-[#0c0c0c] rounded-[1px]" />}
                      </div>
                      <span>{brand}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Conditions */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-[#B8A98F]">Condition</h4>
              <div className="flex flex-col gap-2">
                {availableConditions.map((cond) => {
                  const isSelected = selectedConditions.includes(cond.value);
                  return (
                    <button
                      key={cond.value}
                      onClick={() => toggleFilter(selectedConditions, setSelectedConditions, cond.value)}
                      className={`text-left text-xs uppercase tracking-widest py-1.5 transition-colors flex items-center gap-2.5 interactive ${isSelected ? "text-[#F0EFE7] font-semibold" : "text-[#F0EFE7]/60"}`}
                    >
                      <div className={`w-3 h-3 border flex items-center justify-center rounded-sm transition-all ${isSelected ? "border-[#B8A98F] bg-[#B8A98F] text-[#0c0c0c]" : "border-[#F0EFE7]/20 bg-transparent"}`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-[#0c0c0c] rounded-[1px]" />}
                      </div>
                      <span>{cond.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Price */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#B8A98F] font-bold">
                <span>Max Price</span>
                <span className="text-[#F0EFE7]">${maxPrice}</span>
              </div>
              <input 
                type="range" 
                min={50} 
                max={350} 
                step={10} 
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#B8A98F]"
              />
            </div>

            <button 
              onClick={() => { clearAllFilters(); setShowFiltersMobile(false); }}
              className="w-full py-2.5 rounded-lg border border-[#F0EFE7]/10 hover:border-red-400 text-xs font-semibold uppercase tracking-widest transition-all mt-auto interactive"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0c0c0c] text-[#F0EFE7] flex items-center justify-center font-gothic text-xl tracking-[0.3em]">
        LOADING THE VAULT...
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
