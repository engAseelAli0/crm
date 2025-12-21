-- Create 'knowledge-base' bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-base', 'knowledge-base', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow Public Read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'knowledge-base' );

-- RLS Policy: Allow Authenticated Insert
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'knowledge-base' AND auth.role() = 'authenticated' );

-- RLS Policy: Allow Authenticated Update
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'knowledge-base' AND auth.role() = 'authenticated' );

-- RLS Policy: Allow Authenticated Delete
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'knowledge-base' AND auth.role() = 'authenticated' );
