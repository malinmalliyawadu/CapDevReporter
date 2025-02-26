import { test, expect } from "@playwright/test";

test.describe("Reports Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reports");
  });

  test("should load reports page with filters and sections", async ({
    page,
  }) => {
    // Check page title - using more specific selector for the gradient title
    await expect(page.locator("h1", { hasText: "Time Reports" })).toBeVisible();
    await expect(
      page.getByText("View and analyze time tracking data.")
    ).toBeVisible();

    // Check if filters are present
    await expect(
      page.getByPlaceholder("Search by name or payroll ID...")
    ).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Team" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Role" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /date range/i })
    ).toBeVisible();

    // Check if main sections are present
    await expect(page.getByRole("table")).toBeVisible(); // Time Report Table
    await expect(page.getByText("Detailed Time Distribution")).toBeVisible(); // Time Distribution Charts
    await expect(page.getByText("Rolled Up Time Distribution")).toBeVisible(); // Time Distribution Charts
    await expect(page.getByText("Issues Summary")).toBeVisible(); // Utilization Issues section
  });

  test("should filter time reports using search", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search by name or payroll ID..."
    );

    // Enter search term
    await searchInput.fill("test");

    // Wait for table to update (table should remain visible)
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("should filter by team and role", async ({ page }) => {
    // Open team dropdown and select first team
    await page.getByRole("combobox", { name: "Team" }).click();
    await page.getByRole("option").first().click();

    // Open role dropdown and select first role
    await page.getByRole("combobox", { name: "Role" }).click();
    await page.getByRole("option").first().click();

    // Verify table updates
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("should filter by date range", async ({ page }) => {
    // Open date range picker
    await page.getByRole("button", { name: /date range/i }).click();

    // Select a preset date range (This Week)
    await page.getByRole("button", { name: "This Week" }).click();

    // Verify table updates
    await expect(page.getByRole("table")).toBeVisible();
  });
});
