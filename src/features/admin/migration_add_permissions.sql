-- Add permissions column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT '{}';

-- Optional: Update existing users to have default permissions based on role
UPDATE users SET permissions = ARRAY['HANDLE_CALLS'] WHERE role = 'AGENT' AND permissions IS NULL;
UPDATE users SET permissions = ARRAY['VIEW_REPORTS', 'MANAGE_CATEGORIES', 'MANAGE_USERS', 'DELETE_CALL_LOGS', 'HANDLE_CALLS', 'MANAGE_COMPLAINTS'] WHERE role = 'ADMIN' AND permissions IS NULL;
