import { test, expect } from "@playwright/test";

test.describe("Holidays Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data/holidays");
  });

  test("should display the holidays page correctly", async ({ page }) => {
    // Check page title and header
    await expect(page.getByRole("heading", { name: "Holidays" })).toBeVisible();
    await expect(
      page.getByText("View and manage public holidays.")
    ).toBeVisible();

    // Check for the party popper icon
    await expect(page.locator("svg.text-pink-500")).toBeVisible();
  });

  test("should display the holidays table", async ({ page }) => {
    // Check table headers
    await expect(page.locator("th", { hasText: "Date" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Holiday" })).toBeVisible();

    // Wait for the table to load and verify it contains data
    const rowCount = await page.getByRole("row").count();
    expect(rowCount).toBeGreaterThan(1);
  });

  test("should show public holidays", async ({ page }) => {
    // Verify some common NZ public holidays are present
    const commonHolidays = [
      "Christmas Day",
      "New Year's Day",
      "Waitangi Day",
      "ANZAC Day",
    ];

    for (const holiday of commonHolidays) {
      await expect(page.getByText(holiday, { exact: true })).toBeVisible();
    }
  });
});
