-- Ensure RLS is enabled to be safe, but allow public read
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists to avoid conflict (or create robustly)
DROP POLICY IF EXISTS "Allow public read access on app_settings" ON app_settings;

-- Create policy allowing everyone to read settings (needed for maintenance check)
CREATE POLICY "Allow public read access on app_settings"
ON app_settings FOR SELECT
USING (true);

-- Add to realtime publication if not already added
-- Note: This command might error if already added in some Postgres versions, 
-- but on Supabase valid 'realtime' setup it ensures it's tracked.
-- We can wrap in a block or just execute it.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'app_settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;
  END IF;
END
$$;
