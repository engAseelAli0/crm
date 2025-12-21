-- FIX: Allow Public/Anon access to 'knowledge-base' bucket
-- Reason: The app uses custom auth tables, so Supabase Client is 'anon' for Storage.

-- Drop previous strict policies if they exist (ignore errors if they don't)
DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- 1. Public SELECT (Read)
CREATE POLICY "KB Public Select"
ON storage.objects FOR SELECT
USING ( bucket_id = 'knowledge-base' );

-- 2. Public INSERT (Upload)
-- WARNING: This allows unauthenticated uploads. Required for current app structure.
CREATE POLICY "KB Public Insert"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'knowledge-base' );

-- 3. Public UPDATE
CREATE POLICY "KB Public Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'knowledge-base' );

-- 4. Public DELETE
CREATE POLICY "KB Public Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'knowledge-base' );
