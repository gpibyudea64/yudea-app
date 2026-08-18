const { chromium } = require("playwright");

const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(15000);

  console.log("[1] goto login");
  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  console.log("[2] fill login");
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes("login")) break;
  }
  console.log("[3] URL after login:", page.url());

  console.log("[4] goto families");
  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  console.log("[5] families domcontentloaded, waiting 3s");
  await page.waitForTimeout(3000);

  // 1. Count by raw text locator
  console.log("[6] counting buttons");
  const byText = page.locator("button:has-text('Create Family')");
  console.log("button:has-text count:", await byText.count());

  // 2. Count via getByRole
  const byRole = page.getByRole("button", { name: /Create Family/i });
  console.log("getByRole count:", await byRole.count());

  // 3. Visibility of first
  if ((await byText.count()) > 0) {
    const first = byText.first();
    console.log("isVisible:", await first.isVisible().catch((e) => "ERR " + e.message));
    console.log("isEnabled:", await first.isEnabled().catch(() => "?"));
    const box = await first.boundingBox().catch(() => null);
    console.log("boundingBox:", JSON.stringify(box));
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const topEl = await page.evaluate(
        ([x, y]) => {
          const el = document.elementFromPoint(x, y);
          return el ? el.tagName + "." + (el.className ? String(el.className).slice(0, 80) : "") : "null";
        },
        [cx, cy],
      );
      console.log("elementFromPoint at button center:", topEl);
    }
    // aria-hidden ancestors?
    const ariaHidden = await first.evaluate((el) => {
      let cur = el;
      const chain = [];
      while (cur) {
        if (cur.getAttribute && cur.getAttribute("aria-hidden") === "true") chain.push(cur.tagName + "." + String(cur.className).slice(0, 40));
        cur = cur.parentElement;
      }
      return chain;
    });
    console.log("aria-hidden ancestors:", JSON.stringify(ariaHidden));
  }

  // 4. Any toast/notification overlays?
  const toast = await page.locator('[aria-label="Notifications"], [data-sonner-toaster]').count();
  console.log("toast containers:", toast);

  // 5. Try clicking with text locator
  const before = Date.now();
  await byText.first().click({ timeout: 10000 }).then(() => console.log("click byText OK in", Date.now() - before, "ms")).catch((e) => console.log("click byText FAIL:", e.message.split("\n")[0]));
  await page.waitForTimeout(1200);
  console.log("Dialogs after click:", await page.locator('[role="dialog"]').count());

  await browser.close();
})();
