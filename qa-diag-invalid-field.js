/* QA: identify which family form field is invalid */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const TAG = `QA-INV-${Date.now().toString().slice(-6)}`;

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
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  await login(page);
  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Create Family/i }).click();
  await page.waitForTimeout(1500);

  await page.fill("#familyName", `${TAG} Family`);
  await page.click("#regionId");
  await page.waitForTimeout(700);
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(500);
  await page.fill("#address", "Jl. UI Test 1");

  await page.click("#provinsi");
  await page.waitForTimeout(700);
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(800);
  await page.click("#kotaKabupaten");
  await page.waitForTimeout(700);
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(800);
  await page.click("#kecamatan");
  await page.waitForTimeout(700);
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(800);
  await page.click("#kelurahan");
  await page.waitForTimeout(700);
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(600);

  await page.getByRole("button", { name: /Add Member/i }).click();
  await page.waitForTimeout(700);

  // Fill member fields
  await page.locator('input[placeholder="Nama Depan"]').first().fill(`${TAG} Head`);
  await page.locator('input[placeholder="Nama Belakang"]').first().fill("Test");
  await page.locator('input[placeholder="Kota Lahir"]').first().fill("Jakarta");
  await page.locator('input[placeholder="Phone"]').first().fill("0812345678");
  const dateInput = page.locator('input[placeholder="Nama Depan"]').first().locator("xpath=following::input[@type='date'][1]");
  await dateInput.fill("1985-05-10");
  await page.waitForTimeout(500);

  // Identify invalid inputs
  const details = await page.evaluate(() => {
    const invalids = Array.from(document.querySelectorAll("input:invalid, select:invalid, textarea:invalid"));
    return invalids.map((el) => ({
      id: el.id,
      placeholder: el.placeholder || "",
      type: el.type || "",
      name: el.name || "",
      value: el.value,
      validationMessage: el.validationMessage,
    }));
  });
  console.log("INVALID FIELDS:", JSON.stringify(details, null, 2));

  // Also inspect the selected values of key selects
  const selState = await page.evaluate(() => {
    const pick = (id) => {
      const el = document.getElementById(id);
      return el ? el.textContent : null;
    };
    return {
      provinsi: pick("provinsi"),
      kotaKabupaten: pick("kotaKabupaten"),
      kecamatan: pick("kecamatan"),
      kelurahan: pick("kelurahan"),
      regionId: pick("regionId"),
    };
  });
  console.log("SELECT STATE:", JSON.stringify(selState));

  await browser.close();
})();
