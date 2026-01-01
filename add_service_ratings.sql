-- Migration: Add service rating columns to service_points table

ALTER TABLE service_points 
ADD COLUMN IF NOT EXISTS deposit_withdrawal text;

ALTER TABLE service_points 
ADD COLUMN IF NOT EXISTS registration_activation text;

-- Optional: Create index if filtering by quality is needed later
-- CREATE INDEX IF NOT EXISTS idx_service_points_deposit_rating ON service_points(deposit_withdrawal);
