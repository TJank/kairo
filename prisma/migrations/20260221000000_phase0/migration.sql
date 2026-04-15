-- Phase 0: Schema & Foundation
-- Adds SectionType, Priority; new columns; RecurringEventDay junction table; SubTask model

-- Section: add type + color
ALTER TABLE "Section" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'NOTES';
ALTER TABLE "Section" ADD COLUMN "color" TEXT;

-- Item: add completedAt + dueDate
ALTER TABLE "Item" ADD COLUMN "completedAt" DATETIME;
ALTER TABLE "Item" ADD COLUMN "dueDate" DATETIME;

-- Task: add priority + completedAt
ALTER TABLE "Task" ADD COLUMN "priority" TEXT;
ALTER TABLE "Task" ADD COLUMN "completedAt" DATETIME;

-- Create RecurringEventDay junction table
CREATE TABLE "RecurringEventDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recurringEventId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    CONSTRAINT "RecurringEventDay_recurringEventId_fkey"
      FOREIGN KEY ("recurringEventId") REFERENCES "RecurringEvent" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "RecurringEventDay_recurringEventId_idx" ON "RecurringEventDay"("recurringEventId");

-- Migrate existing daysOfWeek data to RecurringEventDay rows
-- Standup (1,2,3,4,5)
INSERT INTO "RecurringEventDay" ("id","recurringEventId","day") VALUES
  ('red_standup1_1','cmloejw770001dpun4sqktdz2',1),
  ('red_standup1_2','cmloejw770001dpun4sqktdz2',2),
  ('red_standup1_3','cmloejw770001dpun4sqktdz2',3),
  ('red_standup1_4','cmloejw770001dpun4sqktdz2',4),
  ('red_standup1_5','cmloejw770001dpun4sqktdz2',5);

-- QA Chapter Monday
INSERT INTO "RecurringEventDay" ("id","recurringEventId","day") VALUES
  ('red_qachap_mon','cmlof0h9h0001dpfss1sip7r1',1);

-- QA Chapter Friday
INSERT INTO "RecurringEventDay" ("id","recurringEventId","day") VALUES
  ('red_qachap_fri','cmlof0ha60003dpfssbemrsq7',5);

-- Standup 2 (1,2,3,4,5)
INSERT INTO "RecurringEventDay" ("id","recurringEventId","day") VALUES
  ('red_standup2_1','cmlof0hav0005dpfsve7h1cuy',1),
  ('red_standup2_2','cmlof0hav0005dpfsve7h1cuy',2),
  ('red_standup2_3','cmlof0hav0005dpfsve7h1cuy',3),
  ('red_standup2_4','cmlof0hav0005dpfsve7h1cuy',4),
  ('red_standup2_5','cmlof0hav0005dpfsve7h1cuy',5);

-- UNC Charlotte Class (Mon, Wed)
INSERT INTO "RecurringEventDay" ("id","recurringEventId","day") VALUES
  ('red_unc_mon','cmlog9p720000dpaap8vyjdxt',1),
  ('red_unc_wed','cmlog9p720000dpaap8vyjdxt',3);

-- Playwright Framework Sync (1,2,3,4,5)
INSERT INTO "RecurringEventDay" ("id","recurringEventId","day") VALUES
  ('red_pw_1','cmlsgsypb0001dpqmv8l5f32g',1),
  ('red_pw_2','cmlsgsypb0001dpqmv8l5f32g',2),
  ('red_pw_3','cmlsgsypb0001dpqmv8l5f32g',3),
  ('red_pw_4','cmlsgsypb0001dpqmv8l5f32g',4),
  ('red_pw_5','cmlsgsypb0001dpqmv8l5f32g',5);

-- Remove old daysOfWeek column (SQLite 3.35+)
ALTER TABLE "RecurringEvent" DROP COLUMN "daysOfWeek";

-- Create SubTask table
CREATE TABLE "SubTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SubTask_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "Task" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SubTask_taskId_idx" ON "SubTask"("taskId");
