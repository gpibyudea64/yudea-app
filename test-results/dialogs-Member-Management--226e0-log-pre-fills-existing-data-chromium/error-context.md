# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dialogs.spec.ts >> Member Management - Dialog E2E >> Edit Member dialog pre-fills existing data
- Location: e2e/dialogs.spec.ts:269:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /Edit/ }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /Edit/ }).first()

```

```yaml
- heading "GPIB Yudea" [level=1]
- paragraph: Sistem Informasi Warga Jemaat
- text: Login Masukkan email dan password untuk mengakses dashboard. Email
- textbox "Email":
  - /placeholder: admin@example.com
- text: Password
- textbox "Password"
- button
- button "Login"
- paragraph: © 2026 GPIB Yudea. All rights reserved.
- button "Open Tanstack query devtools":
  - img
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  175 |   });
  176 | 
  177 |   // Mock Indonesia region endpoints
  178 |   await page.route("**/api/region-indonesia/provinces", async (route) => {
  179 |     await route.fulfill({
  180 |       status: 200,
  181 |       contentType: "application/json",
  182 |       body: JSON.stringify([{ code: "31", name: "DKI Jakarta" }, { code: "32", name: "Jawa Barat" }]),
  183 |     });
  184 |   });
  185 |   await page.route("**/api/region-indonesia/regencies*", async (route) => {
  186 |     await route.fulfill({
  187 |       status: 200,
  188 |       contentType: "application/json",
  189 |       body: JSON.stringify([{ code: "3171", name: "Jakarta Pusat" }]),
  190 |     });
  191 |   });
  192 |   await page.route("**/api/region-indonesia/districts*", async (route) => {
  193 |     await route.fulfill({
  194 |       status: 200,
  195 |       contentType: "application/json",
  196 |       body: JSON.stringify([{ code: "3171010", name: "Menteng" }]),
  197 |     });
  198 |   });
  199 |   await page.route("**/api/region-indonesia/villages*", async (route) => {
  200 |     await route.fulfill({
  201 |       status: 200,
  202 |       contentType: "application/json",
  203 |       body: JSON.stringify([{ code: "3171010001", name: "Gondangdia" }]),
  204 |     });
  205 |   });
  206 | });
  207 | 
  208 | // ─── Tests ─────────────────────────────────────────────────────────────────
  209 | 
  210 | test.describe("Family Management - Dialog E2E", () => {
  211 |   test("renders family page with table and opens Create Family dialog", async ({ page }) => {
  212 |     await page.goto("/dashboard/families");
  213 |     await page.waitForLoadState("networkidle");
  214 | 
  215 |     // Verify page header
  216 |     await expect(page.getByText("Family Management")).toBeVisible();
  217 | 
  218 |     // Verify family data renders
  219 |     await expect(page.getByText("Smith Family")).toBeVisible();
  220 |     await expect(page.getByText("Sektor A")).toBeVisible();
  221 | 
  222 |     // Click Create Family button
  223 |     await page.getByRole("button", { name: "Create Family" }).click();
  224 | 
  225 |     // Verify dialog opened
  226 |     await expect(page.getByText("Create Family").first()).toBeVisible();
  227 |     await expect(page.getByLabel("Family name")).toBeVisible();
  228 |     await expect(page.getByLabel("Sektor Pelayanan")).toBeVisible();
  229 |   });
  230 | 
  231 |   test("Edit Family dialog pre-fills existing data", async ({ page }) => {
  232 |     await page.goto("/dashboard/families");
  233 |     await page.waitForLoadState("networkidle");
  234 | 
  235 |     // Wait for the Edit button and click it
  236 |     const editButton = page.getByRole("button", { name: /Edit/ }).first();
  237 |     await expect(editButton).toBeVisible();
  238 |     await editButton.click();
  239 | 
  240 |     // Wait for dialog to appear with pre-filled data
  241 |     await expect(page.getByText("Update Family").first()).toBeVisible({ timeout: 5000 });
  242 | 
  243 |     // The family name input should be pre-filled
  244 |     const familyNameInput = page.getByLabel("Family name");
  245 |     await expect(familyNameInput).toBeVisible();
  246 |     // Verify the input has the expected pre-filled value
  247 |     await expect(familyNameInput).toHaveValue("Smith Family");
  248 |   });
  249 | });
  250 | 
  251 | test.describe("Member Management - Dialog E2E", () => {
  252 |   test("renders member page with table and opens Create Member dialog", async ({ page }) => {
  253 |     await page.goto("/dashboard/members");
  254 |     await page.waitForLoadState("networkidle");
  255 | 
  256 |     // Verify page header
  257 |     await expect(page.getByText("Member Management")).toBeVisible();
  258 | 
  259 |     // Verify member data renders
  260 |     await expect(page.getByText("John Doe")).toBeVisible();
  261 | 
  262 |     // Click Create Member button
  263 |     await page.getByRole("button", { name: "Create Member" }).click();
  264 | 
  265 |     // Verify dialog opened
  266 |     await expect(page.getByText("Create Member").first()).toBeVisible({ timeout: 5000 });
  267 |   });
  268 | 
  269 |   test("Edit Member dialog pre-fills existing data", async ({ page }) => {
  270 |     await page.goto("/dashboard/members");
  271 |     await page.waitForLoadState("networkidle");
  272 | 
  273 |     // Wait for the Edit button and click it
  274 |     const editButton = page.getByRole("button", { name: /Edit/ }).first();
> 275 |     await expect(editButton).toBeVisible();
      |                              ^ Error: expect(locator).toBeVisible() failed
  276 |     await editButton.click();
  277 | 
  278 |     // Wait for dialog to appear with pre-filled data
  279 |     await expect(page.getByText("Update Member").first()).toBeVisible({ timeout: 5000 });
  280 |   });
  281 | });
  282 | 
```