-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "category" TEXT NOT NULL DEFAULT 'PERSONAL',
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RecurringEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "category" TEXT NOT NULL DEFAULT 'WORK',
    "startDate" DATETIME NOT NULL,
    "daysOfWeek" TEXT NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "notes" TEXT,
    "category" TEXT NOT NULL DEFAULT 'PERSONAL',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "dueAt" DATETIME,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Event_startAt_idx" ON "Event"("startAt");

-- CreateIndex
CREATE INDEX "Task_dueAt_idx" ON "Task"("dueAt");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
