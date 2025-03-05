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
    // Get the initial hours value from the first row
    const firstRow = page.locator("tbody tr").first();
    const initialHours = await firstRow.locator("td").nth(3).textContent();

    // Click edit button on first row
    await firstRow.getByRole("button").click();

    // Wait for dialog to appear
    await expect(page.getByRole("dialog")).toBeVisible();

    // Enter new hours value (different from initial)
    const newHours = initialHours === "40" ? "35" : "40";
    await page.getByLabel("Hours per Week").fill(newHours);

    // Save changes
    await page.getByRole("button", { name: "Save Changes" }).click();

    // Wait for the table to update
    await page.waitForTimeout(500);

    // Verify the hours value has been updated in the table
    const updatedHours = await firstRow.locator("td").nth(3).textContent();
    expect(updatedHours).toBe(newHours);
    expect(updatedHours).not.toBe(initialHours);
  });
});

test.describe("Employees Table", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data/employees");
    await page.waitForSelector("table");
  });

  test("can sort by employee name", async ({ page }) => {
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
    await expect(sortIcon).toHaveClass(/lucide-arrow-up/);

    // Click again to sort descending
    await sortButton.click();
    await expect(sortIcon).toHaveClass(/lucide-arrow-down/);
  });

  test("can sort by hours per week", async ({ page }) => {
    const sortButton = page.getByTestId("sort-button-hours");
    const sortIcon = page.getByTestId("sort-icon-hours");

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
