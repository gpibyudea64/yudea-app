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
