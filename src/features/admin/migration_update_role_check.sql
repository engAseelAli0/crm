-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with expanded roles
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'AGENT', 'EVALUATOR', 'SUPERVISOR'));
