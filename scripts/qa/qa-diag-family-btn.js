/* QA: check Create Family button visibility + RBAC config */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(15000);

  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(800);
    if (!page.url().includes("login")) break;
  }
  console.log("After login:", page.url());

  // Inspect localStorage auth session + rbac config
  const stored = await page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out[k] = localStorage.getItem(k)?.slice(0, 200);
    }
    return out;
  });
  console.log("localStorage keys:", Object.keys(stored));
  console.log("user entry:", stored["auth_user"] || stored["user"] || "(none)");

  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  const body = await page.locator("body").innerText().catch(() => "");
  console.log("\nFamilies page body sample:", body.slice(0, 400).replace(/\n/g, " | "));
  console.log("Has 'Create Family' text:", body.includes("Create Family"));
  const btns = await page.locator("button").allInnerTexts().catch(() => []);
  console.log("Buttons:", JSON.stringify(btns.map((b) => b.trim().slice(0, 30)).filter(Boolean)));

  // Check if any 'Access Restricted' or restricted banner
  const restricted = await page.locator("text=Access Restricted").count().catch(() => 0);
  console.log("Access Restricted banner count:", restricted);

  await browser.close();
})();
