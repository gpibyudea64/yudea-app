const { chromium } = require("playwright");

const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(10000);

  console.log("[1] goto login");
  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes("login")) break;
  }
  console.log("[2] URL:", page.url());

  console.log("[3] goto families");
  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  // Main thread ping
  const t0 = Date.now();
  const ping = await page
    .evaluate(() => "pong-" + Date.now())
    .then((r) => `${r} in ${Date.now() - t0}ms`)
    .catch((e) => "FAIL: " + e.message.split("\n")[0]);
  console.log("[4] main thread ping:", ping);

  const btn = page.locator("button:has-text('Create Family')").first();
  const box = await btn.boundingBox();
  console.log("[5] box:", JSON.stringify(box));

  if (box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    // Raw mouse click
    const t1 = Date.now();
    try {
      await page.mouse.click(cx, cy);
      console.log("[6] raw mouse click OK in", Date.now() - t1, "ms");
    } catch (e) {
      console.log("[6] raw mouse click FAIL:", e.message.split("\n")[0]);
    }
    await page.waitForTimeout(1500);
    console.log("[7] dialogs after mouse click:", await page.locator('[role="dialog"]').count());
  }

  // JS dispatchEvent click
  const t2 = Date.now();
  await btn.evaluate((el) => el.click());
  console.log("[8] el.click() dispatched in", Date.now() - t2, "ms");
  await page.waitForTimeout(1500);
  console.log("[9] dialogs after el.click():", await page.locator('[role="dialog"]').count());

  await browser.close();
  console.log("DONE");
})();
