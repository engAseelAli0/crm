-- Run this in your Supabase SQL Editor to update the database table

-- 1. Add the new 'images' column
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 2. (Optional) Migrate existing image_url data to the new images array
UPDATE knowledge_base 
SET images = jsonb_build_array(image_url) 
WHERE image_url IS NOT NULL AND (images IS NULL OR jsonb_array_length(images) = 0);

-- Note: We are keeping 'image_url' for now to be safe, but the app will use 'images'.
