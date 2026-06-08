"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  Package, 
  DollarSign, 
  ShoppingBag,
  Loader2
} from "lucide-react";
// Removed static CATEGORIES and SUBCATEGORIES imports
import { uploadImageAction } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function AdminDashboard() {
  const { 
    products, 
    activeUser, 
    addProduct, 
    deleteProduct, 
    updateProduct, 
    loginMock,
    showToast,
    allOrders,
    fetchAllOrders,
    updateOrderStatus,
    coupons,
    fetchCoupons,
    createCoupon,
    toggleCouponActive,
    categories,
    subcategories,
    fetchCategories,
    createCategory,
    deleteCategory,
    createSubcategory,
    deleteSubcategory,
    paymentSettings,
    updatePaymentSettings
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<"overview" | "products" | "orders" | "coupons" | "categories" | "settings" | "addProduct">("overview");
  
  // Payment Settings form state
  const [settingsUpiId, setSettingsUpiId] = useState("");
  const [settingsMerchantName, setSettingsMerchantName] = useState("");
  const [settingsQrCodeUrl, setSettingsQrCodeUrl] = useState<string | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  const [selectedAdminOrder, setSelectedAdminOrder] = useState<any>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");
  
  // Category / Subcategory management form state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);

  // Product CRUD Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState(0);
  const [formCategory, setFormCategory] = useState("cat-tops");
  const [formSubCategory, setFormSubCategory] = useState("sub-tshirts");
  const [formSizes, setFormSizes] = useState<string[]>(["M"]);
  const [formCondition, setFormCondition] = useState("9/10 (Excellent)");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formImageUrls, setFormImageUrls] = useState<string[]>([]);
  const [formImageText, setFormImageText] = useState("");
  const [formGender, setFormGender] = useState<"Men" | "Women">("Men");
  const [formStock, setFormStock] = useState(1);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  // Coupon Form State
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(15);
  const [couponExpiryDays, setCouponExpiryDays] = useState(7);
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (paymentSettings) {
      setSettingsUpiId(paymentSettings.upiId || "");
      setSettingsMerchantName(paymentSettings.merchantName || "");
      setSettingsQrCodeUrl(paymentSettings.qrCodeUrl || null);
    }
  }, [paymentSettings]);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    const reader = new FileReader();
    const uploadPromise = new Promise<string | null>((resolve) => {
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const res = await uploadImageAction(base64Data);
        resolve(res.success && res.url ? res.url : null);
      };
      reader.readAsDataURL(file);
    });

    const url = await uploadPromise;
    if (url) {
      setSettingsQrCodeUrl(url);
      showToast("QR Code uploaded successfully", "success");
    } else {
      showToast("Failed to upload QR Code", "error");
    }
    setUploadingQr(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentSettings({
      upiId: settingsUpiId,
      merchantName: settingsMerchantName,
      qrCodeUrl: settingsQrCodeUrl
    });
  };

  useEffect(() => {
    const savedUserStr = localStorage.getItem("moonz_user");
    const user = activeUser || (savedUserStr ? JSON.parse(savedUserStr) : null);
    
    if (!user || user.role !== "ADMIN") {
      router.push("/admin/login");
    }
  }, [activeUser, router]);

  useEffect(() => {
    if (categories.length > 0) {
      if (!selectedParentCategoryId) {
        setSelectedParentCategoryId(categories[0].id);
      }
      if (!formCategory || formCategory === "cat-tops") {
        setFormCategory(categories[0].id);
      }
    }
  }, [categories, selectedParentCategoryId, formCategory]);

  useEffect(() => {
    if (subcategories.length > 0 && formCategory) {
      const activeSubs = subcategories.filter(s => s.categoryId === formCategory);
      if (activeSubs.length > 0) {
        setFormSubCategory(activeSubs[0].id);
      }
    }
  }, [subcategories, formCategory]);

  useEffect(() => {
    if (activeSubTab === "orders") {
      fetchAllOrders();
    } else if (activeSubTab === "coupons") {
      fetchCoupons();
    } else if (activeSubTab === "categories") {
      fetchCategories();
    }
  }, [activeSubTab]);

  const filteredOrders = allOrders.filter((o: any) => {
    if (orderStatusFilter === "ALL") return true;
    return o.status === orderStatusFilter;
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const uploadPromise = new Promise<string | null>((resolve) => {
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          const res = await uploadImageAction(base64Data);
          resolve(res.success && res.url ? res.url : null);
        };
        reader.readAsDataURL(file);
      });

      const url = await uploadPromise;
      if (url) {
        setFormImageUrls(prev => [...prev, url]);
      } else {
        showToast(`Failed to upload image ${i+1}`, "error");
      }
    }
    
    setUploadingImage(false);
    showToast("Images processed successfully", "success");
  };

  // Admin access validation
  if (!activeUser || activeUser.role !== "ADMIN") {
    return (
      <>
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-32 text-center px-6">
          <ShieldAlert className="w-12 h-12 text-[#B8A98F] mb-6 animate-pulse" />
          <span className="text-[9px] tracking-[0.3em] text-[#B8A98F] uppercase font-semibold">Security Alert</span>
          <h1 className="font-gothic text-xl md:text-2xl font-black uppercase text-[#F0EFE7] tracking-wider mt-2">Access Restricted</h1>
          <p className="text-xs text-[#F0EFE7]/50 mt-3 max-w-sm uppercase font-light leading-relaxed">
            Redirecting to MoonzThrift Admin Portal...
          </p>
          <Link
            href="/admin/login"
            className="mt-6 px-6 py-2.5 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-widest rounded-lg transition-colors interactive inline-block"
          >
            Go to Admin Login
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  // Analytics Metrics calculations dynamically sourced from db
  const totalProducts = products.length;
  const computedTotalRevenues = allOrders.length > 0 
    ? allOrders.reduce((acc: number, o: any) => acc + o.total, 0)
    : 430; // Fallback seed orders sum
  const computedOrdersCount = allOrders.length > 0 ? allOrders.length : 2;
  const computedAov = computedOrdersCount > 0 ? Math.round(computedTotalRevenues / computedOrdersCount) : 0;

  // Recharts Sales Trajectory Line Data
  const salesMap: Record<string, number> = {
    "2026-05-20": 320,
    "2026-05-22": 110,
  };
  allOrders.forEach((o: any) => {
    salesMap[o.date] = (salesMap[o.date] || 0) + o.total;
  });
  const salesChartData = Object.keys(salesMap)
    .map((date) => ({
      name: date.split("-").slice(1).join("/"),
      revenue: salesMap[date],
      dateKey: date
    }))
    .sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime());

  // Recharts Category Distribution Pie Data
  const categoryChartData = (categories || []).map((cat) => {
    const count = products.filter((p) => p.categoryId === cat.id).length;
    return {
      name: cat.name,
      value: count || 1
    };
  });
  const PIE_COLORS = ["#B8A98F", "#8B7355", "#F0EFE7", "#5C5C50"];

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || couponDiscount <= 0 || couponExpiryDays <= 0) return;
    setCreatingCoupon(true);
    const success = await createCoupon(couponCode.toUpperCase(), Number(couponDiscount), Number(couponExpiryDays));
    setCreatingCoupon(false);
    if (success) {
      setCouponCode("");
      setCouponDiscount(15);
      setCouponExpiryDays(7);
    }
  };

  const addCustomSize = () => {
    const clean = customSizeInput.trim().toUpperCase();
    if (clean && !formSizes.includes(clean)) {
      setFormSizes((prev) => [...prev, clean]);
      setCustomSizeInput("");
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice) return;

    const finalImageUrls = formImageUrls.length > 0 
      ? formImageUrls 
      : ["https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600"];
      
    const selectedCatObj = (categories || []).find(c => c.id === formCategory) || categories[0] || { name: "Men" };
    const selectedSubCatObj = (subcategories || []).find(s => s.id === formSubCategory) || subcategories[0] || { name: "T-Shirts & Tops" };

    // Auto-assign gender based on category
    let finalGender = formGender;
    if (formCategory === "men") finalGender = "Men";
    else if (formCategory === "women") finalGender = "Women";

    const productPayload = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: formName,
      brand: formBrand,
      description: formDesc,
      price: Number(formPrice),
      imageUrls: finalImageUrls,
      categoryId: formCategory,
      categoryName: selectedCatObj.name,
      subCategoryId: formSubCategory,
      subCategoryName: selectedSubCatObj.name,
      stock: Number(formStock),
      size: formSizes.join(", "),
      condition: formCondition,
      isFeatured: formFeatured,
      isTrending: true, // Make immediately active on home showcase
      rating: 5.0,
      reviews: [],
      createdAt: new Date().toISOString().split("T")[0],
      gender: finalGender
    };

    if (editingProduct) {
      updateProduct(productPayload);
    } else {
      addProduct(productPayload);
    }

    // Reset Form
    setFormName("");
    setFormBrand("");
    setFormDesc("");
    setFormPrice(0);
    setFormImageUrls([]);
    setFormImageText("");
    setFormSizes(["M"]);
    setCustomSizeInput("");
    setFormCondition("9/10 (Excellent)");
    setFormFeatured(false);
    setFormGender("Men");
    setFormStock(1);
    if (categories.length > 0) setFormCategory(categories[0].id);
    if (subcategories.length > 0) {
      const activeSubs = subcategories.filter(s => s.categoryId === (categories[0]?.id || ""));
      if (activeSubs.length > 0) setFormSubCategory(activeSubs[0].id);
    }
    setEditingProduct(null);
    setShowAddForm(false);
    setActiveSubTab("products");
  };

  const handleEditClick = (p: any) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormBrand(p.brand || "");
    setFormDesc(p.description);
    setFormPrice(p.price);
    setFormCategory(p.categoryId || (categories[0]?.id || ""));
    setFormSubCategory(p.subCategoryId || (subcategories[0]?.id || ""));
    const parsedSizes = p.size ? p.size.split(",").map((s: any) => s.trim().toUpperCase()) : ["M"];
    setFormSizes(parsedSizes);
    setCustomSizeInput("");
    setFormCondition(p.condition);
    setFormFeatured(p.isFeatured);
    setFormImageUrls(p.imageUrls || []);
    setFormImageText("");
    setFormGender(p.gender || "Men");
    setFormStock(p.stock !== undefined ? p.stock : 1);
    setActiveSubTab("addProduct");
  };

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
        <div className="mb-10 text-center md:text-left border-b border-[#B8A98F]/20 pb-6 flex flex-col md:flex-row md:items-end justify-between">
          <div>
            <span className="text-[9px] tracking-[0.3em] text-[#B8A98F] uppercase font-bold flex items-center justify-center md:justify-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
              SECURE SYSTEM PANEL // CONSOLE v3.0
            </span>
            <h1 className="font-gothic text-2xl md:text-4xl font-black mt-2 tracking-wide uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#F0EFE7] via-[#B8A98F] to-[#8B7355]">
              Admin Operations
            </h1>
          </div>
          
          <div className="flex gap-3 justify-center mt-4 md:mt-0 font-sans flex-wrap">
            <button
              onClick={() => { setActiveSubTab("overview"); setShowAddForm(false); }}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border ${activeSubTab === "overview" ? "bg-[#B8A98F] text-[#0c0c0c] border-[#B8A98F]" : "border-[#F0EFE7]/10 text-[#F0EFE7]/60 hover:text-[#B8A98F]"}`}
            >
              Overview
            </button>
            <button
              onClick={() => { setActiveSubTab("products"); }}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border ${activeSubTab === "products" ? "bg-[#B8A98F] text-[#0c0c0c] border-[#B8A98F]" : "border-[#F0EFE7]/10 text-[#F0EFE7]/60 hover:text-[#B8A98F]"}`}
            >
              Inventory
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setFormName("");
                setFormBrand("");
                setFormDesc("");
                setFormPrice(0);
                setFormImageUrls([]);
                setFormImageText("");
                setFormSizes(["M"]);
                setCustomSizeInput("");
                setFormCondition("9/10 (Excellent)");
                setFormFeatured(false);
                setFormGender("Men");
                setFormStock(1);
                if (categories.length > 0) setFormCategory(categories[0].id);
                if (subcategories.length > 0) {
                  const activeSubs = subcategories.filter(s => s.categoryId === (categories[0]?.id || ""));
                  if (activeSubs.length > 0) setFormSubCategory(activeSubs[0].id);
                }
                setActiveSubTab("addProduct");
              }}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border ${activeSubTab === "addProduct" ? "bg-[#B8A98F] text-[#0c0c0c] border-[#B8A98F]" : "border-[#F0EFE7]/10 text-[#F0EFE7]/60 hover:text-[#B8A98F]"}`}
            >
              Add Product
            </button>
            <button
              onClick={() => { setActiveSubTab("categories"); }}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border ${activeSubTab === "categories" ? "bg-[#B8A98F] text-[#0c0c0c] border-[#B8A98F]" : "border-[#F0EFE7]/10 text-[#F0EFE7]/60 hover:text-[#B8A98F]"}`}
            >
              Categories
            </button>
            <button
              onClick={() => { setActiveSubTab("coupons"); }}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border ${activeSubTab === "coupons" ? "bg-[#B8A98F] text-[#0c0c0c] border-[#B8A98F]" : "border-[#F0EFE7]/10 text-[#F0EFE7]/60 hover:text-[#B8A98F]"}`}
            >
              Coupons
            </button>
            <button
              onClick={() => { setActiveSubTab("orders"); }}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border ${activeSubTab === "orders" ? "bg-[#B8A98F] text-[#0c0c0c] border-[#B8A98F]" : "border-[#F0EFE7]/10 text-[#F0EFE7]/60 hover:text-[#B8A98F]"}`}
            >
              Orders
            </button>
            <button
              onClick={() => { setActiveSubTab("settings"); }}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border ${activeSubTab === "settings" ? "bg-[#B8A98F] text-[#0c0c0c] border-[#B8A98F]" : "border-[#F0EFE7]/10 text-[#F0EFE7]/60 hover:text-[#B8A98F]"}`}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Overview Tab Content */}
        {activeSubTab === "overview" && (
          <div className="flex flex-col gap-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Gross Revenues", val: `$${computedTotalRevenues}`, desc: "Calculated from database", icon: DollarSign },
                { title: "Vault Pieces", val: totalProducts, desc: "Active clothing drops", icon: Package },
                { title: "Average Ticket (AOV)", val: `$${computedAov}`, desc: "Order ticket average", icon: ShoppingBag }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="p-6 rounded-2xl bg-gradient-to-br from-[#121212] to-[#181818] border border-[#B8A98F]/10 hover:border-[#B8A98F]/30 transition-all shadow-md flex items-center gap-4 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-[#B8A98F]/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="p-3 rounded-xl bg-[#B8A98F]/5 border border-[#B8A98F]/25 text-[#B8A98F] group-hover:bg-[#B8A98F]/10 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col z-10">
                      <span className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">{stat.title}</span>
                      <span className="text-2xl font-bold mt-0.5 text-[#F0EFE7] font-gothic tracking-wider">{stat.val}</span>
                      <span className="text-[8px] text-[#B8A98F]/80 uppercase tracking-widest mt-0.5 font-semibold">{stat.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recharts Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sales Trajectory Graph */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-[#121212] to-[#181818] border border-[#B8A98F]/10 flex flex-col gap-4 text-left">
                <span className="text-[10px] uppercase tracking-widest text-[#B8A98F] font-bold">Revenue Timeline trajectory</span>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#B8A98F" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#B8A98F" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#F0EFE7" opacity={0.3} tickLine={false} />
                      <YAxis stroke="#F0EFE7" opacity={0.3} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#121212", borderColor: "#B8A98F", borderRadius: "12px", color: "#F0EFE7", textTransform: "uppercase", fontSize: "10px" }}
                        labelClassName="text-[#B8A98F] font-bold"
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#B8A98F" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Inventory Share Pie Chart */}
              <div className="lg:col-span-1 p-6 rounded-2xl bg-gradient-to-br from-[#121212] to-[#181818] border border-[#B8A98F]/10 flex flex-col gap-4 text-left">
                <span className="text-[10px] uppercase tracking-widest text-[#B8A98F] font-bold">Category Shares</span>
                <div className="h-64 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#121212", borderColor: "#B8A98F", borderRadius: "12px", color: "#F0EFE7", textTransform: "uppercase", fontSize: "10px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center flex-col">
                    <span className="text-xl font-gothic font-bold text-[#F0EFE7]">{totalProducts}</span>
                    <span className="text-[8px] text-[#F0EFE7]/40 uppercase tracking-widest">Total Drops</span>
                  </div>
                </div>

                {/* Legend Labels */}
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {categoryChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-[8px] uppercase tracking-widest font-semibold text-[#F0EFE7]/60">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span>{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            
            <div className="p-6 rounded-2xl border border-[#F0EFE7]/5 bg-[#121212] text-xs text-[#F0EFE7]/60 leading-relaxed uppercase font-light">
              <p>Welcome to the operations node. To add new streetwear grails to the homepage showcase, click on the **Inventory** tab above and click **Add New Grail**.</p>
            </div>
          </div>
        )}

        {/* Products Tab Content */}
        {activeSubTab === "products" && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B8A98F]">Archive Inventory</span>
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setFormName("");
                  setFormBrand("");
                  setFormDesc("");
                  setFormPrice(0);
                  setFormImageUrls([]);
                  setFormImageText("");
                  setFormSizes(["M"]);
                  setFormCondition("9/10 (Excellent)");
                  setFormFeatured(false);
                  setFormGender("Men");
                  setFormStock(1);
                  if (categories.length > 0) setFormCategory(categories[0].id);
                  if (subcategories.length > 0) {
                    const activeSubs = subcategories.filter(s => s.categoryId === (categories[0]?.id || ""));
                    if (activeSubs.length > 0) setFormSubCategory(activeSubs[0].id);
                  }
                  setActiveSubTab("addProduct");
                }}
                className="py-2 px-4 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1 transition-colors interactive"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Grail
              </button>
            </div>

            {/* Products Inventory List */}
            <div className="overflow-x-auto rounded-2xl border border-[#F0EFE7]/5 bg-[#121212]">
              <table className="w-full text-left text-xs uppercase tracking-wider text-[#F0EFE7]/80">
                <thead className="bg-[#0c0c0c] text-[#B8A98F] border-b border-[#F0EFE7]/5">
                  <tr>
                    <th className="p-4">Item</th>
                    <th className="p-4">Brand</th>
                    <th className="p-4 text-center">Size</th>
                    <th className="p-4 text-center">Stock</th>
                    <th className="p-4 text-right">Price</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFE7]/5">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F0EFE7]/5 transition-colors">
                      <td className="p-4 font-semibold text-[#F0EFE7] flex items-center gap-3">
                        <div className="relative w-8 h-10 flex-shrink-0 bg-[#1a1a1a] rounded overflow-hidden">
                          <Image src={p.imageUrls[0]} alt={p.name} fill sizes="32px" className="object-cover" />
                        </div>
                        <span className="truncate max-w-[150px]">{p.name}</span>
                      </td>
                      <td className="p-4">{p.brand}</td>
                      <td className="p-4 text-center">{p.size}</td>
                      <td className="p-4 text-center font-bold">
                        <span className={p.stock === 0 ? "text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20 text-[10px]" : "text-[#F0EFE7]"}>
                          {p.stock !== undefined ? p.stock : 1}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-[#F0EFE7]">${p.price}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleEditClick(p)} 
                            className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors interactive"
                            aria-label="Edit product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteProductId(p.id)} 
                            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors interactive"
                            aria-label="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Product Tab Content */}
        {activeSubTab === "addProduct" && (
          <div className="flex flex-col items-center justify-center gap-6 py-6 w-full">
            <div className="w-full max-w-2xl bg-[#121212] border border-[#B8A98F]/25 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              {/* Decorative top strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B8A98F] via-[#F0EFE7] to-[#8B7355]" />

              <form onSubmit={handleProductSubmit} className="flex flex-col gap-5 text-left mt-2">
                <div className="border-b border-[#F0EFE7]/10 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-gothic text-lg uppercase tracking-wider font-extrabold text-[#F0EFE7]">
                      {editingProduct ? "Modify Piece" : "Secure New Drop"}
                    </h3>
                    <p className="text-[8px] uppercase tracking-widest text-[#B8A98F] mt-0.5">VAULT OPERATIONS PROTOCOL</p>
                  </div>
                  <button type="button" onClick={() => setActiveSubTab("products")} className="text-[10px] tracking-widest font-bold uppercase text-[#F0EFE7]/40 hover:text-red-400 border border-[#F0EFE7]/10 hover:border-red-500/20 px-3 py-1 rounded-lg transition-colors interactive">
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Product Name</label>
                    <input 
                      type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="VINTAGE GRAIL TEE"
                      className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Brand / Label</label>
                    <input 
                      type="text" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} placeholder="STUSSY ARCHIVE"
                      className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7] transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Product Description</label>
                  <textarea 
                    required rows={2} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="ENTER DETAILED PRODUCT DESCRIPTION AND MEASUREMENTS..."
                    className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7] resize-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Price ($)</label>
                    <input 
                      type="number" required value={formPrice || ""} onChange={(e) => setFormPrice(Number(e.target.value))} placeholder="120"
                      className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl p-3 text-xs tracking-wider outline-none focus:border-[#B8A98F] text-[#F0EFE7] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Condition Grade</label>
                    <input 
                      type="text" required value={formCondition} onChange={(e) => setFormCondition(e.target.value)} placeholder="9/10 (EXCELLENT)"
                      className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7] transition-colors"
                    />
                  </div>
                </div>

                {/* Upgraded Sizes Portfolio Manager (Full-Width Segment) */}
                <div className="flex flex-col gap-3 border-t border-b border-[#F0EFE7]/5 py-4 my-1">
                  <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">
                    Sizes Portfolio (Selected sizes drop)
                  </label>

                  {/* Active Selected Size Badges */}
                  <div className="flex flex-wrap gap-2 mb-1">
                    {formSizes.length > 0 ? (
                      formSizes.map((sz) => (
                        <span 
                          key={sz} 
                          className="inline-flex items-center gap-1.5 bg-[#B8A98F]/10 text-[#F0EFE7] border border-[#B8A98F]/30 rounded-xl px-3 py-1.5 text-[10px] font-bold tracking-wider"
                        >
                          {sz}
                          <button
                            type="button"
                            onClick={() => {
                              setFormSizes(prev => prev.length > 1 ? prev.filter(s => s !== sz) : prev);
                            }}
                            className="text-red-400 hover:text-red-300 font-bold ml-0.5 hover:scale-125 transition-all text-xs cursor-pointer"
                            title="Remove size"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-red-400 uppercase tracking-widest font-semibold">
                        Warning: At least one size is required.
                      </span>
                    )}
                  </div>

                  {/* Letter Sizes Quick Pool */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[7px] text-[#F0EFE7]/30 uppercase tracking-widest font-bold pl-0.5">
                      Quick select letters
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["XS", "S", "M", "L", "XL", "XXL"].map((sz) => {
                        const isSelected = formSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              setFormSizes(prev => 
                                prev.includes(sz)
                                  ? (prev.length > 1 ? prev.filter(s => s !== sz) : prev)
                                  : [...prev, sz]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all flex items-center justify-center interactive min-w-[36px] h-8
                              ${isSelected 
                                ? "border-[#B8A98F] bg-[#B8A98F]/15 text-[#F0EFE7]" 
                                : "border-[#F0EFE7]/10 bg-transparent text-[#F0EFE7]/60 hover:border-[#B8A98F] hover:text-[#B8A98F]"
                              }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Waist Sizes Quick Pool */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[7px] text-[#F0EFE7]/30 uppercase tracking-widest font-bold pl-0.5">
                      Quick select waist (Pants/Jeans)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["28", "29", "30", "31", "32", "33", "34", "36", "38"].map((sz) => {
                        const isSelected = formSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              setFormSizes(prev => 
                                prev.includes(sz)
                                  ? (prev.length > 1 ? prev.filter(s => s !== sz) : prev)
                                  : [...prev, sz]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all flex items-center justify-center interactive min-w-[36px] h-8
                              ${isSelected 
                                ? "border-[#B8A98F] bg-[#B8A98F]/15 text-[#F0EFE7]" 
                                : "border-[#F0EFE7]/10 bg-transparent text-[#F0EFE7]/60 hover:border-[#B8A98F] hover:text-[#B8A98F]"
                              }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Size Addition */}
                  <div className="flex flex-col gap-1.5 max-w-xs mt-1.5">
                    <span className="text-[7px] text-[#F0EFE7]/30 uppercase tracking-widest font-bold pl-0.5">
                      Add custom shoe / text size
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="E.G. EU 42, US 10, ONE SIZE"
                        value={customSizeInput}
                        onChange={(e) => setCustomSizeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomSize();
                          }
                        }}
                        className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl px-3 py-2 text-[10px] tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7] transition-colors flex-1"
                      />
                      <button
                        type="button"
                        onClick={addCustomSize}
                        className="px-4 py-2 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors interactive cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Category Segment</label>
                    <select 
                      value={formCategory} 
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setFormCategory(newCat);
                        if (newCat === "men") setFormGender("Men");
                        else if (newCat === "women") setFormGender("Women");
                        
                        const subCats = (subcategories || []).filter(s => s.categoryId === newCat);
                        if (subCats.length > 0) {
                          setFormSubCategory(subCats[0].id);
                        } else {
                          setFormSubCategory("");
                        }
                      }}
                      className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7] transition-colors cursor-pointer"
                    >
                      {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Subcategory type</label>
                    <select 
                      value={formSubCategory} onChange={(e) => setFormSubCategory(e.target.value)}
                      className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7] transition-colors cursor-pointer"
                    >
                      {(subcategories || []).filter(s => s.categoryId === formCategory).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Stock Count</label>
                    <input 
                      type="number" required min="0" value={formStock} onChange={(e) => setFormStock(Number(e.target.value))} placeholder="1"
                      className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl p-3 text-xs tracking-wider outline-none focus:border-[#B8A98F] text-[#F0EFE7] transition-colors"
                    />
                  </div>
                </div>

                {/* Upload Image Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Upload Product Images (Real Files)</label>
                  <div className="relative border border-[#F0EFE7]/10 border-dashed rounded-xl p-6 flex flex-col items-center justify-center bg-[#0c0c0c] hover:border-[#B8A98F]/50 transition-colors overflow-hidden cursor-pointer min-h-[100px]">
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    />
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-5 h-5 text-[#B8A98F] animate-spin" />
                        <span className="text-[9px] uppercase tracking-widest text-[#B8A98F] font-bold">Uploading files...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Plus className="w-5 h-5 text-[#B8A98F] mb-1" />
                        <span className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/70 font-bold">Choose Multiple Product Files</span>
                        <span className="text-[8px] text-[#F0EFE7]/35 uppercase tracking-wider">Drag and drop or click to browse</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Uploaded Images Grid */}
                {formImageUrls.length > 0 && (
                  <div className="flex flex-col gap-2 border border-[#F0EFE7]/5 p-4 rounded-xl bg-[#0c0c0c]/40 text-left">
                    <span className="text-[8px] uppercase tracking-widest text-[#B8A98F] font-bold pl-1">Product Angles Gallery ({formImageUrls.length})</span>
                    <div className="flex flex-wrap gap-3">
                      {formImageUrls.map((url, idx) => (
                        <div key={url + idx} className="relative w-16 h-20 rounded-lg border border-[#F0EFE7]/10 overflow-hidden group">
                          <Image src={url} alt={`product-angle-${idx}`} fill sizes="64px" className="object-cover" unoptimized />
                          <button
                            type="button"
                            onClick={() => {
                              setFormImageUrls(prev => prev.filter((_, i) => i !== idx));
                              showToast("Angle removed", "info");
                            }}
                            className="absolute inset-0 bg-red-600/90 text-[#F0EFE7] opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition-opacity interactive cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Image URL Input (Advanced Details) */}
                <details className="text-left text-[9px] uppercase tracking-widest font-bold text-[#F0EFE7]/40 border-t border-[#F0EFE7]/5 pt-2">
                  <summary className="cursor-pointer hover:text-[#B8A98F] transition-colors outline-none mb-2 select-none">Advanced: Add Manual Image URL</summary>
                  <div className="flex gap-2 pt-1">
                    <input 
                      type="text" value={formImageText} onChange={(e) => setFormImageText(e.target.value)} placeholder="https://images.unsplash.com/..."
                      className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl p-3 text-xs font-normal tracking-wider outline-none focus:border-[#B8A98F] text-[#F0EFE7] flex-grow transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formImageText.trim()) {
                          setFormImageUrls(prev => [...prev, formImageText.trim()]);
                          setFormImageText("");
                          showToast("Manual URL added", "success");
                        }
                      }}
                      className="px-4 bg-[#B8A98F] text-[#0c0c0c] hover:bg-[#F0EFE7] text-xs font-bold uppercase rounded-xl transition-colors interactive font-sans"
                    >
                      Add URL
                    </button>
                  </div>
                </details>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formCategory === "rare-finds" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Gender Segment</label>
                      <select 
                        value={formGender} onChange={(e) => setFormGender(e.target.value as any)}
                        className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl p-3 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7] transition-colors cursor-pointer"
                      >
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Unisex">Unisex</option>
                      </select>
                    </div>
                  )}
                  <div className={`flex items-center gap-2.5 ${formCategory !== "rare-finds" ? "col-span-2 py-2" : "mt-6 pl-1"}`}>
                    <input 
                      type="checkbox" id="featured" checked={formFeatured} onChange={(e) => setFormFeatured(e.target.checked)}
                      className="w-4 h-4 bg-[#0c0c0c] rounded border-[#F0EFE7]/10 text-[#B8A98F] accent-[#B8A98F]"
                    />
                    <label htmlFor="featured" className="text-[9px] uppercase tracking-widest text-[#F0EFE7] font-bold cursor-pointer select-none">Feature on Spotlight Showcase</label>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-widest rounded-xl transition-colors mt-4 flex items-center justify-center gap-2 interactive font-sans"
                >
                  {editingProduct ? "Modify Piece In Catalog" : "Deploy Piece to Showcase"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Coupons Tab Content */}
        {activeSubTab === "coupons" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
            {/* Creator Form */}
            <div className="lg:col-span-1 p-6 rounded-2xl bg-[#121212] border border-[#B8A98F]/20 flex flex-col gap-6">
              <div className="border-b border-[#F0EFE7]/10 pb-4">
                <h3 className="font-gothic text-xs uppercase tracking-wider font-bold text-[#B8A98F]">Create Coupon Code</h3>
                <span className="text-[9px] text-[#F0EFE7]/40 mt-0.5">Generate active promotional discount vouchers</span>
              </div>

              <form onSubmit={handleCouponSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Coupon Code</label>
                  <input 
                    type="text" required value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="WINTER20"
                    className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Discount (%)</label>
                    <input 
                      type="number" required min="1" max="100" value={couponDiscount} onChange={(e) => setCouponDiscount(Number(e.target.value))} placeholder="20"
                      className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Expiry (Days)</label>
                    <input 
                      type="number" required min="1" value={couponExpiryDays} onChange={(e) => setCouponExpiryDays(Number(e.target.value))} placeholder="7"
                      className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                    />
                  </div>
                </div>

                <button 
                  type="submit" disabled={creatingCoupon}
                  className="w-full py-3 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-widest rounded-lg transition-colors mt-2 flex items-center justify-center gap-2 interactive disabled:opacity-50"
                >
                  {creatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Deploy Promo Code"}
                </button>
              </form>
            </div>

            {/* Coupons List */}
            <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-[#F0EFE7]/5 bg-[#121212]">
              <table className="w-full text-left text-xs uppercase tracking-wider text-[#F0EFE7]/80">
                <thead className="bg-[#0c0c0c] text-[#B8A98F] border-b border-[#F0EFE7]/5">
                  <tr>
                    <th className="p-4">Promo Code</th>
                    <th className="p-4 text-center">Discount</th>
                    <th className="p-4 text-center">Expiry Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFE7]/5">
                  {coupons && coupons.length > 0 ? (
                    coupons.map((coupon) => {
                      const isExpired = new Date(coupon.expiresAt).getTime() < Date.now();
                      return (
                        <tr key={coupon.id} className="hover:bg-[#F0EFE7]/5 transition-colors">
                          <td className="p-4 font-bold text-[#F0EFE7]">{coupon.code}</td>
                          <td className="p-4 text-center font-bold text-[#B8A98F]">{coupon.discountPercent}% OFF</td>
                          <td className="p-4 text-center text-[#F0EFE7]/60 text-[10px]">
                            {new Date(coupon.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-center">
                            {isExpired ? (
                              <span className="text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded text-red-400 bg-red-400/10 border border-red-400/20">
                                Expired
                              </span>
                            ) : coupon.isActive ? (
                              <span className="text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded text-green-400 bg-green-400/10 border border-green-400/20">
                                Active
                              </span>
                            ) : (
                              <span className="text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded text-yellow-400 bg-yellow-400/10 border border-yellow-400/20">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => toggleCouponActive(coupon.id, !coupon.isActive)}
                              disabled={isExpired}
                              className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded border transition-colors interactive disabled:opacity-30 disabled:cursor-not-allowed ${
                                coupon.isActive 
                                  ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20" 
                                  : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                              }`}
                            >
                              {coupon.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs uppercase tracking-widest text-[#F0EFE7]/30">
                        No coupons found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories Tab Content */}
        {activeSubTab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start text-left">
            {/* Left Panel: Category Configuration Forms */}
            <div className="flex flex-col gap-6">
              
              {/* Category creation */}
              <div className="p-6 rounded-2xl bg-[#121212] border border-[#B8A98F]/20 flex flex-col gap-5">
                <div className="border-b border-[#F0EFE7]/10 pb-3">
                  <h3 className="font-gothic text-xs uppercase tracking-wider font-bold text-[#B8A98F]">Create Category</h3>
                  <span className="text-[9px] text-[#F0EFE7]/40 mt-0.5">Define a parent collection path</span>
                </div>
                
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newCategoryName.trim()) return;
                    setCreatingCategory(true);
                    await createCategory(newCategoryName.trim());
                    setCreatingCategory(false);
                    setNewCategoryName("");
                  }} 
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Category Name</label>
                    <input 
                      type="text" required value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="ACCESSORIES"
                      className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                    />
                  </div>
                  <button 
                    type="submit" disabled={creatingCategory}
                    className="py-2.5 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2 interactive disabled:opacity-50"
                  >
                    {creatingCategory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Deploy Category"}
                  </button>
                </form>
              </div>

              {/* Subcategory creation */}
              <div className="p-6 rounded-2xl bg-[#121212] border border-[#B8A98F]/20 flex flex-col gap-5">
                <div className="border-b border-[#F0EFE7]/10 pb-3">
                  <h3 className="font-gothic text-xs uppercase tracking-wider font-bold text-[#B8A98F]">Create Subcategory</h3>
                  <span className="text-[9px] text-[#F0EFE7]/40 mt-0.5">Nest sub-folders within parent pathways</span>
                </div>

                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newSubcategoryName.trim() || !selectedParentCategoryId) return;
                    setCreatingSubcategory(true);
                    await createSubcategory(newSubcategoryName.trim(), selectedParentCategoryId);
                    setCreatingSubcategory(false);
                    setNewSubcategoryName("");
                  }} 
                  className="flex flex-col gap-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Parent Category</label>
                      <select 
                        value={selectedParentCategoryId} 
                        onChange={(e) => setSelectedParentCategoryId(e.target.value)}
                        className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                      >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Subcategory Name</label>
                      <input 
                        type="text" required value={newSubcategoryName} onChange={(e) => setNewSubcategoryName(e.target.value)} placeholder="BELTS"
                        className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" disabled={creatingSubcategory}
                    className="py-2.5 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2 interactive disabled:opacity-50"
                  >
                    {creatingSubcategory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Deploy Subcategory"}
                  </button>
                </form>
              </div>

            </div>

            {/* Right Panel: Category Breakdowns & Lists */}
            <div className="flex flex-col gap-6">
              
              <div className="p-6 rounded-2xl bg-[#121212] border border-[#F0EFE7]/5 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-[#F0EFE7]/10 pb-3">
                  <h3 className="font-gothic text-xs uppercase tracking-wider font-bold text-[#B8A98F]">Active Categories ({categories.length})</h3>
                  <span className="text-[8px] text-[#F0EFE7]/40 uppercase font-bold">Parent collections list</span>
                </div>

                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {categories.map(cat => {
                    const count = products.filter(p => p.categoryId === cat.id).length;
                    const catSubs = subcategories.filter(s => s.categoryId === cat.id);
                    return (
                      <div key={cat.id} className="p-4 rounded-xl bg-[#0c0c0c]/40 border border-[#F0EFE7]/5 hover:border-[#B8A98F]/20 transition-all flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-[#F0EFE7] uppercase">{cat.name}</span>
                            <span className="text-[8px] text-[#F0EFE7]/40 uppercase mt-0.5">SLUG: {cat.slug} // VOLUME: {count} PCS</span>
                          </div>
                          
                          <button
                            onClick={() => deleteCategory(cat.id)}
                            className="p-1 text-[#F0EFE7]/40 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors interactive cursor-pointer"
                            title="Delete category and subcategories"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Nest list of subcategories */}
                        {catSubs.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 border-t border-[#F0EFE7]/5 pt-2">
                            {catSubs.map(sub => {
                              const subCount = products.filter(p => p.subCategoryId === sub.id).length;
                              return (
                                <div key={sub.id} className="flex items-center gap-1.5 bg-[#121212]/80 border border-[#F0EFE7]/5 px-2 py-0.5 rounded text-[8px] uppercase font-bold text-[#F0EFE7]/70">
                                  <span>{sub.name} ({subCount})</span>
                                  <button
                                    onClick={() => deleteSubcategory(sub.id)}
                                    className="text-red-400/60 hover:text-red-400 font-bold ml-0.5 cursor-pointer"
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[8px] uppercase tracking-widest text-[#F0EFE7]/20 italic pl-1">No nested subcategories deployed</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Orders Tab Content */}
        {activeSubTab === "orders" && (
          <div className="flex flex-col gap-6 text-left">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#B8A98F]">Client Orders Operations</h2>
                <p className="text-[9px] uppercase text-[#F0EFE7]/40 font-semibold tracking-wider mt-0.5">Manage delivery dispatch states & logs</p>
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap gap-2">
                {["ALL", "PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"].map((filt) => (
                  <button
                    key={filt}
                    onClick={() => setOrderStatusFilter(filt)}
                    className={`py-1.5 px-3 text-[9px] font-bold uppercase tracking-wider rounded border transition-colors ${
                      orderStatusFilter === filt 
                        ? "bg-[#B8A98F] text-[#0c0c0c] border-[#B8A98F]" 
                        : "border-[#F0EFE7]/10 text-[#F0EFE7]/60 hover:text-[#B8A98F]"
                    }`}
                  >
                    {filt}
                  </button>
                ))}
              </div>
            </div>

            {/* Split screen layout if order selected */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Orders List Table */}
              <div className={`lg:col-span-2 overflow-x-auto rounded-2xl border border-[#F0EFE7]/5 bg-[#121212] transition-all`}>
                <table className="w-full text-left text-xs uppercase tracking-wider text-[#F0EFE7]/80">
                  <thead className="bg-[#0c0c0c] text-[#B8A98F] border-b border-[#F0EFE7]/5">
                    <tr>
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Total</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EFE7]/5">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((ord) => (
                        <tr 
                          key={ord.id} 
                          onClick={() => setSelectedAdminOrder(ord)}
                          className={`hover:bg-[#F0EFE7]/5 transition-colors cursor-pointer ${
                            selectedAdminOrder?.id === ord.id ? "bg-[#B8A98F]/5 text-[#F0EFE7]" : ""
                          }`}
                        >
                          <td className="p-4 font-bold text-[#F0EFE7] group-hover:text-[#B8A98F] transition-colors">
                            {ord.id}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#F0EFE7]">{ord.customerName}</span>
                              <span className="text-[9px] text-[#F0EFE7]/40 truncate max-w-[120px]">{ord.email}</span>
                            </div>
                          </td>
                          <td className="p-4">{ord.date}</td>
                          <td className="p-4 text-right font-bold text-[#F0EFE7]">${ord.total}</td>
                          <td className="p-4 text-center">
                            <span className={`text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${
                              ord.status === "DELIVERED" ? "text-green-400 bg-green-400/10 border border-green-400/20" :
                              ord.status === "SHIPPED" ? "text-blue-400 bg-blue-400/10 border border-blue-400/20" :
                              ord.status === "CANCELLED" ? "text-red-400 bg-red-400/10 border border-red-400/20" :
                              "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20"
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs uppercase tracking-widest text-[#F0EFE7]/30">
                          No orders matched query filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Order Detail Summary Sheet */}
              <div className="lg:col-span-1">
                <AnimatePresence mode="wait">
                  {selectedAdminOrder ? (
                    <motion.div
                      key={selectedAdminOrder.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="p-6 rounded-2xl bg-[#121212] border border-[#B8A98F]/20 flex flex-col gap-6"
                    >
                      {/* Detail Header */}
                      <div className="border-b border-[#F0EFE7]/10 pb-4 flex justify-between items-center">
                        <div className="flex flex-col">
                          <h3 className="font-gothic text-xs uppercase tracking-wider font-bold text-[#B8A98F]">Order Summary</h3>
                          <span className="text-[9px] text-[#F0EFE7]/40 mt-0.5">{selectedAdminOrder.id}</span>
                        </div>
                        <button 
                          onClick={() => setSelectedAdminOrder(null)} 
                          className="text-[10px] uppercase font-bold text-[#F0EFE7]/40 hover:text-red-400 transition-colors"
                        >
                          Clear Selection
                        </button>
                      </div>

                      {/* Customer info */}
                      <div className="flex flex-col gap-1.5 text-xs">
                        <span className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Buyer Details</span>
                        <div className="p-3.5 rounded-xl bg-[#0c0c0c]/40 border border-[#F0EFE7]/5 flex flex-col gap-1">
                          <span className="font-bold text-[#F0EFE7]">{selectedAdminOrder.customerName}</span>
                          <span className="text-[10px] text-[#F0EFE7]/60">{selectedAdminOrder.email}</span>
                        </div>
                      </div>

                      {/* Courier Consignee Label (Copy-pasteable package tag) */}
                      <div className="flex flex-col gap-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] uppercase tracking-widest text-[#B8A98F] font-bold">Courier Consignee Label</span>
                          {selectedAdminOrder.address && (
                            <button
                              type="button"
                              onClick={() => {
                                const labelText = `CONSIGNEE: ${selectedAdminOrder.customerName}\nCONTACT: ${selectedAdminOrder.email}\nADDRESS: ${selectedAdminOrder.address.street}, ${selectedAdminOrder.address.city}, ${selectedAdminOrder.address.state || "WA"} ${selectedAdminOrder.address.zip}\nCOUNTRY: ${selectedAdminOrder.address.country || "United States"}`;
                                navigator.clipboard.writeText(labelText);
                                showToast("Label copied to clipboard", "success");
                              }}
                              className="text-[9px] uppercase font-bold text-[#B8A98F] hover:text-[#F0EFE7] transition-colors border border-[#B8A98F]/30 hover:border-[#B8A98F] px-2 py-0.5 rounded bg-[#B8A98F]/5 interactive"
                            >
                              Copy Label
                            </button>
                          )}
                        </div>
                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#161616] to-[#0d0d0d] border border-[#B8A98F]/20 text-[10px] text-[#F0EFE7] font-mono select-all flex flex-col gap-1.5 relative overflow-hidden">
                          <div className="absolute right-2 top-2 opacity-5 text-[#B8A98F] font-black text-2xl tracking-widest select-none pointer-events-none">FRAGILE</div>
                          {selectedAdminOrder.address ? (
                            <>
                              <div><span className="text-[#B8A98F] font-bold">CONSIGNEE:</span> {selectedAdminOrder.customerName}</div>
                              <div><span className="text-[#B8A98F] font-bold">CONTACT:</span> {selectedAdminOrder.email}</div>
                              <div><span className="text-[#B8A98F] font-bold">ADDRESS:</span> {selectedAdminOrder.address.street}</div>
                              <div><span className="text-[#B8A98F] font-bold">CITY/ZIP:</span> {selectedAdminOrder.address.city}, {selectedAdminOrder.address.state || "WA"} {selectedAdminOrder.address.zip}</div>
                              <div><span className="text-[#B8A98F] font-bold">COUNTRY:</span> {selectedAdminOrder.address.country || "United States"}</div>
                            </>
                          ) : (
                            <p className="italic text-[#F0EFE7]/30">No shipping destination address set</p>
                          )}
                        </div>
                      </div>

                      {/* Items info */}
                      <div className="flex flex-col gap-1.5 text-xs">
                        <span className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Ordered Pieces</span>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                          {selectedAdminOrder.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c0c0c]/40 border border-[#F0EFE7]/5">
                              <div className="flex items-center gap-2">
                                <div className="relative w-7 h-9 flex-shrink-0 bg-[#1a1a1a] rounded overflow-hidden">
                                  <Image 
                                    src={item.imageUrl || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600"} 
                                    alt={item.name} 
                                    fill
                                    sizes="28px"
                                    className="object-cover" 
                                  />
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className="text-[10px] font-semibold text-[#F0EFE7] truncate max-w-[100px]">{item.name}</span>
                                  <span className="text-[8px] text-[#F0EFE7]/40">Size: {item.size} // Qty: {item.quantity}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-[#F0EFE7]">${item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Coupon and Summary details */}
                      <div className="flex flex-col gap-2 text-[10px] uppercase font-semibold text-[#F0EFE7]/70 bg-[#0c0c0c]/20 p-3.5 rounded-xl border border-[#F0EFE7]/5">
                        {selectedAdminOrder.coupon && (
                          <div className="flex justify-between text-[#B8A98F]">
                            <span>Discount ({selectedAdminOrder.coupon.code}):</span>
                            <span>-{selectedAdminOrder.coupon.discountPercent}%</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-[#F0EFE7]/5 pt-2 text-[#F0EFE7] font-bold">
                          <span>Total Paid:</span>
                          <span>${selectedAdminOrder.total}</span>
                        </div>
                      </div>

                      {/* Status select dropdown */}
                      <div className="flex flex-col gap-1.5 border-t border-[#F0EFE7]/10 pt-4 mt-1">
                        <label className="text-[9px] uppercase tracking-widest text-[#B8A98F] font-bold">Adjust Dispatch shipment status</label>
                        <select 
                          value={selectedAdminOrder.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value as any;
                            const success = await updateOrderStatus(selectedAdminOrder.realId || selectedAdminOrder.id, newStatus);
                            if (success) {
                              setSelectedAdminOrder(prev => ({ ...prev, status: newStatus }));
                            }
                          }}
                          className="w-full bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs font-bold tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7] hover:border-[#B8A98F]/50 transition-colors"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PAID">PAID</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>

                    </motion.div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-[#121212]/30 border border-[#F0EFE7]/5 text-center flex flex-col items-center justify-center py-20">
                      <span className="text-2xl mb-3">📁</span>
                      <h3 className="font-gothic text-xs font-bold uppercase tracking-wider text-[#F0EFE7]">No Selection</h3>
                      <p className="text-[9px] text-[#F0EFE7]/40 max-w-xs mx-auto uppercase leading-relaxed font-light mt-1">
                        Click on any client purchase log row on the left side to review shipping coordinates, ordered clothing pieces, and adjust tracking timeline status.
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        )}

        {/* Settings Tab Content */}
        {activeSubTab === "settings" && (
          <div className="flex flex-col gap-6 max-w-2xl mx-auto text-left">
            <div>
              <span className="text-[10px] tracking-[0.3em] text-[#B8A98F] uppercase font-bold">Store Configurations</span>
              <h2 className="font-gothic text-xl md:text-2xl font-black mt-2 tracking-wide uppercase text-[#F0EFE7]">
                Payment Settings
              </h2>
              <p className="text-[9px] text-[#F0EFE7]/40 mt-1 uppercase font-light tracking-wider">
                Fulfill details of your real UPI scanning QR code and identifiers to display to buyers during checkout.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-[#121212] border border-[#B8A98F]/20 flex flex-col gap-5 relative z-10">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">Merchant Name</label>
                <input 
                  type="text" 
                  required 
                  value={settingsMerchantName} 
                  onChange={(e) => setSettingsMerchantName(e.target.value)} 
                  placeholder="MOONZTHRIFT CO."
                  className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider uppercase outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">UPI ID / Handle</label>
                <input 
                  type="text" 
                  required 
                  value={settingsUpiId} 
                  onChange={(e) => setSettingsUpiId(e.target.value)} 
                  placeholder="MERCHANT@UPI"
                  className="bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-lg p-2.5 text-xs tracking-wider outline-none focus:border-[#B8A98F] text-[#F0EFE7]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest text-[#F0EFE7]/40 font-bold">UPI QR Code Scanner Image</label>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center mt-1">
                  {/* QR Image Box */}
                  <div className="w-32 h-32 bg-[#0c0c0c] border border-[#F0EFE7]/10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    {settingsQrCodeUrl ? (
                      <Image 
                        src={settingsQrCodeUrl} 
                        alt="Store UPI QR Code" 
                        fill 
                        sizes="128px" 
                        className="object-contain p-2" 
                        unoptimized 
                      />
                    ) : (
                      <span className="text-[9px] text-[#F0EFE7]/30 uppercase text-center p-3 font-semibold">No QR Scanner Uploaded</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 w-full">
                    <div className="relative border border-[#F0EFE7]/10 border-dashed rounded-lg p-2.5 flex items-center justify-center bg-[#0c0c0c] hover:border-[#B8A98F]/50 transition-colors h-[40px] overflow-hidden">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleQrUpload}
                        disabled={uploadingQr}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-[10px] uppercase text-[#F0EFE7]/50 px-2 truncate flex items-center gap-2 font-bold">
                        {uploadingQr ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 text-[#B8A98F] animate-spin" />
                            Uploading QR...
                          </>
                        ) : (
                          "Upload New QR Scanner Image"
                        )}
                      </span>
                    </div>

                    {settingsQrCodeUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsQrCodeUrl(null);
                          showToast("QR Scanner image removed", "info");
                        }}
                        className="text-[9px] uppercase tracking-widest text-red-400 hover:text-red-300 font-bold self-start interactive pl-1"
                      >
                        Remove QR Image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-[#F0EFE7] hover:bg-[#B8A98F] text-[#0c0c0c] text-xs font-bold uppercase tracking-widest rounded-lg transition-colors mt-2 interactive"
              >
                Save Payment Settings
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteProductId && (
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
              className="w-full max-w-md bg-[#121212] border border-[#B8A98F]/25 p-8 rounded-3xl relative overflow-hidden text-center flex flex-col items-center gap-6"
            >
              <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#B8A98F]/5 blur-3xl" />
              
              <div className="w-12 h-12 rounded-full border border-red-500/20 bg-red-500/10 flex items-center justify-center text-red-400 text-lg font-bold">
                ⚠️
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-[10px] tracking-[0.3em] text-[#B8A98F] uppercase font-bold">Inventory Lock</span>
                <h3 className="font-gothic text-lg font-black uppercase text-[#F0EFE7] tracking-wider">Remove Grail Drop?</h3>
                <p className="text-[11px] text-[#F0EFE7]/50 uppercase leading-relaxed font-light mt-1">
                  Are you sure you want to remove this piece from inventory drops? This action cascades to delete reviews and order items.
                </p>
              </div>

              <div className="flex gap-4 w-full mt-2 relative z-10">
                <button
                  onClick={() => setDeleteProductId(null)}
                  className="flex-1 py-3 border border-[#F0EFE7]/10 hover:border-[#B8A98F] text-[#F0EFE7] hover:text-[#B8A98F] text-xs font-bold uppercase tracking-widest rounded-lg transition-all interactive"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteProductId) {
                      deleteProduct(deleteProductId);
                      setDeleteProductId(null);
                    }
                  }}
                  className="flex-1 py-3 bg-red-500/80 hover:bg-red-500 text-[#F0EFE7] text-xs font-bold uppercase tracking-widest rounded-lg transition-colors interactive"
                >
                  Remove Piece
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
