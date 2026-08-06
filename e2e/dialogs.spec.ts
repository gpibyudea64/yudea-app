import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers";

// Tests run fully parallel against a freshly-started dev server: each one
// performs a real login (first-compile of the auth routes can be slow under
// load), so give every test headroom beyond the 30s default.
test.setTimeout(90_000);

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
      familyId: "f1",
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
  // Auth is enforced server-side, so mocking /api/auth/session alone cannot
  // bypass the login redirect. Perform a real UI login first.
  await login(page);

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

    // Verify dialog opened (Indonesian UI: "Tambah Warga Jemaat")
    await expect(page.getByText("Tambah Warga Jemaat").first()).toBeVisible({ timeout: 5000 });
  });

  test("Edit Member dialog pre-fills existing data", async ({ page }) => {
    await page.goto("/dashboard/members");
    await page.waitForLoadState("networkidle");

    // Wait for the Edit button and click it
    const editButton = page.getByRole("button", { name: /Edit/ }).first();
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Wait for dialog to appear with pre-filled data
    await expect(page.getByText("Edit Warga Jemaat").first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── Helpers: mutation mocks & form interactions ───────────────────────────

type Captures = {
  created?: Record<string, unknown>;
  updated?: Record<string, unknown>;
  deleted?: boolean;
};

type FamilyPayload = {
  familyName: string;
  address: string;
  regionId: string;
  provinsi: string;
  kotaKabupaten: string;
  kecamatan: string;
  kelurahan: string;
  members: Array<{ firstName: string; birthDate: string }>;
};

type MemberPayload = {
  firstName: string;
  birthDate: string;
  familyId: string;
};

/** Clicks a Radix Select trigger by id, then picks the option by visible name. */
async function pickOption(page: Page, triggerId: string, optionName: string) {
  await page.locator(`#${triggerId}`).click();
  await page.getByRole("option", { name: optionName }).click();
}

/** Mocks family POST/PATCH/DELETE and records the request bodies. */
async function mockFamilyMutations(page: Page, captures: Captures) {
  await page.route("**/api/family", async (route) => {
    if (route.request().method() !== "POST") {
      return route.fallback();
    }
    captures.created = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ...MOCK_FAMILIES.data[0],
        id: "f-new",
        familyName: captures.created.familyName as string,
      }),
    });
  });

  await page.route("**/api/family/f1", async (route) => {
    const method = route.request().method();
    if (method === "PATCH") {
      captures.updated = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...MOCK_FAMILIES.data[0],
          ...captures.updated,
          id: "f1",
        }),
      });
      return;
    }
    if (method === "DELETE") {
      captures.deleted = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Deleted successfully" }),
      });
      return;
    }
    await route.fallback();
  });
}

/** Mocks member POST/PATCH/DELETE and records the request bodies. */
async function mockMemberMutations(page: Page, captures: Captures) {
  await page.route("**/api/member", async (route) => {
    if (route.request().method() !== "POST") {
      return route.fallback();
    }
    captures.created = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ...MOCK_MEMBERS.data[0],
        id: "m-new",
        firstName: captures.created.firstName as string,
      }),
    });
  });

  await page.route("**/api/member/m1", async (route) => {
    const method = route.request().method();
    if (method === "PATCH") {
      captures.updated = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...MOCK_MEMBERS.data[0],
          ...captures.updated,
          id: "m1",
        }),
      });
      return;
    }
    if (method === "DELETE") {
      captures.deleted = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Deleted successfully" }),
      });
      return;
    }
    await route.fallback();
  });
}

// ─── Family CRUD flows (against mocked APIs) ───────────────────────────────

test.describe("Family CRUD — create/update/delete flows", () => {
  test("blocks submission until the administrative region cascade is complete", async ({ page }) => {
    const captures: Captures = {};
    await mockFamilyMutations(page, captures);

    await page.goto("/dashboard/families");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Create Family" }).click();
    await expect(page.getByText("Create Family").first()).toBeVisible();

    await page.getByLabel("Family name").fill("Alpha Family");
    await page.getByLabel("Address (detail)").fill("Jl. Merdeka 999");
    await pickOption(page, "regionId", "Sektor A");

    await page.getByRole("button", { name: "Create", exact: true }).click();

    // Client-side guard kicks in before any API call is made
    await expect(page.getByText("Provinsi harus dipilih")).toBeVisible();
    await expect(page.getByText("Create Family").first()).toBeVisible();
    expect(captures.created).toBeUndefined();
  });

  test("creates a family by submitting the full form", async ({ page }) => {
    const captures: Captures = {};
    await mockFamilyMutations(page, captures);

    await page.goto("/dashboard/families");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Create Family" }).click();
    await expect(page.getByText("Create Family").first()).toBeVisible();

    await page.getByLabel("Family name").fill("Alpha Family");
    await page.getByLabel("Address (detail)").fill("Jl. Merdeka 999");
    await pickOption(page, "regionId", "Sektor A");
    await pickOption(page, "provinsi", "DKI Jakarta");
    await pickOption(page, "kotaKabupaten", "Jakarta Pusat");
    await pickOption(page, "kecamatan", "Menteng");
    await pickOption(page, "kelurahan", "Gondangdia");

    // Wait for the cascade selection to flush into the form's region state
    // before submitting (mirrors the pre-fill wait in the update test).
    await expect(page.locator("#kelurahan")).toContainText("Gondangdia", { timeout: 5000 });

    // Add one household member inline
    await page.getByRole("button", { name: "Add Member" }).click();
    await page.getByPlaceholder("Nama Depan").fill("Budi");
    await page.locator('input[type="date"]').first().fill("1990-01-01");

    await page.getByRole("button", { name: "Create", exact: true }).click();

    await expect(page.getByText("Saved successfully")).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    const created = captures.created as FamilyPayload;
    expect(created.familyName).toBe("Alpha Family");
    expect(created.address).toBe("Jl. Merdeka 999");
    expect(created.regionId).toBe("r1");
    expect(created.provinsi).toBe("DKI Jakarta");
    expect(created.kotaKabupaten).toBe("Jakarta Pusat");
    expect(created.kecamatan).toBe("Menteng");
    expect(created.kelurahan).toBe("Gondangdia");
    expect(created.members).toHaveLength(1);
    expect(created.members[0].firstName).toBe("Budi");
    expect(created.members[0].birthDate).toBe("1990-01-01");
  });

  test("updates an existing family and submits changes", async ({ page }) => {
    const captures: Captures = {};
    await mockFamilyMutations(page, captures);

    await page.goto("/dashboard/families");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /Edit/ }).first().click();
    await expect(page.getByText("Update Family").first()).toBeVisible({ timeout: 5000 });

    // The Indonesia region cascade should pre-fill from the editing data
    await expect(page.locator("#kelurahan")).toContainText("Gondangdia", { timeout: 5000 });

    const nameInput = page.getByLabel("Family name");
    await expect(nameInput).toHaveValue("Smith Family");
    await nameInput.fill("Smith Family Updated");

    await page.getByRole("button", { name: "Update", exact: true }).click();

    await expect(page.getByText("Saved successfully")).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    const updated = captures.updated as FamilyPayload;
    expect(updated.familyName).toBe("Smith Family Updated");
    expect(updated.provinsi).toBe("DKI Jakarta");
    expect(updated.kotaKabupaten).toBe("Jakarta Pusat");
  });

  test("deletes a family after confirming the browser dialog", async ({ page }) => {
    const captures: Captures = {};
    await mockFamilyMutations(page, captures);

    await page.goto("/dashboard/families");
    await page.waitForLoadState("networkidle");

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe("Delete this family?");
      dialog.accept();
    });
    await page.getByRole("button", { name: "Delete" }).click();

    await expect.poll(() => captures.deleted).toBe(true);
  });
});

// ─── Member CRUD flows (against mocked APIs) ───────────────────────────────

test.describe("Member CRUD — create/update/delete flows", () => {
  test("creates a member with region and family selection", async ({ page }) => {
    const captures: Captures = {};
    await mockMemberMutations(page, captures);

    await page.goto("/dashboard/members");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Create Member" }).click();
    await expect(page.getByText("Tambah Warga Jemaat").first()).toBeVisible({ timeout: 5000 });

    await pickOption(page, "dialogRegion", "Sektor A");
    await pickOption(page, "familyId", "Smith Family");
    await page.getByLabel("Nama Depan").fill("Jane");
    await page.getByLabel("Tanggal Lahir").fill("1995-06-15");
    await page.getByLabel("Nomor Handphone").fill("081234567890");

    await page.getByRole("button", { name: "Tambah", exact: true }).click();

    await expect(page.getByText("Disimpan")).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    const created = captures.created as MemberPayload;
    expect(created.firstName).toBe("Jane");
    expect(created.birthDate).toBe("1995-06-15");
    expect(created.familyId).toBe("f1");
  });

  test("updates an existing member and submits changes", async ({ page }) => {
    const captures: Captures = {};
    await mockMemberMutations(page, captures);

    await page.goto("/dashboard/members");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /Edit/ }).first().click();
    await expect(page.getByText("Edit Warga Jemaat").first()).toBeVisible({ timeout: 5000 });

    const firstNameInput = page.getByLabel("Nama Depan");
    await expect(firstNameInput).toHaveValue("John");
    await firstNameInput.fill("Johnny");

    await page.getByRole("button", { name: "Simpan", exact: true }).click();

    await expect(page.getByText("Disimpan")).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    const updated = captures.updated as MemberPayload;
    expect(updated.firstName).toBe("Johnny");
    expect(updated.familyId).toBe("f1");
  });

  test("deletes a member after confirming the browser dialog", async ({ page }) => {
    const captures: Captures = {};
    await mockMemberMutations(page, captures);

    await page.goto("/dashboard/members");
    await page.waitForLoadState("networkidle");

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe("Delete this member?");
      dialog.accept();
    });
    await page.getByRole("button", { name: "Delete" }).click();

    await expect.poll(() => captures.deleted).toBe(true);
  });
});
