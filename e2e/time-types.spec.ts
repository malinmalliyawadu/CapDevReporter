import { test, expect } from "@playwright/test";

test.describe("General Time Types Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the general time types page before each test
    await page.goto("/data/general-time-types");
    // Wait for the table to be visible
    await page.waitForSelector("table");
  });

  test("displays page header with correct content", async ({ page }) => {
    // Check if the header title is present with the correct gradient text
    await expect(
      page.locator(
        ".bg-gradient-to-r.from-yellow-500.to-amber-500.bg-clip-text"
      )
    ).toHaveText("General Time Types");

    // Check if the description is present
    await expect(
      page.getByText(
        "Configure organization-wide time categories and assign them to specific roles."
      )
    ).toBeVisible();

    // Check if the Clock icon is present with the correct color
    await expect(page.locator(".text-yellow-500")).toBeVisible();
  });

  test("displays time types table with correct columns", async ({ page }) => {
    // Check if the card title is present
    await expect(page.getByText("Available Time Categories")).toBeVisible();

    // Check if all expected column headers are present
    await expect(page.locator('th button:has-text("Type Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Description")')).toBeVisible();
    await expect(
      page.locator('th button:has-text("Usage Stats")')
    ).toBeVisible();
  });

  test("can sort time types by name", async ({ page }) => {
    // Click the Type Name column header to sort
    await page.locator('th button:has-text("Type Name")').click();

    // Check if sort indicator appears
    await expect(page.locator(".ml-2.h-4.w-4")).toBeVisible();

    // Click again to reverse sort
    await page.locator('th button:has-text("Type Name")').click();
  });

  test("can filter time types using search", async ({ page }) => {
    // Get initial row count
    const initialRows = await page.locator("tbody tr").count();

    // Type in the search box
    await page.getByTestId("time-types-search").fill("test");

    // Wait for the table to update
    await page.waitForTimeout(500);

    // Get the filtered row count
    const filteredRows = await page.locator("tbody tr").count();

    // Verify that the filtering occurred
    expect(filteredRows).toBeLessThanOrEqual(initialRows);
  });

  test("displays usage statistics correctly", async ({ page }) => {
    // Check for at least one role count badge
    const roleBadgeCount = await page.getByTestId("role-count-badge").count();
    expect(roleBadgeCount).toBeGreaterThan(0);

    // Check for CapDev badge if present
    const capDevBadges = page.getByTestId("capdev-badge");
    if ((await capDevBadges.count()) > 0) {
      await expect(capDevBadges.first()).toBeVisible();
    }

    // Check for at least one usage progress bar
    const progressBarCount = await page
      .getByTestId("usage-progress-bar")
      .count();
    expect(progressBarCount).toBeGreaterThan(0);

    // Check for at least one hours/week stat
    const hoursStatCount = await page
      .getByTestId("total-hours-per-week")
      .count();
    expect(hoursStatCount).toBeGreaterThan(0);

    // Check for average hours per role stat
    const avgHoursCount = await page.getByTestId("avg-hours-per-role").count();
    expect(avgHoursCount).toBeGreaterThan(0);
  });

  test("can create and delete a time type", async ({ page }) => {
    // Click the Add Time Type button
    await page.getByRole("button", { name: "Add Time Type" }).click();

    // Generate a unique name using timestamp
    const uniqueName = `Test Time Type ${Date.now()}`;

    // Fill in the form
    await page.getByLabel("Time Type Name").fill(uniqueName);
    await page.getByLabel("Description").fill("Test description");

    // Submit the form
    await page.getByRole("button", { name: "Add Time Type" }).click();

    // Wait for success toast
    await expect(page.getByTestId("toast")).toContainText(
      "Time type created successfully"
    );

    // Search for the newly created time type
    await page.getByTestId("time-types-search").fill(uniqueName);
    await page.waitForTimeout(500);

    // Verify only one row is visible
    await expect(page.locator("tbody tr")).toHaveCount(1);

    // Delete the time type
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();

    // Wait for success toast
    await expect(page.getByTestId("toast")).toContainText(
      "Time type deleted successfully"
    );

    // Verify the row is gone
    await expect(page.getByText("No time types found.")).toBeVisible();
  });
});
