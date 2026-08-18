/* QA: test family create via API and UI form */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const TAG = `QA-POST-${Date.now().toString().slice(-6)}`;

async function login(page) {
  await page.goto(BASE + "/public/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes("login")) return true;
  }
  return false;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  page.on("console", (m) => m.type() === "error" && console.log("CONSOLE ERR:", m.text().slice(0, 150)));
  page.on("pageerror", (e) => console.log("PAGE ERR:", e.message.slice(0, 150)));

  await login(page);
  console.log("logged in");

  // ── 1. API-level POST test ──
  const regions = await (await page.request.get(BASE + "/api/region?page=1&limit=5")).json();
  const regionId = regions.data[0].id;
  console.log("using region:", regionId);

  const apiResp = await page.request.post(BASE + "/api/family", {
    data: {
      familyName: `${TAG} API Family`,
      address: "Jl. API Test 1",
      provinsi: "DKI Jakarta",
      kotaKabupaten: "Jakarta Pusat",
      kecamatan: "Menteng",
      kelurahan: "Gondangdia",
      regionId,
      members: [
        {
          firstName: `${TAG} Head`,
          lastName: "API",
          birthCity: "Jakarta",
          gender: "MALE",
          birthDate: "1985-05-10",
          phone: "08123456",
          role: "FAMILY_HEAD",
          childNumber: 0,
          sameAddressAsFamily: true,
          isActive: true,
          isDeceased: false,
        },
      ],
    },
  });
  console.log("API POST status:", apiResp.status());
  const apiBody = await apiResp.text();
  console.log("API POST body:", apiBody.slice(0, 200));

  // ── 2. UI form test with detailed logging ──
  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Create Family/i }).click();
  await page.waitForTimeout(1500);

  await page.fill("#familyName", `${TAG} UI Family`);
  // region select
  await page.click("#regionId");
  await page.waitForTimeout(700);
  const firstOption = page.locator('[role="option"]').first();
  console.log("region options:", await page.locator('[role="option"]').count());
  await firstOption.click();
  await page.waitForTimeout(500);

  await page.fill("#address", "Jl. UI Test 1");
  // province cascade
  await page.click("#provinsi");
  await page.waitForTimeout(700);
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(700);
  await page.click("#kotaKabupaten");
  await page.waitForTimeout(700);
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(700);
  await page.click("#kecamatan");
  await page.waitForTimeout(700);
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(700);
  await page.click("#kelurahan");
  await page.waitForTimeout(700);
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(500);

  // Add member
  await page.getByRole("button", { name: /Add Member/i }).click();
  await page.waitForTimeout(600);
  await page.locator('input[placeholder="Nama Depan"]').first().fill(`${TAG} Head`);
  await page.locator('input[placeholder="Nama Depan"]').first().locator("xpath=following::input[@type='date'][1]").fill("1985-05-10");
  await page.locator('input[placeholder="Kota Lahir"]').first().fill("Jakarta");
  await page.locator('input[placeholder="Phone"]').first().fill("081234");

  // Submit
  await page.getByRole("button", { name: /^Create$/ }).click();
  await page.waitForTimeout(4000);

  // Check for toast/error
  const body = await page.locator("body").innerText().catch(() => "");
  console.log("After submit - has error toast:", /Gagal|Unable|error|harus/i.test(body));
  console.log("After submit body tail:", body.slice(-300).replace(/\n/g, " | "));

  await browser.close();
})();
