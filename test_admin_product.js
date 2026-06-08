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

  // Step 1: Login as Admin
  console.log("1. Navigating to http://localhost:3001/admin/login...");
  await page.goto("http://localhost:3001/admin/login", { waitUntil: "domcontentloaded" });
  
  console.log("Waiting for bypass button...");
  await page.waitForSelector("button", { timeout: 25000 });
  await new Promise(resolve => setTimeout(resolve, 3000)); // wait for settling compile
  
  console.log("Clicking Developer Bypass button...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const bypassBtn = buttons.find(b => b.textContent && b.textContent.includes("Bypass"));
    if (bypassBtn) {
      bypassBtn.click();
    } else {
      console.error("Developer Bypass button not found on login page in step 1!");
    }
  });

  console.log("Waiting for redirection to dashboard...");
  try {
    await page.waitForFunction(
      () => window.location.pathname === "/admin/dashboard",
      { timeout: 30000 }
    );
    console.log("Redirected to dashboard URL.");
  } catch (err) {
    const currentUrl = page.url();
    console.log("Timeout waiting for redirect. Current URL:", currentUrl);
    if (currentUrl.includes("/admin/login")) {
      const errorText = await page.evaluate(() => {
        const errEl = document.querySelector(".bg-red-500\\/10") || document.body;
        return errEl ? errEl.textContent.trim() : "No error text elements";
      });
      console.error("Bypass failed! Visible error/page text on login screen:", errorText);
    }
    throw err;
  }

  console.log("Waiting for dashboard buttons to render...");
  await page.waitForSelector("button", { timeout: 25000 });
  await new Promise(resolve => setTimeout(resolve, 2000)); // wait for React to settle

  // Step 2: Go to Inventory Tab and Add Product
  console.log("2. Navigating to Inventory Sub-Tab...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const inventoryTab = buttons.find(b => b.textContent.includes("Inventory"));
    if (inventoryTab) inventoryTab.click();
  });
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log("Opening Add New Grail form...");
  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Add New Grail"));
    if (addBtn) addBtn.click();
  });
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log("Filling in new product details...");
  const timestamp = Date.now();
  const productName = `Admin Test Grail ${timestamp}`;
  
  // We locate the fields inside the form dynamically or by placeholders
  await page.type("input[placeholder='VINTAGE GRAIL TEE']", productName);
  await page.type("input[placeholder='STUSSY ARCHIVE']", "ADMIN CUSTOM");
  await page.type("textarea[placeholder='ENTER DETAILED PRODUCT DESCRIPTION AND MEASUREMENTS...']", "Automated test item verified on the user catalog.");
  await page.type("input[placeholder='120']", "180");
  await page.type("input[placeholder='9/10 (EXCELLENT)']", "10/10 (Mint)");
  
  console.log("Submitting new product...");
  await page.evaluate(() => {
    const submitBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Deploy Piece to Showcase"));
    if (submitBtn) submitBtn.click();
  });
  
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  // Step 3: Check store catalogue to see if product reflected automatically
  console.log("3. Verifying product presence on User Storefront...");
  await page.goto("http://localhost:3001/shop", { waitUntil: "domcontentloaded" });
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  const storefrontProducts = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("h3"));
    return cards.map(c => c.textContent.trim());
  });
  
  console.log("Storefront items listed in shop page:", storefrontProducts);
  const foundOnStorefront = storefrontProducts.includes(productName);
  
  if (foundOnStorefront) {
    console.log(`PASS: Product '${productName}' successfully reflected on user storefront!`);
  } else {
    console.error(`FAIL: Product '${productName}' did NOT reflect on user storefront!`);
  }

  // Step 4: Delete the product using the dashboard delete modal
  console.log("4. Returning to Admin Dashboard to perform deletion...");
  await page.goto("http://localhost:3001/admin/dashboard", { waitUntil: "domcontentloaded" });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Wait another 3 seconds for client-side redirection to settle
  await new Promise(resolve => setTimeout(resolve, 3000));
  let currentUrlStep4 = page.url();
  console.log("Current URL in Step 4 (settled):", currentUrlStep4);
  
  if (currentUrlStep4.includes("/admin/login")) {
    console.log("Not logged in at step 4. Clicking Developer Bypass Node button...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const bypassBtn = buttons.find(b => b.textContent && b.textContent.includes("Bypass"));
      if (bypassBtn) {
        bypassBtn.click();
      } else {
        console.error("Developer Bypass button not found on login page in step 4!");
      }
    });
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log("URL after step 4 bypass click:", page.url());
  }

  console.log("Opening Inventory Sub-Tab...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const inventoryTab = buttons.find(b => b.textContent.includes("Inventory"));
    if (inventoryTab) {
      inventoryTab.click();
    } else {
      console.error("Inventory Tab button not found!");
    }
  });
  
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log("Finding delete button for our product in the inventory table...");
  const deleteClicked = await page.evaluate((nameToFind) => {
    const rows = Array.from(document.querySelectorAll("tbody tr"));
    const targetRow = rows.find(r => r.textContent.includes(nameToFind));
    if (targetRow) {
      const deleteBtn = targetRow.querySelector("button[aria-label='Delete product']");
      if (deleteBtn) {
        deleteBtn.click();
        return true;
      }
    }
    return false;
  }, productName);
  
  if (!deleteClicked) {
    console.error("FAIL: Could not locate our test product delete button in the dashboard!");
    await browser.close();
    process.exit(1);
  }
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log("Asserting that delete confirmation modal is active...");
  const modalActive = await page.evaluate(() => {
    const modalText = document.body.textContent;
    return modalText.includes("Remove Grail Drop?") && modalText.includes("Are you sure you want to remove this piece");
  });
  
  if (modalActive) {
    console.log("PASS: Delete confirmation overlay modal is active!");
  } else {
    console.error("FAIL: Delete confirmation modal failed to display!");
  }

  console.log("Confirming deletion in modal...");
  await page.evaluate(() => {
    const confirmBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Remove Piece"));
    if (confirmBtn) confirmBtn.click();
  });
  
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  // Step 5: Verify product was removed from shop catalogue
  console.log("5. Navigating to user storefront to verify removal...");
  await page.goto("http://localhost:3001/shop", { waitUntil: "domcontentloaded" });
  await new Promise(resolve => setTimeout(resolve, 3000));

  const storefrontProductsFinal = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("h3"));
    return cards.map(c => c.textContent.trim());
  });

  const removedFromStorefront = !storefrontProductsFinal.includes(productName);
  if (removedFromStorefront) {
    console.log("PASS: Product was successfully removed from storefront!");
  } else {
    console.error("FAIL: Product still exists on storefront after admin deletion!");
  }

  console.log("Closing browser.");
  await browser.close();

  const success = foundOnStorefront && modalActive && removedFromStorefront;
  if (success) {
    console.log("SUCCESS: Admin Inventory Management flow completed successfully!");
    process.exit(0);
  } else {
    console.error("FAILURE: Some assertions failed!");
    process.exit(1);
  }
}

run().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
