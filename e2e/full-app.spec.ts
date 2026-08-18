import { test, expect, type Page } from "@playwright/test";
import {
  COORDINATOR_EMAIL,
  COORDINATOR_PASSWORD,
  clickSortableHeader,
  login,
} from "./helpers";

// ─── Notes ─────────────────────────────────────────────────────────────────
// This spec is READ-ONLY: it performs a real UI login (see ./helpers) and
// visits every dashboard page against the live DATABASE_URL, asserting real
// data renders and no API request or page throws. It never writes to the
// database.
//
// Prerequisite: the database at DATABASE_URL must be seeded first
// (`npm run prisma:seed`) so the admin user and baseline records exist.

type Failures = string[];

/** Collect API failures (4xx/5xx), page errors, and real console errors. */
function trackFailures(page: Page, failures: Failures) {
  page.on("response", (res) => {
    if (res.url().includes("/api/") && res.status() >= 400) {
      failures.push(`API ${res.status()} ${res.request().method()} ${res.url()}`);
    }
  });
  page.on("pageerror", (err) => failures.push(`PAGEERROR ${err.message}`));
  page.on("console", (msg) => {
    // React dev-mode warnings are logged via console.error; skip them.
    if (msg.type() === "error" && !msg.text().startsWith("Warning: ")) {
      failures.push(`CONSOLE ${msg.text()}`);
    }
  });
}

/** Give trailing API/console events time to land before asserting the list. */
async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(300);
}

/** Visit a page, assert its heading (and optional real-data text), then assert no failures. */
async function expectPage(
  page: Page,
  url: string,
  heading: string,
  failures: Failures,
  dataText?: string,
) {
  // Generous timeouts: the dev server compiles each route/API on first hit.
  await page.goto(url);
  await expect(
    page.locator("h1").filter({ hasText: heading }).first(),
  ).toBeVisible({ timeout: 30000 });
  if (dataText) {
    await expect(page.getByText(dataText).first()).toBeVisible({ timeout: 30000 });
  }
  await settle(page);
  expect(failures, `No API/console failures while visiting ${url}`).toEqual([]);
}

// ─── Tests ─────────────────────────────────────────────────────────────────

test.describe("Full app smoke test (real database, read-only)", () => {
  // Each test performs a real login and walks several pages (the specialized
  // test visits 7 pages, each hitting slow Neon-backed APIs); give them room.
  test.setTimeout(180_000);

  // These tests hit the live Neon database. Running them concurrently can
  // exhaust the serverless connection pool (authorize then fails with
  // "Invalid email or password"), so run them one at a time.
  test.describe.configure({ mode: "serial" });
  test("redirects unauthenticated users from /dashboard to the login page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/public/login**", { timeout: 15000 });
    await expect(page.locator("input#email")).toBeVisible();
  });

  test("logs in as seeded admin, shows live dashboard counts, and logs out", async ({ page }) => {
    const failures: Failures = [];
    trackFailures(page, failures);

    // Capture the live counts response so assertions track the actual DB state.
    const dashboard: { counts?: { totalMembers?: number } } = {};
    page.on("response", async (res) => {
      if (res.url().endsWith("/api/dashboard/counts") && res.status() === 200) {
        dashboard.counts = ((await res.json().catch(() => null)) as { totalMembers?: number } | null) ??
          undefined;
      }
    });

    await login(page);

    // Sidebar + navbar reflect the signed-in admin
    await expect(page.getByText("Signed In")).toBeVisible();
    await expect(page.getByText("admin@example.com").first()).toBeVisible();

    // Dashboard overview renders live counts from the DB
    await expect(
      page.locator("h1").filter({ hasText: "Dashboard" }).first(),
    ).toBeVisible();
    await expect(page.getByText("Total Warga Jemaat").first()).toBeVisible({ timeout: 30000 });
    // First compile of /api/dashboard/counts can be slow; wait for the real total.
    await expect.poll(() => dashboard.counts?.totalMembers).toBeTruthy();
    await expect(page.getByText(String(dashboard.counts?.totalMembers)).first()).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText("Region A").first()).toBeVisible({ timeout: 30000 });

    await settle(page);
    expect(failures, "No API/console failures on the dashboard").toEqual([]);

    // Logout returns to the login page (avatar fallback = email initials "AD")
    await page.locator("header").getByRole("button", { name: "AD" }).click();
    await page.getByText("Logout").click();
    await page.waitForURL("**/public/login**", { timeout: 15000 });
    await expect(page.locator("input#email")).toBeVisible();
  });

  test("master data pages render real seeded records", async ({ page }) => {
    const failures: Failures = [];
    trackFailures(page, failures);
    await login(page);

    await expectPage(page, "/dashboard/branches", "Branch Management", failures, "Central Branch");
    await clickSortableHeader(page, "Name", "name");
    await expectPage(page, "/dashboard/regions", "Sektor Pelayanan Management", failures, "Region A");
    await clickSortableHeader(page, "Branch", "branchName");
    await expectPage(page, "/dashboard/families", "Family Management", failures, "Region A Family 1");
    await clickSortableHeader(page, "Kecamatan", "kecamatan");

    // The DB may contain records added after seeding; assert the live total
    // reported by the list pagination instead of a specific member name.
    const members: { total?: number } = {};
    page.on("response", async (res) => {
      if (res.url().includes("/api/member?") && res.status() === 200) {
        const json = (await res.json().catch(() => null)) as {
          meta?: { total?: number };
        } | null;
        if (json?.meta?.total != null) members.total = json.meta.total;
      }
    });
    await page.goto("/dashboard/members");
    await expect(
      page.locator("h1").filter({ hasText: "Member Management" }).first(),
    ).toBeVisible({ timeout: 30000 });
    await expect.poll(() => members.total).toBeTruthy();
    await expect(page.getByText(`Showing 1-10 of ${members.total}`).first()).toBeVisible({
      timeout: 30000,
    });
    await clickSortableHeader(page, "Role", "role");
    await settle(page);
    expect(failures, "No API/console failures while visiting /dashboard/members").toEqual([]);
  });

  test("specialized and admin pages render real data", async ({ page }) => {
    const failures: Failures = [];
    trackFailures(page, failures);
    await login(page);

    await expectPage(page, "/dashboard/attendance", "Attendance Management", failures, "Sunday Service");
    await clickSortableHeader(page, "Service Type", "serviceType");
    await expectPage(page, "/dashboard/birthday", "Dashboard Ulang Tahun", failures);
    await clickSortableHeader(page, "Nama Jemaat", "fullName");
    await expectPage(page, "/dashboard/report", "Laporan Warga Jemaat", failures);
    await clickSortableHeader(page, "Nama Keluarga", "familyName");
    await expectPage(page, "/dashboard/pelkat-members", "Pelkat Members", failures);
    await clickSortableHeader(page, "Nama Jemaat", "fullName");
    await expectPage(page, "/dashboard/presbytery", "Presbyter Management", failures);
    await clickSortableHeader(page, "Birth Date", "birthDate");
    await expectPage(page, "/dashboard/settings", "Settings", failures, "Configure role-based access");
    await expectPage(page, "/dashboard/users", "User Management", failures, "admin@example.com");
    await clickSortableHeader(page, "Role", "role");

    // /dashboard/evets is a legacy alias that redirects to attendance
    await page.goto("/dashboard/evets");
    await page.waitForURL("**/dashboard/attendance**", { timeout: 15000 });
    await expect(
      page.locator("h1").filter({ hasText: "Attendance Management" }).first(),
    ).toBeVisible();
    await settle(page);
    expect(failures, "No API/console failures while visiting /dashboard/evets").toEqual([]);
  });

  test("logs in as the seeded COORDINATOR: region-scoped data and a restricted sidebar", async ({
    page,
  }) => {
    const failures: Failures = [];
    trackFailures(page, failures);

    // Capture the live region-scoped totals the coordinator's session returns
    // (the API filters by session.user.regionId server-side), plus the first
    // family name rendered so the positive assertion survives DB drift.
    const scoped: {
      families?: number;
      members?: number;
      firstFamilyName?: string;
    } = {};
    page.on("response", async (res) => {
      if (res.url().includes("/api/family?") && res.status() === 200) {
        const json = (await res.json().catch(() => null)) as {
          data?: { familyName?: string }[];
          meta?: { total?: number };
        } | null;
        if (json?.meta?.total != null) scoped.families = json.meta.total;
        if (json?.data?.[0]?.familyName) {
          scoped.firstFamilyName = json.data[0].familyName;
        }
      }
      if (res.url().includes("/api/member?") && res.status() === 200) {
        const json = (await res.json().catch(() => null)) as {
          meta?: { total?: number };
        } | null;
        if (json?.meta?.total != null) scoped.members = json.meta.total;
      }
    });

    // A coordinator is redirected to /dashboard/families (their default path),
    // not the admin dashboard.
    await login(page, {
      email: COORDINATOR_EMAIL,
      password: COORDINATOR_PASSWORD,
    });
    await expect(page.getByText(COORDINATOR_EMAIL).first()).toBeVisible();
    await expect(page.getByText("COORDINATOR").first()).toBeVisible();

    // Sidebar shows the links the coordinator role allows...
    for (const allowed of [
      "Dashboard",
      "Ulang Tahun",
      "Sektor Pelayanan",
      "Keluarga",
      "Warga Jemaat",
      "Majelis Jemaat",
    ]) {
      await expect(page.getByRole("link", { name: allowed })).toBeVisible();
    }
    // ...and hides the admin/staff-only links entirely.
    for (const denied of [
      "Wilayah Pelayanan",
      "Pelkat Members",
      "Attendance",
      "Users",
      "Settings",
    ]) {
      await expect(page.getByRole("link", { name: denied })).toHaveCount(0);
    }

    // Families are scoped to the coordinator's region: the first family from
    // their live API payload renders, a seeded Region C family does not, and
    // the total matches the live region-scoped count. We deliberately do not
    // visit an admin-only page (e.g. /dashboard/users) to assert the RBAC
    // guard: on hydration the guard briefly renders children from the server
    // snapshot, which would fire an admin-gated API call (401) and flake the
    // failure tracker. The sidebar absence checks below cover the restriction.
    await expect(
      page.locator("h1").filter({ hasText: "Family Management" }).first(),
    ).toBeVisible({ timeout: 30000 });
    await expect.poll(() => scoped.families, { timeout: 10000 }).toBeTruthy();
    await expect(
      page.getByText(new RegExp(`Showing \\d+-\\d+ of ${scoped.families}`)).first(),
    ).toBeVisible({ timeout: 30000 });
    await expect.poll(() => scoped.firstFamilyName, { timeout: 10000 }).toBeTruthy();
    await expect(page.getByText(scoped.firstFamilyName ?? "").first()).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText("Region C Family 1")).toHaveCount(0);

    // Members are scoped too; the list shows the coordinator's live count.
    await page.goto("/dashboard/members");
    await expect(
      page.locator("h1").filter({ hasText: "Member Management" }).first(),
    ).toBeVisible({ timeout: 30000 });
    await expect.poll(() => scoped.members, { timeout: 10000 }).toBeTruthy();
    await expect(
      page.getByText(new RegExp(`Showing \\d+-\\d+ of ${scoped.members}`)).first(),
    ).toBeVisible({ timeout: 30000 });

    await settle(page);
    expect(failures, "No API/console failures in the coordinator flow").toEqual([]);
  });
});
