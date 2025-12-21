-- Enable Realtime for Complaints Table
-- This is required for clients to receive INSERT/UPDATE/DELETE events

-- 1. Add table to publication
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;

-- 2. Set Replica Identity (Optional but recommended for full updates)
ALTER TABLE complaints REPLICA IDENTITY FULL;
