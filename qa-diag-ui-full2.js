/* QA: full family creation via UI (v2) */
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
  await opt.click().catch(async () => opts.first().click());
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

  await pickOption(page, "provinsi", 0);
  await pickOption(page, "kotaKabupaten", 0);
  await pickOption(page, "kecamatan", 0);
  await pickOption(page, "kelurahan", 0);

  // Add member
  await page.getByRole("button", { name: /Add Member/i }).click();
  await page.waitForTimeout(700);

  // List all comboboxes inside the dialog to identify role select
  const combos = await page.locator('[role="combobox"]').allInnerTexts();
  console.log("comboboxes:", JSON.stringify(combos));

  // The member block: first combobox is Gender, second is Role. Open the Role one.
  const roleCombo = page.locator('[role="combobox"]').nth(1);
  await roleCombo.click();
  await page.waitForTimeout(700);
  const opts = page.locator('[role="option"]');
  console.log("role options:", await opts.allInnerTexts());
  await opts.filter({ hasText: "Kepala Keluarga" }).first().click();
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
  const toasts = await page.locator('[data-sonner-toast]').allInnerTexts().catch(() => []);
  console.log("toasts:", JSON.stringify(toasts));

  await browser.close();
})();
