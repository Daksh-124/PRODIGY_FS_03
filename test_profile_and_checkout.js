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
  const email = `test_val_${Date.now()}@moonzthrift.com`;
  console.log(`1. Registering user with email: ${email}`);
  await page.goto("http://localhost:3001/login", { waitUntil: "networkidle2" });
  
  await page.waitForSelector("button", { timeout: 20000 });
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const registerButton = buttons.find(b => b.textContent.includes("Register Account"));
    if (registerButton) registerButton.click();
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector("input[placeholder='LILA MOON']", { timeout: 15000 });
  await page.type("input[placeholder='LILA MOON']", "Test Automator");
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
  console.log("Current URL:", page.url());

  // Step 2: Save address in Profile
  console.log("2. Navigating to profile settings...");
  await page.goto("http://localhost:3001/profile", { waitUntil: "networkidle2" });
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("Clicking 'Account Details' tab...");
  const tabClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    console.log("All button texts on page:", buttons.map(b => b.textContent.trim()));
    const detailsTab = buttons.find(b => b.textContent.includes("Account Details"));
    if (detailsTab) {
      detailsTab.click();
      return true;
    }
    return false;
  });

  if (!tabClicked) {
    throw new Error("Could not find 'Account Details' tab button on the page!");
  }
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log("Filling out profile coordinates form...");
  
  const clearAndType = async (selector, text) => {
    await page.focus(selector);
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type(selector, text);
  };

  // Clear and type street
  await clearAndType("input[placeholder='Street Address']", "777 Celestial Boulevard");
  
  // Clear and type city
  await clearAndType("input[placeholder='City']", "Seattle");
  
  // Clear and type zip
  await clearAndType("input[placeholder='Zip']", "98101");
  
  console.log("Submitting account changes...");
  await page.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Save Account Changes"));
    if (saveBtn) saveBtn.click();
  });
  
  await new Promise(resolve => setTimeout(resolve, 4000));

  // Step 3: Add product to cart
  console.log("3. Navigating to product page prod-1...");
  await page.goto("http://localhost:3001/product/prod-1", { waitUntil: "networkidle2" });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("Clicking 'Add to Bag'...");
  await page.evaluate(() => {
    const bagBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Add to Bag"));
    if (bagBtn) bagBtn.click();
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 4: Checkout pre-population check
  console.log("4. Navigating to checkout...");
  console.log("4. Navigating to checkout...");
  await page.goto("http://localhost:3001/checkout", { waitUntil: "domcontentloaded" });
  
  console.log("Waiting for form pre-population to complete...");
  await page.waitForFunction(
    () => {
      const addressInput = document.querySelector("input[placeholder='104 CELESTIAL ST, SUITE B']");
      return addressInput && addressInput.value !== "";
    },
    { timeout: 15000 }
  ).catch(err => {
    console.warn("Warning: Timeout waiting for pre-populated address. Proceeding to assertion anyway. Error:", err.message);
  });

  console.log("Asserting form field values...");
  const formValues = await page.evaluate(() => {
    const emailInput = document.querySelector("input[placeholder='EMAIL@DOMAIN.COM']");
    const nameInput = document.querySelector("input[placeholder='LILA MOON']");
    const addressInput = document.querySelector("input[placeholder='104 CELESTIAL ST, SUITE B']");
    const cityInput = document.querySelector("input[placeholder='SEATTLE']");
    const zipInput = document.querySelector("input[placeholder='98101']");
    
    return {
      email: emailInput ? emailInput.value : null,
      name: nameInput ? nameInput.value : null,
      address: addressInput ? addressInput.value : null,
      city: cityInput ? cityInput.value : null,
      zip: zipInput ? zipInput.value : null
    };
  });

  console.log("Captured checkout form details:", formValues);
  
  let passed = true;
  if (formValues.name !== "Test Automator") {
    console.error(`FAIL: Expected Name to be 'Test Automator', got '${formValues.name}'`);
    passed = false;
  }
  if (formValues.email !== email) {
    console.error(`FAIL: Expected Email to be '${email}', got '${formValues.email}'`);
    passed = false;
  }
  if (formValues.address !== "777 Celestial Boulevard") {
    console.error(`FAIL: Expected Address to be '777 Celestial Boulevard', got '${formValues.address}'`);
    passed = false;
  }
  if (formValues.city !== "Seattle") {
    console.error(`FAIL: Expected City to be 'Seattle', got '${formValues.city}'`);
    passed = false;
  }
  if (formValues.zip !== "98101") {
    console.error(`FAIL: Expected Zip to be '98101', got '${formValues.zip}'`);
    passed = false;
  }
  
  if (passed) {
    console.log("SUCCESS: All pre-population assertions match default profile coordinates!");
  } else {
    console.error("FAILURE: Pre-population assertion verification failed!");
  }

  console.log("Closing browser.");
  await browser.close();
  
  if (!passed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(err => {
  console.error("Automated browser test failed:", err);
  process.exit(1);
});
