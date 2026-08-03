/* Reproduce qa-flow-2b failure with page-state capture */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const TAG = `QA-DIAG-${Date.now().toString().slice(-6)}`;

async function login(page) {
  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes("login")) return true;
  }
  return false;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text().slice(0, 200));
  });
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message.slice(0, 200)));

  console.log("login:", await login(page), page.url());

  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  console.log("URL:", page.url());
  const loc = page.getByRole("button", { name: /Create Family/i });
  console.log("locator count immediately:", await loc.count());

  try {
    await loc.click({ timeout: 10000 });
    console.log("CLICK OK");
  } catch (e) {
    console.log("first click failed:", e.message.slice(0, 100));
    const body = await page.locator("body").innerText().catch(() => "");
    console.log("BODY (600):", body.slice(0, 600).replace(/\n/g, " | "));
    try {
      await loc.click({ force: true, timeout: 10000 });
      console.log("FORCE CLICK OK");
    } catch (e2) {
      console.log("force click failed:", e2.message.slice(0, 100));
    }
  }

  await browser.close();
})();
