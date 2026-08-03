/* QA: debug UI family form submission */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const TAG = `QA-UI-${Date.now().toString().slice(-6)}`;

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
  page.on("console", (m) => m.type() === "error" && console.log("CONSOLE ERR:", m.text().slice(0, 150)));
  page.on("pageerror", (e) => console.log("PAGE ERR:", e.message.slice(0, 200)));
  page.on("response", (r) => {
    if (r.url().includes("/api/family") && r.request().method() !== "GET") {
      console.log("FAMILY HTTP:", r.request().method(), r.status(), r.url().slice(-40));
    }
  });

  await login(page);
  console.log("logged in");

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

  // Indonesia cascade
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

  // Add member
  await page.getByRole("button", { name: /Add Member/i }).click();
  await page.waitForTimeout(700);
  const memberInputs = page.locator('input[placeholder="Nama Depan"]');
  console.log("member count:", await memberInputs.count());
  await memberInputs.first().fill(`${TAG} Head`);
  await page.locator('input[placeholder="Kota Lahir"]').first().fill("Jakarta");
  await page.locator('input[placeholder="Phone"]').first().fill("0812345678");
  // birthDate
  const dateInput = page.locator('input[placeholder="Nama Depan"]').first().locator("xpath=following::input[@type='date'][1]");
  await dateInput.fill("1985-05-10");
  await page.waitForTimeout(500);

  // Check form validity state before submit
  const invalidFields = await page.locator('input:invalid, select:invalid').count();
  console.log("invalid fields:", invalidFields);

  // Click Create
  await page.getByRole("button", { name: /^Create$/ }).click();
  await page.waitForTimeout(4000);

  const dialogStillOpen = await page.locator('[role="dialog"]').count();
  console.log("dialog still open after submit:", dialogStillOpen > 0);
  const body = await page.locator("body").innerText().catch(() => "");
  console.log("has error text:", /Gagal|Unable|error|wajib|harus/i.test(body));

  // Check for react-hook-form error messages
  const errorMsgs = await page.locator("p.text-red-500, p.text-sm.text-red-500").allInnerTexts().catch(() => []);
  console.log("RHF errors:", JSON.stringify(errorMsgs));

  // Check toast messages
  const toastText = await page.locator('[data-sonner-toast], [role="status"]').allInnerTexts().catch(() => []);
  console.log("toasts:", JSON.stringify(toastText));

  await browser.close();
})();
