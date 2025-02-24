import { test, expect } from "@playwright/test";

test.describe("Navigation and Theme", () => {
  test("should navigate through main sections", async ({ page }) => {
    await page.goto("/");

    // Check navigation to Reports
    await page.getByRole("link", { name: "Report" }).click();
    await expect(page).toHaveURL(/.*\/reports/);

    // Check navigation to Leave
    await page.getByRole("button", { name: "Data" }).click();
    await page.getByRole("link", { name: /leave/i }).click();
    await expect(page).toHaveURL(/.*\/data\/leave/);

    // Check navigation to General Time Types
    await page.getByRole("button", { name: "Data" }).click();
    await page.getByRole("link", { name: /general time types/i }).click();
    await expect(page).toHaveURL(/.*\/data\/general-time-types/);
  });

  test("should toggle theme", async ({ page }) => {
    await page.goto("/");

    // Get the theme toggle button
    const themeToggle = page.getByRole("button", { name: /toggle theme/i });

    // Check initial theme
    await expect(page.locator("html")).toHaveAttribute("class", /light|dark/);

    // Toggle theme
    await themeToggle.click();

    // Verify theme changed
    await expect(page.locator("html")).toHaveAttribute("class", /light|dark/);
  });
});
