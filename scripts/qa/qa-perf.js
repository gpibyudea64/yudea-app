const { chromium } = require("playwright");

const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes("login")) break;
  }

  const endpoints = [
    "/api/family?page=1&limit=10&sortBy=familyName&sortOrder=asc",
    "/api/member?page=1&limit=10",
    "/api/region?page=1&limit=10",
    "/api/branch?page=1&limit=10",
    "/api/attendance?page=1&limit=10",
    "/api/dashboard/counts",
    "/api/region/member-count",
    "/api/birthday",
    "/api/settings/rbac",
  ];

  for (const ep of endpoints) {
    const times = [];
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      const resp = await page.request.get(BASE + ep);
      const ms = Date.now() - start;
      times.push(`${resp.status()}:${ms}ms`);
    }
    console.log(`${ep}  →  ${times.join("  ")}`);
  }

  // Sequential dashboard page loads (fresh navigations)
  for (const path of ["/dashboard", "/dashboard/members", "/dashboard/families"]) {
    const start = Date.now();
    await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    console.log(`PAGE ${path} → ${Date.now() - start}ms (incl 2.5s buffer)`);
  }

  await browser.close();
})();
