-- Consolidate dueAt + dueDate into single dueDate + dueAllDay pattern
-- If a task had dueAt (specific time), prefer that as the canonical dueDate
-- and set dueAllDay = false. Otherwise keep existing dueDate with dueAllDay = true.

-- Step 1: Add dueAllDay column with default true
ALTER TABLE "Task" ADD COLUMN "dueAllDay" BOOLEAN NOT NULL DEFAULT 1;

-- Step 2: For tasks that have dueAt, copy dueAt into dueDate and mark dueAllDay = false
UPDATE "Task" SET "dueDate" = "dueAt", "dueAllDay" = 0 WHERE "dueAt" IS NOT NULL;

-- Step 3: Drop the old dueAt column and its index
DROP INDEX IF EXISTS "Task_dueAt_idx";
ALTER TABLE "Task" DROP COLUMN "dueAt";
