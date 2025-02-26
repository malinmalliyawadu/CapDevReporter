import { test, expect } from "@playwright/test";

test.describe("Holidays Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data/holidays");
  });

  test("should display the holidays page correctly", async ({ page }) => {
    // Check page title and header
    await expect(
      page.getByRole("heading", { name: "Public Holidays" })
    ).toBeVisible();
    await expect(
      page.getByText(
        "View and manage public holidays for Wellington, New Zealand."
      )
    ).toBeVisible();
  });

  test("should display the holidays table", async ({ page }) => {
    // Check table headers
    await expect(page.locator("th", { hasText: "Date" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Name" })).toBeVisible();

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

test.describe("Holidays Table", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data/holidays");
    await page.waitForSelector("table");
  });

  test("can sort by holiday name", async ({ page }) => {
    const sortButton = page.getByTestId("sort-button-name");
    const sortIcon = page.getByTestId("sort-icon-name");

    // Initially, sort icon should be hidden
    await expect(sortIcon).toHaveClass(/opacity-0/);

    // On hover, sort icon should be visible
    await sortButton.hover();
    await expect(sortIcon).toHaveClass(/group-hover:opacity-100/);

    // Click to sort ascending
    await sortButton.click();
    await expect(sortIcon).toHaveClass(/lucide-arrow-up/);

    // Click again to sort descending
    await sortButton.click();
    await expect(sortIcon).toHaveClass(/lucide-arrow-down/);
  });

  test("can sort by date", async ({ page }) => {
    const sortButton = page.getByTestId("sort-button-date");
    const sortIcon = page.getByTestId("sort-icon-date");

    // Initially, sort icon should be hidden
    await expect(sortIcon).toHaveClass(/opacity-0/);

    // On hover, sort icon should be visible
    await sortButton.hover();
    await expect(sortIcon).toHaveClass(/group-hover:opacity-100/);

    // Click to sort ascending
    await sortButton.click();
    await expect(sortIcon).toHaveClass(/lucide-arrow-up/);

    // Click again to sort descending
    await sortButton.click();
    await expect(sortIcon).toHaveClass(/lucide-arrow-down/);
  });

  test("can sort by type", async ({ page }) => {
    const sortButton = page.getByTestId("sort-button-type");
    const sortIcon = page.getByTestId("sort-icon-type");

    // Initially, sort icon should be hidden
    await expect(sortIcon).toHaveClass(/opacity-0/);

    // On hover, sort icon should be visible
    await sortButton.hover();
    await expect(sortIcon).toHaveClass(/group-hover:opacity-100/);

    // Click to sort ascending
    await sortButton.click();
    await expect(sortIcon).toHaveClass(/lucide-arrow-up/);

    // Click again to sort descending
    await sortButton.click();
    await expect(sortIcon).toHaveClass(/lucide-arrow-down/);
  });
});
