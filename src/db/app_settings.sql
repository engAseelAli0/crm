-- Create a table for application settings
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (so users know if maintenance is on)
CREATE POLICY "Public read access" ON app_settings FOR SELECT USING (true);

-- Allow update access only to Admins (or specifically AseelDev if we had ID, but Admin role is fine for now)
-- We will enforce AseelDev check in UI/API layer for the specific toggle.
CREATE POLICY "Admin update access" ON app_settings FOR UPDATE USING (
  exists (
    select 1 from public.users 
    where users.id = auth.uid() 
    and users.role = 'ADMIN'
  )
);

-- Insert default maintenance mode if not exists
INSERT INTO app_settings (key, value) VALUES ('maintenance_mode', '{"enabled": false, "message": "الموقع تحت الصيانة"}'::jsonb) ON CONFLICT DO NOTHING;
