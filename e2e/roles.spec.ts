import { test, expect } from "@playwright/test";

test.describe("Roles Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the roles page
    await page.goto("/data/roles");
    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");
  });

  test("should display the roles page with correct header", async ({
    page,
  }) => {
    // Check if the page header is present with more specific selectors
    await expect(
      page.locator("span.bg-gradient-to-r", { hasText: "Roles" })
    ).toBeVisible();
    await expect(
      page.getByText("View and manage employee roles.", { exact: true })
    ).toBeVisible();
  });

  test("should display the roles table with correct columns", async ({
    page,
  }) => {
    // Wait for the table to be visible first
    await expect(page.locator("table")).toBeVisible();

    // Check if table headers are present
    await expect(page.locator("th", { hasText: "Role Name" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Employees" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Actions" })).toBeVisible();
  });

  test("should be able to add a new role", async ({ page }) => {
    // Click the "Add New Role" button
    await page.getByRole("button", { name: "Add New Role" }).click();

    // Wait for the dialog to appear
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Add New Role" })
    ).toBeVisible();

    // Type the new role name
    const newRoleName = "Test Role " + Math.random().toString(36).substring(7);
    await page.getByLabel("Role Name").fill(newRoleName);

    // Click the Add Role button
    await page.getByRole("button", { name: "Add Role" }).click();

    // Wait for the success toast using a more specific selector
    await expect(page.getByTestId("toast")).toContainText(
      "Role created successfully"
    );

    // Verify the new role appears in the table
    await expect(page.getByRole("cell", { name: newRoleName })).toBeVisible();
  });

  test("should show validation error for duplicate role name", async ({
    page,
  }) => {
    // First, add a role
    const roleName =
      "Duplicate Test Role " + Math.random().toString(36).substring(7);

    // Add first role
    await page.getByRole("button", { name: "Add New Role" }).click();
    await page.getByLabel("Role Name").fill(roleName);
    await page.getByRole("button", { name: "Add Role" }).click();
    await expect(page.getByTestId("toast")).toContainText(
      "Role created successfully"
    );

    // Try to add the same role again
    await page.getByRole("button", { name: "Add New Role" }).click();
    await page.getByLabel("Role Name").fill(roleName);
    await page.getByRole("button", { name: "Add Role" }).click();

    // Check for error message in toast
    await expect(page.getByTestId("toast")).toContainText(
      "Role already exists"
    );
  });

  test("should handle role deletion", async ({ page }) => {
    // First, add a new role
    const roleName =
      "Delete Test Role " + Math.random().toString(36).substring(7);

    // Add the role
    await page.getByRole("button", { name: "Add New Role" }).click();
    await page.getByLabel("Role Name").fill(roleName);
    await page.getByRole("button", { name: "Add Role" }).click();
    await expect(page.getByTestId("toast")).toContainText(
      "Role created successfully"
    );

    // Find and click the delete button for the role
    const roleRow = page.getByRole("row", { name: new RegExp(roleName) });
    await roleRow.getByRole("button", { name: "Delete" }).click();

    // Verify success message
    await expect(page.getByTestId("toast")).toContainText(
      "Role deleted successfully"
    );

    // Verify the role is no longer in the table
    await expect(page.getByRole("cell", { name: roleName })).not.toBeVisible();
  });
});
