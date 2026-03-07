-- Drop the global unique index on key
DROP INDEX "Project_key_key";

-- Add composite unique index on (key, scope) so the same key can exist in different scopes
CREATE UNIQUE INDEX "Project_key_scope_key" ON "Project"("key", "scope");
