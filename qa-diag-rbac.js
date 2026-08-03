/* QA: verify coordinator RBAC scoping + STAFF access */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";

async function loginAs(browser, email, password) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(800);
    if (!page.url().includes("login")) break;
  }
  return { ctx, page };
}

(async () => {
  const browser = await chromium.launch();

  // STAFF role
  const staff = await loginAs(browser, "demo@example.com", "demo1234");
  console.log("\n=== STAFF (demo@example.com) ===");
  console.log("Login URL:", staff.page.url());
  // Members page should load (200 API) - but member API is broken; check status
  await staff.page.goto(BASE + "/dashboard/members", { waitUntil: "domcontentloaded" });
  await staff.page.waitForTimeout(2500);
  console.log("Staff /members h1:", await staff.page.locator("h1").first().innerText().catch(() => "N/A"));
  // Users page should be blocked
  await staff.page.goto(BASE + "/dashboard/users", { waitUntil: "domcontentloaded" });
  await staff.page.waitForTimeout(2500);
  const usersBody = await staff.page.locator("body").innerText().catch(() => "");
  console.log("Staff /users shows restricted:", /restricted|denied|unauthorized|tidak/i.test(usersBody), "| URL:", staff.page.url());

  // COORDINATOR role
  const coord = await loginAs(browser, "coordinator-a@example.com", "coordinator123");
  console.log("\n=== COORDINATOR (coordinator-a@example.com) ===");
  console.log("Login URL:", coord.page.url());
  await coord.page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await coord.page.waitForTimeout(2500);
  console.log("Coordinator /families h1:", await coord.page.locator("h1").first().innerText().catch(() => "N/A"));
  const famBody = await coord.page.locator("body").innerText().catch(() => "");
  console.log("Coordinator /families body sample:", famBody.slice(0, 200).replace(/\n/g, " "));
  // Settings should be blocked for coordinator
  await coord.page.goto(BASE + "/dashboard/settings", { waitUntil: "domcontentloaded" });
  await coord.page.waitForTimeout(2500);
  const setBody = await coord.page.locator("body").innerText().catch(() => "");
  console.log("Coordinator /settings restricted:", /restricted|denied|unauthorized|tidak/i.test(setBody), "| URL:", coord.page.url());

  // MEMBER role login attempt (demo members - use coordinator-b password?)
  const mem = await loginAs(browser, "coordinator-b@example.com", "coordinator123");
  console.log("\n=== COORDINATOR-B ===");
  console.log("Login URL:", mem.page.url());

  await browser.close();
})();
