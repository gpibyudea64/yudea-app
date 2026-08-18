import { test, expect, type Page } from "@playwright/test";
import { login, SORTABLE_PAGES, verifySortableHeader } from "./helpers";

// ─── Notes ─────────────────────────────────────────────────────────────────
// This spec is READ-ONLY: it performs a real UI login (see ./helpers) and, on
// every sortable dashboard table, clicks a header and verifies the sort state
// is written to the URL (?sortBy=...&sortOrder=...), toggles on a second click,
// and survives a reload. The per-page interaction lives in
// `verifySortableHeader` (e2e/helpers.ts); this file only wires up failure
// tracking. It never writes to the database.
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

test.describe("Sortable table headers (real database, read-only)", () => {
  test.setTimeout(240_000);
  // Each test logs in and hits the live DB; run serially like the other
  // real-database specs.
  test.describe.configure({ mode: "serial" });

  for (const pageConfig of SORTABLE_PAGES) {
    test(`clicking "${pageConfig.header}" on ${pageConfig.url} writes sort params to the URL, toggles, and survives reload`, async ({
      page,
    }) => {
      const failures: Failures = [];
      trackFailures(page, failures);

      await login(page);
      await verifySortableHeader(page, pageConfig);

      await settle(page);
      expect(failures, `No API/console failures while sorting ${pageConfig.url}`).toEqual([]);
    });
  }
});
