-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProjectActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jiraIssueId" TEXT NOT NULL,
    "activityDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectActivity_jiraIssueId_fkey" FOREIGN KEY ("jiraIssueId") REFERENCES "Project" ("jiraId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProjectActivity" ("activityDate", "createdAt", "id", "jiraIssueId", "updatedAt") SELECT "activityDate", "createdAt", "id", "jiraIssueId", "updatedAt" FROM "ProjectActivity";
DROP TABLE "ProjectActivity";
ALTER TABLE "new_ProjectActivity" RENAME TO "ProjectActivity";
CREATE INDEX "ProjectActivity_jiraIssueId_idx" ON "ProjectActivity"("jiraIssueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
