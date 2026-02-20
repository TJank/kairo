-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "category" TEXT NOT NULL DEFAULT 'PERSONAL',
    "projectId" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("category", "createdAt", "endAt", "id", "notes", "startAt", "title", "updatedAt") SELECT "category", "createdAt", "endAt", "id", "notes", "startAt", "title", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_startAt_idx" ON "Event"("startAt");
CREATE INDEX "Event_projectId_idx" ON "Event"("projectId");
CREATE TABLE "new_RecurringEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "category" TEXT NOT NULL DEFAULT 'WORK',
    "projectId" TEXT,
    "startDate" DATETIME NOT NULL,
    "daysOfWeek" TEXT NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RecurringEvent" ("category", "createdAt", "daysOfWeek", "endMin", "id", "notes", "startDate", "startMin", "title", "updatedAt") SELECT "category", "createdAt", "daysOfWeek", "endMin", "id", "notes", "startDate", "startMin", "title", "updatedAt" FROM "RecurringEvent";
DROP TABLE "RecurringEvent";
ALTER TABLE "new_RecurringEvent" RENAME TO "RecurringEvent";
CREATE INDEX "RecurringEvent_projectId_idx" ON "RecurringEvent"("projectId");
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "notes" TEXT,
    "category" TEXT NOT NULL DEFAULT 'PERSONAL',
    "projectId" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "dueAt" DATETIME,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("category", "createdAt", "done", "dueAt", "dueDate", "id", "notes", "text", "updatedAt") SELECT "category", "createdAt", "done", "dueAt", "dueDate", "id", "notes", "text", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_dueAt_idx" ON "Task"("dueAt");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Project_key_key" ON "Project"("key");
