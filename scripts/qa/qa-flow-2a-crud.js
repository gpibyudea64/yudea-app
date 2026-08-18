/* QA Phase 2a: CRUD flows (branch, region, attendance, user) */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const TS = Date.now().toString().slice(-6);
const TAG = `QA-TEST-${TS}`;
const results = [];
let passed = 0;
let failed = 0;

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  ok ? passed++ : failed++;
  console.log(`${ok ? "✅ PASS" : "❌ FAIL"} | ${name}${detail ? " | " + detail : ""}`);
}

async function login(page, email = "admin@example.com", password = "admin123") {
  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.fill("#email", email).catch(() => {});
  await page.fill("#password", password).catch(() => {});
  await page.click('button[type="submit"]');
  // Poll until navigated away from login (up to 30s)
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes("login")) return true;
  }
  return false;
}

async function pickSelect(page, triggerId, optionText) {
  await page.click(`#${triggerId}`);
  await page.waitForTimeout(700);
  const option = page
    .locator('[role="option"]')
    .filter({ hasText: optionText })
    .first();
  await option.click().catch(async () => {
    await page.locator(`[role="listbox"] >> text=${optionText}`).first().click();
  });
  await page.waitForTimeout(500);
}

async function searchFor(page, path, term) {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const input = page.locator('input[placeholder*="Search"], input[placeholder*="Cari"]').first();
  if ((await input.count()) > 0) {
    await input.fill(term);
    await page.waitForTimeout(2500);
  }
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(90000);
  const consoleErrors = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 160)));
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message.slice(0, 160)));
  page.on("dialog", (d) => d.accept());

  const loggedIn = await login(page);
  record("Admin login", loggedIn);

  // ── BRANCH CRUD ─────────────────────────────────────────────
  const branchName = `${TAG} Branch`;
  const branchName2 = `${TAG} Branch Renamed`;
  await page.goto(BASE + "/dashboard/branches", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Create Branch/i }).click();
  await page.waitForTimeout(1000);
  await page.fill("#branchName", branchName);
  await page.getByRole("button", { name: /^Create$/ }).click();
  await page.waitForTimeout(2500);
  record("Branch created (POST)", page.url().includes("branches"));
  await searchFor(page, "/dashboard/branches", branchName);
  record("Branch appears in list", (await page.locator("body").innerText()).includes(branchName));
  // Edit
  const editBtn = page.getByRole("button", { name: /Edit/ }).first();
  if ((await editBtn.count()) > 0) {
    await editBtn.click();
    await page.waitForTimeout(1000);
    await page.fill("#branchName", branchName2);
    await page.getByRole("button", { name: /^Update$/ }).click();
    await page.waitForTimeout(2500);
    await searchFor(page, "/dashboard/branches", branchName2);
    record("Branch updated (PATCH)", (await page.locator("body").innerText()).includes(branchName2));
  } else {
    record("Branch edit button found", false);
  }
  // Delete
  const delBtn = page.getByRole("button", { name: /Delete/ }).first();
  if ((await delBtn.count()) > 0) {
    await delBtn.click();
    await page.waitForTimeout(2500);
    await searchFor(page, "/dashboard/branches", branchName2);
    record("Branch deleted (DELETE)", !(await page.locator("body").innerText()).includes(branchName2));
  } else {
    record("Branch delete button found", false);
  }

  // ── REGION CRUD ─────────────────────────────────────────────
  const regionName = `${TAG} Region`;
  const regionName2 = `${TAG} Region Renamed`;
  await page.goto(BASE + "/dashboard/regions", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Create Sektor/i }).click();
  await page.waitForTimeout(1200);
  await page.fill("#regionName", regionName);
  // Select a branch (first option)
  await pickSelect(page, "branchId", "Central Branch");
  await page.getByRole("button", { name: /^Create$/ }).click();
  await page.waitForTimeout(2500);
  record("Region created (POST)", page.url().includes("regions"));
  await searchFor(page, "/dashboard/regions", regionName);
  record("Region appears in list", (await page.locator("body").innerText()).includes(regionName));
  const rEdit = page.getByRole("button", { name: /Edit/ }).first();
  if ((await rEdit.count()) > 0) {
    await rEdit.click();
    await page.waitForTimeout(1200);
    await page.fill("#regionName", regionName2);
    await page.getByRole("button", { name: /^Update$/ }).click();
    await page.waitForTimeout(2500);
    await searchFor(page, "/dashboard/regions", regionName2);
    record("Region updated (PATCH)", (await page.locator("body").innerText()).includes(regionName2));
  } else {
    record("Region edit button found", false);
  }
  const rDel = page.getByRole("button", { name: /Delete/ }).first();
  if ((await rDel.count()) > 0) {
    await rDel.click();
    await page.waitForTimeout(2500);
    await searchFor(page, "/dashboard/regions", regionName2);
    record("Region deleted (DELETE)", !(await page.locator("body").innerText()).includes(regionName2));
  } else {
    record("Region delete button found", false);
  }

  // ── ATTENDANCE CRUD ─────────────────────────────────────────
  const serviceType = `${TAG} Service`;
  const serviceType2 = `${TAG} Service Renamed`;
  await page.goto(BASE + "/dashboard/attendance", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Create Attendance/i }).click();
  await page.waitForTimeout(1200);
  await page.fill("#serviceDate", "2026-08-10T09:00");
  await page.fill("#serviceType", serviceType);
  await page.fill("#maleCount", "12");
  await page.fill("#femaleCount", "8");
  await page.getByRole("button", { name: /^Create$/ }).click();
  await page.waitForTimeout(2500);
  record("Attendance created (POST)", page.url().includes("attendance"));
  await searchFor(page, "/dashboard/attendance", serviceType);
  record("Attendance appears in list", (await page.locator("body").innerText()).includes(serviceType));
  const aEdit = page.getByRole("button", { name: /Edit/ }).first();
  if ((await aEdit.count()) > 0) {
    await aEdit.click();
    await page.waitForTimeout(1200);
    await page.fill("#serviceType", serviceType2);
    await page.getByRole("button", { name: /^Update$/ }).click();
    await page.waitForTimeout(2500);
    await searchFor(page, "/dashboard/attendance", serviceType2);
    record("Attendance updated (PATCH)", (await page.locator("body").innerText()).includes(serviceType2));
  } else {
    record("Attendance edit button found", false);
  }
  const aDel = page.getByRole("button", { name: /Delete/ }).first();
  if ((await aDel.count()) > 0) {
    await aDel.click();
    await page.waitForTimeout(2500);
    await searchFor(page, "/dashboard/attendance", serviceType2);
    record("Attendance deleted (DELETE)", !(await page.locator("body").innerText()).includes(serviceType2));
  } else {
    record("Attendance delete button found", false);
  }

  // ── USER CRUD (admin only) ──────────────────────────────────
  const userEmail = `qa-${TS}@example.com`;
  await page.goto(BASE + "/dashboard/users", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Add User/i }).click();
  await page.waitForTimeout(1200);
  await page.fill("#userName", `${TAG} User`);
  await page.fill("#userEmail", userEmail);
  await page.fill("#userPassword", "QaPass123!");
  await page.getByRole("button", { name: /^Create$/ }).click();
  await page.waitForTimeout(2500);
  record("User created (POST)", page.url().includes("users"));
  await searchFor(page, "/dashboard/users", userEmail);
  record("User appears in list", (await page.locator("body").innerText()).includes(userEmail));
  const uDel = page.getByRole("button", { name: /Delete/ }).first();
  if ((await uDel.count()) > 0) {
    await uDel.click();
    await page.waitForTimeout(2500);
    await searchFor(page, "/dashboard/users", userEmail);
    record("User deleted (DELETE)", !(await page.locator("body").innerText()).includes(userEmail));
  } else {
    record("User delete button found", false);
  }

  record("No console errors during CRUD", consoleErrors.length === 0, consoleErrors.slice(0, 4).join(" || "));

  await browser.close();
  console.log(`\n===== PHASE 2a SUMMARY: ${passed} passed, ${failed} failed (tag: ${TAG}) =====`);
  process.exit(failed > 0 ? 1 : 0);
})();
