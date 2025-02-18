/*
  Warnings:

  - Added the required column `teamId` to the `EmployeeAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmployeeAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "employeeId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmployeeAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EmployeeAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EmployeeAssignment" ("createdAt", "employeeId", "endDate", "id", "startDate", "updatedAt") SELECT "createdAt", "employeeId", "endDate", "id", "startDate", "updatedAt" FROM "EmployeeAssignment";
DROP TABLE "EmployeeAssignment";
ALTER TABLE "new_EmployeeAssignment" RENAME TO "EmployeeAssignment";
CREATE INDEX "EmployeeAssignment_employeeId_idx" ON "EmployeeAssignment"("employeeId");
CREATE INDEX "EmployeeAssignment_teamId_idx" ON "EmployeeAssignment"("teamId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
