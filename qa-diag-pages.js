/* QA diagnostic: inspect each dashboard page state + console errors */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const PAGES = [
  ["/dashboard", "Dashboard"],
  ["/dashboard/families", "Families"],
  ["/dashboard/members", "Members"],
  ["/dashboard/regions", "Regions"],
  ["/dashboard/attendance", "Attendance"],
  ["/dashboard/birthday", "Birthday"],
  ["/dashboard/presbytery", "Presbytery"],
  ["/dashboard/pelkat-members", "Pelkat"],
  ["/dashboard/branches", "Branches"],
  ["/dashboard/report", "Report"],
  ["/dashboard/users", "Users"],
  ["/dashboard/settings", "Settings"],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  const consoleErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`[${new Date().toISOString().slice(11, 19)}] ${msg.text().slice(0, 160)}`);
  });
  page.on("pageerror", (err) => consoleErrors.push(`PAGEERROR: ${err.message.slice(0, 160)}`));
  page.on("response", (res) => {
    if (res.status() >= 400) consoleErrors.push(`HTTP ${res.status()} ${res.url().replace(BASE, "")}`);
  });

  // Login
  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes("login")) break;
  }
  console.log("LOGGED IN:", page.url());

  for (const [path, label] of PAGES) {
    consoleErrors.length = 0; // reset per page
    await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3500);
    const url = page.url();
    const body = await page.locator("body").innerText().catch(() => "");
    const h1 = await page.locator("h1").first().innerText().catch(() => "(no h1)");
    const h2 = await page.locator("h2").first().innerText().catch(() => "");
    const buttons = await page.locator("button").allInnerTexts().catch(() => []);
    const createBtn = buttons.find((b) => /create|tambah|add/i.test(b.trim())) || "(none)";
    const errorText = body.match(/failed|error|terjadi|gagal|something went wrong/i)?.[0] ?? "";
    console.log(`\n=== ${label} (${path}) ===`);
    console.log(`  URL: ${url}`);
    console.log(`  h1: ${h1}`);
    console.log(`  h2: ${h2}`);
    console.log(`  Create btn: ${createBtn.trim().slice(0, 40)}`);
    console.log(`  body chars: ${body.length}`);
    console.log(`  error-ish text: ${errorText || "(none)"}`);
    console.log(`  console/HTTP errors: ${consoleErrors.length ? consoleErrors.slice(0, 4).join(" | ") : "(none)"}`);
  }

  // Logout flow
  console.log("\n=== LOGOUT ===");
  await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const avatar = page.locator("button").filter({ has: page.locator("svg") }).first();
  if (await avatar.count()) {
    await avatar.click();
    await page.waitForTimeout(800);
    const logoutItem = page.locator("text=Logout").first();
    console.log("Logout menu item visible:", await logoutItem.isVisible().catch(() => false));
    await logoutItem.click().catch(() => {});
    await page.waitForTimeout(3000);
    console.log("After logout URL:", page.url());
  } else {
    console.log("Avatar button not found");
  }

  await browser.close();
})();
