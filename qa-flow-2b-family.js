/* QA Phase 2b: Family + Member complex flows */
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const TS = Date.now().toString().slice(-6);
const TAG = `QA-FAM-${TS}`;
const results = [];
let passed = 0;
let failed = 0;

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  ok ? passed++ : failed++;
  console.log(`${ok ? "✅ PASS" : "❌ FAIL"} | ${name}${detail ? " | " + detail : ""}`);
}

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

async function robustClick(page, locator) {
  try {
    await locator.click({ timeout: 10000 });
  } catch (e) {
    try {
      await locator.click({ force: true, timeout: 10000 });
    } catch (e2) {
      await locator.dispatchEvent("click");
    }
  }
}

async function pickOption(page, triggerId, index = 0) {
  await page.click(`#${triggerId}`);
  await page.waitForTimeout(800);
  const opts = page.locator('[role="option"]');
  const n = await opts.count();
  if (n === 0) {
    await page.keyboard.press("Escape");
    return null;
  }
  const text = (await opts.nth(Math.min(index, n - 1)).innerText()).trim();
  await opts.nth(Math.min(index, n - 1)).click();
  await page.waitForTimeout(800);
  return text;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(90000);
  page.on("dialog", (d) => d.accept());
  const consoleErrors = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 160)));
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message.slice(0, 160)));

  record("Admin login", await login(page));

  // ── CREATE FAMILY with 2 nested members ─────────────────────
  const famName = `${TAG} Family`;
  const headName = `${TAG} Head`;
  const childName = `${TAG} Child`;
  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await robustClick(page, page.getByRole("button", { name: /Create Family/i }));
  await page.waitForTimeout(1500);
  await page.fill("#familyName", famName);
  const region = await pickOption(page, "regionId", 0);
  record("Region select works", !!region, region || "no options");
  await page.fill("#address", `Jl. QA Test ${TS}`);
  // Indonesia region cascades (provinsi -> kota -> kecamatan -> kelurahan)
  const prov = await pickOption(page, "provinsi", 0);
  record("Provinsi select", !!prov, prov || "");
  const kota = await pickOption(page, "kotaKabupaten", 0);
  record("Kota/Kabupaten select (cascade)", !!kota, kota || "");
  const kec = await pickOption(page, "kecamatan", 0);
  record("Kecamatan select (cascade)", !!kec, kec || "");
  const kel = await pickOption(page, "kelurahan", 0);
  record("Kelurahan select (cascade)", !!kel, kel || "");
  // Add 2 members
  await robustClick(page, page.getByRole("button", { name: /Add Member/i }));
  await page.waitForTimeout(600);
  await page.locator('input[placeholder="Nama Depan"]').first().fill(headName);
  await page.locator('input[placeholder="Nama Depan"]').first().locator("xpath=following::input[@type='date'][1]").fill("1985-05-10");
  // Set member 1's role to Kepala Keluarga (FAMILY_HEAD) via the UI select.
  // New members default to role CHILD, so the trigger shows "Anak".
  const roleTrigger = page.locator('[role="dialog"] button', { hasText: /^Anak$/ }).first();
  if ((await roleTrigger.count()) > 0) {
    await robustClick(page, roleTrigger);
    await page.waitForTimeout(600);
    await robustClick(page, page.locator('[role="option"]', { hasText: "Kepala Keluarga" }).first());
    await page.waitForTimeout(500);
  }
  await robustClick(page, page.getByRole("button", { name: /Add Member/i }));
  await page.waitForTimeout(600);
  await page.locator('input[placeholder="Nama Depan"]').nth(1).fill(childName);
  await page.locator('input[placeholder="Nama Depan"]').nth(1).locator("xpath=following::input[@type='date'][1]").fill("2012-03-20");
  await robustClick(page, page.getByRole("button", { name: /^Create$/ }));
  await page.waitForTimeout(4000);
  record("Family created with 2 members (POST)", page.url().includes("families"));

  // Verify via API
  const famResp = await page.request.get(`${BASE}/api/family?page=1&limit=50&search=${encodeURIComponent(TAG)}`);
  const famData = await famResp.json();
  const createdFam = famData.data?.find((f) => f.familyName === famName);
  record("Family persisted with region data", !!createdFam && !!createdFam.provinsi && !!createdFam.kelurahan, createdFam ? `${createdFam.provinsi}/${createdFam.kotaKabupaten}/${createdFam.kecamatan}/${createdFam.kelurahan}` : "not found");
  record("Family has 2 members", createdFam?.members?.length === 2, `members: ${createdFam?.members?.length}`);
  const headMember = createdFam?.members?.find((m) => m.firstName === headName) ?? createdFam?.members?.[0];
  record("Head member has role FAMILY_HEAD (via dialog select)", headMember?.role === "FAMILY_HEAD", `role: ${headMember?.role}`);

  // ── MEMBER appears in members list ──────────────────────────
  await page.goto(BASE + "/dashboard/members", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Cari"]').first();
  await searchInput.fill(headName);
  await page.waitForTimeout(3000);
  const bodyText = await page.locator("body").innerText();
  record("Member created appears in members list", bodyText.includes(headName));

  // ── EDIT MEMBER via member dialog ───────────────────────────
  const editBtn = page.getByRole("button", { name: /Edit/ }).first();
  await robustClick(page, editBtn);
  await page.waitForTimeout(1500);
  await page.fill("#lastName", `${TAG} Edited`);
  // The member dialog submit button is labelled "Simpan" in the Indonesian UI
  await robustClick(page, page.getByRole("button", { name: /^Simpan$/ }));
  await page.waitForTimeout(3000);
  const updResp = await page.request.get(`${BASE}/api/member?page=1&limit=10&search=${encodeURIComponent(headName)}`);
  const updData = await updResp.json();
  const updMember = updData.data?.find((m) => m.firstName === headName);
  record("Member updated via dialog (PATCH)", updMember?.lastName === `${TAG} Edited`, `lastName: ${updMember?.lastName}`);

  // ── FAMILY STATUS CASCADE (set inactive → members inactive) ─
  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const famSearch = page.locator('input[placeholder*="Search"], input[placeholder*="Cari"]').first();
  await famSearch.fill(famName);
  await page.waitForTimeout(2500);
  const statusBadge = page.getByRole("button").filter({ hasText: /Aktif/ }).first();
  await robustClick(page, statusBadge);
  await page.waitForTimeout(1200);
  // Select "Tidak Aktif" in the status dialog
  const statusSelect = page.locator('[role="dialog"] button:has-text("Aktif"), [role="dialog"] [role="combobox"]').first();
  await robustClick(page, statusSelect);
  await page.waitForTimeout(800);
  await robustClick(page, page.locator('[role="option"]', { hasText: "Tidak Aktif" }).first());
  await page.waitForTimeout(600);
  await robustClick(page, page.locator('[role="dialog"] button:has-text("Simpan")'));
  await page.waitForTimeout(3000);
  const cascadeResp = await page.request.get(`${BASE}/api/member?page=1&limit=10&search=${encodeURIComponent(TAG)}`);
  const cascadeData = await cascadeResp.json();
  const cascadeMembers = cascadeData.data?.filter((m) => m.firstName === headName || m.firstName === childName) ?? [];
  record("Family status cascade deactivates all members", cascadeMembers.length === 2 && cascadeMembers.every((m) => m.isActive === false), `active flags: ${cascadeMembers.map((m) => `${m.firstName}:${m.isActive}`).join(",")}`);

  // ── SPLIT FAMILY ────────────────────────────────────────────
  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await famSearch.fill(famName);
  await page.waitForTimeout(2500);
  const pisahBtn = page.getByRole("button", { name: /Pisah/i }).first();
  await robustClick(page, pisahBtn);
  await page.waitForTimeout(1500);
  // Dialog: pre-filled family name; create new family with all members moved
  await robustClick(page, page.locator('[role="dialog"] button:has-text("Buat Keluarga Baru")'));
  await page.waitForTimeout(4000);
  const splitResp = await page.request.get(`${BASE}/api/family?page=1&limit=50&search=${encodeURIComponent(TAG)}`);
  const splitData = await splitResp.json();
  const splitFamilies = splitData.data?.filter((f) => f.familyName.includes(TAG) || f.familyName.includes("QA-FAM")) ?? [];
  record("Split family created 2nd family", splitFamilies.length === 2, `families: ${splitFamilies.map((f) => f.familyName).join(" | ")}`);
  const splitMemberResp = await page.request.get(`${BASE}/api/member?page=1&limit=50&search=${encodeURIComponent(TAG)}`);
  const splitMemberData = await splitMemberResp.json();
  const headNow = splitMemberData.data?.find((m) => m.firstName === headName);
  record("Split promotes member to FAMILY_HEAD", headNow?.role === "FAMILY_HEAD" && headNow?.family?.id !== createdFam?.id, `role: ${headNow?.role}, moved: ${headNow?.family?.id !== createdFam?.id}`);

  // ── DELETE FAMILIES (cleanup) ───────────────────────────────
  await page.goto(BASE + "/dashboard/families", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await famSearch.fill(TAG);
  await page.waitForTimeout(2500);
  const delButtons = page.getByRole("button", { name: /Delete/ });
  const delCount = await delButtons.count();
  for (let i = 0; i < Math.min(delCount, 2); i++) {
    await robustClick(page, delButtons.first());
    await page.waitForTimeout(2500);
  }
  const afterDel = await page.request.get(`${BASE}/api/family?page=1&limit=50&search=${encodeURIComponent(TAG)}`);
  const afterDelData = await afterDel.json();
  record("QA families deleted (cleanup)", (afterDelData.data ?? []).length === 0, `remaining: ${afterDelData.data?.length}`);
  const memberCheck = await page.request.get(`${BASE}/api/member?page=1&limit=50&search=${encodeURIComponent(TAG)}`);
  const memberCheckData = await memberCheck.json();
  record("QA members deleted with families (cascade)", (memberCheckData.data ?? []).length === 0, `remaining: ${memberCheckData.data?.length}`);

  record("No console errors in family flows", consoleErrors.length === 0, consoleErrors.slice(0, 4).join(" || "));

  await browser.close();
  console.log(`\n===== PHASE 2b SUMMARY: ${passed} passed, ${failed} failed (tag: ${TAG}) =====`);
  process.exit(failed > 0 ? 1 : 0);
})();
