/* QA: open Create Family dialog and capture errors */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("CONSOLE:", msg.text().slice(0, 300));
  });
  page.on("pageerror", (err) => {
    console.log("PAGEERROR:", err.message.slice(0, 200));
    console.log("STACK:", (err.stack || "").split("\n").slice(1, 5).join("\n"));
  });

  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(800);
    if (!page.url().includes("login")) break;
  }
  console.log("logged in:", page.url());

  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  console.log("on families:", page.url());

  // Click Create Family
  const btn = page.getByRole("button", { name: /Create Family/i });
  console.log("btn count:", await btn.count());
  await btn.click({ timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log("dialog visible:", await page.getByText("Add New Family", { exact: false }).count(), "/",
    await page.locator('[role="dialog"]').count());

  const dialogText = await page.locator('[role="dialog"]').first().innerText().catch(() => "");
  console.log("dialog text sample:", dialogText.slice(0, 300).replace(/\n/g, " | "));

  await browser.close();
})();
