import { test, expect } from "@playwright/test";

test.describe("Leave Table", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data/leave");
    await page.waitForSelector("table");
  });

  test("can sort by employee name", async ({ page }) => {
    const sortButton = page.getByTestId("sort-button-employee");
    const sortIcon = page.getByTestId("sort-icon-employee");

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

  test("can sort by duration", async ({ page }) => {
    const sortButton = page.getByTestId("sort-button-duration");
    const sortIcon = page.getByTestId("sort-icon-duration");

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
