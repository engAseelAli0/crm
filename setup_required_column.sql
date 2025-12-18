-- Run this script in your Supabase SQL Editor to enable the "Required Field" feature

ALTER TABLE classifications ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT FALSE;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT FALSE;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT FALSE;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT FALSE;
