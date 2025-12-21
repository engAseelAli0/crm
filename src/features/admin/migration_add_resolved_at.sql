-- Add resolved_at timestamp to complaints table
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
