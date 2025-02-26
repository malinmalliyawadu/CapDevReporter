import { test, expect } from "@playwright/test";

test.describe("Teams Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the teams page before each test
    await page.goto("/data/teams");
  });

  test("displays Jira boards table with correct columns", async ({ page }) => {
    // Wait for any table to be visible
    await page.waitForSelector("table");

    // Get all tables and check if at least one has the correct columns
    const tables = page.locator("table");
    const tablesCount = await tables.count();

    let foundCorrectColumns = false;
    for (let i = 0; i < tablesCount; i++) {
      const table = tables.nth(i);
      const hasAllColumns = await Promise.all([
        table.locator('th:has-text("Board Name")').isVisible(),
        table.locator('th:has-text("Board ID")').isVisible(),
        table.locator('th:has-text("Actions")').isVisible(),
      ]).then((results) => results.every(Boolean));

      if (hasAllColumns) {
        foundCorrectColumns = true;
        break;
      }
    }

    expect(foundCorrectColumns).toBe(true);
  });

  test("can create a new team", async ({ page }) => {
    // Click the "Add Team" button
    await page.getByTestId("add-team-button").click();

    // Wait for the dialog to appear
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in the team details
    const testTeamName = `Test Team ${Date.now()}`;
    await page.getByLabel("Name").fill(testTeamName);
    await page.getByLabel("Description").fill("Test team description");

    // Submit the form
    await page.getByTestId("create-team-submit").click();

    // Verify the modal is closed
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Verify success toast appears
    await expect(page.getByTestId("toast")).toContainText(
      "Team created successfully"
    );

    // Verify the new team appears in the table
    await expect(page.getByText(testTeamName)).toBeVisible();
  });

  test("can add a Jira board to a team", async ({ page }) => {
    // Get the first team's ID from the edit button test ID
    const editButtonTestId = await page
      .locator('[data-testid^="edit-team-button-"]')
      .first()
      .getAttribute("data-testid");
    const teamId = editButtonTestId?.replace("edit-team-button-", "");

    // Click the "Add Board" button on the first team
    await page.getByTestId(`add-board-button-${teamId}`).click();

    // Wait for the dialog to appear
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in the board details
    const testBoardName = `Test Board ${Date.now()}`;
    await page.getByLabel("Name").fill(testBoardName);
    await page.getByLabel("Board ID").fill("12345");

    // Submit the form
    await page.getByTestId("add-board-submit").click();

    // Verify success toast appears
    await expect(page.getByTestId("toast")).toContainText(
      "Board added successfully"
    );

    // Verify the new board appears in the table
    await expect(page.getByText(testBoardName)).toBeVisible();
  });

  test("can edit a team", async ({ page }) => {
    // Get the first team's ID
    const editButtonTestId = await page
      .locator('[data-testid^="edit-team-button-"]')
      .first()
      .getAttribute("data-testid");
    const teamId = editButtonTestId?.replace("edit-team-button-", "");

    // Click the edit button on the first team
    await page.getByTestId(`edit-team-button-${teamId}`).click();

    // Wait for the dialog to appear
    await expect(page.getByRole("dialog")).toBeVisible();

    // Update the team details
    const updatedName = `Updated Team ${Date.now()}`;
    await page.getByLabel("Name").fill(updatedName);
    await page.getByLabel("Description").fill("Updated description");

    // Save changes
    await page.getByTestId("update-team-submit").click();

    // Verify success toast appears
    await expect(page.getByTestId("toast")).toContainText(
      "Team updated successfully"
    );

    // Verify the updated team name appears in the table
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test("can delete a team", async ({ page }) => {
    // First create a team to delete
    await page.getByTestId("add-team-button").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const testTeamName = `Test Team To Delete ${Date.now()}`;
    await page.getByLabel("Name").fill(testTeamName);
    await page.getByLabel("Description").fill("Team to be deleted");
    await page.getByTestId("create-team-submit").click();

    // Verify the modal is closed
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Wait for the team to appear and get its delete button
    await expect(page.getByText(testTeamName)).toBeVisible();

    // Click the delete button
    await page.getByTestId(`delete-team-button-${testTeamName}`).click();

    // Wait for the confirmation dialog
    await expect(page.getByRole("dialog")).toBeVisible();

    // Confirm deletion
    await page.getByTestId("confirm-delete-team").click();

    // Verify success toast appears
    await expect(page.getByTestId("toast")).toContainText(
      "Team deleted successfully"
    );

    // Verify the team is no longer visible
    await expect(page.getByText(testTeamName)).not.toBeVisible();
  });

  test("can delete a Jira board", async ({ page }) => {
    // First create a team
    await page.getByTestId("add-team-button").click();
    const testTeamName = `Test Team for Board ${Date.now()}`;
    await page.getByLabel("Name").fill(testTeamName);
    await page.getByLabel("Description").fill("Team for board deletion test");
    await page.getByTestId("create-team-submit").click();

    // Verify the modal is closed
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Wait for the team to appear and get its ID
    await expect(page.getByText(testTeamName)).toBeVisible();

    const addBoardButton = page.getByTestId(`add-board-button-${testTeamName}`);

    // Add a board to the team
    await addBoardButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const testBoardName = `Test Board To Delete ${Date.now()}`;
    await page.getByLabel("Name").fill(testBoardName);
    await page.getByLabel("Board ID").fill("12345");
    await page.getByTestId("add-board-submit").click();

    // Wait for the board to appear
    await expect(page.getByText(testBoardName)).toBeVisible();

    // Find and click the delete button for the board
    const deleteBoardButton = page.getByTestId(
      `delete-board-button-${testTeamName}-${testBoardName}`
    );

    await deleteBoardButton.click();

    // Wait for the confirmation dialog
    await expect(page.getByRole("dialog")).toBeVisible();

    // Confirm deletion
    await page.getByTestId("confirm-delete-board").click();

    // Verify success toast appears
    await expect(page.getByTestId("toast")).toContainText(
      "Board deleted successfully"
    );

    // Verify the board is no longer visible
    await expect(page.getByText(testBoardName)).not.toBeVisible();
  });
});
