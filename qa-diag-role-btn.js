/* QA: reproduce qa-flow-2b button lookup exactly */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  // exact login from qa-flow-2b
  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  let ok = false;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes("login")) { ok = true; break; }
  }
  console.log("login ok:", ok, "| url:", page.url());

  // exact navigation from qa-flow-2b
  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  const url = page.url();
  console.log("URL after goto:", url);
  console.log("is on login page:", url.includes("login"));

  const roleBtn = page.getByRole("button", { name: /Create Family/i });
  console.log("getByRole Create Family count:", await roleBtn.count());

  const textBtn = page.locator("button:has-text('Create Family')");
  console.log("has-text Create Family count:", await textBtn.count());

  const allBtns = await page.locator("button").allInnerTexts().catch(() => []);
  console.log("all button texts:", JSON.stringify(allBtns.map((b) => b.trim().slice(0, 25)).filter(Boolean)));

  const body = await page.locator("body").innerText().catch(() => "");
  console.log("body has 'Access Restricted':", body.includes("Access Restricted"));
  console.log("body first 200:", body.slice(0, 200).replace(/\n/g, " | "));

  await browser.close();
})();
