-- CreateTable
CREATE TABLE "GeneralTimeAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "timeTypeId" TEXT NOT NULL,
    "hoursPerWeek" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GeneralTimeAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GeneralTimeAssignment_timeTypeId_fkey" FOREIGN KEY ("timeTypeId") REFERENCES "TimeType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneralTimeAssignment_roleId_timeTypeId_key" ON "GeneralTimeAssignment"("roleId", "timeTypeId");
