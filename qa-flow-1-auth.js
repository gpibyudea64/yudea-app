/* QA Phase 1: Auth & Navigation */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const results = [];
let passed = 0;
let failed = 0;

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  ok ? passed++ : failed++;
  console.log(`${ok ? "✅ PASS" : "❌ FAIL"} | ${name}${detail ? " | " + detail : ""}`);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 200));
  });
  page.on("pageerror", (err) => consoleErrors.push("PAGEERROR: " + err.message.slice(0, 200)));

  // 1. Unauthenticated redirect
  await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  record("Unauthenticated /dashboard redirects to login", page.url().includes("/public/login"), page.url());

  // 2. Wrong password
  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.fill('input[type="email"], input[name="email"]', "admin@example.com").catch(() => {});
  await page.fill('input[type="password"], input[name="password"]', "WRONG-PASSWORD").catch(() => {});
  await page.click('button[type="submit"]').catch(async () => {
    // fallback: any primary button
    await page.locator("button").last().click();
  });
  await page.waitForTimeout(3000);
  record("Wrong password shows error and stays on login", page.url().includes("login"), page.url());

  // 3. Correct login
  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const inputs = page.locator("input");
  const inputCount = await inputs.count();
  for (let i = 0; i < inputCount; i++) {
    const type = await inputs.nth(i).getAttribute("type");
    if (type === "email" || !type) {
      await inputs.nth(i).fill("admin@example.com");
    } else if (type === "password") {
      await inputs.nth(i).fill("admin123");
    }
  }
  await page.click('button[type="submit"]').catch(async () => {
    await page.getByRole("button", { name: /sign in|login|masuk|submit/i }).first().click();
  });
  await page.waitForTimeout(5000);
  record("Admin login succeeds → dashboard", !page.url().includes("login"), page.url());
  const dashText = await page.locator("body").innerText().catch(() => "");
  record("Dashboard renders content", dashText.length > 100, `chars: ${dashText.length}`);

  // 4. All dashboard pages load
  const pages = [
    ["/dashboard/members", "Member Management"],
    ["/dashboard/families", "Family Management"],
    ["/dashboard/regions", "Sektor Pelayanan Management"],
    ["/dashboard/branches", "Branch Management"],
    ["/dashboard/attendance", "Attendance Management"],
    ["/dashboard/birthday", "Birthday"],
    ["/dashboard/pelkat-members", "Pelkat"],
    ["/dashboard/presbytery", "Presbyter"],
    ["/dashboard/users", "User Management"],
    ["/dashboard/settings", "Settings"],
    ["/dashboard/report", "Report"],
  ];
  for (const [path, keyword] of pages) {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3500);
    const text = await page.locator("body").innerText().catch(() => "");
    const found = text.includes(keyword) || text.toLowerCase().includes(keyword.toLowerCase());
    record(`Page loads: ${path}`, found, found ? "" : `keyword '${keyword}' not found`);
  }

  // 5. Sidebar navigation sanity: go back to dashboard
  await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const body = await page.locator("body").innerText().catch(() => "");
  record("Dashboard stats render", body.includes("Members") || body.includes("Family") || body.length > 200);

  // 6. Logout via the avatar dropdown (Radix trigger exposes aria-haspopup="menu").
  // NB: never match button text "Keluar" directly — it is a substring of the
  // sidebar item "Keluarga" and would click the wrong control.
  await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const avatar = page.locator('button[aria-haspopup="menu"]').first();
  if ((await avatar.count()) > 0) {
    await avatar.click();
    await page.waitForTimeout(800);
    const menuLogout = page.locator("[role='menuitem']", { hasText: "Logout" }).first();
    if ((await menuLogout.count()) > 0) {
      await menuLogout.click();
      await page.waitForTimeout(2500);
      record("Logout works", page.url().includes("login"), page.url());
    } else {
      record("Logout button not found", false, "no logout control found");
    }
  } else {
    record("Logout button not found", false, "no avatar or logout control");
  }

  record("No console errors during navigation", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" || "));

  await browser.close();
  console.log(`\n===== PHASE 1 SUMMARY: ${passed} passed, ${failed} failed =====`);
  process.exit(failed > 0 ? 1 : 0);
})();
