import { test, expect } from "@playwright/test";

test.describe("Projects Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the projects page
    await page.goto("/data/projects");
  });

  test("should display projects table and pagination", async ({ page }) => {
    // Check if the table is visible
    const table = await page.getByTestId("projects-table");
    await expect(table).toBeVisible();

    // Check pagination controls
    await expect(page.getByTestId("previous-page-button")).toBeVisible();
    await expect(page.getByTestId("next-page-button")).toBeVisible();
    await expect(page.getByTestId("current-page")).toBeVisible();
    await expect(page.getByTestId("total-pages")).toBeVisible();

    // Verify known projects from seed data are displayed
    const webAppRow = page.getByRole("cell", {
      name: "Web Application",
      exact: true,
    });
    const mobileAppRow = page.getByRole("cell", {
      name: "Mobile App",
      exact: true,
    });
    await expect(webAppRow).toBeVisible();
    await expect(mobileAppRow).toBeVisible();
  });

  test("should filter projects by search", async ({ page }) => {
    // Search for a known project
    const searchInput = page.getByTestId("projects-search-input");
    await searchInput.fill("Web Application");
    await page.waitForTimeout(500); // Wait for debounce

    // Verify only Web Application project is shown
    await expect(
      page.getByRole("cell", { name: "Web Application", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Mobile App", exact: true })
    ).not.toBeVisible();

    // Clear search
    await page.getByTestId("clear-search-button").click();
    await expect(searchInput).toHaveValue("");

    // Verify other projects are shown again
    await expect(
      page.getByRole("cell", { name: "Mobile App", exact: true })
    ).toBeVisible();
  });

  test("should filter projects by team", async ({ page }) => {
    // Open team filter
    const teamFilter = page.getByTestId("team-filter-select");
    await teamFilter.click();

    // Select Backend Team
    await page.getByRole("option", { name: "Backend Team" }).click();

    // Wait for table update
    await page.waitForTimeout(500);

    // Verify Backend Team projects are shown
    await expect(
      page.getByRole("cell", { name: "Microservices", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "API Development", exact: true })
    ).toBeVisible();
    // Frontend project should not be visible
    await expect(
      page.getByRole("cell", { name: "Mobile App", exact: true })
    ).not.toBeVisible();

    // Reset filter
    await teamFilter.click();
    await page.getByRole("option", { name: "All Teams" }).click();
  });

  test("should filter projects by type", async ({ page }) => {
    // Open type filter
    const typeFilter = page.getByTestId("type-filter-select");
    await typeFilter.click();

    // Select CapDev type
    await page.getByRole("option", { name: "CapDev", exact: true }).click();

    // Wait for table update
    await page.waitForTimeout(500);

    // Verify CapDev projects are shown
    await expect(
      page.getByRole("cell", { name: "Web Application", exact: true })
    ).toBeVisible();
    // Non-CapDev projects should not be visible
    await expect(
      page.getByRole("cell", { name: "System Maintenance", exact: true })
    ).not.toBeVisible();

    // Reset filter
    await typeFilter.click();
    await page.getByRole("option", { name: "All Types" }).click();
  });

  test("should handle project deletion", async ({ page }) => {
    // Find the Web Application project row
    const webAppRow = page
      .getByRole("cell", { name: "Web Application" })
      .first();
    await expect(webAppRow).toBeVisible();

    // Find and click its delete button (using the row's testid)
    const rowElement = webAppRow.locator("xpath=.."); // Get parent TR
    const projectId = await rowElement.getAttribute("data-testid");
    const deleteButton = page.getByTestId(
      `delete-project-${projectId?.replace("project-row-", "")}`
    );
    await deleteButton.click();

    // Verify delete confirmation dialog appears
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Web Application");

    // Cancel deletion to avoid modifying data
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("should handle Jira ID search", async ({ page }) => {
    // Search for known Jira ID
    const searchInput = page.getByTestId("projects-search-input");
    await searchInput.fill("jira:WEB-001");
    await page.waitForTimeout(500); // Wait for debounce

    // Verify only Web Application project is shown
    await expect(
      page.getByRole("cell", { name: "Web Application", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Mobile App", exact: true })
    ).not.toBeVisible();

    // Clear search
    await page.getByTestId("clear-search-button").click();
    await expect(searchInput).toHaveValue("");

    // Verify other projects are shown again
    await expect(
      page.getByRole("cell", { name: "Mobile App", exact: true })
    ).toBeVisible();
  });

  test("should handle pagination", async ({ page }) => {
    // Get initial page number
    const initialPage = await page.getByTestId("current-page").textContent();

    // Get total pages
    const totalPages = await page.getByTestId("total-pages").textContent();

    // Only test pagination if there are multiple pages
    if (Number(totalPages) > 1) {
      // Click next page
      await page.getByTestId("next-page-button").click();
      await expect(page.getByTestId("current-page")).not.toHaveText(
        initialPage!
      );

      // Click previous page
      await page.getByTestId("previous-page-button").click();
      await expect(page.getByTestId("current-page")).toHaveText(initialPage!);
    }
  });
});
