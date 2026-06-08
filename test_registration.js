const puppeteer = require("puppeteer-core");

async function run() {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true
  });

  const page = await browser.newPage();
  
  page.on("console", msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });

  page.on("pageerror", err => {
    console.error("[BROWSER EXCEPTION]:", err.toString());
  });

  console.log("Navigating to http://localhost:3001/login ...");
  await page.goto("http://localhost:3001/login", { waitUntil: "networkidle2" });

  console.log("Waiting for form or buttons to render...");
  await page.waitForSelector("button", { timeout: 5000 }).catch(e => console.error("No buttons found by selector:", e.message));

  console.log("Clicking 'Register Account' button to switch modes...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    console.log("Found buttons:", buttons.map(b => b.textContent.trim()));
    const registerButton = buttons.find(b => b.textContent.includes("Register Account"));
    if (registerButton) {
      registerButton.click();
    } else {
      console.error("Could not find Register Account button. HTML:", document.body.innerHTML);
    }
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log("Filling out registration form...");
  await page.waitForSelector("input[placeholder='LILA MOON']", { timeout: 3000 });
  await page.type("input[placeholder='LILA MOON']", "Test User");
  await page.type("input[placeholder='EMAIL@DOMAIN.COM']", `testuser_${Date.now()}@moonzthrift.com`);
  // NextAuth requires password length >= 6
  // Wait, let's type it into password and confirm password inputs
  const inputs = await page.$$("input[type='password']");
  if (inputs.length >= 2) {
    await inputs[0].type("password123");
    await inputs[1].type("password123");
  } else {
    console.error("Could not find both password fields");
  }

  console.log("Submitting form...");
  await page.evaluate(() => {
    const submitBtn = document.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.click();
    else console.error("Could not find submit button");
  });

  console.log("Waiting 5 seconds for registration and authentication responses...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("Checking current URL...");
  const url = page.url();
  console.log("Current URL after registration:", url);

  console.log("Closing browser.");
  await browser.close();
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
