"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Product, MOCK_PRODUCTS, MOCK_COUPONS, MOCK_ORDERS, MOCK_ADDRESS, CATEGORIES, SUBCATEGORIES } from "@/lib/mockData";
import { 
  getProductsAction, 
  registerUserAction, 
  loginUserAction, 
  addProductAction, 
  deleteProductAction, 
  updateProductAction,
  getOrdersAction,
  updateOrderStatusAction,
  getUserDetailsAction,
  updateUserProfileAction,
  getCouponsAction,
  createCouponAction,
  toggleCouponActiveAction,
  validateCouponAction,
  getCategoriesAction,
  createCategoryAction,
  deleteCategoryAction,
  createSubcategoryAction,
  deleteSubcategoryAction
} from "@/lib/actions";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
}

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  isFirstOrder?: boolean;
}

interface StoreContextType {
  products: Product[];
  categories: any[];
  subcategories: any[];
  cart: CartItem[];
  wishlist: Product[];
  recentlyViewed: Product[];
  activeUser: UserSession | null;
  activeCoupon: { code: string; discountPercent: number } | null;
  couponError: string | null;
  
  addToCart: (product: Product, quantity: number, size: string) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateCartQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  
  addToRecentlyViewed: (product: Product) => void;
  
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  
  loginMock: (emailOrRole: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  registerMock: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutMock: () => void;
  completeFirstOrder: () => void;

  addProduct: (product: Product) => Promise<void> | void;
  deleteProduct: (productId: string) => Promise<void> | void;
  updateProduct: (product: Product) => Promise<void> | void;
  decrementMockProductSizeStock: (productId: string, size: string, quantity: number) => void;
  
  ordersHistory: any[];
  fetchOrdersHistory: () => Promise<void> | void;
  allOrders: any[];
  fetchAllOrders: () => Promise<void> | void;
  updateOrderStatus: (orderId: string, status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED") => Promise<boolean>;
  defaultAddress: { street: string; city: string; zip: string; country: string } | null;
  updateUserProfile: (name: string, email: string, street: string, city: string, zip: string) => Promise<boolean>;
  coupons: any[];
  fetchCoupons: () => Promise<void>;
  createCoupon: (code: string, discountPercent: number, expiresDays: number) => Promise<boolean>;
  toggleCouponActive: (couponId: string, isActive: boolean) => Promise<boolean>;
  
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  createCategory: (name: string) => Promise<boolean>;
  deleteCategory: (categoryId: string) => Promise<boolean>;
  createSubcategory: (name: string, categoryId: string) => Promise<boolean>;
  deleteSubcategory: (subCategoryId: string) => Promise<boolean>;

  toast: { message: string; type: "success" | "info" | "error" } | null;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  paymentSettings: { upiId: string; merchantName: string; qrCodeUrl: string | null };
  updatePaymentSettings: (settings: { upiId: string; merchantName: string; qrCodeUrl: string | null }) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<any[]>(CATEGORIES);
  const [subcategories, setSubcategories] = useState<any[]>(SUBCATEGORIES);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [activeUser, setActiveUser] = useState<UserSession | null>(null);
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<{ street: string; city: string; zip: string; country: string } | null>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const [paymentSettings, setPaymentSettings] = useState<{ upiId: string; merchantName: string; qrCodeUrl: string | null }>({
    upiId: "admin@moonzthrift",
    merchantName: "MoonzThrift Co.",
    qrCodeUrl: null
  });

  const updatePaymentSettings = (settings: { upiId: string; merchantName: string; qrCodeUrl: string | null }) => {
    setPaymentSettings(settings);
    localStorage.setItem("moonz_payment_settings", JSON.stringify(settings));
    showToast("Payment parameters saved successfully", "success");
  };

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Sync active user state with NextAuth session
  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user) {
      const u = session.user as any;
      setActiveUser({
        id: u.id || "usr-default",
        name: u.name || "Default User",
        email: u.email || "",
        role: u.role || "USER",
        isFirstOrder: u.isFirstOrder ?? false
      });
    } else if (sessionStatus === "unauthenticated") {
      setActiveUser(null);
    }
  }, [session, sessionStatus]);

  const fetchProducts = async () => {
    const res = await getProductsAction();
    let activeProds = MOCK_PRODUCTS;
    if (res.success && res.data) {
      activeProds = res.data;
    }
    const savedProds = localStorage.getItem("moonz_custom_products");
    if (savedProds) {
      try {
        const customProds = JSON.parse(savedProds);
        activeProds = [...customProds, ...activeProds.filter(p => !customProds.some((cp: any) => cp.id === p.id))];
      } catch (err) {
        console.error("Failed to parse custom products from localStorage", err);
      }
    }
    setProducts(activeProds);
  };

  const fetchCategories = async () => {
    const res = await getCategoriesAction();
    if (res.success && res.data) {
      setCategories(res.data);
      const flatSubs: any[] = [];
      res.data.forEach((cat: any) => {
        if (cat.subcategories) {
          flatSubs.push(...cat.subcategories);
        }
      });
      setSubcategories(flatSubs);
    } else {
      const savedCats = localStorage.getItem("moonz_categories");
      const savedSubs = localStorage.getItem("moonz_subcategories");
      if (savedCats) setCategories(JSON.parse(savedCats));
      if (savedSubs) setSubcategories(JSON.parse(savedSubs));
    }
  };

  const createCategory = async (name: string) => {
    const res = await createCategoryAction(name);
    if (res.success && res.data) {
      showToast(`Category ${name} created successfully`, "success");
      await fetchCategories();
      return true;
    } else {
      const newCat = {
        id: `cat-${Date.now()}`,
        name,
        slug: name.toLowerCase().trim().replace(/\s+/g, "-"),
        subcategories: []
      };
      const updated = [...categories, newCat];
      setCategories(updated);
      localStorage.setItem("moonz_categories", JSON.stringify(updated));
      showToast(`[Mock] Category ${name} created`, "success");
      return true;
    }
  };

  const deleteCategory = async (id: string) => {
    const res = await deleteCategoryAction(id);
    if (res.success) {
      showToast("Category removed successfully", "info");
      await fetchCategories();
      return true;
    } else {
      const updatedCats = categories.filter((c) => c.id !== id);
      setCategories(updatedCats);
      localStorage.setItem("moonz_categories", JSON.stringify(updatedCats));
      
      const updatedSubs = subcategories.filter((s) => s.categoryId !== id);
      setSubcategories(updatedSubs);
      localStorage.setItem("moonz_subcategories", JSON.stringify(updatedSubs));

      showToast("[Mock] Category and subcategories removed", "info");
      return true;
    }
  };

  const createSubcategory = async (name: string, categoryId: string) => {
    const res = await createSubcategoryAction(name, categoryId);
    if (res.success && res.data) {
      showToast(`Subcategory ${name} created successfully`, "success");
      await fetchCategories();
      return true;
    } else {
      const newSub = {
        id: `sub-${Date.now()}`,
        name,
        slug: name.toLowerCase().trim().replace(/\s+/g, "-"),
        categoryId
      };
      const updated = [...subcategories, newSub];
      setSubcategories(updated);
      localStorage.setItem("moonz_subcategories", JSON.stringify(updated));
      
      const updatedCats = categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subcategories: [...(cat.subcategories || []), newSub]
          };
        }
        return cat;
      });
      setCategories(updatedCats);
      localStorage.setItem("moonz_categories", JSON.stringify(updatedCats));

      showToast(`[Mock] Subcategory ${name} created`, "success");
      return true;
    }
  };

  const deleteSubcategory = async (id: string) => {
    const res = await deleteSubcategoryAction(id);
    if (res.success) {
      showToast("Subcategory removed successfully", "info");
      await fetchCategories();
      return true;
    } else {
      const updatedSubs = subcategories.filter((s) => s.id !== id);
      setSubcategories(updatedSubs);
      localStorage.setItem("moonz_subcategories", JSON.stringify(updatedSubs));

      const updatedCats = categories.map(cat => {
        return {
          ...cat,
          subcategories: (cat.subcategories || []).filter((s: any) => s.id !== id)
        };
      });
      setCategories(updatedCats);
      localStorage.setItem("moonz_categories", JSON.stringify(updatedCats));

      showToast("[Mock] Subcategory removed", "info");
      return true;
    }
  };

  // Load products and categories from database or fallback on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Load cart, wishlist, and session from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("moonz_cart");
    const savedWishlist = localStorage.getItem("moonz_wishlist");
    const savedUser = localStorage.getItem("moonz_user");
    const savedSettings = localStorage.getItem("moonz_payment_settings");

    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    if (savedSettings) setPaymentSettings(JSON.parse(savedSettings));
    
    // Initialize mock database if not exists
    const savedDb = localStorage.getItem("moonz_registered_users");
    if (!savedDb) {
      const initialUsers = [
        {
          id: "usr-lila",
          name: "Lila Moon",
          email: "lila@moonzthrift.com",
          password: "password123",
          role: "USER",
          isFirstOrder: true
        },
        {
          id: "usr-admin",
          name: "Admin Lord",
          email: "admin@moonzthrift.com",
          password: "admin123",
          role: "ADMIN",
          isFirstOrder: false
        }
      ];
      localStorage.setItem("moonz_registered_users", JSON.stringify(initialUsers));
    }

    const savedOrders = localStorage.getItem("moonz_mock_orders");
    if (!savedOrders) {
      localStorage.setItem("moonz_mock_orders", JSON.stringify(MOCK_ORDERS));
    }

    const savedCats = localStorage.getItem("moonz_categories");
    if (savedCats) {
      setCategories(JSON.parse(savedCats));
    } else {
      localStorage.setItem("moonz_categories", JSON.stringify(CATEGORIES));
    }

    const savedSubs = localStorage.getItem("moonz_subcategories");
    if (savedSubs) {
      setSubcategories(JSON.parse(savedSubs));
    } else {
      localStorage.setItem("moonz_subcategories", JSON.stringify(SUBCATEGORIES));
    }

    if (savedUser) {
      setActiveUser(JSON.parse(savedUser));
    } else {
      // Guest by default, no auto login
      setActiveUser(null);
    }
  }, []);

  // Synchronize activeUser changes with localStorage to prevent hydration redirects
  useEffect(() => {
    if (activeUser) {
      localStorage.setItem("moonz_user", JSON.stringify(activeUser));
    } else {
      localStorage.removeItem("moonz_user");
    }
  }, [activeUser]);

  // Save cart changes to localStorage
  useEffect(() => {
    localStorage.setItem("moonz_cart", JSON.stringify(cart));
  }, [cart]);

  // Save wishlist changes to localStorage
  useEffect(() => {
    localStorage.setItem("moonz_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Load default address when user changes
  useEffect(() => {
    const fetchAddress = async () => {
      console.log("[StoreContext] fetchAddress triggered. activeUser:", activeUser);
      if (!activeUser) {
        console.log("[StoreContext] fetchAddress: activeUser is null, setting defaultAddress to null");
        setDefaultAddress(null);
        return;
      }

      try {
        console.log("[StoreContext] fetchAddress: calling getUserDetailsAction for id:", activeUser.id);
        const res = await getUserDetailsAction(activeUser.id);
        console.log("[StoreContext] fetchAddress: getUserDetailsAction response:", res);
        if (res.success && res.data && res.data.address) {
          const addr = {
            street: res.data.address.street,
            city: res.data.address.city,
            zip: res.data.address.zip,
            country: res.data.address.country || "United States"
          };
          console.log("[StoreContext] fetchAddress: Setting default address from DB:", addr);
          setDefaultAddress(addr);
        } else {
          // Fallback to localStorage / MOCK_ADDRESS
          console.log("[StoreContext] fetchAddress: DB address empty or failed, trying localStorage");
          const savedAddress = localStorage.getItem("moonz_profile_address");
          if (savedAddress) {
            const addr = JSON.parse(savedAddress);
            console.log("[StoreContext] fetchAddress: Setting default address from localStorage:", addr);
            setDefaultAddress(addr);
          } else {
            const addr = {
              street: MOCK_ADDRESS.street,
              city: MOCK_ADDRESS.city,
              zip: MOCK_ADDRESS.zip,
              country: MOCK_ADDRESS.country
            };
            console.log("[StoreContext] fetchAddress: Setting default address from MOCK_ADDRESS fallback:", addr);
            setDefaultAddress(addr);
          }
        }
      } catch (err) {
        console.error("[StoreContext] fetchAddress error:", err);
      }
    };

    fetchAddress();
  }, [activeUser]);

  // Load coupons when admin logs in
  const fetchCoupons = async () => {
    const res = await getCouponsAction();
    if (res.success && res.data) {
      setCoupons(res.data);
    }
  };

  useEffect(() => {
    if (activeUser?.role === "ADMIN") {
      fetchCoupons();
    }
  }, [activeUser]);

  // Cart operations
  const addToCart = (product: Product, quantity: number, size: string) => {
    setCartDrawerOpen(true);
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === size
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, quantity, selectedSize: size }];
      }
    });
  };

  const removeFromCart = (productId: string, size: string) => {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.selectedSize === size)));
  };

  const updateCartQuantity = (productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart((prev) => {
      return prev.map((item) =>
        item.product.id === productId && item.selectedSize === size
          ? { ...item, quantity }
          : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
    setActiveCoupon(null);
  };

  // Wishlist operations
  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  // Recently viewed
  const addToRecentlyViewed = (product: Product) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((item) => item.id !== product.id);
      return [product, ...filtered].slice(0, 4); // Keep last 4 items
    });
  };

  // Coupon code validation
  // Coupon code validation
  const applyCoupon = async (code: string) => {
    const uppercaseCode = code.toUpperCase();
    const res = await validateCouponAction(uppercaseCode);
    
    if (res.success && res.data) {
      setActiveCoupon({ code: res.data.code, discountPercent: res.data.discountPercent });
      setCouponError(null);
      showToast(`Promo code ${res.data.code} applied (-${res.data.discountPercent}%)`, "success");
      return true;
    } else {
      setCouponError(res.error || "Invalid or expired promo code");
      return false;
    }
  };

  const removeCoupon = () => {
    setActiveCoupon(null);
    setCouponError(null);
  };

  const createCoupon = async (code: string, discountPercent: number, expiresDays: number) => {
    const res = await createCouponAction(code, discountPercent, expiresDays);
    if (res.success) {
      showToast(`Promo code ${code} created successfully`, "success");
      await fetchCoupons();
      return true;
    } else {
      showToast(res.error || "Failed to create promo code", "error");
      return false;
    }
  };

  const toggleCouponActive = async (couponId: string, isActive: boolean) => {
    const res = await toggleCouponActiveAction(couponId, isActive);
    if (res.success) {
      showToast(`Coupon status updated`, "success");
      await fetchCoupons();
      return true;
    } else {
      showToast(res.error || "Failed to update coupon status", "error");
      return false;
    }
  };

  // NextAuth Credentials login trigger
  const loginMock = async (emailOrRole: string, password?: string) => {
    if (!password) {
      const role = emailOrRole as "USER" | "ADMIN";
      const email = role === "ADMIN" ? "admin@moonzthrift.com" : "lila@moonzthrift.com";
      const pw = role === "ADMIN" ? "admin123" : "password123";
      
      const res = await signIn("credentials", {
        email,
        password: pw,
        redirect: false
      });
      
      if (res?.error) {
        return { success: false, error: "Bypass authentication failed: " + res.error };
      }
      
      const user: UserSession = {
        id: role === "ADMIN" ? "usr-admin" : "usr-lila",
        name: role === "ADMIN" ? "Admin Lord" : "Lila Moon",
        email,
        role,
        isFirstOrder: role === "ADMIN" ? false : true
      };
      setActiveUser(user);
      localStorage.setItem("moonz_user", JSON.stringify(user));
      return { success: true };
    }

    const res = await signIn("credentials", {
      email: emailOrRole,
      password,
      redirect: false
    });

    if (res?.error) {
      return { success: false, error: "Authentication failed. Check your security credentials." };
    }

    return { success: true };
  };

  // User registration server-side sync & NextAuth triggers
  const registerMock = async (name: string, email: string, password: string) => {
    const dbRes = await registerUserAction(name, email, password);
    
    if (!dbRes.fallback && !dbRes.success) {
      return { success: false, error: dbRes.error };
    }

    if (dbRes.fallback) {
      const savedDb = localStorage.getItem("moonz_registered_users");
      const users = savedDb ? JSON.parse(savedDb) : [];
      
      const exists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return { success: false, error: "Email address already registered" };
      }

      const newUser = {
        id: `usr-${Date.now()}`,
        name,
        email,
        password,
        role: "USER" as const,
        isFirstOrder: true
      };

      users.push(newUser);
      localStorage.setItem("moonz_registered_users", JSON.stringify(users));
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    if (res?.error) {
      return { success: false, error: "Profile created, but session validation failed. Please sign in manually." };
    }

    applyCoupon("WELCOME15");
    return { success: true };
  };

  const logoutMock = () => {
    signOut({ redirect: false });
    setActiveUser(null);
    localStorage.removeItem("moonz_user");
    removeCoupon();
  };

  // Mark first order completed
  const completeFirstOrder = () => {
    if (!activeUser) return;

    const updatedUser = { ...activeUser, isFirstOrder: false };
    setActiveUser(updatedUser);
    localStorage.setItem("moonz_user", JSON.stringify(updatedUser));

    const savedDb = localStorage.getItem("moonz_registered_users");
    if (savedDb) {
      const users = JSON.parse(savedDb);
      const index = users.findIndex((u: any) => u.id === activeUser.id);
      if (index > -1) {
        users[index].isFirstOrder = false;
        localStorage.setItem("moonz_registered_users", JSON.stringify(users));
      }
    }
  };

  const fetchOrdersHistory = async () => {
    if (!activeUser) {
      setOrdersHistory([]);
      return;
    }
    const res = await getOrdersAction(activeUser.id);
    if (res.success && res.data) {
      setOrdersHistory(res.data);
    } else {
      const savedOrders = localStorage.getItem("moonz_mock_orders");
      const currentOrders = savedOrders ? JSON.parse(savedOrders) : MOCK_ORDERS;
      const filtered = currentOrders.filter((o: any) => o.userId === activeUser.id || o.email === activeUser.email);
      setOrdersHistory(filtered);
    }
  };

  const fetchAllOrders = async () => {
    const res = await getOrdersAction();
    if (res.success && res.data) {
      setAllOrders(res.data);
    } else {
      const savedOrders = localStorage.getItem("moonz_mock_orders");
      if (savedOrders) {
        setAllOrders(JSON.parse(savedOrders));
      } else {
        localStorage.setItem("moonz_mock_orders", JSON.stringify(MOCK_ORDERS));
        setAllOrders(MOCK_ORDERS);
      }
    }
  };

  const updateOrderStatus = async (orderId: string, status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED") => {
    const res = await updateOrderStatusAction(orderId, status);
    if (res.success) {
      showToast(`Order status updated to ${status}`, "success");
      await fetchAllOrders();
      await fetchOrdersHistory();
      return true;
    } else {
      const savedOrders = localStorage.getItem("moonz_mock_orders");
      const currentOrders = savedOrders ? JSON.parse(savedOrders) : MOCK_ORDERS;
      const index = currentOrders.findIndex((o: any) => o.id === orderId || o.realId === orderId);
      if (index > -1) {
        currentOrders[index].status = status;
        localStorage.setItem("moonz_mock_orders", JSON.stringify(currentOrders));
        setAllOrders(currentOrders);
        if (activeUser) {
          const userOrders = currentOrders.filter((o: any) => o.userId === activeUser.id || o.email === activeUser.email);
          setOrdersHistory(userOrders);
        }
        showToast(`[Mock] Order status updated to ${status}`, "success");
        return true;
      }
    }
    showToast("Failed to update order status", "error");
    return false;
  };

  const updateUserProfile = async (name: string, email: string, street: string, city: string, zip: string) => {
    if (!activeUser) return false;

    const res = await updateUserProfileAction(activeUser.id, name, email, street, city, zip);
    if (res.success) {
      // Update active user state
      const updatedUser = { ...activeUser, name, email };
      setActiveUser(updatedUser);
      localStorage.setItem("moonz_user", JSON.stringify(updatedUser));

      // Update default address state
      const newAddress = { street, city, zip, country: "United States" };
      setDefaultAddress(newAddress);
      localStorage.setItem("moonz_profile_address", JSON.stringify(newAddress));

      showToast("Account profile coordinates updated", "success");
      return true;
    } else {
      // Fallback local persistence
      const updatedUser = { ...activeUser, name, email };
      setActiveUser(updatedUser);
      localStorage.setItem("moonz_user", JSON.stringify(updatedUser));

      const newAddress = { street, city, zip, country: "United States" };
      setDefaultAddress(newAddress);
      localStorage.setItem("moonz_profile_address", JSON.stringify(newAddress));

      showToast("[Mock] Profile coordinates saved locally", "success");
      return true;
    }
  };

  useEffect(() => {
    fetchOrdersHistory();
  }, [activeUser]);

  // Admin CRUD server actions mapping
  const addProduct = async (product: Product) => {
    const res = await addProductAction(product);
    if (res.success) {
      showToast("Grail added to vault successfully", "success");
      const prodRes = await getProductsAction();
      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data);
        return;
      }
    } else {
      // Local mock persistence for custom products
      try {
        const savedProdsStr = localStorage.getItem("moonz_custom_products");
        const savedProds = savedProdsStr ? JSON.parse(savedProdsStr) : [];
        const updatedProds = [product, ...savedProds.filter((p: any) => p.id !== product.id)];
        localStorage.setItem("moonz_custom_products", JSON.stringify(updatedProds));
        showToast("[Mock] Grail added to vault", "success");
      } catch (err) {
        console.error("LocalStorage save failed for addProduct", err);
      }
    }
    setProducts((prev) => [product, ...prev.filter(p => p.id !== product.id)]);
  };

  const deleteProduct = async (productId: string) => {
    const res = await deleteProductAction(productId);
    if (res.success) {
      showToast("Grail removed from vault", "info");
    } else {
      try {
        const savedProdsStr = localStorage.getItem("moonz_custom_products");
        if (savedProdsStr) {
          const savedProds = JSON.parse(savedProdsStr);
          const updatedProds = savedProds.filter((p: any) => p.id !== productId);
          localStorage.setItem("moonz_custom_products", JSON.stringify(updatedProds));
        }
        showToast("[Mock] Grail removed from vault", "info");
      } catch (err) {
        console.error("LocalStorage delete failed for deleteProduct", err);
      }
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const updateProduct = async (product: Product) => {
    const res = await updateProductAction(product);
    if (res.success) {
      showToast("Grail details updated successfully", "success");
      const prodRes = await getProductsAction();
      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data);
        return;
      }
    } else {
      try {
        const savedProdsStr = localStorage.getItem("moonz_custom_products");
        if (savedProdsStr) {
          const savedProds = JSON.parse(savedProdsStr);
          const updatedProds = savedProds.map((p: any) => p.id === product.id ? product : p);
          localStorage.setItem("moonz_custom_products", JSON.stringify(updatedProds));
        }
        showToast("[Mock] Grail details updated", "success");
      } catch (err) {
        console.error("LocalStorage save failed for updateProduct", err);
      }
    }
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
  };

  const decrementMockProductSizeStock = (productId: string, size: string, quantity: number) => {
    try {
      const savedProdsStr = localStorage.getItem("moonz_custom_products");
      let customProds = savedProdsStr ? JSON.parse(savedProdsStr) : [];
      
      let productIndex = customProds.findIndex((p: any) => p.id === productId);
      let targetProduct;
      if (productIndex === -1) {
        const baseProduct = products.find((p) => p.id === productId) || MOCK_PRODUCTS.find((p) => p.id === productId);
        if (baseProduct) {
          targetProduct = { ...baseProduct };
          customProds.push(targetProduct);
          productIndex = customProds.length - 1;
        }
      } else {
        targetProduct = customProds[productIndex];
      }

      if (targetProduct) {
        let sizes = targetProduct.size ? targetProduct.size.split(",").map((s: any) => s.trim()).filter(Boolean) : [];
        const index = sizes.findIndex((s: string) => s.toLowerCase() === size.trim().toLowerCase());
        if (index > -1) {
          sizes.splice(index, 1);
        }
        const newSizeStr = sizes.join(", ");
        targetProduct.size = newSizeStr;
        targetProduct.stock = sizes.length === 0 ? 0 : Math.max(0, targetProduct.stock - quantity);
        
        localStorage.setItem("moonz_custom_products", JSON.stringify(customProds));
      }
      
      // Update local state reactively
      setProducts((prev) => {
        return prev.map((p) => {
          if (p.id === productId) {
            let sizes = p.size ? p.size.split(",").map((s: any) => s.trim()).filter(Boolean) : [];
            const idx = sizes.findIndex((s: string) => s.toLowerCase() === size.trim().toLowerCase());
            if (idx > -1) sizes.splice(idx, 1);
            return {
              ...p,
              size: sizes.join(", "),
              stock: sizes.length === 0 ? 0 : Math.max(0, p.stock - quantity)
            };
          }
          return p;
        });
      });
    } catch (err) {
      console.error("Failed to decrement mock product size stock:", err);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        subcategories,
        cart,
        wishlist,
        recentlyViewed,
        activeUser,
        activeCoupon,
        couponError,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        addToRecentlyViewed,
        applyCoupon,
        removeCoupon,
        loginMock,
        registerMock,
        logoutMock,
        completeFirstOrder,
        addProduct,
        deleteProduct,
        updateProduct,
        decrementMockProductSizeStock,
        ordersHistory,
        fetchOrdersHistory,
        allOrders,
        fetchAllOrders,
        updateOrderStatus,
        defaultAddress,
        updateUserProfile,
        coupons,
        fetchCoupons,
        createCoupon,
        toggleCouponActive,
        fetchProducts,
        fetchCategories,
        createCategory,
        deleteCategory,
        createSubcategory,
        deleteSubcategory,
        toast,
        showToast,
        cartDrawerOpen,
        setCartDrawerOpen,
        paymentSettings,
        updatePaymentSettings
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
