-- Add closure_reason column to complaints table
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS closure_reason TEXT;

-- Ensure resolved_by column exists (it should, but just in case)
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id);
