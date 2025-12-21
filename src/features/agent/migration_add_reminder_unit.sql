-- Add duration_unit column to reminders table
ALTER TABLE public.reminders 
ADD COLUMN IF NOT EXISTS duration_unit TEXT DEFAULT 'hours';
