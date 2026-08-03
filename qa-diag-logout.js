/* QA: verify logout flow precisely */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(15000);

  // Login
  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(800);
    if (!page.url().includes("login")) break;
  }
  console.log("After login:", page.url());

  // Open the user dropdown (avatar button - last button in header typically)
  const avatarBtn = page.locator("header button").last();
  console.log("Avatar button found:", await avatarBtn.count() > 0);
  await avatarBtn.click();
  await page.waitForTimeout(1000);

  // Find the Logout menu item
  const menuLogout = page.getByRole("menuitem", { name: /Logout/i });
  console.log("Logout menuitem visible:", await menuLogout.isVisible().catch(() => false));
  await menuLogout.click();
  await page.waitForTimeout(4000);
  console.log("After logout URL:", page.url());

  // Verify redirect
  const redirectedToLogin = page.url().includes("login");
  console.log("LOGOUT REDIRECTS TO LOGIN:", redirectedToLogin);

  // Verify session cleared - try visiting dashboard
  await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  console.log("Dashboard after logout redirects to login:", page.url().includes("login"), "|", page.url());

  await browser.close();
})();
