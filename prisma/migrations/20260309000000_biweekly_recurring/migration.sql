-- AlterTable: add biweekly flag to RecurringEvent
ALTER TABLE "RecurringEvent" ADD COLUMN "biweekly" BOOLEAN NOT NULL DEFAULT false;
