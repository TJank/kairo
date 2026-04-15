CREATE TABLE "RecurringEventException" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recurringEventId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    CONSTRAINT "RecurringEventException_recurringEventId_fkey"
        FOREIGN KEY ("recurringEventId") REFERENCES "RecurringEvent" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RecurringEventException_recurringEventId_date_key"
    ON "RecurringEventException"("recurringEventId", "date");

CREATE INDEX "RecurringEventException_recurringEventId_idx"
    ON "RecurringEventException"("recurringEventId");
