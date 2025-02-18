/*
  Warnings:

  - You are about to drop the column `teamId` on the `Employee` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "hoursPerWeek" INTEGER NOT NULL DEFAULT 40,
    "roleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("createdAt", "hoursPerWeek", "id", "name", "payrollId", "roleId", "updatedAt") SELECT "createdAt", "hoursPerWeek", "id", "name", "payrollId", "roleId", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_payrollId_key" ON "Employee"("payrollId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
