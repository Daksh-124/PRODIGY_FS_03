const puppeteer = require("puppeteer-core");

async function run() {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true
  });

  const page = await browser.newPage();
  
  // Track logs
  page.on("console", msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });

  page.on("pageerror", err => {
    console.error("[BROWSER EXCEPTION]:", err.toString());
  });

  // Step 1: Register User
  const email = `checkout_test_${Date.now()}@moonzthrift.com`;
  console.log(`1. Registering user with email: ${email}`);
  await page.goto("http://localhost:3001/login", { waitUntil: "domcontentloaded", timeout: 60000 });
  
  await page.waitForSelector("button", { timeout: 30000 });
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const registerButton = buttons.find(b => b.textContent.includes("Register Account"));
    if (registerButton) registerButton.click();
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector("input[placeholder='LILA MOON']", { timeout: 20000 });
  await page.type("input[placeholder='LILA MOON']", "Checkout Tester");
  await page.type("input[placeholder='EMAIL@DOMAIN.COM']", email);
  
  const pwInputs = await page.$$("input[type='password']");
  await pwInputs[0].type("password123");
  await pwInputs[1].type("password123");
  
  await page.evaluate(() => {
    const submitBtn = document.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.click();
  });
  
  console.log("Waiting for registration and session authentication...");
  await new Promise(resolve => setTimeout(resolve, 6000));
  console.log("Current URL after registration:", page.url());

  // Step 2: Add product to cart
  console.log("2. Navigating to product page prod-1...");
  await page.goto("http://localhost:3001/product/prod-1", { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("Clicking 'Add to Bag'...");
  await page.evaluate(() => {
    const bagBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Add to Bag"));
    if (bagBtn) bagBtn.click();
  });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Checkout page
  console.log("3. Navigating to checkout...");
  await page.goto("http://localhost:3001/checkout", { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log("Filling shipping details...");
  // Clear and type address
  await page.focus("input[placeholder='104 CELESTIAL ST, SUITE B']");
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type("input[placeholder='104 CELESTIAL ST, SUITE B']", "123 Stripe Gate Street");

  // Clear and type city
  await page.focus("input[placeholder='SEATTLE']");
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type("input[placeholder='SEATTLE']", "Seattle");

  // Clear and type zip
  await page.focus("input[placeholder='98101']");
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type("input[placeholder='98101']", "98101");

  console.log("Submitting order and initiating checkout redirect...");
  await page.evaluate(() => {
    const submitBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Authorize & Pay"));
    if (submitBtn) submitBtn.click();
  });

  console.log("Waiting for redirect...");
  try {
    await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 });
  } catch (e) {
    console.log("Navigation timeout or already navigated. Proceeding.");
  }
  console.log("Current URL after checkout submission:", page.url());

  // Check if we are on payment-portal
  if (page.url().includes("/checkout/payment-portal")) {
    console.log("Landed on Payment Portal. Fulfilling mock card payment details...");
    
    await page.waitForSelector("input[placeholder='LILA MOON']", { timeout: 20000 });
    
    // Type Cardholder Name
    await page.focus("input[placeholder='LILA MOON']");
    await page.type("input[placeholder='LILA MOON']", "CHECKOUT TESTER");
    
    // Type Card Number
    const cardNumberSelector = "input[placeholder='4111 2222 3333 4444']";
    await page.focus(cardNumberSelector);
    await page.type(cardNumberSelector, "4111 2222 3333 4444");
    
    // Type Expiry
    await page.focus("input[placeholder='MM/YY']");
    await page.type("input[placeholder='MM/YY']", "12/29");
    
    // Type CVV
    await page.focus("input[placeholder='•••']");
    await page.type("input[placeholder='•••']", "123");

    console.log("Submitting payment on portal...");
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Authorize & Pay"));
      if (submitBtn) submitBtn.click();
    });

    console.log("Waiting for final order success page redirect...");
    try {
      await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 25000 });
    } catch (e) {
      console.log("Success navigation timeout or already navigated. Proceeding.");
    }
    console.log("Current URL after payment portal submission:", page.url());
  }

  // Wait for confirmation page header
  await page.waitForSelector("h1", { timeout: 15000 });

  const successContent = await page.evaluate(() => {
    const title = document.querySelector("h1");
    // Search for order reference MT-XXXXXX
    const spans = Array.from(document.querySelectorAll("span"));
    const refSpan = spans.find(s => s.textContent.includes("MT-"));
    return {
      title: title ? title.textContent : null,
      ref: refSpan ? refSpan.textContent : null
    };
  });

  console.log("Confirmation Page Content:", successContent);

  let passed = true;
  if (!page.url().includes("/checkout/success")) {
    console.error("FAIL: Did not land on checkout success landing URL!");
    passed = false;
  }
  if (!successContent.title || (!successContent.title.toUpperCase().includes("SECURED") && !successContent.title.toUpperCase().includes("PLACED"))) {
    console.error(`FAIL: Expected Success Title to be 'ORDER SECURED' or similar, got '${successContent.title}'`);
    passed = false;
  }
  if (!successContent.ref || !successContent.ref.startsWith("MT-")) {
    console.error(`FAIL: Order Reference number is missing or invalid: '${successContent.ref}'`);
    passed = false;
  }

  if (passed) {
    console.log("SUCCESS: End-to-end checkout and payment flow verified successfully!");
    await browser.close();
    process.exit(0);
  } else {
    console.error("FAILURE: Checkout integration check failed!");
    await browser.close();
    process.exit(1);
  }
}

run().catch(err => {
  console.error("Automated browser test failed:", err);
  process.exit(1);
});
