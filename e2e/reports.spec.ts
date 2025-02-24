import { test, expect } from "@playwright/test";

test.describe("Reports Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reports");
  });

  test("should load reports page with filters", async ({ page }) => {
    // Check if the page loads with the time report table
    await expect(page.getByRole("table")).toBeVisible();

    // Check if date filters are present
    await expect(
      page.getByRole("button", { name: /from date/i })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /to date/i })).toBeVisible();
  });

  test("should filter time reports", async ({ page }) => {
    // Open date picker
    await page.getByRole("button", { name: /from date/i }).click();

    // Select a date (first available date)
    await page.getByRole("gridcell").first().click();

    // Close the date picker if it's still open
    await page.keyboard.press("Escape");

    // Verify table updates (table should be visible)
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("should show utilization issues section", async ({ page }) => {
    // Check if utilization issues section is present
    await expect(page.getByText(/utilization issues/i)).toBeVisible();
  });

  test("should show general time distribution", async ({ page }) => {
    // Check if general time distribution section is present
    await expect(page.getByText(/general time distribution/i)).toBeVisible();
  });
});
