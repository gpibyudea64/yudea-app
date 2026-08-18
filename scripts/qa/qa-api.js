/* QA: API endpoint matrix + RBAC permissions */
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

async function loginAs(browser, email, password) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes("login")) break;
  }
  return { ctx, page };
}

(async () => {
  const browser = await chromium.launch();

  // ── ADMIN: full endpoint matrix ─────────────────────────────
  const admin = await loginAs(browser, "admin@example.com", "admin123");
  record("ADMIN login", !admin.page.url().includes("login"));

  const endpoints = [
    ["GET", "/api/branch?page=1&limit=10", 200, "Branch list"],
    ["POST", "/api/branch", 201, "Branch create"],
    ["GET", "/api/region?page=1&limit=10", 200, "Region list"],
    ["GET", "/api/family?page=1&limit=10", 200, "Family list"],
    ["GET", "/api/member?page=1&limit=10", 200, "Member list"],
    ["GET", "/api/member/presbyter?page=1&limit=10", 200, "Presbyter list"],
    ["GET", "/api/attendance?page=1&limit=10", 200, "Attendance list"],
    ["GET", "/api/birthday", 200, "Birthday"],
    ["GET", "/api/report", 200, "Report"],
    ["GET", "/api/dashboard/counts", 200, "Dashboard counts"],
    ["GET", "/api/region/member-count", 200, "Region member count"],
    ["GET", "/api/settings/rbac", 200, "RBAC settings"],
    ["GET", "/api/user?page=1&limit=10", 200, "User list (admin)"],
    ["GET", "/api/family/count", 200, "Family count"],
    ["GET", "/api/region-indonesia/provinces", 200, "Provinces"],
    ["GET", "/api/region-indonesia/regencies?provinceCode=31", 200, "Regencies"],
    ["GET", "/api/region-indonesia/districts?regencyCode=3171", 200, "Districts"],
    ["GET", "/api/region-indonesia/villages?districtCode=3171010", 200, "Villages"],
  ];
  for (const [method, path, expected, label] of endpoints) {
    try {
      const opts = { method };
      if (method === "POST") {
        opts.headers = { "Content-Type": "application/json" };
        opts.data = { name: `QA-API-${Date.now() % 100000}` };
      }
      const resp = await admin.page.request.fetch(BASE + path, opts);
      record(`${label} (${method} ${path.split("?")[0]})`, resp.status() === expected, `status ${resp.status()} (expected ${expected})`);
    } catch (e) {
      record(`${label}`, false, e.message.split("\n")[0]);
    }
  }
  await admin.ctx.close();

  // ── STAFF: should NOT access user management ────────────────
  const staff = await loginAs(browser, "demo@example.com", "demo1234");
  record("STAFF login", !staff.page.url().includes("login"));
  const userResp = await staff.page.request.get(BASE + "/api/user?page=1&limit=10");
  record("STAFF blocked from /api/user (403/401)", userResp.status() === 403 || userResp.status() === 401, `status ${userResp.status()}`);
  const memberResp = await staff.page.request.get(BASE + "/api/member?page=1&limit=10");
  record("STAFF can access /api/member", memberResp.status() === 200, `status ${memberResp.status()}`);
  const rbacResp = await staff.page.request.put(BASE + "/api/settings/rbac", { data: { config: {} }, headers: { "Content-Type": "application/json" } });
  record("STAFF blocked from PUT /api/settings/rbac (403)", rbacResp.status() === 403, `status ${rbacResp.status()}`);
  // STAFF sidebar: no Users link
  await staff.page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" });
  await staff.page.waitForTimeout(2500);
  const staffBody = await staff.page.locator("body").innerText();
  record("STAFF sidebar hides Users", !staffBody.includes("User Management"), "has User Management? " + staffBody.includes("User Management"));
  // STAFF direct visit to /dashboard/users should show restricted/redirect
  await staff.page.goto(BASE + "/dashboard/users", { waitUntil: "domcontentloaded" });
  await staff.page.waitForTimeout(2500);
  const staffUsersBody = await staff.page.locator("body").innerText();
  record("STAFF cannot access Users page", !staffUsersBody.includes("Create accounts and assign"), staffUsersBody.slice(0, 120).replace(/\n/g, " "));
  await staff.ctx.close();

  // ── COORDINATOR: region scoping ─────────────────────────────
  const coord = await loginAs(browser, "coordinator-a@example.com", "coordinator123");
  record("COORDINATOR login", !coord.page.url().includes("login"));
  const coordMembers = await coord.page.request.get(BASE + "/api/member?page=1&limit=50");
  const coordData = await coordMembers.json().catch(() => null);
  const regionIds = coordData?.data?.map((m) => m.family?.regionId) ?? [];
  const allSameRegion = new Set(regionIds).size <= 1;
  record("COORDINATOR member list scoped to one region", coordMembers.status() === 200 && allSameRegion, `status ${coordMembers.status()}, distinct regions: ${new Set(regionIds).size}`);
  const usersResp = await coord.page.request.get(BASE + "/api/user?page=1&limit=10");
  record("COORDINATOR blocked from /api/user", usersResp.status() === 403 || usersResp.status() === 401, `status ${usersResp.status()}`);
  await coord.ctx.close();

  // ── Unauthenticated API access ──────────────────────────────
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  const anonResp = await anonPage.request.get(BASE + "/api/member?page=1&limit=10");
  record("Unauthenticated /api/member rejected (401)", anonResp.status() === 401, `status ${anonResp.status()}`);
  await anon.close();

  await browser.close();
  console.log(`\n===== API/RBAC SUMMARY: ${passed} passed, ${failed} failed =====`);
  process.exit(0);
})();
