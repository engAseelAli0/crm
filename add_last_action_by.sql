-- Add last_action_by column to complaints table to track who performed the last status change
ALTER TABLE public.complaints 
ADD COLUMN last_action_by UUID REFERENCES public.users(id);

-- Optional: Create an index for performance
CREATE INDEX idx_complaints_last_action_by ON public.complaints(last_action_by);
