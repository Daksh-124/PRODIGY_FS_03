import { 
  registerUserAction, 
  loginUserAction, 
  getProductsAction, 
  addProductAction, 
  submitReviewAction, 
  createOrderAction, 
  getOrdersAction, 
  deleteProductAction,
  updateOrderStatusAction,
  getUserDetailsAction,
  updateUserProfileAction,
  createCouponAction,
  toggleCouponActiveAction,
  validateCouponAction,
  updateProductAction
} from "../src/lib/actions";
import db from "../src/lib/db";

async function runTests() {
  console.log("=========================================");
  console.log("     MOONZTHRIFT INTEGRATION TEST        ");
  console.log("=========================================");
  
  let passed = 0;
  let failed = 0;

  async function assert(name: string, fn: () => Promise<boolean> | boolean) {
    try {
      const result = await fn();
      if (result) {
        console.log(`[PASS] ${name}`);
        passed++;
      } else {
        console.error(`[FAIL] ${name} (Returned falsy)`);
        failed++;
      }
    } catch (err: any) {
      console.error(`[FAIL] ${name} (Threw error)`);
      console.error(err);
      failed++;
    }
  }

  // 1. Database Connection Test
  await assert("Database Connection & Raw Select", async () => {
    const res = await db.$executeRaw`SELECT 1`;
    return res === 1 || res === 0;
  });

  // 2. User Registration Action Test
  const testEmail = `test_developer_${Date.now()}@moonzthrift.com`;
  let testUserId = "";
  await assert("User Registration Action", async () => {
    const res = await registerUserAction("Dev Test", testEmail, "securepass123");
    if (res.success && res.user) {
      testUserId = res.user.id;
      return res.user.email === testEmail;
    }
    return false;
  });

  // 3. User Login Action Test
  await assert("User Login Action (Correct Credentials)", async () => {
    const res = await loginUserAction(testEmail, "securepass123");
    return res.success && res.user !== undefined;
  });

  await assert("User Login Action (Incorrect Credentials)", async () => {
    const res = await loginUserAction(testEmail, "wrongpass");
    return !res.success && res.error !== undefined;
  });
  
  // 3.5. Update and Get Profile Address Details Test
  await assert("Update and Get User Profile Address Coordinates", async () => {
    const updateRes = await updateUserProfileAction(
      testUserId,
      "Dev Updated Name",
      testEmail,
      "777 Celestial Boulevard",
      "Seattle",
      "98101"
    );
    if (!updateRes.success) return false;

    const getRes = await getUserDetailsAction(testUserId);
    if (!getRes.success || !getRes.data) return false;

    const address = getRes.data.address;
    return (
      getRes.data.name === "Dev Updated Name" &&
      address !== null &&
      address.street === "777 Celestial Boulevard" &&
      address.city === "Seattle" &&
      address.zip === "98101" &&
      address.isDefault === true
    );
  });

  // 4. Product Catalog Retrieval Test
  await assert("Get Products List", async () => {
    const res = await getProductsAction();
    return res.success && Array.isArray(res.data) && res.data.length > 0;
  });

  // 5. Add Product Action Test
  const testProductId = `test-prod-${Date.now()}`;
  await assert("Add New Product (Grail)", async () => {
    const res = await addProductAction({
      id: testProductId,
      name: "Developer Knit Grail",
      brand: "DEV INC",
      description: "Insane heavy knit made specifically for integration testing.",
      price: 150,
      imageUrls: ["https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600"],
      categoryId: "cat-tops",
      categoryName: "Tops",
      subCategoryId: "sub-hoodies",
      stock: 1,
      size: "L",
      condition: "10/10 (Deadstock)",
      isFeatured: false,
      isTrending: true,
      gender: "Men"
    });
    return res.success && res.data !== undefined && res.data.subCategoryId === "sub-hoodies";
  });

  // 6. Submit Review Action Test
  await assert("Submit Product Review", async () => {
    const res = await submitReviewAction(testProductId, testUserId, 5, "Unbelievable heavy knit drape!");
    return res.success && res.data !== undefined;
  });

  // 6.5. Verify Review User Relation Mapping
  await assert("Verify Review User Relation Mapping", async () => {
    const res = await getProductsAction();
    if (!res.success || !res.data) return false;
    const testProd = res.data.find(p => p.id === testProductId);
    if (!testProd || !testProd.reviews || testProd.reviews.length === 0) return false;
    const submittedReview = testProd.reviews.find((r: any) => r.comment === "Unbelievable heavy knit drape!");
    return submittedReview !== undefined && submittedReview.userName === "Dev Updated Name";
  });

  // 7. Create Order Action Test
  let testOrderId = "";
  await assert("Create Checkout Order", async () => {
    const orderRes = await createOrderAction({
      userId: testUserId,
      street: "123 Dev Lane",
      city: "Seattle",
      state: "WA",
      zip: "98101",
      country: "United States",
      total: 160, // 150 product + 10 shipping
      couponCode: null,
      couponDiscountPercent: 0,
      items: [
        {
          productId: testProductId,
          quantity: 1,
          price: 150,
          size: "L"
        }
      ]
    });
    if (orderRes.success && orderRes.orderId) {
      testOrderId = orderRes.orderId;
    }
    return orderRes.success && orderRes.orderId !== undefined;
  });

  // 7.5. Update Order Status Action Test
  await assert("Update Order Status (Shipped)", async () => {
    const res = await updateOrderStatusAction(testOrderId, "SHIPPED");
    return res.success && res.data !== undefined && res.data.status === "SHIPPED";
  });

  // 8. Retrieve User Order History Test
  await assert("Get User Orders History List", async () => {
    const res = await getOrdersAction(testUserId);
    return res.success && Array.isArray(res.data) && res.data.length > 0;
  });

  // 8.5. Promo Coupon Actions Integration Test
  let testCouponId = "";
  await assert("Create Promo Coupon Action", async () => {
    const res = await createCouponAction("TESTCOUPON25", 25, 5);
    if (res.success && res.data) {
      testCouponId = res.data.id;
      return res.data.code === "TESTCOUPON25" && res.data.discountPercent === 25;
    }
    return false;
  });

  await assert("Validate Active Promo Coupon Action", async () => {
    const res = await validateCouponAction("TESTCOUPON25");
    return res.success && res.data !== undefined && res.data.discountPercent === 25;
  });

  await assert("Toggle Promo Coupon Inactive & Validate", async () => {
    const toggleRes = await toggleCouponActiveAction(testCouponId, false);
    if (!toggleRes.success) return false;
    const valRes = await validateCouponAction("TESTCOUPON25");
    return !valRes.success && valRes.error === "Promo code is inactive.";
  });

  // 8.6. Product Stock Modification Test
  await assert("Modify Product Stock Action & Verify", async () => {
    const updateRes = await updateProductAction({
      id: testProductId,
      name: "Developer Knit Grail",
      brand: "DEV INC",
      description: "Insane heavy knit made specifically for integration testing.",
      price: 150,
      imageUrls: ["https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600"],
      categoryId: "cat-tops",
      subCategoryId: "sub-hoodies",
      stock: 0,
      size: "L",
      condition: "10/10 (Deadstock)",
      isFeatured: false,
      gender: "Men"
    });
    if (!updateRes.success) return false;

    const getRes = await getProductsAction();
    if (!getRes.success || !getRes.data) return false;
    const testProd = getRes.data.find(p => p.id === testProductId);
    return testProd !== undefined && testProd.stock === 0 && testProd.subCategoryId === "sub-hoodies";
  });

  // 9. Delete Product Action Test (Cleanup)
  await assert("Delete Product and Dependent Data Cleanup", async () => {
    const res = await deleteProductAction(testProductId);
    return res.success;
  });

  // Clean up the test user and test coupon
  try {
    if (testCouponId) {
      await db.coupon.delete({ where: { id: testCouponId } }).catch(() => {});
    }
    await db.user.delete({ where: { id: testUserId } });
  } catch (e) {}

  console.log("=========================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("=========================================");

  await db.$disconnect();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
