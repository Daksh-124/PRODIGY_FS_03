const puppeteer = require("puppeteer-core");

async function run() {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true
  });

  const page = await browser.newPage();
  
  // Collect all console logs and errors
  page.on("console", msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });

  page.on("pageerror", err => {
    console.error("[BROWSER EXCEPTION]:", err.toString());
  });

  console.log("Navigating to http://localhost:3001 ...");
  await page.goto("http://localhost:3001", { waitUntil: "networkidle2" });
  
  console.log("Page loaded. Waiting 5 seconds to capture post-load issues...");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log("Closing browser.");
  await browser.close();
}

run().catch(err => {
  console.error("Test script failed:", err);
  process.exit(1);
});
