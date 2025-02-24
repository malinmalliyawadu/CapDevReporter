/*
  Warnings:

  - You are about to drop the column `teamId` on the `Project` table. All the data in the column will be lost.
  - Added the required column `boardId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- First, create a temporary table to store project-board mappings
CREATE TABLE "_TempProjectBoard" (
    "projectId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL
);

-- Insert mappings based on project jiraId prefix matching board boardId
INSERT INTO "_TempProjectBoard" ("projectId", "boardId")
SELECT p.id, b.id
FROM "Project" p
JOIN "JiraBoard" b ON substr(p.jiraId, 1, instr(p.jiraId, '-') - 1) = b.boardId;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "jiraId" TEXT NOT NULL,
    "isCapDev" BOOLEAN NOT NULL DEFAULT false,
    "boardId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "JiraBoard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Insert data into new table using the temporary mappings
INSERT INTO "new_Project" ("id", "name", "description", "jiraId", "isCapDev", "boardId", "createdAt", "updatedAt")
SELECT p.id, p.name, p.description, p.jiraId, p.isCapDev, m.boardId, p.createdAt, p.updatedAt
FROM "Project" p
JOIN "_TempProjectBoard" m ON p.id = m.projectId;

-- Drop old tables
DROP TABLE "Project";
DROP TABLE "_TempProjectBoard";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_jiraId_key" ON "Project"("jiraId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
