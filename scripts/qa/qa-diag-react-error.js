/* QA: capture full React error stack on families page */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("CONSOLE:", msg.text().slice(0, 500));
  });
  page.on("pageerror", (err) => {
    console.log("PAGEERROR:", err.message.slice(0, 300));
    console.log("STACK:", (err.stack || "").split("\n").slice(0, 8).join("\n"));
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
  await page.waitForTimeout(6000);
  console.log("URL:", page.url());
  const body = await page.locator("body").innerText().catch(() => "");
  console.log("body length:", body.length);
  console.log("has Family Management:", body.includes("Family Management"));
  console.log("has Create Family:", body.includes("Create Family"));

  await browser.close();
})();
