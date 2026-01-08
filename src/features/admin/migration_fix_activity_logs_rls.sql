-- Fix RLS Policy for Activity Logs (Since we are using custom auth, auth.uid() is null)

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert logs" ON public.activity_logs;

-- Create Open Policies (For Prototype/Custom Auth)
CREATE POLICY "Enable read access for all users" ON public.activity_logs
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert access for all users" ON public.activity_logs
    FOR INSERT
    WITH CHECK (true);

-- Optional: Enable update/delete if needed, but logs are usually append-only
