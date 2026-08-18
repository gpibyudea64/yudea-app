import { chromium } from "@playwright/test";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const regionResponses: string[] = [];
  const consoleErrors: string[] = [];
  page.on("response", (res) => {
    if (res.url().includes("/api/region-indonesia")) {
      regionResponses.push(`${res.status()} ${res.url().replace("http://localhost:3000", "")}`);
    }
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto("http://localhost:3000/public/login");
  await page.waitForSelector("#email", { timeout: 60000 });
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 60000 });

  await page.goto("http://localhost:3000/dashboard/families");
  await page.waitForSelector("h1", { timeout: 60000 });
  await page.getByRole("button", { name: "Create Family" }).first().click();
  await page.waitForSelector("#provinsi", { timeout: 15000 });

  // Select province "Aceh"
  await page.locator("#provinsi").click();
  await page.getByRole("option", { name: "Aceh" }).click();
  await page.waitForTimeout(2000);

  // Check regencies dropdown now has options
  await page.locator("#kotaKabupaten").click();
  await page.waitForTimeout(800);
  const regencyOptions = await page.locator('[role="option"]').allTextContents();
  console.log("regencies after selecting Aceh:", JSON.stringify(regencyOptions.slice(0, 4)), "total:", regencyOptions.length);

  // Select a regency -> districts
  const regencyToPick = regencyOptions[0];
  if (regencyToPick) {
    await page.getByRole("option", { name: regencyToPick, exact: true }).click();
    await page.waitForTimeout(2000);
    await page.locator("#kecamatan").click();
    await page.waitForTimeout(800);
    const districtOptions = await page.locator('[role="option"]').allTextContents();
    console.log("districts after selecting regency:", districtOptions.length, "first:", districtOptions[0]);
  }

  console.log("region-indonesia API responses:", regionResponses);
  console.log("console errors:", consoleErrors.slice(0, 5));
  await browser.close();
}

main().catch((e) => {
  console.error("REPRO FAILED:", e.message);
  process.exit(1);
});
