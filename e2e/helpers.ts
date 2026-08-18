import { expect, type Page } from "@playwright/test";

// Real credentials seeded by prisma/seed.ts.
export const ADMIN_EMAIL = "admin@example.com";
export const ADMIN_PASSWORD = "admin123";
export const COORDINATOR_EMAIL = "coordinator-a@example.com";
export const COORDINATOR_PASSWORD = "coordinator123";

export type LoginCredentials = { email: string; password: string };

/**
 * Performs a real UI login with the given credentials (seeded admin by
 * default).
 *
 * Auth is enforced server-side (middleware/proxy), so mocking
 * /api/auth/session alone cannot bypass the login redirect — a real login is
 * required. The dev server compiles the auth routes on first hit and tests run
 * in parallel, so the redirect can take longer than the default timeout.
 */
export async function login(
  page: Page,
  credentials: LoginCredentials = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
) {
  await page.goto("/public/login");
  await expect(page.locator("input#email")).toBeVisible();
  await page.fill("#email", credentials.email);
  await page.fill("#password", credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 60000 });
}

// ─── Sortable header helpers ───────────────────────────────────────────────

/** Reads a query param from a URL. */
export function readParam(url: string, key: string) {
  return new URL(url).searchParams.get(key);
}

/**
 * One entry per sortable dashboard table: the header to click (its label and
 * the sort key it writes), the page heading that proves it rendered, and the
 * page's list API fragment used as a hydration signal.
 */
export const SORTABLE_PAGES = [
  { url: "/dashboard/members", heading: "Member Management", header: "Role", sortKey: "role", api: "/api/member?" },
  { url: "/dashboard/families", heading: "Family Management", header: "Kecamatan", sortKey: "kecamatan", api: "/api/family?" },
  { url: "/dashboard/attendance", heading: "Attendance Management", header: "Service Type", sortKey: "serviceType", api: "/api/attendance?" },
  { url: "/dashboard/regions", heading: "Sektor Pelayanan Management", header: "Branch", sortKey: "branchName", api: "/api/region?" },
  { url: "/dashboard/branches", heading: "Branch Management", header: "Name", sortKey: "name", api: "/api/branch?" },
  { url: "/dashboard/users", heading: "User Management", header: "Role", sortKey: "role", api: "/api/user?" },
  { url: "/dashboard/presbytery", heading: "Presbyter Management", header: "Birth Date", sortKey: "birthDate", api: "/api/member/presbyter?" },
  { url: "/dashboard/pelkat-members", heading: "Pelkat Members", header: "Nama Jemaat", sortKey: "fullName", api: "/api/member?" },
  { url: "/dashboard/birthday", heading: "Dashboard Ulang Tahun", header: "Nama Jemaat", sortKey: "fullName", api: "/api/birthday" },
  // Note: the report page's filter `<Select>` is also a button named "Sektor
  // Pelayanan" (it appears above the table), so target a collision-free header.
  { url: "/dashboard/report", heading: "Laporan Warga Jemaat", header: "Nama Keluarga", sortKey: "familyName", api: "/api/report?" },
] as const;

export type SortablePage = (typeof SORTABLE_PAGES)[number];

/**
 * Flags when a page's list API has responded — the signal that React has
 * hydrated. Sort buttons exist in the SSR HTML before hydration, so clicking
 * them too early (cold-route first compile) silently drops the click. Attach
 * this BEFORE navigating to the page.
 */
function trackListResponse(page: Page, apiFragment: string) {
  const seen = { hit: false };
  page.on("response", (res) => {
    if (res.url().includes(apiFragment) && res.status() === 200) seen.hit = true;
  });
  return seen;
}

/**
 * Full sort-header verification (page must already be authenticated):
 * navigates to the page, waits for hydration, clicks the header and checks the
 * sort state is written to the URL, toggles on a second click, and restores on
 * reload. Used by `e2e/sort.spec.ts`.
 */
export async function verifySortableHeader(page: Page, config: SortablePage) {
  const { url, heading, header, sortKey, api } = config;

  const listSeen = trackListResponse(page, api);
  await page.goto(url);
  await expect(
    page.locator("h1").filter({ hasText: heading }).first(),
  ).toBeVisible({ timeout: 30000 });
  await expect.poll(() => listSeen.hit, { timeout: 30000 }).toBe(true);

  const sortButton = page.getByRole("button", { name: header, exact: true }).first();
  await expect(sortButton).toBeVisible({ timeout: 30000 });

  // First click writes the sort to the URL. The direction depends on whether
  // the header is the page's default-sorted column, so only assert the key
  // and that the order is a valid value.
  await sortButton.click();
  await expect(page).toHaveURL(/sortBy=[^&]*/);
  expect(readParam(page.url(), "sortBy")).toBe(sortKey);
  const firstOrder = readParam(page.url(), "sortOrder");
  expect(["asc", "desc"]).toContain(firstOrder);

  // Second click on the active column toggles the direction.
  await sortButton.click();
  const secondOrder = readParam(page.url(), "sortOrder");
  expect(secondOrder).not.toBe(firstOrder);
  expect(readParam(page.url(), "sortBy")).toBe(sortKey);

  // Reload restores the same sort from the URL.
  await page.reload();
  await expect(
    page.locator("h1").filter({ hasText: heading }).first(),
  ).toBeVisible({ timeout: 30000 });
  expect(readParam(page.url(), "sortBy")).toBe(sortKey);
  expect(readParam(page.url(), "sortOrder")).toBe(secondOrder);
  await expect(
    page.getByRole("button", { name: header, exact: true }).first(),
  ).toBeVisible({ timeout: 30000 });
}

/**
 * Lightweight sort check for smoke specs: clicks a header and asserts the sort
 * key is written to the URL. The page must already be loaded and hydrated.
 */
export async function clickSortableHeader(
  page: Page,
  headerLabel: string,
  sortKey: string,
) {
  const sortButton = page.getByRole("button", { name: headerLabel, exact: true }).first();
  await expect(sortButton).toBeVisible({ timeout: 30000 });
  await sortButton.click();
  await expect(page).toHaveURL(/sortBy=[^&]*/);
  expect(readParam(page.url(), "sortBy")).toBe(sortKey);
}
