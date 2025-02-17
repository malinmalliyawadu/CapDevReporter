-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimeType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isCapDev" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TimeType" ("createdAt", "description", "id", "name", "updatedAt") SELECT "createdAt", "description", "id", "name", "updatedAt" FROM "TimeType";
DROP TABLE "TimeType";
ALTER TABLE "new_TimeType" RENAME TO "TimeType";
CREATE UNIQUE INDEX "TimeType_name_key" ON "TimeType"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
