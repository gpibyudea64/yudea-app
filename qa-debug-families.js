const { chromium } = require("playwright");

const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes("login")) break;
  }
  console.log("After login URL:", page.url());

  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  const url = page.url();
  console.log("Families URL:", url);

  // Count buttons matching Create Family
  const btns = await page.getByRole("button", { name: /Create Family/i }).count();
  console.log("Create Family buttons:", btns);

  // Dump all button texts
  const allBtns = await page.locator("button").allInnerTexts().catch(() => []);
  console.log("ALL BUTTONS:", JSON.stringify(allBtns.slice(0, 20)));

  // Dump body text (first 600 chars)
  const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 600);
  console.log("BODY TEXT:", bodyText);

  // Check for overlays / dialogs
  const dialogs = await page.locator('[role="dialog"]').count();
  console.log("Dialogs open:", dialogs);

  // Check cookies
  const cookies = await page.context().cookies();
  console.log("Cookies:", cookies.map((c) => c.name).join(","));

  await browser.close();
})();
