-- FORCE ENABLE FULL ACCESS (DEBUGGING ONLY)
-- This disables RLS temporarily to confirm if that is the blocker, 
-- OR sets a policy that allows everything.

-- Option 1: Disable RLS completely (Quickest test)
ALTER TABLE service_points DISABLE ROW LEVEL SECURITY;

-- OR

-- Option 2: If you must have RLS enabled, use this permissive policy:
-- ALTER TABLE service_points ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow All" ON service_points;
-- CREATE POLICY "Allow All" ON service_points FOR ALL USING (true) WITH CHECK (true);
