import { test, expect, Page } from "@playwright/test";

// Helper function to wait for loading spinner to disappear
async function waitForLoadingSpinner(page: Page) {
  // Wait for the initial loading spinner to disappear
  await page.waitForSelector(".animate-spin", { state: "attached" });
  await page.waitForSelector("[data-testid=report-data-display]", {
    state: "attached",
  });
}

test.describe("Reports Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reports");
    await waitForLoadingSpinner(page);
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
    await waitForLoadingSpinner(page);

    // Wait for table to update (table should remain visible)
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("should filter by team and role", async ({ page }) => {
    // Open team dropdown and select first team
    await page.getByRole("combobox", { name: "Team" }).click();
    await page.getByRole("option").first().click();
    await waitForLoadingSpinner(page);

    // Open role dropdown and select first role
    await page.getByRole("combobox", { name: "Role" }).click();
    await page.getByRole("option").first().click();
    await waitForLoadingSpinner(page);

    // Verify table updates
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("should filter by date range", async ({ page }) => {
    // Open date range picker
    await page.getByRole("button", { name: /date range/i }).click();

    // Select a preset date range (This Week)
    await page.getByRole("button", { name: "This Week" }).click();
    await waitForLoadingSpinner(page);

    // Verify table updates
    await expect(page.getByRole("table")).toBeVisible();
  });
});

test.describe("Time Reports Table", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reports");
    await waitForLoadingSpinner(page);
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
    await waitForLoadingSpinner(page);
    await expect(sortIcon).toHaveClass(/lucide-arrow-up/);

    // Click again to sort descending
    await sortButton.click();
    await waitForLoadingSpinner(page);
    await expect(sortIcon).toHaveClass(/lucide-arrow-down/);
  });

  test("can sort by week", async ({ page }) => {
    const sortButton = page.getByTestId("sort-button-week");
    const sortIcon = page.getByTestId("sort-icon-week");

    // Initially, sort icon should be hidden
    await expect(sortIcon).toHaveClass(/opacity-0/);

    // On hover, sort icon should be visible
    await sortButton.hover();
    await expect(sortIcon).toHaveClass(/group-hover:opacity-100/);

    // Click to sort ascending
    await sortButton.click();
    await waitForLoadingSpinner(page);
    await expect(sortIcon).toHaveClass(/lucide-arrow-up/);

    // Click again to sort descending
    await sortButton.click();
    await waitForLoadingSpinner(page);
    await expect(sortIcon).toHaveClass(/lucide-arrow-down/);
  });

  test("can sort by payroll ID", async ({ page }) => {
    const sortButton = page.getByTestId("sort-button-payroll");
    const sortIcon = page.getByTestId("sort-icon-payroll");

    // Initially, sort icon should be hidden
    await expect(sortIcon).toHaveClass(/opacity-0/);

    // On hover, sort icon should be visible
    await sortButton.hover();
    await expect(sortIcon).toHaveClass(/group-hover:opacity-100/);

    // Click to sort ascending
    await sortButton.click();
    await waitForLoadingSpinner(page);
    await expect(sortIcon).toHaveClass(/lucide-arrow-up/);

    // Click again to sort descending
    await sortButton.click();
    await waitForLoadingSpinner(page);
    await expect(sortIcon).toHaveClass(/lucide-arrow-down/);
  });

  test("can sort by total hours", async ({ page }) => {
    const sortButton = page.getByTestId("sort-button-hours");
    const sortIcon = page.getByTestId("sort-icon-hours");

    // Initially, sort icon should be hidden
    await expect(sortIcon).toHaveClass(/opacity-0/);

    // On hover, sort icon should be visible
    await sortButton.hover();
    await expect(sortIcon).toHaveClass(/group-hover:opacity-100/);

    // Click to sort ascending
    await sortButton.click();
    await waitForLoadingSpinner(page);
    await expect(sortIcon).toHaveClass(/lucide-arrow-up/);

    // Click again to sort descending
    await sortButton.click();
    await waitForLoadingSpinner(page);
    await expect(sortIcon).toHaveClass(/lucide-arrow-down/);
  });

  test("can sort by team", async ({ page }) => {
    const sortButton = page.getByTestId("sort-button-team");
    const sortIcon = page.getByTestId("sort-icon-team");

    // Initially, sort icon should be hidden
    await expect(sortIcon).toHaveClass(/opacity-0/);

    // On hover, sort icon should be visible
    await sortButton.hover();
    await expect(sortIcon).toHaveClass(/group-hover:opacity-100/);

    // Click to sort ascending
    await sortButton.click();
    await waitForLoadingSpinner(page);
    await expect(sortIcon).toHaveClass(/lucide-arrow-up/);

    // Click again to sort descending
    await sortButton.click();
    await waitForLoadingSpinner(page);
    await expect(sortIcon).toHaveClass(/lucide-arrow-down/);
  });

  test("can sort by role", async ({ page }) => {
    const sortButton = page.getByTestId("sort-button-role");
    const sortIcon = page.getByTestId("sort-icon-role");

    // Initially, sort icon should be hidden
    await expect(sortIcon).toHaveClass(/opacity-0/);

    // On hover, sort icon should be visible
    await sortButton.hover();
    await expect(sortIcon).toHaveClass(/group-hover:opacity-100/);

    // Click to sort ascending
    await sortButton.click();
    await waitForLoadingSpinner(page);
    await expect(sortIcon).toHaveClass(/lucide-arrow-up/);

    // Click again to sort descending
    await sortButton.click();
    await waitForLoadingSpinner(page);
    await expect(sortIcon).toHaveClass(/lucide-arrow-down/);
  });
});
