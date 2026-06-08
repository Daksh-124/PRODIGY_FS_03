import db from "../src/lib/db";
import { CATEGORIES, SUBCATEGORIES, MOCK_PRODUCTS } from "../src/lib/mockData";

async function main() {
  try {
    console.log("Starting database seed...");
    
    // Clear old data to ensure clean categories mapping
    console.log("Cleaning old database tables...");
    await db.review.deleteMany({});
    await db.wishlistItem.deleteMany({});
    await db.cartItem.deleteMany({});
    await db.orderItem.deleteMany({});
    await db.order.deleteMany({});
    await db.product.deleteMany({});
    await db.subcategory.deleteMany({});
    await db.category.deleteMany({});
    console.log("Database cleared.");
    
    // Seed Categories
    for (const cat of CATEGORIES) {
      await db.category.upsert({
        where: { id: cat.id },
        update: {},
        create: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug
        }
      });
    }
    console.log(`Seeded ${CATEGORIES.length} categories.`);

    // Seed Subcategories
    for (const sub of SUBCATEGORIES) {
      await db.subcategory.upsert({
        where: { id: sub.id },
        update: {},
        create: {
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          categoryId: sub.categoryId
        }
      });
    }
    console.log(`Seeded ${SUBCATEGORIES.length} subcategories.`);

    // Seed Products
    let productCount = 0;
    for (const prod of MOCK_PRODUCTS) {
      await db.product.upsert({
        where: { id: prod.id },
        update: {
          gender: prod.gender,
          subCategoryId: prod.subCategoryId || null
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
      productCount++;
    }
    console.log(`Seeded/Updated ${productCount} products with gender.`);

    // Seed default admin and buyer in User table
    const users = [
      {
        id: "usr-lila",
        name: "Lila Moon",
        email: "lila@moonzthrift.com",
        password: "password123",
        role: "USER" as const
      },
      {
        id: "usr-admin",
        name: "Admin Lord",
        email: "admin@moonzthrift.com",
        password: "admin123",
        role: "ADMIN" as const
      }
    ];

    for (const u of users) {
      await db.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role
        }
      });
    }
    console.log("Seeded default users (Lila and Admin).");
    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Database seeding error:", error);
  } finally {
    await db.$disconnect();
  }
}

main();
