-- Function to safely toggle maintenance mode using a secret key
-- This allows "AseelDev" (who has no DB user) to update the setting via RPC

CREATE OR REPLACE FUNCTION set_maintenance_mode(is_enabled BOOLEAN, secret_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
AS $$
BEGIN
    -- Validate Secret Key (Hardcoded to match AseelDev password)
    IF secret_key != '774030066' THEN
        RAISE EXCEPTION 'Invalid authorization key';
    END IF;

    -- Update the setting
    UPDATE app_settings
    SET value = jsonb_build_object('enabled', is_enabled, 'message', 'الموقع تحت الصيانة')
    WHERE key = 'maintenance_mode';

    -- If row doesn't exist, insert it
    IF NOT FOUND THEN
        INSERT INTO app_settings (key, value)
        VALUES ('maintenance_mode', jsonb_build_object('enabled', is_enabled, 'message', 'الموقع تحت الصيانة'));
    END IF;

    RETURN TRUE;
END;
$$;
