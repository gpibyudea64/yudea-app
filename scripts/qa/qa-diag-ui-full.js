/* QA: full family creation via UI with valid member data */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const TAG = `QA-FULL-${Date.now().toString().slice(-6)}`;

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

async function pickOption(page, id, index = 0) {
  await page.click(`#${id}`);
  await page.waitForTimeout(700);
  const opts = page.locator('[role="option"]');
  const opt = opts.nth(index);
  const text = (await opt.innerText().catch(() => "")).trim();
  await opt.click().catch(async () => {
    await opts.first().click();
  });
  await page.waitForTimeout(500);
  return text;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  page.on("pageerror", (e) => console.log("PAGE ERR:", e.message.slice(0, 150)));
  page.on("response", (r) => {
    if (r.url().includes("/api/family") && r.request().method() === "POST") {
      console.log("FAMILY POST →", r.status());
    }
  });

  await login(page);
  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Create Family/i }).click();
  await page.waitForTimeout(1500);

  await page.fill("#familyName", `${TAG} Family`);
  await pickOption(page, "regionId", 0);
  await page.fill("#address", "Jl. Full Test 1");

  const prov = await pickOption(page, "provinsi", 0);
  console.log("provinsi:", prov);
  const kota = await pickOption(page, "kotaKabupaten", 0);
  console.log("kota:", kota);
  const kec = await pickOption(page, "kecamatan", 0);
  console.log("kecamatan:", kec);
  const kel = await pickOption(page, "kelurahan", 0);
  console.log("kelurahan:", kel);

  // Add member and set role to FAMILY_HEAD (avoid CHILD childNumber trap)
  await page.getByRole("button", { name: /Add Member/i }).click();
  await page.waitForTimeout(700);

  // Set role: open the role select (second select in member block: gender, role)
  const roleTrigger = page.locator("form [role='combobox']").nth(1);
  await roleTrigger.click();
  await page.waitForTimeout(700);
  await page.locator('[role="option"]').filter({ hasText: /Kepala Keluarga|FAMILY_HEAD/i }).first().click();
  await page.waitForTimeout(400);

  await page.locator('input[placeholder="Nama Depan"]').first().fill(`${TAG} Head`);
  await page.locator('input[placeholder="Nama Belakang"]').first().fill("Full");
  await page.locator('input[placeholder="Kota Lahir"]').first().fill("Jakarta");
  await page.locator('input[placeholder="Phone"]').first().fill("0812345678");
  const dateInput = page.locator('input[placeholder="Nama Depan"]').first().locator("xpath=following::input[@type='date'][1]");
  await dateInput.fill("1985-05-10");
  await page.waitForTimeout(500);

  const invalid = await page.locator("input:invalid").count();
  console.log("invalid fields before submit:", invalid);

  await page.getByRole("button", { name: /^Create$/ }).click();
  await page.waitForTimeout(4000);

  const dialogOpen = await page.locator('[role="dialog"]').count();
  console.log("dialog still open:", dialogOpen > 0);
  const body = await page.locator("body").innerText().catch(() => "");
  console.log("toast/success:", /Saved successfully|Disimpan/i.test(body) ? "SUCCESS TOAST" : "no success toast");
  const toasts = await page.locator('[data-sonner-toast]').allInnerTexts().catch(() => []);
  console.log("toasts:", JSON.stringify(toasts));

  await browser.close();
})();
