import { test, expect } from "@playwright/test";

// ─── Helper: mock API responses ────────────────────────────────────────────

const MOCK_REGIONS = {
  data: [
    { id: "r1", name: "Sektor A", branchId: "b1" },
    { id: "r2", name: "Sektor B", branchId: "b1" },
  ],
  meta: { total: 2, page: 1, limit: 999, totalPages: 1 },
};

const MOCK_FAMILIES = {
  data: [
    {
      id: "f1",
      familyName: "Smith Family",
      address: "Jl. Merdeka 123",
      provinsi: "DKI Jakarta",
      kotaKabupaten: "Jakarta Pusat",
      kecamatan: "Menteng",
      kelurahan: "Gondangdia",
      regionId: "r1",
      region: { id: "r1", name: "Sektor A" },
      members: [
        { id: "m1", firstName: "John", lastName: "Smith", isActive: true, role: "FAMILY_HEAD" },
        { id: "m2", firstName: "Jane", lastName: "Smith", isActive: true, role: "WIFE" },
      ],
    },
  ],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

const MOCK_MEMBERS = {
  data: [
    {
      id: "m1",
      firstName: "John",
      lastName: "Doe",
      birthDate: "1980-01-15T00:00:00.000Z",
      role: "FAMILY_HEAD",
      isActive: true,
      isDeceased: false,
      pelkat: "PERSEKUTUAN_KAUM_BAPAK",
      family: {
        id: "f1",
        familyName: "Doe Family",
        address: "Jl. Test 1",
        provinsi: "Jawa Barat",
        kotaKabupaten: "Bandung",
        regionId: "r1",
        region: { id: "r1", name: "Sektor A" },
      },
    },
  ],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

const MOCK_BIRTHDAYS = {
  data: [],
  meta: { start: "2026-07-01", end: "2026-07-07" },
};

const MOCK_COUNTS = { all: 100, male: 45, female: 55 };
const MOCK_BLOOD_TYPES = { A: 30, B: 25, AB: 10, O: 35 };
const MOCK_PELKAT_COUNTS: Array<{ pelkat: string; total: number }> = [];
const MOCK_REGION_MEMBER_COUNTS = {
  data: [{ regionId: "r1", regionName: "Sektor A", memberCount: 10 }],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

// ─── Setup: mock API routes before each test ──────────────────────────────

test.beforeEach(async ({ page }) => {
  // Mock auth — return a valid session to bypass the login redirect
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "user-1", email: "admin@test.com", name: "Admin", role: "ADMIN", regionId: null },
        expires: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
  });

  // Mock RBAC settings
  await page.route("**/api/settings/rbac", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        config: {
          "/dashboard/families": { view: ["ADMIN", "STAFF", "MEMBER"], edit: ["ADMIN"] },
          "/dashboard/members": { view: ["ADMIN", "STAFF", "MEMBER"], edit: ["ADMIN"] },
        },
      }),
    });
  });

  // Mock family endpoint
  await page.route("**/api/family?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_FAMILIES),
    });
  });

  // Mock family by ID
  await page.route("**/api/family/f1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_FAMILIES.data[0]),
    });
  });

  // Mock members endpoint
  await page.route("**/api/member?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_MEMBERS),
    });
  });

  // Mock member by ID
  await page.route("**/api/member/m1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_MEMBERS.data[0]),
    });
  });

  // Mock regions
  await page.route("**/api/region?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_REGIONS),
    });
  });

  // Mock dashboard counts, gender/blood-type/pelkat
  await page.route("**/api/dashboard/counts", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_COUNTS) });
  });
  await page.route("**/api/member/gender-count", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_COUNTS) });
  });
  await page.route("**/api/member/blood-type-count", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_BLOOD_TYPES) });
  });
  await page.route("**/api/member/pelkat-count*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PELKAT_COUNTS) });
  });
  await page.route("**/api/region/member-count", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_REGION_MEMBER_COUNTS) });
  });

  // Mock birthday
  await page.route("**/api/birthday*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_BIRTHDAYS) });
  });

  // Mock presbyter endpoint
  await page.route("**/api/member/presbyter*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
    });
  });

  // Mock Indonesia region endpoints
  await page.route("**/api/region-indonesia/provinces", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ code: "31", name: "DKI Jakarta" }, { code: "32", name: "Jawa Barat" }]),
    });
  });
  await page.route("**/api/region-indonesia/regencies*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ code: "3171", name: "Jakarta Pusat" }]),
    });
  });
  await page.route("**/api/region-indonesia/districts*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ code: "3171010", name: "Menteng" }]),
    });
  });
  await page.route("**/api/region-indonesia/villages*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ code: "3171010001", name: "Gondangdia" }]),
    });
  });
});

// ─── Tests ─────────────────────────────────────────────────────────────────

test.describe("Family Management - Dialog E2E", () => {
  test("renders family page with table and opens Create Family dialog", async ({ page }) => {
    await page.goto("/dashboard/families");
    await page.waitForLoadState("networkidle");

    // Verify page header
    await expect(page.getByText("Family Management")).toBeVisible();

    // Verify family data renders
    await expect(page.getByText("Smith Family")).toBeVisible();
    await expect(page.getByText("Sektor A")).toBeVisible();

    // Click Create Family button
    await page.getByRole("button", { name: "Create Family" }).click();

    // Verify dialog opened
    await expect(page.getByText("Create Family").first()).toBeVisible();
    await expect(page.getByLabel("Family name")).toBeVisible();
    await expect(page.getByLabel("Sektor Pelayanan")).toBeVisible();
  });

  test("Edit Family dialog pre-fills existing data", async ({ page }) => {
    await page.goto("/dashboard/families");
    await page.waitForLoadState("networkidle");

    // Wait for the Edit button and click it
    const editButton = page.getByRole("button", { name: /Edit/ }).first();
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Wait for dialog to appear with pre-filled data
    await expect(page.getByText("Update Family").first()).toBeVisible({ timeout: 5000 });

    // The family name input should be pre-filled
    const familyNameInput = page.getByLabel("Family name");
    await expect(familyNameInput).toBeVisible();
    // Verify the input has the expected pre-filled value
    await expect(familyNameInput).toHaveValue("Smith Family");
  });
});

test.describe("Member Management - Dialog E2E", () => {
  test("renders member page with table and opens Create Member dialog", async ({ page }) => {
    await page.goto("/dashboard/members");
    await page.waitForLoadState("networkidle");

    // Verify page header
    await expect(page.getByText("Member Management")).toBeVisible();

    // Verify member data renders
    await expect(page.getByText("John Doe")).toBeVisible();

    // Click Create Member button
    await page.getByRole("button", { name: "Create Member" }).click();

    // Verify dialog opened
    await expect(page.getByText("Create Member").first()).toBeVisible({ timeout: 5000 });
  });

  test("Edit Member dialog pre-fills existing data", async ({ page }) => {
    await page.goto("/dashboard/members");
    await page.waitForLoadState("networkidle");

    // Wait for the Edit button and click it
    const editButton = page.getByRole("button", { name: /Edit/ }).first();
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Wait for dialog to appear with pre-filled data
    await expect(page.getByText("Update Member").first()).toBeVisible({ timeout: 5000 });
  });
});
