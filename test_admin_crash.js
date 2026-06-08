const puppeteer = require("puppeteer-core");

async function run() {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true
  });

  const page = await browser.newPage();
  
  // Collect all console logs and exceptions
  page.on("console", msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });

  page.on("pageerror", err => {
    console.error("[BROWSER EXCEPTION]:", err.toString());
  });

  console.log("1. Navigating to http://localhost:3001/admin/login...");
  await page.goto("http://localhost:3001/admin/login", { waitUntil: "domcontentloaded" });
  
  console.log("Waiting for buttons to render...");
  try {
    await page.waitForSelector("button", { timeout: 15000 });
  } catch (e) {
    console.error("Timeout waiting for buttons to render!");
  }
  
  // Check if already redirected to dashboard (in case session persisted)
  const currentUrl = page.url();
  console.log("Current URL after load:", currentUrl);
  
  if (currentUrl.includes("/admin/login")) {
    console.log("Not logged in. Clicking Developer Bypass Node button...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      console.log("Buttons count: " + buttons.length);
      buttons.forEach((b, idx) => console.log("Button " + idx + ": '" + b.textContent + "'"));
      const bypassBtn = buttons.find(b => b.textContent && b.textContent.includes("Bypass"));
      if (bypassBtn) {
        bypassBtn.click();
      } else {
        console.error("Developer Bypass button not found on page!");
      }
    });
    console.log("Waiting for redirection...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log("URL after bypass click:", page.url());
  }

  console.log("2. Testing Admin Dashboard tab navigation...");
  
  // Test Overview Tab (default)
  console.log("Overview Tab active. Waiting to check for crashes...");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test Inventory Tab
  console.log("Switching to Inventory Tab...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const tab = buttons.find(b => b.textContent.includes("Inventory"));
    if (tab) tab.click();
  });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test Categories Tab
  console.log("Switching to Categories Tab...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const tab = buttons.find(b => b.textContent.includes("Categories"));
    if (tab) tab.click();
  });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test Coupons Tab
  console.log("Switching to Coupons Tab...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const tab = buttons.find(b => b.textContent.includes("Coupons"));
    if (tab) tab.click();
  });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test Orders Tab
  console.log("Switching to Orders Tab...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const tab = buttons.find(b => b.textContent.includes("Orders"));
    if (tab) tab.click();
  });
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("Completed tab transitions. Closing browser.");
  await browser.close();
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
