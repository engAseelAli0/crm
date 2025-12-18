-- Add reminder_logs column to store array of { agent_name, timestamp }
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS reminder_logs JSONB DEFAULT '[]'::jsonb;
