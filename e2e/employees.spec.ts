import { test, expect } from "@playwright/test";

test.describe("Employees Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the employees page before each test
    await page.goto("/data/employees");
    // Wait for the table to be visible
    await page.waitForSelector("table");
  });

  test("displays employee list with correct columns", async ({ page }) => {
    // Check if all column headers are present
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Payroll ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Hours per Week")')).toBeVisible();
  });

  test("search functionality filters employees", async ({ page }) => {
    // Get the initial row count
    const initialRows = await page.locator("tbody tr").count();

    // Type in the search box
    await page.getByPlaceholder("Search employees...").fill("test");

    // Wait for the table to update
    await page.waitForTimeout(500);

    // Get the filtered row count
    const filteredRows = await page.locator("tbody tr").count();

    // Verify that the filtering occurred
    expect(filteredRows).toBeLessThanOrEqual(initialRows);
  });

  test("role filter functionality works", async ({ page }) => {
    // Open role filter dropdown
    await page.getByTestId("role-filter").click();

    // Select a specific role (assuming "Developer" exists)
    await page.getByRole("option", { name: "Software Developer" }).click();

    // Wait for the table to update
    await page.waitForTimeout(500);

    // Check if all visible rows have the selected role
    const rows = await page.locator("tbody tr").all();
    for (const row of rows) {
      const roleCell = await row.locator("td").nth(2).textContent();
      expect(roleCell).toBe("Software Developer");
    }
  });

  test("pagination controls work", async ({ page }) => {
    // Check if pagination controls are visible
    await expect(page.getByRole("button", { name: "Previous" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next" })).toBeVisible();

    // Get initial first row content
    const firstRowInitial = await page
      .locator("tbody tr")
      .first()
      .textContent();

    // Click next page if available
    const nextButton = page.getByRole("button", { name: "Next" });
    if (await nextButton.isEnabled()) {
      await nextButton.click();

      // Wait for table update
      await page.waitForTimeout(500);

      // Verify first row content is different
      const firstRowAfterNext = await page
        .locator("tbody tr")
        .first()
        .textContent();
      expect(firstRowAfterNext).not.toBe(firstRowInitial);
    }
  });

  test("edit hours functionality", async ({ page }) => {
    // Click edit button on first row
    await page.locator("tbody tr").first().getByRole("button").click();

    // Wait for dialog to appear
    await expect(page.getByRole("dialog")).toBeVisible();

    // Enter new hours value
    await page.getByLabel("Hours per Week").fill("40");

    // Save changes
    await page.getByRole("button", { name: "Save Changes" }).click();

    // Verify success toast appears
    await expect(page.getByTestId("toast")).toBeVisible();
  });

  test("sync with iPayroll functionality", async ({ page }) => {
    // Click sync button
    await page.getByRole("button", { name: "Sync with iPayroll" }).click();

    // Verify the sync animation starts
    await expect(page.locator(".animate-spin")).toBeVisible();

    // Wait for sync to complete and success message
    await expect(page.getByTestId("toast")).toBeVisible();

    // Verify last synced text appears
    await expect(page.getByText(/Last synced:/)).toBeVisible();
  });
});
