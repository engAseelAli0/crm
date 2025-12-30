-- Add the 'instructions' column to the 'complaint_types' table
ALTER TABLE complaint_types 
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Optional: Comment describing the column
COMMENT ON COLUMN complaint_types.instructions IS 'Instructions or hints displayed to the agent when selecting this complaint type';
