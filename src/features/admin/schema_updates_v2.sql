-- Add sort_order column to all category tables for custom ordering
-- Run this in Supabase SQL Editor

ALTER TABLE classifications ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE account_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
