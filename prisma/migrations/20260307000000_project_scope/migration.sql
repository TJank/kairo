-- Add scope to Project to distinguish calendar vs task sections
-- Existing rows default to 'calendar' since all current projects were created via the calendar UI
ALTER TABLE "Project" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'calendar';
