"use server";

import db from "@/lib/db";
import { Product, CATEGORIES, SUBCATEGORIES, MOCK_PRODUCTS } from "@/lib/mockData";
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";

// Probe PostgreSQL instance to determine if database URL is configured and active
async function isDbAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    // Quick select check
    await db.$executeRaw`SELECT 1`;
    return true;
  } catch (e) {
    console.warn("PostgreSQL connection failed. Falling back to local/localStorage. Error:", e);
    return false;
  }
}

// Populate blank database instances with default capsules
async function autoSeedDb() {
  try {
    const categoryCount = await db.category.count();
    if (categoryCount === 0) {
      for (const cat of CATEGORIES) {
        await db.category.create({
          data: {
            id: cat.id,
            name: cat.name,
            slug: cat.slug
          }
        });
      }
    }

    const subcategoryCount = await db.subcategory.count();
    if (subcategoryCount === 0) {
      for (const sub of SUBCATEGORIES) {
        await db.subcategory.create({
          data: {
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            categoryId: sub.categoryId
          }
        });
      }
    }

    // Ensure all mock products are updated to their latest values (especially image URLs)
    for (const prod of MOCK_PRODUCTS) {
      await db.product.upsert({
        where: { id: prod.id },
        update: {
          imageUrls: prod.imageUrls,
          name: prod.name,
          description: prod.description,
          price: prod.price,
          brand: prod.brand,
          size: prod.size,
          condition: prod.condition
        },
        create: {
          id: prod.id,
          name: prod.name,
          description: prod.description,
          price: prod.price,
          imageUrls: prod.imageUrls,
          categoryId: prod.categoryId,
          subCategoryId: prod.subCategoryId || null,
          stock: prod.stock,
          size: prod.size,
          condition: prod.condition,
          brand: prod.brand,
          isFeatured: prod.isFeatured,
          isTrending: prod.isTrending,
          gender: prod.gender,
          createdAt: new Date(prod.createdAt)
        }
      });
    }
    // Ensure default users exist
    const adminUser = await db.user.findUnique({
      where: { email: "admin@moonzthrift.com" }
    });
    if (!adminUser) {
      await db.user.create({
        data: {
          id: "usr-admin",
          name: "Admin Lord",
          email: "admin@moonzthrift.com",
          password: "admin123",
          role: "ADMIN"
        }
      });
      console.log("[autoSeedDb] Seeded default admin user in DB.");
    }

    const lilaUser = await db.user.findUnique({
      where: { email: "lila@moonzthrift.com" }
    });
    if (!lilaUser) {
      await db.user.create({
        data: {
          id: "usr-lila",
          name: "Lila Moon",
          email: "lila@moonzthrift.com",
          password: "password123",
          role: "USER"
        }
      });
      console.log("[autoSeedDb] Seeded default user lila in DB.");
    }
  } catch (err) {
    console.error("Database auto-seeding error:", err);
  }
}

// 1. Fetch catalog products
export async function getProductsAction() {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true, data: MOCK_PRODUCTS };
  }

  try {
    await autoSeedDb();
    const products = await db.product.findMany({
      include: {
        category: true,
        subcategory: true,
        reviews: {
          include: {
            user: true
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      imageUrls: p.imageUrls,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      subCategoryId: p.subCategoryId || "",
      subCategoryName: p.subcategory?.name || "",
      stock: p.stock,
      size: p.size,
      condition: p.condition,
      brand: p.brand || "",
      isFeatured: p.isFeatured,
      isTrending: p.isTrending,
      gender: p.gender as "Men" | "Women",
      rating: p.reviews.length > 0
        ? Number((p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length).toFixed(1))
        : 5.0,
      reviews: p.reviews.map((r) => ({
        id: r.id,
        userName: r.user?.name || "Grail Hunter",
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString().split("T")[0]
      })),
      createdAt: p.createdAt.toISOString().split("T")[0]
    }));

    return { success: true, data: formattedProducts };
  } catch (e: any) {
    console.error("Error in getProductsAction:", e);
    return { success: false, fallback: true, data: MOCK_PRODUCTS, error: e.message };
  }
}

// 2. Add product
export async function addProductAction(product: any) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }

  try {
    // Check if category exists
    let category = await db.category.findUnique({
      where: { id: product.categoryId }
    });

    if (!category) {
      const found = await db.category.findFirst({
        where: { name: product.categoryName }
      });
      if (found) {
        product.categoryId = found.id;
      } else {
        const fallbackCat = await db.category.findFirst();
        if (fallbackCat) {
          product.categoryId = fallbackCat.id;
        } else {
          const newCat = await db.category.create({
            data: {
              name: product.categoryName,
              slug: product.categoryName.toLowerCase().replace(/\s+/g, "-")
            }
          });
          product.categoryId = newCat.id;
        }
      }
    }

    const created = await db.product.create({
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrls: product.imageUrls,
        categoryId: product.categoryId,
        subCategoryId: product.subCategoryId || null,
        stock: product.stock,
        size: product.size,
        condition: product.condition,
        brand: product.brand,
        isFeatured: product.isFeatured,
        isTrending: product.isTrending,
        gender: product.gender || "Men",
        createdAt: new Date()
      }
    });

    return { success: true, data: created };
  } catch (e: any) {
    console.error("Error in addProductAction:", e);
    return { success: false, error: e.message };
  }
}

// 3. Update product
export async function updateProductAction(product: any) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }

  try {
    const updated = await db.product.update({
      where: { id: product.id },
      data: {
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrls: product.imageUrls,
        categoryId: product.categoryId,
        subCategoryId: product.subCategoryId || null,
        stock: product.stock,
        size: product.size,
        condition: product.condition,
        brand: product.brand,
        isFeatured: product.isFeatured,
        isTrending: product.isTrending,
        gender: product.gender || "Men"
      }
    });

    return { success: true, data: updated };
  } catch (e: any) {
    console.error("Error in updateProductAction:", e);
    return { success: false, error: e.message };
  }
}

// 4. Delete product
export async function deleteProductAction(productId: string) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }

  try {
    // Delete any dependent records first (reviews, order items, wishlist items)
    await db.review.deleteMany({ where: { productId } });
    await db.wishlistItem.deleteMany({ where: { productId } });
    await db.orderItem.deleteMany({ where: { productId } });

    await db.product.delete({
      where: { id: productId }
    });

    return { success: true };
  } catch (e: any) {
    console.error("Error in deleteProductAction:", e);
    return { success: false, error: e.message };
  }
}

// 5. User registration
export async function registerUserAction(name: string, email: string, password: string) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }

  try {
    await autoSeedDb();
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      return { success: false, error: "Email address already registered" };
    }

    const created = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password, // stored plain for mock session alignment
        role: "USER"
      }
    });

    return {
      success: true,
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
        isFirstOrder: true
      }
    };
  } catch (e: any) {
    console.error("Error in registerUserAction:", e);
    return { success: false, error: e.message };
  }
}

// 6. User login
export async function loginUserAction(email: string, password: string) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }

  try {
    await autoSeedDb();
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || user.password !== password) {
      return { success: false, error: "Invalid email address or security password" };
    }

    const orderCount = await db.order.count({
      where: { userId: user.id }
    });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstOrder: orderCount === 0 && user.role !== "ADMIN"
      }
    };
  } catch (e: any) {
    console.error("Error in loginUserAction:", e);
    return { success: false, error: e.message };
  }
}

// 7. Write review
export async function submitReviewAction(productId: string, userId: string, rating: number, comment: string) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }

  try {
    const created = await db.review.create({
      data: {
        productId,
        userId,
        rating,
        comment
      }
    });

    return { success: true, data: created };
  } catch (e: any) {
    console.error("Error in submitReviewAction:", e);
    return { success: false, error: e.message };
  }
}

// 8. Place order
export async function createOrderAction(orderData: any) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }

  try {
    // Duplication protection check
    if (orderData.paymentIntentId) {
      const existingOrder = await db.order.findFirst({
        where: { paymentIntentId: orderData.paymentIntentId }
      });
      if (existingOrder) {
        console.log(`[createOrderAction] Order already exists for paymentIntentId: ${orderData.paymentIntentId}`);
        return { success: true, orderId: existingOrder.id };
      }
    }

    // Generate Address record
    const createdAddress = await db.address.create({
      data: {
        userId: orderData.userId,
        street: orderData.street,
        city: orderData.city,
        state: orderData.state || "WA",
        zip: orderData.zip,
        country: orderData.country || "United States"
      }
    });

    // Check Coupon reference
    let couponId = null;
    if (orderData.couponCode) {
      const dbCoupon = await db.coupon.findUnique({
        where: { code: orderData.couponCode.toUpperCase() }
      });
      if (dbCoupon) {
        couponId = dbCoupon.id;
      } else {
        const createdCoupon = await db.coupon.create({
          data: {
            code: orderData.couponCode.toUpperCase(),
            discountPercent: orderData.couponDiscountPercent || 15,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        couponId = createdCoupon.id;
      }
    }

    const createdOrder = await db.order.create({
      data: {
        userId: orderData.userId,
        total: orderData.total,
        status: orderData.status || "PAID",
        addressId: createdAddress.id,
        couponId: couponId,
        paymentIntentId: orderData.paymentIntentId || null,
        items: {
          create: orderData.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            size: item.size
          }))
        }
      }
    });

    // Decrement stock counts and remove purchased size token reactively
    for (const item of orderData.items) {
      try {
        const product = await db.product.findUnique({
          where: { id: item.productId }
        });
        if (product) {
          // Split sizes, remove matching size, join back
          let sizes = product.size ? product.size.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
          const idx = sizes.findIndex(s => s.toLowerCase() === item.size.trim().toLowerCase());
          if (idx > -1) {
            sizes.splice(idx, 1);
          }
          const newSizeStr = sizes.join(", ");
          const newStock = sizes.length === 0 ? 0 : Math.max(0, product.stock - item.quantity);
          
          await db.product.update({
            where: { id: item.productId },
            data: {
              size: newSizeStr,
              stock: newStock
            }
          });
          console.log(`[createOrderAction] Updated product ${item.productId}. sizes: "${newSizeStr}", stock: ${newStock}`);
        }
      } catch (err) {
        console.error(`Failed to update stock and sizes for product ${item.productId}:`, err);
      }
    }

    return { success: true, orderId: createdOrder.id };
  } catch (e: any) {
    console.error("Error in createOrderAction:", e);
    return { success: false, error: e.message };
  }
}

// 9. Load user orders list
export async function getOrdersAction(userId?: string) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }

  try {
    const filter = userId ? { where: { userId } } : {};
    const orders = await db.order.findMany({
      ...filter,
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        },
        address: true,
        coupon: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const formattedOrders = orders.map((o) => ({
      id: `ord-${o.id.substring(0, 5)}`,
      realId: o.id,
      userId: o.userId,
      customerName: o.user?.name || "Client Guest",
      email: o.user?.email || "",
      date: o.createdAt.toISOString().split("T")[0],
      total: o.total,
      status: o.status,
      address: o.address ? {
        street: o.address.street,
        city: o.address.city,
        state: o.address.state,
        zip: o.address.zip,
        country: o.address.country
      } : null,
      coupon: o.coupon ? {
        code: o.coupon.code,
        discountPercent: o.coupon.discountPercent
      } : null,
      items: o.items.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        imageUrl: item.product.imageUrls[0]
      }))
    }));

    return { success: true, data: formattedOrders };
  } catch (e: any) {
    console.error("Error in getOrdersAction:", e);
    return { success: false, error: e.message };
  }
}

// 9.5. Update order status
export async function updateOrderStatusAction(orderId: string, status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED") {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }

  try {
    const updated = await db.order.update({
      where: { id: orderId },
      data: { status }
    });

    return { success: true, data: updated };
  } catch (e: any) {
    console.error("Error in updateOrderStatusAction:", e);
    return { success: false, error: e.message };
  }
}

// 10. Cloudinary image upload server action
export async function uploadImageAction(base64Data: string) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "mock_cloud") {
    try {
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return { success: true, url: base64Data };
      }
      
      const imageType = matches[1];
      const base64Buffer = Buffer.from(matches[2], "base64");
      
      let ext = "png";
      if (imageType.includes("jpeg") || imageType.includes("jpg")) ext = "jpg";
      else if (imageType.includes("webp")) ext = "webp";
      else if (imageType.includes("gif")) ext = "gif";
      
      const fs = require("fs");
      const path = require("path");
      const crypto = require("crypto");
      
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, base64Buffer);
      
      const localUrl = `/uploads/${fileName}`;
      console.log("Saved image locally to:", localUrl);
      return { success: true, url: localUrl };
    } catch (e: any) {
      console.error("Local file save failed, falling back to base64. Error:", e);
      return { success: true, url: base64Data, fallback: true, error: e.message };
    }
  }

  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    const res = await cloudinary.uploader.upload(base64Data, {
      folder: "moonzthrift"
    });

    return { success: true, url: res.secure_url };
  } catch (err: any) {
    console.error("Cloudinary upload failed, falling back to base64. Error:", err);
    return { success: true, url: base64Data, fallback: true, error: err.message };
  }
}

// 11. Stripe checkout success validation & database order write-back
export async function finalizeStripeOrderAction(sessionId: string) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true, error: "Database not connected" };
  }

  try {
    if (sessionId.startsWith("mock_session_")) {
      return { success: true, isMock: true };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2024-12-18.acacia" as any
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== "paid") {
      return { success: false, error: "Payment not verified" };
    }

    const metadata = session.metadata;
    if (!metadata) {
      return { success: false, error: "No order metadata found in Stripe session" };
    }

    const userId = metadata.userId;
    const couponCode = metadata.couponCode || null;
    const address = JSON.parse(metadata.address);
    const cartItems = JSON.parse(metadata.cartItems);

    const orderRes = await createOrderAction({
      userId,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      total: session.amount_total ? session.amount_total / 100 : 0,
      couponCode,
      couponDiscountPercent: Number(metadata.couponDiscountPercent || 0),
      items: cartItems,
      paymentIntentId: session.payment_intent as string || session.id
    });

    return { success: true, orderId: orderRes.orderId };
  } catch (err: any) {
    console.error("Stripe finalization error:", err);
    return { success: false, error: err.message };
  }
}

// 12. Check if user email is an admin
export async function checkIsAdminAction(email: string): Promise<boolean> {
  if (!(await isDbAvailable())) {
    return email.toLowerCase() === "admin@moonzthrift.com";
  }

  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    return user?.role === "ADMIN";
  } catch (e) {
    return false;
  }
}

// 13. Get user details and their default address
export async function getUserDetailsAction(userId: string) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        addresses: {
          where: { isDefault: true }
        }
      }
    });

    if (!user) return { success: false, error: "User not found" };

    return {
      success: true,
      data: {
        name: user.name,
        email: user.email,
        address: user.addresses[0] || null
      }
    };
  } catch (e: any) {
    console.error("Error in getUserDetailsAction:", e);
    return { success: false, error: e.message };
  }
}

// 14. Update user profile name/email and upsert default shipping address
export async function updateUserProfileAction(userId: string, name: string, email: string, street: string, city: string, zip: string) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }

  try {
    // 1. Update user credentials
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name,
        email: email.toLowerCase()
      }
    });

    // 2. Find existing default address
    const defaultAddress = await db.address.findFirst({
      where: { userId, isDefault: true }
    });

    if (defaultAddress) {
      // Update existing default address
      await db.address.update({
        where: { id: defaultAddress.id },
        data: { street, city, zip }
      });
    } else {
      // Create new default address
      await db.address.create({
        data: {
          userId,
          street,
          city,
          zip,
          state: "WA",
          country: "United States",
          isDefault: true
        }
      });
    }

    return { success: true, user: updatedUser };
  } catch (e: any) {
    console.error("Error in updateUserProfileAction:", e);
    return { success: false, error: e.message };
  }
}

// 15. Fetch all coupons
export async function getCouponsAction() {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }
  try {
    const coupons = await db.coupon.findMany({
      orderBy: { expiresAt: "desc" }
    });
    return { success: true, data: coupons };
  } catch (e: any) {
    console.error("Error in getCouponsAction:", e);
    return { success: false, error: e.message };
  }
}

// 16. Create a new coupon code
export async function createCouponAction(code: string, discountPercent: number, expiresDays: number) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }
  try {
    const uppercaseCode = code.toUpperCase();
    const existing = await db.coupon.findUnique({
      where: { code: uppercaseCode }
    });
    if (existing) {
      return { success: false, error: "Coupon code already exists." };
    }

    const created = await db.coupon.create({
      data: {
        code: uppercaseCode,
        discountPercent,
        expiresAt: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000)
      }
    });
    return { success: true, data: created };
  } catch (e: any) {
    console.error("Error in createCouponAction:", e);
    return { success: false, error: e.message };
  }
}

// 17. Toggle coupon active state
export async function toggleCouponActiveAction(couponId: string, isActive: boolean) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }
  try {
    const updated = await db.coupon.update({
      where: { id: couponId },
      data: { isActive }
    });
    return { success: true, data: updated };
  } catch (e: any) {
    console.error("Error in toggleCouponActiveAction:", e);
    return { success: false, error: e.message };
  }
}

// 18. Validate coupon code
export async function validateCouponAction(code: string) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }
  try {
    const uppercaseCode = code.toUpperCase();
    const coupon = await db.coupon.findUnique({
      where: { code: uppercaseCode }
    });
    
    if (!coupon) {
      return { success: false, error: "Invalid promo code." };
    }
    if (!coupon.isActive) {
      return { success: false, error: "Promo code is inactive." };
    }
    if (new Date(coupon.expiresAt).getTime() < Date.now()) {
      return { success: false, error: "Promo code has expired." };
    }
    
    return { 
      success: true, 
      data: {
        code: coupon.code,
        discountPercent: coupon.discountPercent
      }
    };
  } catch (e: any) {
    console.error("Error in validateCouponAction:", e);
    return { success: false, error: e.message };
  }
}

// 19. Get Categories
export async function getCategoriesAction() {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true, data: CATEGORIES };
  }
  try {
    const categories = await db.category.findMany({
      include: { subcategories: true }
    });
    return { success: true, data: categories };
  } catch (e: any) {
    console.error("Error in getCategoriesAction:", e);
    return { success: false, fallback: true, data: CATEGORIES, error: e.message };
  }
}

// 20. Create Category
export async function createCategoryAction(name: string) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }
  try {
    const slug = name.toLowerCase().trim().replace(/\s+/g, "-");
    const created = await db.category.create({
      data: {
        name,
        slug
      }
    });
    return { success: true, data: created };
  } catch (e: any) {
    console.error("Error in createCategoryAction:", e);
    return { success: false, error: e.message };
  }
}

// 21. Delete Category
export async function deleteCategoryAction(categoryId: string) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }
  try {
    // Delete subcategories first
    await db.subcategory.deleteMany({ where: { categoryId } });
    await db.category.delete({
      where: { id: categoryId }
    });
    return { success: true };
  } catch (e: any) {
    console.error("Error in deleteCategoryAction:", e);
    return { success: false, error: e.message };
  }
}

// 22. Create Subcategory
export async function createSubcategoryAction(name: string, categoryId: string) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }
  try {
    const slug = name.toLowerCase().trim().replace(/\s+/g, "-");
    const created = await db.subcategory.create({
      data: {
        name,
        slug,
        categoryId
      }
    });
    return { success: true, data: created };
  } catch (e: any) {
    console.error("Error in createSubcategoryAction:", e);
    return { success: false, error: e.message };
  }
}

// 23. Delete Subcategory
export async function deleteSubcategoryAction(subCategoryId: string) {
  if (!(await isDbAvailable())) {
    return { success: false, fallback: true };
  }
  try {
    await db.subcategory.delete({
      where: { id: subCategoryId }
    });
    return { success: true };
  } catch (e: any) {
    console.error("Error in deleteSubcategoryAction:", e);
    return { success: false, error: e.message };
  }
}


